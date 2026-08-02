'use server';

import { db } from '@/lib/db';
import { outlines } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { StoryOutlineSchema } from '@/lib/schema';

export async function updateOutlineAction(id: string, newContent: unknown, projectId: string) {
  const parsed = StoryOutlineSchema.safeParse(newContent);
  if (!parsed.success) {
    return { success: false, error: '大纲数据格式不合法，请刷新页面后重试。' };
  }

  try {
    await db.update(outlines)
      .set({ content: parsed.data })
      .where(eq(outlines.id, id));

    revalidatePath(`/project/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('更新失败:', error);
    return { success: false, error: '保存修改失败' };
  }
}

export async function deleteOutlineAction(id: string, projectId: string) {
  try {
    await db.delete(outlines).where(eq(outlines.id, id));

    revalidatePath(`/project/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('删除失败:', error);
    return { success: false, error: '删除版本失败' };
  }
}