import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

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

    // Sanitize filename — keep only safe chars
    const rawExt = path.extname(file.name).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const ext = allowedExts.includes(rawExt) ? rawExt : ".bin";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
    const filename = `${Date.now()}-${safeName}${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const publicDir = path.join(process.cwd(), "public");
    // about photos go to /images/about/, other files to /images/projects/{folder}/
    const uploadDir = folder === "about"
      ? path.join(publicDir, "images", "about")
      : path.join(publicDir, "images", "projects", folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    const url = folder === "about"
      ? `/images/about/${filename}`
      : `/images/projects/${folder}/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
