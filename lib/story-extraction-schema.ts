import { z } from 'zod';

export const StoryExtractionSchema = z.object({
  title: z.string().describe("为这篇短篇取一个合适的标题"),
  fandom: z.string().describe("这篇小说所属的原著/世界观/宇宙（如：哈利波特、漫威、原创等）"),
  characters: z.string().describe("文中出现的核心角色名称，用逗号分隔，如：哈利·波特, 赫敏·格兰杰"),
  premise: z.string().describe("一句话概括这篇小说的核心脑洞和故事主线，100字以内"),
});

export type StoryExtraction = z.infer<typeof StoryExtractionSchema>;