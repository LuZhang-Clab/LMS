import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";

function safeJsonParse(str: string, fallback: unknown): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function guard(req: NextRequest): NextResponse | undefined {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminSecret = process.env.ADMIN_PASSWORD ?? "lumos2024";
  const expected = createHash("sha256").update(adminSecret).digest("hex");
  if (token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
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
          include: {
            projects: {
              orderBy: { sortOrder: "asc" },
            },
          },
        }),
      ]);

    if (!site || !about) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Reconstruct in the same shape the admin page expects
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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Site
    await prisma.site.upsert({
      where: { id: "site" },
      update: {
        titleEn: body.site?.title_en ?? "",
        titleZh: body.site?.title_zh ?? "",
        subtitleEn: body.site?.subtitle_en ?? "",
        subtitleZh: body.site?.subtitle_zh ?? "",
      },
      create: {
        id: "site",
        titleEn: body.site?.title_en ?? "",
        titleZh: body.site?.title_zh ?? "",
        subtitleEn: body.site?.subtitle_en ?? "",
        subtitleZh: body.site?.subtitle_zh ?? "",
      },
    });

    // About
    await prisma.about.upsert({
      where: { id: "about" },
      update: {
        nameEn: body.about?.name_en ?? "",
        nameZh: body.about?.name_zh ?? "",
        titleEn: body.about?.title_en ?? "",
        titleZh: body.about?.title_zh ?? "",
        bioEn: body.about?.bio_en ?? "",
        bioZh: body.about?.bio_zh ?? "",
        quoteEn: body.about?.quote_en ?? "",
        quoteZh: body.about?.quote_zh ?? "",
        educationEn: body.about?.education_en ?? "",
        educationZh: body.about?.education_zh ?? "",
        photo: body.about?.photo ?? "/images/about/0.jpg",
      },
      create: {
        id: "about",
        nameEn: body.about?.name_en ?? "",
        nameZh: body.about?.name_zh ?? "",
        titleEn: body.about?.title_en ?? "",
        titleZh: body.about?.title_zh ?? "",
        bioEn: body.about?.bio_en ?? "",
        bioZh: body.about?.bio_zh ?? "",
        quoteEn: body.about?.quote_en ?? "",
        quoteZh: body.about?.quote_zh ?? "",
        educationEn: body.about?.education_en ?? "",
        educationZh: body.about?.education_zh ?? "",
        photo: body.about?.photo ?? "/images/about/0.jpg",
      },
    });

    // Work Experience
    if (Array.isArray(body.workExperience)) {
      await prisma.workExperience.deleteMany({});
      for (let i = 0; i < body.workExperience.length; i++) {
        const w = body.workExperience[i];
        await prisma.workExperience.create({
          data: {
            id: w.id || `we-${Date.now()}-${i}`,
            titleEn: w.title_en ?? "",
            titleZh: w.title_zh ?? "",
            period: w.period ?? "",
            detailFolder: w.detailFolder ?? "",
            contentZh: JSON.stringify(w.content_zh ?? []),
            contentEn: JSON.stringify(w.content_en ?? []),
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
            id: s.id || `svc-${Date.now()}-${i}`,
            titleEn: s.title_en ?? "",
            titleZh: s.title_zh ?? "",
            descEn: s.desc_en ?? "",
            descZh: s.desc_zh ?? "",
            sortOrder: i,
          },
        });
      }
    }

    // Links (supports both array and object for backward compatibility)
    if (body.links) {
      await prisma.link.deleteMany({});
      const platformOrder = ["linkedin", "github", "replit", "xiaohongshu", "email"];
      let i = 0;
      if (Array.isArray(body.links)) {
        // Array form: [{ platform, url, sortOrder }]
        for (const link of body.links) {
          if (link.url) {
            await prisma.link.create({
              data: {
                id: link.id || `link-${Date.now()}-${i}`,
                platform: link.platform,
                url: link.url,
                sortOrder: link.sortOrder ?? i,
              },
            });
            i++;
          }
        }
      } else {
        // Object form: { linkedin: "url", github: "url" }
        for (const [platform, url] of Object.entries(body.links)) {
          if (url) {
            await prisma.link.create({
              data: {
                id: `link-${Date.now()}-${i}`,
                platform,
                url: url as string,
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
        const catId = cat.id || `cat-${Date.now()}-${ci}`;

        await prisma.category.create({
          data: {
            id: catId,
            key: catId,
            nameEn: cat.name_en ?? "",
            nameZh: cat.name_zh ?? "",
            sortOrder: ci,
          },
        });

        for (let pi = 0; pi < (cat.projects || []).length; pi++) {
          const p = cat.projects[pi];
          await prisma.project.create({
            data: {
              id: p.id || `proj-${Date.now()}-${ci}-${pi}`,
              categoryId: catId,
              titleEn: p.title_en ?? "",
              titleZh: p.title_zh ?? "",
              cover: p.cover ?? "",
              imageFolder: p.imageFolder ?? p.id ?? "",
              images: JSON.stringify(p.images ?? []),
              contentZh: JSON.stringify(p.content_zh ?? []),
              contentEn: JSON.stringify(p.content_en ?? []),
              link: p.link ?? "",
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
