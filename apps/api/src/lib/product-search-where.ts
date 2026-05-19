import type { Prisma } from "@nxinmall/database";

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
