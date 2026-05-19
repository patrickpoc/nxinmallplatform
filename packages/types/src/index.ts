/** Shared API response envelope for REST `/api/v1/*`. */
export type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { page?: number; total?: number; limit?: number } | null;
};

export type LocaleCode = "en" | "pt" | "zh";

/** JSON object for multilingual user-generated fields (product name, etc.). */
export type MultilingualString = {
  en: string;
  pt: string;
  zh: string;
};
