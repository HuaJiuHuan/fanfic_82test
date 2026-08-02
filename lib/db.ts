import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './db-schema';

// 创建 Turso 客户端连接
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// 导出带有完整强类型推断的 db 实例
export const db = drizzle(client, { schema });