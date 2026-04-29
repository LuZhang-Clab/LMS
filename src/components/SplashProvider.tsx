"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

let splashDismissed = false;

// PATHS extracted from dm_font.ttf, y-flipped for SVG, capHeight=660
const PATHS: Record<string, { d: string; w: number; lsb: number }> = {
  L: { d: "M 22 660 V 650 L 43 642 Q 64 634 69.5 622.5 Q 75 611 75 591 V 69 Q 75 49 69 37 Q 63 25 43 18 L 22 10 V 0 H 277 V 10 L 259 18 Q 240 25 233 37.5 Q 226 50 226 70 V 640 H 380 Q 417 640 434.5 622 Q 452 604 468 570 L 507 486 H 517 L 508 660 Z", w: 540, lsb: 22 },
  U: { d: "M 339 678 Q 263 678 204.5 651 Q 146 624 113.5 565.5 Q 81 507 81 411 V 66 Q 81 28 42 16 L 20 10 V 0 H 297 V 10 L 268 18 Q 231 27 231 68 V 437 Q 231 530 270 574.5 Q 309 619 382 619 Q 458 619 502.5 572 Q 547 525 547 439 V 72 Q 547 52 540.5 36.5 Q 534 21 514 16 L 489 10 V 0 H 629 V 10 L 602 17 Q 583 21 577 36 Q 571 51 571 71 V 437 Q 571 510 542 564.5 Q 513 619 461 648.5 Q 409 678 339 678 Z", w: 649, lsb: 20 },
  M: { d: "M 20 660 V 650 L 40 643 Q 74 632 74 586 V 74 Q 74 54 69.5 42 Q 65 30 46 22 L 20 10 V 0 H 213 L 398 484 L 572 0 H 769 V 10 L 753 16 Q 734 23 727 35.5 Q 720 48 720 68 V 591 Q 720 611 725 622 Q 730 633 749 641 L 769 650 V 660 H 520 V 650 L 541 641 Q 560 633 565 622 Q 570 611 570 591 V 366 L 572 80 L 363 660 H 313 L 95 87 L 98 336 V 588 Q 98 610 104.5 623.5 Q 111 637 130 643 L 152 650 V 660 Z", w: 791, lsb: 20 },
  O: { d: "M 335 678 Q 274 678 217.5 656 Q 161 634 116.5 590.5 Q 72 547 46 482 Q 20 417 20 330 Q 20 244 46 179 Q 72 114 117 70.5 Q 162 27 218.5 4.5 Q 275 -18 335 -18 Q 396 -18 452.5 3.5 Q 509 25 553.5 68.5 Q 598 112 624 177.5 Q 650 243 650 330 Q 650 415 624 480.5 Q 598 546 553.5 589.5 Q 509 633 452.5 655.5 Q 396 678 335 678 Z M 335 657 Q 390 657 424 627.5 Q 458 598 473.5 526.5 Q 489 455 489 330 Q 489 204 473.5 132.5 Q 458 61 424 31.5 Q 390 2 335 2 Q 281 2 247 31.5 Q 213 61 197.5 132.5 Q 182 204 182 330 Q 182 455 197.5 526.5 Q 213 598 247 627.5 Q 281 657 335 657 Z", w: 670, lsb: 20 },
  S: { d: "M 237 678 Q 182 678 125 664.5 Q 68 651 30 629 L 35 493 H 45 L 76 558 Q 90 586 106 607.5 Q 122 629 150 641 Q 170 651 188.5 654.5 Q 207 658 230 658 Q 291 658 326.5 625 Q 362 592 362 540 Q 362 491 338 463.5 Q 314 436 261 410 L 220 392 Q 134 354 85.5 304.5 Q 37 255 37 173 Q 37 114 67.5 71 Q 98 28 152.5 5 Q 207 -18 280 -18 Q 333 -18 380.5 -4 Q 428 10 463 34 L 457 154 H 447 L 406 79 Q 389 44 372 29.5 Q 355 15 333 9 Q 320 5 309 3.5 Q 298 2 281 2 Q 230 2 195 31.5 Q 160 61 160 111 Q 160 162 187 192.5 Q 214 223 266 247 L 312 267 Q 408 309 450 356.5 Q 492 404 492 479 Q 492 567 425.5 622.5 Q 359 678 237 678 Z", w: 521, lsb: 30 },
  C: { d: "M 366 678 Q 269 678 190.5 638.5 Q 112 599 66 521 Q 20 443 20 330 Q 20 244 48 179 Q 76 114 124.5 70 Q 173 26 236.5 4 Q 300 -18 371 -18 Q 428 -18 476 -5 Q 524 8 566 31 L 570 154 H 560 L 510 74 Q 500 55 488 39.5 Q 476 24 458 16 Q 443 9 428.5 5.5 Q 414 2 392 2 Q 334 2 286.5 33 Q 239 64 210.5 135.5 Q 182 207 182 331 Q 182 454 209 525.5 Q 236 597 282.5 627.5 Q 329 658 387 658 Q 419 658 438 653.5 Q 457 649 476 640 Q 495 632 505 616.5 Q 515 601 523 583 L 567 485 H 577 L 574 628 Q 532 650 480 664 Q 428 678 366 678 Z", w: 603, lsb: 20 },
  R: { d: "M 22 660 V 650 L 43 643 Q 63 636 69 624.5 Q 75 613 75 592 V 69 Q 75 49 69.5 37.5 Q 64 26 45 19 L 22 10 V 0 H 308 Q 426 0 489 44.5 Q 552 89 552 168 Q 552 212 519 256 Q 486 300 415 324 L 554 600 Q 563 617 574.5 627.5 Q 586 638 605 646 L 618 651 V 660 H 439 L 291 345 H 223 V 592 Q 223 611 229 623 Q 235 635 254 641 L 278 650 V 660 Z M 223 325 H 271 Q 343 325 375 286.5 Q 407 248 407 172 Q 407 95 377 57.5 Q 347 20 276 20 H 223 Z", w: 628, lsb: 22 },
  E: { d: "M 22 660 V 650 L 45 641 Q 62 634 68.5 622.5 Q 75 611 75 591 V 69 Q 75 49 69.5 37.5 Q 64 26 45 19 L 22 10 V 0 H 501 L 507 154 H 497 L 454 60 Q 445 42 435 31 Q 425 20 405 20 H 225 V 309 H 332 Q 352 309 362.5 298.5 Q 373 288 381 270 L 401 230 H 411 V 410 H 401 L 381 368 Q 372 350 362 339.5 Q 352 329 332 329 H 225 V 640 H 427 Q 447 640 458 629.5 Q 469 619 476 600 L 517 506 H 527 L 521 660 Z", w: 555, lsb: 22 },
  A: { d: "M 8 660 V 650 L 33 641 Q 53 633 64 621.5 Q 75 610 82 589 L 288 -2 H 373 L 576 593 Q 584 615 594 626.5 Q 604 638 625 646 L 637 650 V 660 H 383 V 650 L 398 645 Q 419 637 423.5 622.5 Q 428 608 422 588 L 375 444 H 153 L 105 585 Q 98 607 100.5 620 Q 103 633 124 641 L 146 650 V 660 Z M 160 424 H 369 L 268 113 Z", w: 650, lsb: 8 },
  T: { d: "M 156 660 V 650 L 197 640 Q 238 631 238 590 V 20 H 153 Q 116 20 100 39.5 Q 84 59 66 93 L 30 163 H 20 L 25 0 H 602 L 606 163 H 596 L 560 93 Q 543 59 527 39.5 Q 511 20 474 20 H 389 V 590 Q 389 631 430 640 L 471 650 V 660 Z", w: 627, lsb: 20 },
  I: { d: "M 22 660 V 650 L 42 642 Q 62 635 68.5 623 Q 75 611 75 591 V 69 Q 75 49 69 37 Q 63 25 42 18 L 22 10 V 0 H 279 V 10 L 259 18 Q 239 25 232.5 37 Q 226 49 226 69 V 591 Q 226 611 232.5 622.5 Q 239 634 259 642 L 279 650 V 660 Z", w: 301, lsb: 22 },
  V: { d: "M 284 663 70 67 Q 63 47 51.5 35.5 Q 40 24 20 18 L -4 10 V 0 H 284 V 10 L 253 19 Q 230 25 227.5 40 Q 225 55 232 77 L 380 516 L 529 76 Q 537 53 536.5 38 Q 536 23 513 17 L 487 10 V 0 H 627 V 10 L 600 18 Q 581 23 573 35.5 Q 565 48 558 68 L 358 663 Z", w: 632, lsb: -4 },
};

