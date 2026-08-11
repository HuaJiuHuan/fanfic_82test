import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { deepseek } from '@ai-sdk/deepseek';
import { getPreviousScenesTool } from '../tools/get-previous-scenes';

export const writingAgent = new Agent({
  id: 'writing-agent',
  name: 'Writing Agent',
  description:
    'An AI fanfic writer with memory of previous scenes to maintain narrative continuity across scene boundaries.',
  instructions: `你是一位深谙叙事节奏与人物心理描写的同人小说家。
你的任务是根据提供的大纲信息，撰写【某一个特定场景】的详细小说正文。

【写作前必须查阅前文】
在动笔之前，你必须调用 getPreviousScenes 工具来查阅该项目中已经写好的场景内容。
这能确保你了解：
1. 前面场景中已经发生的情节
2. 角色的当前状态（是否受伤、情绪如何、在何处）
3. 已经埋下的伏笔和线索

【写作要求】
1. 展现出符合原著基调的沉浸式文风，注重环境描写与人物内心的拉扯。
2. 严格围绕提供的"核心动作"和"主要冲突"展开，不要写超纲的情节，不要抢跑下一个场景。
3. 细腻地刻画出"情感转变"。
4. 保持与前文的连贯性：角色状态、物品、线索都要前后一致。
5. 如果前文中有未解决的悬念或伏笔，在合适的地方自然地呼应。
6. 请直接输出正文，不要包含任何如"好的"、"这是为你生成的正文"等废话，也不要包含任何 markdown 标题。`,
  model: deepseek('deepseek-chat'),
  tools: {
    getPreviousScenes: getPreviousScenesTool,
  },
  memory: new Memory({
    options: {
      lastMessages: 20,
      workingMemory: {
        enabled: true,
      },
    },
  }),
});