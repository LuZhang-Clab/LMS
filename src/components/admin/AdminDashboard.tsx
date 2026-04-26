"use client";

import { useState, useEffect, useRef } from "react";

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
      title_zh: string;
      title_en: string;
      cover: string;
      imageFolder: string;
      link: string;
      images: string[];
      content_zh: Array<{ type: string; text?: string; files?: string[]; url?: string }>;
      content_en: Array<{ type: string; text?: string; files?: string[]; url?: string }>;
    }>;
  }>;
  workExperience: Array<{
    id: string;
    title_zh: string;
    title_en: string;
    period: string;
    detailFolder: string;
  }>;
  services: Array<{
    title_zh: string;
    title_en: string;
    desc_zh: string;
    desc_en: string;
  }>;
}

// ============ Styles ============
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

// ============ Helper: extract all image URLs from project content blocks ============
function getProjectImages(
  proj: SiteData["categories"][0]["projects"][0]
): string[] {
  const urls: string[] = [];
  // Always include the cover as first image
  if (proj.cover) urls.push(proj.cover);
  // Extract from content_zh images blocks
  for (const block of proj.content_zh) {
    if (block.type === "images" && block.files) {
      for (const f of block.files) {
        const url = `/images/projects/${proj.image_folder || "default"}/${f}`;
        if (!urls.includes(url)) urls.push(url);
      }
    }
  }
  return urls;
}

// ============ Single Photo Uploader Component (for About photo) ============
function PhotoUploader({
  photo,
  onPhotoChange,
}: {
  photo: string;
  onPhotoChange: (photo: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "about");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onPhotoChange(result.url);
      } else {
        alert("上传失败");
      }
    } catch (e) {
      console.error("Upload failed:", e);
      alert("上传失败");
    }
    setIsUploading(false);
  };

  const fileInputId = `photo-upload-${Math.random().toString(36).slice(2)}`;

  return (
    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
      {/* Photo Preview */}
      <img
        id="aboutPhotoPreview"
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
      {/* Upload Zone */}
      <label
        htmlFor={fileInputId}
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
          color: "#888",
          transition: "all 0.3s",
          minHeight: "100px",
        }}
      >
        <span>{isUploading ? "上传中..." : "点击上传新照片"}</span>
        <input
          id={fileInputId}
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

