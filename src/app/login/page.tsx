"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
      } else {
        setError("密码错误，请重试");
        setPassword("");
      }
    } catch {
      setError("连接失败，请重试");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "#111111",
        zIndex: 100001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          border: "1px solid #333333",
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
        <p
          style={{
            fontSize: "0.82rem",
            color: "#888888",
            marginBottom: "1.5rem",
          }}
        >
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
            background: "#222222",
            border: "1px solid #333333",
            borderRadius: "4px",
            color: "#e0e0e0",
            fontSize: "0.95rem",
            fontFamily: "inherit",
            textAlign: "center",
            letterSpacing: "0.15em",
            marginBottom: "1rem",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.7rem",
            background: loading ? "#a08030" : "#d4af37",
            color: "#000000",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.85rem",
            fontFamily: "inherit",
            letterSpacing: "0.1em",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.3s",
          }}
        >
          {loading ? "验证中..." : "进入后台"}
        </button>
      </div>
    </div>
  );
}
