import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const FALLBACK_PASSWORD = "lumos2024";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    console.warn(
      "[auth] ADMIN_PASSWORD not set — using insecure fallback. " +
        "Set it in Vercel environment variables immediately."
    );
  }
  return pw ?? FALLBACK_PASSWORD;
}

export function requireAdmin(req: NextRequest): NextResponse | undefined {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const expected = hashPassword(getAdminPassword());
  if (token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
