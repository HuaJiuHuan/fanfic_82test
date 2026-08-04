import Link from "next/link";
import type { Metadata } from "next";
import { getProjectsWithStats } from "@/app/actions/project";
import DeleteProjectButton from "@/components/DeleteProjectButton";

export const metadata: Metadata = {
  title: "我的灵感档案室",
  description: "所有世界线在此收束。管理你的同人小说项目，开始新的创作之旅。",
};

function formatWords(count: number): string {
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万字`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}千字`;
  }
  return `${count}字`;
}

function getRelativeTime(date: Date | null): string {
  if (!date) return "未知";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "刚刚";
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN");
}

export default async function DashboardPage() {
  const projectList = await getProjectsWithStats();

  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans selection:bg-academia-gold/20">
      <header className="w-full px-6 py-4 border-b border-academia-border bg-academia-bg/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
        <span className="text-xl font-serif font-bold tracking-widest text-academia-gold">
          FANFIC COPILOT
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/project/import"
            className="text-xs text-academia-muted hover:text-academia-parchment px-3 py-2 transition-colors border border-academia-border rounded-lg hover:bg-academia-surface"
            aria-label="导入短篇小说并自动创建项目"
          >
            📥 导入
          </Link>
          <Link
            href="/project/new"
            className="bg-academia-gold text-academia-bg px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90 transition-all shadow-[0_0_15px_rgba(232,125,155,0.15)]"
            aria-label="创建新的同人小说项目"
          >
            + 开新坑
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-12 space-y-8">
        <div className="space-y-2 border-b border-academia-border pb-4">
          <h1 className="text-3xl font-serif font-bold text-academia-parchment">我的灵感档案室</h1>
          <p className="text-sm text-academia-muted">所有的世界线都在此收束。</p>
        </div>

        {projectList.length === 0 ? (
          <div
            className="w-full py-20 flex flex-col items-center justify-center border border-dashed border-academia-border rounded-xl text-academia-muted"
            role="status"
            aria-label="暂无项目"
          >
            <span className="text-4xl mb-4 opacity-50" aria-hidden="true">📂</span>
            <p>这里空空如也，去创造你的第一个宇宙吧。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectList.map((proj) => (
              <div
                key={proj.id}
                className="relative group bg-gradient-to-br from-academia-surface to-academia-bg border border-academia-border rounded-xl hover:border-academia-gold/50 hover:-translate-y-[2px] transition-all duration-300 shadow-sm hover:shadow-[0_8px_25px_rgba(232,125,155,0.1)] overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-academia-gold/60 to-transparent"></div>

                <Link
                  href={`/project/${proj.id}`}
                  aria-label={`打开项目：${proj.title}`}
                  className="block p-5"
                >
                  <h3 className="text-base font-serif font-bold text-academia-gold mb-3 group-hover:text-academia-parchment transition-colors flex items-center gap-2">
                    <span className="text-academia-gold/70">📖</span>
                    {proj.title}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="inline-block px-2 py-0.5 text-[10px] bg-academia-gold/10 text-academia-gold rounded-full border border-academia-gold/20">
                      {proj.fandom}
                    </span>
                  </div>

                  <p className="text-xs text-academia-muted mb-3">
                    <span className="text-academia-gold/50">角色：</span>
                    {proj.characters}
                  </p>

                  <p className="text-xs text-academia-muted pt-3 mt-3 border-t border-academia-border/50 line-clamp-2 leading-relaxed">
                    {proj.premise}
                  </p>
                </Link>

                <div className="px-5 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-academia-muted">
                    {proj.sceneCount > 0 ? (
                      <>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-academia-gold/60"></span>
                          {proj.sceneCount}场景
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-academia-gold/40"></span>
                          {formatWords(proj.totalWords)}
                        </span>
                      </>
                    ) : (
                      <span className="text-academia-gold/50">尚未开始创作</span>
                    )}
                  </div>
                  <span className="text-[10px] text-academia-muted/60">
                    {getRelativeTime(proj.updatedAt)}
                  </span>
                </div>

                <DeleteProjectButton projectId={proj.id} projectName={proj.title} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}