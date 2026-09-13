"use client";

import { useEffect, useState } from "react";

const APP_PASSWORD = "650723"; // change this to whatever you want
const STORAGE_KEY = "motion_unlocked";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "true") {
      setUnlocked(true);
    }
    setChecked(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === APP_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!checked) return null;

  if (!unlocked) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "sans-serif",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12, width: 260 }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center", marginBottom: 8 }}>
            Project Motion
          </div>
          <input
            type="password"
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            style={{
              padding: "8px 10px",
              fontSize: 14,
              border: error ? "1px solid #c66" : "1px solid #ccc",
              borderRadius: 6,
              outline: "none",
            }}
          />
          {error && (
            <div style={{ color: "#c66", fontSize: 12, textAlign: "center" }}>
              Incorrect password.
            </div>
          )}
          <button
            type="submit"
            style={{
              padding: "8px 10px",
              fontSize: 14,
              border: "none",
              borderRadius: 6,
              background: "#333",
              color: "white",
              cursor: "pointer",
            }}
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
