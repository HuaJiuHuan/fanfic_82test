import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { evaluations } from '@/lib/db-schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  const rows = await db
    .select()
    .from(evaluations)
    .where(eq(evaluations.projectId, projectId))
    .orderBy(desc(evaluations.createdAt));

  return NextResponse.json({ evaluations: rows });
}