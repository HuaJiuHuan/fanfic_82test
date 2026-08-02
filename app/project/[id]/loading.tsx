export default function Loading() {
  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans flex flex-col">
      <header className="w-full px-6 py-4 border-b border-academia-border bg-academia-bg/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-4 bg-academia-surface rounded animate-pulse" />
          <span className="w-px h-4 bg-academia-border"></span>
          <div className="w-32 h-5 bg-academia-surface rounded animate-pulse" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-academia-surface border border-academia-border p-5 rounded-xl space-y-4">
            <div className="w-20 h-3 bg-academia-border rounded animate-pulse" />
            <div className="space-y-2">
              <div className="w-full h-4 bg-academia-border rounded animate-pulse" />
              <div className="w-3/4 h-4 bg-academia-border rounded animate-pulse" />
              <div className="w-1/2 h-4 bg-academia-border rounded animate-pulse" />
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9 bg-academia-surface/30 border border-academia-border rounded-xl p-6 min-h-[700px] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-2 border-academia-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-academia-muted text-xs tracking-widest uppercase">加载中...</p>
          </div>
        </section>
      </main>
    </div>
  );
}