import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// Field name constants to avoid typos
const ABOUT_FIELDS = [
  "name_en", "name_zh",
  "title_en", "title_zh",
  "bio_en", "bio_zh",
  "quote_en", "quote_zh",
  "education_en", "education_zh",
] as const;

type AboutField = typeof ABOUT_FIELDS[number];

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function requireAdmin(req: NextRequest): NextResponse | undefined {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminSecret = process.env.ADMIN_PASSWORD ?? "lumos2024";
  const expected = createHash("sha256").update(adminSecret).digest("hex");
  if (token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PUT(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;

  const body = await req.json();
  const { type, ...data } = body as Record<string, unknown>;
  const prisma = (await import("@/lib/db")).prisma;

  switch (type) {
    case "site": {
      const titleEn = String(data.titleEn ?? data.title_en ?? "");
      const titleZh = String(data.titleZh ?? data.title_zh ?? "");
      const subtitleEn = String(data.subtitleEn ?? data.subtitle_en ?? "");
      const subtitleZh = String(data.subtitleZh ?? data.subtitle_zh ?? "");
      const result = await prisma.site.upsert({
        where: { id: "site" },
        update: { titleEn, titleZh, subtitleEn, subtitleZh },
        create: { id: "site", titleEn, titleZh, subtitleEn, subtitleZh },
      });
      return NextResponse.json(result);
    }

    case "about": {
      const photo = String(data.photo ?? "");
      const aboutData = {
        id: "about",
        nameEn: String(data.nameEn ?? data.name_en ?? ""),
        nameZh: String(data.nameZh ?? data.name_zh ?? ""),
        titleEn: String(data.titleEn ?? data.title_en ?? ""),
        titleZh: String(data.titleZh ?? data.title_zh ?? ""),
        bioEn: String(data.bioEn ?? data.bio_en ?? ""),
        bioZh: String(data.bioZh ?? data.bio_zh ?? ""),
        quoteEn: String(data.quoteEn ?? data.quote_en ?? ""),
        quoteZh: String(data.quoteZh ?? data.quote_zh ?? ""),
        educationEn: String(data.educationEn ?? data.education_en ?? ""),
        educationZh: String(data.educationZh ?? data.education_zh ?? ""),
        photo: photo || "/images/about/0.jpg",
      };
      const result = await prisma.about.upsert({
        where: { id: "about" },
        update: aboutData,
        create: aboutData,
      });
      return NextResponse.json(result);
    }

    case "category": {
      const id = String(data.id ?? "");
      const nameEn = String(data.nameEn ?? data.name_en ?? "");
      const nameZh = String(data.nameZh ?? data.name_zh ?? "");
      const sortOrder = Number(data.sortOrder ?? data.sort_order ?? 0);
      const result = await prisma.category.upsert({
        where: { id },
        update: { nameEn, nameZh, sortOrder },
        create: { id, key: id || String(Date.now()), nameEn, nameZh, sortOrder },
      });
      return NextResponse.json(result);
    }

    case "service": {
      const id = String(data.id ?? "");
      const titleEn = String(data.titleEn ?? data.title_en ?? "");
      const titleZh = String(data.titleZh ?? data.title_zh ?? "");
      const descEn = String(data.descEn ?? data.desc_en ?? "");
      const descZh = String(data.descZh ?? data.desc_zh ?? "");
      const sortOrder = Number(data.sortOrder ?? data.sort_order ?? 0);
      const result = await prisma.service.upsert({
        where: { id },
        update: { titleEn, titleZh, descEn, descZh, sortOrder },
        create: { id, titleEn, titleZh, descEn, descZh, sortOrder },
      });
      return NextResponse.json(result);
    }

    case "link": {
      const id = String(data.id ?? "");
      const platform = String(data.platform ?? "");
      const url = String(data.url ?? "");
      const sortOrder = Number(data.sortOrder ?? data.sort_order ?? 0);
      const result = await prisma.link.upsert({
        where: { id },
        update: { platform, url, sortOrder },
        create: { id, platform, url, sortOrder },
      });
      return NextResponse.json(result);
    }

    case "project": {
      const id = String(data.id ?? "");
      const titleEn = String(data.titleEn ?? data.title_en ?? "");
      const titleZh = String(data.titleZh ?? data.title_zh ?? "");
      const cover = String(data.cover ?? "");
      const imageFolder = String(data.imageFolder ?? data.image_folder ?? id);
      const link = String(data.link ?? "");
      const sortOrder = Number(data.sortOrder ?? data.sort_order ?? 0);
      let images = "[]";
      let contentZh = "[]";
      let contentEn = "[]";
      if (Array.isArray(data.images)) images = JSON.stringify(data.images);
      if (Array.isArray(data.contentZh)) contentZh = JSON.stringify(data.contentZh);
      if (Array.isArray(data.contentEn)) contentEn = JSON.stringify(data.contentEn);
      const result = await prisma.project.upsert({
        where: { id },
        update: { titleEn, titleZh, cover, imageFolder, link, sortOrder, images, contentZh, contentEn },
        create: { id, categoryId: String(data.categoryId ?? ""), titleEn, titleZh, cover, imageFolder, link, sortOrder, images, contentZh, contentEn },
      });
      return NextResponse.json(result);
    }

    case "work": {
      const id = String(data.id ?? "");
      const titleEn = String(data.titleEn ?? data.title_en ?? "");
      const titleZh = String(data.titleZh ?? data.title_zh ?? "");
      const period = String(data.period ?? "");
      const detailFolder = String(data.detailFolder ?? data.detail_folder ?? id);
      const sortOrder = Number(data.sortOrder ?? data.sort_order ?? 0);
      let contentZh = "[]";
      let contentEn = "[]";
      if (Array.isArray(data.contentZh)) contentZh = JSON.stringify(data.contentZh);
      if (Array.isArray(data.contentEn)) contentEn = JSON.stringify(data.contentEn);
      const result = await prisma.workExperience.upsert({
        where: { id },
        update: { titleEn, titleZh, period, detailFolder, sortOrder, contentZh, contentEn },
        create: { id, titleEn, titleZh, period, detailFolder, sortOrder, contentZh, contentEn },
      });
      return NextResponse.json(result);
    }

    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;

  const body = await req.json();
  const { type, id } = body as { type: string; id: string };
  const prisma = (await import("@/lib/db")).prisma;

  switch (type) {
    case "category":
      await prisma.category.delete({ where: { id } });
      return NextResponse.json({ success: true });
    case "service":
      await prisma.service.delete({ where: { id } });
      return NextResponse.json({ success: true });
    case "link":
      await prisma.link.delete({ where: { id } });
      return NextResponse.json({ success: true });
    case "project":
      await prisma.project.delete({ where: { id } });
      return NextResponse.json({ success: true });
    case "work":
      await prisma.workExperience.delete({ where: { id } });
      return NextResponse.json({ success: true });
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }
}
