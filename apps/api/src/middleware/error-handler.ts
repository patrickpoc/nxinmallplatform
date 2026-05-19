import type { Context } from "hono";
import { fail } from "../lib/envelope.js";

/**
 * Central Hono error handler: always returns the platform JSON envelope
 * so clients never parse raw exception strings.
 */
export function onError(err: Error, c: Context) {
  console.error(err);
  const body = fail("INTERNAL_ERROR", err.message || "Unexpected error");
  return c.json(body, 500);
}
