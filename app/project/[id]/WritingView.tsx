"use client";

import { memo, useRef, useEffect, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWorkspaceStore, useCurrentOutline, useActiveSceneInfo } from "@/lib/workspace-store";
import type { Project } from "@/lib/types";
import type { EditorReview, GeneratingPhase } from "@/lib/workspace-store";

// ==================== 类型定义 ====================

interface WritingViewProps {
  project: Project;
}

// ==================== WritingView ====================

export default memo(function WritingView({ project: _project }: WritingViewProps) {
  const error = useWorkspaceStore((s) => s.error);
  const activeSceneId = useWorkspaceStore((s) => s.activeSceneId);
  const draftPresenceMap = useWorkspaceStore(useShallow((s) => s.draftPresenceMap));
  const isSavingDraft = useWorkspaceStore((s) => s.isSavingDraft);

  const outline = useCurrentOutline();
  const activeSceneInfo = useActiveSceneInfo();

  const setActiveScene = useWorkspaceStore((s) => s.setActiveScene);
  const saveAllDrafts = useWorkspaceStore((s) => s.saveAllDrafts);
  const exitWritingMode = useWorkspaceStore((s) => s.exitWritingMode);
  const enterReadingView = useWorkspaceStore((s) => s.enterReadingView);

  if (!outline) {
    return (
      <div className="w-full h-full flex items-center justify-center text-academia-muted">
        大纲数据加载中...
      </div>
    );
  }

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
            onClick={saveAllDrafts}
            disabled={isSavingDraft}
            className="text-xs bg-academia-surface border border-academia-border text-academia-parchment px-3 py-1.5 rounded hover:border-academia-gold transition-all"
          >
            保存全部正文
          </button>
          <button
            onClick={enterReadingView}
            className="text-xs bg-academia-gold/10 text-academia-gold border border-academia-gold/30 px-3 py-1.5 rounded hover:bg-academia-gold hover:text-academia-bg transition-all"
            aria-label="预览全文阅读模式"
          >
            预览全文
          </button>
          <button
            onClick={exitWritingMode}
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
                    onClick={() => setActiveScene(scene.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs space-y-1 ${
                      activeSceneId === scene.id
                        ? "bg-academia-surface border-academia-gold shadow-[0_0_10px_rgba(232,125,155,0.15)]"
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
                      {draftPresenceMap[scene.id] && (
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

        <SceneEditorPanel
          activeSceneId={activeSceneId}
          activeSceneInfo={activeSceneInfo}
        />
      </div>
    </div>
  );
});

// ==================== SceneEditorPanel ====================

interface SceneEditorPanelProps {
  activeSceneId: string | null;
  activeSceneInfo: ReturnType<typeof useActiveSceneInfo>;
}

const SceneEditorPanel = memo(function SceneEditorPanel({
  activeSceneId,
  activeSceneInfo,
}: SceneEditorPanelProps) {
  const draftContent = useWorkspaceStore((s) => (activeSceneId ? s.draftsMap[activeSceneId] || "" : ""));
  const isTyping = useWorkspaceStore((s) => s.isTyping);
  const isGeneratingScene = useWorkspaceStore((s) => s.isGeneratingScene);
  const generatingPhase = useWorkspaceStore((s) => s.generatingPhase);
  const editorReview = useWorkspaceStore((s) => s.editorReview);
  const sceneWordCount = useWorkspaceStore((s) => s.sceneWordCount);
  const sceneStyle = useWorkspaceStore((s) => s.sceneStyle);
  const sceneCustomNote = useWorkspaceStore((s) => s.sceneCustomNote);

  const updateDraft = useWorkspaceStore((s) => s.updateDraft);
  const saveDraft = useWorkspaceStore((s) => s.saveDraft);
  const generateScene = useWorkspaceStore((s) => s.generateScene);
  const stopTyping = useWorkspaceStore((s) => s.stopTyping);
  const setSceneWordCount = useWorkspaceStore((s) => s.setSceneWordCount);
  const setSceneStyle = useWorkspaceStore((s) => s.setSceneStyle);
  const setSceneCustomNote = useWorkspaceStore((s) => s.setSceneCustomNote);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoSaveTimer = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearAutoSaveTimer();
    if (draftContent) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft();
      }, 30_000);
    }
    return clearAutoSaveTimer;
  }, [draftContent, activeSceneId, clearAutoSaveTimer, saveDraft]);

  useEffect(() => {
    return () => clearAutoSaveTimer();
  }, [clearAutoSaveTimer]);

  if (!activeSceneInfo) {
    return (
      <div className="w-2/3 flex items-center justify-center text-academia-muted">
        请在左侧选择一个场景。
      </div>
    );
  }

  return (
    <div className="w-2/3 flex flex-col space-y-4">
      {generatingPhase !== "idle" && generatingPhase !== "done" && (
        <PhaseIndicator phase={generatingPhase} />
      )}

      {editorReview && <EditorReviewPanel review={editorReview} />}

      <div className="bg-academia-surface border border-academia-border p-4 rounded-lg space-y-2 relative overflow-hidden">
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
              onChange={(e) => setSceneWordCount(Number(e.target.value))}
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
              onChange={(e) => setSceneStyle(e.target.value)}
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
            onChange={(e) => setSceneCustomNote(e.target.value)}
            placeholder="如：让爽世在对话中偷偷流泪但不说破..."
            rows={2}
            className="w-full bg-academia-bg border border-academia-border rounded px-2 py-1.5 text-xs text-academia-parchment outline-none focus:border-academia-gold/50 transition-colors resize-none"
            aria-label="AI 执笔特殊要求"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <textarea
          value={draftContent}
          onChange={(e) => {
            if (activeSceneId) updateDraft(activeSceneId, e.target.value);
          }}
          onBlur={saveDraft}
          placeholder="开始执笔，或者召唤 AI 辅助撰写本段场景..."
          className={`w-full h-full resize-none bg-academia-bg border rounded-lg p-6 text-sm text-academia-parchment leading-loose outline-none focus:border-academia-gold/50 transition-colors custom-scrollbar ${
            isTyping ? "border-academia-gold/50" : "border-academia-border"
          }`}
          aria-label={`场景 ${activeSceneInfo.sceneNumber} 正文编辑区`}
        />
        <button
          onClick={isTyping ? stopTyping : generateScene}
          disabled={isGeneratingScene}
          className={`absolute bottom-4 right-6 px-4 py-2 rounded-md text-xs font-bold shadow-[0_0_15px_rgba(232,125,155,0.3)] transition-all ${
            isGeneratingScene
              ? "bg-academia-surface text-academia-muted cursor-not-allowed border border-academia-border"
              : isTyping
                ? "bg-academia-surface text-academia-muted border border-academia-border hover:bg-academia-crimson/10 hover:text-academia-crimson hover:border-academia-crimson/30"
                : "bg-academia-gold text-academia-bg hover:opacity-90"
          }`}
          aria-label={isTyping ? "停止打字" : "召唤 AI 执笔此场景"}
        >
          {isGeneratingScene ? "✨ 蘸墨构思中..." : isTyping ? "⏹ 停止打字" : "✨ 召唤 AI 执笔此场景"}
        </button>
      </div>
    </div>
  );
});

