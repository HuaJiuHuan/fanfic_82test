import type { StoryOutline } from '@/lib/schema';
import type { outlines, projects, sceneDrafts } from '@/lib/db-schema';

export type { StoryOutline };

export type Project = typeof projects.$inferSelect;

export type OutlineRecord = typeof outlines.$inferSelect & {
  content: StoryOutline;
};

export type SceneDraft = typeof sceneDrafts.$inferSelect;

export type Scene = StoryOutline['acts'][number]['scenes'][number];

export type Act = StoryOutline['acts'][number];