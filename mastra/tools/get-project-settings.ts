import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { db } from '@/lib/db';
import { projects } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';

export const getProjectSettingsTool = createTool({
  id: 'getProjectSettings',
  description:
    '查询项目的全局设定：原著背景（fandom）、核心角色列表、故事脑洞（premise）。用于确认世界观边界和创作约束。',
  inputSchema: z.object({
    projectId: z.string().describe('项目ID'),
  }),
  execute: async ({ projectId }) => {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return { error: '项目不存在' };
    }

    return {
      projectId,
      fandom: project.fandom,
      characters: project.characters,
      premise: project.premise,
      title: project.title,
    };
  },
});