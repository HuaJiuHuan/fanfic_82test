'use server';

import { generateObject } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { StoryExtractionSchema } from '@/lib/story-extraction-schema';
import { AI_CONFIG } from '@/lib/ai-config';

export async function extractStoryInfoAction(storyText: string) {
  if (!storyText || storyText.trim().length < 50) {
    return { success: false, error: '文本太短了，请至少输入 50 字以上的小说片段。' };
  }

  try {
    const { object } = await generateObject({
      model: deepseek('deepseek-chat'),
      schema: StoryExtractionSchema,
      system: `你是一位资深的小说编辑，擅长快速阅读并提取小说的核心信息。
      你的任务是根据用户提供的短篇小说正文，提取出以下关键信息：
      1. 标题：为这篇小说取一个合适的标题
      2. 原著/世界观：推测这篇小说所属的虚构宇宙（如果是原创请标注"原创"）
      3. 核心角色：文中出现的主要角色名称
      4. 脑洞总结：用一句话概括这篇小说的核心创意和故事主线
      
      请严格遵循 JSON 格式输出。`,
      prompt: `请分析以下短篇小说正文，提取关键信息：\n\n${storyText}`,
      temperature: AI_CONFIG.temperature.outline,
    });

    return { success: true, data: object };
  } catch (error) {
    console.error('提取小说信息失败:', error);
    return { success: false, error: 'AI 解析过程中出现错误，请重试。' };
  }
}