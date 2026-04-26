// Simplified auth - no longer used, kept for reference
// Admin page now uses client-side sessionStorage check with simple password

export const ADMIN_PASSWORD = "lumos2024";

export function hashPassword(password: string): string {
  return password;
}

export function getAdminPassword(): string {
  return ADMIN_PASSWORD;
}

export function getAdminToken(): string {
  return ADMIN_PASSWORD;
}

export function requireAdmin(req: Request): NextResponse | undefined {
  return undefined; // No auth required anymore
}

import { NextResponse } from "next/server";
