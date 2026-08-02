import { z } from 'zod';

// 将 id 融入原本的 SceneBeatSchema，并作为唯一的场景约束
const SceneBeatSchema = z.object({
  id: z.string().describe("该场景的唯一标识符，格式要求为纯英文和数字，例如 act1_scene1"), 
  sceneNumber: z.number().describe("场景序号，如 1, 2, 3"),
  location: z.string().describe("场景发生的地点"),
  plotAction: z.string().describe("当前场景发生的核心动作或事件"),
  conflict: z.string().describe("当前场景中的主要冲突（例如角色内心的挣扎，或角色间的对抗）"),
  emotionalShift: z.string().describe("角色在当前场景前后的情绪转变，例如：从期待到绝望"),
});

// 定义完整的故事大纲
export const StoryOutlineSchema = z.object({
  title: z.string().describe("为这个同人短篇起一个吸引人的标题"),
  logline: z.string().describe("一句话故事核心（必须包含主角、目标和最大阻碍）"),
  characterArcs: z.array(
    z.object({
      name: z.string().describe("原著角色名"),
      coreMotivation: z.string().describe("该角色在这个短篇中的核心动机"),
    })
  ).describe("登场角色的弧光设定"),
  acts: z.array(
    z.object({
      actTitle: z.string().describe("幕标题（如：起因、发展、高潮、结局）"),
      scenes: z.array(SceneBeatSchema).describe("该幕下的具体场景列表"), // 这里正确引用了带有 id 的 Schema
    })
  ).max(4).describe("故事分为几幕，通常短篇包含3-4幕"),
});

// 导出类型供前端使用
export type StoryOutline = z.infer<typeof StoryOutlineSchema>;