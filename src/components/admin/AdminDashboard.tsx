"use client";

import { useState, useEffect, useRef } from "react";
import { TiptapEditor } from "./TiptapEditor";
import { upload } from "@vercel/blob/client";

// Build image URL prefix from imageFolder
function getImagePrefix(folder: string): string {
  if (!folder) return "/images/projects/default";
  if (folder === "about") return "/images/about";
  if (folder.startsWith("w-")) return `/images/work/${folder}`;
  return `/images/projects/${folder}`;
}

// Strip absolute prefix from image src, returning the relative filename.
// e.g. /images/projects/proj-123/photo.jpg → photo.jpg
function stripImagePrefix(src: string, folder: string): string {
  const prefix = getImagePrefix(folder);
  if (src.startsWith(prefix + "/")) {
    return src.slice(prefix.length + 1);
  }
  return src;
}

// Convert relative image src in HTML to absolute URLs for Tiptap display.
// Also handles already-absolute URLs and data URIs unchanged.
function normalizeContentUrls(html: string, folder: string): string {
  if (!html || !folder) return html;
  const prefix = getImagePrefix(folder);
  return html.replace(
    /<img([^>]+)src=(["'])(?!(?:https?:\/\/|data:))([^"']+)\2/gi,
    (_, attrs, quote, src) => {
      const trimmed = src.trim();
      if (!trimmed || trimmed.startsWith("/")) return `<img${attrs}src=${quote}${trimmed}${quote}`;
      return `<img${attrs}src=${quote}${prefix}/${trimmed}${quote}`;
    }
  );
}

// Strip absolute image URL prefix from HTML before saving to DB,
// so stored data stays consistent (relative filenames only).
// Also preserves blob URLs and external URLs as-is.
function denormalizeContentUrls(html: string, folder: string): string {
  if (!html || !folder) return html;
  const prefix = getImagePrefix(folder);
  return html.replace(
    /<img([^>]+)src=(["'])(https?:\/\/[^"']+)\2/gi,
    (_, attrs, quote, src) => {
      // Preserve any URL that already has a scheme (https:// or http://)
      // — blob URLs, CDN URLs, external images stay as-is
      if (src.startsWith("http://") || src.startsWith("https://")) {
        return `<img${attrs}src=${quote}${src}${quote}`;
      }
      // Strip our known absolute prefix if present
      if (src.startsWith(prefix + "/")) {
        const rel = src.slice(prefix.length + 1);
        return `<img${attrs}src=${quote}${rel}${quote}`;
      }
      return `<img${attrs}src=${quote}${src}${quote}`;
    }
  );
}

// Strip any double-prefixed paths from existing DB content:
// e.g. /images/projects/xxx//images/projects/xxx/photo.jpg → photo.jpg
// Used only when loading data from DB to fix legacy corrupted paths.
function stripDoublePrefix(html: string): string {
  if (!html) return html;
  return html.replace(
    /src=(["'])\/images\/projects\/[^/"']+\/\/images\/projects\/[^/"']+\/([^"']+)\1/gi,
    (_, quote, filename) => `src=${quote}${filename}${quote}`
  );
}

// ============ Shared Upload Helper ============
// Uses direct-to-Vercel-Blob client upload on Vercel (bypasses 4.5MB serverless limit),
// falls back to traditional FormData upload for local dev / non-Vercel environments.
async function uploadFile(file: File, folder: string): Promise<string | null> {
  // Try client-side direct upload via /api/upload (Vercel Blob — no 4.5MB limit)
  try {
    const { url } = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/upload",
      clientPayload: JSON.stringify({ folder }),
    });
    return url;
  } catch {
    // Fall through to local dev fallback
  }

  // Traditional FormData upload for local dev / non-Vercel environments
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) return null;
  const data = await res.json();
  return data.url ?? null;
}

// ============ Types ============
interface SiteData {
  site: {
    title_en: string;
    title_zh: string;
    subtitle_en: string;
    subtitle_zh: string;
  };
  links: {
    linkedin: string;
    github: string;
    replit: string;
    xiaohongshu: string;
    email: string;
  };
  about: {
    name_zh: string;
    name_en: string;
    title_zh: string;
    title_en: string;
    photo: string;
    quote_zh: string;
    quote_en: string;
    bio_zh: string;
    bio_en: string;
    education_zh: string;
    education_en: string;
  };
  categories: Array<{
    id: string;
    name_zh: string;
    name_en: string;
    projects: Array<{
      id: string;
      categoryId: string;
      title_zh: string;
      title_en: string;
      cover: string;
      imageFolder: string;
      link: string;
      images: string[];
      content_zh: string;
      content_en: string;
      sort_order: number;
    }>;
  }>;
  workExperience: Array<{
    id: string;
    title_zh: string;
    title_en: string;
    period: string;
    detail_folder: string;
    images: string[];
    cover: string;
    content_zh: string;
    content_en: string;
    sort_order: number;
    newEntry?: boolean;
  }>;
  services: Array<{
    id: string;
    title_zh: string;
    title_en: string;
    desc_zh: string;
    desc_en: string;
    sort_order: number;
  }>;
}

// ============ Shared Styles ============
const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "var(--font-dm-sans), 'DM Sans', 'Noto Sans SC', sans-serif",
  } as React.CSSProperties,
  card: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "6px",
    padding: "1.2rem",
    marginBottom: "0.8rem",
  } as React.CSSProperties,
  cardDark: {
    background: "#222",
    border: "1px solid #333",
    borderRadius: "6px",
    padding: "1.2rem",
    marginBottom: "0.8rem",
  } as React.CSSProperties,
  formGroup: {
    marginBottom: "1.2rem",
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: "0.75rem",
    color: "#888",
    marginBottom: "0.3rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "0.6rem 0.8rem",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "4px",
    color: "#e0e0e0",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
  } as React.CSSProperties,
  textarea: {
    width: "100%",
    padding: "0.6rem 0.8rem",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "4px",
    color: "#e0e0e0",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
    minHeight: "80px",
    resize: "vertical" as const,
  } as React.CSSProperties,
  btn: {
    padding: "0.5rem 1.2rem",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.82rem",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.03em",
    transition: "all 0.3s",
  } as React.CSSProperties,
  btnPrimary: {
    padding: "0.5rem 1.2rem",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.82rem",
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.03em",
    background: "#d4af37",
    color: "#000",
  } as React.CSSProperties,
  btnDanger: {
    padding: "0.3rem 0.7rem",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.78rem",
    cursor: "pointer",
    fontFamily: "inherit",
    background: "#e74c3c",
    color: "#fff",
  } as React.CSSProperties,
  btnOutline: {
    padding: "0.3rem 0.7rem",
    border: "1px solid #333",
    borderRadius: "4px",
    fontSize: "0.78rem",
    cursor: "pointer",
    fontFamily: "inherit",
    background: "transparent",
    color: "#e0e0e0",
  } as React.CSSProperties,
  row: {
    display: "flex",
    gap: "1rem",
  } as React.CSSProperties,
};

// ============ Toast Component ============
function Toast({ message, type, onClose }: { message: string; type: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "#2ecc71" : type === "info" ? "#3498db" : "#e74c3c";

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        padding: "0.7rem 1.4rem",
        borderRadius: "4px",
        fontSize: "0.85rem",
        zIndex: 1000,
        color: "#fff",
        background: bgColor,
      }}
    >
      {message}
    </div>
  );
}

