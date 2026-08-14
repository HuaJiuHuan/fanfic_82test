# Fanfic Copilot — AI 同人小说写作助手

基于大语言模型（DeepSeek）的智能同人小说创作平台，从大纲推演到场景执笔，AI 全程辅助你的创作之旅。

## 功能特性

- **灵感档案室** — 管理多个同人项目，每个项目独立存储原著设定、角色与核心脑洞，首页展示字数统计与场景进度
- **AI 大纲推演** — 基于全局设定，自动生成结构化多幕式故事大纲（标题、logline、角色弧光、分幕场景），支持自由增删幕与场景
- **多版本回溯** — 每次重新生成都会保留历史版本，支持查看、编辑、切换或销毁任意版本
- **正文执笔模式** — 锁定某版大纲后进入写作模式，逐场景撰写正文，支持手动撰写与 AI 辅助生成
- **全文阅读模式** — 将已完成的场景正文按幕聚合渲染为连续长文，支持阅读体验与数据统计
- **智能导入** — 粘贴一篇短篇小说，AI 自动提取标题/原著/角色/脑洞 → 反向生成结构化大纲 → 将原文精确拆分到对应场景
- **多 Agent 协作生成** — Setting Agent（设定顾问）→ Writing Agent（执笔）→ Editor Agent（审校）三级流水线，确保角色不 OOC、前后文连贯
- **编辑器审校报告** — 每次 AI 生成后，Editor Agent 输出结构化审校报告（OOC 检测、连贯性检查、大纲契合度、文笔质量），并自动输出修订版
- **自动保存** — 场景正文 30 秒无操作自动保存，支持一键保存全部正文

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 运行环境 | React 19 |
| 样式 | Tailwind CSS v4（Dark Academia 主题） |
| 数据库 | Turso (SQLite Edge) |
| ORM | Drizzle ORM |
| AI SDK | Vercel AI SDK (`generateObject` + `generateText`) |
| AI 模型 | DeepSeek (deepseek-chat) |
| AI Agent 框架 | Mastra（多 Agent 编排 + 工作流引擎 + 记忆管理） |
| 状态管理 | Zustand（全局 workspace store） |
| 校验 | Zod v4 |
| 语言 | TypeScript (strict) |

## 快速开始

### 环境要求

