"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { useLocale } from "@/context/LocaleProvider";

function resolveImage(src: string, folder: string): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return src;
  return `/images/projects/${folder || "default"}/${src}`;
}

// Replace relative image src in HTML with absolute URLs before rendering,
// so the browser fetches correct paths immediately (avoids DOM timing issues).
function resolveHtmlImages(html: string, folder: string): string {
  if (!html || !folder) return html;
  return html.replace(
    /<img([^>]+)src=(["'])(?!(?:https?:\/\/|data:))([^"']+)\2/gi,
    (_, attrs, quote, src) => {
      const trimmed = src.trim();
      if (!trimmed || trimmed.startsWith("/")) return `<img${attrs}src=${quote}${trimmed}${quote}`;
      return `<img${attrs}src=${quote}${resolveImage(trimmed, folder)}${quote}`;
    }
  );
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

  // Resolve image paths in content HTML before rendering
  const resolvedHtml = resolveHtmlImages(contentHtml, imageFolder);

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
            {resolvedHtml ? (
              <div
                ref={contentRef}
                className="project-detail-html"
                dangerouslySetInnerHTML={{ __html: resolvedHtml }}
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
