'use server';

import { generateObject } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { db } from '@/lib/db';
import { outlines } from '@/lib/db-schema';
import { StoryOutlineSchema } from '@/lib/schema';
import { AI_CONFIG } from '@/lib/ai-config';

export async function generateOutlineAction(
  projectId: string, 
  fandom: string, 
  characters: string, 
  premise: string
) {
  try {
    const { object } = await generateObject({
      model: deepseek('deepseek-chat'),
      schema: StoryOutlineSchema,
      system: `你是一个深谙叙事节奏与戏剧张力的同人小说大纲策划师。
      你的任务是根据用户提供的原著背景（Fandom）、登场角色和核心脑洞（Premise），
      推演并生成一个逻辑严密、不 OOC 且跌宕起伏的短篇小说大纲。
      必须严格遵守 JSON 结构输出。`,
      prompt: `原著背景：${fandom}\n主要角色：${characters}\n用户核心脑洞：${premise}`,
      temperature: AI_CONFIG.temperature.outline, 
    });

    const [insertedOutline] = await db.insert(outlines).values({
      projectId,
      content: object,
    }).returning({ id: outlines.id });

    return { success: true, data: object, outlineId: insertedOutline.id };
  } catch (error) {
    console.error("生成大纲失败:", error);
    return { success: false, error: "系统思考时发生错误，请重试。" };
  }
}