import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cookies } from "next/headers";

export type Locale = "en" | "zh";

const COOKIE_NAME = "NEXT_LOCALE";
const DEFAULT_LOCALE: Locale = "zh";

interface LocaleContextValue {
  locale: Locale;
  toggleLocale: () => void;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  toggleLocale: () => {},
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from cookie on client mount
    const stored = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1] as Locale | undefined;

    if (stored === "en" || stored === "zh") {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${COOKIE_NAME}=${l}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "zh" : "en");
  }, [locale, setLocale]);

  // Avoid hydration mismatch — render children only after mount
  return (
    <LocaleContext.Provider value={{ locale, toggleLocale, setLocale }}>
      {mounted ? children : <>{children}</>}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

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

export const LOCALE_COOKIE = COOKIE_NAME;
export { DEFAULT_LOCALE };
