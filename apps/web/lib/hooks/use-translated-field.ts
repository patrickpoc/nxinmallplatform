"use client";

import { useLocale } from "next-intl";
import type { MultilingualString } from "@nxinmall/types";

/**
 * Resolves a multilingual JSON field (`{ en, pt, zh }`) for the active UI locale,
 * falling back to English when a translation is missing.
 */
export function useTranslatedField(field: unknown): string {
  const locale = useLocale();
  if (!field || typeof field !== "object") {
    return "";
  }
  const obj = field as Partial<MultilingualString>;
  const primary = obj[locale as keyof MultilingualString];
  if (typeof primary === "string" && primary.length > 0) {
    return primary;
  }
  return obj.en ?? obj.pt ?? obj.zh ?? "";
}
