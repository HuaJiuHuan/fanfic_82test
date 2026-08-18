import { mastra } from '@/mastra';

interface EditorReview {
  verdict: 'approved' | 'needs_revision';
  summary: string;
  issues: Array<{
    severity: 'critical' | 'major' | 'minor';
    category: 'ooc' | 'continuity' | 'outline_fit' | 'prose';
    description: string;
    suggestion: string;
  }>;
  revisedText: string;
}

function parseEditorOutput(raw: string): EditorReview | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as EditorReview;
  } catch {
    return null;
  }
}

function buildWritingPrompt(params: {
  settingBrief: string;
  fandom: string;
  characters: string;
  premise: string;
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
  };
  projectId: string;
}) {
  const { settingBrief, fandom, characters, premise, sceneInfo, projectId } = params;
  const wordCountHint = sceneInfo.wordCount
    ? `【字数要求】：请将正文控制在约 ${sceneInfo.wordCount} 字左右。`
    : '';
  const styleHint = sceneInfo.style
    ? `【写作风格】：请严格采用「${sceneInfo.style}」的风格进行写作。`
    : '';
  const customNote = sceneInfo.customNote
    ? `【特殊要求】：${sceneInfo.customNote}`
    : '';

  return `
【设定简报】—— 由设定 Agent 生成，请严格遵循其中的角色状态和世界观约束
${settingBrief}

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
  `;
}

function buildEditingPrompt(params: {
  settingBrief: string;
  fandom: string;
  characters: string;
  premise: string;
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
  };
  draftText: string;
  projectId: string;
}) {
  const { settingBrief, fandom, characters, premise, sceneInfo, draftText, projectId } = params;
  const wordCountHint = sceneInfo.wordCount
    ? `【字数要求】：请将正文控制在约 ${sceneInfo.wordCount} 字左右。`
    : '';
  const styleHint = sceneInfo.style
    ? `【写作风格】：请严格采用「${sceneInfo.style}」的风格进行写作。`
    : '';
  const customNote = sceneInfo.customNote
    ? `【特殊要求】：${sceneInfo.customNote}`
    : '';

  return `
【设定简报】—— 审校时请对照此简报检查角色状态是否一致
${settingBrief}

【全局世界观】
原著背景：${fandom}
核心角色：${characters}
故事脑洞：${premise}

【场景任务要求】
场景ID：${sceneInfo.sceneId}
场景序号：第 ${sceneInfo.sceneNumber} 场
发生地点：${sceneInfo.location}
核心动作：${sceneInfo.plotAction}
主要冲突：${sceneInfo.conflict}
情感转变：${sceneInfo.emotionalShift}
${wordCountHint}
${styleHint}
${customNote}

【写作Agent生成的初稿】
${draftText}

【审校任务】
请审校以上初稿。在审校前，务必先调用 getPreviousScenes 工具，传入 projectId="${projectId}" 和 currentSceneId="${sceneInfo.sceneId}"，查阅前文后对照检查。
  `;
}

export async function POST(req: Request) {
  const { projectId, fandom, characters, premise, sceneInfo } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ phase: 'setting', status: 'generating' });
        const settingAgent = mastra.getAgent('settingAgent');
        const settingResult = await settingAgent.generate(
          `请为以下场景生成设定简报：\n项目ID：${projectId}\n当前场景ID：${sceneInfo.sceneId}\n当前场景序号：第 ${sceneInfo.sceneNumber} 场`,
          {
            memory: {
              thread: { id: `setting-project-${projectId}`, resourceId: projectId },
              resource: projectId,
            },
          }
        );
        const settingBrief = settingResult.text;
        send({ phase: 'setting', status: 'done' });

        send({ phase: 'writing', status: 'streaming' });
        const writingAgent = mastra.getAgent('writingAgent');
        const writeStream = await writingAgent.stream(
          buildWritingPrompt({ settingBrief, fandom, characters, premise, sceneInfo, projectId }),
          {
            memory: {
              thread: { id: `project-${projectId}`, resourceId: projectId },
              resource: projectId,
            },
          }
        );

        let draftText = '';
        for await (const chunk of writeStream.textStream) {
          draftText += chunk;
          send({ phase: 'writing', chunk, accumulated: draftText });
        }
        send({ phase: 'writing', status: 'done' });

        send({ phase: 'editing', status: 'streaming' });
        const editorAgent = mastra.getAgent('editorAgent');
        const editStream = await editorAgent.stream(
          buildEditingPrompt({ settingBrief, fandom, characters, premise, sceneInfo, draftText, projectId }),
          {
            memory: {
              thread: { id: `editor-project-${projectId}`, resourceId: projectId },
              resource: projectId,
            },
          }
        );

        let editorRaw = '';
        for await (const chunk of editStream.textStream) {
          editorRaw += chunk;
          send({ phase: 'editing', chunk, accumulated: editorRaw });
        }
        send({ phase: 'editing', status: 'done' });

        const review = parseEditorOutput(editorRaw);
        const finalText = review?.revisedText || draftText;

        send({
          phase: 'complete',
          finalText,
          editorReview: review
            ? { verdict: review.verdict, summary: review.summary, issues: review.issues }
            : null,
        });
      } catch (error) {
        send({ phase: 'error', message: error instanceof Error ? error.message : '未知错误' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}