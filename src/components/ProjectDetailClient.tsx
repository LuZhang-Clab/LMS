"use client";

import { useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import type { ContentBlock } from "@/types";
import { useLocale } from "@/context/LocaleProvider";

function resolveImage(src: string, folder: string): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return src;
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
  content: ContentBlock[];
  link: string | null;
}

export default function ProjectDetailClient({
  titleEn,
  titleZh,
  categoryName,
  categoryNameEn,
  coverUrl,
  imageFolder,
  content,
  link,
}: ProjectDetailClientProps) {
  const { locale } = useLocale();
  const isEn = locale === "en";
  const displayTitle = isEn ? titleEn : titleZh;
  const displayCategory = isEn ? categoryNameEn : categoryName;
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

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
            {content.map((block, i) => {
              switch (block.type) {
                case "heading":
                  return <h2 key={i}>{block.text}</h2>;
                case "text":
                  return <p key={i}>{block.text}</p>;
                case "images":
                  return (
                    <div key={i} className="project-detail-images">
                      {block.files.map((file, j) => {
                        const src = resolveImage(file, imageFolder);
                        return (
                          <img
                            key={j}
                            src={src}
                            alt={`${displayTitle}-${j}`}
                            loading="lazy"
                            onClick={() => setLightboxSrc(src)}
                            style={{ cursor: "zoom-in" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                case "link":
                  return (
                    <div key={i} className="project-detail-link">
                      <a href={block.url} target="_blank" rel="noopener noreferrer">
                        {block.text} ↗
                      </a>
                    </div>
                  );
                default:
                  return null;
              }
            })}

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
