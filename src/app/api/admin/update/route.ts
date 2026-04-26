import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function guard(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  const adminSecret = process.env.ADMIN_PASSWORD ?? "lumos2024";
  const expected = createHash("sha256").update(adminSecret).digest("hex");
  return token === expected;
}

function requireAdmin(req: NextRequest): NextResponse | undefined {
  if (!guard(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// ─── Default PUT handler (dispatches by type) ────────────────────────────────
export async function PUT(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;
  const body = await req.json();
  const { type, ...data } = body;

  switch (type) {
    case "site": {
      const result = await (await import("@/lib/db")).prisma.site.upsert({
        where: { id: "site" },
        update: { titleEn: data.titleEn, titleZh: data.titleZh },
        create: { id: "site", titleEn: data.titleEn, titleZh: data.titleZh },
      });
      return NextResponse.json(result);
    }
    case "about": {
      const result = await (await import("@/lib/db")).prisma.about.upsert({
        where: { id: "about" },
        update: data,
        create: { id: "about", ...data },
      });
      return NextResponse.json(result);
    }
    case "category": {
      const result = await (await import("@/lib/db")).prisma.category.upsert({
        where: { id: data.id ?? "" },
        update: data,
        create: data,
      });
      return NextResponse.json(result);
    }
    case "service": {
      const result = await (await import("@/lib/db")).prisma.service.upsert({
        where: { id: data.id ?? "" },
        update: data,
        create: data,
      });
      return NextResponse.json(result);
    }
    case "link": {
      const result = await (await import("@/lib/db")).prisma.link.upsert({
        where: { id: data.id ?? "" },
        update: data,
        create: data,
      });
      return NextResponse.json(result);
    }
    case "project": {
      const result = await (await import("@/lib/db")).prisma.project.upsert({
        where: { id: data.id ?? "" },
        update: data,
        create: data,
      });
      return NextResponse.json(result);
    }
    case "work": {
      const result = await (await import("@/lib/db")).prisma.workExperience.upsert({
        where: { id: data.id },
        update: data,
        create: data,
      });
      return NextResponse.json(result);
    }
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }
}

// ─── Default DELETE handler ──────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;
  const body = await req.json();
  const { type, id } = body;

  const prisma = await import("@/lib/db").then(m => m.prisma);

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
