"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/Nav";
import type { Category, ContentBlock } from "@/types";
import { useLocale } from "@/context/LocaleProvider";

// ─── Splash Screen ───────────────────────────────────────────────────────────

function initSplash() {
  const splash = document.getElementById("splash");
  const canvasEl = document.getElementById("splash-canvas");
  if (!splash || !canvasEl) return;
  const canvas = canvasEl as HTMLCanvasElement;
  const ctx = canvas.getContext("2d")!;

  const textWrap = splash.querySelector(".splash-text-wrap") as HTMLElement | null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const cx = () => canvas.width / 2;
  const cy = () => canvas.height / 2;

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

  function drawFrame(now: number) {
    const t = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let glowAlpha = 0;
    let glowRadius = 0;
    const scale = canvas.width / 1440;

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
    } else if (t >= 8200 && t < 9400) {
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
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (t >= 4600 && textWrap && textWrap.style.opacity !== "1") {
      textWrap.style.transition = "opacity 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      textWrap.style.opacity = "1";
    }

    if (t < 9400) {
      requestAnimationFrame(drawFrame);
    }
  }

  if (textWrap) textWrap.style.opacity = "0";
  requestAnimationFrame(drawFrame);

  setTimeout(() => {
    splash.classList.add("fade-out");
    setTimeout(() => {
      splash.style.display = "none";
    }, 1200);
  }, 8200);
}

// ─── Canvas Cursor (delegated to shared module) ────────────────────────────────

// ─── Language & helpers ──────────────────────────────────────────────────────

function t(obj: Record<string, unknown> | null | undefined, field: string): string {
  if (!obj) return "";
  return ((obj[`${field}_en`] as string) || (obj[`${field}_zh`] as string) || "") as string;
}

function resolveCover(cover: string | null, imageFolder: string | null): string {
  if (cover) {
    if (cover.startsWith("http")) return cover;
    if (cover.startsWith("/")) return cover;
    return `/images/projects/${imageFolder || "default"}/${cover}`;
  }
  if (imageFolder) {
    return `/images/projects/${imageFolder}/cover.jpg`;
  }
  return "";
}

function resolveImage(src: string, folder: string): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return src;
  return `/images/projects/${folder || "default"}/${src}`;
}

// ─── Content Block Renderer ───────────────────────────────────────────────────

function renderContentBlocks(
  blocks: ContentBlock[],
  imageFolder: string,
  onImageClick: (src: string) => void
): React.ReactNode {
  return blocks.map((block, i) => {
    switch (block.type) {
      case "heading":
        return (
          <h3 key={i} className="modal-heading">
            {block.text}
          </h3>
        );
      case "text":
        return (
          <p key={i} className="modal-text">
            {block.text}
          </p>
        );
      case "images":
        return (
          <div key={i} className="modal-images">
            {block.files.map((file, j) => (
              <img
                key={j}
                src={resolveImage(file, imageFolder)}
                alt=""
                loading="lazy"
                onClick={() => onImageClick(resolveImage(file, imageFolder))}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ))}
          </div>
        );
      case "link":
        return (
          <div key={i} className="modal-link-wrap">
            <a href={block.url} target="_blank" rel="noopener noreferrer" className="modal-link">
              {block.text} →
            </a>
          </div>
        );
      default:
        return null;
    }
  });
}

// ─── Project Modal ───────────────────────────────────────────────────────────

interface ModalState {
  visible: boolean;
  active: boolean;
  title: string;
  content: React.ReactNode;
  link?: string;
}

