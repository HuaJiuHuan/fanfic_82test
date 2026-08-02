'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProjectAction } from '@/app/actions/project';

export default function DeleteProjectButton({ projectId, projectName }: { projectId: string, projectName: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`确定要销毁项目「${projectName}」吗？此操作不可撤销。`)) return;
    
    setIsDeleting(true);
    try {
      const res = await deleteProjectAction(projectId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "销毁失败");
      }
    } catch (err) {
      alert("网络异常，无法销毁项目。");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs text-academia-muted hover:text-academia-crimson transition-colors p-1.5 rounded-md border border-transparent hover:border-academia-crimson/30 hover:bg-academia-crimson/10"
      title="销毁此项目"
    >
      {isDeleting ? '...' : '🗑️'}
    </button>
  );
}