// ─── Layout helpers ────────────────────────────────────────────────────────────

const CAP = 660;

function buildLetters(word: string, targetCapPx: number) {
  const scale = targetCapPx / CAP;
  const totalW = word.split("").reduce((s, c) => s + (PATHS[c]?.w ?? 300), 0) * scale;
  const startX = -totalW / 2;
  let x = startX;
  return word.split("").map((ch) => {
    const p = PATHS[ch];
    if (!p) return null;
    const lx = x + p.lsb * scale;
    x += p.w * scale;
    return { ch, d: p.d, x: lx, scale };
  }).filter(Boolean);
}

const LUMOS = buildLetters("LUMOS", 42);
const CREATIVE = buildLetters("CREATIVE", 30);

interface LetterProps {
  l: NonNullable<typeof LUMOS[number]>;
  delay: number;
  strokeAnimDur: number;  // seconds for stroke-dashoffset animation
  fillStart: number;     // seconds when fill should start
}

function AnimatedLetter({ l, delay, strokeAnimDur, fillStart }: LetterProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    // stroke
    el.animate(
      [
        { strokeDashoffset: len, filter: "brightness(1.2) drop-shadow(0 0 4px rgba(255,255,255,0.5))" },
        { strokeDashoffset: 0,   filter: "brightness(1.5) drop-shadow(0 0 8px rgba(255,255,255,0.8))" },
      ],
      {
        delay: delay * 1000,
        duration: strokeAnimDur * 1000,
        fill: "forwards",
        easing: "ease",
      }
    );
    // 描边完成后白字亮起
    el.animate(
      [
        { fill: "transparent", filter: "brightness(1)" },
        { fill: "#ffffff",      filter: "brightness(1.8) drop-shadow(0 0 10px rgba(255,255,255,0.9))" },
        { fill: "#ffffff",      filter: "brightness(1.3) drop-shadow(0 0 6px rgba(255,255,255,0.6))" },
      ],
      {
        delay: (delay + strokeAnimDur) * 1000,
        duration: 0.8 * 1000,
        fill: "forwards",
        easing: "ease",
      }
    );
  }, [delay, strokeAnimDur]);

  return (
    <path
      ref={pathRef}
      d={l.d}
      transform={`translate(${l.x}, 0) scale(${l.scale})`}
      fill="transparent"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.55))" }}
    />
  );
}

