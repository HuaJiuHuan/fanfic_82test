import { create } from 'zustand';
import type { OutlineRecord, Project, StoryOutline, Scene } from '@/lib/types';
import { generateOutlineAction } from '@/app/actions/generate';
import { updateOutlineAction, deleteOutlineAction } from '@/app/actions/outline';
import { saveDraftAction, getDraftsByOutlineAction } from '@/app/actions/draft';
import { generateSceneDraftAction } from '@/app/actions/generate-scene';

// ==================== 类型定义 ====================

export interface EditorReviewIssue {
  severity: 'critical' | 'major' | 'minor';
  category: 'ooc' | 'continuity' | 'outline_fit' | 'prose';
  description: string;
  suggestion: string;
}

export interface EditorReview {
  verdict: 'approved' | 'needs_revision';
  summary: string;
  issues: EditorReviewIssue[];
}

interface WorkspaceState {
  project: Project;
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
  isTyping: boolean;
  sceneWordCount: number;
  sceneStyle: string;
  sceneCustomNote: string;
  confirmingDelete: boolean;
  editorReview: EditorReview | null;
}

interface WorkspaceActions {
  init: (project: Project, initialHistory: OutlineRecord[], activeOutlineId?: string | null) => void;
  setSelectedIndex: (index: number) => void;
  startEditing: () => void;
  cancelEditing: () => void;
  updateEditedOutline: (outline: StoryOutline) => void;
  updateTitle: (title: string) => void;
  updateLogline: (logline: string) => void;
  updateActTitle: (actIdx: number, title: string) => void;
  updateScene: (actIdx: number, sceneIdx: number, field: string, value: string) => void;
  addAct: () => void;
  removeAct: (actIdx: number) => void;
  addScene: (actIdx: number) => void;
  removeScene: (actIdx: number, sceneIdx: number) => void;
  toggleDeleteConfirm: () => void;
  setActiveScene: (sceneId: string) => void;
  updateDraft: (sceneId: string, content: string) => void;
  setSceneWordCount: (count: number) => void;
  setSceneStyle: (style: string) => void;
  setSceneCustomNote: (note: string) => void;

  generateOutline: () => Promise<void>;
  deleteOutline: () => Promise<void>;
  saveEditing: () => Promise<void>;
  enterWritingMode: () => Promise<void>;
  exitWritingMode: () => void;
  enterReadingView: () => void;
  exitReadingView: () => void;
  saveDraft: () => Promise<void>;
  saveAllDrafts: () => Promise<void>;
  generateScene: () => Promise<void>;
  stopTyping: () => void;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

// ==================== 派生数据 ====================

function getCurrentRecord(state: WorkspaceState): OutlineRecord | undefined {
  return state.history[state.selectedIndex];
}

function getCurrentOutline(state: WorkspaceState): StoryOutline | null {
  return getCurrentRecord(state)?.content ?? null;
}

function getActiveSceneInfo(state: WorkspaceState): Scene | null {
  const outline = getCurrentOutline(state);
  return outline?.acts.flatMap((a) => a.scenes).find((s) => s.id === state.activeSceneId) ?? null;
}

// ==================== Store ====================

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  // ---------- 初始状态 ----------
  project: null as unknown as Project,
  isLoading: false,
  error: '',
  history: [],
  selectedIndex: 0,
  isEditing: false,
  editedOutline: null,
  isWritingMode: false,
  isReadingView: false,
  activeSceneId: null,
  draftsMap: {},
  isSavingDraft: false,
  isGeneratingScene: false,
  isTyping: false,
  sceneWordCount: 1000,
  sceneStyle: '',
  sceneCustomNote: '',
  confirmingDelete: false,
  editorReview: null,

  // ---------- 初始化 ----------
  init: (project, initialHistory, activeOutlineId) => {
    let selectedIndex = 0;
    if (activeOutlineId && initialHistory.length > 0) {
      const idx = initialHistory.findIndex((o) => o.id === activeOutlineId);
      if (idx !== -1) selectedIndex = idx;
    }
    set({ project, history: initialHistory, selectedIndex });
  },

  // ---------- 同步操作 ----------
  setSelectedIndex: (index) => set({ selectedIndex: index, confirmingDelete: false }),

  startEditing: () => {
    const state = get();
    const current = getCurrentRecord(state);
    set({
      isEditing: true,
      confirmingDelete: false,
      editedOutline: current ? structuredClone(current.content) : null,
    });
  },

  cancelEditing: () => set({ isEditing: false, editedOutline: null }),

  updateEditedOutline: (outline) => set({ editedOutline: outline }),

  updateTitle: (title) => {
    const { editedOutline } = get();
    if (editedOutline) set({ editedOutline: { ...editedOutline, title } });
  },

