/** Application locale codes aligned with next-intl routing. */
export const LOCALES = ["en", "pt", "zh"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "en";

/** Seeded demo seller — admin CRUD attaches products to this user only. */
export const DEMO_PLATFORM_SELLER_EMAIL = "demo-seller@nxinmall.local" as const;

/** Fair vendor product form: select value to create a booth-local category. */
export const FAIR_NEW_CATEGORY_ID = "__new__" as const;

/** User roles in the marketplace. */
export const UserRole = {
  BUYER: "BUYER",
  SELLER: "SELLER",
  ADMIN: "ADMIN",
  FAIR_VENDOR: "FAIR_VENDOR",
} as const;
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

/** Company verification lifecycle. */
export const CompanyVerificationStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

/** Seller verification tier (Phase 5); stored on company or user extension. */
export const VerificationTier = {
  UNVERIFIED: "UNVERIFIED",
  BASIC: "BASIC",
  VERIFIED: "VERIFIED",
  PREMIUM: "PREMIUM",
} as const;

/** Landing page / catalog category showcase (seed + UI). */
export type ShowcaseCategory = {
  id: string;
  slug: string;
  icon: "leaf" | "tractor" | "seed" | "feed" | "cpu" | "wrench";
  /** Suffix under `categories.*` in next-intl message files. */
  messageSuffix: "agriInputs" | "equipment" | "seeds" | "feed" | "technology" | "services";
};

export const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  { id: "1", slug: "agri-inputs", icon: "leaf", messageSuffix: "agriInputs" },
  { id: "2", slug: "equipment", icon: "tractor", messageSuffix: "equipment" },
  { id: "3", slug: "seeds", icon: "seed", messageSuffix: "seeds" },
  { id: "4", slug: "feed", icon: "feed", messageSuffix: "feed" },
  { id: "5", slug: "technology", icon: "cpu", messageSuffix: "technology" },
  { id: "6", slug: "services", icon: "wrench", messageSuffix: "services" },
];