// ─── Subtitle line (Chinese) ────────────────────────────────────────────────────
interface SubLineProps {
  delay: number;
  text: string;
}

function AnimatedSubLine({ delay, text }: SubLineProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.animate(
      [
        { opacity: 0, transform: "translateY(5px)", filter: "brightness(1)" },
        { opacity: 1, transform: "translateY(0)",   filter: "brightness(1.8) drop-shadow(0 0 12px rgba(255,255,255,0.9))" },
        { opacity: 1, transform: "translateY(0)",   filter: "brightness(1.3) drop-shadow(0 0 7px rgba(255,255,255,0.65))" },
      ],
      { delay: delay * 1000, duration: 0.8 * 1000, fill: "forwards", easing: "ease" }
    );
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        fontFamily: "var(--font-noto-serif), \"Noto Serif SC\", serif",
        fontSize: "1.6rem",
        fontWeight: 400,
        letterSpacing: "0.5em",
        color: "#ffffff",
        marginTop: "1.6rem",
        opacity: 0,
        whiteSpace: "nowrap",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SplashProvider() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/login");

  useEffect(() => {
    if (isExcluded) return;
    if (splashDismissed) return;

    splashDismissed = true;
    const container = containerRef.current!;

    const fadeTimer = setTimeout(() => {
      container.classList.add("fade-out");
      setTimeout(() => { container.style.display = "none"; }, 700);
    }, 7500);

    return () => { clearTimeout(fadeTimer); };
  }, [isExcluded]);

  if (isExcluded || splashDismissed) return null;

  return (
    <div id="splash" ref={containerRef}>
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

        #splash.fade-out {
          opacity: 0;
          transition: opacity 0.7s ease;
          pointer-events: none;
        }
      `}</style>

      <div className="splash-svg-wrap">
        {/* LUMOS */}
        <svg
          className="splash-word s-lumos"
          viewBox="-180 0 360 80"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="LUMOS"
          style={{ width: "auto", height: "126px" }}
        >
          {LUMOS.map((l, i) => (
            <AnimatedLetter
              key={i}
              l={l!}
              delay={0.08 + i * 0.10}
              strokeAnimDur={4}
              fillStart={4}
            />
          ))}
        </svg>

        {/* CREATIVE */}
        <svg
          className="splash-word s-creative"
          viewBox="-220 0 440 70"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="CREATIVE"
          style={{ width: "auto", height: "90px" }}
        >
          {CREATIVE.map((l, i) => (
            <AnimatedLetter
              key={i}
              l={l!}
              delay={0.65 + i * 0.08}
              strokeAnimDur={4}
              fillStart={4}
            />
          ))}
        </svg>

        <AnimatedSubLine delay={5.5} text="里面是 · 创意事务" />
      </div>
    </div>
  );
}
