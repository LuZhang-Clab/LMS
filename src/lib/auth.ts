import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const FALLBACK_PASSWORD = "lumos2024";
const FALLBACK_TOKEN = createHash("sha256").update(FALLBACK_PASSWORD).digest("hex");

function computeToken(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// Node.js only: hash a plaintext password (used by login API)
export function hashPassword(password: string): string {
  return computeToken(password);
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

export function getAdminToken(): string {
  // ADMIN_TOKEN can be set directly (pre-computed sha256 hex of ADMIN_PASSWORD)
  // to avoid hashing in Edge Runtime.
  if (process.env.ADMIN_TOKEN) return process.env.ADMIN_TOKEN;
  // Fallback matches FALLBACK_PASSWORD
  return FALLBACK_TOKEN;
}

export function requireAdmin(req: NextRequest): NextResponse | undefined {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const expected = computeToken(getAdminPassword());
  if (token !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
