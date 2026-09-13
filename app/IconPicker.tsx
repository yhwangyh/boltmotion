"use client";

const EMOJI_OPTIONS = [
  "📄", "📝", "📋", "📁", "📌", "⭐", "✅", "🔥",
  "💡", "🚀", "🎯", "📊", "📅", "🔔", "📚", "🧩",
  "🛠️", "💻", "🌱", "🎨", "📈", "🔒", "💬", "🗂️",
  "🏠", "🧠", "📦", "🔗", "🧾", "🗒️", "🏁", "❓",
  "🏥", "❤️", "🫀", "👁️", "🦴", "🦷", "🩸", "💉",
  "🩹", "🩺", "🫁", "💊", "🚑", "🧬", "🌡️", "🩻",
  "🐔", "🐶", "🐱", "🐮", "🐷", "🐘", "🐒", "🦁",
];

export default function IconPicker({
  onSelect,
  onClose,
}: {
  onSelect: (icon: string) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Full-screen invisible backdrop: any click outside the picker closes it */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 101,
          background: "white",
          border: "1px solid #ddd",
          borderRadius: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          padding: 10,
          width: 300,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 18,
                padding: 4,
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}


