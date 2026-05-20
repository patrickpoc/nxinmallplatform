import { revalidateCatalogCache } from "@/lib/marketplace/revalidate-catalog";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/catalog/revalidate?secret=...
 * Invalidates home rails, categories, and product rating caches.
 * Call after db:seed:reviews in production (set CATALOG_REVALIDATE_SECRET on Vercel).
 */
export async function POST(request: Request) {
  const secret = process.env.CATALOG_REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "revalidate_not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const provided = url.searchParams.get("secret") ?? request.headers.get("x-revalidate-secret");
  if (provided !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  revalidateCatalogCache();
  return NextResponse.json({ ok: true, revalidated: ["categories", "homeRails", "ratings"] });
}
