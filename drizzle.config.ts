import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// 1. 明确告诉 Drizzle CLI 去读取 Next.js 专属的 .env.local 文件
config({ path: '.env.local' });

export default defineConfig({
  schema: './lib/db-schema.ts',
  out: './drizzle',
  // 2. 新版 Drizzle 废弃了 driver 字段，直接将 dialect 设置为 turso 即可
  dialect: 'turso', 
  dbCredentials: {
    // 这里的感叹号 ! 是告诉 TypeScript：放心，这个变量一定存在
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
});