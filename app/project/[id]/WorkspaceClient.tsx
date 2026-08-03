"use client";

import { useReducer, useMemo, useCallback } from "react";
import { generateOutlineAction } from "@/app/actions/generate";
import { updateOutlineAction, deleteOutlineAction } from "@/app/actions/outline";
import { saveDraftAction, getDraftsByOutlineAction } from "@/app/actions/draft";
import { generateSceneDraftAction } from "@/app/actions/generate-scene";
import type { OutlineRecord, Project, StoryOutline, Scene } from "@/lib/types";
import OutlineView from "./OutlineView";
import WritingView from "./WritingView";
import ReadingView from "./ReadingView";

// ==================== 类型定义 ====================

interface WorkspaceClientProps {
  project: Project;
  initialHistory: OutlineRecord[];
}

interface WorkspaceState {
  isLoading: boolean;
  error: string;
  history: OutlineRecord[];
  selectedIndex: number;
  isEditing: boolean;
  editedOutline: StoryOutline | null;
  isWritingMode: boolean;
  isReadingView: boolean;
  activeSceneId: string | null;
  draftsMap: Record<string, string>;
  isSavingDraft: boolean;
  isGeneratingScene: boolean;
  sceneWordCount: number;
  sceneStyle: string;
  sceneCustomNote: string;
  confirmingDelete: boolean;
}

type WorkspaceAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string }
  | { type: "ADD_TO_HISTORY"; payload: OutlineRecord }
  | { type: "REMOVE_FROM_HISTORY"; payload: number }
  | { type: "SET_SELECTED_INDEX"; payload: number }
  | { type: "START_EDITING" }
  | { type: "CANCEL_EDITING" }
  | { type: "UPDATE_EDITED_OUTLINE"; payload: StoryOutline }
  | { type: "SAVE_EDITING"; payload: OutlineRecord }
  | { type: "ENTER_WRITING_MODE"; payload: { draftsMap: Record<string, string>; activeSceneId: string } }
  | { type: "EXIT_WRITING_MODE" }
  | { type: "ENTER_READING_VIEW" }
  | { type: "EXIT_READING_VIEW" }
  | { type: "SET_ACTIVE_SCENE"; payload: string }
  | { type: "UPDATE_DRAFT"; payload: { sceneId: string; content: string } }
  | { type: "SET_SAVING_DRAFT"; payload: boolean }
  | { type: "SET_GENERATING_SCENE"; payload: boolean }
  | { type: "SET_SCENE_WORD_COUNT"; payload: number }
  | { type: "SET_SCENE_STYLE"; payload: string }
  | { type: "SET_SCENE_CUSTOM_NOTE"; payload: string }
  | { type: "ADD_ACT" }
  | { type: "REMOVE_ACT"; payload: number }
  | { type: "ADD_SCENE"; payload: number }
  | { type: "REMOVE_SCENE"; payload: { actIdx: number; sceneIdx: number } }
  | { type: "TOGGLE_DELETE_CONFIRM" };

// ==================== Reducer ====================

