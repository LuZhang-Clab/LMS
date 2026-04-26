import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const validLocales = ["en", "zh"] as const;
  const resolved: string = validLocales.includes(locale as "en" | "zh")
    ? (locale as "en" | "zh")
    : "en";

  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default,
  };
});
