import { Workflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { generateObject } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { db } from '@/lib/db';
import { projects, outlines, sceneDrafts } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import { StoryOutlineSchema } from '@/lib/schema';
import { SceneSplitSchema } from '@/lib/scene-split-schema';
import { AI_CONFIG } from '@/lib/ai-config';
import { fullOutlineScorer } from '@/lib/eval/scorers';
import { runAndSaveEval } from '@/lib/eval/run-eval';

const createProjectStep = createStep({
  id: 'createProject',
  description: '在数据库中创建项目记录',
  inputSchema: z.object({
    title: z.string(),
    fandom: z.string(),
    characters: z.string(),
    premise: z.string(),
    storyText: z.string(),
  }),
  outputSchema: z.object({
    projectId: z.string(),
    title: z.string(),
    fandom: z.string(),
    characters: z.string(),
    premise: z.string(),
    storyText: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { title, fandom, characters, premise, storyText } = inputData;
    const projectId = crypto.randomUUID();
    await db.insert(projects).values({
      id: projectId,
      title,
      fandom,
      characters,
      premise,
    });
    return { projectId, title, fandom, characters, premise, storyText };
  },
});

const generateOutlineStep = createStep({
  id: 'generateOutline',
  description: 'AI 根据原文反推生成结构化大纲',
  inputSchema: z.object({
    projectId: z.string(),
    title: z.string(),
    fandom: z.string(),
    characters: z.string(),
    premise: z.string(),
    storyText: z.string(),
  }),
  outputSchema: z.object({
    projectId: z.string(),
    outline: z.any(),
    storyText: z.string(),
    fandom: z.string(),
    characters: z.string(),
    premise: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { projectId, fandom, characters, premise, storyText } = inputData;
    const result = await generateObject({
      model: deepseek('deepseek-chat'),
      schema: StoryOutlineSchema,
      system: `你是一位深谙叙事节奏的故事结构化分析师。你的任务是阅读一篇完整的短篇小说，
反向推导出它的叙事大纲结构。你需要将文章拆解为 3-4 幕，每幕包含若干场景。

重要规则：
1. 每个场景的 id 必须是纯英文+数字格式，如 "scene_1", "scene_2" 等
2. 场景的 plotAction 要准确概括该场景在原文中实际发生的事件
3. 场景的 emotionalShift 要反映该场景中角色的真实情绪变化
4. 标题（title）和一句话梗概（logline）要基于原文内容提炼
5. 角色弧光（characterArcs）要基于原文中实际出现的角色`,
      prompt: `【原著背景】：${fandom}
【核心角色】：${characters}
【故事梗概】：${premise}

【短篇小说全文】：
${storyText}

请根据以上全文，反向推导出这篇小说的结构化大纲。`,
      temperature: AI_CONFIG.temperature.outline,
    });

    return { projectId, outline: result.object, storyText, fandom, characters, premise };
  },
});

const saveOutlineStep = createStep({
  id: 'saveOutline',
  description: '将生成的大纲保存到数据库并设为活跃',
  inputSchema: z.object({
    projectId: z.string(),
    outline: z.any(),
    storyText: z.string(),
    fandom: z.string(),
    characters: z.string(),
    premise: z.string(),
  }),
  outputSchema: z.object({
    projectId: z.string(),
    outlineId: z.string(),
    outline: z.any(),
    storyText: z.string(),
    fandom: z.string(),
    characters: z.string(),
    premise: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { projectId, outline, storyText, fandom, characters, premise } = inputData;
    const [inserted] = await db
      .insert(outlines)
      .values({ projectId, content: outline })
      .returning({ id: outlines.id });

    await db
      .update(projects)
      .set({ activeOutlineId: inserted.id })
      .where(eq(projects.id, projectId));

    return { projectId, outlineId: inserted.id, outline, storyText, fandom, characters, premise };
  },
});

const evaluateOutlineStep = createStep({
  id: 'evaluateOutline',
  description: 'AI 评估大纲质量',
  inputSchema: z.object({
    projectId: z.string(),
    outlineId: z.string(),
    outline: z.any(),
    storyText: z.string(),
    fandom: z.string(),
    characters: z.string(),
    premise: z.string(),
  }),
  outputSchema: z.object({
    projectId: z.string(),
    outlineId: z.string(),
    outline: z.any(),
    storyText: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { projectId, outlineId, outline, storyText, fandom, characters, premise } = inputData;

    runAndSaveEval({
      scorer: fullOutlineScorer,
      projectId,
      targetType: 'outline',
      targetId: outlineId,
      input: { fandom, characters, premise, storyText: storyText.slice(0, 2000) },
      output: outline,
    }).catch((err) => console.error('大纲评估失败:', err));

    return { projectId, outlineId, outline, storyText };
  },
});

const splitTextToScenesStep = createStep({
  id: 'splitTextToScenes',
  description: 'AI 将原文按大纲场景拆分',
  inputSchema: z.object({
    projectId: z.string(),
    outlineId: z.string(),
    outline: z.any(),
    storyText: z.string(),
  }),
  outputSchema: z.object({
    projectId: z.string(),
    outlineId: z.string(),
    segments: z.any(),
  }),
  execute: async ({ inputData }) => {
    const { projectId, outlineId, outline, storyText } = inputData;
    const allScenes = outline.acts.flatMap(
      (act: { actTitle: string; scenes: { id: string; sceneNumber: number; plotAction: string }[] }) =>
        act.scenes.map((scene: { id: string; sceneNumber: number; plotAction: string }) => ({
          sceneId: scene.id,
          sceneNumber: scene.sceneNumber,
          actTitle: act.actTitle,
          plotAction: scene.plotAction,
        }))
    );

    const sceneIdList = allScenes
      .map(
        (s: { sceneId: string; sceneNumber: number; actTitle: string; plotAction: string }) =>
          `- ${s.sceneId}：第${s.sceneNumber}场（${s.actTitle}），核心动作：${s.plotAction}`
      )
      .join('\n');

    const result = await generateObject({
      model: deepseek('deepseek-chat'),
      schema: SceneSplitSchema,
      system: `你是一位细心的文本拆分专家。你的任务是将一篇完整的短篇小说，按照大纲中的场景划分，
将原文精确地拆分到各个场景中。

重要规则：
1. 每个场景的 content 必须是从原文中直接截取的段落，不要改写、不要总结
2. 确保整篇原文的每个段落都被分配到某个场景中，不要遗漏任何内容
3. 如果某个场景在原文中对应多个不连续的段落，请将它们合并到一个 content 中
4. 场景 ID 必须与下方提供的大纲场景 ID 完全一致`,
      prompt: `【短篇小说全文】：
${storyText}

【大纲场景列表】（请将原文拆分到以下场景）：
${sceneIdList}

请将原文按上述场景拆分，每个场景截取对应的原文段落。`,
      temperature: 0.3,
    });

    return { projectId, outlineId, segments: result.object.segments };
  },
});

const saveDraftsStep = createStep({
  id: 'saveDrafts',
  description: '批量保存场景正文到数据库',
  inputSchema: z.object({
    projectId: z.string(),
    outlineId: z.string(),
    segments: z.any(),
  }),
  outputSchema: z.object({
    projectId: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { projectId, outlineId, segments } = inputData;
    if (segments && segments.length > 0) {
      const draftValues = segments.map(
        (seg: { sceneId: string; content: string }) => ({
          projectId,
          outlineId,
          sceneId: seg.sceneId,
          content: seg.content,
          wordCount: seg.content.trim().length,
        })
      );

      await db.insert(sceneDrafts).values(draftValues);
    }

    return { projectId };
  },
});

export const fullImportWorkflow = new Workflow({
  id: 'fullImport',
  description: '全量导入流程：创建项目 → 生成大纲 → 保存大纲 → 拆分原文 → 保存场景',
  inputSchema: z.object({
    title: z.string(),
    fandom: z.string(),
    characters: z.string(),
    premise: z.string(),
    storyText: z.string(),
  }),
  outputSchema: z.object({
    projectId: z.string(),
  }),
  retryConfig: {
    attempts: 2,
    delay: 1000,
  },
})
  .then(createProjectStep)
  .then(generateOutlineStep)
  .then(saveOutlineStep)
  .then(evaluateOutlineStep)
  .then(splitTextToScenesStep)
  .then(saveDraftsStep)
  .commit();