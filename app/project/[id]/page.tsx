import { getProjectById, getOutlinesByProject } from "@/app/actions/project";
import { db } from "@/lib/db";
import { outlines } from "@/lib/db-schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import WorkspaceClient from "./WorkspaceClient";
import RightPanel from "@/components/RightPanel";
import type { OutlineRecord } from "@/lib/types";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) {
    return { title: "项目未找到" };
  }
  return {
    title: project.title,
    description: `《${project.title}》— 原著：${project.fandom}，核心脑洞：${project.premise.slice(0, 80)}`,
  };
}

export default async function ProjectWorkspacePage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) notFound();

  const historyOutlines = (await db
    .select()
    .from(outlines)
    .where(eq(outlines.projectId, id))
    .orderBy(desc(outlines.createdAt))) as OutlineRecord[];

  const activeOutlineId = project.activeOutlineId || historyOutlines[0]?.id || null;

  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans flex flex-col selection:bg-academia-gold/20">
      <header className="w-full px-6 py-4 border-b border-academia-border bg-academia-bg/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-academia-muted hover:text-academia-parchment transition-colors">
            ← 大厅
          </Link>
          <span className="w-px h-4 bg-academia-border"></span>
          <span className="text-sm font-serif font-bold text-academia-gold">{project.title}</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-academia-surface border border-academia-border p-5 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest border-b border-academia-border/50 pb-2">
              全局档案
            </h3>
            <div className="space-y-1">
              <span className="text-[10px] text-academia-muted uppercase">原著</span>
              <p className="text-sm">{project.fandom}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-academia-muted uppercase">角色</span>
              <p className="text-sm">{project.characters}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-academia-muted uppercase">核心脑洞</span>
              <p className="text-sm text-academia-muted leading-relaxed">{project.premise}</p>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-6 bg-academia-surface/30 border border-academia-border rounded-xl p-6 min-h-[700px] flex flex-col">
          <WorkspaceClient project={project} initialHistory={historyOutlines} activeOutlineId={activeOutlineId} />
        </section>

        <aside className="lg:col-span-3 space-y-6">
          <RightPanel projectId={id} />
        </aside>
      </main>
    </div>
  );
}