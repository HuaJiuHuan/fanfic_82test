"use client";

import { useRef, useEffect, useCallback } from "react";
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
  onSaveAllDrafts: () => void;
  onGenerateScene: () => void;
  onExitWritingMode: () => void;
  onEnterReadingView: () => void;
  sceneWordCount: number;
  sceneStyle: string;
  sceneCustomNote: string;
  onSceneWordCountChange: (count: number) => void;
  onSceneStyleChange: (style: string) => void;
  onSceneCustomNoteChange: (note: string) => void;
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
  onSaveAllDrafts,
  onGenerateScene,
  onExitWritingMode,
  onEnterReadingView,
  sceneWordCount,
  sceneStyle,
  sceneCustomNote,
  onSceneWordCountChange,
  onSceneStyleChange,
  onSceneCustomNoteChange,
}: WritingViewProps) {
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentContent = draftsMap[activeSceneId || ""] || "";

  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearAutoSaveTimer();
    if (currentContent) {
      autoSaveTimerRef.current = setTimeout(() => {
        onSaveDraft();
      }, 30_000);
    }
    return clearAutoSaveTimer;
  }, [currentContent, activeSceneId, clearAutoSaveTimer, onSaveDraft]);

  useEffect(() => {
    return () => clearAutoSaveTimer();
  }, [clearAutoSaveTimer]);

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
            {isSavingDraft ? "保存中..." : "30 秒无操作自动保存"}
          </span>
          <button
            onClick={onSaveAllDrafts}
            disabled={isSavingDraft}
            className="text-xs bg-academia-surface border border-academia-border text-academia-parchment px-3 py-1.5 rounded hover:border-academia-gold transition-all"
          >
            保存全部正文
          </button>
          <button
            onClick={onEnterReadingView}
            className="text-xs bg-academia-gold/10 text-academia-gold border border-academia-gold/30 px-3 py-1.5 rounded hover:bg-academia-gold hover:text-academia-bg transition-all"
            aria-label="预览全文阅读模式"
          >
            预览全文
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

              <div className="bg-academia-surface/50 border border-academia-border rounded-lg p-3 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-academia-muted">AI 执笔参数</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="scene-word-count" className="text-[10px] text-academia-muted block mb-1">
                      指定字数
                    </label>
                    <input
                      id="scene-word-count"
                      type="number"
                      min={200}
                      max={5000}
                      step={100}
                      value={sceneWordCount}
                      onChange={(e) => onSceneWordCountChange(Number(e.target.value))}
                      className="w-full bg-academia-bg border border-academia-border rounded px-2 py-1.5 text-xs text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
                      aria-label="指定 AI 生成字数"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="scene-style" className="text-[10px] text-academia-muted block mb-1">
                      写作风格
                    </label>
                    <select
                      id="scene-style"
                      value={sceneStyle}
                      onChange={(e) => onSceneStyleChange(e.target.value)}
                      className="w-full bg-academia-bg border border-academia-border rounded px-2 py-1.5 text-xs text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors"
                      aria-label="选择 AI 写作风格"
                    >
                      <option value="">默认</option>
                      <option value="细腻描写">细腻描写</option>
                      <option value="快节奏叙述">快节奏叙述</option>
                      <option value="对话为主">对话为主</option>
                      <option value="心理独白">心理独白</option>
                      <option value="环境渲染">环境渲染</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="scene-custom-note" className="text-[10px] text-academia-muted block mb-1">
                    特殊要求 <span className="text-academia-border">（可选）</span>
                  </label>
                  <textarea
                    id="scene-custom-note"
                    value={sceneCustomNote}
                    onChange={(e) => onSceneCustomNoteChange(e.target.value)}
                    placeholder="如：让爽世在对话中偷偷流泪但不说破..."
                    rows={2}
                    className="w-full bg-academia-bg border border-academia-border rounded px-2 py-1.5 text-xs text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors resize-none"
                    aria-label="AI 执笔特殊要求"
                  />
                </div>
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