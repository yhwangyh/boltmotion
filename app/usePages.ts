"use client";

import { useEffect, useState, useCallback } from "react";
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

export function usePages(
  selectedPageId: string | null,
  setSelectedPageId: (id: string | null) => void
) {
  const [pages, setPages] = useState<Page[]>([]);

  const fetchPages = useCallback(async () => {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Failed to load pages:", error);
      return;
    }
    setPages(data || []);
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const createPage = useCallback(
    async (parentId: string | null) => {
      const siblingCount = pages.filter((p) => p.parent_id === parentId).length;
      const { data, error } = await supabase
        .from("pages")
        .insert({
          title: "Untitled",
          parent_id: parentId,
          position: siblingCount,
          content: [],
        })
        .select()
        .single();
      if (error) {
        console.error("Failed to create page:", error);
        return undefined;
      }
      setPages((prev) => [...prev, data]);
      return data.id as string;
    },
    [pages]
  );

  const renamePage = useCallback(async (id: string, title: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
    const { error } = await supabase
      .from("pages")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("Failed to rename page:", error);
  }, []);

  const updateIcon = useCallback(async (id: string, icon: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, icon } : p)));
    const { error } = await supabase
      .from("pages")
      .update({ icon, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("Failed to update icon:", error);
  }, []);

  const updateContent = useCallback((id: string, content: any) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, content } : p)));
  }, []);

  const movePage = useCallback(
    async (id: string, newParentId: string | null, newPosition: number) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, parent_id: newParentId, position: newPosition } : p
        )
      );
      const { error } = await supabase
        .from("pages")
        .update({
          parent_id: newParentId,
          position: newPosition,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) console.error("Failed to move page:", error);
    },
    []
  );

  const deletePage = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) {
        console.error("Failed to delete page:", error);
        return;
      }
      const collectDescendants = (pid: string, list: Page[]): string[] => {
        const kids = list.filter((p) => p.parent_id === pid);
        return kids.reduce(
          (acc, k) => [...acc, k.id, ...collectDescendants(k.id, list)],
          [] as string[]
        );
      };
      const toRemove = new Set([id, ...collectDescendants(id, pages)]);
      setPages((prev) => prev.filter((p) => !toRemove.has(p.id)));
      if (selectedPageId && toRemove.has(selectedPageId)) {
        setSelectedPageId(null);
      }
    },
    [pages, selectedPageId, setSelectedPageId]
  );

  const getPath = useCallback(
    (id: string): Page[] => {
      const path: Page[] = [];
      let current = pages.find((p) => p.id === id);
      while (current) {
        path.unshift(current);
        current = current.parent_id
          ? pages.find((p) => p.id === current!.parent_id)
          : undefined;
      }
      return path;
    },
    [pages]
  );

  return {
    pages,
    createPage,
    renamePage,
    updateIcon,
    updateContent,
    movePage,
    deletePage,
    getPath,
  };
}
