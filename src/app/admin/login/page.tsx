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
      setError("登录失败，请重试");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-10 w-full max-w-sm text-center">
        <h1 className="text-amber-500/90 text-lg tracking-widest mb-2 font-light">LUMOS CREATIVE</h1>
        <p className="text-neutral-500 text-sm mb-6">后台管理 · 请输入管理员密码</p>
        <div className="text-red-500 text-sm mb-4 min-h-5">{error}</div>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="管理员密码"
          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded text-neutral-200 text-center tracking-widest focus:outline-none focus:border-amber-500/50 mb-4"
          autoFocus
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 bg-amber-500/90 hover:bg-amber-500 text-black font-medium tracking-wider rounded transition-colors disabled:opacity-50"
        >
          {loading ? "验证中..." : "进入后台"}
        </button>
      </div>
    </div>
  );
}
