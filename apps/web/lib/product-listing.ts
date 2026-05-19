import type { Prisma } from "@nxinmall/database";

export const productListInclude = {
  category: { select: { slug: true } },
  images: { where: { isPrimary: true }, take: 1 },
  // Variants are currently 1-per-product in demo flows. Keep deterministic ordering without
  // accidentally prioritizing BRL variants (which used to have priceUsd=0 for back-compat).
  variants: { take: 1, orderBy: { id: "desc" as const } },
  seller: { select: { company: { select: { country: true } } } },
} satisfies Prisma.ProductInclude;

export type ProductListRow = Prisma.ProductGetPayload<{ include: typeof productListInclude }>;

/** ILIKE-style search on multilingual JSON name (en / pt / zh). */
export function productNameContainsWhere(term: string): Prisma.ProductWhereInput {
  const q = term.trim();
  if (!q) return {};
  return {
    OR: [
      { name: { path: ["en"], string_contains: q, mode: "insensitive" } },
      { name: { path: ["pt"], string_contains: q, mode: "insensitive" } },
      { name: { path: ["zh"], string_contains: q, mode: "insensitive" } },
    ],
  };
}
