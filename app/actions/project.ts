'use server';

import { cache } from 'react';
import { db } from '@/lib/db';
import { projects, outlines, sceneDrafts } from '@/lib/db-schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function getProjects() {
  return await db.select().from(projects).orderBy(desc(projects.updatedAt));
}

export interface ProjectWithStats {
  id: string;
  title: string;
  fandom: string;
  characters: string;
  premise: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  totalWords: number;
  sceneCount: number;
  hasContent: boolean;
}

export const getProjectsWithStats = cache(async (): Promise<ProjectWithStats[]> => {
  const projectList = await db.select().from(projects).orderBy(desc(projects.updatedAt));

  if (projectList.length === 0) return [];

  const allProjectIds = projectList.map((p) => p.id);

  const allOutlines = await db
    .select()
    .from(outlines)
    .where(inArray(outlines.projectId, allProjectIds))
    .orderBy(desc(outlines.createdAt));

  const latestOutlineByProject = new Map<string, string>();
  const outlineMap = new Map<string, (typeof outlines.$inferSelect) & { content: { acts?: { scenes?: { id?: string }[] }[] } }>();
  for (const o of allOutlines) {
    if (!latestOutlineByProject.has(o.projectId)) {
      latestOutlineByProject.set(o.projectId, o.id);
    }
    outlineMap.set(o.id, o as any);
  }

  const allOutlineIds = allOutlines.map((o) => o.id);
  const draftsByOutline = new Map<string, (typeof sceneDrafts.$inferSelect)[]>();
  if (allOutlineIds.length > 0) {
    const allDrafts = await db
      .select()
      .from(sceneDrafts)
      .where(inArray(sceneDrafts.outlineId, allOutlineIds));
    for (const d of allDrafts) {
      const list = draftsByOutline.get(d.outlineId) || [];
      list.push(d);
      draftsByOutline.set(d.outlineId, list);
    }
  }

  const result: ProjectWithStats[] = [];

  for (const proj of projectList) {
    const outlineId = proj.activeOutlineId || latestOutlineByProject.get(proj.id) || null;

    if (!outlineId) {
      result.push({ ...proj, totalWords: 0, sceneCount: 0, hasContent: false });
      continue;
    }

    const outline = outlineMap.get(outlineId);
    if (!outline) {
      result.push({ ...proj, totalWords: 0, sceneCount: 0, hasContent: false });
      continue;
    }

    const outlineContent = outline.content as { acts?: { scenes?: { id?: string }[] }[] };
    const sceneIds = outlineContent?.acts
      ?.flatMap((act) => act.scenes?.map((s) => s.id).filter(Boolean) ?? [])
      ?? [];

    if (sceneIds.length === 0) {
      result.push({ ...proj, totalWords: 0, sceneCount: 0, hasContent: false });
      continue;
    }

    const drafts = draftsByOutline.get(outlineId) || [];
    const totalWords = drafts.reduce((sum, d) => sum + (d.wordCount || 0), 0);
    const filledScenes = drafts.filter((d) => d.content && d.content.trim().length > 0).length;

    result.push({
      ...proj,
      totalWords,
      sceneCount: sceneIds.length,
      hasContent: filledScenes > 0,
    });
  }

  return result;
});

export async function getProjectById(id: string) {
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0] || null;
}

export async function createProjectAction(formData: FormData) {
  const title = formData.get('title') as string;
  const fandom = formData.get('fandom') as string;
  const characters = formData.get('characters') as string;
  const premise = formData.get('premise') as string;

  const id = crypto.randomUUID();
  await db.insert(projects).values({ id, title, fandom, characters, premise });
  
  redirect(`/project/${id}`);
}

export async function deleteProjectAction(projectId: string) {
  try {
    await db.delete(projects).where(eq(projects.id, projectId));
    return { success: true };
  } catch (error) {
    console.error("销毁项目失败:", error);
    return { success: false, error: "项目销毁失败，请重试。" };
  }
}

export async function setActiveOutlineAction(projectId: string, outlineId: string) {
  try {
    await db
      .update(projects)
      .set({ activeOutlineId: outlineId, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    return { success: true };
  } catch (error) {
    console.error("切换大纲失败:", error);
    return { success: false, error: "切换大纲失败，请重试。" };
  }
}

export async function getOutlinesByProject(projectId: string) {
  return await db
    .select()
    .from(outlines)
    .where(eq(outlines.projectId, projectId))
    .orderBy(desc(outlines.createdAt));
}