"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TiptapEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  imageFolder?: string;
}

export function TiptapEditor({ initialHtml, onChange, imageFolder }: TiptapEditorProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [pendingImagePos, setPendingImagePos] = useState<{ from: number; to: number } | null>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        underline: false,
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: "editor-image" },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: "开始输入内容，支持文字、图片、链接...",
      }),
    ],
    content: initialHtml || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor-content",
        spellcheck: "true",
      },
    },
    immediatelyRender: false,
  });

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setUploadingCount((c) => c + 1);
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (imageFolder) formData.append("folder", imageFolder);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            editor?.chain().focus().setImage({ src: data.url }).run();
            editor?.chain().focus().setTextSelection(editor.state.selection.to + 1).run();
          }
        }
      } catch (e) {
        console.error("Image upload failed:", e);
      } finally {
        setUploadingCount((c) => c - 1);
      }
    },
    [editor, imageFolder]
  );

  const handleImageFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        await handleImageUpload(files[i]);
      }
      e.target.value = "";
    },
    [handleImageUpload]
  );

  const addLink = useCallback(() => {
    const url = window.prompt("输入链接地址：", "https://");
    if (!url || !editor) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  // Paste handler — intercept image files from clipboard and upload them
  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      let hasImage = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          hasImage = true;
          break;
        }
      }
      if (!hasImage) return;

      event.preventDefault();
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
      }
    },
    [handleImageUpload]
  );

  // Attach paste listener to the ProseMirror editor DOM
  useEffect(() => {
    const el = editor?.view?.dom;
    if (!el) return;
    el.addEventListener("paste", handlePaste as EventListener);
    return () => el.removeEventListener("paste", handlePaste as EventListener);
  }, [editor, handlePaste]);

  // Drag-and-drop handler — intercept image files dragged into the editor
  const handleDragOver = useCallback((event: DragEvent) => {
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const hasImage = Array.from(files).some((f) => f.type.startsWith("image/"));
    if (hasImage) {
      event.preventDefault();
      event.dataTransfer!.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;

      event.preventDefault();
      imageFiles.forEach((file) => handleImageUpload(file));
    },
    [handleImageUpload]
  );

  useEffect(() => {
    const el = editor?.view?.dom;
    if (!el) return;
    el.addEventListener("dragover", handleDragOver);
    el.addEventListener("drop", handleDrop);
    return () => {
      el.removeEventListener("dragover", handleDragOver);
      el.removeEventListener("drop", handleDrop);
    };
  }, [editor, handleDragOver, handleDrop]);
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
    const inject = () => {
      el.querySelectorAll("img").forEach((img) => {
        if ((img as HTMLElement).dataset.replaceBound) return;
        (img as HTMLElement).dataset.replaceBound = "1";
        img.addEventListener("click", () => {
          if (!editor.isEditable) return;
          const pos = editor.view.posAtDOM(img as HTMLElement, 0);
          if (pos < 0) return;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const SelectionClass = editor.state.selection.constructor as any;
          editor.view.dispatch(editor.state.tr.setSelection(SelectionClass.near(editor.state.doc.resolve(pos))));
          setPendingImagePos({ from: pos, to: pos + 1 });
          replaceFileRef.current?.click();
        });
      });
    };
    inject();
    const observer = new MutationObserver(inject);
    observer.observe(el, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [editor]);

  const handleReplaceImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || !editor || !pendingImagePos) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) { e.target.value = ""; setPendingImagePos(null); return; }
      setUploadingCount((c) => c + 1);
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (imageFolder) formData.append("folder", imageFolder);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            editor
              .chain()
              .focus()
              .deleteRange({ from: pendingImagePos.from, to: pendingImagePos.to })
              .setImage({ src: data.url })
              .run();
          }
        }
      } catch (err) {
        console.error("Replace image failed:", err);
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
        setPendingImagePos(null);
        e.target.value = "";
      }
    },
    [editor, imageFolder, pendingImagePos]
  );

  if (!editor) return null;

  return (
    <div style={{ border: "1px solid #333", borderRadius: "6px", overflow: "hidden", background: "#1a1a1a" }}>
      <input
        ref={replaceFileRef}
        type="file"
        accept="image/*"
        onChange={handleReplaceImage}
        style={{ display: "none" }}
      />
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "2px",
          padding: "6px 8px",
          background: "#222",
          borderBottom: "1px solid #333",
          alignItems: "center",
        }}
      >
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="加粗"
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="斜体"
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="下划线"
        >
          <u>U</u>
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="大标题"
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="小标题"
        >
          H3
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="左对齐"
        >
          ≡
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="居中"
        >
          ≡C
        </ToolbarBtn>

        <ToolbarDivider />

        <ToolbarBtn onClick={addLink} active={editor.isActive("link")} title="添加链接">
          🔗
        </ToolbarBtn>
        {editor.isActive("link") && (
          <ToolbarBtn
            onClick={() => editor.chain().focus().unsetLink().run()}
            active={true}
            title="移除链接"
          >
            ✂
          </ToolbarBtn>
        )}

        <ToolbarDivider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="无序列表"
        >
          •
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="有序列表"
        >
          1.
        </ToolbarBtn>

        <ToolbarDivider />

        {/* Image upload */}
        <label
          title="上传图片"
          style={{
            padding: "4px 8px",
            borderRadius: "3px",
            background: "#333",
            color: uploadingCount > 0 ? "#d4af37" : "#e0e0e0",
            fontSize: "0.72rem",
            cursor: uploadingCount > 0 ? "not-allowed" : "pointer",
            border: "1px solid #444",
          }}
        >
          {uploadingCount > 0 ? `上传中(${uploadingCount})...` : "📷 图片"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageFileInput}
            style={{ display: "none" }}
            disabled={uploadingCount > 0}
          />
        </label>

        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          active={false}
          title="撤销"
          disabled={!editor.can().undo()}
        >
          ↩
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          active={false}
          title="重做"
          disabled={!editor.can().redo()}
        >
          ↪
        </ToolbarBtn>
      </div>

      {/* Editor Area */}
      <style>{`
        .tiptap-editor-content {
          min-height: 200px;
          padding: 12px 16px;
          color: #e0e0e0;
          font-size: 0.88rem;
          line-height: 1.7;
          outline: none;
          user-select: text;
          -webkit-user-select: text;
        }
        .tiptap-editor-content h2 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #d4af37;
          margin: 1rem 0 0.5rem;
          border-bottom: 1px solid #333;
          padding-bottom: 0.3rem;
        }
        .tiptap-editor-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e0e0e0;
          margin: 0.8rem 0 0.4rem;
        }
        .tiptap-editor-content p {
          margin: 0.5rem 0;
        }
        .tiptap-editor-content p.is-editor-empty:first-child::before {
          color: #555;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .tiptap-editor-content ul, .tiptap-editor-content ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .tiptap-editor-content li {
          margin: 0.25rem 0;
        }
        .tiptap-editor-content img {
          max-width: 480px;
          width: auto;
          height: auto;
          border-radius: 4px;
          margin: 0.5rem 0;
          display: block;
          cursor: pointer;
          border: 1px solid #333;
        }
        .tiptap-editor-content img.ProseMirror-selectednode {
          outline: 2px solid #d4af37;
        }
        .tiptap-editor-content a {
          color: #d4af37;
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap-editor-content a:hover {
          color: #f0c84d;
        }
        .tiptap-editor-content strong { font-weight: 700; }
        .tiptap-editor-content em { font-style: italic; }
        .tiptap-editor-content u { text-decoration: underline; }
        .ProseMirror { outline: none; user-select: text; -webkit-user-select: text; }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  );
}

// ============ Toolbar Components ============
function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: "4px 8px",
        borderRadius: "3px",
        border: "1px solid",
        borderColor: active ? "#d4af37" : "#444",
        background: active ? "#2a2a1a" : "#333",
        color: disabled ? "#555" : active ? "#d4af37" : "#e0e0e0",
        fontSize: "0.75rem",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        minWidth: "28px",
        textAlign: "center",
      }}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div
      style={{
        width: "1px",
        height: "20px",
        background: "#444",
        margin: "0 2px",
        alignSelf: "center",
      }}
    />
  );
}
