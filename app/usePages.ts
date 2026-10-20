"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

export type Page = {
  id: string;
  title: string;
  icon: string | null;
  parent_id: string | null;
  position: number;
  content: any;
  created_at: string;
  updated_at: string;
};

const byOrder = (a: Page, b: Page) =>
  a.position - b.position || a.created_at.localeCompare(b.created_at);

function descendantIds(pages: Page[], id: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>([id]);
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const p of pages) {
      if (p.parent_id === cur && !seen.has(p.id)) {
        seen.add(p.id);
        out.push(p.id);
        stack.push(p.id);
      }
    }
  }
  return out;
}

export function usePages(
  selectedPageId: string | null,
  setSelectedPageId: (id: string | null) => void
) {
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pagesRef = useRef<Page[]>([]);
  pagesRef.current = pages;
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reportError = useCallback((msg: string, detail?: unknown) => {
    console.error(msg, detail);
    setError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 5000);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const fetchPages = useCallback(async () => {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      reportError("Couldn't load pages.", error);
      return;
    }
    setPages((data as Page[]) || []);
  }, [reportError]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const createPage = useCallback(
    async (parentId: string | null) => {
      const siblings = pagesRef.current.filter((p) => p.parent_id === parentId);
      const position = siblings.length ? Math.max(...siblings.map((p) => p.position)) + 1 : 0;
      const { data, error } = await supabase
        .from("pages")
        .insert({ title: "Untitled", parent_id: parentId, position, content: [] })
        .select()
        .single();
      if (error || !data) {
        reportError("Couldn't create the page.", error);
        return undefined;
      }
      setPages((prev) => [...prev, data as Page]);
      return (data as Page).id;
    },
    [reportError]
  );

  const patchPage = useCallback(
    async (id: string, patch: Partial<Pick<Page, "title" | "icon">>, msg: string) => {
      const before = pagesRef.current.find((p) => p.id === id);
      if (!before) return;
      setPages((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      const { error } = await supabase
        .from("pages")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) {
        const restore: Partial<Page> = {};
        (Object.keys(patch) as (keyof typeof patch)[]).forEach((k) => {
          (restore as any)[k] = before[k];
        });
        setPages((list) => list.map((p) => (p.id === id ? { ...p, ...restore } : p)));
        reportError(msg, error);
      }
    },
    [reportError]
  );

  const renamePage = useCallback(
    (id: string, title: string) => patchPage(id, { title }, "Couldn't rename the page. Change undone."),
    [patchPage]
  );

  const updateIcon = useCallback(
    (id: string, icon: string) => patchPage(id, { icon }, "Couldn't change the icon. Change undone."),
    [patchPage]
  );

  const updateContent = useCallback((id: string, content: any) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, content } : p)));
  }, []);

  // newIndex = index among the destination's children, excluding the moved page
  const movePage = useCallback(
    async (id: string, newParentId: string | null, newIndex: number) => {
      const current = pagesRef.current;
      const moving = current.find((p) => p.id === id);
      if (!moving) return;
      if (newParentId === id) return;
      if (newParentId && descendantIds(current, id).includes(newParentId)) return;

      const oldParentId = moving.parent_id;
      const dest = current
        .filter((p) => p.parent_id === newParentId && p.id !== id)
        .sort(byOrder);
      const idx = Math.max(0, Math.min(newIndex, dest.length));
      dest.splice(idx, 0, { ...moving, parent_id: newParentId });

      const updates = new Map<string, { parent_id: string | null; position: number }>();
      dest.forEach((p, i) => updates.set(p.id, { parent_id: newParentId, position: i }));
      if (oldParentId !== newParentId) {
        current
          .filter((p) => p.parent_id === oldParentId && p.id !== id)
          .sort(byOrder)
          .forEach((p, i) => updates.set(p.id, { parent_id: oldParentId, position: i }));
      }

      const changed = [...updates.entries()].filter(([pid, u]) => {
        const p = current.find((x) => x.id === pid)!;
        return p.parent_id !== u.parent_id || p.position !== u.position;
      });
      if (!changed.length) return;

      const snapshot = current;
      const now = new Date().toISOString();
      setPages((prev) =>
        prev.map((p) => {
          const u = updates.get(p.id);
          return u ? { ...p, ...u } : p;
        })
      );

      const results = await Promise.all(
        changed.map(([pid, u]) =>
          supabase
            .from("pages")
            .update(pid === id ? { ...u, updated_at: now } : u)
            .eq("id", pid)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed) {
        setPages(snapshot);
        reportError("Couldn't move the page. Change undone.", failed.error);
      }
    },
    [reportError]
  );

  const deletePage = useCallback(
    async (id: string) => {
      const current = pagesRef.current;
      const target = current.find((p) => p.id === id);
      if (!target) return;

      const ids = [id, ...descendantIds(current, id)];
      const idSet = new Set(ids);
      const { error } = await supabase.from("pages").delete().in("id", ids);
      if (error) {
        reportError("Couldn't delete the page.", error);
        return;
      }

      // close the position gap among the deleted page's former siblings
      const siblings = current
        .filter((p) => !idSet.has(p.id) && p.parent_id === target.parent_id)
        .sort(byOrder);
      const renumber = new Map<string, number>();
      siblings.forEach((p, i) => {
        if (p.position !== i) renumber.set(p.id, i);
      });

      setPages((prev) =>
        prev
          .filter((p) => !idSet.has(p.id))
          .map((p) => (renumber.has(p.id) ? { ...p, position: renumber.get(p.id)! } : p))
      );

      if (renumber.size) {
        const results = await Promise.all(
          [...renumber.entries()].map(([pid, pos]) =>
            supabase.from("pages").update({ position: pos }).eq("id", pid)
          )
        );
        if (results.some((r) => r.error)) {
          reportError("Page deleted, but re-ordering the remaining pages failed.");
        }
      }

      if (selectedPageId && idSet.has(selectedPageId)) setSelectedPageId(null);
    },
    [selectedPageId, setSelectedPageId, reportError]
  );

  const getPath = useCallback(
    (id: string): Page[] => {
      const path: Page[] = [];
      const seen = new Set<string>();
      let current = pages.find((p) => p.id === id);
      while (current && !seen.has(current.id)) {
        seen.add(current.id);
        path.unshift(current);
        const pid: string | null = current.parent_id;
        current = pid ? pages.find((p) => p.id === pid) : undefined;
      }
      return path;
    },
    [pages]
  );

  return {
    pages,
    error,
    clearError,
    createPage,
    renamePage,
    updateIcon,
    updateContent,
    movePage,
    deletePage,
    getPath,
  };
}