- Node.js 18+
- Turso 数据库账号 ([turso.tech](https://turso.tech))
- DeepSeek API Key

### 安装与运行

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的数据库连接和 API Key

# 3. 初始化数据库
npx drizzle-kit push

# 4. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用。

### 环境变量 (.env.local)

```env
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-auth-token
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
```

## 项目结构

```
fanfic/
├── app/
│   ├── page.tsx                    # 首页（灵感档案室，展示所有项目及统计）
│   ├── layout.tsx                  # 全局布局 & SEO Metadata
│   ├── globals.css                 # 全局样式（Dark Academia 主题）
│   ├── actions/
│   │   ├── project.ts              # 项目 CRUD + 统计查询 + 大纲切换
│   │   ├── generate.ts             # AI 大纲生成（generateObject + Zod Schema）
│   │   ├── outline.ts              # 大纲更新/删除（服务端 Zod 校验）
│   │   ├── draft.ts                # 正文保存/读取（upsert 模式）
│   │   ├── generate-scene.ts       # AI 场景正文生成（Mastra 三 Agent 流水线）
│   │   ├── import-story.ts         # 导入：AI 提取小说元信息
│   │   └── full-import.ts          # 导入：触发 Mastra 全量导入工作流
│   └── project/
│       ├── new/page.tsx            # 创建新项目（含 BanG Dream! 预设）
│       ├── import/page.tsx         # 智能导入页（粘贴小说 → AI 解析 → 确认创建）
│       └── [id]/
│           ├── page.tsx            # 项目工作台（Server Component，首屏数据直查）
│           ├── WorkspaceClient.tsx # 状态编排（Zustand store 桥接，自动保存定时器）
│           ├── OutlineView.tsx     # 大纲推演台 UI（版本切换、编辑、删除）
│           ├── WritingView.tsx     # 正文执笔模式 UI（场景面板 + AI 参数 + 编辑器）
│           ├── ReadingView.tsx     # 全文阅读模式 UI（按幕聚合，字数统计）
│           ├── OutlineSwitcher.tsx # 大纲版本切换下拉组件
│           ├── loading.tsx         # 骨架屏
│           └── error.tsx           # 错误边界
├── components/
│   ├── GenerateButton.tsx          # 大纲生成按钮（首推/分支重摇）
│   └── DeleteProjectButton.tsx     # 删除项目按钮（二次确认）
├── mastra/
│   ├── index.ts                    # Mastra 实例（注册 Agent + Workflow + 存储）
│   ├── agents/
│   │   ├── setting-agent.ts        # 设定顾问 Agent（角色状态 + 世界观简报）
│   │   ├── writing-agent.ts        # 执笔 Agent（带记忆，查阅前文后撰写）
│   │   └── editor-agent.ts         # 审校 Agent（OOC/连贯性/大纲契合度/文笔检查）
│   ├── tools/
│   │   ├── get-previous-scenes.ts  # 工具：查询前文场景内容
│   │   ├── get-project-settings.ts # 工具：查询项目全局设定
│   │   └── get-character-arcs.ts   # 工具：查询角色弧光 + 状态追踪
│   └── workflows/
│       └── full-import.ts          # 全量导入工作流（5 步链式编排）
├── lib/
│   ├── db.ts                       # Turso 数据库连接（Drizzle）
│   ├── db-schema.ts                # Drizzle 表结构（projects / outlines / sceneDrafts）
│   ├── schema.ts                   # Zod 校验 Schema（StoryOutline）
│   ├── types.ts                    # 共享 TypeScript 类型导出
│   ├── ai-config.ts                # AI 模型参数配置（模型名 + 温度）
│   ├── workspace-store.ts          # Zustand 全局状态管理（~30 个 action + 派生数据）
│   ├── scene-split-schema.ts       # Zod：原文场景拆分 Schema
│   └── story-extraction-schema.ts  # Zod：小说元信息提取 Schema
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

## 架构设计

### 数据流

```
用户操作 → Zustand Store (action) → Server Action → Drizzle ORM → Turso
                ↓                                    ↓
          UI 重渲染 (响应式)               Mastra Agent 流水线 (AI 生成)
```

### Server Components + Server Actions

- 首屏数据（项目列表、大纲历史）由服务端直接查询数据库，零客户端请求开销
- 客户端交互（生成、保存、删除）通过 Server Actions 完成，无需手动编写 API 路由
- 项目工作台页面 (`page.tsx`) 为 Server Component，子组件为 Client Component，充分利用 RSC  Streaming

### Zustand 全局状态管理

- 工作台使用单个 Zustand store (`workspace-store.ts`) 管理全部状态，替代了早期的 useReducer 方案
- Store 包含约 30 个 action：大纲生成/编辑/删除、场景选择/撰写/保存、AI 参数配置、审校报告管理
- 提供派生数据 selector（`useCurrentOutline`, `useDisplayData`, `useActiveSceneInfo`），避免不必要的重渲染
- `WorkspaceClient` 作为桥接层，从 store 读取状态并分发给纯展示组件

### Mastra 多 Agent 协作流水线

场景正文生成采用三级 Agent 串联架构：

```
generateSceneDraftAction
  │
  ├─ 1. Setting Agent（设定顾问）
  │     ├─ 调用 getProjectSettings 工具 → 获取原著、角色、脑洞
  │     ├─ 调用 getCharacterArcs 工具 → 获取角色弧光 + 状态追踪
  │     └─ 调用 getPreviousScenes 工具 → 查阅前文
  │     输出：结构化设定简报（角色状态、世界观约束、前文摘要）
  │
  ├─ 2. Writing Agent（执笔）
  │     ├─ 接收设定简报 + 场景任务（地点、动作、冲突、情感转变）
  │     ├─ 调用 getPreviousScenes 工具 → 查阅前文确保连贯
  │     └─ 输出：场景正文初稿
  │
  └─ 3. Editor Agent（审校）
        ├─ 接收设定简报 + 场景任务 + 初稿
        ├─ 调用 getPreviousScenes 工具 → 对照前文检查一致性
        └─ 输出：结构化审校报告（JSON）
             ├─ verdict: approved | needs_revision
             ├─ issues: OOC检测 / 连贯性 / 大纲契合度 / 文笔质量
             └─ revisedText: 修订后的最终正文
```

### Mastra 工作流引擎（全量导入）

```
fullImportWorkflow (5 步链式编排)
  │
  ├─ Step 1: createProject → 创建项目记录
  ├─ Step 2: generateOutline → AI 反向推导结构化大纲
  ├─ Step 3: saveOutline → 保存大纲并设为活跃版本
  ├─ Step 4: splitTextToScenes → AI 将原文精确拆分到场景
  └─ Step 5: saveDrafts → 批量保存场景正文
```

### 纯展示组件拆分

- `OutlineView`、`WritingView`、`ReadingView` 不持有业务状态，仅通过 props 渲染
- 所有状态变更统一由 Zustand store 的 action 处理，确保可预测性和可追溯性
- `WritingView` 内部管理自动保存定时器（30 秒无操作触发），不依赖外部

### Zod 双重校验

- AI 输出通过 Zod Schema 进行结构化约束（`generateObject` 模式），确保输出格式符合预期
- 大纲编辑保存时，服务端再次用 `StoryOutlineSchema.safeParse` 校验，防止客户端篡改

### 数据库设计

```
projects (项目)
  ├─ id, title, fandom, characters, premise
  ├─ activeOutlineId → 当前选用的大纲版本
  └─ createdAt, updatedAt

outlines (大纲版本)
  ├─ id, projectId (FK → projects.id, ON DELETE CASCADE)
  ├─ content (JSON) → 结构化大纲数据
  └─ version, createdAt

sceneDrafts (场景正文)
  ├─ id, projectId (FK → projects.id, ON DELETE CASCADE)
  ├─ outlineId (FK → outlines.id, ON DELETE CASCADE)
  ├─ sceneId → 对应大纲中的场景 ID
  ├─ content, wordCount, isLocked
  └─ createdAt, updatedAt
```

- **级联删除**：删除项目时自动清理关联大纲和正文
- **内容存储**：大纲以 JSON 格式存储完整结构化数据，正文以纯文本存储
- **Mastra 记忆**：Agent 的对话记忆和 working memory 存储在本地 SQLite（`mastra/mastra.db`）

### Agent 记忆管理

- Writing Agent 和 Editor Agent 均配置了 Mastra Memory（`@mastra/memory`）
- 记忆以 `projectId` 为 resourceId 隔离，每个项目拥有独立的对话上下文
- 保留最近 10-20 条消息用于上下文感知，支持 working memory 功能

## License

MIT