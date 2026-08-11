'use server';

import { db } from '@/lib/db';
import { sceneDrafts } from '@/lib/db-schema';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// 获取某一大纲下的所有正文切片
export async function getDraftsByOutlineAction(projectId: string, outlineId: string) {
  return await db.select().from(sceneDrafts).where(
    and(eq(sceneDrafts.projectId, projectId), eq(sceneDrafts.outlineId, outlineId))
  );
}

// 保存场景正文（有则更新，无则插入）
export async function saveDraftAction(projectId: string, outlineId: string, sceneId: string, content: string) {
  try {
    // 检查是否已经存在该场景的正文
    const existing = await db.select().from(sceneDrafts).where(
      and(eq(sceneDrafts.outlineId, outlineId), eq(sceneDrafts.sceneId, sceneId))
    ).limit(1);

    const wordCount = content.trim().length;

    if (existing.length > 0) {
      // 存在则更新
      await db.update(sceneDrafts)
        .set({ content, wordCount, updatedAt: new Date() })
        .where(eq(sceneDrafts.id, existing[0].id));
    } else {
      // 不存在则插入
      await db.insert(sceneDrafts).values({
        projectId, outlineId, sceneId, content, wordCount
      });
    }

    return { success: true };
  } catch (error) {
    console.error("保存正文失败:", error);
    return { success: false, error: "自动保存失败" };
  }
}