import type { Page } from "./usePages";

// Pulls every piece of matchable text out of a BlockNote block:
// paragraph/heading text, link text, and for images/files: caption,
// name, or filename parsed from the storage URL.
function extractBlockText(block: any): string[] {
  const texts: string[] = [];

  if (block.type === "image" || block.type === "file") {
    if (block.props?.caption) texts.push(block.props.caption);
    if (block.props?.name) texts.push(block.props.name);
    if (block.props?.url) {
      const filename = block.props.url.split("/").pop();
      if (filename) texts.push(decodeURIComponent(filename));
    }
  }

  if (Array.isArray(block.content)) {
    for (const item of block.content) {
      if (typeof item === "string") texts.push(item);
      else if (item?.type === "text" && item.text) texts.push(item.text);
      else if (item?.type === "link" && Array.isArray(item.content)) {
        for (const sub of item.content) {
          if (sub?.text) texts.push(sub.text);
        }
      }
    }
  }

  if (Array.isArray(block.children)) {
    for (const child of block.children) {
      texts.push(...extractBlockText(child));
    }
  }

  return texts;
}

export type SearchResult = {
  page: Page;
  snippet: string;
  matchType: "title" | "content" | "image";
};

export function searchPages(pages: Page[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const page of pages) {
    const title = page.title || "Untitled";
    if (title.toLowerCase().includes(q)) {
      results.push({ page, snippet: title, matchType: "title" });
      continue;
    }

    const blocks = Array.isArray(page.content) ? page.content : [];
    let matched = false;

    for (const block of blocks) {
      const texts = extractBlockText(block);
      for (const text of texts) {
        if (text.toLowerCase().includes(q)) {
          const isImageMatch = block.type === "image" || block.type === "file";
          const idx = text.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 30);
          const end = Math.min(text.length, idx + q.length + 30);
          const snippet =
            (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
          results.push({
            page,
            snippet: isImageMatch ? `🖼️ ${snippet}` : snippet,
            matchType: isImageMatch ? "image" : "content",
          });
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  return results;
}
