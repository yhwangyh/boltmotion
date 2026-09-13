"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Page } from "./usePages";
import { searchPages } from "./searchUtils";

type DropZone = "above" | "below" | "child" | null;

function isDescendant(pages: Page[], parentId: string, targetId: string): boolean {
  const kids = pages.filter((p) => p.parent_id === parentId);
  return kids.some((k) => k.id === targetId || isDescendant(pages, k.id, targetId));
}

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
  draggedId,
  setDraggedId,
  onContextMenu,
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
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  onContextMenu: (e: React.MouseEvent, pageId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(page.title);
  const [dropZone, setDropZone] = useState<DropZone>(null);

  const children = pages
    .filter((p) => p.parent_id === page.id)
    .sort((a, b) => a.position - b.position);

  const isSelected = selectedPageId === page.id;

  const commitTitle = () => {
    setEditing(false);
    const trimmed = titleInput.trim() || "Untitled";
    if (trimmed !== page.title) renamePage(page.id, trimmed);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    if (ratio < 0.25) setDropZone("above");
    else if (ratio > 0.75) setDropZone("below");
    else setDropZone("child");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zone = dropZone;
    setDropZone(null);
    if (!draggedId || draggedId === page.id) return;

    if (zone === "child") {
      if (isDescendant(pages, draggedId, page.id)) return;
      const siblingCount = pages.filter((p) => p.parent_id === page.id).length;
      movePage(draggedId, page.id, siblingCount);
      setDraggedId(null);
      return;
    }

    const newParentId = page.parent_id;
    if (newParentId === draggedId) return;
    if (newParentId && isDescendant(pages, draggedId, newParentId)) return;

    const siblings = pages
      .filter((p) => p.parent_id === newParentId && p.id !== draggedId)
      .sort((a, b) => a.position - b.position);
    const targetIndex = siblings.findIndex((s) => s.id === page.id);
    const newPosition = zone === "above" ? targetIndex : targetIndex + 1;

    movePage(draggedId, newParentId, newPosition);
    setDraggedId(null);
  };

  return (
    <div>
      <div className="relative">
        {dropZone === "above" && (
          <div
            className="absolute -top-px right-2 h-0.5 rounded-full bg-blue-500 z-10"
            style={{ left: 8 + depth * 16 }}
          />
        )}
        <div
          draggable
          onDragStart={() => setDraggedId(page.id)}
          onDragOver={handleDragOver}
          onDragLeave={() => setDropZone(null)}
          onDrop={handleDrop}
          onClick={() => onSelectPage(page.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu(e, page.id);
          }}
          style={{ paddingLeft: 8 + depth * 16 }}
          className={cn(
            "group flex items-center gap-1 pr-2 py-1.5 rounded-md cursor-pointer text-sm select-none",
            isSelected && "bg-muted",
            !isSelected && dropZone === "child" && "bg-blue-50",
            !isSelected && dropZone !== "child" && "hover:bg-muted/60"
          )}
        >
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="w-4 h-4 flex items-center justify-center text-muted-foreground shrink-0"
          >
            {children.length > 0 &&
              (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
          </span>

          <span className="text-sm shrink-0">{page.icon || "📄"}</span>

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
              className="flex-1 text-sm bg-background border border-input rounded px-1 py-0 outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="flex-1 truncate text-foreground/90"
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
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {dropZone === "below" && (
          <div
            className="absolute -bottom-px right-2 h-0.5 rounded-full bg-blue-500 z-10"
            style={{ left: 8 + depth * 16 }}
          />
        )}
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
            draggedId={draggedId}
            setDraggedId={setDraggedId}
            onContextMenu={onContextMenu}
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageId: string } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const rootPages = pages.filter((p) => !p.parent_id).sort((a, b) => a.position - b.position);
  const results = useMemo(() => searchPages(pages, query), [pages, query]);
  const isSearching = query.trim().length > 0;

  useEffect(() => {
    if (!contextMenu) return;
    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setContextMenu(null);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("scroll", () => setContextMenu(null), true);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [contextMenu]);

  const contextPage = contextMenu ? pages.find((p) => p.id === contextMenu.pageId) : null;

  return (
    <div className="w-64 h-full border-r bg-muted/30 flex flex-col relative">
      <div className="p-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notebook…"
          className="h-8 text-sm bg-background"
        />
      </div>

      <div className="flex items-center justify-between px-3 pb-1.5">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {isSearching ? `Results (${results.length})` : "Pages"}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-foreground"
          onClick={() => createPage(null)}
          title="Add page"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        {isSearching ? (
          <div>
            {results.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matches.</div>
            )}
            {results.map((r, i) => (
              <div
                key={r.page.id + "-" + i}
                onClick={() => {
                  onSelectPage(r.page.id);
                  setQuery("");
                }}
                className="px-3 py-1.5 rounded-md cursor-pointer hover:bg-muted/60"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span>{r.page.icon || "📄"}</span>
                  <span className="font-medium truncate">{r.page.title || "Untitled"}</span>
                </div>
                {r.matchType !== "title" && (
                  <div className="text-xs text-muted-foreground ml-6 mt-0.5 truncate">{r.snippet}</div>
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
                draggedId={draggedId}
                setDraggedId={setDraggedId}
                onContextMenu={(e, pageId) => setContextMenu({ x: e.clientX, y: e.clientY, pageId })}
              />
            ))}
          </div>
        )}
      </div>

      {contextMenu && contextPage && (
        <div
          ref={menuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed bg-popover border rounded-lg shadow-md p-1 z-[1000] min-w-[160px]"
        >
          <div
            onClick={() => setContextMenu(null)}
            className="px-2.5 py-1.5 text-sm rounded-md cursor-pointer text-foreground hover:bg-muted"
          >
            Rename
          </div>
          <div
            onClick={() => {
              const title = contextPage.title || "Untitled";
              setContextMenu(null);
              if (confirm(`Delete "${title}" and all its sub-pages?`)) deletePage(contextPage.id);
            }}
            className="px-2.5 py-1.5 text-sm rounded-md cursor-pointer text-red-600 hover:bg-red-50"
          >
            Delete page
          </div>
        </div>
      )}
    </div>
  );
}
