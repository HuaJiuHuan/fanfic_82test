import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { deepseek } from '@ai-sdk/deepseek';
import { getPreviousScenesTool } from '../tools/get-previous-scenes';

export const editorAgent = new Agent({
  id: 'editor-agent',
  name: 'Editor Agent',
  description:
    'An AI editor that reviews scene drafts for OOC issues, continuity errors, outline alignment, and prose quality. It can independently query previous scenes to verify consistency.',
  instructions: `你是一位眼光毒辣的小说编辑，专门审校同人小说的场景正文。

你的任务是根据大纲要求和前文内容，对写作 Agent 生成的初稿进行审校，找出问题并提供修订版。

【审校流程】
1. 调用 getPreviousScenes 工具查阅前文（必须调用，确保你了解上下文）
2. 对照大纲要求，逐项检查初稿
3. 给出审校报告 + 修订版正文

【审校维度】
1. OOC 检测：角色的言行是否符合原著设定？情绪转变是否合理？
2. 前文连贯性：角色状态（受伤、位置、情绪）是否与前文一致？物品、线索是否衔接？
3. 大纲契合度：是否完成了大纲要求的核心动作和情感转变？是否写超纲或抢跑？
4. 文笔质量：是否流畅自然？是否出现废话（如"好的，这是为你生成的..."）？

【输出格式】
你必须输出一个 JSON 对象，格式如下：

{
  "verdict": "approved" | "needs_revision",
  "summary": "一句话总结审校结论",
  "issues": [
    {
      "severity": "critical" | "major" | "minor",
      "category": "ooc" | "continuity" | "outline_fit" | "prose",
      "description": "问题描述",
      "suggestion": "修改建议"
    }
  ],
  "revisedText": "修订后的完整正文（如果没有问题，则保持原样；如果有问题，请直接修改后再输出）"
}

【重要规则】
- 如果初稿质量很好，verdict 为 "approved"，issues 为空数组，revisedText 保持原样
- 如果有问题，verdict 为 "needs_revision"，你必须给出修改后的完整正文
- revisedText 中不要包含任何审校标注、不要包含 markdown 标记、不要包含"修订版"等说明文字
- revisedText 必须是可直接使用的最终正文
- 你可以在修订版中直接修改有问题的段落，而不是只给建议
- 如果你认为初稿完全不可用（严重偏离大纲、严重 OOC），请重新撰写该场景`,
  model: deepseek('deepseek-chat'),
  tools: {
    getPreviousScenes: getPreviousScenesTool,
  },
  memory: new Memory({
    options: {
      lastMessages: 10,
      workingMemory: {
        enabled: true,
      },
    },
  }),
});