// ============ Photo Uploader (About) ============
function PhotoUploader({
  photo,
  onPhotoChange,
}: {
  photo: string;
  onPhotoChange: (photo: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useRef(`photo-upload-${Math.random().toString(36).slice(2)}`);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFile(file, "about");
      if (url) {
        onPhotoChange(url);
      } else {
        alert("上传失败：服务器未返回有效路径");
      }
    } catch (e) {
      console.error("Upload failed:", e);
      alert("上传失败");
    }
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      <img
        src={photo || ""}
        alt="个人照片"
        style={{
          width: "100px",
          height: "120px",
          objectFit: "cover",
          borderRadius: "4px",
          border: "1px solid #333",
          background: "#222",
          flexShrink: 0,
        }}
      />
      <label
        htmlFor={fileInputId.current}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed #444",
          borderRadius: "6px",
          padding: "1.5rem",
          cursor: isUploading ? "not-allowed" : "pointer",
          fontSize: "0.82rem",
          color: isUploading ? "#d4af37" : "#888",
          transition: "all 0.3s",
          minHeight: "100px",
        }}
      >
        <span>{isUploading ? "上传中..." : "点击上传新照片"}</span>
        <input
          ref={inputRef}
          id={fileInputId.current}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: "none" }}
          disabled={isUploading}
        />
      </label>
    </div>
  );
}

// ============ Image Uploader ============
function ImageUploader({
  images,
  cover,
  imageFolder,
  onImagesChange,
  onCoverChange,
}: {
  images: string[];
  cover: string;
  imageFolder: string;
  onImagesChange: (images: string[]) => void;
  onCoverChange: (cover: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadZoneRef = useRef<HTMLDivElement>(null);
  const imageList: string[] = Array.isArray(images) ? images : [];

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`上传中... (0/${files.length})`);
    const newImages: string[] = [...imageList];
    let firstUploadedUrl = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      setUploadProgress(`上传中... (${i + 1}/${files.length})`);

      try {
        const url = await uploadFile(file, imageFolder || "projects");
        if (url) {
          newImages.push(url);
          if (!firstUploadedUrl) firstUploadedUrl = url;
        }
      } catch (e) {
        console.error("Upload failed:", e);
      }
    }

    if (!cover && firstUploadedUrl) {
      onCoverChange(firstUploadedUrl);
    }

    onImagesChange(newImages);
    setIsUploading(false);
    setUploadProgress("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!uploadZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const deleteImage = (index: number) => {
    if (!confirm("删除这张图片？")) return;
    const newImages = [...imageList];
    const deletedUrl = newImages.splice(index, 1)[0];
    onImagesChange(newImages);
    if (cover === deletedUrl) {
      onCoverChange(newImages[0] || "");
    }
  };

  return (
    <div>
          {imageList.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: "0.6rem",
            margin: "0.6rem 0",
          }}
        >
          {imageList.map((url, idx) => (
            <div
              key={idx}
              onClick={() => onCoverChange(url)}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: "4px",
                overflow: "hidden",
                border: url === cover ? "2px solid #d4af37" : "2px solid transparent",
                cursor: "pointer",
                transition: "border-color 0.2s",
              }}
            >
              <img
                src={url}
                alt=""
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {url === cover && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: "4px",
                    background: "#d4af37",
                    color: "#000",
                    fontSize: "0.65rem",
                    padding: "1px 5px",
                    borderRadius: "2px",
                    fontWeight: 700,
                  }}
                >
                  封面
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteImage(idx);
                }}
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  background: "#e74c3c",
                  color: "#fff",
                  border: "none",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  fontSize: "0.7rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        ref={uploadZoneRef}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: "2px dashed #444",
          borderRadius: "6px",
          padding: "1.5rem",
          textAlign: "center",
          cursor: isUploading ? "not-allowed" : "pointer",
          transition: "all 0.3s",
          background: isDragging ? "rgba(212,175,55,.04)" : "transparent",
          borderColor: isDragging ? "#d4af37" : "#444",
          margin: "0.6rem 0",
        }}
      >
        <p style={{ color: isUploading ? "#d4af37" : "#888", fontSize: "0.82rem", margin: 0 }}>
          {uploadProgress || "点击或拖拽上传图片"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          style={{ display: "none" }}
          disabled={isUploading}
        />
      </div>
    </div>
  );
}

