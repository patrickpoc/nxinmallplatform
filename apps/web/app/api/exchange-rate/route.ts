import { NextResponse } from "next/server";

/**
 * Proxies exchange rates with Next.js ISR-style caching (1h) to avoid client CORS
 * and to centralize the upstream provider for Brazilian BRL conversion rules.
 */
export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`Upstream ${res.status}`);
    }
    const json = (await res.json()) as { rates?: Record<string, number> };
    const brl = json.rates?.BRL ?? 5;
    return NextResponse.json({
      rates: { USD: 1, BRL: brl },
      fetchedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ rates: { USD: 1, BRL: 5 }, fetchedAt: new Date().toISOString(), fallback: true });
  }
}
