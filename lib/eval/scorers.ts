import { createScorer } from '@mastra/core/evals';
import { deepseek } from '@ai-sdk/deepseek';
import { z } from 'zod';

const outlineQualityScorer = createScorer({
  id: 'outlineQuality',
  description: '评估生成的大纲是否准确还原原文内容',
  judge: {
    model: deepseek('deepseek-chat'),
    instructions: `你是一位资深文学编辑，擅长评估同人小说大纲的质量。
你需要从三个维度对大纲进行评分（1-5分），并给出具体的改进建议。

评分标准：
1. 还原度：大纲是否准确覆盖了原文的所有关键事件？是否有遗漏或歪曲？
2. 连贯性：幕与幕之间的因果逻辑是否通顺？情节推进是否自然？
3. 完整性：是否有完整的起承转合？高潮是否突出？结局是否合理？`,
  },
});

const outlineAnalyzer = outlineQualityScorer.analyze({
  description: '分析大纲各维度的质量',
  outputSchema: z.object({
    dimensions: z.object({
      faithfulness: z.object({
        score: z.number().min(1).max(5),
        comment: z.string(),
      }),
      coherence: z.object({
        score: z.number().min(1).max(5),
        comment: z.string(),
      }),
      completeness: z.object({
        score: z.number().min(1).max(5),
        comment: z.string(),
      }),
    }),
    overallComment: z.string(),
  }),
  createPrompt: (ctx) => {
    const { run: { input, output } } = ctx as any;
    const hasStoryText = input?.storyText && input.storyText.length > 100;
    const contextBlock = hasStoryText
      ? `【原文内容】：
${input.storyText.slice(0, 3000)}`
      : `【原著背景】：${input?.fandom || '未知'}
【核心角色】：${input?.characters || '未知'}
【故事脑洞】：${input?.premise || '未知'}`;
    return `${contextBlock}

【生成的大纲】：
${JSON.stringify(output, null, 2)}

请从还原度、连贯性、完整性三个维度对以上大纲进行评分，并给出总体评价。
${hasStoryText ? '注意：还原度指大纲是否准确覆盖了原文的关键事件。' : '注意：还原度指大纲是否紧扣脑洞和角色设定，没有偏离。'}`;
  },
});

const outlineWithScore = outlineAnalyzer.generateScore({
  description: '综合评分',
  createPrompt: (ctx) => {
    const analysis = (ctx as any).results.analyzeStepResult;
    if (!analysis) {
      return '请根据你的分析给出1-5的综合评分，只输出数字。';
    }
    const { faithfulness, coherence, completeness } = analysis.dimensions;
    const avg = ((faithfulness.score + coherence.score + completeness.score) / 3).toFixed(1);
    return `基于以下分析：
- 还原度：${faithfulness.score}分 - ${faithfulness.comment}
- 连贯性：${coherence.score}分 - ${coherence.comment}
- 完整性：${completeness.score}分 - ${completeness.comment}

请给出1-5的综合评分（可以是小数），只输出数字。以上三个维度的平均分约为${avg}，请以此为参考。`;
  },
});

export const fullOutlineScorer = outlineWithScore;

const sceneQualityScorer = createScorer({
  id: 'sceneQuality',
  description: '评估生成的场景正文质量',
  judge: {
    model: deepseek('deepseek-chat'),
    instructions: `你是一位资深文学编辑，擅长评估同人小说场景正文的质量。
你需要从三个维度对场景正文进行评分（1-5分），并给出具体的改进建议。

评分标准：
1. 前文一致性：正文是否与前文保持角色状态、情节线索的一致性？
2. 大纲契合度：正文是否完成了大纲中规定的核心动作和情感转变？
3. 文笔质量：正文的文笔是否流畅自然？是否符合原著基调？`,
  },
});

const sceneAnalyzer = sceneQualityScorer.analyze({
  description: '分析场景正文各维度的质量',
  outputSchema: z.object({
    dimensions: z.object({
      consistency: z.object({
        score: z.number().min(1).max(5),
        comment: z.string(),
      }),
      outlineFit: z.object({
        score: z.number().min(1).max(5),
        comment: z.string(),
      }),
      proseQuality: z.object({
        score: z.number().min(1).max(5),
        comment: z.string(),
      }),
    }),
    overallComment: z.string(),
  }),
  createPrompt: (ctx) => {
    const { run: { input, output } } = ctx as any;
    const content = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    const loc = input?.sceneInfo?.location || '未知';
    const action = input?.sceneInfo?.plotAction || '未知';
    const conflict = input?.sceneInfo?.conflict || '未知';
    const shift = input?.sceneInfo?.emotionalShift || '未知';
    const ctxStr = `【原著背景】：${input?.fandom || '未知'}
【核心角色】：${input?.characters || '未知'}
【故事脑洞】：${input?.premise || '未知'}
【场景地点】：${loc}
【核心动作】：${action}
【主要冲突】：${conflict}
【情感转变】：${shift}`;
    return `${ctxStr}

【生成的场景正文】：
${content}

请从前文一致性、大纲契合度、文笔质量三个维度对以上场景正文进行评分，并给出总体评价。`;
  },
});

