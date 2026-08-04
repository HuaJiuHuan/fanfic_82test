"use client";

import { useRouter } from "next/navigation";
import { setActiveOutlineAction } from "@/app/actions/project";
import type { StoryOutline } from "@/lib/types";

interface OutlineSwitcherProps {
  projectId: string;
  activeOutlineId: string | null;
  outlines: { id: string; version: number | null; createdAt: Date | null; content: StoryOutline }[];
  onSelectVersion?: (index: number) => void;
}

export default function OutlineSwitcher({ projectId, activeOutlineId, outlines, onSelectVersion }: OutlineSwitcherProps) {
  const router = useRouter();

  return (
    <form
      action={async (formData) => {
        const outlineId = formData.get("outlineId") as string;
        await setActiveOutlineAction(projectId, outlineId);
        router.refresh();
      }}
      className="flex items-center gap-2"
    >
      <label htmlFor="outline-select" className="text-xs text-academia-muted">
        当前大纲：
      </label>
      <select
        id="outline-select"
        name="outlineId"
        value={activeOutlineId ?? ""}
        onChange={(e) => {
          if (e.target.value) {
            const newIndex = outlines.findIndex((o) => o.id === e.target.value);
            if (newIndex >= 0) {
              onSelectVersion?.(newIndex);
            }
            const form = (e.target as HTMLSelectElement).closest("form");
            form?.requestSubmit();
          }
        }}
        className="bg-academia-surface border border-academia-border rounded-md px-2 py-1 text-xs text-academia-muted outline-none focus:border-academia-gold/50"
      >
        {outlines.map((outline, idx) => (
          <option key={outline.id} value={outline.id}>
            版本 {outlines.length - idx}
          </option>
        ))}
      </select>
    </form>
  );
}