"use client";

import { useEffect, useState } from "react";

type HeadingItem = { id: string; text: string; level: number };

function getInlineText(content: any): string {
  if (!Array.isArray(content)) return "";
  return content
    .map((c: any) => (typeof c.text === "string" ? c.text : getInlineText(c.content)))
    .join("");
}

export function extractHeadings(blocks: any[]): HeadingItem[] {
  if (!Array.isArray(blocks)) return [];
  const out: HeadingItem[] = [];
  const walk = (list: any[]) => {
    for (const block of list) {
      if (block.type === "heading") {
        out.push({
          id: block.id,
          text: getInlineText(block.content) || "Untitled heading",
          level: block.props?.level || 1,
        });
      }
      if (Array.isArray(block.children)) walk(block.children);
    }
  };
  walk(blocks);
  return out;
}

export default function TableOfContents({ headings }: { headings: HeadingItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActiveId(topMost.target.getAttribute("data-id"));
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((h) => {
      const el = document.querySelector(`[data-id="${h.id}"]`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`sticky top-6 shrink-0 py-2 transition-[width] duration-150 ease-out overflow-hidden ${
        hovered ? "w-48 pl-1 overflow-y-auto" : "w-11 pl-3"
      }`}
      style={{ maxHeight: "calc(100vh - 48px)" }}
    >
      {hovered && (
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 whitespace-nowrap">
          On this page
        </div>
      )}
      <div className={`flex flex-col ${hovered ? "gap-0.5" : "gap-1.5"}`}>
        {headings.map((h) =>
          hovered ? (
            <div
              key={h.id}
              onClick={() => scrollToHeading(h.id)}
              title={h.text}
              style={{ paddingLeft: (h.level - 1) * 12 }}
              className={`cursor-pointer text-sm leading-tight py-0.5 truncate border-l-2 -ml-0.5 ${
                activeId === h.id
                  ? "text-blue-600 font-semibold border-blue-500"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {h.text}
            </div>
          ) : (
            <div
              key={h.id}
              onClick={() => scrollToHeading(h.id)}
              title={h.text}
              style={{ width: 20 - (h.level - 1) * 5, marginLeft: (h.level - 1) * 4 }}
              className={`h-1 rounded-full cursor-pointer transition-colors ${
                activeId === h.id ? "bg-blue-500" : "bg-zinc-400 dark:bg-zinc-500 hover:bg-zinc-500"
              }`}
            />
          )
        )}
      </div>
    </div>
  );
}
