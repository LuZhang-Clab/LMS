import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Debug: GET /api/debug-content?id=proj-xxx
// Returns raw content_zh and content_en from the database for inspection.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("id");

  if (!projectId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Return the raw content fields so we can see exactly what's stored
  return NextResponse.json({
    id: project.id,
    imageFolder: project.imageFolder,
    // Raw from DB
    raw_contentZh: project.contentZh,
    raw_contentZh_type: typeof project.contentZh,
    raw_contentZh_length: project.contentZh?.length ?? 0,
    raw_contentEn: project.contentEn,
    raw_contentEn_length: project.contentEn?.length ?? 0,
  });
}