const sceneWithScore = sceneAnalyzer.generateScore({
  description: '综合评分',
  createPrompt: (ctx) => {
    const analysis = (ctx as any).results.analyzeStepResult;
    if (!analysis) {
      return '请根据你的分析给出1-5的综合评分，只输出数字。';
    }
    const { consistency, outlineFit, proseQuality } = analysis.dimensions;
    const avg = ((consistency.score + outlineFit.score + proseQuality.score) / 3).toFixed(1);
    return `基于以下分析：
- 前文一致性：${consistency.score}分 - ${consistency.comment}
- 大纲契合度：${outlineFit.score}分 - ${outlineFit.comment}
- 文笔质量：${proseQuality.score}分 - ${proseQuality.comment}

请给出1-5的综合评分（可以是小数），只输出数字。以上三个维度的平均分约为${avg}，请以此为参考。`;
  },
});

export const fullSceneScorer = sceneWithScore;

const trajectoryScorer = createScorer({
  id: 'agentTrajectory',
  description: '评估 Agent 的写作行为轨迹',
  judge: {
    model: deepseek('deepseek-chat'),
    instructions: `你是一位 AI Agent 行为审计专家，擅长评估 Agent 的写作流程是否合规。
你需要从三个维度对 Agent 的执行轨迹进行评分（1-5分），并给出具体的改进建议。

评分标准：
1. 工具调用合规：Agent 是否在写作前调用了 getPreviousScenes 查阅前文？
2. 上下文利用：前文信息是否被正确融入当前场景？
3. 指令遵循：Agent 是否遵守了所有写作要求（字数、风格、无废话等）？`,
  },
});

const trajectoryAnalyzer = trajectoryScorer.analyze({
  description: '分析 Agent 轨迹各维度的质量',
  outputSchema: z.object({
    dimensions: z.object({
      toolCompliance: z.object({
        score: z.number().min(1).max(5),
        comment: z.string(),
      }),
      contextUsage: z.object({
        score: z.number().min(1).max(5),
        comment: z.string(),
      }),
      instructionCompliance: z.object({
        score: z.number().min(1).max(5),
        comment: z.string(),
      }),
    }),
    overallComment: z.string(),
  }),
  createPrompt: (ctx) => {
    const { run: { output } } = ctx as any;
    return `【Agent 执行轨迹】：
${JSON.stringify(output, null, 2)}

请从工具调用合规、上下文利用、指令遵循三个维度对以上 Agent 执行轨迹进行评分，并给出总体评价。

注意：
- 如果轨迹中出现了 getPreviousScenes 工具调用，说明 Agent 正确遵循了流程
- 如果轨迹中只有 LLM 生成步骤而没有工具调用，说明 Agent 跳过了查阅前文的步骤，应扣分
- 检查生成的内容中是否包含废话（如"好的，以下是为你生成的..."），如果有则扣分`;
  },
});

const trajectoryWithScore = trajectoryAnalyzer.generateScore({
  description: '综合评分',
  createPrompt: (ctx) => {
    const analysis = (ctx as any).results.analyzeStepResult;
    if (!analysis) {
      return '请根据你的分析给出1-5的综合评分，只输出数字。';
    }
    const { toolCompliance, contextUsage, instructionCompliance } = analysis.dimensions;
    const avg = ((toolCompliance.score + contextUsage.score + instructionCompliance.score) / 3).toFixed(1);
    return `基于以下分析：
- 工具调用合规：${toolCompliance.score}分 - ${toolCompliance.comment}
- 上下文利用：${contextUsage.score}分 - ${contextUsage.comment}
- 指令遵循：${instructionCompliance.score}分 - ${instructionCompliance.comment}

请给出1-5的综合评分（可以是小数），只输出数字。以上三个维度的平均分约为${avg}，请以此为参考。`;
  },
});

export const fullTrajectoryScorer = trajectoryWithScore;