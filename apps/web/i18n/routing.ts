import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

/** Supported UI locales; default is English. */
export const routing = defineRouting({
  locales: ["en", "pt", "zh"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
