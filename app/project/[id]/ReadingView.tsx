"use client";

import { useMemo } from "react";
import type { StoryOutline } from "@/lib/types";

interface ReadingViewProps {
  outline: StoryOutline;
  draftsMap: Record<string, string>;
  onBackToWriting: () => void;
}

function countWords(text: string): number {
  if (!text) return 0;
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

export default function ReadingView({
  outline,
  draftsMap,
  onBackToWriting,
}: ReadingViewProps) {
  const stats = useMemo(() => {
    const totalScenes = outline.acts.reduce((sum, act) => sum + act.scenes.length, 0);
    const writtenScenes = outline.acts.reduce((sum, act) =>
      sum + act.scenes.filter((s) => draftsMap[s.id]?.trim()).length, 0
    );
    const totalWords = Object.values(draftsMap).reduce((sum, text) => sum + countWords(text), 0);
    const actStats = outline.acts.map((act) => ({
      actTitle: act.actTitle,
      wordCount: act.scenes.reduce((sum, s) => sum + countWords(draftsMap[s.id] || ""), 0),
      sceneCount: act.scenes.length,
      writtenCount: act.scenes.filter((s) => draftsMap[s.id]?.trim()).length,
    }));
    return { totalScenes, writtenScenes, totalWords, actStats };
  }, [outline, draftsMap]);

  return (
    <div className="w-full h-full flex flex-col animate-fade-in-up">
      <div className="flex justify-between items-center border-b border-academia-border pb-4 mb-6">
        <div>
          <h2 className="text-xl font-serif text-academia-gold font-bold">全文阅读</h2>
          <p className="text-xs text-academia-muted">{outline.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-xs text-academia-muted">
            <span>
              已写 <span className="text-academia-gold font-bold">{stats.writtenScenes}</span>/{stats.totalScenes} 场景
            </span>
            <span className="text-academia-border">|</span>
            <span>
              总计 <span className="text-academia-gold font-bold">{stats.totalWords.toLocaleString()}</span> 字
            </span>
          </div>
          <button
            onClick={onBackToWriting}
            className="text-xs bg-academia-surface border border-academia-border text-academia-parchment px-3 py-1.5 rounded hover:border-academia-gold transition-all"
            aria-label="返回执笔模式"
          >
            返回执笔
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-10">
        <article className="max-w-2xl mx-auto space-y-12">
          <header className="text-center space-y-4 pb-8 border-b border-academia-border/50">
            <h1 className="text-3xl font-serif font-bold text-academia-gold">
              {outline.title}
            </h1>
            {outline.logline && (
              <p className="text-sm text-academia-muted italic leading-relaxed">
                {outline.logline}
              </p>
            )}
          </header>

          {outline.acts.map((act, actIdx) => {
            const actDrafts = act.scenes
              .map((scene) => draftsMap[scene.id])
              .filter(Boolean);

            if (actDrafts.length === 0) return null;

            const actStat = stats.actStats[actIdx];

            return (
              <section key={actIdx} className="space-y-8">
                <div className="text-center">
                  <h2 className="text-xl font-serif text-academia-gold font-bold">
                    第{actIdx + 1}幕：{act.actTitle}
                  </h2>
                  {actStat && (
                    <p className="text-xs text-academia-muted mt-1">
                      {actStat.writtenCount}/{actStat.sceneCount} 场景 · {actStat.wordCount.toLocaleString()} 字
                    </p>
                  )}
                </div>

                {act.scenes.map((scene) => {
                  const draft = draftsMap[scene.id];
                  if (!draft) return null;

                  const sceneWordCount = countWords(draft);

                  return (
                    <div key={scene.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-academia-muted uppercase tracking-widest">
                          场景 {scene.sceneNumber} · {scene.location}
                        </span>
                        <span className="text-[10px] text-academia-border">
                          {sceneWordCount.toLocaleString()} 字
                        </span>
                        <span className="flex-1 h-px bg-academia-border/30" />
                      </div>
                      <div className="text-sm text-academia-parchment leading-loose whitespace-pre-wrap font-serif">
                        {draft}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}

          {Object.keys(draftsMap).length === 0 && (
            <div className="text-center py-20 text-academia-muted">
              <p className="text-lg">暂无正文</p>
              <p className="text-xs mt-2">返回执笔模式开始撰写</p>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}