// ==================== 子组件 ====================

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  major: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  minor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: '严重',
  major: '重要',
  minor: '建议',
};

const CATEGORY_LABELS: Record<string, string> = {
  ooc: 'OOC',
  continuity: '连贯性',
  outline_fit: '大纲契合',
  prose: '文笔',
};

const PHASE_CONFIG: Record<string, { icon: string; label: string }> = {
  setting: { icon: '⚙️', label: '设定 Agent 正在分析场景设定...' },
  writing: { icon: '✍️', label: '写作 Agent 正在撰写正文...' },
  editing: { icon: '🔍', label: '编辑 Agent 正在审校修订...' },
};

const PhaseIndicator = memo(function PhaseIndicator({ phase }: { phase: GeneratingPhase }) {
  const config = PHASE_CONFIG[phase];
  if (!config) return null;

  const phases = ['setting', 'writing', 'editing'] as const;
  const currentIdx = phases.indexOf(phase as typeof phases[number]);

  return (
    <div className="bg-academia-surface border border-academia-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-academia-border/50">
        <span className="text-xs font-bold text-academia-parchment">AI 生成进度</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        {phases.map((p, i) => {
          const cfg = PHASE_CONFIG[p];
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;

          return (
            <div key={p} className="flex items-center gap-2 text-xs">
              <span className="shrink-0 w-5 text-center">
                {isDone ? '✅' : isActive ? cfg.icon : '○'}
              </span>
              <span
                className={
                  isDone
                    ? 'text-academia-muted/60 line-through'
                    : isActive
                      ? 'text-academia-gold animate-pulse'
                      : 'text-academia-muted/40'
                }
              >
                {isDone ? cfg.label.replace('正在', '已') : cfg.label}
              </span>
              {isActive && (
                <span className="w-2 h-4 bg-academia-gold animate-blink ml-auto" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

const EditorReviewPanel = memo(function EditorReviewPanel({ review }: { review: EditorReview }) {
  return (
    <div className="bg-academia-surface border border-academia-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-academia-border/50">
        <span className="text-xs font-bold text-academia-parchment">编辑审校报告</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
          review.verdict === 'approved'
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
        }`}>
          {review.verdict === 'approved' ? '通过' : '已修订'}
        </span>
      </div>
      <div className="px-4 py-2">
        <p className="text-xs text-academia-muted">{review.summary}</p>
      </div>
      {review.issues.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          {review.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              <span className={`shrink-0 px-1.5 py-0.5 rounded border text-[10px] ${SEVERITY_COLORS[issue.severity] || ''}`}>
                {SEVERITY_LABELS[issue.severity] || issue.severity}
              </span>
              <span className="text-academia-muted/60 text-[10px] shrink-0 mt-0.5">
                [{CATEGORY_LABELS[issue.category] || issue.category}]
              </span>
              <span className="text-academia-parchment/80">{issue.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});