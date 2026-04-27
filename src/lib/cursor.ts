"use client";

let initialized = false;

export function initCursor() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (window.matchMedia("(max-width: 768px)").matches) return;

  const canvasEl = document.getElementById("cursor-canvas");
  if (!canvasEl) return;

  initialized = true;

  const canvas = canvasEl as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  let mx = -200,
    my = -200;
  let isHovering = false;
  let isHoveringImage = false;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  document.addEventListener("mouseover", (e) => {
    const imgCard = (e.target as Element).closest(
      ".project-card, .work-exp-card"
    );
    isHoveringImage = !!imgCard;
    const interactive = (e.target as Element).closest(
      "a, button, .project-card, .work-exp-card, .category-header, .section-header, [onclick], .header-brand, .about-photo"
    );
    isHovering = !!interactive;
  });

  document.addEventListener("mouseout", (e) => {
    const imgCard = (e.target as Element).closest(
      ".project-card, .work-exp-card"
    );
    if (imgCard) isHoveringImage = false;
    const interactive = (e.target as Element).closest(
      "a, button, .project-card, .work-exp-card, .category-header, .section-header, [onclick], .header-brand, .about-photo"
    );
    if (interactive) isHovering = false;
  });

  const particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    size: number;
  }[] = [];
  const MAX_P = 12;

  function spawnParticle(x: number, y: number) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.7;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed * 0.2,
      vy: Math.sin(angle) * speed * 0.2 - 0.3,
      life: 1,
      decay: 0.03 + Math.random() * 0.02,
      size: 1.5 + Math.random() * 1.5,
    });
    if (particles.length > MAX_P) particles.shift();
  }

  let lastSpawn = 0;

  function draw(now: number) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (now - lastSpawn > 30) {
      spawnParticle(mx, my);
      lastSpawn = now;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      const alpha = p.life * 0.55;
      const r = p.size * p.life;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
      grad.addColorStop(0, `rgba(220, 230, 255, ${alpha})`);
      grad.addColorStop(0.5, `rgba(180, 200, 255, ${alpha * 0.3})`);
      grad.addColorStop(1, "rgba(180, 200, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const baseSize = isHovering ? 16 : 10;
    const outerSize = isHoveringImage ? 32 : isHovering ? 24 : 18;

    const ig = ctx.createRadialGradient(mx, my, 0, mx, my, baseSize);
    ig.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    ig.addColorStop(0.4, "rgba(210, 220, 255, 0.4)");
    ig.addColorStop(0.8, "rgba(180, 200, 255, 0.06)");
    ig.addColorStop(1, "rgba(180, 200, 255, 0)");
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(mx, my, baseSize, 0, Math.PI * 2);
    ctx.fill();

    const og = ctx.createRadialGradient(mx, my, 0, mx, my, outerSize);
    og.addColorStop(
      0,
      `rgba(200, 215, 255, ${isHoveringImage ? 0.12 : 0.07})`
    );
    og.addColorStop(
      0.6,
      `rgba(180, 200, 255, ${isHoveringImage ? 0.04 : 0.02})`
    );
    og.addColorStop(1, "rgba(180, 200, 255, 0)");
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(mx, my, outerSize, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
}
