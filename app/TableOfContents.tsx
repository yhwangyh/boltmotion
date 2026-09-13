"use client";

import { useEffect, useState } from "react";

type HeadingItem = { id: string; text: string; level: number };

function getBlockText(block: any): string {
  if (!block?.content) return "";
  if (Array.isArray(block.content)) return block.content.map((c: any) => c.text || "").join("");
  return "";
}

export function extractHeadings(document: any[]): HeadingItem[] {
  if (!Array.isArray(document)) return [];
  return document
    .filter((block) => block.type === "heading")
    .map((block) => ({
      id: block.id,
      text: getBlockText(block) || "Untitled heading",
      level: block.props?.level || 1,
    }));
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
              className={`h-0.5 rounded-full cursor-pointer ${activeId === h.id ? "bg-blue-500" : "bg-border"}`}
            />
          )
        )}
      </div>
    </div>
  );
}