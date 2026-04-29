import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists (local dev)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Sanitize extension
    const rawExt = path.extname((file as File).name).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const ext = allowedExts.includes(rawExt) ? rawExt : ".bin";

    // Safe filename: strip path/trailing chars, prefix with short id
    const shortId = Math.random().toString(36).slice(2, 10);
    const filename = `${shortId}${ext}`;

    // Build blob path based on folder
    let blobPath: string;
    if (folder === "about") {
      blobPath = `images/about/${filename}`;
    } else if (folder.startsWith("work/")) {
      const workId = folder.replace("work/", "");
      blobPath = `images/about/${workId}/${filename}`;
    } else if (folder.startsWith("w-")) {
      blobPath = `images/work/${folder}/${filename}`;
    } else if (folder && folder.trim()) {
      blobPath = `images/projects/${folder}/${filename}`;
    } else {
      blobPath = `images/uploads/${filename}`;
    }

    let url: string;

    // Extract arrayBuffer once, before branching
    const arrayBuffer = await (file as File).arrayBuffer();

    // Use Vercel Blob on Vercel, local file system for local dev
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(blobPath, arrayBuffer, {
        access: "public",
        contentType: (file as File).type,
      });
      url = blob.url;
    } else {
      // Local fallback: save to public/uploads
      const subDir = blobPath.split("/").slice(0, -1).join("/");
      const localDir = path.join(UPLOAD_DIR, subDir);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localPath = path.join(UPLOAD_DIR, blobPath);
      fs.writeFileSync(localPath, Buffer.from(arrayBuffer));
      url = `/uploads/${blobPath}`;
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
