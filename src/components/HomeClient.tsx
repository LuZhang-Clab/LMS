"use client";

import { useEffect, useState, useCallback } from "react";
import Nav from "@/components/Nav";
import type { Category, ContentBlock } from "@/types";
import { useLocale } from "@/context/LocaleProvider";

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

function resolveHtmlImages(html: string, folder: string): string {
  if (!html || !folder) return html;
  return html.replace(
    /<img([^>]+)src=(["'])(?!(?:https?:\/\/|data:))([^"']+)\2/gi,
    (_, attrs, quote, src) => {
      const trimmed = src.trim();
      if (!trimmed || trimmed.startsWith("/")) return `<img${attrs}src=${quote}${trimmed}${quote}`;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return `<img${attrs}src=${quote}${trimmed}${quote}`;
      return `<img${attrs}src=${quote}/images/projects/${folder}/${trimmed}${quote}`;
    }
  );
}

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

      // DEBUG: log content status
      console.log("[openProjectModal]", {
        id: proj.id,
        locale: locale,
        rawContentType: typeof rawContent,
        rawContentLength: typeof rawContent === "string" ? rawContent.length : "N/A",
        rawContentPreview: typeof rawContent === "string" ? rawContent.slice(0, 100) : rawContent,
        imageFolder: proj.imageFolder,
      });

      let content: React.ReactNode;

      if (typeof rawContent === "string" && rawContent.trim()) {
        // HTML string (new Tiptap format) — resolve image paths before rendering
        const resolved = resolveHtmlImages(rawContent, proj.imageFolder);
        content = (
          <div
            className="modal-html-content"
            dangerouslySetInnerHTML={{ __html: resolved }}
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
        link: proj.link || undefined,
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
