"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { supabase } from "../lib/supabaseClient";
import type { Page } from "./usePages";
import IconPicker from "./IconPicker";
import TableOfContents, { extractHeadings } from "./TableOfContents";

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
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [headings, setHeadings] = useState<ReturnType<typeof extractHeadings>>([]);

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

  const editor = useCreateBlockNote({
    initialContent:
      page?.content && Array.isArray(page.content) && page.content.length > 0
        ? page.content
        : [{ type: "paragraph", content: "" }],
    uploadFile,
  });

  // Recompute the heading outline whenever the page changes
  useEffect(() => {
    setHeadings(extractHeadings(editor.document));
  }, [pageId]);

  const handleChange = () => {
    setHeadings(extractHeadings(editor.document));

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      const { error } = await supabase
        .from("pages")
        .update({ content: editor.document, updated_at: new Date().toISOString() })
        .eq("id", pageId);
      if (error) {
        console.error("Failed to save content:", error);
        return;
      }
      updateContent(pageId, editor.document);
    }, 600);
  };

  const insertIcon = (icon: string) => {
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
        onItemClick: () => {
          setShowIconPicker(true);
        },
      };
      const items = [addPageItem, insertIconItem, ...defaultItems];
      if (!query) return items;
      return items.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.aliases?.some((a: string) => a.toLowerCase().includes(query.toLowerCase()))
      );
    },
    [editor, pageId, createPage, onSelectPage]
  );

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        {showIconPicker && (
          <div style={{ position: "absolute", top: 0, left: 0, zIndex: 50 }}>
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