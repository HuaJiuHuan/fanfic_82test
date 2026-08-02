"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-academia-bg text-academia-parchment font-sans flex items-center justify-center">
      <div className="text-center space-y-6 p-8 bg-academia-surface border border-academia-border rounded-xl max-w-md">
        <h2 className="text-xl font-serif text-academia-crimson">页面加载失败</h2>
        <p className="text-sm text-academia-muted">
          {error.message || "发生了未知错误，请尝试刷新页面。"}
        </p>
        <button
          onClick={reset}
          className="bg-academia-gold text-academia-bg px-6 py-2 rounded-md text-sm font-bold hover:opacity-90 transition-all"
        >
          重试
        </button>
      </div>
    </div>
  );
}