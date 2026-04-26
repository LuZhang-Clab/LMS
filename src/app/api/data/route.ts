import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function safeJsonParse(str: string, fallback: unknown): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;

  try {
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
        titleEn: site.titleEn,
        titleZh: site.titleZh,
        subtitleEn: site.subtitleEn ?? "",
        subtitleZh: site.subtitleZh ?? "",
      },
      about: {
        nameEn: about.nameEn,
        nameZh: about.nameZh,
        titleEn: about.titleEn,
        titleZh: about.titleZh,
        bioEn: about.bioEn,
        bioZh: about.bioZh,
        quoteEn: about.quoteEn,
        quoteZh: about.quoteZh,
        educationEn: about.educationEn,
        educationZh: about.educationZh,
        photo: about.photo,
        awardsEn: about.awardsEn,
        awardsZh: about.awardsZh,
      },
      workExperience: workExperience.map((w) => ({
        id: w.id,
        titleEn: w.titleEn,
        titleZh: w.titleZh,
        period: w.period,
        detailFolder: w.detailFolder,
        contentZh: safeJsonParse(w.contentZh, []),
        contentEn: safeJsonParse(w.contentEn, []),
        sortOrder: w.sortOrder,
      })),
      services: services.map((s) => ({
        id: s.id,
        titleEn: s.titleEn,
        titleZh: s.titleZh,
        descEn: s.descEn,
        descZh: s.descZh,
        sortOrder: s.sortOrder,
      })),
      links: links.map((l) => ({
        id: l.id,
        platform: l.platform,
        url: l.url,
        sortOrder: l.sortOrder,
      })),
      categories: categories.map((cat) => ({
        id: cat.id,
        key: cat.key,
        nameEn: cat.nameEn,
        nameZh: cat.nameZh,
        sortOrder: cat.sortOrder,
        projects: cat.projects.map((p) => ({
          id: p.id,
          titleEn: p.titleEn,
          titleZh: p.titleZh,
          cover: p.cover,
          imageFolder: p.imageFolder,
          link: p.link,
          images: safeJsonParse(p.images, []),
          contentZh: safeJsonParse(p.contentZh, []),
          contentEn: safeJsonParse(p.contentEn, []),
          sortOrder: p.sortOrder,
        })),
      })),
    };

    return NextResponse.json(result);
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
  try {
    new URL(value);
    return value.slice(0, 2000);
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;

  try {
    const body = await req.json();

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
            detailFolder: validateString(w.detailFolder, 100),
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
      const platformOrder = ["linkedin", "github", "replit", "xiaohongshu", "email"];
      let i = 0;
      if (Array.isArray(body.links)) {
        for (const link of body.links) {
          if (link.url) {
            await prisma.link.create({
              data: {
                id: validateString(link.id, 100) || `link-${Date.now()}-${i}`,
                platform: validateString(link.platform, 50),
                url: validateUrl(link.url),
                sortOrder: typeof link.sortOrder === "number" ? link.sortOrder : i,
              },
            });
            i++;
          }
        }
      } else {
        for (const [platform, url] of Object.entries(body.links)) {
          if (url && typeof url === "string") {
            await prisma.link.create({
              data: {
                id: `link-${Date.now()}-${i}`,
                platform,
                url: validateUrl(url),
                sortOrder: platformOrder.indexOf(platform),
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
              imageFolder: validateString(p.imageFolder, 100) || validateString(p.id, 100),
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
