"use client";

import { useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import type { ContentBlock } from "@/types";

function resolveImage(src: string, folder: string): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("/")) return src;
  return `/images/projects/${folder}/${src}`;
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
  locale: string;
}

export default function ProjectDetailClient({
  title,
  titleEn,
  titleZh,
  categoryName,
  categoryNameEn,
  cover,
  coverUrl,
  imageFolder,
  content,
  link,
  locale,
}: ProjectDetailClientProps) {
  const isEn = locale === "en";
  const displayTitle = isEn ? titleEn : titleZh;
  const displayCategory = isEn ? categoryNameEn : categoryName;

  useEffect(() => {
    // Update nav language buttons active state
    const langEn = document.getElementById("lang-en");
    const langZh = document.getElementById("lang-zh");
    if (langEn) langEn.classList.toggle("active", locale === "en");
    if (langZh) langZh.classList.toggle("active", locale === "zh");

    // Update header brand text
    const brand = document.getElementById("nav-brand");
    if (brand) {
      if (locale === "zh") {
        brand.textContent = "里面是·创意事务";
        brand.style.fontFamily = "var(--font-noto-serif), 'Noto Serif SC', serif";
      } else {
        brand.textContent = "LUMOS CREATIVE";
        brand.style.fontFamily = "var(--font-dm-serif), Georgia, serif";
      }
    }
  }, [locale]);

  return (
    <>
      <Nav locale={locale} />

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
                      {block.files.map((file, j) => (
                        <img
                          key={j}
                          src={resolveImage(file, imageFolder)}
                          alt={`${displayTitle}-${j}`}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ))}
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

      {/* Footer */}
      <footer className="site-footer">
        <p
          style={{
            fontFamily: "var(--font-noto-sans), 'Noto Sans SC', sans-serif",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          © {new Date().getFullYear()} LUMOS CREATIVE
        </p>
      </footer>
    </>
  );
}