// ============ Cover Picker ============
function CoverPicker({
  coverImage,
  coverSource,
  localContentZh,
  localContentEn,
  imageFolder,
  onSetCover,
  onToast,
}: {
  coverImage: string;
  coverSource: "manual" | "auto";
  localContentZh: string;
  localContentEn: string;
  imageFolder: string;
  onSetCover: (src: string, source: "manual" | "auto") => void;
  onToast?: (msg: string, type?: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const extractAllImages = (html: string): string[] => {
    const matches = html.matchAll(/src\s*=\s*(["'])([^"']+)\1/gi);
    const images: string[] = [];
    for (const match of matches) {
      const src = match[2].trim();
      if (src && !images.includes(src)) images.push(src);
    }
    return images;
  };

  const makeAbsolute = (src: string) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) return src;
    const prefix = getImagePrefix(imageFolder);
    return `${prefix}/${src}`;
  };

  const contentImages = [
    ...extractAllImages(localContentZh),
    ...extractAllImages(localContentEn),
  ];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, imageFolder || "projects");
      if (url) onSetCover(url, "manual");
      else onToast?.("封面图上传失败", "error");
    } catch {
      onToast?.("封面图上传失败", "error");
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const handlePickFromContent = (src: string) => {
    onSetCover(src, "manual");
  };

  const handleSetAuto = () => {
    onSetCover("", "auto");
  };

  const preview = makeAbsolute(coverImage);
  const isAuto = coverSource === "auto";
  const autoCover = (() => {
    const zh = localContentZh.match(/src\s*=\s*(["'])([^"']+)\1/i);
    const en = localContentEn.match(/src\s*=\s*(["'])([^"']+)\1/i);
    return (zh ? zh[2] : en ? en[2] : "") as string;
  })();
  const autoPreview = makeAbsolute(autoCover);

  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <label style={styles.label}>封面图 · COVER</label>

      <div style={{ marginBottom: "0.5rem" }}>
        <img
          src={isAuto && autoPreview ? autoPreview : preview}
          alt="封面预览"
          style={{
            width: "120px",
            height: "80px",
            objectFit: "cover",
            borderRadius: "4px",
            border: "1px solid #333",
            background: "#111",
            display: "block",
          }}
        />
        {isAuto && (
          <span style={{ fontSize: "0.7rem", color: "#555", marginTop: "2px", display: "block" }}>
            自动提取（尚未手动设置）
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <label
          style={{
            ...styles.btn as React.CSSProperties,
            background: "#333",
            color: "#ccc",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? "上传中..." : "上传封面"}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: "none" }}
            disabled={uploading}
          />
        </label>

        {coverSource === "auto" && autoCover && (
          <button
            onClick={handleSetAuto}
            style={{
              ...styles.btn as React.CSSProperties,
              background: "transparent",
              border: "1px solid #444",
              color: "#666",
              fontSize: "0.75rem",
            }}
          >
            保持自动
          </button>
        )}
      </div>

      {contentImages.length > 0 && (
        <div style={{ marginTop: "0.6rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#555", marginBottom: "0.3rem", display: "block" }}>
            或从正文中选择：
          </span>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {contentImages.map((src, i) => {
              const abs = makeAbsolute(src);
              const isSelected =
                coverSource === "manual" && coverImage === src;
              return (
                <div
                  key={i}
                  onClick={() => handlePickFromContent(src)}
                  title="设为封面"
                  style={{
                    position: "relative",
                    cursor: "pointer",
                    borderRadius: "3px",
                    border: isSelected ? "2px solid #d4af37" : "2px solid transparent",
                    overflow: "visible",
                  }}
                >
                  <img
                    src={abs}
                    alt={`图片${i + 1}`}
                    style={{
                      width: "56px",
                      height: "40px",
                      objectFit: "cover",
                      borderRadius: "3px",
                      display: "block",
                    }}
                  />
                  {isSelected && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-18px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "0.6rem",
                        color: "#d4af37",
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                      }}
                    >
                      封面
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Section Header (shared visual separator) ============
function SectionHeader({ label }: { label: string }) {
  return (
    <div
      style={{
        fontSize: "0.68rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#555",
        marginBottom: "0.5rem",
        marginTop: "0.3rem",
        paddingTop: "0.6rem",
        borderTop: "1px solid #2a2a2a",
      }}
    >
      {label}
    </div>
  );
}

// ============ Project Item (collapsible) ============
function ProjectItem({
  proj,
  onUpdate,
  onDelete,
  categoryId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
  onToast,
}: {
  proj: SiteData["categories"][0]["projects"][0];
  onUpdate: (field: string, value: unknown) => void;
  onDelete: () => void;
  categoryId: string;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragOver?: boolean;
  onToast?: (msg: string, type?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleting, setDeleting] = useState(false);

  // Local state mirrors the content fields so handleSave always reads fresh editor output.
  const [localContentZh, setLocalContentZh] = useState(proj.content_zh || "");
  const [localContentEn, setLocalContentEn] = useState(proj.content_en || "");

  const [coverImage, setCoverImage] = useState(proj.cover || "");
  const [coverSource, setCoverSource] = useState<"manual" | "auto">(
    proj.cover ? "manual" : "auto"
  );

  const extractFirstImage = (html: string): string => {
    const match = html.match(/src\s*=\s*(["'])([^"']+)\1/i);
    return match ? match[2] : "";
  };

  const extractAllImages = (html: string): string[] => {
    const matches = html.matchAll(/src\s*=\s*(["'])([^"']+)\1/gi);
    const images: string[] = [];
    for (const match of matches) {
      const src = match[2].trim();
      if (src && !images.includes(src)) {
        images.push(src);
      }
    }
    return images;
  };

  const getDefaultCover = (): string => {
    const zh = extractFirstImage(localContentZh);
    const en = extractFirstImage(localContentEn);
    return zh || en || "";
  };

  const handleContentChange = (field: "content_zh" | "content_en", html: string) => {
    const normalized = denormalizeContentUrls(html, proj.imageFolder);
    if (field === "content_zh") setLocalContentZh(normalized);
    else setLocalContentEn(normalized);
    onUpdate(field, normalized);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const zhImages = extractAllImages(localContentZh);
      const enImages = extractAllImages(localContentEn);
      const allImages = [...new Set([...zhImages, ...enImages])];

      const finalCover =
        coverSource === "manual" && coverImage
          ? coverImage
          : getDefaultCover();

      const res = await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "project",
          id: proj.id,
          categoryId,
          title_en: proj.title_en,
          title_zh: proj.title_zh,
          cover: finalCover,
          imageFolder: proj.imageFolder,
          link: proj.link,
          images: allImages,
          content_zh: denormalizeContentUrls(localContentZh, proj.imageFolder),
          content_en: denormalizeContentUrls(localContentEn, proj.imageFolder),
        }),
      });
      if (res.ok) {
        onUpdate("images", allImages);
        onUpdate("cover", finalCover);
        if (coverSource === "manual") {
          setCoverImage(finalCover);
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        onToast?.("项目已保存", "success");
      } else {
        setSaveStatus("error");
        onToast?.("保存失败，请重试", "error");
      }
    } catch {
      setSaveStatus("error");
      onToast?.("保存失败", "error");
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        background: "#222",
        border: "1px solid",
        borderColor: isDragOver ? "#d4af37" : "#333",
        borderRadius: "6px",
        marginBottom: "0.7rem",
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header — always visible */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.85rem 1rem",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span
          title="拖动排序"
          style={{ cursor: "grab", color: "#555", fontSize: "1rem", flexShrink: 0, lineHeight: 1 }}
        >
          ⋮⋮
        </span>
        <span
          style={{
            fontSize: "0.6rem",
            color: "#555",
            transition: "transform 0.2s",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        >
          ▶
        </span>

        <strong
          style={{
            flex: 1,
            fontSize: "0.88rem",
            fontWeight: 500,
            color: expanded ? "#d4af37" : "#ccc",
            transition: "color 0.2s",
          }}
        >
          {proj.title_zh || proj.title_en || "新项目"}
        </strong>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!confirm("确定删除此项目？")) return;
            setDeleting(true);
            fetch("/api/admin/update", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "project", id: proj.id }),
            }).then((res) => {
              if (res.ok) onDelete();
              else setDeleting(false);
            });
          }}
          disabled={deleting}
          style={{
            padding: "0.18rem 0.55rem",
            background: "#e74c3c",
            color: "#fff",
            border: "none",
            borderRadius: "3px",
            fontSize: "0.72rem",
            cursor: "pointer",
            fontFamily: "inherit",
            flexShrink: 0,
          }}
        >
          删除
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div
          style={{
            padding: "0.5rem 1rem 1.1rem",
            borderTop: "1px solid #2a2a2a",
          }}
        >
          {/* Title inputs */}
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>标题 (中文)</label>
              <input
                type="text"
                value={proj.title_zh}
                onChange={(e) => onUpdate("title_zh", e.target.value)}
                style={styles.input}
                placeholder="项目名称（中文）"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>标题 (英文)</label>
              <input
                type="text"
                value={proj.title_en}
                onChange={(e) => onUpdate("title_en", e.target.value)}
                style={styles.input}
                placeholder="Project Name"
              />
            </div>
          </div>

          {/* External link */}
          <div style={styles.formGroup}>
            <label style={styles.label}>外部链接 (可选)</label>
            <input
              type="text"
              value={proj.link}
              onChange={(e) => onUpdate("link", e.target.value)}
              style={styles.input}
              placeholder="https://..."
            />
          </div>

          {/* Cover picker */}
          <CoverPicker
            coverImage={coverImage}
            coverSource={coverSource}
            localContentZh={localContentZh}
            localContentEn={localContentEn}
            imageFolder={proj.imageFolder}
            onSetCover={(src, source) => {
              setCoverImage(src);
              setCoverSource(source);
            }}
            onToast={onToast}
          />

          {/* Content section */}
          <SectionHeader label="详情内容 · DETAILS" />

          <div style={styles.formGroup}>
            <label style={{ ...styles.label, color: "#777" }}>
              中文 <span style={{ fontWeight: 400, textTransform: "none", fontStyle: "italic", color: "#555" }}>Chinese</span>
            </label>
            <TiptapEditor
              initialHtml={proj.content_zh || ""}
              onChange={(html) => handleContentChange("content_zh", html)}
              imageFolder={proj.imageFolder}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={{ ...styles.label, color: "#777" }}>
              英文 <span style={{ fontWeight: 400, textTransform: "none", fontStyle: "italic", color: "#555" }}>English</span>
            </label>
            <TiptapEditor
              initialHtml={proj.content_en || ""}
              onChange={(html) => handleContentChange("content_en", html)}
              imageFolder={proj.imageFolder}
            />
          </div>

          {/* Save button */}
          <div style={{ marginTop: "1rem" }}>
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving"}
              style={{
                ...styles.btnPrimary,
                opacity: saveStatus === "saving" ? 0.6 : 1,
                cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
              }}
            >
              {saveStatus === "saving"
                ? "保存中..."
                : saveStatus === "saved"
                ? "已保存 ✓"
                : saveStatus === "error"
                ? "保存失败，重试"
                : "保存此项目"}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

// ============ Projects Tab ============
function ProjectsTab({ data, updateData, showToast }: { data: SiteData; updateData: (path: string, value: unknown) => void; showToast: (msg: string, type?: string) => void }) {
  const addCategory = async () => {
    const id = "cat-" + Date.now();
    try {
      await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "category", id, name_en: "New Category", name_zh: "新分类", sort_order: data.categories.length }),
      });
      updateData("categories", [
        ...data.categories,
        { id, key: id, name_en: "New Category", name_zh: "新分类", sort_order: data.categories.length, projects: [] },
      ]);
    } catch (e) {
      console.error("Failed to add category:", e);
    }
  };

  const removeCategory = async (index: number) => {
    if (!confirm("确定删除此分类及其所有项目？")) return;
    const catId = data.categories[index].id;
    try {
      await fetch("/api/admin/update", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "category", id: catId }),
      });
      const newCats = [...data.categories];
      newCats.splice(index, 1);
      updateData("categories", newCats);
      showToast("分类已删除", "success");
    } catch (e) {
      console.error("Failed to delete category:", e);
      showToast("删除分类失败", "error");
    }
  };

  const saveCategory = async (index: number) => {
    const cat = data.categories[index];
    try {
      await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          id: cat.id,
          name_en: cat.name_en,
          name_zh: cat.name_zh,
          sort_order: index,
        }),
      });
      showToast("分类已保存", "success");
    } catch (e) {
      console.error("Failed to save category:", e);
      showToast("保存分类失败", "error");
    }
  };

  // Drag state: 'cat' | 'proj'
  const [draggingCat, setDraggingCat] = useState<number | null>(null);
  const [draggingProj, setDraggingProj] = useState<{ cat: number; proj: number } | null>(null);
  const [dragOverCat, setDragOverCat] = useState<number | null>(null);
  const [dragOverProj, setDragOverProj] = useState<{ cat: number; proj: number } | null>(null);

  const onCatDragStart = (e: React.DragEvent, index: number) => {
    setDraggingCat(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const onCatDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCat(index);
  };
  const onCatDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggingCat === null || draggingCat === toIndex) {
      setDraggingCat(null);
      setDragOverCat(null);
      return;
    }
    const newCats = [...data.categories];
    const [moved] = newCats.splice(draggingCat, 1);
    newCats.splice(toIndex, 0, moved);
    updateData("categories", newCats);
    setDraggingCat(null);
    setDragOverCat(null);
    // auto-save both affected categories
    saveCategory(draggingCat < toIndex ? toIndex : draggingCat);
    saveCategory(draggingCat < toIndex ? draggingCat : toIndex);
  };
  const onCatDragEnd = () => {
    setDraggingCat(null);
    setDragOverCat(null);
  };

  const onProjDragStart = (e: React.DragEvent, catIndex: number, projIndex: number) => {
    setDraggingProj({ cat: catIndex, proj: projIndex });
    e.dataTransfer.effectAllowed = "move";
  };
  const onProjDragOver = (e: React.DragEvent, catIndex: number, projIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverProj({ cat: catIndex, proj: projIndex });
  };
  const onProjDrop = (e: React.DragEvent, toCat: number, toProj: number) => {
    e.preventDefault();
    if (!draggingProj) return;
    const { cat: fromCat, proj: fromProj } = draggingProj;
    if (fromCat === toCat && fromProj === toProj) {
      setDraggingProj(null);
      setDragOverProj(null);
      return;
    }
    const newCats = [...data.categories];
    const [moved] = newCats[fromCat].projects.splice(fromProj, 1);
    newCats[toCat].projects.splice(toProj, 0, moved);
    // update sort_order locally
    newCats.forEach((cat, ci) =>
      cat.projects.forEach((p: Record<string, unknown>, pi: number) => {
        p.sort_order = pi;
      })
    );
    updateData("categories", newCats);
    setDraggingProj(null);
    setDragOverProj(null);
    // persist new order for affected projects
    const movedProj = newCats[toCat].projects[toProj];
    saveProjectOrder(movedProj.id, newCats[toCat].id, toProj);
  };
  const onProjDragEnd = () => {
    setDraggingProj(null);
    setDragOverProj(null);
  };

  const saveProjectOrder = async (projId: string, categoryId: string, sortOrder: number) => {
    try {
      await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "project", id: projId, categoryId, sort_order: sortOrder }),
      });
    } catch (e) {
      console.error("Failed to save project order:", e);
    }
  };

  const addProject = async (catIndex: number) => {
    const id = "proj-" + Date.now();
    const categoryId = data.categories[catIndex].id;
    try {
      await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "project",
          id,
          categoryId,
          title_en: "",
          title_zh: "",
          cover: "",
          imageFolder: id,
          link: "",
          images: [],
          content_zh: "",
          content_en: "",
          sort_order: data.categories[catIndex].projects.length,
        }),
      });
      const newCats = [...data.categories];
      newCats[catIndex].projects.push({
        id,
        categoryId,
        title_zh: "",
        title_en: "",
        cover: "",
        imageFolder: id,
        link: "",
        images: [],
        content_zh: "",
        content_en: "",
        sort_order: data.categories[catIndex].projects.length,
      });
      updateData("categories", newCats);
    } catch (e) {
      console.error("Failed to add project:", e);
    }
  };

  const updateProject = (catIndex: number, projIndex: number, field: string, value: unknown) => {
    const newCats = [...data.categories];
    (newCats[catIndex].projects[projIndex] as Record<string, unknown>)[field] = value;
    updateData("categories", newCats);
  };

  const removeProject = async (catIndex: number, projIndex: number) => {
    if (confirm("确定删除此项目？")) {
      const projId = data.categories[catIndex].projects[projIndex].id;
      try {
        await fetch("/api/admin/update", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "project", id: projId }),
        });
      } catch (e) {
        console.error("Failed to delete project:", e);
        showToast("删除项目失败", "error");
      }
      const newCats = [...data.categories];
      newCats[catIndex].projects.splice(projIndex, 1);
      updateData("categories", newCats);
      showToast("项目已删除", "success");
    }
  };

  const updateCategory = (index: number, field: string, value: string) => {
    const newCats = [...data.categories];
    (newCats[index] as Record<string, unknown>)[field] = value;
    updateData("categories", newCats);
  };

  return (
    <div>
      <div style={{ marginBottom: "1.2rem", display: "flex", gap: "0.6rem" }}>
        <button onClick={addCategory} style={{ ...styles.btnPrimary, cursor: "pointer" }}>
          + 新建分类
        </button>
      </div>

      {data.categories.map((cat, ci) => (
        <div
          key={cat.id}
          draggable
          onDragStart={(e) => onCatDragStart(e, ci)}
          onDragOver={(e) => onCatDragOver(e, ci)}
          onDrop={(e) => onCatDrop(e, ci)}
          onDragEnd={onCatDragEnd}
          style={{
            ...styles.card,
            opacity: draggingCat === ci ? 0.5 : 1,
            borderColor: dragOverCat === ci ? "#d4af37" : undefined,
            transition: "border-color 0.15s, opacity 0.15s",
          }}
        >
          {/* Category header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                title="拖动排序"
                style={{ cursor: "grab", color: "#666", fontSize: "1.1rem", userSelect: "none", lineHeight: 1 }}
              >
                ⋮⋮
              </span>
              <h3
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  color: "#d4af37",
                  margin: 0,
                  letterSpacing: "0.05em",
                }}
              >
                {cat.name_zh || cat.name_en || "未命名分类"}
              </h3>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                onClick={() => saveCategory(ci)}
                style={{ ...styles.btnPrimary, cursor: "pointer", fontSize: "0.78rem", padding: "0.3rem 0.7rem" }}
              >
                保存分类
              </button>
              <button
                onClick={() => removeCategory(ci)}
                style={{ ...styles.btnDanger, cursor: "pointer" }}
              >
                删除分类
              </button>
            </div>
          </div>

          {/* Category name inputs */}
          <div style={{ ...styles.row, marginBottom: "1rem" }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>分类名 (中文)</label>
              <input
                type="text"
                value={cat.name_zh}
                onChange={(e) => updateCategory(ci, "name_zh", e.target.value)}
                style={styles.input}
                placeholder="例如：视频制作"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>分类名 (英文)</label>
              <input
                type="text"
                value={cat.name_en}
                onChange={(e) => updateCategory(ci, "name_en", e.target.value)}
                style={styles.input}
                placeholder="e.g. Video Production"
              />
            </div>
          </div>

          {/* Project items */}
          {cat.projects.length > 0 && (
            <div style={{ marginBottom: "0.8rem" }}>
              {cat.projects.map((proj, pi) => (
                <ProjectItem
                  key={proj.id}
                  proj={proj}
                  categoryId={cat.id}
                  onUpdate={(field, value) => updateProject(ci, pi, field, value)}
                  onDelete={() => removeProject(ci, pi)}
                  onDragStart={(e) => onProjDragStart(e, ci, pi)}
                  onDragOver={(e) => onProjDragOver(e, ci, pi)}
                  onDrop={(e) => onProjDrop(e, ci, pi)}
                  onDragEnd={onProjDragEnd}
                  isDragOver={dragOverProj?.cat === ci && dragOverProj?.proj === pi}
                  onToast={showToast}
                />
              ))}
            </div>
          )}

          {/* Add project button — dashed style */}
          <button
            onClick={() => addProject(ci)}
            style={{
              width: "100%",
              padding: "0.55rem",
              background: "transparent",
              border: "1px dashed #444",
              borderRadius: "4px",
              color: "#888",
              fontSize: "0.82rem",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.05em",
            }}
          >
            + 添加项目
          </button>
        </div>
      ))}

      {data.categories.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "#555",
            fontSize: "0.85rem",
            border: "1px dashed #333",
            borderRadius: "6px",
          }}
        >
          暂无分类，点击上方「新建分类」开始添加
        </div>
      )}
    </div>
  );
}

