"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { generateOutlineAction } from "@/app/actions/generate";
import { updateOutlineAction, deleteOutlineAction } from "@/app/actions/outline";
import { saveDraftAction, getDraftsByOutlineAction } from "@/app/actions/draft";
import { generateSceneDraftAction } from "@/app/actions/generate-scene";

export default function WorkspaceClient({ project, initialHistory }: { project: any; initialHistory: any[] }) {
  // --- 大纲状态 ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<any[]>(initialHistory);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutline, setEditedOutline] = useState<any>(null);

  const currentRecord = history[selectedIndex];
  const currentOutline = currentRecord?.content ?? null;
  const displayData = isEditing ? editedOutline : currentOutline;

  // --- 执笔模式状态 ---
  const [isWritingMode, setIsWritingMode] = useState(false);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [draftsMap, setDraftsMap] = useState<Record<string, string>>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);

  const activeSceneInfo = useMemo(
    () =>
      currentOutline?.acts
        .flatMap((a: any) => a.scenes)
        .find((s: any) => s.id === activeSceneId) ?? null,
    [currentOutline, activeSceneId]
  );

  // --- 大纲操作 ---
  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setIsEditing(false);
    try {
      const res = await generateOutlineAction(project.id, project.fandom, project.characters, project.premise);
      if (res.success) {
        const newRecord = { id: res.outlineId, content: res.data, createdAt: new Date() };
        setHistory((prev: any[]) => [newRecord, ...prev]);
        setSelectedIndex(0);
      } else {
        setError(res.error || "灵感枯竭...");
      }
    } catch (e) {
      setError("网络异常。");
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  const handleDelete = useCallback(async () => {
    if (!currentRecord) return;
    if (!confirm("确定要彻底销毁这个时间线分支吗？")) return;
    setIsLoading(true);
    try {
      const res = await deleteOutlineAction(currentRecord.id, project.id);
      if (res.success) {
        setHistory((prev: any[]) => prev.filter((_, idx) => idx !== selectedIndex));
        setSelectedIndex(0);
        setIsEditing(false);
      } else {
        setError(res.error || "删除失败");
      }
    } catch (e) {
      setError("网络异常。");
    } finally {
      setIsLoading(false);
    }
  }, [currentRecord, project.id, selectedIndex]);

  const startEditing = useCallback(() => {
    if (currentOutline) {
      setEditedOutline(JSON.parse(JSON.stringify(currentOutline)));
      setIsEditing(true);
    }
  }, [currentOutline]);

  const cancelEditing = useCallback(() => {
    setEditedOutline(null);
    setIsEditing(false);
  }, []);

  const saveEditing = useCallback(async () => {
    if (!currentRecord || !editedOutline) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await updateOutlineAction(currentRecord.id, editedOutline, project.id);
      if (res.success) {
        const newHistory = [...history];
        // @ts-ignore
        newHistory[selectedIndex] = { ...currentRecord, content: editedOutline };
        setHistory(newHistory);
        setIsEditing(false);
      } else {
        setError(res.error || "保存失败");
      }
    } catch (e) {
      setError("网络异常。");
    } finally {
      setIsLoading(false);
    }
  }, [currentRecord, editedOutline, project.id, history, selectedIndex]);

  const updateActScene = useCallback((actIdx: number, sceneIdx: number, field: string, value: string) => {
    if (!editedOutline) return;
    const newData = { ...editedOutline };
    const acts = [...newData.acts];
    const scenes = [...acts[actIdx].scenes];
    scenes[sceneIdx] = { ...scenes[sceneIdx], [field]: value };
    acts[actIdx] = { ...acts[actIdx], scenes };
    setEditedOutline({ ...newData, acts });
  }, [editedOutline]);

  // --- 执笔模式操作 ---
  const enterWritingMode = useCallback(async () => {
    if (!currentRecord || !currentOutline) return;
    try {
      const drafts = await getDraftsByOutlineAction(currentRecord.id);
      const map: Record<string, string> = {};
      drafts.forEach((d: any) => { map[d.sceneId] = d.content; });
      setDraftsMap(map);
      if (currentOutline.acts[0].scenes[0].id) {
        setActiveSceneId(currentOutline.acts[0].scenes[0].id);
      }
      setIsWritingMode(true);
    } catch (e) {
      setError("拉取正文记录失败");
    }
  }, [currentRecord, currentOutline]);

  const exitWritingMode = useCallback(() => setIsWritingMode(false), []);

  const handleDraftChange = useCallback((content: string) => {
    const sceneId = activeSceneId;
    if (!sceneId) return;
    setDraftsMap((prev) => ({ ...prev, [sceneId]: content } as Record<string, string>));
  }, [activeSceneId]);

  const saveCurrentDraft = useCallback(async () => {
    const sceneId = activeSceneId;
    if (!sceneId || !currentRecord) return;
    setIsSavingDraft(true);
    try {
      await saveDraftAction(project.id, currentRecord.id, sceneId, draftsMap[sceneId] || "");
    } catch (e) {
      setError("保存正文失败");
    } finally {
      setIsSavingDraft(false);
    }
  }, [project.id, currentRecord, activeSceneId, draftsMap]);

  const handleGenerateScene = useCallback(async () => {
    const sceneId = activeSceneId;
    if (!activeSceneInfo || !sceneId || !currentRecord) return;
    setIsGeneratingScene(true);
    try {
      const res = await generateSceneDraftAction(project.fandom, project.characters, project.premise, {
        sceneNumber: activeSceneInfo.sceneNumber,
        location: activeSceneInfo.location,
        plotAction: activeSceneInfo.plotAction,
        conflict: activeSceneInfo.conflict,
        emotionalShift: activeSceneInfo.emotionalShift,
      });
      if (res.success) {
        setDraftsMap((prev) => ({ ...prev, [sceneId]: res.text } as Record<string, string>));
      } else {
        setError(res.error || "生成失败");
      }
    } catch (e) {
      setError("网络异常，无法连接大模型。");
    } finally {
      setIsGeneratingScene(false);
    }
  }, [project, currentRecord, activeSceneInfo, activeSceneId]);

  // --- 渲染：执笔模式 ---
  if (isWritingMode && currentOutline) {
    return (
      <div className="w-full h-full flex flex-col space-y-4 animate-fade-in-up">
        {error && <div className="mb-4 p-3 bg-academia-crimson/10 border border-academia-crimson/30 rounded-lg text-xs text-academia-crimson">{error}</div>}
        <div className="flex justify-between items-center border-b border-academia-border pb-4">
          <div>
            <h2 className="text-xl font-serif text-academia-gold font-bold">正文执笔模式</h2>
            <p className="text-xs text-academia-muted">定稿：{currentOutline.title}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-academia-muted">{isSavingDraft ? "保存中..." : "已同步至命运石之门"}</span>
            <button onClick={saveCurrentDraft} className="text-xs bg-academia-surface border border-academia-border text-academia-parchment px-3 py-1.5 rounded hover:border-academia-gold transition-all">手动保存当前幕</button>
            <button onClick={exitWritingMode} className="text-xs bg-academia-crimson/10 text-academia-crimson border border-academia-crimson/30 px-3 py-1.5 rounded hover:bg-academia-crimson hover:text-white transition-all">退出执笔</button>
          </div>
        </div>

        <div className="flex-1 flex gap-6 h-[600px]">
          <div className="w-1/3 border-r border-academia-border/50 pr-4 overflow-y-auto custom-scrollbar space-y-6 pb-10">
            {currentOutline.acts.map((act: any, actIdx: number) => (
              <div key={actIdx} className="space-y-2">
                <h3 className="text-sm font-bold text-academia-muted uppercase tracking-widest border-b border-academia-border/50 pb-1">第 {actIdx + 1} 幕：{act.actTitle}</h3>
                <div className="space-y-2">
                  {act.scenes.map((scene: any) => (
                    <button
                      key={scene.id}
                      onClick={() => setActiveSceneId(scene.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs space-y-1 ${activeSceneId === scene.id ? "bg-academia-surface border-academia-gold shadow-[0_0_10px_rgba(193,156,92,0.15)]" : "bg-transparent border-transparent hover:border-academia-border hover:bg-academia-surface/50"}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-bold ${activeSceneId === scene.id ? "text-academia-gold" : "text-academia-parchment"}`}>场景 {scene.sceneNumber}</span>
                        {draftsMap[scene.id] && draftsMap[scene.id].length > 0 && <span className="text-[10px] text-green-600/80">已动笔</span>}
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
                    <span className="text-xs font-bold text-academia-gold">当前锚点：场景 {activeSceneInfo.sceneNumber} - {activeSceneInfo.location}</span>
                    <span className="text-xs text-academia-muted">情绪：{activeSceneInfo.emotionalShift}</span>
                  </div>
                  <p className="text-sm text-academia-parchment">{activeSceneInfo.plotAction}</p>
                  <p className="text-xs text-academia-muted border-t border-academia-border/50 pt-2">⚔️ 冲突：{activeSceneInfo.conflict}</p>
                </div>

                <div className="flex-1 flex flex-col relative">
                  <textarea
                    value={draftsMap[activeSceneId || ""] || ""}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onBlur={saveCurrentDraft}
                    placeholder="开始执笔，或者召唤 AI 辅助撰写本段场景..."
                    className="w-full h-full resize-none bg-academia-bg border border-academia-border rounded-lg p-6 text-sm text-academia-parchment leading-loose outline-none focus:border-academia-gold/50 transition-colors custom-scrollbar"
                  />
                  <button
                    onClick={handleGenerateScene}
                    disabled={isGeneratingScene}
                    className={`absolute bottom-4 right-6 px-4 py-2 rounded-md text-xs font-bold shadow-[0_0_15px_rgba(193,156,92,0.3)] transition-all ${isGeneratingScene ? "bg-academia-surface text-academia-muted cursor-not-allowed border border-academia-border" : "bg-academia-gold text-academia-bg hover:opacity-90"}`}
                  >
                    {isGeneratingScene ? "✨ 蘸墨构思中..." : "✨ 召唤 AI 执笔此场景"}
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-academia-muted">请在左侧选择一个场景。</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- 渲染：大纲模式 ---
  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {error && <div className="mb-4 p-3 bg-academia-crimson/10 border border-academia-crimson/30 rounded-lg text-xs text-academia-crimson">{error}</div>}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-academia-border pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-serif text-academia-parchment">大纲推演台</h2>
          {history.length > 0 && !isEditing && (
            <select value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))} disabled={isLoading} className="bg-academia-surface border border-academia-border text-xs text-academia-muted rounded-md px-2 py-1 outline-none focus:border-academia-gold/50 cursor-pointer">
              {Array.from({ length: history.length }).map((_, idx) => (
                <option key={idx} value={idx}>版本 {history.length - idx}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && !isEditing && (
            <>
              <button onClick={startEditing} disabled={isLoading} className="text-xs text-academia-muted hover:text-academia-parchment px-3 py-2 transition-colors border border-transparent hover:border-academia-border rounded">编辑</button>
              <button onClick={handleDelete} disabled={isLoading} className="text-xs text-academia-crimson hover:text-red-400 px-3 py-2 transition-colors border border-transparent hover:border-academia-crimson/30 rounded">销毁</button>
              <span className="w-px h-4 bg-academia-border mx-2"></span>
              <button onClick={enterWritingMode} disabled={isLoading} className="bg-academia-parchment text-academia-bg px-4 py-2 rounded-md text-xs font-bold hover:bg-academia-gold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2">🖋️ 锁定此版并执笔</button>
            </>
          )}
          {isEditing ? (
            <>
              <button onClick={cancelEditing} disabled={isLoading} className="text-xs text-academia-muted px-4 py-2">取消</button>
              <button onClick={saveEditing} disabled={isLoading} className="bg-academia-gold text-academia-bg px-5 py-2 rounded-md text-xs font-bold">保存修改</button>
            </>
          ) : (
            <button onClick={handleGenerate} disabled={isLoading} className="bg-academia-surface border border-academia-border text-academia-gold px-5 py-2 rounded-md text-xs font-bold hover:bg-academia-gold/10 ml-2">{isLoading ? "高维运算中..." : history.length > 0 ? "分支重摇" : "首次推演大纲"}</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {!displayData && !isLoading && (
          <div className="w-full h-64 flex items-center justify-center text-academia-muted text-sm font-serif">点击右上角按钮，基于全局档案生成故事架构...</div>
        )}

        {isLoading && !isEditing && (
          <div className="w-full h-64 flex flex-col items-center justify-center space-y-4 animate-breathe">
            <div className="w-8 h-8 border-2 border-academia-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-academia-muted text-xs tracking-widest uppercase">重构时间线中，请稍候...</p>
          </div>
        )}

        {displayData && (!isLoading || isEditing) && (
          <article className="space-y-8 animate-fade-in-up pb-10">
            <div className="space-y-3">
              {isEditing ? (
                <input type="text" value={displayData.title} onChange={(e) => setEditedOutline({ ...editedOutline, title: e.target.value })} className="w-full text-3xl font-serif font-bold text-academia-gold bg-transparent border-b border-academia-gold/30 outline-none pb-1" />
              ) : (
                <h1 className="text-3xl font-serif font-bold text-academia-gold">{displayData.title}</h1>
              )}
              {isEditing ? (
                <textarea value={displayData.logline} onChange={(e) => setEditedOutline({ ...editedOutline, logline: e.target.value })} className="w-full h-20 text-sm italic text-academia-muted bg-academia-surface border border-academia-border rounded p-2 outline-none mt-2" />
              ) : (
                <p className="text-sm italic text-academia-muted border-l-2 border-academia-gold pl-3">{displayData.logline}</p>
              )}
            </div>

            <div className="space-y-6 pt-4">
              {displayData.acts.map((act: any, actIdx: number) => (
                <div key={actIdx} className="space-y-4">
                  <h4 className="text-lg font-serif text-academia-parchment border-b border-academia-border/50 pb-2">
                    第 {actIdx + 1} 幕：{isEditing ? (
                      <input type="text" value={act.actTitle} onChange={(e) => { const newActs = [...editedOutline.acts]; newActs[actIdx] = { ...newActs[actIdx], actTitle: e.target.value }; setEditedOutline({ ...editedOutline, acts: newActs }); }} className="bg-transparent border-b border-academia-border outline-none text-academia-parchment flex-1" />
                    ) : (act.actTitle)}
                  </h4>
                  <div className="space-y-3 pl-4 border-l border-academia-border/50">
                    {act.scenes.map((scene: any, sceneIdx: number) => (
                      <div key={scene.id || sceneIdx} className={`border p-4 rounded-lg space-y-3 ${isEditing ? "bg-academia-surface/50 border-academia-gold/30" : "bg-[#1a1a18] border-academia-border"}`}>
                        <div className="text-academia-gold font-bold text-xs">场景 {scene.sceneNumber} 📍 {scene.location}</div>
                        {isEditing ? (
                          <textarea value={scene.plotAction} onChange={(e) => updateActScene(actIdx, sceneIdx, "plotAction", e.target.value)} className="w-full h-24 text-sm bg-academia-bg border border-academia-border rounded p-2 outline-none" />
                        ) : (
                          <p className="text-sm text-academia-parchment">{scene.plotAction}</p>
                        )}
                        <div className="text-xs pt-2 border-t border-academia-border/50 flex gap-2">
                          <span className="text-academia-gold/70">⚔️ 冲突：</span>
                          {isEditing ? (
                            <input type="text" value={scene.conflict} onChange={(e) => updateActScene(actIdx, sceneIdx, "conflict", e.target.value)} className="w-full text-academia-muted bg-transparent border-b border-academia-border outline-none" />
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