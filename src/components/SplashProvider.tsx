"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

let splashDismissed = false;

export default function SplashProvider() {
  const pathname = usePathname();
  const splashRef = useRef<HTMLDivElement>(null);

  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/login");

  useEffect(() => {
    if (isExcluded) return;
    if (splashDismissed) return;

    splashDismissed = true;
    const splash = splashRef.current!;

    const fadeTimer = setTimeout(() => {
      splash.classList.add("fade-out");
      setTimeout(() => { splash.style.display = "none"; }, 700);
    }, 3000);

    return () => { clearTimeout(fadeTimer); };
  }, [isExcluded]);

  if (isExcluded || splashDismissed) return null;

  return (
    <div id="splash" ref={splashRef}>
      <style>{`
        #splash {
          position: fixed; inset: 0;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #161616;
          overflow: hidden;
        }

        /* ── Two-word stacked layout ── */
        .splash-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          line-height: 1;
        }

        /* Top word: LUMOS */
        .splash-word-top {
          font-family: var(--font-dm-serif), Georgia, serif;
          font-size: clamp(2.4rem, 6vw, 4.2rem);
          font-weight: 400;
          letter-spacing: 0.28em;
          color: #ffffff;
          /* Each letter animates independently */
        }

        .splash-word-top .ch {
          display: inline-block;
          opacity: 0;
          transform: translateY(20px);
          animation: letter-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .splash-word-top .ch:nth-child(1) { animation-delay: 0.1s;  }
        .splash-word-top .ch:nth-child(2) { animation-delay: 0.18s; }
        .splash-word-top .ch:nth-child(3) { animation-delay: 0.26s; }
        .splash-word-top .ch:nth-child(4) { animation-delay: 0.34s; }
        .splash-word-top .ch:nth-child(5) { animation-delay: 0.42s; }

        /* Thin divider line */
        .splash-rule {
          width: 0;
          height: 1px;
          background: rgba(255,255,255,0.5);
          margin: 0.65rem 0;
          animation: rule-grow 0.4s ease forwards 0.7s;
        }

        @keyframes rule-grow {
          to { width: 70%; }
        }

        /* Bottom word: CREATIVE */
        .splash-word-bot {
          font-family: var(--font-dm-serif), Georgia, serif;
          font-size: clamp(1.6rem, 4vw, 2.8rem);
          font-weight: 400;
          letter-spacing: 0.32em;
          color: rgba(255,255,255,0.88);
        }

        .splash-word-bot .ch {
          display: inline-block;
          opacity: 0;
          transform: translateY(20px);
          animation: letter-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .splash-word-bot .ch:nth-child(1) { animation-delay: 0.5s;  }
        .splash-word-bot .ch:nth-child(2) { animation-delay: 0.58s; }
        .splash-word-bot .ch:nth-child(3) { animation-delay: 0.66s; }
        .splash-word-bot .ch:nth-child(4) { animation-delay: 0.74s; }
        .splash-word-bot .ch:nth-child(5) { animation-delay: 0.82s; }
        .splash-word-bot .ch:nth-child(6) { animation-delay: 0.90s; }
        .splash-word-bot .ch:nth-child(7) { animation-delay: 0.98s; }
        .splash-word-bot .ch:nth-child(8) { animation-delay: 1.06s; }

        @keyframes letter-in {
          to { opacity: 1; transform: translateY(0); }
        }

        /* Subtitle */
        .splash-sub {
          font-family: var(--font-noto-serif), "Noto Serif SC", serif;
          font-size: clamp(0.72rem, 1.3vw, 1rem);
          font-weight: 400;
          letter-spacing: 0.38em;
          color: rgba(255,255,255,0.65);
          margin-top: 2rem;
          opacity: 0;
          animation: sub-in 0.8s ease forwards 1.4s;
          white-space: nowrap;
        }

        .splash-sub .dot {
          margin: 0 0.18em;
          letter-spacing: 0;
        }

        @keyframes sub-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        #splash.fade-out {
          opacity: 0;
          transition: opacity 0.7s ease;
          pointer-events: none;
        }
      `}</style>

      <div className="splash-logo">
        <div className="splash-word-top">
          <span className="ch">L</span><span className="ch">U</span><span className="ch">M</span><span className="ch">O</span><span className="ch">S</span>
        </div>
        <div className="splash-rule" />
        <div className="splash-word-bot">
          <span className="ch">C</span><span className="ch">R</span><span className="ch">E</span><span className="ch">A</span><span className="ch">T</span><span className="ch">I</span><span className="ch">V</span><span className="ch">E</span>
        </div>
      </div>

      <div className="splash-sub">里面是<span className="dot">·</span>创意事务</div>
    </div>
  );
}
