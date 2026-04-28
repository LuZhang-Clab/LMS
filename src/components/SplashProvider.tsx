"use client";

import { useEffect, useRef, useState } from "react";

const ANIM_DURATION = 9400; // ms — must match CSS .fade-out transition + display:none delay

// Module-level variable: resets on full page load (refresh),
// persists across Next.js client-side navigation (same JS module instance).
let splashPlayed = false;

function initSplashCanvas(canvasEl: HTMLCanvasElement, splashEl: HTMLElement) {
  const ctx = canvasEl.getContext("2d")!;

  function resize() {
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const cx = () => canvasEl.width / 2;
  const cy = () => canvasEl.height / 2;

  function breathCurve(p: number): number {
    if (p < 0.4) {
      const t = p / 0.4;
      return t * t * (3 - 2 * t);
    } else if (p < 0.55) {
      return 1;
    } else {
      const t = (p - 0.55) / 0.45;
      return 1 - t * t;
    }
  }

  const startTime = performance.now();
  let animId: number;
  const textWrap = splashEl.querySelector(".splash-text-wrap") as HTMLElement | null;

  function drawFrame(now: number) {
    const t = now - startTime;
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    let glowAlpha = 0;
    let glowRadius = 0;
    const scale = canvasEl.width / 1440;

    if (t >= 600 && t < 2200) {
      const p = (t - 600) / 1600;
      const b = breathCurve(p);
      glowAlpha = 0.18 * b;
      glowRadius = (200 + 100 * b) * scale;
    } else if (t >= 2600 && t < 4400) {
      const p = (t - 2600) / 1800;
      const b = breathCurve(p);
      glowAlpha = 0.5 * b;
      glowRadius = (300 + 180 * b) * scale;
    } else if (t >= 4400 && t < 5200) {
      const p = (t - 4400) / 800;
      glowAlpha = 0.3 + 0.05 * Math.sin(p * Math.PI);
      glowRadius = 420 * scale;
    } else if (t >= 5200 && t < 8200) {
      const p = (t - 5200) / 3000;
      glowAlpha = 0.3 * (1 - p * 0.3);
      glowRadius = 420 * scale;
    } else if (t >= 8200 && t < ANIM_DURATION) {
      const p = (t - 8200) / 1200;
      glowAlpha = 0.21 * (1 - p);
      glowRadius = 420 * scale;
    }

    if (glowAlpha > 0) {
      const grad = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), glowRadius);
      grad.addColorStop(0, `rgba(255, 252, 240, ${glowAlpha})`);
      grad.addColorStop(0.25, `rgba(245, 240, 225, ${glowAlpha * 0.6})`);
      grad.addColorStop(0.55, `rgba(220, 215, 200, ${glowAlpha * 0.2})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    }

    // Text appears at 4600ms (slightly after light stabilizes)
    if (t >= 4600 && textWrap && textWrap.style.opacity === "0") {
      textWrap.style.transition = "opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      textWrap.style.opacity = "1";
    }

    if (t < ANIM_DURATION) {
      animId = requestAnimationFrame(drawFrame);
    } else {
      cancelAnimationFrame(animId);
    }
  }

  if (textWrap) textWrap.style.opacity = "0";
  animId = requestAnimationFrame(drawFrame);
}

export default function SplashProvider() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (splashPlayed) return;
    splashPlayed = true;
    setShowSplash(true);

    // Read refs after state update and paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
          if (canvasRef.current && overlayRef.current) {
            initSplashCanvas(canvasRef.current, overlayRef.current);
          }
      });
    });

    const startFadeOut = setTimeout(() => {
      overlayRef.current?.classList.add("fade-out");
      setTimeout(() => {
        if (overlayRef.current) overlayRef.current.style.display = "none";
      }, 1200);
    }, 8200);

    return () => clearTimeout(startFadeOut);
  }, []);

  if (!showSplash) return null;

  return (
    <div id="splash" ref={overlayRef}>
      <canvas id="splash-canvas" ref={canvasRef} />
      <div className="splash-text-wrap">
        <div className="splash-brand">LUMOS CREATIVE</div>
        <div className="splash-sub">里面是·创意事务</div>
      </div>
    </div>
  );
}
