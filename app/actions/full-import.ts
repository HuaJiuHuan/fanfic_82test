'use server';

import { generateObject } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { db } from '@/lib/db';
import { projects, outlines, sceneDrafts } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import { StoryOutlineSchema } from '@/lib/schema';
import { SceneSplitSchema } from '@/lib/scene-split-schema';
import { AI_CONFIG } from '@/lib/ai-config';
import type { StoryOutline } from '@/lib/schema';

export async function fullImportAction(
  title: string,
  fandom: string,
  characters: string,
  premise: string,
  storyText: string,
) {
  try {
    // 1. 创建项目
    const projectId = crypto.randomUUID();
    await db.insert(projects).values({
      id: projectId,
      title,
      fandom,
      characters,
      premise,
    });

    // 2. AI 生成大纲（基于原文反推结构）
    const outlineResult = await generateObject({
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

    const outline = outlineResult.object as StoryOutline;

    // 3. 保存大纲到数据库
    const [insertedOutline] = await db.insert(outlines).values({
      projectId,
      content: outline,
    }).returning({ id: outlines.id });

    const outlineId = insertedOutline.id;

    // 3.5 设定为当前活跃大纲
    await db
      .update(projects)
      .set({ activeOutlineId: outlineId })
      .where(eq(projects.id, projectId));

    // 4. 收集所有场景 ID，用于原文拆分
    const allScenes = outline.acts.flatMap((act) =>
      act.scenes.map((scene) => ({
        sceneId: scene.id,
        sceneNumber: scene.sceneNumber,
        actTitle: act.actTitle,
        plotAction: scene.plotAction,
      }))
    );

    const sceneIdList = allScenes
      .map((s) => `- ${s.sceneId}：第${s.sceneNumber}场（${s.actTitle}），核心动作：${s.plotAction}`)
      .join('\n');

    // 5. AI 拆分原文到各场景
    const splitResult = await generateObject({
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

    // 6. 批量保存场景正文
    const segments = splitResult.object.segments;
    if (segments && segments.length > 0) {
      const draftValues = segments.map((seg) => ({
        projectId,
        outlineId,
        sceneId: seg.sceneId,
        content: seg.content,
        wordCount: seg.content.trim().length,
      }));

      await db.insert(sceneDrafts).values(draftValues);
    }

    return { success: true, projectId };
  } catch (error) {
    console.error('全量导入失败:', error);
    return { success: false, error: '导入过程中出现错误，请重试。' };
  }
}