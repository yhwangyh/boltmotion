"use client";

import { useMemo, useState } from "react";
import type { Page } from "./usePages";
import { searchPages } from "./searchUtils";

function SidebarItem({
  page,
  pages,
  depth,
  selectedPageId,
  onSelectPage,
  createPage,
  renamePage,
  updateIcon,
  movePage,
  deletePage,
  draggedId,
  setDraggedId,
}: {
  page: Page;
  pages: Page[];
  depth: number;
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  createPage: (parentId: string | null) => void;
  renamePage: (id: string, title: string) => void;
  updateIcon: (id: string, icon: string) => void;
  movePage: (id: string, newParentId: string | null, newPosition: number) => void;
  deletePage: (id: string) => void;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(page.title);
  const [dragOver, setDragOver] = useState(false);

  const children = pages
    .filter((p) => p.parent_id === page.id)
    .sort((a, b) => a.position - b.position);

  const isSelected = selectedPageId === page.id;

  const commitTitle = () => {
    setEditing(false);
    const trimmed = titleInput.trim() || "Untitled";
    if (trimmed !== page.title) renamePage(page.id, trimmed);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (!draggedId || draggedId === page.id) return;

    const isDescendant = (parentId: string, targetId: string): boolean => {
      const kids = pages.filter((p) => p.parent_id === parentId);
      return kids.some((k) => k.id === targetId || isDescendant(k.id, targetId));
    };
    if (isDescendant(draggedId, page.id)) return;

    const siblingCount = pages.filter((p) => p.parent_id === page.id).length;
    movePage(draggedId, page.id, siblingCount);
    setDraggedId(null);
  };

  return (
    <div>
      <div
        draggable
        onDragStart={() => setDraggedId(page.id)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => onSelectPage(page.id)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingLeft: 8 + depth * 16,
          paddingRight: 8,
          paddingTop: 4,
          paddingBottom: 4,
          cursor: "pointer",
          borderRadius: 4,
          background: isSelected ? "#e8e8e8" : dragOver ? "#f0f7ff" : "transparent",
        }}
      >
        <span
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          style={{ width: 14, fontSize: 10, color: "#888", userSelect: "none" }}
        >
          {children.length > 0 ? (expanded ? "▾" : "▸") : ""}
        </span>

        <span style={{ fontSize: 14 }}>{page.icon || "📄"}</span>

        {editing ? (
          <input
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitleInput(page.title);
                setEditing(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 14, flex: 1, border: "1px solid #ccc", borderRadius: 3, padding: "1px 4px" }}
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            style={{ fontSize: 14, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {page.title || "Untitled"}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            createPage(page.id);
          }}
          title="Add sub-page"
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "#888" }}
        >
          +
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${page.title || "Untitled"}" and all its sub-pages?`)) {
              deletePage(page.id);
            }
          }}
          title="Delete page"
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#c66" }}
        >
          ✕
        </button>
      </div>

      {expanded &&
        children.map((child) => (
          <SidebarItem
            key={child.id}
            page={child}
            pages={pages}
            depth={depth + 1}
            selectedPageId={selectedPageId}
            onSelectPage={onSelectPage}
            createPage={createPage}
            renamePage={renamePage}
            updateIcon={updateIcon}
            movePage={movePage}
            deletePage={deletePage}
            draggedId={draggedId}
            setDraggedId={setDraggedId}
          />
        ))}
    </div>
  );
}

export default function Sidebar({
  pages,
  selectedPageId,
  onSelectPage,
  createPage,
  renamePage,
  updateIcon,
  movePage,
  deletePage,
}: {
  pages: Page[];
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  createPage: (parentId: string | null) => void;
  renamePage: (id: string, title: string) => void;
  updateIcon: (id: string, icon: string) => void;
  movePage: (id: string, newParentId: string | null, newPosition: number) => void;
  deletePage: (id: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const rootPages = pages.filter((p) => !p.parent_id).sort((a, b) => a.position - b.position);

  const results = useMemo(() => searchPages(pages, query), [pages, query]);
  const isSearching = query.trim().length > 0;

  return (
    <div
      style={{
        width: 260,
        borderRight: "1px solid #eee",
        height: "100%",
        overflowY: "auto",
        padding: "12px 4px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ padding: "0 8px 8px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notebook…"
          style={{
            width: "100%",
            fontSize: 13,
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "6px 8px",
            boxSizing: "border-box",
            outline: "none",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 8px 8px" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#888", textTransform: "uppercase" }}>
          {isSearching ? `Results (${results.length})` : "Pages"}
        </span>
        <button
          onClick={() => createPage(null)}
          title="Add page"
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 15, color: "#555" }}
        >
          +
        </button>
      </div>

      {isSearching ? (
        <div>
          {results.length === 0 && (
            <div style={{ padding: "8px 8px", fontSize: 13, color: "#999" }}>No matches.</div>
          )}
          {results.map((r, i) => (
            <div
              key={r.page.id + "-" + i}
              onClick={() => {
                onSelectPage(r.page.id);
                setQuery("");
              }}
              style={{
                padding: "6px 8px",
                cursor: "pointer",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                <span>{r.page.icon || "📄"}</span>
                <span style={{ fontWeight: 500 }}>{r.page.title || "Untitled"}</span>
              </div>
              {r.matchType !== "title" && (
                <div style={{ fontSize: 12, color: "#888", marginLeft: 22, marginTop: 2 }}>
                  {r.snippet}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedId) {
              const siblingCount = pages.filter((p) => !p.parent_id).length;
              movePage(draggedId, null, siblingCount);
              setDraggedId(null);
            }
          }}
        >
          {rootPages.map((page) => (
            <SidebarItem
              key={page.id}
              page={page}
              pages={pages}
              depth={0}
              selectedPageId={selectedPageId}
              onSelectPage={onSelectPage}
              createPage={createPage}
              renamePage={renamePage}
              updateIcon={updateIcon}
              movePage={movePage}
              deletePage={deletePage}
              draggedId={draggedId}
              setDraggedId={setDraggedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
