import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { cookies } from "next/headers";

function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  const adminSecret = process.env.ADMIN_PASSWORD ?? "lumos2024";
  const expected = createHash("sha256").update(adminSecret).digest("hex");
  return token === expected;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.password) {
      const adminPw = process.env.ADMIN_PASSWORD ?? "lumos2024";
      if (body.password !== adminPw) {
        return NextResponse.json({ valid: false }, { status: 401 });
      }
      const adminSecret = process.env.ADMIN_PASSWORD ?? "lumos2024";
      const token = createHash("sha256").update(adminSecret).digest("hex");
      const cookieStore = await cookies();
      cookieStore.set("admin_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return NextResponse.json({ success: true });
}
