'use server';

import { mastra } from '@/mastra';
import { fullSceneScorer, fullTrajectoryScorer } from '@/lib/eval/scorers';
import { runAndSaveEval } from '@/lib/eval/run-eval';

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

    const sceneContent = result.text;

    const sceneInput = {
      fandom,
      characters,
      premise,
      sceneInfo: {
        location: sceneInfo.location,
        plotAction: sceneInfo.plotAction,
        conflict: sceneInfo.conflict,
        emotionalShift: sceneInfo.emotionalShift,
        wordCount: sceneInfo.wordCount,
        style: sceneInfo.style,
        customNote: sceneInfo.customNote,
      },
    };

    const trajectoryData = {
      steps: (result.steps ?? []).map((step) => ({
        stepType: 'model-generation' as const,
        name: step.text ? 'llm.generate' : 'llm.step',
        text: step.text,
        toolCalls: step.toolCalls?.map((tc) => ({
          toolName: tc.payload?.toolName,
          args: tc.payload?.args,
        })),
        toolResults: step.toolResults?.map((tr) => ({
          toolName: tr.payload?.toolName,
          result: tr.payload?.result,
        })),
        finishReason: step.finishReason,
        usage: step.usage,
      })),
    };

    runAndSaveEval({
      scorer: fullSceneScorer,
      projectId,
      targetType: 'scene',
      targetId: sceneInfo.sceneId,
      input: sceneInput,
      output: sceneContent,
    }).catch((err) => console.error('场景质量评估失败:', err));

    runAndSaveEval({
      scorer: fullTrajectoryScorer,
      projectId,
      targetType: 'agent_trajectory',
      targetId: sceneInfo.sceneId,
      input: { prompt: `场景 ${sceneInfo.sceneId} 的写作任务` },
      output: trajectoryData,
    }).catch((err) => console.error('Agent轨迹评估失败:', err));

    return { success: true, text: sceneContent };
  } catch (error) {
    console.error('生成场景正文失败:', error);
    return { success: false, error: '执笔过程中灵感中断，请重试。' };
  }
}