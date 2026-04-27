import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("id");

  if (!projectId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

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
