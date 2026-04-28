import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("id");

  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: project.id,
      titleZh: project.titleZh,
      titleEn: project.titleEn,
      contentZh_length: project.contentZh?.length ?? 0,
      contentZh_preview: project.contentZh?.slice(0, 200),
      contentEn_length: project.contentEn?.length ?? 0,
      contentEn_preview: project.contentEn?.slice(0, 200),
      cover: project.cover,
      imageFolder: project.imageFolder,
    });
  }

  // Return all projects
  const projects = await prisma.project.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      titleZh: true,
      titleEn: true,
      contentZh: true,
      contentEn: true,
      cover: true,
      imageFolder: true,
      categoryId: true,
    },
  });

  return NextResponse.json({
    total: projects.length,
    projects: projects.map((p) => ({
      id: p.id,
      titleZh: p.titleZh,
      titleEn: p.titleEn,
      contentZh_length: p.contentZh?.length ?? 0,
      contentZh_preview: p.contentZh?.slice(0, 200),
      contentEn_length: p.contentEn?.length ?? 0,
      contentEn_preview: p.contentEn?.slice(0, 200),
      cover: p.cover,
      imageFolder: p.imageFolder,
      categoryId: p.categoryId,
    })),
  });
}
