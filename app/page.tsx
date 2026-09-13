"use client";

import { useEffect, useState } from "react";
import { usePages } from "./usePages";
import Sidebar from "./Sidebar";
import PageHeader from "./PageHeader";
import Editor from "./Editor";
import SubPages from "./SubPages";
import PasswordGate from "./PasswordGate";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

export default function Home() {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { pages, createPage, renamePage, updateIcon, updateContent, movePage, deletePage, getPath } =
    usePages(selectedPageId, setSelectedPageId);

  return (
    <PasswordGate>
      <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Backdrop when sidebar is open on mobile */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 150,
            }}
          />
        )}

        {/* Sidebar: fixed off-canvas drawer on mobile, normal flex column on desktop */}
        <div
          style={
            isMobile
              ? {
                  position: "fixed",
                  top: 0,
                  left: 0,
                  height: "100%",
                  zIndex: 200,
                  transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                  transition: "transform 0.2s ease",
                  background: "white",
                  boxShadow: sidebarOpen ? "2px 0 8px rgba(0,0,0,0.15)" : "none",
                }
              : { position: "relative", flexShrink: 0 }
          }
        >
          <Sidebar
            pages={pages}
            selectedPageId={selectedPageId}
            onSelectPage={(id) => {
              setSelectedPageId(id);
              if (isMobile) setSidebarOpen(false);
            }}
            createPage={createPage}
            renamePage={renamePage}
            updateIcon={updateIcon}
            movePage={movePage}
            deletePage={deletePage}
          />
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "16px" : "32px 48px",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                border: "1px solid #ddd",
                background: "white",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 14,
                marginBottom: 16,
                cursor: "pointer",
              }}
            >
              ☰ Pages
            </button>
          )}

          {selectedPageId ? (
            <>
              <PageHeader
                pageId={selectedPageId}
                pages={pages}
                onSelectPage={setSelectedPageId}
                renamePage={renamePage}
                updateIcon={updateIcon}
                getPath={getPath}
              />
              <SubPages
                pageId={selectedPageId}
                pages={pages}
                onSelectPage={setSelectedPageId}
                createPage={createPage}
              />
              <Editor
                key={selectedPageId}
                pageId={selectedPageId}
                pages={pages}
                createPage={createPage}
                onSelectPage={setSelectedPageId}
                updateContent={updateContent}
              />
            </>
          ) : (
            <div style={{ color: "#888", marginTop: 40 }}>
              No pages yet — click "+" in the sidebar to create your first page.
            </div>
          )}
        </div>
      </div>
    </PasswordGate>
  );
}
