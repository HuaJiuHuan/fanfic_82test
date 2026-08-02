'use server';

import { generateText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';

export async function generateSceneDraftAction(
  fandom: string,
  characters: string,
  premise: string,
  sceneInfo: {
    sceneNumber: number;
    location: string;
    plotAction: string;
    conflict: string;
    emotionalShift: string;
  }
) {
  try {
    const { text } = await generateText({
      model: deepseek('deepseek-chat'),
      system: `你是一位深谙叙事节奏与人物心理描写的同人小说家。
      你的任务是根据提供的大纲信息，撰写【某一个特定场景】的详细小说正文。
      
      【写作要求】：
      1. 展现出"Dark Academia"或符合原著基调的沉浸式文风，注重环境描写（Location）与人物内心的拉扯。
      2. 严格围绕提供的"核心动作（Plot Action）"和"主要冲突（Conflict）"展开，不要写超纲的情节，不要抢跑下一个场景。
      3. 细腻地刻画出"情感转变（Emotional Shift）"。
      4. 请直接输出正文，不要包含任何如"好的"、"这是为你生成的正文"等废话，也不要包含任何 markdown 标题。`,
      prompt: `
        【全局世界观】
        原著背景：${fandom}
        核心角色：${characters}
        故事脑洞：${premise}

        【当前需要撰写的场景任务】
        场景序号：第 ${sceneInfo.sceneNumber} 场
        发生地点：${sceneInfo.location}
        核心动作：${sceneInfo.plotAction}
        主要冲突：${sceneInfo.conflict}
        情感转变：${sceneInfo.emotionalShift}

        请开始撰写该场景的小说正文：
      `,
      temperature: 0.8,
    });

    return { success: true, text };
  } catch (error) {
    console.error("生成场景正文失败:", error);
    return { success: false, error: "执笔过程中灵感中断，请重试。" };
  }
}