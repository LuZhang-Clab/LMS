import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Debug: GET /api/debug-work          → list all work experiences
//        GET /api/debug-work?id=w-xxx  → inspect specific entry
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workId = searchParams.get("id");

  if (workId) {
    const work = await prisma.workExperience.findUnique({ where: { id: workId } });
    if (!work) return NextResponse.json({ error: "not found" }, { status: 404 });

    const rawContentZh = work.contentZh ?? "";
    const rawContentEn = work.contentEn ?? "";

    return NextResponse.json({
      id: work.id,
      titleEn: work.titleEn,
      titleZh: work.titleZh,
      period: work.period,
      detailFolder: work.detailFolder,
      cover: work.cover,
      images_raw: work.images,
      images_parsed: (() => { try { return JSON.parse(work.images); } catch { return null; } })(),
      contentZh: {
        raw: rawContentZh,
        type: typeof rawContentZh,
        length: rawContentZh.length,
        imgTags: (rawContentZh.match(/<img[^>]+>/gi) ?? []).map((tag) => {
          const m = tag.match(/src=["']([^"']+)["']/i);
          return m ? m[1] : null;
        }).filter(Boolean),
      },
      contentEn: {
        raw: rawContentEn,
        type: typeof rawContentEn,
        length: rawContentEn.length,
        imgTags: (rawContentEn.match(/<img[^>]+>/gi) ?? []).map((tag) => {
          const m = tag.match(/src=["']([^"']+)["']/i);
          return m ? m[1] : null;
        }).filter(Boolean),
      },
    });
  }

  // List all
  const all = await prisma.workExperience.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({
    count: all.length,
    items: all.map((w) => ({
      id: w.id,
      titleZh: w.titleZh,
      titleEn: w.titleEn,
      period: w.period,
      detailFolder: w.detailFolder,
      cover: w.cover,
      images_parsed: (() => { try { return JSON.parse(w.images); } catch { return null; } })(),
      contentZh_length: (w.contentZh ?? "").length,
      contentEn_length: (w.contentEn ?? "").length,
      hasImgTags_zh: /<img/i.test(w.contentZh ?? ""),
      hasImgTags_en: /<img/i.test(w.contentEn ?? ""),
    })),
  });
}
