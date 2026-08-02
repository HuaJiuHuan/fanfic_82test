# FANFIC COPILOT 阶段性开发记录 (Milestone Report)

**更新日期**: 2026-08
**项目定位**: 围绕“项目制”打造的 AI 辅助同人小说创作工作台 (Creator Workspace)
**技术栈**: Next.js App Router, Turso (SQLite), Drizzle ORM, AI SDK (DeepSeek), Zod, Tailwind CSS
**视觉风格**: Dark Academia (暗黑学院风)

---

## 核心实现功能汇总

### 1. 核心架构与数据流彻底打通
为了支持“结构（大纲）”与“血肉（正文）”的分离，完成了底层数据结构的精密重构：
*   **统一 Schema 标准**：重构了 Zod 的 `StoryOutlineSchema`，强制 AI 为每个生成的场景打上唯一的 UUID/标识符（`sceneId`，如 `act1_scene1`），作为正文绑定的绝对锚点。
*   **真实 ID 穿透**：修复了前端使用临时 UUID 导致外键约束失败（`FOREIGN KEY constraint failed`）的严重 BUG。现在后端大纲生成后，会利用 Drizzle 的 `returning()` 将真实的数据库 `outlineId` 返回前端。
*   **正文独立存储**：新建了 `scene_drafts` 数据库表。通过双重级联（Cascade）严格绑定 `projectId` 与 `outlineId`，并在物理层面彻底分离了“大纲 JSON”与“正文文本”。

### 2. 沉浸式执笔模式 (Immersive Writing Mode)
完成了从“大纲探索”到“正文定稿”的工作流流转，打造了类似专业写作软件（Ulysses/Scrivener）的双分栏视图：
*   **左侧导航栏**：大纲目录树。按幕（Act）与场景（Scene）折叠展示，附带场景核心动作（plotAction）的摘要。支持点击切换场景，且对“已动笔”的场景有状态高亮提示。
*   **右侧主工作区**：
    *   **提示面板**：顶部锁定当前场景的“核心冲突（Conflict）”与“情绪转变（Emotional Shift）”，为写作提供持续的灵感导航。
    *   **文本编辑器**：深色模式的富文本/多行文本输入区，支持用户纯手动撰写。
    *   **静默持久化**：实现了文本框失去焦点（`onBlur`）时的防抖自动保存逻辑，调用 `saveDraftAction` 实现无缝的 Upsert（有则更新，无则插入）。

### 3. AI 分场景正文生成 (AI Scene-by-Scene Generation)
摒弃了“一次性生成全文”的粗放模式，实现了高控场粒度的单点生成：
*   **动态上下文组装**：通过 `generateSceneDraftAction`，在后台动态组装包含“全局世界观（原著、角色、脑洞）”与“局部目标（当前场景的情节动作与冲突）”的 Prompt。
*   **一键召唤 AI**：在写作区右下角实装了“✨ 召唤 AI 执笔此场景”按钮。点击后 AI 将根据当前场景要求生成对应的连贯正文，并自动填充至输入框，同时触发数据库持久化。

### 4. 项目全生命周期管理闭环
完成了项目的彻底销毁逻辑，确保数据安全与系统整洁：
*   **级联销毁引擎**：依赖 Turso 数据库的外键 `onDelete: 'cascade'` 属性，实现“删其一端，抹除全貌”的纯净删除。
*   **首页卡片重构**：修复了 Next.js 中 `<a>` 标签嵌套的 Hydration 报错，将项目卡片的最外层重构为 `<div>` 容器。
*   **定制化防误触交互**：彻底移除了生硬的原生 `window.confirm`。在首页卡片右上角封装了 `DeleteProjectButton` 组件，采用暗黑学院风的“悬浮显形 + 原位平滑展开二次确认（彻底抹除 / 确认 / 取消）”的设计，极大提升了 UI 质感与交互体验。

---

## 下阶段功能展望 (Backlog)
1.  **AI 上下文记忆拼接**：在请求生成特定场景的正文时，将**上一个场景已生成好的正文**作为记忆喂给 AI，解决跨场景动作与情绪连贯性的痛点。
2.  **正文锁定机制**：激活 `sceneDrafts` 表中的 `isLocked` 字段，防止用户的精修心血被 AI 批量生成或误操作覆盖。
3.  **字数统计与导出**：实装完整的字数统计功能，并支持将全本大纲与正文一键导出为 Markdown 或 PDF 格式。