function ProjectModal({
  modal,
  onClose,
}: {
  modal: ModalState;
  onClose: () => void;
}) {
  const { locale } = useLocale();
  const isEn = locale === "en";

  return (
    <div
      className={`modal-overlay${modal.visible ? " visible" : ""}${modal.active ? " active" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button className="modal-close" onClick={onClose}>
        ×
      </button>
      <div className="modal-content">
        <h2>{modal.title}</h2>
        {modal.content}
        {modal.link && modal.link !== "#" && (
          <div className="modal-link-wrap">
            <a href={modal.link} target="_blank" rel="noopener noreferrer" className="modal-link">
              {isEn ? "View Project" : "查看项目"} →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  if (!src) return null;

  return (
    <div className="lightbox active" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>
        ×
      </button>
      <img src={src} alt="" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface HomeClientProps {
  categories: Category[];
  about: {
    nameEn: string;
    nameZh: string;
    titleEn: string;
    titleZh: string;
    photo: string;
  };
}

export default function HomeClient({ categories, about }: HomeClientProps) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );
  const [modal, setModal] = useState<ModalState>({
    visible: false,
    active: false,
    title: "",
    content: null,
    link: undefined,
  });
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    initSplash();

    // Keyboard: Escape closes modal/lightbox
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxSrc) {
          setLightboxSrc(null);
        } else if (modal.visible) {
          closeModal();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [lightboxSrc, modal.visible]);

  // Update lang button active state when locale changes
  useEffect(() => {
    const langEn = document.getElementById("lang-en");
    const langZh = document.getElementById("lang-zh");
    if (langEn) langEn.classList.toggle("active", locale === "en");
    if (langZh) langZh.classList.toggle("active", locale === "zh");
  }, [locale]);

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openProjectModal = useCallback(
    (proj: Category["projects"][0]) => {
      const rawContent = isEn ? proj.contentEn : proj.contentZh;
      let content: React.ReactNode;

      if (typeof rawContent === "string" && rawContent.trim()) {
        // HTML string (new Tiptap format) — render directly, wire image clicks
        content = (
          <div
            className="modal-html-content"
            dangerouslySetInnerHTML={{ __html: rawContent }}
            onClick={(e) => {
              const img = (e.target as HTMLElement).closest("img");
              if (img && img.src) {
                e.preventDefault();
                setLightboxSrc(img.src);
              }
            }}
          />
        );
      } else if (Array.isArray(rawContent)) {
        // Legacy ContentBlock[] format
        content = renderContentBlocks(
          rawContent as ContentBlock[],
          proj.imageFolder,
          (src) => setLightboxSrc(src)
        );
      } else {
        content = null;
      }

      setModal({
        visible: true,
        active: false,
        title: isEn ? proj.titleEn : proj.titleZh,
        content,
        link: undefined,
      });

      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setModal((m) => ({ ...m, active: true }));
        });
      });
    },
    [isEn]
  );

  const closeModal = useCallback(() => {
    setModal((m) => ({ ...m, active: false }));
    setTimeout(() => {
      setModal((m) => ({ ...m, visible: false, content: null }));
      document.body.style.overflow = "";
    }, 700);
  }, []);

  const name = isEn ? about.nameEn : about.nameZh;
  const title = isEn ? about.titleEn : about.titleZh;

  return (
    <>
      {/* Splash Screen */}
      <div id="splash">
        <canvas id="splash-canvas" />
        <div className="splash-text-wrap">
          <div className="splash-brand">LUMOS CREATIVE</div>
          <div className="splash-sub">里面是·创意事务</div>
        </div>
      </div>

      <Nav />

      {/* Home Page */}
      <div className="page-main active" id="page-home">
        {/* Hero */}
        <div className="home-hero">
          <h1 onClick={() => (window.location.href = "/about")}>{name}</h1>
          <p>{title}</p>
        </div>

        {/* Categories */}
        <div className="categories-section" id="categories-container">
          {categories.map((cat) => {
            const isOpen = openCategories.has(cat.id);
            return (
              <div key={cat.id} className="category-block">
                <div
                  className={`category-header${isOpen ? " open" : ""}`}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <div className="arrow" />
                  <h2>
                    {isEn
                      ? (cat.nameEn || "").replace(/\b\w/g, (c) => c.toUpperCase())
                      : cat.nameZh}
                  </h2>
                </div>

                <div className={`projects-grid${isOpen ? " open" : ""}`}>
                  {cat.projects.map((proj) => {
                    const coverUrl = resolveCover(proj.cover, proj.imageFolder);
                    return (
                      <div
                        key={proj.id}
                        className="project-card"
                        onClick={() => openProjectModal(proj)}
                      >
                        <div className="card-image">
                          {coverUrl ? (
                            <img
                              src={coverUrl}
                              alt={isEn ? proj.titleEn : proj.titleZh}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                background: "var(--bg-secondary)",
                              }}
                            />
                          )}
                        </div>
                        <div className="card-title">
                          {isEn ? proj.titleEn : proj.titleZh}
                        </div>
                      </div>
                    );
                  })}
                  {cat.projects.length === 0 && (
                    <div style={{ padding: "2rem 0", color: "var(--text-muted)", fontFamily: "var(--font-noto-sans)", fontSize: "0.82rem" }}>
                      {isEn ? "No projects yet." : "暂无作品"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <ProjectModal modal={modal} onClose={closeModal} />

      {/* Lightbox */}
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}
