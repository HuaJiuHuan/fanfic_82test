"use client";

import type { Scene, StoryOutline } from "@/lib/types";

interface WritingViewProps {
  outline: StoryOutline;
  error: string;
  activeSceneId: string | null;
  draftsMap: Record<string, string>;
  isSavingDraft: boolean;
  isGeneratingScene: boolean;
  activeSceneInfo: Scene | null;
  onSelectScene: (sceneId: string) => void;
  onDraftChange: (content: string) => void;
  onSaveDraft: () => void;
  onGenerateScene: () => void;
  onExitWritingMode: () => void;
}

export default function WritingView({
  outline,
  error,
  activeSceneId,
  draftsMap,
  isSavingDraft,
  isGeneratingScene,
  activeSceneInfo,
  onSelectScene,
  onDraftChange,
  onSaveDraft,
  onGenerateScene,
  onExitWritingMode,
}: WritingViewProps) {
  return (
    <div className="w-full h-full flex flex-col space-y-4 animate-fade-in-up">
      {error && (
        <div className="mb-4 p-3 bg-academia-crimson/10 border border-academia-crimson/30 rounded-lg text-xs text-academia-crimson">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center border-b border-academia-border pb-4">
        <div>
          <h2 className="text-xl font-serif text-academia-gold font-bold">正文执笔模式</h2>
          <p className="text-xs text-academia-muted">定稿：{outline.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-academia-muted">
            {isSavingDraft ? "保存中..." : "已同步至命运石之门"}
          </span>
          <button
            onClick={onSaveDraft}
            className="text-xs bg-academia-surface border border-academia-border text-academia-parchment px-3 py-1.5 rounded hover:border-academia-gold transition-all"
          >
            手动保存当前幕
          </button>
          <button
            onClick={onExitWritingMode}
            className="text-xs bg-academia-crimson/10 text-academia-crimson border border-academia-crimson/30 px-3 py-1.5 rounded hover:bg-academia-crimson hover:text-white transition-all"
          >
            退出执笔
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 h-[600px]">
        <div className="w-1/3 border-r border-academia-border/50 pr-4 overflow-y-auto custom-scrollbar space-y-6 pb-10">
          {outline.acts.map((act, actIdx) => (
            <div key={actIdx} className="space-y-2">
              <h3 className="text-sm font-bold text-academia-muted uppercase tracking-widest border-b border-academia-border/50 pb-1">
                第 {actIdx + 1} 幕：{act.actTitle}
              </h3>
              <div className="space-y-2">
                {act.scenes.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => onSelectScene(scene.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs space-y-1 ${
                      activeSceneId === scene.id
                        ? "bg-academia-surface border-academia-gold shadow-[0_0_10px_rgba(193,156,92,0.15)]"
                        : "bg-transparent border-transparent hover:border-academia-border hover:bg-academia-surface/50"
                    }`}
                    aria-label={`场景 ${scene.sceneNumber}：${scene.plotAction}`}
                    aria-current={activeSceneId === scene.id ? "true" : undefined}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={`font-bold ${activeSceneId === scene.id ? "text-academia-gold" : "text-academia-parchment"}`}
                      >
                        场景 {scene.sceneNumber}
                      </span>
                      {draftsMap[scene.id] && draftsMap[scene.id].length > 0 && (
                        <span className="text-[10px] text-green-600/80">已动笔</span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-academia-muted">{scene.plotAction}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="w-2/3 flex flex-col space-y-4">
          {activeSceneInfo ? (
            <>
              <div className="bg-[#1a1a18] border border-academia-border p-4 rounded-lg space-y-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-academia-gold/50"></div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-academia-gold">
                    当前锚点：场景 {activeSceneInfo.sceneNumber} - {activeSceneInfo.location}
                  </span>
                  <span className="text-xs text-academia-muted">
                    情绪：{activeSceneInfo.emotionalShift}
                  </span>
                </div>
                <p className="text-sm text-academia-parchment">{activeSceneInfo.plotAction}</p>
                <p className="text-xs text-academia-muted border-t border-academia-border/50 pt-2">
                  ⚔️ 冲突：{activeSceneInfo.conflict}
                </p>
              </div>

              <div className="flex-1 flex flex-col relative">
                <textarea
                  value={draftsMap[activeSceneId || ""] || ""}
                  onChange={(e) => onDraftChange(e.target.value)}
                  onBlur={onSaveDraft}
                  placeholder="开始执笔，或者召唤 AI 辅助撰写本段场景..."
                  className="w-full h-full resize-none bg-academia-bg border border-academia-border rounded-lg p-6 text-sm text-academia-parchment leading-loose outline-none focus:border-academia-gold/50 transition-colors custom-scrollbar"
                  aria-label={`场景 ${activeSceneInfo.sceneNumber} 正文编辑区`}
                />
                <button
                  onClick={onGenerateScene}
                  disabled={isGeneratingScene}
                  className={`absolute bottom-4 right-6 px-4 py-2 rounded-md text-xs font-bold shadow-[0_0_15px_rgba(193,156,92,0.3)] transition-all ${
                    isGeneratingScene
                      ? "bg-academia-surface text-academia-muted cursor-not-allowed border border-academia-border"
                      : "bg-academia-gold text-academia-bg hover:opacity-90"
                  }`}
                  aria-label="召唤 AI 执笔此场景"
                >
                  {isGeneratingScene ? "✨ 蘸墨构思中..." : "✨ 召唤 AI 执笔此场景"}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-academia-muted">
              请在左侧选择一个场景。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}