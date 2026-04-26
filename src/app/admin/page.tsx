"use client";

import { useState, useEffect } from "react";
import LoginPage from "@/components/admin/LoginPage";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.body.style.background = "#111";
    document.body.style.margin = "0";

    const loggedIn = sessionStorage.getItem("adminLoggedIn");
    if (loggedIn === "true") {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminLoggedIn");
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#d4af37", fontSize: "1.2rem", fontFamily: "sans-serif" }}>加载中...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
