# Fanfic Copilot — AI 同人小说写作助手

基于大语言模型（DeepSeek）的智能同人小说创作平台，从大纲推演到场景执笔，AI 全程辅助你的创作之旅。

## 功能特性

- **灵感档案室** — 管理多个同人项目，每个项目独立存储原著设定、角色与核心脑洞
- **AI 大纲推演** — 基于全局设定，自动生成结构化三幕式故事大纲（标题、logline、角色弧光、分幕场景）
- **多版本回溯** — 每次重新生成都会保留历史版本，支持查看、编辑、切换或销毁任意版本
- **正文执笔模式** — 锁定某版大纲后进入写作模式，逐场景撰写正文，支持手动撰写与 AI 辅助生成
- **自动保存** — 场景正文失焦自动保存，刷新不丢失

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 运行环境 | React 19 |
| 样式 | Tailwind CSS v4 |
| 数据库 | Turso (SQLite Edge) |
| ORM | Drizzle ORM |
| AI | Vercel AI SDK + DeepSeek |
| 校验 | Zod |
| 语言 | TypeScript (strict) |

## 快速开始

### 环境要求

- Node.js 18+
- Turso 数据库账号 ([turso.tech](https://turso.tech))

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
│   ├── page.tsx                  # 首页（灵感档案室）
│   ├── layout.tsx                # 全局布局 & Metadata
│   ├── globals.css               # 全局样式（Dark Academia 主题）
│   ├── actions/
│   │   ├── project.ts            # 项目 CRUD
│   │   ├── generate.ts           # AI 大纲生成
│   │   ├── outline.ts            # 大纲更新/删除
│   │   ├── draft.ts              # 正文保存/读取
│   │   └── generate-scene.ts     # AI 场景正文生成
│   └── project/
│       ├── new/page.tsx          # 创建新项目
│       └── [id]/
│           ├── page.tsx          # 项目工作台
│           ├── WorkspaceClient.tsx  # 状态编排（useReducer）
│           ├── OutlineView.tsx   # 大纲推演台 UI
│           ├── WritingView.tsx   # 正文执笔模式 UI
│           ├── loading.tsx       # 骨架屏
│           └── error.tsx         # 错误边界
├── components/
│   └── DeleteProjectButton.tsx   # 删除项目按钮
├── lib/
│   ├── db.ts                     # 数据库连接
│   ├── db-schema.ts              # Drizzle 表结构定义
│   ├── schema.ts                 # Zod 校验 Schema
│   ├── types.ts                  # 共享 TypeScript 类型
│   └── ai-config.ts              # AI 模型参数配置
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

## 架构设计

- **Server Components + Server Actions** — 首屏数据由服务端直接查询，客户端交互通过 Server Actions 完成，无需 API 路由
- **useReducer 状态管理** — 工作台组件使用 `useReducer` 管理 14 种状态变更，确保复杂交互逻辑可预测、可追溯
- **纯展示组件拆分** — `OutlineView` 和 `WritingView` 不持有状态，仅通过 props 渲染，职责单一
- **Zod 双重校验** — 前端使用 Zod Schema 约束 AI 输出格式，服务端再次校验确保数据完整性
- **级联删除** — 数据库外键设置 `ON DELETE CASCADE`，删除项目时自动清理关联大纲和正文

## License

MIT