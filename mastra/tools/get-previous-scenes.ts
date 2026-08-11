import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sceneDrafts } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';

export const getPreviousScenesTool = createTool({
  id: 'getPreviousScenes',
  description:
    '查询该项目中已生成的所有场景内容，用于了解前文情节、角色状态和伏笔，确保新场景与已有内容保持连贯。',
  inputSchema: z.object({
    projectId: z.string().describe('项目ID'),
    currentSceneId: z.string().describe('当前正在生成的场景ID，该场景的内容不会被返回'),
  }),
  execute: async ({ projectId, currentSceneId }) => {
    const drafts = await db
      .select()
      .from(sceneDrafts)
      .where(eq(sceneDrafts.projectId, projectId));

    const previousScenes = drafts
      .filter((d) => d.sceneId !== currentSceneId && d.content.trim().length > 0)
      .map((d) => ({
        sceneId: d.sceneId,
        preview:
          d.content.length > 800
            ? d.content.substring(0, 800) + '...[内容过长，已截断]'
            : d.content,
      }));

    if (previousScenes.length === 0) {
      return {
        message: '这是第一个场景，暂无前文可供参考。请直接开始撰写。',
        scenes: [],
      };
    }

    return {
      message: `已找到 ${previousScenes.length} 个已写场景，请仔细阅读后确保新场景与这些内容保持连贯。`,
      scenes: previousScenes,
    };
  },
});