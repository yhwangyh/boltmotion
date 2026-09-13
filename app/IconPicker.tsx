"use client";

const EMOJI_OPTIONS = [
  "📄", "📝", "📋", "📁", "📌", "⭐", "✅", "🔥",
  "💡", "🚀", "🎯", "📊", "📅", "🔔", "📚", "🧩",
  "🛠️", "💻", "🌱", "🎨", "📈", "🔒", "💬", "🗂️",
  "🏠", "🧠", "📦", "🔗", "🧾", "🗒️", "🏁", "❓",
  "🏥", "❤️", "🫀", "👁️", "🦴", "🦷", "🩸", "💉",
  "🩹", "🩺", "🫁", "💊", "🚑", "🧬", "🌡️", "🩻",
  "🐔", "🐶", "🐱", "🐮", "🐷", "🐘", "🐒", "🦁",
  "👨", "👩", "🧒", "👶", "🔔", "⚠️", "🚨", "🔪",
  "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫", "⬛",
  "🚧", "🛑", "🔴", "🟡", "🟢", "🇲🇾", "🇸🇬", "🇻🇳",
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
      <div onClick={onClose} className="fixed inset-0 z-[100]" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-[101] bg-popover border rounded-lg shadow-lg p-2.5 w-[300px]"
      >
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className="text-lg p-1 rounded-md hover:bg-muted"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
