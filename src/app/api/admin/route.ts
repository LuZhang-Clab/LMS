import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashPassword, getAdminPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.password && typeof body.password === "string") {
      const adminPw = getAdminPassword();
      if (body.password !== adminPw) {
        return NextResponse.json({ valid: false }, { status: 401 });
      }
      const token = hashPassword(adminPw);
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
  const { requireAdmin } = await import("@/lib/auth");
  const authCheck = requireAdmin(req);
  if (authCheck) return authCheck;

  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return NextResponse.json({ success: true });
}
