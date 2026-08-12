import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// 核心实体：项目 (Project) 
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),           // 项目代号/书名
  fandom: text('fandom').notNull(),         // 原著背景 (全局)
  characters: text('characters').notNull(), // 核心角色 (全局)
  premise: text('premise').notNull(),       // 核心脑洞 (全局)
  activeOutlineId: text('active_outline_id'), // 当前选定的大纲版本
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// 从属实体：大纲 (Outline) 
export const outlines = sqliteTable('outlines', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }), // 级联删除
  content: text('content', { mode: 'json' }).notNull(), // 存放 AI 吐出的结构化 JSON
  version: integer('version').default(1),               // 大纲版本号
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const sceneDrafts = sqliteTable('scene_drafts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  outlineId: text('outline_id')
    .notNull()
    .references(() => outlines.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').notNull(), // 对应刚才 Zod 里生成的场景 ID
  content: text('content').notNull(),
  wordCount: integer('word_count').default(0),
  isLocked: integer('is_locked', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const evaluations = sqliteTable('evaluations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  score: real('score').notNull(),
  result: text('result', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  uniqueTarget: uniqueIndex('eval_target_idx').on(table.projectId, table.targetType, table.targetId),
}));