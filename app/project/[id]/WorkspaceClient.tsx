"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWorkspaceStore, useCurrentOutline, useDisplayData, useActiveSceneInfo } from "@/lib/workspace-store";
import type { OutlineRecord, Project } from "@/lib/types";
import OutlineView from "./OutlineView";
import WritingView from "./WritingView";
import ReadingView from "./ReadingView";

// ==================== 类型定义 ====================

interface WorkspaceClientProps {
  project: Project;
  initialHistory: OutlineRecord[];
  activeOutlineId: string | null;
}

// ==================== 组件 ====================

export default function WorkspaceClient({ project, initialHistory, activeOutlineId }: WorkspaceClientProps) {
  const init = useWorkspaceStore((s) => s.init);

  useEffect(() => {
    init(project, initialHistory, activeOutlineId);
  }, [project, initialHistory, init, activeOutlineId]);

  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const error = useWorkspaceStore((s) => s.error);
  const history = useWorkspaceStore((s) => s.history);
  const selectedIndex = useWorkspaceStore((s) => s.selectedIndex);
  const isEditing = useWorkspaceStore((s) => s.isEditing);
  const editedOutline = useWorkspaceStore((s) => s.editedOutline);
  const isWritingMode = useWorkspaceStore((s) => s.isWritingMode);
  const isReadingView = useWorkspaceStore((s) => s.isReadingView);
  const activeSceneId = useWorkspaceStore((s) => s.activeSceneId);
  const draftsMap = useWorkspaceStore((s) => s.draftsMap);
  const isSavingDraft = useWorkspaceStore((s) => s.isSavingDraft);
  const isGeneratingScene = useWorkspaceStore((s) => s.isGeneratingScene);
  const isTyping = useWorkspaceStore((s) => s.isTyping);
  const sceneWordCount = useWorkspaceStore((s) => s.sceneWordCount);
  const sceneStyle = useWorkspaceStore((s) => s.sceneStyle);
  const sceneCustomNote = useWorkspaceStore((s) => s.sceneCustomNote);
  const confirmingDelete = useWorkspaceStore((s) => s.confirmingDelete);
  const editorReview = useWorkspaceStore((s) => s.editorReview);
  const generatingPhase = useWorkspaceStore((s) => s.generatingPhase);

  const currentOutline = useCurrentOutline();
  const displayData = useDisplayData();
  const activeSceneInfo = useActiveSceneInfo();

  const setSelectedIndex = useWorkspaceStore((s) => s.setSelectedIndex);
  const startEditing = useWorkspaceStore((s) => s.startEditing);
  const cancelEditing = useWorkspaceStore((s) => s.cancelEditing);
  const updateTitle = useWorkspaceStore((s) => s.updateTitle);
  const updateLogline = useWorkspaceStore((s) => s.updateLogline);
  const updateActTitle = useWorkspaceStore((s) => s.updateActTitle);
  const updateScene = useWorkspaceStore((s) => s.updateScene);
  const addAct = useWorkspaceStore((s) => s.addAct);
  const removeAct = useWorkspaceStore((s) => s.removeAct);
  const addScene = useWorkspaceStore((s) => s.addScene);
  const removeScene = useWorkspaceStore((s) => s.removeScene);
  const toggleDeleteConfirm = useWorkspaceStore((s) => s.toggleDeleteConfirm);
  const setActiveScene = useWorkspaceStore((s) => s.setActiveScene);
  const updateDraft = useWorkspaceStore((s) => s.updateDraft);
  const setSceneWordCount = useWorkspaceStore((s) => s.setSceneWordCount);
  const setSceneStyle = useWorkspaceStore((s) => s.setSceneStyle);
  const setSceneCustomNote = useWorkspaceStore((s) => s.setSceneCustomNote);

  const generateOutline = useWorkspaceStore((s) => s.generateOutline);
  const deleteOutline = useWorkspaceStore((s) => s.deleteOutline);
  const saveEditing = useWorkspaceStore((s) => s.saveEditing);
  const enterWritingMode = useWorkspaceStore((s) => s.enterWritingMode);
  const exitWritingMode = useWorkspaceStore((s) => s.exitWritingMode);
  const enterReadingView = useWorkspaceStore((s) => s.enterReadingView);
  const exitReadingView = useWorkspaceStore((s) => s.exitReadingView);
  const saveDraft = useWorkspaceStore((s) => s.saveDraft);
  const saveAllDrafts = useWorkspaceStore((s) => s.saveAllDrafts);
  const generateScene = useWorkspaceStore((s) => s.generateScene);
  const stopTyping = useWorkspaceStore((s) => s.stopTyping);

  // ==================== 自动保存 ====================

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
    if (currentContent && isWritingMode) {
      autoSaveTimerRef.current = setTimeout(() => {
        saveDraft();
      }, 30_000);
    }
    return clearAutoSaveTimer;
  }, [currentContent, activeSceneId, clearAutoSaveTimer, saveDraft, isWritingMode]);

  useEffect(() => {
    return () => clearAutoSaveTimer();
  }, [clearAutoSaveTimer]);

  // ==================== 渲染 ====================

  if (isReadingView && currentOutline) {
    return (
      <ReadingView
        outline={currentOutline}
        draftsMap={draftsMap}
        onBackToWriting={exitReadingView}
      />
    );
  }

  if (isWritingMode && currentOutline) {
    return (
      <WritingView
        outline={currentOutline}
        error={error}
        activeSceneId={activeSceneId}
        draftsMap={draftsMap}
        isSavingDraft={isSavingDraft}
        isGeneratingScene={isGeneratingScene}
        isTyping={isTyping}
        activeSceneInfo={activeSceneInfo}
        editorReview={editorReview}
        onSelectScene={setActiveScene}
        onDraftChange={(content) => {
          if (activeSceneId) updateDraft(activeSceneId, content);
        }}
        onSaveDraft={saveDraft}
        onSaveAllDrafts={saveAllDrafts}
        onGenerateScene={generateScene}
        onStopTyping={stopTyping}
        onExitWritingMode={exitWritingMode}
        onEnterReadingView={enterReadingView}
        sceneWordCount={sceneWordCount}
        sceneStyle={sceneStyle}
        sceneCustomNote={sceneCustomNote}
        onSceneWordCountChange={setSceneWordCount}
        onSceneStyleChange={setSceneStyle}
        onSceneCustomNoteChange={setSceneCustomNote}
        generatingPhase={generatingPhase}
      />
    );
  }

  return (
    <OutlineView
      project={project}
      isLoading={isLoading}
      error={error}
      history={history}
      selectedIndex={selectedIndex}
      isEditing={isEditing}
      editedOutline={editedOutline}
      displayData={displayData}
      onSelectVersion={setSelectedIndex}
      onGenerate={generateOutline}
      onDelete={deleteOutline}
      onToggleDeleteConfirm={toggleDeleteConfirm}
      confirmingDelete={confirmingDelete}
      onStartEditing={startEditing}
      onCancelEditing={cancelEditing}
      onSaveEditing={saveEditing}
      onEnterWritingMode={enterWritingMode}
      onAddAct={addAct}
      onRemoveAct={removeAct}
      onAddScene={addScene}
      onRemoveScene={removeScene}
      onUpdateTitle={updateTitle}
      onUpdateLogline={updateLogline}
      onUpdateActTitle={updateActTitle}
      onUpdateScene={updateScene}
    />
  );
}