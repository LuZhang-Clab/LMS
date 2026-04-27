"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import type { WorkExperience, Service } from "@/types";
import type { SiteLink } from "@/types";
import type { ContentBlock } from "@/types";
import { useLocale } from "@/context/LocaleProvider";
import { initCursor } from "@/lib/cursor";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function t(obj: Record<string, unknown> | null | undefined, field: string, lang: string): string {
  if (!obj) return "";
  return ((obj[`${field}_${lang}`] as string) || (obj[`${field}_en`] as string) || "") as string;
}

function resolveCover(cover: string | null, imageFolder: string | null): string {
  if (cover) {
    if (cover.startsWith("http")) return cover;
    if (cover.startsWith("/")) return cover;
    return `/images/projects/${imageFolder || "default"}/${cover}`;
  }
  if (imageFolder) return `/images/projects/${imageFolder}/cover.jpg`;
  return "";
}

function resolveImage(src: string, folder: string): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return src;
  return `/images/projects/${folder || "default"}/${src}`;
}

// ─── Contact Icons ────────────────────────────────────────────────────────────

function ContactIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    linkedin:
      '<svg viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/></svg>',
    github:
      '<svg viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    replit:
      '<svg viewBox="0 0 24 24"><path d="M2 6a4 4 0 014-4h5v7H4a2 2 0 01-2-2V6zm0 5a2 2 0 012-2h7v6H4a2 2 0 01-2-2v-2zm9-9h5a4 4 0 014 4v1a2 2 0 01-2 2h-7V2zm0 20h5a4 4 0 004-4v-1a2 2 0 00-2-2h-7v7zm-7-7h7v7H6a4 4 0 01-4-4v-1a2 2 0 012-2z"/></svg>',
    xiaohongshu:
      '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 13.93V18h-2v-2.07A6.01 6.01 0 016.07 11H8.1c.44 2.28 2.44 4 4.9 4s4.46-1.72 4.9-4h2.03A6.01 6.01 0 0113 15.93zM13 11V6h-2v5H9l3 3 3-3h-2z"/></svg>',
    email:
      '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  };
  return (
    <span
      style={{ width: 32, height: 32 }}
      dangerouslySetInnerHTML={{ __html: icons[platform] || icons.email }}
    />
  );
}

// ─── Work Exp Modal ───────────────────────────────────────────────────────────

function resolveWorkImage(src: string, detailFolder: string, id: string): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return src;
  return `/images/work/${detailFolder || id}/${src}`;
}

