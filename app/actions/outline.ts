'use server';

import { db } from '@/lib/db';
import { outlines } from '@/lib/db-schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// 更新大纲内容
export async function updateOutlineAction(id: string, newContent: any, projectId: string) {
  try {
    await db.update(outlines)
      .set({ content: newContent })
      .where(eq(outlines.id, id));
    
    // 刷新项目页面的缓存
    revalidatePath(`/project/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("更新失败:", error);
    return { success: false, error: "保存修改失败" };
  }
}

// 删除指定大纲版本
export async function deleteOutlineAction(id: string, projectId: string) {
  try {
    await db.delete(outlines).where(eq(outlines.id, id));
    
    // 刷新项目页面的缓存
    revalidatePath(`/project/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error("删除失败:", error);
    return { success: false, error: "删除版本失败" };
  }
}