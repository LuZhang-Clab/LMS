"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface NavProps {
  locale: string;
}

export default function Nav({ locale }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const isEn = locale === "en";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const switchLocale = () => {
    const newLocale = isEn ? "zh" : "en";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    if (newPath === pathname) {
      router.push(`/${newLocale}`);
    } else {
      router.push(newPath);
    }
  };

  return (
    <>
      <header className="site-header" id="site-header">
        <Link href="/" className="header-brand" id="nav-brand">
          LUMOS CREATIVE
        </Link>

        <nav className="nav-center">
          <Link
            href="/"
            id="nav-home"
            className={pathname === "/" || pathname.startsWith("/projects") ? "active" : ""}
          >
            {isEn ? "Projects" : "作品"}
          </Link>
          <Link
            href="/about"
            id="nav-about"
            className={pathname === "/about" ? "active" : ""}
          >
            {isEn ? "About" : "关于"}
          </Link>
        </nav>

        <div className="lang-group">
          <button onClick={switchLocale} className="lang-btn" id="lang-en">
            EN
          </button>
          <button onClick={switchLocale} className="lang-btn" id="lang-zh">
            中
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-10 bg-bg/95 backdrop-blur-sm md:hidden"
          style={{ display: "flex" }}
        >
          <Link href="/" className="font-serif-zh text-3xl tracking-wider text-fg" onClick={() => setMenuOpen(false)}>
            {isEn ? "Projects" : "作品"}
          </Link>
          <Link href="/about" className="font-serif-zh text-3xl tracking-wider text-fg" onClick={() => setMenuOpen(false)}>
            {isEn ? "About" : "关于"}
          </Link>
          <button onClick={switchLocale} className="font-sans text-sm text-muted mt-4">
            {isEn ? "中文" : "EN"}
          </button>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute top-5 right-6 text-fg text-sm font-sans"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
