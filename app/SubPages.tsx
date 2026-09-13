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
  createPage: (parentId: string | null) => void;
}) {
  const children = pages
    .filter((p) => p.parent_id === pageId)
    .sort((a, b) => a.position - b.position);

  return (
    <div style={{ marginTop: 32, borderTop: "1px solid #eee", paddingTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase", marginBottom: 8 }}>
        Sub-pages
      </div>

      {children.length === 0 && (
        <div style={{ fontSize: 13, color: "#aaa", marginBottom: 8 }}>No sub-pages yet.</div>
      )}

      {children.map((child) => (
        <div
          key={child.id}
          onClick={() => onSelectPage(child.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 8px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span>{child.icon || "📄"}</span>
          <span>{child.title || "Untitled"}</span>
        </div>
      ))}

      <button
        onClick={() => createPage(pageId)}
        style={{
          marginTop: 6,
          border: "none",
          background: "transparent",
          color: "#888",
          fontSize: 13,
          cursor: "pointer",
          padding: "4px 8px",
        }}
      >
        + Add sub-page
      </button>
    </div>
  );
}