  updateLogline: (logline) => {
    const { editedOutline } = get();
    if (editedOutline) set({ editedOutline: { ...editedOutline, logline } });
  },

  updateActTitle: (actIdx, title) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const newActs = [...editedOutline.acts];
    newActs[actIdx] = { ...newActs[actIdx], actTitle: title };
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  updateScene: (actIdx, sceneIdx, field, value) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const newActs = [...editedOutline.acts];
    const newScenes = [...newActs[actIdx].scenes];
    newScenes[sceneIdx] = { ...newScenes[sceneIdx], [field]: value };
    newActs[actIdx] = { ...newActs[actIdx], scenes: newScenes };
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  addAct: () => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const newAct = {
      actTitle: '新幕',
      scenes: [{
        id: crypto.randomUUID(),
        sceneNumber: 1,
        location: '',
        plotAction: '',
        conflict: '',
        emotionalShift: '',
      }],
    };
    set({ editedOutline: { ...editedOutline, acts: [...editedOutline.acts, newAct] } });
  },

  removeAct: (actIdx) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const newActs = editedOutline.acts.filter((_, i) => i !== actIdx);
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  addScene: (actIdx) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const act = editedOutline.acts[actIdx];
    if (!act) return;
    const newScene = {
      id: crypto.randomUUID(),
      sceneNumber: act.scenes.length + 1,
      location: '',
      plotAction: '',
      conflict: '',
      emotionalShift: '',
    };
    const newActs = [...editedOutline.acts];
    newActs[actIdx] = { ...act, scenes: [...act.scenes, newScene] };
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  removeScene: (actIdx, sceneIdx) => {
    const { editedOutline } = get();
    if (!editedOutline) return;
    const act = editedOutline.acts[actIdx];
    if (!act || act.scenes.length <= 1) return;
    const newScenes = act.scenes.filter((_, i) => i !== sceneIdx);
    const newActs = [...editedOutline.acts];
    newActs[actIdx] = { ...act, scenes: newScenes };
    set({ editedOutline: { ...editedOutline, acts: newActs } });
  },

  toggleDeleteConfirm: () => set((s) => ({ confirmingDelete: !s.confirmingDelete })),

  setActiveScene: (sceneId) => set({ activeSceneId: sceneId }),

  updateDraft: (sceneId, content) =>
    set((s) => ({ draftsMap: { ...s.draftsMap, [sceneId]: content } })),

  setSceneWordCount: (count) => set({ sceneWordCount: count }),

  setSceneStyle: (style) => set({ sceneStyle: style }),

  setSceneCustomNote: (note) => set({ sceneCustomNote: note }),

  exitWritingMode: () => set({ isWritingMode: false }),

  enterReadingView: () => set({ isReadingView: true }),

  exitReadingView: () => set({ isReadingView: false }),

  // ---------- 异步操作 ----------

  generateOutline: async () => {
    const { project } = get();
    set({ isLoading: true, error: '', isEditing: false, editedOutline: null, confirmingDelete: false });
    try {
      const res = await generateOutlineAction(project.id, project.fandom, project.characters, project.premise);
      if (res.success && res.data && res.outlineId) {
        await (await import('@/app/actions/project')).setActiveOutlineAction(project.id, res.outlineId);
        set((s) => ({
          isLoading: false,
          history: [
            {
              id: res.outlineId!,
              content: res.data as StoryOutline,
              createdAt: new Date(),
              projectId: project.id,
              version: 1,
            },
            ...s.history,
          ],
          selectedIndex: 0,
        }));
      } else {
        set({ isLoading: false, error: res.error || '灵感枯竭...' });
      }
    } catch {
      set({ isLoading: false, error: '网络异常。' });
    }
  },

  deleteOutline: async () => {
    const { history, selectedIndex, project } = get();
    const current = history[selectedIndex];
    if (!current) return;
    set({ isLoading: true, confirmingDelete: false });
    try {
      const res = await deleteOutlineAction(current.id, project.id);
      if (res.success) {
        set((s) => ({
          isLoading: false,
          history: s.history.filter((_, i) => i !== selectedIndex),
          selectedIndex: 0,
          isEditing: false,
        }));
      } else {
        set({ isLoading: false, error: res.error || '删除失败' });
      }
    } catch {
      set({ isLoading: false, error: '网络异常。' });
    }
  },

  saveEditing: async () => {
    const { history, selectedIndex, editedOutline, project } = get();
    const current = history[selectedIndex];
    if (!current || !editedOutline) return;
    set({ isLoading: true, error: '' });
    try {
      const res = await updateOutlineAction(current.id, editedOutline, project.id);
      if (res.success) {
        set((s) => {
          const newHistory = [...s.history];
          newHistory[selectedIndex] = { ...current, content: editedOutline };
          return { isLoading: false, history: newHistory, isEditing: false };
        });
      } else {
        set({ isLoading: false, error: res.error || '保存失败' });
      }
    } catch {
      set({ isLoading: false, error: '网络异常。' });
    }
  },

  enterWritingMode: async () => {
    const { project, history, selectedIndex } = get();
    const current = history[selectedIndex];
    if (!current) return;
    const outline = current.content;
    if (!outline) return;
    try {
      const drafts = await getDraftsByOutlineAction(project.id, current.id);
      const map: Record<string, string> = {};
      drafts.forEach((d) => {
        map[d.sceneId] = d.content;
      });
      const firstSceneId = outline.acts[0]?.scenes[0]?.id;
      if (firstSceneId) {
        set({ isWritingMode: true, draftsMap: map, activeSceneId: firstSceneId });
      }
    } catch {
      set({ error: '拉取正文记录失败' });
    }
  },

  saveDraft: async () => {
    const { project, history, selectedIndex, activeSceneId, draftsMap } = get();
    const current = history[selectedIndex];
    if (!activeSceneId || !current) return;
    set({ isSavingDraft: true });
    try {
      await saveDraftAction(project.id, current.id, activeSceneId, draftsMap[activeSceneId] || '');
    } catch {
      set({ error: '保存正文失败' });
    } finally {
      set({ isSavingDraft: false });
    }
  },

  saveAllDrafts: async () => {
    const { project, history, selectedIndex, draftsMap } = get();
    const current = history[selectedIndex];
    if (!current) return;
    set({ isSavingDraft: true });
    try {
      const entries = Object.entries(draftsMap).filter(([, content]) => content);
      await Promise.all(
        entries.map(([sceneId, content]) =>
          saveDraftAction(project.id, current.id, sceneId, content)
        )
      );
    } catch {
      set({ error: '保存正文失败' });
    } finally {
      set({ isSavingDraft: false });
    }
  },

  generateScene: async () => {
    const { project, activeSceneId, history, selectedIndex, sceneWordCount, sceneStyle, sceneCustomNote } = get();
    const outline = getCurrentOutline(get());
    const sceneInfo = getActiveSceneInfo(get());
    const current = history[selectedIndex];
    if (!sceneInfo || !activeSceneId || !current) return;
    set({ isGeneratingScene: true });
    try {
      const res = await generateSceneDraftAction(project.id, project.fandom, project.characters, project.premise, {
        sceneId: activeSceneId,
        sceneNumber: sceneInfo.sceneNumber,
        location: sceneInfo.location,
        plotAction: sceneInfo.plotAction,
        conflict: sceneInfo.conflict,
        emotionalShift: sceneInfo.emotionalShift,
        wordCount: sceneWordCount || undefined,
        style: sceneStyle || undefined,
        customNote: sceneCustomNote || undefined,
      });
      if (res.success && res.text) {
        set({
          isGeneratingScene: false,
          isTyping: true,
          editorReview: res.editorReview ?? null,
        });
        const fullText = res.text!;
        let charIndex = 0;
        const typingSpeed = 15;
        const typeNextChar = () => {
          if (charIndex >= fullText.length) {
            set({ isTyping: false });
            return;
          }
          const currentTyping = get().isTyping;
          if (!currentTyping) return;
          charIndex++;
          const partialText = fullText.slice(0, charIndex);
          set((s) => ({
            draftsMap: { ...s.draftsMap, [activeSceneId]: partialText },
          }));
          setTimeout(typeNextChar, typingSpeed);
        };
        typeNextChar();
      } else {
        set({ isGeneratingScene: false, error: res.error || '生成失败' });
      }
    } catch {
      set({ isGeneratingScene: false, error: '网络异常，无法连接大模型。' });
    }
  },

  stopTyping: () => {
    set({ isTyping: false });
  },
}));

// ==================== 派生 Selectors ====================

export function useCurrentOutline(): StoryOutline | null {
  return useWorkspaceStore((s) => {
    const record = s.history[s.selectedIndex];
    return record?.content ?? null;
  });
}

export function useDisplayData(): StoryOutline | null {
  return useWorkspaceStore((s) => {
    if (s.isEditing && s.editedOutline) return s.editedOutline;
    const record = s.history[s.selectedIndex];
    return record?.content ?? null;
  });
}

export function useActiveSceneInfo(): Scene | null {
  return useWorkspaceStore((s) => {
    const record = s.history[s.selectedIndex];
    const content = record?.content;
    if (!content) return null;
    return content.acts.flatMap((a) => a.scenes).find((sc) => sc.id === s.activeSceneId) ?? null;
  });
}