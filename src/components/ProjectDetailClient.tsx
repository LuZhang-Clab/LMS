"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { useLocale } from "@/context/LocaleProvider";

function resolveImage(src: string, folder: string): string {
  if (!src) return "";
  // Already a full URL — return as-is
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  // Absolute path — return as-is
  if (src.startsWith("/")) return src;
  // Relative path (e.g. "file.jpg") — prepend the project folder
  return `/images/projects/${folder || "default"}/${src}`;
}

function Lightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <div className="lightbox active" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose}>×</button>
      <img src={src} alt="" />
    </div>
  );
}

interface ProjectDetailClientProps {
  title: string;
  titleEn: string;
  titleZh: string;
  categoryName: string;
  categoryNameEn: string;
  cover: string;
  coverUrl: string;
  imageFolder: string;
  contentHtml: string;
  link: string | null;
}

export default function ProjectDetailClient({
  titleEn,
  titleZh,
  categoryName,
  categoryNameEn,
  coverUrl,
  imageFolder,
  contentHtml,
  link,
}: ProjectDetailClientProps) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const displayTitle = isEn ? titleEn : titleZh;
  const displayCategory = isEn ? categoryNameEn : categoryName;
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fix image src paths after HTML is rendered.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      const raw = img.getAttribute("src") ?? img.src;
      img.src = resolveImage(raw, imageFolder);
    });
  }, [contentHtml, imageFolder]);

  return (
    <>
      <Nav />

      <div className="page-main">
        {/* Back link */}
        <div className="project-detail-back">
          <Link href="/">
            ← {isEn ? "Back to Projects" : "返回作品"}
          </Link>
        </div>

        {/* Content */}
        <div className="project-detail-content">
          <div className="project-detail-category">{displayCategory}</div>
          <h1 className="project-detail-title">{displayTitle}</h1>

          {coverUrl && (
            <img
              className="project-detail-cover"
              src={coverUrl}
              alt={displayTitle}
              onClick={() => setLightboxSrc(coverUrl)}
              style={{ cursor: "zoom-in" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}

          <div className="project-detail-body">
            {contentHtml ? (
              <div
                ref={contentRef}
                className="project-detail-html"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            ) : null}

            {link && link !== "#" && (
              <div className="project-detail-link">
                <a href={link} target="_blank" rel="noopener noreferrer">
                  {isEn ? "View Project" : "查看项目"} ↗
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}
