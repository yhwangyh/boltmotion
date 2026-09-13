"use client";

import { useState } from "react";
import type { Page } from "./usePages";
import IconPicker from "./IconPicker";

export default function PageHeader({
  pageId,
  pages,
  onSelectPage,
  renamePage,
  updateIcon,
  getPath,
}: {
  pageId: string;
  pages: Page[];
  onSelectPage: (id: string) => void;
  renamePage: (id: string, title: string) => void;
  updateIcon: (id: string, icon: string) => void;
  getPath: (id: string) => Page[];
}) {
  const page = pages.find((p) => p.id === pageId);
  const path = getPath(pageId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(page?.title || "");
  const [showIconPicker, setShowIconPicker] = useState(false);

  if (!page) return null;

  const commitTitle = () => {
    setEditingTitle(false);
    const trimmed = titleInput.trim() || "Untitled";
    if (trimmed !== page.title) renamePage(page.id, trimmed);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Breadcrumbs */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "#888", marginBottom: 12 }}>
        {path.map((p, i) => (
          <span key={p.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              onClick={() => onSelectPage(p.id)}
              style={{
                cursor: "pointer",
                color: i === path.length - 1 ? "#333" : "#888",
                fontWeight: i === path.length - 1 ? 600 : 400,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              {(p.icon || "📄") + " " + (p.title || "Untitled")}
            </span>
            {i < path.length - 1 && <span style={{ color: "#ccc" }}>/</span>}
          </span>
        ))}
      </div>

      {/* Icon + Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
        <span
          onClick={() => setShowIconPicker((v) => !v)}
          style={{ fontSize: 32, cursor: "pointer", lineHeight: 1 }}
          title="Change icon"
        >
          {page.icon || "📄"}
        </span>

        {showIconPicker && (
          <div style={{ position: "absolute", top: 44, left: 0 }}>
            <IconPicker
              onSelect={(icon) => updateIcon(page.id, icon)}
              onClose={() => setShowIconPicker(false)}
            />
          </div>
        )}

        {editingTitle ? (
          <input
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitleInput(page.title);
                setEditingTitle(false);
              }
            }}
            style={{
              fontSize: 28,
              fontWeight: 700,
              border: "none",
              outline: "1px solid #ddd",
              borderRadius: 4,
              padding: "2px 6px",
              flex: 1,
            }}
          />
        ) : (
          <h1
            onClick={() => {
              setTitleInput(page.title);
              setEditingTitle(true);
            }}
            style={{ fontSize: 28, fontWeight: 700, margin: 0, cursor: "text" }}
          >
            {page.title || "Untitled"}
          </h1>
        )}
      </div>
    </div>
  );
}
