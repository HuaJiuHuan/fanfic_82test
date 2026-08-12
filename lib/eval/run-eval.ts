import { db } from '@/lib/db';
import { evaluations } from '@/lib/db-schema';

interface EvalResult {
  dimensions: Record<string, { score: number; comment: string }>;
  overallComment: string;
}

interface RunEvalParams {
  scorer: { id: string; run: (input: { input: unknown; output: unknown }) => Promise<{ score: number; analyzeStepResult?: EvalResult }> };
  projectId: string;
  targetType: 'outline' | 'scene' | 'agent_trajectory';
  targetId: string;
  input: unknown;
  output: unknown;
}

export async function runAndSaveEval({
  scorer,
  projectId,
  targetType,
  targetId,
  input,
  output,
}: RunEvalParams) {
  console.error(`[评估] 开始 ${scorer.id} (${targetType}:${targetId})`);
  console.error(`[评估] input 类型: ${typeof input}, 内容: ${JSON.stringify(input).slice(0, 200)}`);
  console.error(`[评估] output 类型: ${typeof output}, 内容: ${JSON.stringify(output).slice(0, 200)}`);

  if (!output || (typeof output === 'string' && output.trim() === '') || (typeof output === 'object' && Object.keys(output as object).length === 0)) {
    console.error(`[评估] 跳过 ${scorer.id}: output 为空`);
    return { success: false, error: 'output 为空，跳过评估' };
  }
  try {
    const result = await scorer.run({ input, output });

    const analyzeResult = result.analyzeStepResult;
    const score = result.score;

    const evalResult = {
      scorerId: scorer.id,
      score,
      dimensions: analyzeResult?.dimensions ?? {},
      overallComment: analyzeResult?.overallComment ?? '',
    };

    await db
      .insert(evaluations)
      .values({
        projectId,
        targetType,
        targetId,
        score,
        result: evalResult,
      })
      .onConflictDoUpdate({
        target: [evaluations.projectId, evaluations.targetType, evaluations.targetId],
        set: {
          score,
          result: evalResult,
          createdAt: new Date(),
        },
      });

    console.error(`[评估] 完成 ${scorer.id}: 得分 ${score}`);
    return { success: true, score, evalResult };
  } catch (error) {
    console.error(`[评估] 失败 (${scorer.id}):`, error);
    return { success: false, error: String(error) };
  }
}