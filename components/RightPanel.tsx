'use client';

import { useWorkspaceStore } from '@/lib/workspace-store';
import EvalPanel from './EvalPanel';

export default function RightPanel({ projectId }: { projectId: string }) {
  const generateOutline = useWorkspaceStore((s) => s.generateOutline);
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const history = useWorkspaceStore((s) => s.history);
  const selectedIndex = useWorkspaceStore((s) => s.selectedIndex);
  const activeSceneId = useWorkspaceStore((s) => s.activeSceneId);
  const activeOutlineId = history[selectedIndex]?.id ?? null;

  return (
    <div className="space-y-6">
      <div className="bg-academia-surface border border-academia-border rounded-xl p-5">
        <button
          onClick={generateOutline}
          disabled={isLoading}
          className="w-full bg-academia-gold/10 border border-academia-gold/30 text-academia-gold px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-academia-gold/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '高维运算中...' : history.length > 0 ? '分支重摇' : '首次推演大纲'}
        </button>
        <p className="text-[10px] text-academia-muted/50 mt-3 text-center leading-relaxed">
          AI 生成大纲后，点击"编辑"可自由增删幕与场景
        </p>
      </div>

      <EvalPanel projectId={projectId} activeOutlineId={activeOutlineId} activeSceneId={activeSceneId} />
    </div>
  );
}