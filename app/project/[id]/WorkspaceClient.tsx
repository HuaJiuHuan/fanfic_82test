"use client";

import { memo, useEffect } from "react";
import { useWorkspaceStore } from "@/lib/workspace-store";
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

export default memo(function WorkspaceClient({ project, initialHistory, activeOutlineId }: WorkspaceClientProps) {
  const init = useWorkspaceStore((s) => s.init);
  const isWritingMode = useWorkspaceStore((s) => s.isWritingMode);
  const isReadingView = useWorkspaceStore((s) => s.isReadingView);

  useEffect(() => {
    init(project, initialHistory, activeOutlineId);
  }, [project, initialHistory, init, activeOutlineId]);

  if (isReadingView) {
    return <ReadingView />;
  }

  if (isWritingMode) {
    return <WritingView project={project} />;
  }

  return <OutlineView project={project} />;
});