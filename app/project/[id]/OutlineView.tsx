"use client";

import type { OutlineRecord, Project, StoryOutline } from "@/lib/types";

interface OutlineViewProps {
  project: Project;
  isLoading: boolean;
  error: string;
  history: OutlineRecord[];
  selectedIndex: number;
  isEditing: boolean;
  editedOutline: StoryOutline | null;
  displayData: StoryOutline | null;
  onSelectVersion: (index: number) => void;
  onGenerate: () => void;
  onDelete: () => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onEnterWritingMode: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateLogline: (logline: string) => void;
  onUpdateActTitle: (actIdx: number, title: string) => void;
  onUpdateScene: (actIdx: number, sceneIdx: number, field: string, value: string) => void;
}

export default function OutlineView({
  isLoading,
  error,
  history,
  selectedIndex,
  isEditing,
  editedOutline,
  displayData,
  onSelectVersion,
  onGenerate,
  onDelete,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onEnterWritingMode,
  onUpdateTitle,
  onUpdateLogline,
  onUpdateActTitle,
  onUpdateScene,
}: OutlineViewProps) {
  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {error && (
        <div className="mb-4 p-3 bg-academia-crimson/10 border border-academia-crimson/30 rounded-lg text-xs text-academia-crimson">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-academia-border pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-serif text-academia-parchment">大纲推演台</h2>
          {history.length > 0 && !isEditing && (
            <select
              value={selectedIndex}
              onChange={(e) => onSelectVersion(Number(e.target.value))}
              disabled={isLoading}
              className="bg-academia-surface border border-academia-border text-xs text-academia-muted rounded-md px-2 py-1 outline-none focus:border-academia-gold/50 cursor-pointer"
              aria-label="选择大纲版本"
            >
              {Array.from({ length: history.length }).map((_, idx) => (
                <option key={idx} value={idx}>
                  版本 {history.length - idx}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && !isEditing && (
            <>
              <button
                onClick={onStartEditing}
                disabled={isLoading}
                className="text-xs text-academia-muted hover:text-academia-parchment px-3 py-2 transition-colors border border-transparent hover:border-academia-border rounded"
              >
                编辑
              </button>
              <button
                onClick={onDelete}
                disabled={isLoading}
                className="text-xs text-academia-crimson hover:text-red-400 px-3 py-2 transition-colors border border-transparent hover:border-academia-crimson/30 rounded"
              >
                销毁
              </button>
              <span className="w-px h-4 bg-academia-border mx-2"></span>
              <button
                onClick={onEnterWritingMode}
                disabled={isLoading}
                className="bg-academia-parchment text-academia-bg px-4 py-2 rounded-md text-xs font-bold hover:bg-academia-gold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2"
              >
                🖋️ 锁定此版并执笔
              </button>
            </>
          )}
          {isEditing ? (
            <>
              <button
                onClick={onCancelEditing}
                disabled={isLoading}
                className="text-xs text-academia-muted px-4 py-2"
              >
                取消
              </button>
              <button
                onClick={onSaveEditing}
                disabled={isLoading}
                className="bg-academia-gold text-academia-bg px-5 py-2 rounded-md text-xs font-bold"
              >
                保存修改
              </button>
            </>
          ) : (
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="bg-academia-surface border border-academia-border text-academia-gold px-5 py-2 rounded-md text-xs font-bold hover:bg-academia-gold/10 ml-2"
            >
              {isLoading ? "高维运算中..." : history.length > 0 ? "分支重摇" : "首次推演大纲"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {!displayData && !isLoading && (
          <div className="w-full h-64 flex items-center justify-center text-academia-muted text-sm font-serif">
            点击右上角按钮，基于全局档案生成故事架构...
          </div>
        )}

        {isLoading && !isEditing && (
          <div className="w-full h-64 flex flex-col items-center justify-center space-y-4 animate-breathe">
            <div className="w-8 h-8 border-2 border-academia-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-academia-muted text-xs tracking-widest uppercase">
              重构时间线中，请稍候...
            </p>
          </div>
        )}

        {displayData && (!isLoading || isEditing) && (
          <article className="space-y-8 animate-fade-in-up pb-10">
            <div className="space-y-3">
              {isEditing ? (
                <input
                  type="text"
                  value={displayData.title}
                  onChange={(e) => onUpdateTitle(e.target.value)}
                  className="w-full text-3xl font-serif font-bold text-academia-gold bg-transparent border-b border-academia-gold/30 outline-none pb-1"
                  aria-label="大纲标题"
                />
              ) : (
                <h1 className="text-3xl font-serif font-bold text-academia-gold">
                  {displayData.title}
                </h1>
              )}
              {isEditing ? (
                <textarea
                  value={displayData.logline}
                  onChange={(e) => onUpdateLogline(e.target.value)}
                  className="w-full h-20 text-sm italic text-academia-muted bg-academia-surface border border-academia-border rounded p-2 outline-none mt-2"
                  aria-label="一句话故事核心"
                />
              ) : (
                <p className="text-sm italic text-academia-muted border-l-2 border-academia-gold pl-3">
                  {displayData.logline}
                </p>
              )}
            </div>

            <div className="space-y-6 pt-4">
              {displayData.acts.map((act, actIdx) => (
                <div key={actIdx} className="space-y-4">
                  <h4 className="text-lg font-serif text-academia-parchment border-b border-academia-border/50 pb-2">
                    第 {actIdx + 1} 幕：
                    {isEditing ? (
                      <input
                        type="text"
                        value={act.actTitle}
                        onChange={(e) => onUpdateActTitle(actIdx, e.target.value)}
                        className="bg-transparent border-b border-academia-border outline-none text-academia-parchment flex-1"
                        aria-label={`第 ${actIdx + 1} 幕标题`}
                      />
                    ) : (
                      act.actTitle
                    )}
                  </h4>
                  <div className="space-y-3 pl-4 border-l border-academia-border/50">
                    {act.scenes.map((scene, sceneIdx) => (
                      <div
                        key={scene.id || sceneIdx}
                        className={`border p-4 rounded-lg space-y-3 ${isEditing ? "bg-academia-surface/50 border-academia-gold/30" : "bg-[#1a1a18] border-academia-border"}`}
                      >
                        <div className="text-academia-gold font-bold text-xs">
                          场景 {scene.sceneNumber} 📍 {scene.location}
                        </div>
                        {isEditing ? (
                          <textarea
                            value={scene.plotAction}
                            onChange={(e) => onUpdateScene(actIdx, sceneIdx, "plotAction", e.target.value)}
                            className="w-full h-24 text-sm bg-academia-bg border border-academia-border rounded p-2 outline-none"
                            aria-label={`场景 ${scene.sceneNumber} 核心动作`}
                          />
                        ) : (
                          <p className="text-sm text-academia-parchment">{scene.plotAction}</p>
                        )}
                        <div className="text-xs pt-2 border-t border-academia-border/50 flex gap-2">
                          <span className="text-academia-gold/70">⚔️ 冲突：</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={scene.conflict}
                              onChange={(e) => onUpdateScene(actIdx, sceneIdx, "conflict", e.target.value)}
                              className="w-full text-academia-muted bg-transparent border-b border-academia-border outline-none"
                              aria-label={`场景 ${scene.sceneNumber} 冲突`}
                            />
                          ) : (
                            <span className="text-academia-muted">{scene.conflict}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}