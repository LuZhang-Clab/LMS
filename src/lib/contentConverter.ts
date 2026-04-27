/**
 * Bidirectional converter between HTML strings and ContentBlock[].
 * - Admin writes content → stored as HTML string in DB
 * - On read → HTML parsed back to ContentBlock[] for前台 rendering
 */

import type { ContentBlock } from "@/types";

// ============ ContentBlock[] → HTML (save) ============
export function contentBlocksToHtml(blocks: ContentBlock[]): string {
  if (!blocks || blocks.length === 0) return "";

  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h2>${escapeHtml(block.text)}</h2>`;
        case "text":
          return `<p>${escapeHtml(block.text || "").replace(/\n/g, "<br>")}</p>`;
        case "images": {
          const imgs =
            (block.files || [])
              .map((src) => {
                const safeSrc = escapeHtml(src);
                return `<img src="${safeSrc}" alt="" loading="lazy" style="max-width:100%;border-radius:4px;margin-bottom:0.5rem;" />`;
              })
              .join("");
          return `<div class="image-group">${imgs}</div>`;
        }
        case "link": {
          const text = escapeHtml(block.text || "");
          const url = escapeHtml(block.url || "");
          return `<p><a href="${url}" target="_blank" rel="noopener noreferrer">${text} ↗</a></p>`;
        }
        default:
          return "";
      }
    })
    .join("\n");
}

// ============ HTML → ContentBlock[] (load) ============
export function htmlToContentBlocks(html: string): ContentBlock[] {
  if (!html || typeof html !== "string") return [];

  const blocks: ContentBlock[] = [];
  // Use a temporary div to parse HTML
  const tmp = typeof document !== "undefined" ? document.createElement("div") : null;
  if (tmp) tmp.innerHTML = html;

  if (!tmp) return [];

  const children = Array.from(tmp.childNodes);

  for (const child of children) {
    if (child.nodeType === 3) {
      // Text node
      const text = child.textContent?.trim();
      if (text) {
        blocks.push({ type: "text", text });
      }
      continue;
    }

    if (child.nodeType !== 1) continue;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      const text = el.textContent?.trim() || "";
      if (text) blocks.push({ type: "heading", text });
    } else if (tag === "p" || tag === "div") {
      // Check if it's a link paragraph
      const linkEl = el.querySelector("a");
      if (linkEl) {
        const text = el.textContent?.trim() || "";
        const url = linkEl.getAttribute("href") || "";
        if (text || url) blocks.push({ type: "link", text, url });
      } else {
        // Check if it's an image group
        const imgs = Array.from(el.querySelectorAll("img"));
        if (imgs.length > 0) {
          const files = imgs
            .map((img) => img.getAttribute("src") || "")
            .filter(Boolean);
          if (files.length > 0) {
            blocks.push({ type: "images", files });
          }
        } else {
          // Text paragraph
          const text = el.textContent?.trim().replace(/↗/g, "").trim() || "";
          if (text) blocks.push({ type: "text", text });
        }
      }
    } else if (tag === "img") {
      const src = el.getAttribute("src") || "";
      if (src) blocks.push({ type: "images", files: [src] });
    }
  }

  return blocks;
}

// ============ Helpers ============
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
