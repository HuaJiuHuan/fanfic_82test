import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { db } from '@/lib/db';
import { outlines, sceneDrafts } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';

export const getCharacterArcsTool = createTool({
  id: 'getCharacterArcs',
  description:
    '查询大纲中所有角色的弧光设定（核心动机、弧光描述），并结合所有已写场景推断每个角色的当前状态（受伤、情绪、位置、关键物品）。',
  inputSchema: z.object({
    projectId: z.string().describe('项目ID'),
  }),
  execute: async ({ projectId }) => {
    const [outline] = await db
      .select()
      .from(outlines)
      .where(eq(outlines.projectId, projectId))
      .orderBy(outlines.version);

    const data = outline?.content as any;
    const characterArcs = data?.characterArcs ?? [];

    const drafts = await db
      .select()
      .from(sceneDrafts)
      .where(eq(sceneDrafts.projectId, projectId));

    const characterStates: Record<string, any> = {};

    for (const arc of characterArcs) {
      const name = arc.name;
      const appearances = drafts
        .filter((d) => d.content.includes(name) && d.content.trim().length > 0)
        .sort((a, b) => a.createdAt!.getTime() - b.createdAt!.getTime());

      characterStates[name] = {
        coreMotivation: arc.coreMotivation ?? '未设定',
        totalAppearances: appearances.length,
        lastAppearance: appearances.length > 0
          ? {
              sceneId: appearances[appearances.length - 1].sceneId,
              snippet: appearances[appearances.length - 1].content
                .substring(0, 600)
                .replace(/\n/g, ' '),
            }
          : null,
      };
    }

    return {
      projectId,
      characterCount: characterArcs.length,
      characters: characterStates,
      summary:
        characterArcs.length > 0
          ? `已加载 ${characterArcs.length} 个角色的弧光设定和状态追踪。`
          : '该项目暂无角色弧光设定。',
    };
  },
});