// ============ About Tab ============
function AboutTab({ data, updateData, showToast }: { data: SiteData; updateData: (path: string, value: unknown) => void; showToast: (msg: string, type?: string) => void }) {
  const updateAbout = (field: string, value: string) => {
    updateData("about", { ...data.about, [field]: value });
  };

  return (
    <div style={styles.card}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "#d4af37", marginBottom: "0.8rem" }}>
        个人信息
      </h3>

      <div style={styles.row}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>姓名 (中文)</label>
          <input
            type="text"
            value={data.about.name_zh}
            onChange={(e) => updateAbout("name_zh", e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>姓名 (英文)</label>
          <input
            type="text"
            value={data.about.name_en}
            onChange={(e) => updateAbout("name_en", e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>头衔 (中文)</label>
          <input
            type="text"
            value={data.about.title_zh}
            onChange={(e) => updateAbout("title_zh", e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>头衔 (英文)</label>
          <input
            type="text"
            value={data.about.title_en}
            onChange={(e) => updateAbout("title_en", e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>个人照片</label>
        <PhotoUploader
          photo={data.about.photo}
          onPhotoChange={(photo) => updateAbout("photo", photo)}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>引言 (中文)</label>
        <textarea
          value={data.about.quote_zh}
          onChange={(e) => updateAbout("quote_zh", e.target.value)}
          style={styles.textarea}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>引言 (英文)</label>
        <textarea
          value={data.about.quote_en}
          onChange={(e) => updateAbout("quote_en", e.target.value)}
          style={styles.textarea}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>简介 (中文)</label>
        <textarea
          value={data.about.bio_zh}
          onChange={(e) => updateAbout("bio_zh", e.target.value)}
          style={{ ...styles.textarea, minHeight: "120px" }}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>简介 (英文)</label>
        <textarea
          value={data.about.bio_en}
          onChange={(e) => updateAbout("bio_en", e.target.value)}
          style={{ ...styles.textarea, minHeight: "120px" }}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>教育背景 (中文)</label>
        <textarea
          value={data.about.education_zh}
          onChange={(e) => updateAbout("education_zh", e.target.value)}
          style={styles.textarea}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>教育背景 (英文)</label>
        <textarea
          value={data.about.education_en}
          onChange={(e) => updateAbout("education_en", e.target.value)}
          style={styles.textarea}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={async () => {
            const res = await fetch("/api/admin/update", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "about", ...data.about }),
            });
            showToast(res.ok ? "保存成功" : "保存失败", res.ok ? "success" : "error");
          }}
          style={{ ...styles.btnPrimary, cursor: "pointer" }}
        >
          保存个人信息
        </button>
      </div>
    </div>
  );
}

// ============ Work Tab ============
function WorkTab({ data, updateData, showToast }: { data: SiteData; updateData: (path: string, value: unknown) => void; showToast: (msg: string, type?: string) => void }) {
  const addWork = () => {
    const id = "w-" + Date.now();
    updateData("workExperience", [
      ...data.workExperience,
      {
        id,
        title_zh: "",
        title_en: "",
        period: "",
        cover: "",
        images: [],
        content_zh: "",
        content_en: "",
        newEntry: true,
        sort_order: data.workExperience.length,
      },
    ]);
  };

  const removeWork = (index: number) => {
    const newWork = [...data.workExperience];
    newWork.splice(index, 1);
    updateData("workExperience", newWork);
  };

  const updateWork = (index: number, field: string, value: unknown) => {
    const newWork = [...data.workExperience];
    (newWork[index] as Record<string, unknown>)[field] = value;
    updateData("workExperience", newWork);
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={addWork} style={{ ...styles.btnPrimary, cursor: "pointer" }}>
          + 添加工作经历
        </button>
      </div>

      {data.workExperience.map((exp, i) => (
        <WorkExpItem
          key={exp.id}
          exp={exp}
          index={i}
          onUpdate={(field, value) => updateWork(i, field, value)}
          onDelete={() => removeWork(i)}
          showToast={showToast}
        />
      ))}
    </div>
  );
}

function WorkExpItem({
  exp,
  index,
  onUpdate,
  onDelete,
  showToast,
}: {
  exp: SiteData["workExperience"][0];
  index: number;
  onUpdate: (field: string, value: unknown) => void;
  onDelete: () => void;
  showToast: (msg: string, type?: string) => void;
}) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [deleting, setDeleting] = useState(false);
  const [localContentZh, setLocalContentZh] = useState(exp.content_zh || "");
  const [localContentEn, setLocalContentEn] = useState(exp.content_en || "");

  const extractFirstImage = (html: string): string => {
    // Support URLs with query strings (?token=abc&ver=1)
    const match = html.match(/src\s*=\s*(["'])([^"']+)\1/i);
    return match ? match[2] : "";
  };

  const extractAllImages = (html: string): string[] => {
    // Support URLs with query strings (?token=abc&ver=1) by matching src value across the entire attribute
    const matches = html.matchAll(/src\s*=\s*(["'])([^"']+)\1/gi);
    const imgs: string[] = [];
    for (const m of matches) {
      const src = m[2].trim();
      if (src && !imgs.includes(src)) imgs.push(src);
    }
    return imgs;
  };

  const denormalizeContentUrls = (html: string): string => {
    if (!html) return html;
    // Preserve blob URLs (https:// with query strings) as-is
    // Strip our known /images/projects/xxx/ prefix if present
    return html.replace(
      /<img([^>]+)src=(["'])(https?:\/\/[^"']+)\2/gi,
      (_, attrs, quote, src) => {
        // Already absolute — preserve blob/CDN/external URLs unchanged
        return `<img${attrs}src=${quote}${src}${quote}`;
      }
    );
  };

  const handleContentChange = (field: "content_zh" | "content_en", html: string) => {
    const normalized = denormalizeContentUrls(html);
    if (field === "content_zh") setLocalContentZh(normalized);
    else setLocalContentEn(normalized);
    onUpdate(field, normalized);
    if (!exp.cover) {
      const firstImg = extractFirstImage(normalized);
      if (firstImg) onUpdate("cover", firstImg);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const zhImg = extractAllImages(localContentZh);
      const enImg = extractAllImages(localContentEn);
      const allImages = [...new Set([...zhImg, ...enImg])];
      const resolvedCover =
        exp.cover ||
        extractFirstImage(localContentZh) ||
        extractFirstImage(localContentEn);

      const res = await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "work",
          id: exp.id,
          title_zh: exp.title_zh,
          title_en: exp.title_en,
          period: exp.period,
          content_zh: denormalizeContentUrls(localContentZh),
          content_en: denormalizeContentUrls(localContentEn),
          cover: resolvedCover,
          images: allImages,
          sort_order: index,
        }),
      });
      if (res.ok) {
        onUpdate("images", allImages);
        onUpdate("cover", resolvedCover);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        showToast("保存成功", "success");
      } else {
        setSaveStatus("error");
        showToast("保存失败，请重试", "error");
      }
    } catch {
      setSaveStatus("error");
      showToast("保存失败", "error");
    }
  };

  return (
    <div style={styles.card}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.8rem",
        }}
      >
        <strong style={{ fontSize: "0.9rem", color: "#d4af37" }}>
          {exp.title_zh || "新职位"}
        </strong>
        <button
          onClick={() => {
            if (!confirm(exp.newEntry ? "确定移除此工作经历？" : "确定删除此工作经历？图片文件也会一并删除。")) return;
            setDeleting(true);
            if (exp.newEntry) {
              onDelete();
              setDeleting(false);
              return;
            }
            fetch("/api/admin/update", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "work", id: exp.id }),
            }).then((res) => {
              if (res.ok) {
                onDelete();
                showToast("工作经历已删除", "success");
              } else {
                setDeleting(false);
                showToast("删除失败", "error");
              }
            });
          }}
          disabled={deleting}
          style={{
            ...styles.btnDanger,
            opacity: deleting ? 0.6 : 1,
            cursor: deleting ? "not-allowed" : "pointer",
          }}
        >
          {deleting ? "删除中..." : "删除"}
        </button>
      </div>

      <div style={styles.row}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>职位 (中文)</label>
          <input
            type="text"
            value={exp.title_zh}
            onChange={(e) => onUpdate("title_zh", e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>职位 (英文)</label>
          <input
            type="text"
            value={exp.title_en}
            onChange={(e) => onUpdate("title_en", e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>时间段</label>
          <input
            type="text"
            value={exp.period}
            onChange={(e) => onUpdate("period", e.target.value)}
            style={styles.input}
            placeholder="例如：2020.03 – 至今"
          />
        </div>
      </div>

      <SectionHeader label="详情内容 · DETAILS" />
      <div style={styles.formGroup}>
        <label style={{ ...styles.label, color: "#777" }}>
          中文 <span style={{ fontWeight: 400, textTransform: "none", fontStyle: "italic", color: "#555" }}>Chinese</span>
        </label>
        <TiptapEditor
          initialHtml={localContentZh}
          onChange={(html) => handleContentChange("content_zh", html)}
          imageFolder={`work/${exp.id}`}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={{ ...styles.label, color: "#777" }}>
          英文 <span style={{ fontWeight: 400, textTransform: "none", fontStyle: "italic", color: "#555" }}>English</span>
        </label>
        <TiptapEditor
          initialHtml={localContentEn}
          onChange={(html) => handleContentChange("content_en", html)}
          imageFolder={`work/${exp.id}`}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          style={{
            ...styles.btnPrimary,
            opacity: saveStatus === "saving" ? 0.6 : 1,
            cursor: saveStatus === "saving" ? "not-allowed" : "pointer",
          }}
        >
          {saveStatus === "saving"
            ? "保存中..."
            : saveStatus === "saved"
            ? "已保存 ✓"
            : saveStatus === "error"
            ? "保存失败，重试"
            : "保存此工作经历"}
        </button>
      </div>
    </div>
  );
}

// ============ Services Tab ============
function ServicesTab({ data, updateData, showToast }: { data: SiteData; updateData: (path: string, value: unknown) => void; showToast: (msg: string, type?: string) => void }) {
  const addService = async () => {
    const id = "svc-" + Date.now();
    try {
      await fetch("/api/admin/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "service", id, title_zh: "", title_en: "", desc_zh: "", desc_en: "", sort_order: data.services.length }),
      });
      updateData("services", [...data.services, { id, title_zh: "", title_en: "", desc_zh: "", desc_en: "", sort_order: data.services.length }]);
    } catch (e) {
      console.error("Failed to add service:", e);
    }
  };

  const removeService = async (index: number) => {
    if (!confirm("删除？")) return;
    const serviceId = data.services[index].id;
    try {
      await fetch("/api/admin/update", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "service", id: serviceId }),
      });
      const newServices = [...data.services];
      newServices.splice(index, 1);
      updateData("services", newServices);
    } catch (e) {
      console.error("Failed to delete service:", e);
    }
  };

  const updateService = (index: number, field: string, value: string) => {
    const newServices = [...data.services];
    (newServices[index] as Record<string, unknown>)[field] = value;
    updateData("services", newServices);
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={addService} style={{ ...styles.btnPrimary, cursor: "pointer" }}>
          + 添加服务
        </button>
      </div>

      {data.services.map((svc, i) => (
        <div key={i} style={styles.card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.8rem",
            }}
          >
            <strong style={{ fontSize: "0.9rem", color: "#d4af37" }}>
              {svc.title_zh || "新服务"}
            </strong>
            <button onClick={() => removeService(i)} style={{ ...styles.btnDanger, cursor: "pointer" }}>
              删除
            </button>
          </div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>服务名 (中文)</label>
              <input
                type="text"
                value={svc.title_zh}
                onChange={(e) => updateService(i, "title_zh", e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>服务名 (英文)</label>
              <input
                type="text"
                value={svc.title_en}
                onChange={(e) => updateService(i, "title_en", e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>描述 (中文)</label>
              <textarea
                value={svc.desc_zh}
                onChange={(e) => updateService(i, "desc_zh", e.target.value)}
                style={styles.textarea}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>描述 (英文)</label>
              <textarea
                value={svc.desc_en}
                onChange={(e) => updateService(i, "desc_en", e.target.value)}
                style={styles.textarea}
              />
            </div>
          </div>
        </div>
      ))}
      {/* Save all services */}
      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={async () => {
            for (const s of data.services) {
              await fetch("/api/admin/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "service", id: s.id, title_zh: s.title_zh, title_en: s.title_en, desc_zh: s.desc_zh, desc_en: s.desc_en, sort_order: s.sort_order }),
              });
            }
            showToast("保存成功", "success");
          }}
          style={{ ...styles.btnPrimary, cursor: "pointer" }}
        >
          保存全部服务
        </button>
      </div>
    </div>
  );
}

// ============ Site Settings Tab ============
function SiteSettingsTab({ data, updateData, showToast }: { data: SiteData; updateData: (path: string, value: unknown) => void; showToast: (msg: string, type?: string) => void }) {
  const updateSite = (field: string, value: string) => {
    updateData("site", { ...data.site, [field]: value });
  };

  const updateLink = (field: string, value: string) => {
    updateData("links", { ...data.links, [field]: value });
  };

  return (
    <>
      <div style={styles.card}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "#d4af37", marginBottom: "0.8rem" }}>
          品牌
        </h3>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>网站标题 (英文)</label>
            <input
              type="text"
              value={data.site.title_en}
              onChange={(e) => updateSite("title_en", e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>网站标题 (中文)</label>
            <input
              type="text"
              value={data.site.title_zh}
              onChange={(e) => updateSite("title_zh", e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>副标题 (英文)</label>
            <input
              type="text"
              value={data.site.subtitle_en}
              onChange={(e) => updateSite("subtitle_en", e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>副标题 (中文)</label>
            <input
              type="text"
              value={data.site.subtitle_zh}
              onChange={(e) => updateSite("subtitle_zh", e.target.value)}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "#d4af37", marginBottom: "0.8rem" }}>
          联系方式
        </h3>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>LinkedIn</label>
            <input
              type="text"
              value={data.links.linkedin}
              onChange={(e) => updateLink("linkedin", e.target.value)}
              style={styles.input}
              placeholder="https://..."
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>GitHub</label>
            <input
              type="text"
              value={data.links.github}
              onChange={(e) => updateLink("github", e.target.value)}
              style={styles.input}
              placeholder="https://..."
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Replit</label>
            <input
              type="text"
              value={data.links.replit}
              onChange={(e) => updateLink("replit", e.target.value)}
              style={styles.input}
              placeholder="https://..."
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>小红书</label>
            <input
              type="text"
              value={data.links.xiaohongshu}
              onChange={(e) => updateLink("xiaohongshu", e.target.value)}
              style={styles.input}
              placeholder="https://..."
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={data.links.email}
              onChange={(e) => updateLink("email", e.target.value)}
              style={styles.input}
              placeholder="email@example.com"
            />
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>

      {/* Save site settings + links */}
      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={async () => {
            await fetch("/api/admin/update", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "site", ...data.site }),
            });
            for (const [platform, url] of Object.entries(data.links)) {
              if (typeof url === "string" && url.trim()) {
                await fetch("/api/admin/update", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "link", id: `link-${platform}`, platform, url }),
                });
              }
            }
            showToast("保存成功", "success");
          }}
          style={{ ...styles.btnPrimary, cursor: "pointer" }}
        >
          保存站点设置
        </button>
      </div>
    </>
  );
}

