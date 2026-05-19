import type { ApiEnvelope } from "@nxinmall/types";

/** Builds a successful JSON envelope for REST responses. */
export function ok<T>(data: T, meta: ApiEnvelope<T>["meta"] = null): ApiEnvelope<T> {
  return { success: true, data, error: null, meta };
}

/** Builds an error JSON envelope with optional HTTP mapping via `code`. */
export function fail<T = null>(
  code: string,
  message: string,
  meta: ApiEnvelope<null>["meta"] = null,
): ApiEnvelope<T> {
  return { success: false, data: null, error: { code, message }, meta };
}
