import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// Simple in-memory cache for GET requests (valid for 5 seconds)
let cachedData: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 5000; // 5 seconds

function safeJsonParse(str: string, fallback: unknown): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedData && now - cachedData.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedData.data, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const [site, about, workExperience, services, links, categories] =
      await Promise.all([
        prisma.site.findUnique({ where: { id: "site" } }),
        prisma.about.findUnique({ where: { id: "about" } }),
        prisma.workExperience.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.link.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.category.findMany({
          orderBy: { sortOrder: "asc" },
          include: { projects: { orderBy: { sortOrder: "asc" } } },
        }),
      ]);

    if (!site || !about) {
      return NextResponse.json(
        { error: "Database not initialized. Run `npm run seed` to populate data." },
        { status: 500 }
      );
    }

    const result = {
      site: {
        title_en: site.titleEn,
        title_zh: site.titleZh,
        subtitle_en: site.subtitleEn ?? "",
        subtitle_zh: site.subtitleZh ?? "",
      },
      about: {
        name_en: about.nameEn,
        name_zh: about.nameZh,
        title_en: about.titleEn,
        title_zh: about.titleZh,
        bio_en: about.bioEn,
        bio_zh: about.bioZh,
        quote_en: about.quoteEn,
        quote_zh: about.quoteZh,
        education_en: about.educationEn,
        education_zh: about.educationZh,
        photo: about.photo,
        awards_en: about.awardsEn,
        awards_zh: about.awardsZh,
      },
      workExperience: workExperience.map((w) => ({
        id: w.id,
        title_en: w.titleEn,
        title_zh: w.titleZh,
        period: w.period,
        detail_folder: w.detailFolder,
        content_zh: safeJsonParse(w.contentZh, []),
        content_en: safeJsonParse(w.contentEn, []),
        sort_order: w.sortOrder,
      })),
      services: services.map((s) => ({
        id: s.id,
        title_en: s.titleEn,
        title_zh: s.titleZh,
        desc_en: s.descEn,
        desc_zh: s.descZh,
        sort_order: s.sortOrder,
      })),
      links: links.reduce((acc, l) => {
        acc[l.platform] = l.url;
        return acc;
      }, {} as Record<string, string>),
      categories: categories.map((cat) => ({
        id: cat.id,
        key: cat.key,
        name_en: cat.nameEn,
        name_zh: cat.nameZh,
        sort_order: cat.sortOrder,
        projects: cat.projects.map((p) => ({
          id: p.id,
          title_en: p.titleEn,
          title_zh: p.titleZh,
          cover: p.cover,
          image_folder: p.imageFolder,
          link: p.link,
          images: safeJsonParse(p.images, []),
          content_zh: safeJsonParse(p.contentZh, []),
          content_en: safeJsonParse(p.contentEn, []),
          sort_order: p.sortOrder,
        })),
      })),
    };

    // Cache the result
    cachedData = { data: result, timestamp: now };

    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[GET /api/data]", error);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Clear cache on save
    cachedData = null;

    // Site
    await prisma.site.upsert({
      where: { id: "site" },
      update: {
        titleEn: validateString(body.site?.title_en),
        titleZh: validateString(body.site?.title_zh),
        subtitleEn: validateString(body.site?.subtitle_en),
        subtitleZh: validateString(body.site?.subtitle_zh),
      },
      create: {
        id: "site",
        titleEn: validateString(body.site?.title_en),
        titleZh: validateString(body.site?.title_zh),
        subtitleEn: validateString(body.site?.subtitle_en),
        subtitleZh: validateString(body.site?.subtitle_zh),
      },
    });

    // About
    await prisma.about.upsert({
      where: { id: "about" },
      update: {
        nameEn: validateString(body.about?.name_en),
        nameZh: validateString(body.about?.name_zh),
        titleEn: validateString(body.about?.title_en),
        titleZh: validateString(body.about?.title_zh),
        bioEn: validateString(body.about?.bio_en, 5000),
        bioZh: validateString(body.about?.bio_zh, 5000),
        quoteEn: validateString(body.about?.quote_en, 2000),
        quoteZh: validateString(body.about?.quote_zh, 2000),
        educationEn: validateString(body.about?.education_en, 1000),
        educationZh: validateString(body.about?.education_zh, 1000),
        awardsEn: validateString(body.about?.awards_en, 3000),
        awardsZh: validateString(body.about?.awards_zh, 3000),
        photo: validateUrl(body.about?.photo) || "/images/about/0.jpg",
      },
      create: {
        id: "about",
        nameEn: validateString(body.about?.name_en),
        nameZh: validateString(body.about?.name_zh),
        titleEn: validateString(body.about?.title_en),
        titleZh: validateString(body.about?.title_zh),
        bioEn: validateString(body.about?.bio_en, 5000),
        bioZh: validateString(body.about?.bio_zh, 5000),
        quoteEn: validateString(body.about?.quote_en, 2000),
        quoteZh: validateString(body.about?.quote_zh, 2000),
        educationEn: validateString(body.about?.education_en, 1000),
        educationZh: validateString(body.about?.education_zh, 1000),
        awardsEn: validateString(body.about?.awards_en, 3000),
        awardsZh: validateString(body.about?.awards_zh, 3000),
        photo: validateUrl(body.about?.photo) || "/images/about/0.jpg",
      },
    });

    // Work Experience
    if (Array.isArray(body.workExperience)) {
      await prisma.workExperience.deleteMany({});
      for (let i = 0; i < body.workExperience.length; i++) {
        const w = body.workExperience[i];
        await prisma.workExperience.create({
          data: {
            id: validateString(w.id, 100) || `we-${Date.now()}-${i}`,
            titleEn: validateString(w.title_en),
            titleZh: validateString(w.title_zh),
            period: validateString(w.period, 100),
            detailFolder: validateString(w.detail_folder, 100),
            contentZh: JSON.stringify(Array.isArray(w.content_zh) ? w.content_zh : []),
            contentEn: JSON.stringify(Array.isArray(w.content_en) ? w.content_en : []),
            sortOrder: i,
          },
        });
      }
    }

    // Services
    if (Array.isArray(body.services)) {
      await prisma.service.deleteMany({});
      for (let i = 0; i < body.services.length; i++) {
        const s = body.services[i];
        await prisma.service.create({
          data: {
            id: validateString(s.id, 100) || `svc-${Date.now()}-${i}`,
            titleEn: validateString(s.title_en),
            titleZh: validateString(s.title_zh),
            descEn: validateString(s.desc_en, 2000),
            descZh: validateString(s.desc_zh, 2000),
            sortOrder: i,
          },
        });
      }
    }

    // Links
    if (body.links) {
      await prisma.link.deleteMany({});
      const platformOrder: Record<string, number> = { linkedin: 0, github: 1, replit: 2, xiaohongshu: 3, email: 4 };
      if (typeof body.links === "object" && !Array.isArray(body.links)) {
        let i = 0;
        for (const [platform, url] of Object.entries(body.links)) {
          if (url && typeof url === "string" && url.trim()) {
            await prisma.link.create({
              data: {
                id: `link-${Date.now()}-${i}`,
                platform,
                url: validateUrl(url),
                sortOrder: platformOrder[platform] ?? i,
              },
            });
            i++;
          }
        }
      }
    }

    // Categories & Projects
    if (Array.isArray(body.categories)) {
      await prisma.project.deleteMany({});
      await prisma.category.deleteMany({});

      for (let ci = 0; ci < body.categories.length; ci++) {
        const cat = body.categories[ci];
        const catId = validateString(cat.id, 100) || `cat-${Date.now()}-${ci}`;

        await prisma.category.create({
          data: {
            id: catId,
            key: catId,
            nameEn: validateString(cat.name_en),
            nameZh: validateString(cat.name_zh),
            sortOrder: ci,
          },
        });

        for (let pi = 0; pi < (cat.projects || []).length; pi++) {
          const p = cat.projects[pi];
          await prisma.project.create({
            data: {
              id: validateString(p.id, 100) || `proj-${Date.now()}-${ci}-${pi}`,
              categoryId: catId,
              titleEn: validateString(p.title_en),
              titleZh: validateString(p.title_zh),
              cover: validateUrl(p.cover),
              imageFolder: validateString(p.image_folder, 100) || validateString(p.id, 100),
              images: JSON.stringify(Array.isArray(p.images) ? p.images : []),
              contentZh: JSON.stringify(Array.isArray(p.content_zh) ? p.content_zh : []),
              contentEn: JSON.stringify(Array.isArray(p.content_en) ? p.content_en : []),
              link: validateUrl(p.link),
              sortOrder: pi,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/data]", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