// ============ Main Admin Dashboard ============
const tabs = [
  { id: "projects", label: "项目管理" },
  { id: "about", label: "关于页面" },
  { id: "work", label: "工作经历" },
  { id: "services", label: "专业领域" },
  { id: "site", label: "站点设置" },
];

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("projects");
  const [data, setData] = useState<SiteData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    document.body.style.background = "#111";
    document.body.style.margin = "0";
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/data");
      if (response.ok) {
        const result = await response.json();

        const converted = {
          ...result,
          categories: result.categories.map((cat: { projects: Array<Record<string, unknown>> }) => ({
            ...cat,
            projects: cat.projects.map((p: Record<string, unknown>) => {
              // Fix double-prefixed paths from legacy corrupted data before normalizing
              const rawZh = stripDoublePrefix((p.content_zh as string) ?? "");
              const rawEn = stripDoublePrefix((p.content_en as string) ?? "");
              const contentZh = normalizeContentUrls(rawZh, p.imageFolder as string);
              const contentEn = normalizeContentUrls(rawEn, p.imageFolder as string);
              const existingImages = Array.isArray(p.images) ? p.images : [];

              // If images is empty, extract from content
              let images = existingImages;
              if (images.length === 0 && (contentZh || contentEn)) {
                const extractImgs = (html: string) => {
                  const matches = html.matchAll(/src\s*=\s*(["'])([^"']+)\1/gi);
                  const imgs: string[] = [];
                  for (const m of matches) {
                    const src = m[2].trim();
                    if (src && !imgs.includes(src)) imgs.push(src);
                  }
                  return imgs;
                };
                const zhImgs = extractImgs(contentZh);
                const enImgs = extractImgs(contentEn);
                images = [...new Set([...zhImgs, ...enImgs])];
              }

              return {
                ...p,
                images,
                content_zh: contentZh,
                content_en: contentEn,
              };
            }),
          })),
          workExperience: (result.workExperience || []).map((w: Record<string, unknown>) => {
            const rawZh = stripDoublePrefix((w.content_zh as string) ?? "");
            const rawEn = stripDoublePrefix((w.content_en as string) ?? "");
            const contentZh = normalizeContentUrls(rawZh, (w.detail_folder || w.id) as string);
            const contentEn = normalizeContentUrls(rawEn, (w.detail_folder || w.id) as string);
            const existingImages = Array.isArray(w.images) ? w.images : [];

            // If images is empty, extract from content
            let images = existingImages;
            if (images.length === 0 && (contentZh || contentEn)) {
              const extractImgs = (html: string) => {
                const matches = html.matchAll(/src\s*=\s*(["'])([^"']+)\1/gi);
                const imgs: string[] = [];
                for (const m of matches) {
                  const src = m[2].trim();
                  if (src && !imgs.includes(src)) imgs.push(src);
                }
                return imgs;
              };
              const zhImgs = extractImgs(contentZh);
              const enImgs = extractImgs(contentEn);
              images = [...new Set([...zhImgs, ...enImgs])];
            }

            return {
              ...w,
              images,
              content_zh: contentZh,
              content_en: contentEn,
            };
          }),
        };
        setData(converted);
      }
    } catch (e) {
      console.error("Failed to load data:", e);
      showToast("加载数据失败", "error");
    }
  };

  const showToast = (message: string, type: string = "success") => {
    setToast({ message, type });
  };

  const updateData = (path: string, value: unknown) => {
    if (!data) return;
    setData((prev) => {
      if (!prev) return prev;
      if (path === "categories") return { ...prev, categories: value as SiteData["categories"] };
      if (path === "about") return { ...prev, about: value as SiteData["about"] };
      if (path === "workExperience") return { ...prev, workExperience: value as SiteData["workExperience"] };
      if (path === "services") return { ...prev, services: value as SiteData["services"] };
      if (path === "site") return { ...prev, site: value as SiteData["site"] };
      if (path === "links") return { ...prev, links: value as SiteData["links"] };
      return prev;
    });
  };

  const saveData = async () => {
    if (!data) return;
    try {
      const response = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        onLogout();
        showToast("登录已过期，请重新登录", "info");
        return;
      }

      if (response.ok) {
        setLastSaved(new Date().toLocaleTimeString());
        showToast("已保存，前台已自动更新 ✓", "success");
      }
    } catch {
      showToast("保存失败", "error");
    }
  };

  if (!data) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#111",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#d4af37",
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div style={{ background: "#111", color: "#e0e0e0", minHeight: "100vh" }}>
      {/* Header */}
      <header
        style={{
          background: "#1a1a1a",
          borderBottom: "1px solid #333",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <h1 style={{ fontSize: "1.1rem", fontWeight: 400, color: "#d4af37", letterSpacing: "0.2em", margin: 0 }}>
          LUMOS CREATIVE 后台
        </h1>
        <div>
          <a
            href="/"
            target="_blank"
            style={{ color: "#888", fontSize: "0.85rem", textDecoration: "none", marginRight: "1rem" }}
          >
            ↗ 预览网站
          </a>
          <button
            onClick={onLogout}
            style={{
              background: "none",
              border: "none",
              color: "#e74c3c",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontFamily: "inherit",
            }}
          >
            退出登录
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div style={styles.container}>
        <div
          style={{
            display: "flex",
            gap: 0,
            marginBottom: "2rem",
            borderBottom: "1px solid #333",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.8rem 1.5rem",
                cursor: "pointer",
                fontSize: "0.85rem",
                letterSpacing: "0.1em",
                color: activeTab === tab.id ? "#d4af37" : "#888",
                borderBottom: activeTab === tab.id ? "2px solid #d4af37" : "2px solid transparent",
                transition: "all 0.3s",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "projects" && <ProjectsTab data={data} updateData={updateData} showToast={showToast} />}
        {activeTab === "about" && <AboutTab data={data} updateData={updateData} showToast={showToast} />}
        {activeTab === "work" && <WorkTab data={data} updateData={updateData} showToast={showToast} />}
        {activeTab === "services" && <ServicesTab data={data} updateData={updateData} showToast={showToast} />}
        {activeTab === "site" && <SiteSettingsTab data={data} updateData={updateData} showToast={showToast} />}
      </div>

      {/* Status Bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#1a1a1a",
          borderTop: "1px solid #333",
          padding: "0.4rem 2rem",
          fontSize: "0.75rem",
          color: "#888",
          display: "flex",
          justifyContent: "space-between",
          zIndex: 50,
        }}
      >
        <span>后台保存后，前台自动刷新，无需额外操作</span>
        <span>{lastSaved ? `上次保存: ${lastSaved}` : ""}</span>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