function WorkExpModal({
  exp,
  onClose,
  onImageClick,
}: {
  exp: WorkExperience | null;
  onClose: () => void;
  onImageClick: (src: string) => void;
}) {
  const { locale } = useLocale();
  if (!exp) return null;
  const isEn = locale === "en";
  const blocks: ContentBlock[] = isEn
    ? (exp.contentEn as ContentBlock[])
    : (exp.contentZh as ContentBlock[]);

  const expImages: string[] = Array.isArray(exp.images) ? exp.images : [];

  return (
    <div
      className="modal-overlay visible active"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button className="modal-close" onClick={onClose}>
        ×
      </button>
      <div className="modal-content">
        <h2>{isEn ? exp.titleEn : exp.titleZh}</h2>
        <p className="modal-text" style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
          {exp.period}
        </p>
        {expImages.length > 0 && (
          <div className="modal-images">
            {expImages.map((img, i) => (
              <img
                key={i}
                src={resolveWorkImage(img, exp.detailFolder || "", exp.id)}
                alt=""
                loading="lazy"
                onClick={() => onImageClick(resolveWorkImage(img, exp.detailFolder || "", exp.id))}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ))}
          </div>
        )}
        {blocks.map((block, i) => {
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
                      src={resolveImage(file, exp.detailFolder || "")}
                      alt=""
                      loading="lazy"
                      onClick={() => onImageClick(resolveImage(file, exp.detailFolder || ""))}
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
                  <a
                    href={block.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-link"
                  >
                    {block.text} →
                  </a>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

// ─── Main About Component ────────────────────────────────────────────────────

interface AboutClientProps {
  about: {
    nameEn: string;
    nameZh: string;
    titleEn: string;
    titleZh: string;
    bioEn: string;
    bioZh: string;
    quoteEn: string;
    quoteZh: string;
    educationEn: string;
    educationZh: string;
    photo: string;
    awardsZh: string;
    awardsEn: string;
  };
  workExperience: WorkExperience[];
  services: Service[];
  links: SiteLink[];
}

export default function AboutClient({
  about,
  workExperience,
  services,
  links,
}: AboutClientProps) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["work", "services"]));
  const [activeExp, setActiveExp] = useState<WorkExperience | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    initCursor();

    // Keyboard
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxSrc) setLightboxSrc(null);
        else if (activeExp) setActiveExp(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxSrc, activeExp]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const photoSrc = about.photo
    ? about.photo.startsWith("http")
      ? about.photo
      : about.photo.startsWith("/")
      ? about.photo
      : `/images/about/0.jpg`
    : `/images/about/0.jpg`;

  // Work experience images: 1.jpg-4.jpg for 4 work entries
  const getWorkExpPhoto = (index: number) => `/images/about/${index + 1}.jpg`;

  return (
    <>
      <Nav />

      <div className="page-main" id="page-about">
        {/* About Hero */}
        <div className="about-hero">
          <img
            className="about-photo"
            src={photoSrc}
            alt={about.nameEn}
            onClick={() => setLightboxSrc(photoSrc)}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="about-info">
            <h1>{isEn ? about.nameEn : about.nameZh}</h1>
            <div className="about-title">
              {isEn ? about.titleEn : about.titleZh}
            </div>
            <div className="quote">{isEn ? about.quoteEn : about.quoteZh}</div>
            <div className="bio">{isEn ? about.bioEn : about.bioZh}</div>
            <div className="education">{isEn ? about.educationEn : about.educationZh}</div>
            <div className="awards">
              {isEn ? about.awardsEn : about.awardsZh}
            </div>
          </div>
        </div>

        {/* About Sections */}
        <div className="about-sections">
          {/* Work Experience */}
          <div
            className={`section-header${openSections.has("work") ? " open" : ""}`}
            onClick={() => toggleSection("work")}
          >
            <div className="arrow" />
            <h2>{isEn ? "Work Experience" : "工作经历"}</h2>
          </div>
          <div className={`section-content${openSections.has("work") ? " open" : ""}`}>
            <div className="work-exp-scroll">
              {workExperience.map((exp, idx) => {
                // Use uploaded cover image, fallback to index-based default
                const cover = exp.cover
                  ? exp.cover.startsWith("http") || exp.cover.startsWith("/")
                    ? exp.cover
                    : `/images/work/${exp.detailFolder || exp.id}/${exp.cover}`
                  : `/images/about/${idx + 1}.jpg`;
                return (
                  <div
                    key={exp.id}
                    className="work-exp-card"
                    onClick={() => setActiveExp(exp)}
                  >
                    <div className="card-image">
                      <img
                        src={cover}
                        alt={isEn ? exp.titleEn : exp.titleZh}
                        loading="lazy"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxSrc(cover);
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `/images/about/${idx + 1}.jpg`;
                          (e.target as HTMLImageElement).onerror = null;
                        }}
                      />
                    </div>
                    <div className="card-title">
                      {isEn ? exp.titleEn : exp.titleZh}
                    </div>
                    <div className="card-period">{exp.period}</div>
                  </div>
                );
              })}
              {workExperience.length === 0 && (
                <div style={{ padding: "2rem 0", color: "var(--text-muted)", fontFamily: "var(--font-noto-sans)", fontSize: "0.82rem" }}>
                  {isEn ? "No work experience entries." : "暂无工作经历"}
                </div>
              )}
            </div>
          </div>

          {/* Services / Professional Field */}
          <div
            className={`section-header${openSections.has("services") ? " open" : ""}`}
            onClick={() => toggleSection("services")}
          >
            <div className="arrow" />
            <h2>{isEn ? "Professional Field" : "专业领域"}</h2>
          </div>
          <div className={`section-content${openSections.has("services") ? " open" : ""}`}>
            <div className="services-grid">
              {services.map((svc) => (
                <div key={svc.id} className="service-item">
                  <div className="service-title">
                    {isEn ? svc.titleEn : svc.titleZh}
                  </div>
                  <div className="service-desc">
                    {isEn ? svc.descEn : svc.descZh}
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <div style={{ padding: "2rem 0", color: "var(--text-muted)", fontFamily: "var(--font-noto-sans)", fontSize: "0.82rem" }}>
                  {isEn ? "No services listed." : "暂无专业领域"}
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="site-footer" style={{ borderTop: "none", paddingTop: "0" }}>
            <div className="contact-links">
              {links.map((link) => {
                const href =
                  link.platform === "email"
                    ? `mailto:${link.url}`
                    : link.url;
                return (
                  <a
                    key={link.platform}
                    href={href}
                    target={link.platform === "email" ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    aria-label={link.platform}
                  >
                    <ContactIcon platform={link.platform} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Work Exp Modal */}
      <WorkExpModal exp={activeExp} onClose={() => setActiveExp(null)} onImageClick={(src) => setLightboxSrc(src)} />

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="lightbox active" onClick={() => setLightboxSrc(null)}>
          <button className="lightbox-close" onClick={() => setLightboxSrc(null)}>
            ×
          </button>
          <img src={lightboxSrc} alt="" />
        </div>
      )}
    </>
  );
}
