"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { supabase } from "../lib/supabaseClient";
import type { Page } from "./usePages";
import IconPicker from "./IconPicker";
import TableOfContents, { extractHeadings } from "./TableOfContents";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type Headings = ReturnType<typeof extractHeadings>;

// One global queue so writes always reach Supabase in the order they were made
let saveChain: Promise<void> = Promise.resolve();

export default function Editor({
  pageId,
  pages,
  createPage,
  onSelectPage,
  updateContent,
}: {
  pageId: string;
  pages: Page[];
  createPage: (parentId: string | null) => Promise<string | undefined>;
  onSelectPage: (id: string) => void;
  updateContent: (id: string, content: any) => void;
}) {
  const page = pages.find((p) => p.id === pageId);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const pendingRef = useRef(0);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [headings, setHeadings] = useState<Headings>([]);

  const uploadFile = async (file: File) => {
    const ext = file.name.split(".").pop() || "png";
    const path = `${pageId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("uploads").upload(path, file);
    if (error) {
      console.error("Failed to upload file:", error);
      throw error;
    }
    const { data } = supabase.storage.from("uploads").getPublicUrl(path);
    return data.publicUrl;
  };

  // Rebuilt whenever pageId changes, so each page always loads its own content
  const editor = useCreateBlockNote(
    {
      initialContent:
        page?.content && Array.isArray(page.content) && page.content.length > 0
          ? page.content
          : [{ type: "paragraph", content: "" }],
      uploadFile,
    },
    [pageId]
  );

  const writeContent = useCallback(
    (id: string, doc: any) => {
      pendingRef.current += 1;
      setStatus("saving");
      saveChain = saveChain.then(async () => {
        const { error } = await supabase
          .from("pages")
          .update({ content: doc, updated_at: new Date().toISOString() })
          .eq("id", id);
        pendingRef.current -= 1;
        if (error) {
          console.error("Failed to save content:", error);
          setStatus("error");
          return;
        }
        updateContent(id, doc);
        if (pendingRef.current === 0) setStatus("saved");
      });
    },
    [updateContent]
  );

  const flush = useCallback(() => {
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    if (dirtyRef.current) {
      dirtyRef.current = false;
      writeContent(pageId, editor.document);
    }
  }, [pageId, editor, writeContent]);

  // Save pending edits when leaving this page / unmounting
  useEffect(() => () => flush(), [flush]);

  // Save when the tab is hidden; warn if closing with unsaved work
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current || pendingRef.current > 0) {
        flush();
        e.preventDefault();
        e.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [flush]);

  const refreshHeadings = useCallback(() => {
    const next = extractHeadings(editor.document);
    setHeadings((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [editor]);

  useEffect(() => {
    refreshHeadings();
    setStatus("idle");
  }, [editor, refreshHeadings]);

  const handleChange = () => {
    refreshHeadings();
    dirtyRef.current = true;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(flush, 600);
  };

  const insertIcon = (icon: string) => {
    editor.focus();
    editor.insertInlineContent([{ type: "text", text: icon + " ", styles: {} }]);
    setShowIconPicker(false);
  };

  const customSlashItems = useMemo(
    () => (query: string) => {
      const defaultItems = getDefaultReactSlashMenuItems(editor);
      const addPageItem = {
        title: "Add new page",
        subtext: "Create a sub-page and open it",
        aliases: ["page", "subpage", "new page"],
        group: "Motion",
        icon: <span style={{ fontSize: 16 }}>📄</span>,
        onItemClick: async () => {
          const newId = await createPage(pageId);
          if (newId) onSelectPage(newId);
        },
      };
      const insertIconItem = {
        title: "Insert icon",
        subtext: "Insert an emoji at the cursor",
        aliases: ["icon", "emoji"],
        group: "Motion",
        icon: <span style={{ fontSize: 16 }}>🙂</span>,
        onItemClick: () => setShowIconPicker(true),
      };
      const items = [addPageItem, insertIconItem, ...defaultItems];
      if (!query) return items;
      const q = query.toLowerCase();
      return items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.aliases?.some((a: string) => a.toLowerCase().includes(q))
      );
    },
    [editor, pageId, createPage, onSelectPage]
  );

  const statusLabel =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "";

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <div style={{ height: 18, fontSize: 12, textAlign: "right", color: "#999" }}>
          {status === "error" ? (
            <span style={{ color: "#dc2626" }}>
              Save failed ·{" "}
              <button
                onClick={() => writeContent(pageId, editor.document)}
                style={{ textDecoration: "underline", cursor: "pointer" }}
              >
                Retry
              </button>
            </span>
          ) : (
            statusLabel
          )}
        </div>

        {showIconPicker && (
          <div style={{ position: "absolute", top: 18, left: 0, zIndex: 50 }}>
            <IconPicker onSelect={insertIcon} onClose={() => setShowIconPicker(false)} />
          </div>
        )}

        <BlockNoteView editor={editor} onChange={handleChange} slashMenu={false}>
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) => customSlashItems(query)}
          />
        </BlockNoteView>
      </div>

      <TableOfContents headings={headings} />
    </div>
  );
}
