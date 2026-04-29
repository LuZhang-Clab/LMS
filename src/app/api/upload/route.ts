import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB for local storage
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists (local dev)
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(request: Request): Promise<NextResponse> {
  // If BLOB_READ_WRITE_TOKEN is set, use Vercel Blob client-upload flow
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return handleVercelBlob(request);
  }

  // Otherwise, fall back to local file storage (local dev / self-hosted)
  return handleLocalUpload(request);
}

// ---------- Vercel Blob client-upload (bypasses 4.5MB serverless limit) ----------
async function handleVercelBlob(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let folder = "";
        if (clientPayload) {
          try {
            const payload = JSON.parse(clientPayload);
            folder = payload.folder ?? "";
          } catch {
            // ignore malformed payload
          }
        }

        let blobPathname = pathname;
        if (folder === "about") {
          blobPathname = `images/about/${pathname}`;
        } else if (folder.startsWith("work/")) {
          const workId = folder.replace("work/", "");
          blobPathname = `images/work/${workId}/${pathname}`;
        } else if (folder.startsWith("w-")) {
          blobPathname = `images/work/${folder}/${pathname}`;
        } else if (folder && folder.trim()) {
          blobPathname = `images/projects/${folder}/${pathname}`;
        } else {
          blobPathname = `images/uploads/${pathname}`;
        }

        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
          addRandomSuffix: true,
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("[handleUpload] completed:", blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

// ---------- Local file storage fallback for local dev / self-hosted ----------
async function handleLocalUpload(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes((file as File).type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }
    if ((file as File).size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const rawExt = path.extname((file as File).name).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const ext = allowedExts.includes(rawExt) ? rawExt : ".bin";
    const shortId = Math.random().toString(36).slice(2, 10);
    const filename = `${shortId}${ext}`;

    let blobPath: string;
    if (folder === "about") {
      blobPath = `images/about/${filename}`;
    } else if (folder.startsWith("work/")) {
      const workId = folder.replace("work/", "");
      blobPath = `images/work/${workId}/${filename}`;
    } else if (folder.startsWith("w-")) {
      blobPath = `images/work/${folder}/${filename}`;
    } else if (folder && folder.trim()) {
      blobPath = `images/projects/${folder}/${filename}`;
    } else {
      blobPath = `images/uploads/${filename}`;
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const subDir = blobPath.split("/").slice(0, -1).join("/");
    const localDir = path.join(UPLOAD_DIR, subDir);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(UPLOAD_DIR, blobPath);
    fs.writeFileSync(localPath, Buffer.from(arrayBuffer));

    return NextResponse.json({ url: `/uploads/${blobPath}` });
  } catch (error) {
    console.error("[POST /api/upload] local upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
