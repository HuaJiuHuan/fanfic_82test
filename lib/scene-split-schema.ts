import { z } from 'zod';

export const SceneSplitSchema = z.object({
  segments: z.array(
    z.object({
      sceneId: z.string().describe("大纲中对应的场景 ID，必须与提供的大纲场景 ID 完全一致"),
      content: z.string().describe("该场景对应的原文段落，请原封不动地从原文中截取"),
    })
  ).describe("每个场景对应的原文段落"),
});

export type SceneSplit = z.infer<typeof SceneSplitSchema>;