function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload, confirmingDelete: false };
    case "SET_ERROR":
      return { ...state, error: action.payload, confirmingDelete: false };
    case "ADD_TO_HISTORY":
      return { ...state, history: [action.payload, ...state.history], selectedIndex: 0, confirmingDelete: false };
    case "REMOVE_FROM_HISTORY":
      return {
        ...state,
        history: state.history.filter((_, i) => i !== action.payload),
        selectedIndex: 0,
        isEditing: false,
        confirmingDelete: false,
      };
    case "SET_SELECTED_INDEX":
      return { ...state, selectedIndex: action.payload, confirmingDelete: false };
    case "START_EDITING": {
      const current = state.history[state.selectedIndex];
      return {
        ...state,
        isEditing: true,
        confirmingDelete: false,
        editedOutline: current ? structuredClone(current.content) : null,
      };
    }
    case "CANCEL_EDITING":
      return { ...state, isEditing: false, editedOutline: null };
    case "UPDATE_EDITED_OUTLINE":
      return { ...state, editedOutline: action.payload };
    case "SAVE_EDITING": {
      const newHistory = [...state.history];
      newHistory[state.selectedIndex] = action.payload;
      return { ...state, history: newHistory, isEditing: false };
    }
    case "ENTER_WRITING_MODE":
      return {
        ...state,
        isWritingMode: true,
        draftsMap: action.payload.draftsMap,
        activeSceneId: action.payload.activeSceneId,
      };
    case "EXIT_WRITING_MODE":
      return { ...state, isWritingMode: false };
    case "ENTER_READING_VIEW":
      return { ...state, isReadingView: true };
    case "EXIT_READING_VIEW":
      return { ...state, isReadingView: false };
    case "SET_ACTIVE_SCENE":
      return { ...state, activeSceneId: action.payload };
    case "UPDATE_DRAFT":
      return {
        ...state,
        draftsMap: { ...state.draftsMap, [action.payload.sceneId]: action.payload.content },
      };
    case "SET_SAVING_DRAFT":
      return { ...state, isSavingDraft: action.payload };
    case "SET_GENERATING_SCENE":
      return { ...state, isGeneratingScene: action.payload };
    case "SET_SCENE_WORD_COUNT":
      return { ...state, sceneWordCount: action.payload };
    case "SET_SCENE_STYLE":
      return { ...state, sceneStyle: action.payload };
    case "SET_SCENE_CUSTOM_NOTE":
      return { ...state, sceneCustomNote: action.payload };
    case "ADD_ACT": {
      if (!state.editedOutline) return state;
      const newAct = {
        actTitle: "新幕",
        scenes: [{
          id: crypto.randomUUID(),
          sceneNumber: 1,
          location: "",
          plotAction: "",
          conflict: "",
          emotionalShift: "",
        }],
      };
      return {
        ...state,
        editedOutline: {
          ...state.editedOutline,
          acts: [...state.editedOutline.acts, newAct],
        },
      };
    }
    case "REMOVE_ACT": {
      if (!state.editedOutline) return state;
      const newActs = state.editedOutline.acts.filter((_, i) => i !== action.payload);
      return {
        ...state,
        editedOutline: { ...state.editedOutline, acts: newActs },
      };
    }
    case "ADD_SCENE": {
      if (!state.editedOutline) return state;
      const actIdx = action.payload;
      const act = state.editedOutline.acts[actIdx];
      if (!act) return state;
      const newScene = {
        id: crypto.randomUUID(),
        sceneNumber: act.scenes.length + 1,
        location: "",
        plotAction: "",
        conflict: "",
        emotionalShift: "",
      };
      const newActs = [...state.editedOutline.acts];
      newActs[actIdx] = { ...act, scenes: [...act.scenes, newScene] };
      return {
        ...state,
        editedOutline: { ...state.editedOutline, acts: newActs },
      };
    }
    case "REMOVE_SCENE": {
      if (!state.editedOutline) return state;
      const { actIdx, sceneIdx } = action.payload;
      const act = state.editedOutline.acts[actIdx];
      if (!act || act.scenes.length <= 1) return state;
      const newScenes = act.scenes.filter((_, i) => i !== sceneIdx);
      const newActs = [...state.editedOutline.acts];
      newActs[actIdx] = { ...act, scenes: newScenes };
      return {
        ...state,
        editedOutline: { ...state.editedOutline, acts: newActs },
      };
    }
    case "TOGGLE_DELETE_CONFIRM":
      return { ...state, confirmingDelete: !state.confirmingDelete };
    default:
      return state;
  }
}

// ==================== 初始状态 ====================

function createInitialState(initialHistory: OutlineRecord[]): WorkspaceState {
  return {
    isLoading: false,
    error: "",
    history: initialHistory,
    selectedIndex: 0,
    isEditing: false,
    editedOutline: null,
    isWritingMode: false,
    isReadingView: false,
    activeSceneId: null,
    draftsMap: {},
    isSavingDraft: false,
    isGeneratingScene: false,
    sceneWordCount: 1000,
    sceneStyle: "",
    sceneCustomNote: "",
    confirmingDelete: false,
  };
}

