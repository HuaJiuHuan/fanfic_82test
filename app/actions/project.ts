'use server';

import { db } from '@/lib/db';
import { projects } from '@/lib/db-schema';
import { desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function getProjects() {
  return await db.select().from(projects).orderBy(desc(projects.updatedAt));
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