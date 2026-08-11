'use server';

import { mastra } from '@/mastra';

export async function generateSceneDraftAction(
  projectId: string,
  fandom: string,
  characters: string,
  premise: string,
  sceneInfo: {
    sceneId: string;
    sceneNumber: number;
    location: string;
    plotAction: string;
    conflict: string;
    emotionalShift: string;
    wordCount?: number;
    style?: string;
    customNote?: string;
  }
) {
  try {
    const wordCountHint = sceneInfo.wordCount
      ? `【字数要求】：请将正文控制在约 ${sceneInfo.wordCount} 字左右。`
      : '';
    const styleHint = sceneInfo.style
      ? `【写作风格】：请严格采用「${sceneInfo.style}」的风格进行写作。`
      : '';
    const customNote = sceneInfo.customNote
      ? `【特殊要求】：${sceneInfo.customNote}`
      : '';

    const agent = mastra.getAgent('writingAgent');

    const result = await agent.generate(
      `
【全局世界观】
原著背景：${fandom}
核心角色：${characters}
故事脑洞：${premise}

【当前需要撰写的场景任务】
场景ID：${sceneInfo.sceneId}
场景序号：第 ${sceneInfo.sceneNumber} 场
发生地点：${sceneInfo.location}
核心动作：${sceneInfo.plotAction}
主要冲突：${sceneInfo.conflict}
情感转变：${sceneInfo.emotionalShift}
${wordCountHint}
${styleHint}
${customNote}

【重要】在动笔前，请先调用 getPreviousScenes 工具，传入 projectId="${projectId}" 和 currentSceneId="${sceneInfo.sceneId}"，查阅前文后再撰写。
      `,
      {
        memory: {
          thread: { id: `project-${projectId}`, resourceId: projectId },
          resource: projectId,
        },
      }
    );

    return { success: true, text: result.text };
  } catch (error) {
    console.error('生成场景正文失败:', error);
    return { success: false, error: '执笔过程中灵感中断，请重试。' };
  }
}