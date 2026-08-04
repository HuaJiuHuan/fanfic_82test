'use server';

import { db } from '@/lib/db';
import { projects, outlines, sceneDrafts } from '@/lib/db-schema';
import { desc, eq, sql } from 'drizzle-orm';
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

  const result: ProjectWithStats[] = [];

  for (const proj of projectList) {
    let targetOutlineId = proj.activeOutlineId;

    if (!targetOutlineId) {
      const latestOutline = await db
        .select()
        .from(outlines)
        .where(eq(outlines.projectId, proj.id))
        .orderBy(desc(outlines.createdAt))
        .limit(1);
      if (latestOutline.length > 0) {
        targetOutlineId = latestOutline[0].id;
        await db
          .update(projects)
          .set({ activeOutlineId: targetOutlineId })
          .where(eq(projects.id, proj.id));
      }
    }

    if (!targetOutlineId) {
      result.push({
        ...proj,
        totalWords: 0,
        sceneCount: 0,
        hasContent: false,
      });
      continue;
    }

    const outline = await db
      .select()
      .from(outlines)
      .where(eq(outlines.id, targetOutlineId))
      .limit(1);

    if (outline.length === 0) {
      result.push({
        ...proj,
        totalWords: 0,
        sceneCount: 0,
        hasContent: false,
      });
      continue;
    }

    const outlineContent = outline[0].content as { acts?: { scenes?: { id?: string }[] }[] };

    const sceneIds = outlineContent?.acts
      ?.flatMap((act) => act.scenes?.map((s) => s.id).filter(Boolean) ?? [])
      ?? [];

    if (sceneIds.length === 0) {
      result.push({
        ...proj,
        totalWords: 0,
        sceneCount: 0,
        hasContent: false,
      });
      continue;
    }

    const drafts = await db
      .select()
      .from(sceneDrafts)
      .where(eq(sceneDrafts.outlineId, targetOutlineId));

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