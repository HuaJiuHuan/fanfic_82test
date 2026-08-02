import Link from "next/link";
import { getProjects } from "@/app/actions/project";

export default async function DashboardPage() {
  const projectList = await getProjects();

  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans selection:bg-academia-gold/20">
      <header className="w-full px-6 py-4 border-b border-academia-border bg-academia-bg/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
        <span className="text-xl font-serif font-bold tracking-widest text-academia-gold">FANFIC COPILOT</span>
        <Link href="/project/new" className="bg-academia-gold text-academia-bg px-4 py-2 rounded-lg text-sm font-bold tracking-wide hover:opacity-90 transition-all shadow-[0_0_15px_rgba(193,156,92,0.15)]">
          + 开新坑
        </Link>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-12 space-y-8">
        <div className="space-y-2 border-b border-academia-border pb-4">
          <h1 className="text-3xl font-serif font-bold text-academia-parchment">我的灵感档案室</h1>
          <p className="text-sm text-academia-muted">所有的世界线都在此收束。</p>
        </div>

        {projectList.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center border border-dashed border-academia-border rounded-xl text-academia-muted">
             <span className="text-4xl mb-4 opacity-50">📂</span>
             <p>这里空空如也，去创造你的第一个宇宙吧。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectList.map((proj) => (
              <Link href={`/project/${proj.id}`} key={proj.id} className="relative group bg-academia-surface border border-academia-border rounded-xl hover:border-academia-gold/50 transition-all p-6 block">
                <h3 className="text-lg font-serif font-bold text-academia-gold mb-2 group-hover:text-academia-parchment transition-colors">{proj.title}</h3>
                <div className="text-xs text-academia-muted space-y-1">
                  <p><span className="text-academia-gold/50">原著：</span>{proj.fandom}</p>
                  <p><span className="text-academia-gold/50">角色：</span>{proj.characters}</p>
                  <p className="pt-2 mt-2 border-t border-academia-border/50 line-clamp-2 leading-relaxed">{proj.premise}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}