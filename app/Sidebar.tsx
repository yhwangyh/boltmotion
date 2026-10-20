"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ChevronRight, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Page } from "./usePages";
import { searchPages } from "./searchUtils";

type DropZone = "above" | "below" | "child" | null;
type CreatePage = (parentId: string | null) => Promise<string | undefined> | void;

function isDescendant(pages: Page[], parentId: string, targetId: string): boolean {
  const kids = pages.filter((p) => p.parent_id === parentId);
  return kids.some((k) => k.id === targetId || isDescendant(pages, k.id, targetId));
}

function getZone(e: React.DragEvent): Exclude<DropZone, null> {
  const rect = e.currentTarget.getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / rect.height;
  return ratio < 0.25 ? "above" : ratio > 0.75 ? "below" : "child";
}

function SidebarItem({
  page,
  pages,
  depth,
  selectedPageId,
  onSelectPage,
  createPage,
  renamePage,
  movePage,
  draggedId,
  setDraggedId,
  onContextMenu,
  collapsedIds,
  toggleCollapsed,
  expand,
  renamingId,
  setRenamingId,
}: {
  page: Page;
  pages: Page[];
  depth: number;
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  createPage: CreatePage;
  renamePage: (id: string, title: string) => void;
  movePage: (id: string, newParentId: string | null, newPosition: number) => void;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  onContextMenu: (e: React.MouseEvent, pageId: string) => void;
  collapsedIds: Set<string>;
  toggleCollapsed: (id: string) => void;
  expand: (id: string) => void;
  renamingId: string | null;
  setRenamingId: (id: string | null) => void;
}) {
  const [titleInput, setTitleInput] = useState(page.title);
  const [dropZone, setDropZone] = useState<DropZone>(null);
  const doneRef = useRef(false);

  const editing = renamingId === page.id;
  const expanded = !collapsedIds.has(page.id);
  const isSelected = selectedPageId === page.id;

  const children = pages
    .filter((p) => p.parent_id === page.id)
    .sort((a, b) => a.position - b.position);

  // Always start editing from the current title
  useEffect(() => {
    if (editing) {
      setTitleInput(page.title);
      doneRef.current = false;
    }
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  const finishEditing = (save: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setRenamingId(null);
    if (!save) return;
    const trimmed = titleInput.trim() || "Untitled";
    if (trimmed !== page.title) renamePage(page.id, trimmed);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!draggedId || draggedId === page.id) {
      if (dropZone) setDropZone(null);
      return;
    }
    const zone = getZone(e);
    if (zone !== dropZone) setDropZone(zone);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // ignore leave events caused by moving over this row's own children
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDropZone(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zone = getZone(e);
    const dragged = draggedId;
    setDropZone(null);
    setDraggedId(null);
    if (!dragged || dragged === page.id) return;

    if (zone === "child") {
      if (isDescendant(pages, dragged, page.id)) return;
      const count = pages.filter((p) => p.parent_id === page.id && p.id !== dragged).length;
      movePage(dragged, page.id, count);
      expand(page.id);
      return;
    }

    const newParentId = page.parent_id;
    if (newParentId === dragged) return;
    if (newParentId && isDescendant(pages, dragged, newParentId)) return;

    const siblings = pages
      .filter((p) => p.parent_id === newParentId && p.id !== dragged)
      .sort((a, b) => a.position - b.position);
    const targetIndex = siblings.findIndex((s) => s.id === page.id);
    movePage(dragged, newParentId, zone === "above" ? targetIndex : targetIndex + 1);
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
          draggable={!editing}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", page.id); // required by Firefox
            setDraggedId(page.id);
          }}
          onDragEnd={() => {
            setDraggedId(null);
            setDropZone(null);
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
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
              toggleCollapsed(page.id);
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
              onFocus={(e) => e.currentTarget.select()}
              onBlur={() => finishEditing(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") finishEditing(true);
                if (e.key === "Escape") finishEditing(false);
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 text-sm bg-background border border-input rounded px-1 py-0 outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          ) : (
            <span
              onDoubleClick={(e) => {
                e.stopPropagation();
                setRenamingId(page.id);
              }}
              className="flex-1 truncate text-foreground/90"
            >
              {page.title || "Untitled"}
            </span>
          )}

          <button
            onClick={async (e) => {
              e.stopPropagation();
              expand(page.id);
              const id = (await createPage(page.id)) as string | undefined;
              if (id) onSelectPage(id);
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
            movePage={movePage}
            draggedId={draggedId}
            setDraggedId={setDraggedId}
            onContextMenu={onContextMenu}
            collapsedIds={collapsedIds}
            toggleCollapsed={toggleCollapsed}
            expand={expand}
            renamingId={renamingId}
            setRenamingId={setRenamingId}
          />
        ))}
    </div>
  );
}

const COLLAPSE_KEY = "motion.collapsed";

export default function Sidebar({
  pages,
  selectedPageId,
  onSelectPage,
  createPage,
  renamePage,
  movePage,
  deletePage,
}: {
  pages: Page[];
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  createPage: CreatePage;
  renamePage: (id: string, title: string) => void;
  updateIcon?: (id: string, icon: string) => void;
  movePage: (id: string, newParentId: string | null, newPosition: number) => void;
  deletePage: (id: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageId: string } | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement | null>(null);

  const rootPages = pages.filter((p) => !p.parent_id).sort((a, b) => a.position - b.position);
  const results = useMemo(() => searchPages(pages, query), [pages, query]);
  const isSearching = query.trim().length > 0;

  // Collapsed state persists across reloads
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) setCollapsedIds(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const updateCollapsed = (fn: (s: Set<string>) => Set<string>) =>
    setCollapsedIds((prev) => {
      const next = fn(prev);
      if (next === prev) return prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });

  const toggleCollapsed = (id: string) =>
    updateCollapsed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const expand = (id: string) =>
    updateCollapsed((s) => {
      if (!s.has(id)) return s;
      const n = new Set(s);
      n.delete(id);
      return n;
    });

  // Opening a nested page (search, breadcrumb, new sub-page) reveals it in the tree
  useEffect(() => {
    if (!selectedPageId) return;
    const ancestors: string[] = [];
    const seen = new Set<string>();
    let cur = pages.find((p) => p.id === selectedPageId);
    while (cur && cur.parent_id && !seen.has(cur.parent_id)) {
      const pid: string = cur.parent_id;
      seen.add(pid);
      ancestors.push(pid);
      cur = pages.find((p) => p.id === pid);
    }
    if (ancestors.length) {
      updateCollapsed((s) => {
        if (!ancestors.some((a) => s.has(a))) return s;
        const n = new Set(s);
        ancestors.forEach((a) => n.delete(a));
        return n;
      });
    }
  }, [selectedPageId, pages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("scroll", close, true);
    };
  }, [contextMenu]);

  const contextPage = contextMenu ? pages.find((p) => p.id === contextMenu.pageId) : null;

  const addRootPage = async () => {
    const id = (await createPage(null)) as string | undefined;
    if (id) onSelectPage(id);
  };

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
          onClick={addRootPage}
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
            className="min-h-full pb-8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dragged = draggedId;
              setDraggedId(null);
              if (dragged) {
                const count = pages.filter((p) => !p.parent_id && p.id !== dragged).length;
                movePage(dragged, null, count);
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
                movePage={movePage}
                draggedId={draggedId}
                setDraggedId={setDraggedId}
                onContextMenu={(e, pageId) => setContextMenu({ x: e.clientX, y: e.clientY, pageId })}
                collapsedIds={collapsedIds}
                toggleCollapsed={toggleCollapsed}
                expand={expand}
                renamingId={renamingId}
                setRenamingId={setRenamingId}
              />
            ))}
          </div>
        )}
      </div>

      {contextMenu && contextPage && (
        <div
          ref={menuRef}
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 90),
            left: Math.min(contextMenu.x, window.innerWidth - 180),
          }}
          className="fixed bg-popover border rounded-lg shadow-md p-1 z-[1000] min-w-[160px]"
        >
          <div
            onClick={() => {
              setRenamingId(contextPage.id);
              setContextMenu(null);
            }}
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

