'use client';

import { useEffect, useState } from 'react';

interface EvalDimension {
  score: number;
  comment: string;
}

interface EvalResult {
  dimensions: Record<string, EvalDimension>;
  overallComment: string;
  scorerId: string;
  score: number;
}

interface EvalRecord {
  id: string;
  targetType: string;
  targetId: string;
  score: number;
  result: EvalResult;
  createdAt: string;
}

function getLabel(targetType: string): string {
  switch (targetType) {
    case 'outline':
      return '大纲质量';
    case 'scene':
      return '场景质量';
    case 'agent_trajectory':
      return 'Agent 轨迹';
    default:
      return targetType;
  }
}

function getDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    faithfulness: '还原度',
    coherence: '连贯性',
    completeness: '完整性',
    consistency: '前文一致性',
    outlineFit: '大纲契合度',
    proseQuality: '文笔质量',
    toolCompliance: '工具调用合规',
    contextUsage: '上下文利用',
    instructionCompliance: '指令遵循',
  };
  return labels[key] ?? key;
}

function ScoreBar({ score }: { score: number }) {
  const stars = Math.round(score);
  return (
    <span className="text-academia-gold text-sm">
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </span>
  );
}

function EvalCard({ ev }: { ev: EvalRecord }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-academia-muted">{getLabel(ev.targetType)}</span>
        <div className="flex items-center gap-2">
          <ScoreBar score={ev.score} />
          <span className="text-xs font-bold text-academia-parchment">
            {ev.score.toFixed(1)}
          </span>
        </div>
      </div>

      {ev.result?.dimensions && Object.keys(ev.result.dimensions).length > 0 && (
        <div className="space-y-1 pl-2 border-l border-academia-border/50">
          {Object.entries(ev.result.dimensions).map(([key, dim]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[10px] text-academia-muted">
                {getDimensionLabel(key)}
              </span>
              <span className="text-[10px] text-academia-parchment/70">
                {dim.score}/5
              </span>
            </div>
          ))}
        </div>
      )}

      {ev.result?.overallComment && (
        <p className="text-[11px] text-academia-muted/80 leading-relaxed border-t border-academia-border/30 pt-2">
          {ev.result.overallComment}
        </p>
      )}
    </div>
  );
}

function EmptyCard({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="bg-academia-surface border border-academia-border p-5 rounded-xl space-y-3">
      <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest border-b border-academia-border/50 pb-2">
        {title}
      </h3>
      <p className="text-xs text-academia-muted">{hint}</p>
    </div>
  );
}

export default function EvalPanel({
  projectId,
  activeOutlineId,
  activeSceneId,
}: {
  projectId: string;
  activeOutlineId: string | null;
  activeSceneId: string | null;
}) {
  const [evals, setEvals] = useState<EvalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchEvals() {
      try {
        const res = await fetch(`/api/evaluations?projectId=${projectId}`);
        const data = await res.json();
        if (!cancelled) {
          setEvals(data.evaluations ?? []);
        }
      } catch {
        if (!cancelled) setEvals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvals();

    const interval = setInterval(() => {
      if (cancelled) return;
      fetchEvals();
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [projectId]);

  const outlineEval = activeOutlineId
    ? evals.find((e) => e.targetType === 'outline' && e.targetId === activeOutlineId)
    : null;

  const sceneEvals = activeSceneId
    ? evals.filter(
        (e) =>
          (e.targetType === 'scene' || e.targetType === 'agent_trajectory') &&
          e.targetId === activeSceneId,
      )
    : [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-academia-surface border border-academia-border p-5 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest border-b border-academia-border/50 pb-2">
            大纲质量
          </h3>
          <p className="text-xs text-academia-muted">加载中...</p>
        </div>
        <div className="bg-academia-surface border border-academia-border p-5 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest border-b border-academia-border/50 pb-2">
            场景质量
          </h3>
          <p className="text-xs text-academia-muted">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {outlineEval ? (
        <div className="bg-academia-surface border border-academia-border p-5 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest border-b border-academia-border/50 pb-2">
            大纲质量
          </h3>
          <EvalCard ev={outlineEval} />
        </div>
      ) : (
        <EmptyCard title="大纲质量" hint="生成大纲后，AI 将自动评估" />
      )}

      {sceneEvals.length > 0 ? (
        <div className="bg-academia-surface border border-academia-border p-5 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-academia-gold uppercase tracking-widest border-b border-academia-border/50 pb-2">
            场景质量
          </h3>
          {sceneEvals.map((ev) => (
            <EvalCard key={ev.id} ev={ev} />
          ))}
        </div>
      ) : (
        <EmptyCard title="场景质量" hint="生成场景正文后，AI 将自动评估" />
      )}
    </div>
  );
}