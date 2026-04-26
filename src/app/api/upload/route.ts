import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";

function guard(req: NextRequest): NextResponse | undefined {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminSecret = process.env.ADMIN_PASSWORD ?? "lumos2024";
  const expected = createHash("sha256").update(adminSecret).digest("hex");
  if (token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const auth = guard(request as NextRequest);
  if (auth) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";
    const projectId = (formData.get("projectId") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

    const publicDir = path.join(process.cwd(), "public");
    const uploadDir = path.join(publicDir, "images", folder);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    const url = `/images/${folder}/${filename}`;

    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project) {
        let images: string[] = [];
        try { images = JSON.parse(project.images); } catch {}
        images.push(url);
        await prisma.project.update({
          where: { id: projectId },
          data: {
            images: JSON.stringify(images),
            cover: project.cover || url,
          },
        });
      }
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
