'use server';

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

export async function getProjectsWithStats(): Promise<ProjectWithStats[]> {
  const projectList = await db.select().from(projects).orderBy(desc(projects.updatedAt));

  if (projectList.length === 0) return [];

  const projectsWithoutOutline = projectList.filter((p) => !p.activeOutlineId);
  const outlineUpdatableIds = projectsWithoutOutline.map((p) => p.id);

  if (outlineUpdatableIds.length > 0) {
    const allOutlines = await db
      .select()
      .from(outlines)
      .where(inArray(outlines.projectId, outlineUpdatableIds))
      .orderBy(desc(outlines.createdAt));

    const latestByProject = new Map<string, string>();
    for (const o of allOutlines) {
      if (!latestByProject.has(o.projectId)) {
        latestByProject.set(o.projectId, o.id);
      }
    }

    for (const proj of projectsWithoutOutline) {
      const outlineId = latestByProject.get(proj.id);
      if (outlineId) {
        (proj as { activeOutlineId: string }).activeOutlineId = outlineId;
      }
    }

    const updates = Array.from(latestByProject.entries())
      .filter(([projectId]) => projectsWithoutOutline.some((p) => p.id === projectId))
      .map(([projectId, outlineId]) =>
        db.update(projects).set({ activeOutlineId: outlineId }).where(eq(projects.id, projectId)),
      );

    if (updates.length > 0) {
      await Promise.all(updates);
    }
  }

  const outlineIds = projectList
    .map((p) => p.activeOutlineId)
    .filter((id): id is string => id !== null && id !== undefined);

  const outlineMap = new Map<string, (typeof outlines.$inferSelect) & { content: { acts?: { scenes?: { id?: string }[] }[] } }>();
  if (outlineIds.length > 0) {
    const allOutlines = await db
      .select()
      .from(outlines)
      .where(inArray(outlines.id, outlineIds));
    for (const o of allOutlines) {
      outlineMap.set(o.id, o as any);
    }
  }

  const draftsByOutline = new Map<string, (typeof sceneDrafts.$inferSelect)[]>();
  if (outlineIds.length > 0) {
    const allDrafts = await db
      .select()
      .from(sceneDrafts)
      .where(inArray(sceneDrafts.outlineId, outlineIds));
    for (const d of allDrafts) {
      const list = draftsByOutline.get(d.outlineId) || [];
      list.push(d);
      draftsByOutline.set(d.outlineId, list);
    }
  }

  const result: ProjectWithStats[] = [];

  for (const proj of projectList) {
    const outlineId = proj.activeOutlineId;

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
}

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