// ============ Image Uploader Component ============
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

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(`上传中... (0/${files.length})`);
    const newImages = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      setUploadProgress(`上传中... (${i + 1}/${files.length})`);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (imageFolder) formData.append("folder", imageFolder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          newImages.push(result.url);

          if (images.length === 0 && i === 0) {
            onCoverChange(result.url);
          }
        }
      } catch (e) {
        console.error("Upload failed:", e);
      }
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

  const handleZoneClick = () => {
    inputRef.current?.click();
  };

  const deleteImage = (index: number) => {
    if (!confirm("删除这张图片？")) return;
    const newImages = [...images];
    const deletedUrl = newImages.splice(index, 1)[0];
    onImagesChange(newImages);
    if (cover === deletedUrl) {
      onCoverChange(newImages[0] || "");
    }
  };

  return (
    <div>
      {/* Image Grid */}
      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: "0.6rem",
            margin: "0.6rem 0",
          }}
        >
          {images.map((url, idx) => (
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

      {/* Upload Zone */}
      <div
        ref={uploadZoneRef}
        onClick={handleZoneClick}
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

// ============ Projects Tab ============
function ProjectsTab({ data, updateData }: { data: SiteData; updateData: (path: string, value: unknown) => void }) {
  const addCategory = () => {
    const newCat = {
      id: "cat-" + Date.now(),
      name_en: "New Category",
      name_zh: "新分类",
      projects: [],
    };
    updateData("categories", [...data.categories, newCat]);
  };

  const removeCategory = (index: number) => {
    if (confirm("确定删除此分类及其所有项目？")) {
      const newCats = [...data.categories];
      newCats.splice(index, 1);
      updateData("categories", newCats);
    }
  };

  const addProject = (catIndex: number) => {
    const id = "proj-" + Date.now();
    const newProj = {
      id,
      title_en: "",
      title_zh: "",
      cover: "",
      imageFolder: id,
      link: "",
      images: [],
      content_zh: [],
      content_en: [],
    };
    const newCats = [...data.categories];
    newCats[catIndex].projects.push(newProj);
    updateData("categories", newCats);
  };

  const removeProject = (catIndex: number, projIndex: number) => {
    if (confirm("确定删除此项目？")) {
      const newCats = [...data.categories];
      newCats[catIndex].projects.splice(projIndex, 1);
      updateData("categories", newCats);
    }
  };

  const updateProject = (catIndex: number, projIndex: number, field: string, value: unknown) => {
    const newCats = [...data.categories];
    (newCats[catIndex].projects[projIndex] as Record<string, unknown>)[field] = value;
    updateData("categories", newCats);
  };

  const updateCategory = (index: number, field: string, value: string) => {
    const newCats = [...data.categories];
    (newCats[index] as Record<string, unknown>)[field] = value;
    updateData("categories", newCats);
  };

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={addCategory} style={{ ...styles.btnPrimary, cursor: "pointer" }}>
          + 新建分类
        </button>
      </div>

      {data.categories.map((cat, ci) => (
        <div key={cat.id} style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "#d4af37", margin: 0 }}>
              {cat.name_zh} / {cat.name_en}
            </h3>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button onClick={() => addProject(ci)} style={{ ...styles.btnOutline, cursor: "pointer" }}>
                + 添加项目
              </button>
              <button onClick={() => removeCategory(ci)} style={{ ...styles.btnDanger, cursor: "pointer" }}>
                删除分类
              </button>
            </div>
          </div>

          <div style={{ ...styles.row, marginBottom: "0.6rem" }}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>分类名 (中文)</label>
              <input
                type="text"
                value={cat.name_zh}
                onChange={(e) => updateCategory(ci, "name_zh", e.target.value)}
                style={styles.input}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>分类名 (英文)</label>
              <input
                type="text"
                value={cat.name_en}
                onChange={(e) => updateCategory(ci, "name_en", e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          {cat.projects.map((proj, pi) => (
            <div key={proj.id} style={{ ...styles.cardDark, marginTop: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <strong style={{ fontSize: "0.9rem" }}>
                  {proj.title_zh || proj.title_en || "新项目"}
                </strong>
                <button onClick={() => removeProject(ci, pi)} style={{ ...styles.btnDanger, cursor: "pointer" }}>
                  删除项目
                </button>
              </div>

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>标题 (中文)</label>
                  <input
                    type="text"
                    value={proj.title_zh}
                    onChange={(e) => updateProject(ci, pi, "title_zh", e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>标题 (英文)</label>
                  <input
                    type="text"
                    value={proj.title_en}
                    onChange={(e) => updateProject(ci, pi, "title_en", e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>外部链接 (可选)</label>
                <input
                  type="text"
                  value={proj.link}
                  onChange={(e) => updateProject(ci, pi, "link", e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>详情内容 (中文)</label>
                  <textarea
                    value={proj.content_zh.map((b) => b.text || "").join("\n\n")}
                    onChange={(e) =>
                      updateProject(ci, pi, "content_zh", e.target.value.split("\n\n").map((t) => ({ type: "text", text: t })))
                    }
                    style={{ ...styles.textarea, minHeight: "160px" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>详情内容 (英文)</label>
                  <textarea
                    value={proj.content_en.map((b) => b.text || "").join("\n\n")}
                    onChange={(e) =>
                      updateProject(ci, pi, "content_en", e.target.value.split("\n\n").map((t) => ({ type: "text", text: t })))
                    }
                    style={{ ...styles.textarea, minHeight: "160px" }}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  项目图片
                  <span style={{ fontWeight: 400, textTransform: "none", fontStyle: "italic", color: "#888", marginLeft: "0.5rem" }}>
                    封面为列表首图，新增图片请拖拽上传
                  </span>
                </label>

                {/* Existing images from content blocks (read-only) */}
                {(() => {
                  const existingUrls = getProjectImages(proj).filter(u => u !== proj.cover);
                  return existingUrls.length > 0 ? (
                    <div>
                      <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "0.4rem" }}>
                        内容图片（来自详情内容，编辑内容时可修改）
                      </p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.5rem", marginBottom: "0.6rem" }}>
                        {existingUrls.map((url, idx) => (
                          <div key={idx} style={{ position: "relative", aspectRatio: "1", borderRadius: "4px", overflow: "hidden", border: "1px solid #333" }}>
                            <img src={url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* New uploaded images (manageable) */}
                <p style={{ fontSize: "0.78rem", color: "#888", marginBottom: "0.4rem" }}>
                  新增图片（点击设为封面，× 删除）
                </p>
                <ImageUploader
                  images={proj.images || []}
                  cover={proj.cover}
                  imageFolder={proj.image_folder}
                  onImagesChange={(images) => updateProject(ci, pi, "images", images)}
                  onCoverChange={(cover) => updateProject(ci, pi, "cover", cover)}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============ About Tab ============
function AboutTab({ data, updateData }: { data: SiteData; updateData: (path: string, value: unknown) => void }) {
  const updateAbout = (field: string, value: string) => {
    updateData("about", { ...data.about, [field]: value });
  };

  return (
    <div style={styles.card}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "#d4af37", marginBottom: "0.8rem" }}>个人信息</h3>

      <div style={styles.row}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>姓名 (中文)</label>
          <input type="text" value={data.about.name_zh} onChange={(e) => updateAbout("name_zh", e.target.value)} style={styles.input} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>姓名 (英文)</label>
          <input type="text" value={data.about.name_en} onChange={(e) => updateAbout("name_en", e.target.value)} style={styles.input} />
        </div>
      </div>

      <div style={styles.row}>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>头衔 (中文)</label>
          <input type="text" value={data.about.title_zh} onChange={(e) => updateAbout("title_zh", e.target.value)} style={styles.input} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.label}>头衔 (英文)</label>
          <input type="text" value={data.about.title_en} onChange={(e) => updateAbout("title_en", e.target.value)} style={styles.input} />
        </div>
      </div>

      {/* 个人照片 - 预览 + 上传 */}
      <div style={styles.formGroup}>
        <label style={styles.label}>个人照片</label>
        <PhotoUploader
          photo={data.about.photo}
          onPhotoChange={(photo) => updateAbout("photo", photo)}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>引言 (中文)</label>
        <textarea value={data.about.quote_zh} onChange={(e) => updateAbout("quote_zh", e.target.value)} style={styles.textarea} />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>引言 (英文)</label>
        <textarea value={data.about.quote_en} onChange={(e) => updateAbout("quote_en", e.target.value)} style={styles.textarea} />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>简介 (中文)</label>
        <textarea value={data.about.bio_zh} onChange={(e) => updateAbout("bio_zh", e.target.value)} style={{ ...styles.textarea, minHeight: "120px" }} />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>简介 (英文)</label>
        <textarea value={data.about.bio_en} onChange={(e) => updateAbout("bio_en", e.target.value)} style={{ ...styles.textarea, minHeight: "120px" }} />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>教育背景 (中文)</label>
        <textarea value={data.about.education_zh} onChange={(e) => updateAbout("education_zh", e.target.value)} style={styles.textarea} />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>教育背景 (英文)</label>
        <textarea value={data.about.education_en} onChange={(e) => updateAbout("education_en", e.target.value)} style={styles.textarea} />
      </div>
    </div>
  );
}

// ============ Work Tab ============
function WorkTab({ data, updateData }: { data: SiteData; updateData: (path: string, value: unknown) => void }) {
  const addWork = () => {
    const newWork = { id: "w-" + Date.now(), title_zh: "", title_en: "", period: "", detailFolder: "" };
    updateData("workExperience", [...data.workExperience, newWork]);
  };

  const removeWork = (index: number) => {
    if (confirm("删除？")) {
      const newWork = [...data.workExperience];
      newWork.splice(index, 1);
      updateData("workExperience", newWork);
    }
  };

  const updateWork = (index: number, field: string, value: string) => {
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
        <div key={exp.id} style={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <strong style={{ fontSize: "0.9rem" }}>{exp.title_zh || "新职位"}</strong>
            <button onClick={() => removeWork(i)} style={{ ...styles.btnDanger, cursor: "pointer" }}>
              删除
            </button>
          </div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>职位 (中文)</label>
              <input type="text" value={exp.title_zh} onChange={(e) => updateWork(i, "title_zh", e.target.value)} style={styles.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>职位 (英文)</label>
              <input type="text" value={exp.title_en} onChange={(e) => updateWork(i, "title_en", e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>时间段</label>
              <input type="text" value={exp.period} onChange={(e) => updateWork(i, "period", e.target.value)} style={styles.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>关联图片文件夹 (可选)</label>
              <input type="text" value={exp.detailFolder} onChange={(e) => updateWork(i, "detailFolder", e.target.value)} style={styles.input} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Services Tab ============
function ServicesTab({ data, updateData }: { data: SiteData; updateData: (path: string, value: unknown) => void }) {
  const addService = () => {
    const newService = { title_zh: "", title_en: "", desc_zh: "", desc_en: "" };
    updateData("services", [...data.services, newService]);
  };

  const removeService = (index: number) => {
    if (confirm("删除？")) {
      const newServices = [...data.services];
      newServices.splice(index, 1);
      updateData("services", newServices);
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
            <strong style={{ fontSize: "0.9rem" }}>{svc.title_zh || "新服务"}</strong>
            <button onClick={() => removeService(i)} style={{ ...styles.btnDanger, cursor: "pointer" }}>
              删除
            </button>
          </div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>服务名 (中文)</label>
              <input type="text" value={svc.title_zh} onChange={(e) => updateService(i, "title_zh", e.target.value)} style={styles.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>服务名 (英文)</label>
              <input type="text" value={svc.title_en} onChange={(e) => updateService(i, "title_en", e.target.value)} style={styles.input} />
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>描述 (中文)</label>
              <textarea value={svc.desc_zh} onChange={(e) => updateService(i, "desc_zh", e.target.value)} style={styles.textarea} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>描述 (英文)</label>
              <textarea value={svc.desc_en} onChange={(e) => updateService(i, "desc_en", e.target.value)} style={styles.textarea} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ Site Settings Tab ============
function SiteSettingsTab({ data, updateData }: { data: SiteData; updateData: (path: string, value: unknown) => void }) {
  const updateSite = (field: string, value: string) => {
    updateData("site", { ...data.site, [field]: value });
  };

  const updateLink = (field: string, value: string) => {
    updateData("links", { ...data.links, [field]: value });
  };

  return (
    <>
      <div style={styles.card}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "#d4af37", marginBottom: "0.8rem" }}>品牌</h3>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>网站标题 (英文)</label>
            <input type="text" value={data.site.title_en} onChange={(e) => updateSite("title_en", e.target.value)} style={styles.input} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>网站标题 (中文)</label>
            <input type="text" value={data.site.title_zh} onChange={(e) => updateSite("title_zh", e.target.value)} style={styles.input} />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>副标题 (英文)</label>
            <input type="text" value={data.site.subtitle_en} onChange={(e) => updateSite("subtitle_en", e.target.value)} style={styles.input} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>副标题 (中文)</label>
            <input type="text" value={data.site.subtitle_zh} onChange={(e) => updateSite("subtitle_zh", e.target.value)} style={styles.input} />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "#d4af37", marginBottom: "0.8rem" }}>联系方式</h3>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>LinkedIn</label>
            <input type="text" value={data.links.linkedin} onChange={(e) => updateLink("linkedin", e.target.value)} style={styles.input} placeholder="https://..." />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>GitHub</label>
            <input type="text" value={data.links.github} onChange={(e) => updateLink("github", e.target.value)} style={styles.input} placeholder="https://..." />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Replit</label>
            <input type="text" value={data.links.replit} onChange={(e) => updateLink("replit", e.target.value)} style={styles.input} placeholder="https://..." />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>小红书</label>
            <input type="text" value={data.links.xiaohongshu} onChange={(e) => updateLink("xiaohongshu", e.target.value)} style={styles.input} placeholder="https://..." />
          </div>
        </div>

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Email</label>
            <input type="email" value={data.links.email} onChange={(e) => updateLink("email", e.target.value)} style={styles.input} placeholder="email@example.com" />
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>
    </>
  );
}

// ============ Main Admin Dashboard Component ============
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
        setData(result);
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
        headers: {
          "Content-Type": "application/json",
        },
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
    } catch (e) {
      showToast("保存失败", "error");
    }
  };

  if (!data) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", color: "#d4af37" }}>
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
          <a href="/" target="_blank" style={{ color: "#888", fontSize: "0.85rem", textDecoration: "none", marginRight: "1rem" }}>
            ↗ 预览网站
          </a>
          <button
            onClick={onLogout}
            style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit" }}
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
        {activeTab === "projects" && <ProjectsTab data={data} updateData={updateData} />}
        {activeTab === "about" && <AboutTab data={data} updateData={updateData} />}
        {activeTab === "work" && <WorkTab data={data} updateData={updateData} />}
        {activeTab === "services" && <ServicesTab data={data} updateData={updateData} />}
        {activeTab === "site" && <SiteSettingsTab data={data} updateData={updateData} />}

        {/* Save Button */}
        <div style={{ marginTop: "1rem" }}>
          <button onClick={saveData} style={{ ...styles.btnPrimary, cursor: "pointer", padding: "0.5rem 1.2rem" }}>
            💾 保存并发布
          </button>
        </div>
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
