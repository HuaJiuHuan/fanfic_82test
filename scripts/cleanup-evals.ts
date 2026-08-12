import { createClient } from '@libsql/client';
import { config } from 'dotenv';

config({ path: 'D:/react-env/.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  console.log('正在清理所有评估记录...');

  await client.execute(`DELETE FROM evaluations`);

  console.log('清理完成。');
}

main().catch(console.error);