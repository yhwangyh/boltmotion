"use client";

import type { Page } from "./usePages";

export default function SubPages({
  pageId,
  pages,
  onSelectPage,
  createPage,
}: {
  pageId: string;
  pages: Page[];
  onSelectPage: (id: string) => void;
  createPage: (parentId: string | null) => Promise<string | undefined> | void;
}) {
  const children = pages
    .filter((p) => p.parent_id === pageId)
    .sort((a, b) => a.position - b.position);

  return (
    <div className="mt-8 border-t pt-4">
      <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Sub-pages</div>

      {children.length === 0 && (
        <div className="text-[13px] text-muted-foreground/70 mb-2">No sub-pages yet.</div>
      )}

      {children.map((child) => (
        <div
          key={child.id}
          onClick={() => onSelectPage(child.id)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm hover:bg-muted/60"
        >
          <span>{child.icon || "📄"}</span>
          <span className="truncate">{child.title || "Untitled"}</span>
        </div>
      ))}

      <button
        onClick={async () => {
          const id = (await createPage(pageId)) as string | undefined;
          if (id) onSelectPage(id);
        }}
        className="mt-1.5 px-2 py-1 text-[13px] text-muted-foreground hover:text-foreground"
      >
        + Add sub-page
      </button>
    </div>
  );
}
