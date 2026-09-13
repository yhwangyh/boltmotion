"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Page } from "./usePages";
import IconPicker from "./IconPicker";

const VISIBLE_LIMIT = 5;

function BreadcrumbDropdown({
  parentId,
  currentId,
  pages,
  onSelectPage,
  onClose,
}: {
  parentId: string | null;
  currentId: string;
  pages: Page[];
  onSelectPage: (id: string) => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const siblings = pages
    .filter((p) => p.parent_id === parentId)
    .sort((a, b) => a.position - b.position);

  const visible = expanded ? siblings : siblings.slice(0, VISIBLE_LIMIT);
  const remaining = siblings.length - visible.length;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-[calc(100%+6px)] left-0 bg-popover border rounded-lg shadow-lg p-1.5 min-w-[260px] z-[200]"
    >
      {visible.map((p) => {
        const hasChildren = pages.some((c) => c.parent_id === p.id);
        const isCurrent = p.id === currentId;
        return (
          <div
            key={p.id}
            onClick={() => {
              onSelectPage(p.id);
              onClose();
            }}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm hover:bg-muted ${
              isCurrent ? "bg-muted" : ""
            }`}
          >
            <span className="w-4 text-center text-sm">{p.icon || "📄"}</span>
            <span className="flex-1 truncate text-foreground/90">{p.title || "Untitled"}</span>
            {hasChildren && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        );
      })}

      {remaining > 0 && (
        <div
          onClick={() => setExpanded(true)}
          className="px-2 py-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground"
        >
          {remaining} more
        </div>
      )}

      {siblings.length === 0 && (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">No other pages here.</div>
      )}
    </div>
  );
}

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
  const [openCrumbId, setOpenCrumbId] = useState<string | null>(null);
  const crumbsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTitleInput(page?.title || "");
    setEditingTitle(!!page && (!page.title || page.title === "Untitled"));
  }, [pageId]);

  useEffect(() => {
    if (!openCrumbId) return;
    const closeOnOutsideClick = (e: MouseEvent) => {
      if (crumbsRef.current && !crumbsRef.current.contains(e.target as Node)) setOpenCrumbId(null);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [openCrumbId]);

  if (!page) return null;

  const commitTitle = () => {
    setEditingTitle(false);
    const trimmed = titleInput.trim() || "Untitled";
    if (trimmed !== page.title) renamePage(page.id, trimmed);
  };

  return (
    <div className="mb-4">
      <div ref={crumbsRef} className="flex items-center gap-1 text-sm text-muted-foreground mb-3 relative">
        {path.map((p, i) => (
          <span key={p.id} className="flex items-center gap-1 relative">
            <span
              onClick={() => setOpenCrumbId((current) => (current === p.id ? null : p.id))}
              className={`px-1.5 py-0.5 rounded-md cursor-pointer hover:bg-muted/60 ${
                i === path.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"
              } ${openCrumbId === p.id ? "bg-muted" : ""}`}
            >
              {(p.icon || "📄") + " " + (p.title || "Untitled")}
            </span>
            {i < path.length - 1 && <span className="text-border">/</span>}

            {openCrumbId === p.id && (
              <BreadcrumbDropdown
                parentId={p.parent_id}
                currentId={p.id}
                pages={pages}
                onSelectPage={onSelectPage}
                onClose={() => setOpenCrumbId(null)}
              />
            )}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 relative">
        <span
          onClick={() => setShowIconPicker((v) => !v)}
          className="text-3xl leading-none cursor-pointer hover:opacity-70"
          title="Change icon"
        >
          {page.icon || "📄"}
        </span>

        {showIconPicker && (
          <div className="absolute top-11 left-0 z-50">
            <IconPicker onSelect={(icon) => updateIcon(page.id, icon)} onClose={() => setShowIconPicker(false)} />
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
            className="flex-1 text-3xl font-bold bg-transparent border border-input rounded-md px-2 py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        ) : (
          <h1
            onClick={() => {
              setTitleInput(page.title);
              setEditingTitle(true);
            }}
            className="text-3xl font-bold m-0 cursor-text"
          >
            {page.title || "Untitled"}
          </h1>
        )}
      </div>
    </div>
  );
}
