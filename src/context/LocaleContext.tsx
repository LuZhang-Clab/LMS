// Server-side locale helpers only — safe to import in Server Components
import { cookies } from "next/headers";

export type Locale = "en" | "zh";

const COOKIE_NAME = "NEXT_LOCALE";
export const DEFAULT_LOCALE: Locale = "zh";
export const LOCALE_COOKIE = COOKIE_NAME;

// Server-side helper: read locale from cookies (call in Server Components)
export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const val = cookieStore.get(COOKIE_NAME)?.value;
    if (val === "en" || val === "zh") return val;
  } catch {
    // cookies() not available in edge runtime
  }
  return DEFAULT_LOCALE;
}
