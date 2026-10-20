"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Remove the old client-side password flag
    localStorage.removeItem("motion_unlocked");

    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setUserId(data.session?.user.id ?? "");
      setChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session);
      setUserId(session?.user.id ?? "");
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError("Incorrect email or password.");
  };

  if (!checked) return null;

  if (!signedIn) {
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
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, width: 260 }}>
          <div style={{ fontSize: 18, fontWeight: 600, textAlign: "center", marginBottom: 8 }}>
            Project Motion
          </div>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="Email"
            style={{ padding: "8px 10px", fontSize: 14, border: "1px solid #ccc", borderRadius: 6, outline: "none" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
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
          {error && <div style={{ color: "#c66", fontSize: 12, textAlign: "center" }}>{error}</div>}
          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "8px 10px",
              fontSize: 14,
              border: "none",
              borderRadius: 6,
              background: "#333",
              color: "white",
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{
          position: "fixed",
          top: 8,
          right: 12,
          zIndex: 300,
          border: "none",
          background: "transparent",
          color: "#888",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
      <div key={userId}>{children}</div>
    </>
  );
}
