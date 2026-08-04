"use client";

import type { OutlineRecord, Project, StoryOutline } from "@/lib/types";
import OutlineSwitcher from "./OutlineSwitcher";

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
  onToggleDeleteConfirm: () => void;
  confirmingDelete: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onEnterWritingMode: () => void;
  onAddAct: () => void;
  onRemoveAct: (actIdx: number) => void;
  onAddScene: (actIdx: number) => void;
  onRemoveScene: (actIdx: number, sceneIdx: number) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateLogline: (logline: string) => void;
  onUpdateActTitle: (actIdx: number, title: string) => void;
  onUpdateScene: (actIdx: number, sceneIdx: number, field: string, value: string) => void;
}

export default function OutlineView({
  project,
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
  onToggleDeleteConfirm,
  confirmingDelete,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onEnterWritingMode,
  onAddAct,
  onRemoveAct,
  onAddScene,
  onRemoveScene,
  onUpdateTitle,
  onUpdateLogline,
  onUpdateActTitle,
  onUpdateScene,
}: OutlineViewProps) {
  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {error && (
        <div className="p-3 bg-academia-crimson/10 border border-academia-crimson/30 rounded-lg text-xs text-academia-crimson">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-academia-border pb-4 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-serif text-academia-parchment">大纲推演台</h2>
          {history.length > 1 && !isEditing && (
            <OutlineSwitcher
              projectId={project.id}
              activeOutlineId={history[selectedIndex]?.id ?? null}
              outlines={history}
              onSelectVersion={onSelectVersion}
            />
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
              {confirmingDelete ? (
                <>
                  <button
                    onClick={onToggleDeleteConfirm}
                    disabled={isLoading}
                    className="text-xs text-academia-muted px-3 py-2 transition-colors border border-academia-border rounded hover:text-academia-parchment"
                  >
                    取消
                  </button>
                  <button
                    onClick={onDelete}
                    disabled={isLoading}
                    className="text-xs bg-academia-crimson text-white px-3 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    确认销毁
                  </button>
                </>
              ) : (
                <button
                  onClick={onToggleDeleteConfirm}
                  disabled={isLoading}
                  className="text-xs text-academia-crimson hover:text-red-400 px-3 py-2 transition-colors border border-transparent hover:border-academia-crimson/30 rounded"
                >
                  销毁
                </button>
              )}
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
          {isEditing && (
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
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-w-0">
          {!displayData && !isLoading && (
            <div className="w-full h-64 flex items-center justify-center text-academia-muted text-sm font-serif">
              点击右侧面板，基于全局档案生成故事架构...
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
                    <div className="flex items-center gap-2 group">
                      <h4 className="text-lg font-serif text-academia-parchment border-b border-academia-border/50 pb-2 flex-1">
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
                      {isEditing && (
                        <div className="flex gap-1 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onAddScene(actIdx)}
                            className="text-[10px] text-academia-gold hover:text-academia-parchment border border-academia-gold/30 hover:border-academia-gold/60 rounded px-2 py-0.5 transition-colors"
                            title="添加场景"
                          >
                            + 场景
                          </button>
                          <button
                            onClick={() => onRemoveAct(actIdx)}
                            className="text-[10px] text-academia-crimson hover:text-red-400 border border-academia-crimson/30 hover:border-academia-crimson/60 rounded px-2 py-0.5 transition-colors"
                            title="删除此幕"
                          >
                            × 幕
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 pl-4 border-l border-academia-border/50">
                      {act.scenes.map((scene, sceneIdx) => (
                        <div
                          key={scene.id || sceneIdx}
                          className={`border p-4 rounded-lg space-y-3 group/scene ${isEditing ? "bg-academia-surface/50 border-academia-gold/30" : "bg-academia-surface border-academia-border"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-academia-gold font-bold text-xs">
                              场景 {scene.sceneNumber} 📍 {scene.location}
                            </div>
                            {isEditing && (
                              <button
                                onClick={() => onRemoveScene(actIdx, sceneIdx)}
                                className="text-[10px] text-academia-crimson/50 hover:text-academia-crimson opacity-0 group-hover/scene:opacity-100 transition-all border border-transparent hover:border-academia-crimson/30 rounded px-1.5 py-0.5"
                                title="删除此场景"
                              >
                                ×
                              </button>
                            )}
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
                      {isEditing && act.scenes.length > 0 && (
                        <div className="pt-1">
                          <button
                            onClick={() => onAddScene(actIdx)}
                            className="text-[10px] text-academia-muted hover:text-academia-gold border border-dashed border-academia-border hover:border-academia-gold/50 rounded px-3 py-1.5 transition-colors w-full"
                          >
                            + 添加场景
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isEditing && (
                  <button
                    onClick={onAddAct}
                    className="w-full border border-dashed border-academia-border hover:border-academia-gold/50 text-academia-muted hover:text-academia-gold rounded-lg py-3 text-xs transition-colors"
                  >
                    + 添加新幕
                  </button>
                )}
              </div>
            </article>
          )}
        </div>

        <aside className="w-64 shrink-0">
          <div className="sticky top-0 bg-academia-surface border border-academia-border rounded-xl p-5">
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="w-full bg-academia-gold/10 border border-academia-gold/30 text-academia-gold px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-academia-gold/20 transition-all"
            >
              {isLoading ? "高维运算中..." : history.length > 0 ? "分支重摇" : "首次推演大纲"}
            </button>
            <p className="text-[10px] text-academia-muted/50 mt-3 text-center leading-relaxed">
              AI 生成大纲后，点击"编辑"可自由增删幕与场景
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}