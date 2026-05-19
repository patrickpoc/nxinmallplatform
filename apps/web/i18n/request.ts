import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * Loads message catalogs per request locale for next-intl.
 * Used by next-intl plugin in next.config.mjs.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    timeZone: "America/Sao_Paulo",
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
