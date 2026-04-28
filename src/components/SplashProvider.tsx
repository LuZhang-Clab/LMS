"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Timeline (total ~6.5s):
 *   0 – 600ms     : dark silence
 *   600 – 2000ms  : first glow breath  (faint warm amber)
 *   2000 – 2600ms : starfield sparkles  (tiny particles in dark)
 *   2600 – 3800ms : second glow breath (stronger, golden)
 *   3800 – 4800ms : stable glow w/ flicker + text fade-in at 3500ms
 *   4800 – 5600ms : glow decays linearly
 *   5600 – 6400ms : fade-out (CSS opacity transition 800ms)
 */

const FADE_OUT_START = 5600; // ms — when CSS .fade-out is added
const ANIM_DURATION  = 6400; // ms — must equal FADE_OUT_START + CSS transition (800ms) + buffer

// Module-level: resets on full page load, persists across client-side navigation.
let splashPlayed = false;

function initSplashCanvas(canvasEl: HTMLCanvasElement, splashEl: HTMLElement) {
  const ctx = canvasEl.getContext("2d")!;

  // ── Resize ──────────────────────────────────────────────────────────────────
  function resize() {
    canvasEl.width  = window.innerWidth;
    canvasEl.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const cx = () => canvasEl.width  / 2;
  const cy = () => canvasEl.height / 2;
  const scale = () => canvasEl.width / 1440;

  // ── Easing ──────────────────────────────────────────────────────────────────
  function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }
  function breathCurve(p: number): number {
    if (p < 0.4)  return smoothstep(p / 0.4);
    if (p < 0.55) return 1;
    return 1 - smoothstep((p - 0.55) / 0.45);
  }

  // ── Starfield ───────────────────────────────────────────────────────────────
  interface Star { x: number; y: number; r: number; phase: number; speed: number }
  const stars: Star[] = Array.from({ length: 80 }, () => ({
    x:     Math.random() * canvasEl.width,
    y:     Math.random() * canvasEl.height,
    r:     Math.random() * 1.2 + 0.4,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 1.5 + 0.8,
  }));

  function drawStars(t: number) {
    for (const s of stars) {
      const alpha = 0.15 + 0.15 * Math.sin(t * 0.001 * s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 252, 240, ${alpha})`;
      ctx.fill();
    }
  }

  // ── Radial glow (golden amber) ──────────────────────────────────────────────
  function drawGlow(radius: number, alpha: number) {
    if (alpha <= 0) return;
    const sc = scale();
    const grad = ctx.createRadialGradient(cx(), cy(), 0, cx(), cy(), radius * sc);
    // Warm amber core → cool edge
    grad.addColorStop(0,    `rgba(255, 230, 160, ${alpha})`);
    grad.addColorStop(0.3,  `rgba(240, 200, 120, ${alpha * 0.7})`);
    grad.addColorStop(0.65, `rgba(200, 170,  90, ${alpha * 0.3})`);
    grad.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
  }

  // ── Animation ───────────────────────────────────────────────────────────────
  const startTime  = performance.now();
  const textWrap   = splashEl.querySelector(".splash-text-wrap") as HTMLElement | null;
  let   textShown  = false;
  let   skipTriggered = false;

  // Expose skip fn so the overlay click/key handler can call it.
  (splashEl as HTMLElement & { __skip?: () => void }).__skip = () => {
    skipTriggered = true;
  };

  if (textWrap) textWrap.style.opacity = "0";

  function drawFrame(now: number) {
    const t = now - startTime;

    // Skip: if already past fade-out, don't re-draw — let CSS handle it
    if (skipTriggered) return;

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    let glowAlpha  = 0;
    let glowRadius = 0;

    // ── Glow phases ──
    if (t >= 600 && t < 2000) {
      const p = (t - 600) / 1400;
      const b = breathCurve(p);
      glowAlpha  = 0.18 * b;
      glowRadius = (200 + 80 * b);
    } else if (t >= 2000 && t < 2600) {
      // starfield
    } else if (t >= 2600 && t < 3800) {
      const p = (t - 2600) / 1200;
      const b = breathCurve(p);
      glowAlpha  = 0.55 * b;
      glowRadius = (300 + 160 * b);
    } else if (t >= 3800 && t < 4800) {
      const p = (t - 3800) / 1000;
      // subtle flicker in stable phase
      const flicker = 1 + 0.04 * Math.sin(t * 0.007);
      glowAlpha  = (0.32 + 0.04 * Math.sin(p * Math.PI)) * flicker;
      glowRadius = 460;
    } else if (t >= 4800 && t < FADE_OUT_START) {
      const p = (t - 4800) / (FADE_OUT_START - 4800);
      glowAlpha  = 0.32 * (1 - p * 0.6);
      glowRadius = 460;
    }

    if (glowAlpha > 0) drawGlow(glowRadius, glowAlpha);

    // ── Starfield (drawn on top of glow) ──────────────────────────────────────
    if (t >= 2000 && t < 3800) drawStars(t);

    // ── Text fade-in ─────────────────────────────────────────────────────────
    if (!textShown && t >= 3500 && textWrap) {
      textShown = true;
      textWrap.style.transition = "opacity 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      textWrap.style.opacity = "1";
    }

    if (t < ANIM_DURATION) {
      requestAnimationFrame(drawFrame);
    }
  }

  requestAnimationFrame(drawFrame);
}

export default function SplashProvider() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (splashPlayed) return;
    const pathname = window.location.pathname;
    if (pathname.startsWith("/admin") || pathname.startsWith("/about")) return;

    splashPlayed = true;
    setShowSplash(true);

    // Two rAFs to ensure DOM is painted before we read refs
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (canvasRef.current && overlayRef.current) {
          initSplashCanvas(canvasRef.current, overlayRef.current);
        }
      });
    });

    const fadeTimer = setTimeout(() => {
      const el = overlayRef.current;
      if (!el) return;
      el.classList.add("fade-out");

      // On skip (click/key): call the canvas skip fn
      const skip = () => {
        (el as HTMLElement & { __skip?: () => void }).__skip?.();
      };

      const onKey = (e: KeyboardEvent) => {
        if (e.key !== "Escape") return;
        skip();
        document.removeEventListener("keydown", onKey);
        el!.removeEventListener("click", onClick);
      };
      const onClick = () => { skip(); document.removeEventListener("keydown", onKey); el!.removeEventListener("click", onClick); };

      document.addEventListener("keydown", onKey);
      el.addEventListener("click", onClick);

      setTimeout(() => {
        if (el) el.style.display = "none";
        document.removeEventListener("keydown", onKey);
      }, 800);
    }, FADE_OUT_START);

    return () => {
      clearTimeout(fadeTimer);
      window.removeEventListener("resize", () => {});
    };
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
