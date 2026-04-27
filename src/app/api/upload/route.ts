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
    const nameWithoutExt = safeName.replace(/\.[^.]+$/, ""); // strip original extension
    const filename = `${Date.now()}-${nameWithoutExt}${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const publicDir = path.join(process.cwd(), "public");
    let uploadDir: string;
    let urlPath: string;
    if (folder === "about") {
      uploadDir = path.join(publicDir, "images", "about");
      urlPath = `/images/about/${filename}`;
    } else if (folder.startsWith("w-")) {
      // work folders: w-12345 → /images/work/w-12345/
      uploadDir = path.join(publicDir, "images", "work", folder);
      urlPath = `/images/work/${folder}/${filename}`;
    } else if (folder && folder.trim()) {
      // project/category folders: proj-12345, cat-xxx → /images/projects/{folder}/
      uploadDir = path.join(publicDir, "images", "projects", folder);
      urlPath = `/images/projects/${folder}/${filename}`;
    } else {
      uploadDir = path.join(publicDir, "images", "uploads");
      urlPath = `/images/uploads/${filename}`;
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    return NextResponse.json({ url: urlPath });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