// ==================== 组件 ====================

export default function WorkspaceClient({ project, initialHistory }: WorkspaceClientProps) {
  const [state, dispatch] = useReducer(workspaceReducer, initialHistory, createInitialState);

  const currentRecord = state.history[state.selectedIndex];
  const currentOutline = currentRecord?.content ?? null;
  const displayData = state.isEditing ? state.editedOutline : currentOutline;

  const activeSceneInfo = useMemo<Scene | null>(
    () =>
      currentOutline?.acts
        .flatMap((a) => a.scenes)
        .find((s) => s.id === state.activeSceneId) ?? null,
    [currentOutline, state.activeSceneId]
  );

  // ==================== 大纲操作 ====================

  const handleGenerate = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: "" });
    dispatch({ type: "CANCEL_EDITING" });
    try {
      const res = await generateOutlineAction(project.id, project.fandom, project.characters, project.premise);
      if (res.success && res.data && res.outlineId) {
        dispatch({
          type: "ADD_TO_HISTORY",
          payload: {
            id: res.outlineId,
            content: res.data as StoryOutline,
            createdAt: new Date(),
            projectId: project.id,
            version: 1,
          },
        });
      } else {
        dispatch({ type: "SET_ERROR", payload: res.error || "灵感枯竭..." });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "网络异常。" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [project]);

  const handleDelete = useCallback(async () => {
    if (!currentRecord) return;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "TOGGLE_DELETE_CONFIRM" });
    try {
      const res = await deleteOutlineAction(currentRecord.id, project.id);
      if (res.success) {
        dispatch({ type: "REMOVE_FROM_HISTORY", payload: state.selectedIndex });
      } else {
        dispatch({ type: "SET_ERROR", payload: res.error || "删除失败" });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "网络异常。" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [currentRecord, project.id, state.selectedIndex]);

  const handleStartEditing = useCallback(() => {
    dispatch({ type: "START_EDITING" });
  }, []);

  const handleCancelEditing = useCallback(() => {
    dispatch({ type: "CANCEL_EDITING" });
  }, []);

  const handleSaveEditing = useCallback(async () => {
    if (!currentRecord || !state.editedOutline) return;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: "" });
    try {
      const res = await updateOutlineAction(currentRecord.id, state.editedOutline, project.id);
      if (res.success) {
        dispatch({
          type: "SAVE_EDITING",
          payload: { ...currentRecord, content: state.editedOutline },
        });
      } else {
        dispatch({ type: "SET_ERROR", payload: res.error || "保存失败" });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "网络异常。" });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [currentRecord, state.editedOutline, project.id]);

  const handleUpdateTitle = useCallback(
    (title: string) => {
      if (state.editedOutline) {
        dispatch({ type: "UPDATE_EDITED_OUTLINE", payload: { ...state.editedOutline, title } });
      }
    },
    [state.editedOutline]
  );

  const handleUpdateLogline = useCallback(
    (logline: string) => {
      if (state.editedOutline) {
        dispatch({ type: "UPDATE_EDITED_OUTLINE", payload: { ...state.editedOutline, logline } });
      }
    },
    [state.editedOutline]
  );

  const handleUpdateActTitle = useCallback(
    (actIdx: number, title: string) => {
      if (!state.editedOutline) return;
      const newActs = [...state.editedOutline.acts];
      newActs[actIdx] = { ...newActs[actIdx], actTitle: title };
      dispatch({ type: "UPDATE_EDITED_OUTLINE", payload: { ...state.editedOutline, acts: newActs } });
    },
    [state.editedOutline]
  );

  const handleUpdateScene = useCallback(
    (actIdx: number, sceneIdx: number, field: string, value: string) => {
      if (!state.editedOutline) return;
      const newActs = [...state.editedOutline.acts];
      const newScenes = [...newActs[actIdx].scenes];
      newScenes[sceneIdx] = { ...newScenes[sceneIdx], [field]: value };
      newActs[actIdx] = { ...newActs[actIdx], scenes: newScenes };
      dispatch({ type: "UPDATE_EDITED_OUTLINE", payload: { ...state.editedOutline, acts: newActs } });
    },
    [state.editedOutline]
  );

  // ==================== 执笔模式操作 ====================

  const handleEnterWritingMode = useCallback(async () => {
    if (!currentRecord || !currentOutline) return;
    try {
      const drafts = await getDraftsByOutlineAction(currentRecord.id);
      const map: Record<string, string> = {};
      drafts.forEach((d) => {
        map[d.sceneId] = d.content;
      });
      const firstSceneId = currentOutline.acts[0]?.scenes[0]?.id;
      if (firstSceneId) {
        dispatch({
          type: "ENTER_WRITING_MODE",
          payload: { draftsMap: map, activeSceneId: firstSceneId },
        });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "拉取正文记录失败" });
    }
  }, [currentRecord, currentOutline]);

  const handleExitWritingMode = useCallback(() => {
    dispatch({ type: "EXIT_WRITING_MODE" });
  }, []);

  const handleSelectScene = useCallback((sceneId: string) => {
    dispatch({ type: "SET_ACTIVE_SCENE", payload: sceneId });
  }, []);

  const handleDraftChange = useCallback((content: string) => {
    if (!state.activeSceneId) return;
    dispatch({
      type: "UPDATE_DRAFT",
      payload: { sceneId: state.activeSceneId, content },
    });
  }, [state.activeSceneId]);

  const handleSaveDraft = useCallback(async () => {
    if (!state.activeSceneId || !currentRecord) return;
    dispatch({ type: "SET_SAVING_DRAFT", payload: true });
    try {
      await saveDraftAction(project.id, currentRecord.id, state.activeSceneId, state.draftsMap[state.activeSceneId] || "");
    } catch {
      dispatch({ type: "SET_ERROR", payload: "保存正文失败" });
    } finally {
      dispatch({ type: "SET_SAVING_DRAFT", payload: false });
    }
  }, [project.id, currentRecord, state.activeSceneId, state.draftsMap]);

  const handleSaveAllDrafts = useCallback(async () => {
    if (!currentRecord) return;
    dispatch({ type: "SET_SAVING_DRAFT", payload: true });
    try {
      const entries = Object.entries(state.draftsMap).filter(([, content]) => content);
      await Promise.all(
        entries.map(([sceneId, content]) =>
          saveDraftAction(project.id, currentRecord.id, sceneId, content)
        )
      );
    } catch {
      dispatch({ type: "SET_ERROR", payload: "保存正文失败" });
    } finally {
      dispatch({ type: "SET_SAVING_DRAFT", payload: false });
    }
  }, [project.id, currentRecord, state.draftsMap]);

  const handleGenerateScene = useCallback(async () => {
    if (!activeSceneInfo || !state.activeSceneId || !currentRecord) return;
    dispatch({ type: "SET_GENERATING_SCENE", payload: true });
    try {
      const res = await generateSceneDraftAction(project.fandom, project.characters, project.premise, {
        sceneNumber: activeSceneInfo.sceneNumber,
        location: activeSceneInfo.location,
        plotAction: activeSceneInfo.plotAction,
        conflict: activeSceneInfo.conflict,
        emotionalShift: activeSceneInfo.emotionalShift,
        wordCount: state.sceneWordCount || undefined,
        style: state.sceneStyle || undefined,
        customNote: state.sceneCustomNote || undefined,
      });
      if (res.success && res.text) {
        dispatch({
          type: "UPDATE_DRAFT",
          payload: { sceneId: state.activeSceneId, content: res.text },
        });
      } else {
        dispatch({ type: "SET_ERROR", payload: res.error || "生成失败" });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "网络异常，无法连接大模型。" });
    } finally {
      dispatch({ type: "SET_GENERATING_SCENE", payload: false });
    }
  }, [project, currentRecord, activeSceneInfo, state.activeSceneId, state.sceneWordCount, state.sceneStyle, state.sceneCustomNote]);

  const handleSceneWordCountChange = useCallback((count: number) => {
    dispatch({ type: "SET_SCENE_WORD_COUNT", payload: count });
  }, []);

  const handleSceneStyleChange = useCallback((style: string) => {
    dispatch({ type: "SET_SCENE_STYLE", payload: style });
  }, []);

  const handleSceneCustomNoteChange = useCallback((note: string) => {
    dispatch({ type: "SET_SCENE_CUSTOM_NOTE", payload: note });
  }, []);

  const handleAddAct = useCallback(() => {
    dispatch({ type: "ADD_ACT" });
  }, []);

  const handleRemoveAct = useCallback((actIdx: number) => {
    dispatch({ type: "REMOVE_ACT", payload: actIdx });
  }, []);

  const handleAddScene = useCallback((actIdx: number) => {
    dispatch({ type: "ADD_SCENE", payload: actIdx });
  }, []);

  const handleRemoveScene = useCallback((actIdx: number, sceneIdx: number) => {
    dispatch({ type: "REMOVE_SCENE", payload: { actIdx, sceneIdx } });
  }, []);

  const handleToggleDeleteConfirm = useCallback(() => {
    dispatch({ type: "TOGGLE_DELETE_CONFIRM" });
  }, []);

  const handleEnterReadingView = useCallback(() => {
    dispatch({ type: "ENTER_READING_VIEW" });
  }, []);

  const handleExitReadingView = useCallback(() => {
    dispatch({ type: "EXIT_READING_VIEW" });
  }, []);

  // ==================== 渲染 ====================

  if (state.isReadingView && currentOutline) {
    return (
      <ReadingView
        outline={currentOutline}
        draftsMap={state.draftsMap}
        onBackToWriting={handleExitReadingView}
      />
    );
  }

  if (state.isWritingMode && currentOutline) {
    return (
      <WritingView
        outline={currentOutline}
        error={state.error}
        activeSceneId={state.activeSceneId}
        draftsMap={state.draftsMap}
        isSavingDraft={state.isSavingDraft}
        isGeneratingScene={state.isGeneratingScene}
        activeSceneInfo={activeSceneInfo}
        onSelectScene={handleSelectScene}
        onDraftChange={handleDraftChange}
        onSaveDraft={handleSaveDraft}
        onSaveAllDrafts={handleSaveAllDrafts}
        onGenerateScene={handleGenerateScene}
        onExitWritingMode={handleExitWritingMode}
        onEnterReadingView={handleEnterReadingView}
        sceneWordCount={state.sceneWordCount}
        sceneStyle={state.sceneStyle}
        sceneCustomNote={state.sceneCustomNote}
        onSceneWordCountChange={handleSceneWordCountChange}
        onSceneStyleChange={handleSceneStyleChange}
        onSceneCustomNoteChange={handleSceneCustomNoteChange}
      />
    );
  }

  return (
    <OutlineView
      project={project}
      isLoading={state.isLoading}
      error={state.error}
      history={state.history}
      selectedIndex={state.selectedIndex}
      isEditing={state.isEditing}
      editedOutline={state.editedOutline}
      displayData={displayData}
      onSelectVersion={(index) => dispatch({ type: "SET_SELECTED_INDEX", payload: index })}
      onGenerate={handleGenerate}
      onDelete={handleDelete}
      onToggleDeleteConfirm={handleToggleDeleteConfirm}
      confirmingDelete={state.confirmingDelete}
      onStartEditing={handleStartEditing}
      onCancelEditing={handleCancelEditing}
      onSaveEditing={handleSaveEditing}
      onEnterWritingMode={handleEnterWritingMode}
      onAddAct={handleAddAct}
      onRemoveAct={handleRemoveAct}
      onAddScene={handleAddScene}
      onRemoveScene={handleRemoveScene}
      onUpdateTitle={handleUpdateTitle}
      onUpdateLogline={handleUpdateLogline}
      onUpdateActTitle={handleUpdateActTitle}
      onUpdateScene={handleUpdateScene}
    />
  );
}