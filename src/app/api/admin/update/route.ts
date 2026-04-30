import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { clearDataCache } from "@/lib/cache";
import fs from "fs";
import path from "path";

const ABOUT_FIELDS = [
  "name_en", "name_zh",
  "title_en", "title_zh",
  "bio_en", "bio_zh",
  "quote_en", "quote_zh",
  "education_en", "education_zh",
] as const;

function validateString(value: unknown, maxLen = 1000): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLen);
}

function validateUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  // Accept absolute URLs or relative paths starting with /
  if (trimmed.startsWith("/")) return trimmed.slice(0, 2000);
  try {
    new URL(trimmed);
    return trimmed.slice(0, 2000);
  } catch {
    return "";
  }
}

function validateSortOrder(value: unknown): number {
  const n = Number(value);
  return isNaN(n) ? 0 : Math.max(0, Math.floor(n));
}

function validateJsonArray(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  return "[]";
}

// For Tiptap HTML output — accepts any string, truncates to maxLen
function validateHtmlContent(value: unknown, maxLen = 100000): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLen);
}

export async function PUT(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;

  const body = await req.json();
  const { type, ...data } = body as Record<string, unknown>;

  if (!type || typeof type !== "string") {
    return NextResponse.json({ error: "Missing or invalid 'type' field" }, { status: 400 });
  }

  const prisma = (await import("@/lib/db")).prisma;

  switch (type) {
    case "site": {
      const titleEn = validateString(data.titleEn ?? data.title_en);
      const titleZh = validateString(data.titleZh ?? data.title_zh);
      const subtitleEn = validateString(data.subtitleEn ?? data.subtitle_en);
      const subtitleZh = validateString(data.subtitleZh ?? data.subtitle_zh);
      const result = await prisma.site.upsert({
        where: { id: "site" },
        update: { titleEn, titleZh, subtitleEn, subtitleZh },
        create: { id: "site", titleEn, titleZh, subtitleEn, subtitleZh },
      });
      clearDataCache();
      return NextResponse.json(result);
    }

    case "about": {
      const photo = validateUrl(data.photo) || "/images/about/0.jpg";
      const aboutData = {
        id: "about",
        nameEn: validateString(data.nameEn ?? data.name_en),
        nameZh: validateString(data.nameZh ?? data.name_zh),
        titleEn: validateString(data.titleEn ?? data.title_en),
        titleZh: validateString(data.titleZh ?? data.title_zh),
        bioEn: validateString(data.bioEn ?? data.bio_en, 5000),
        bioZh: validateString(data.bioZh ?? data.bio_zh, 5000),
        quoteEn: validateString(data.quoteEn ?? data.quote_en, 2000),
        quoteZh: validateString(data.quoteZh ?? data.quote_zh, 2000),
        educationEn: validateString(data.educationEn ?? data.education_en, 1000),
        educationZh: validateString(data.educationZh ?? data.education_zh, 1000),
        awardsEn: validateString(data.awardsEn ?? data.awards_en, 3000),
        awardsZh: validateString(data.awardsZh ?? data.awards_zh, 3000),
        photo,
      };
      const result = await prisma.about.upsert({
        where: { id: "about" },
        update: aboutData,
        create: aboutData,
      });
      return NextResponse.json(result);
    }

    case "category": {
      const id = validateString(data.id, 100);
      const nameEn = validateString(data.nameEn ?? data.name_en);
      const nameZh = validateString(data.nameZh ?? data.name_zh);
      const sortOrder = validateSortOrder(data.sortOrder ?? data.sort_order);
      const result = await prisma.category.upsert({
        where: { id },
        update: { nameEn, nameZh, sortOrder },
        create: { id: id || String(Date.now()), key: id || String(Date.now()), nameEn, nameZh, sortOrder },
      });
      clearDataCache();
      return NextResponse.json(result);
    }

    case "service": {
      const id = validateString(data.id, 100);
      const titleEn = validateString(data.titleEn ?? data.title_en);
      const titleZh = validateString(data.titleZh ?? data.title_zh);
      const descEn = validateString(data.descEn ?? data.desc_en, 2000);
      const descZh = validateString(data.descZh ?? data.desc_zh, 2000);
      const link = validateUrl(data.link);
      const sortOrder = validateSortOrder(data.sortOrder ?? data.sort_order);
      const result = await prisma.service.upsert({
        where: { id },
        update: { titleEn, titleZh, descEn, descZh, link, sortOrder },
        create: { id, titleEn, titleZh, descEn, descZh, link, sortOrder },
      });
      clearDataCache();
      return NextResponse.json(result);
    }

    case "link": {
      const platform = validateString(data.platform, 50);
      const url = validateUrl(data.url);
      const sortOrder = validateSortOrder(data.sortOrder ?? data.sort_order);
      if (!platform) {
        return NextResponse.json({ error: "Platform is required" }, { status: 400 });
      }
      const result = await prisma.link.upsert({
        where: { platform },
        update: { platform, url, sortOrder },
        create: { platform, url, sortOrder },
      });
      return NextResponse.json(result);
    }

    case "project": {
      const id = validateString(data.id, 100);
      const categoryId = validateString(data.categoryId, 100);

      if (!categoryId) {
        return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
      }

      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 400 });
      }

      const titleEn = validateString(data.titleEn ?? data.title_en);
      const titleZh = validateString(data.titleZh ?? data.title_zh);
      const cover = validateUrl(data.cover);
      const imageFolder = validateString(data.imageFolder ?? data.image_folder, 100) || id;
      const link = validateUrl(data.link);
      const sortOrder = validateSortOrder(data.sortOrder ?? data.sort_order);
      const images = validateJsonArray(data.images);
      const contentZh = validateHtmlContent(data.contentZh ?? data.content_zh);
      const contentEn = validateHtmlContent(data.contentEn ?? data.content_en);

      const result = await prisma.project.upsert({
        where: { id },
        update: { categoryId, titleEn, titleZh, cover, imageFolder, link, sortOrder, images, contentZh, contentEn },
        create: { id, categoryId, titleEn, titleZh, cover, imageFolder, link, sortOrder, images, contentZh, contentEn },
      });
      clearDataCache();
      return NextResponse.json(result);
    }

    case "project-order": {
      // Lightweight update: only touch categoryId and sortOrder — preserves all other fields (cover, images, content, etc.)
      const id = validateString(data.id, 100);
      const categoryId = validateString(data.categoryId, 100);
      const sortOrder = validateSortOrder(data.sortOrder ?? data.sort_order);

      if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
      }

      const result = await prisma.project.update({
        where: { id },
        data: { categoryId: categoryId || undefined, sortOrder },
      });
      clearDataCache();
      return NextResponse.json(result);
    }

    case "work": {
      const id = validateString(data.id, 100);
      const titleEn = validateString(data.titleEn ?? data.title_en);
      const titleZh = validateString(data.titleZh ?? data.title_zh);
      const period = validateString(data.period, 100);
      const sortOrder = validateSortOrder(data.sortOrder ?? data.sort_order);
      const contentZh = validateHtmlContent(data.contentZh ?? data.content_zh);
      const contentEn = validateHtmlContent(data.contentEn ?? data.content_en);
      const cover = validateUrl(data.cover);
      const images = validateJsonArray(data.images);
      const detailFolder = validateString(data.detailFolder ?? data.detail_folder, 100) || id;
      const result = await prisma.workExperience.upsert({
        where: { id },
        update: { titleEn, titleZh, period, sortOrder, contentZh, contentEn, cover, images, detailFolder },
        create: { id, titleEn, titleZh, period, sortOrder, contentZh, contentEn, cover, images, detailFolder },
      });
      clearDataCache();
      return NextResponse.json(result);
    }

    default:
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;

  const body = await req.json();
  const { type, id } = body as { type: string; id: string };

  if (!type || typeof type !== "string" || !id) {
    return NextResponse.json({ error: "Missing 'type' or 'id'" }, { status: 400 });
  }

  const prisma = (await import("@/lib/db")).prisma;

  switch (type) {
    case "category":
      await prisma.category.delete({ where: { id } });
      clearDataCache();
      return NextResponse.json({ success: true });
    case "service":
      await prisma.service.delete({ where: { id } });
      clearDataCache();
      return NextResponse.json({ success: true });
    case "link":
      await prisma.link.delete({ where: { id } });
      clearDataCache();
      return NextResponse.json({ success: true });
    case "project":
      // Delete associated image folder
      const projectDir = path.join(process.cwd(), "public", "images", "projects", id);
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
      await prisma.project.deleteMany({ where: { id } });
      clearDataCache();
      return NextResponse.json({ success: true });
    case "work":
      // Delete associated image folder under public/uploads/images/work/{id}
      const workDir = path.join(process.cwd(), "public", "uploads", "images", "work", id);
      if (fs.existsSync(workDir)) {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
      await prisma.workExperience.deleteMany({ where: { id } });
      clearDataCache();
      return NextResponse.json({ success: true });
    default:
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }
}
