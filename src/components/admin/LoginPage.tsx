"use client";

import { useState, useEffect } from "react";

interface AdminPageProps {
  onLogout: () => void;
}

// ============ Login Page (matching old site style) ============
export default function LoginPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.style.background = "#111";
    document.body.style.margin = "0";
  }, []);

  const handleLogin = () => {
    if (!password) {
      setError("请输入密码");
      return;
    }

    // Simple client-side validation (same as original)
    if (password === "lumos2024") {
      sessionStorage.setItem("adminLoggedIn", "true");
      onLoginSuccess();
    } else {
      setError("密码错误，请重试");
      setPassword("");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "2.5rem",
          width: "360px",
          maxWidth: "90vw",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            fontWeight: 400,
            color: "#d4af37",
            letterSpacing: "0.2em",
            marginBottom: "0.4rem",
          }}
        >
          LUMOS CREATIVE
        </h2>
        <p style={{ fontSize: "0.82rem", color: "#888", marginBottom: "1.5rem" }}>
          后台管理 · 请输入管理员密码
        </p>
        <div
          style={{
            color: "#e74c3c",
            fontSize: "0.8rem",
            marginBottom: "0.8rem",
            minHeight: "1.2rem",
          }}
        >
          {error}
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="管理员密码"
          autoFocus
          style={{
            width: "100%",
            padding: "0.7rem 1rem",
            background: "#222",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#e0e0e0",
            fontSize: "0.95rem",
            fontFamily: "var(--font-dm-sans), 'DM Sans', 'Noto Sans SC', sans-serif",
            textAlign: "center",
            letterSpacing: "0.15em",
            marginBottom: "1rem",
          }}
        />
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.7rem",
            background: "#d4af37",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.85rem",
            fontFamily: "var(--font-dm-sans), 'DM Sans', 'Noto Sans SC', sans-serif",
            letterSpacing: "0.1em",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "验证中..." : "进入后台"}
        </button>
      </div>
    </div>
  );
}
