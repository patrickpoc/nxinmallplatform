import { prisma } from "@nxinmall/database";
import { productListInclude, type ProductListRow } from "@/lib/product-listing";

const RAIL_SIZE = 12;

async function fetchProductsByIds(ids: string[]): Promise<ProductListRow[]> {
  if (ids.length === 0) return [];
  try {
    const rows = await prisma.product.findMany({
      where: { id: { in: ids }, status: "ACTIVE" },
      include: productListInclude,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter((r): r is ProductListRow => r != null);
  } catch {
    return [];
  }
}

/** Top sellers: order volume when present, else review count as popularity proxy. */
export async function fetchTopSellerProducts(): Promise<ProductListRow[]> {
  const ids: string[] = [];

  try {
    const grouped = await prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: RAIL_SIZE * 4,
    });

    if (grouped.length > 0) {
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: grouped.map((g) => g.variantId) } },
        select: { id: true, productId: true },
      });
      const variantToProduct = new Map(variants.map((v) => [v.id, v.productId]));
      const seen = new Set<string>();
      for (const row of grouped) {
        const productId = variantToProduct.get(row.variantId);
        if (!productId || seen.has(productId)) continue;
        seen.add(productId);
        ids.push(productId);
        if (ids.length >= RAIL_SIZE) break;
      }
    }
  } catch {
    // fall through to review-based ranking
  }

  if (ids.length < RAIL_SIZE) {
    try {
      const reviewRank = await prisma.productReview.groupBy({
        by: ["productId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: RAIL_SIZE * 2,
      });
      const seen = new Set(ids);
      for (const row of reviewRank) {
        if (seen.has(row.productId)) continue;
        seen.add(row.productId);
        ids.push(row.productId);
        if (ids.length >= RAIL_SIZE) break;
      }
    } catch {
      // ignore
    }
  }

  if (ids.length > 0) {
    const ranked = await fetchProductsByIds(ids.slice(0, RAIL_SIZE));
    if (ranked.length > 0) return ranked;
  }

  try {
    return await prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: RAIL_SIZE,
      orderBy: { updatedAt: "desc" },
      include: productListInclude,
    });
  } catch {
    return [];
  }
}

export async function fetchSponsoredProducts(): Promise<ProductListRow[]> {
  try {
    const sponsored = await prisma.product.findMany({
      where: { status: "ACTIVE", isSponsored: true },
      take: RAIL_SIZE,
      orderBy: [{ sponsoredSortOrder: "asc" }, { createdAt: "desc" }],
      include: productListInclude,
    });
    if (sponsored.length > 0) return sponsored;
  } catch {
    // isSponsored column may be missing before db push
  }

  try {
    return await prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: RAIL_SIZE,
      skip: 6,
      orderBy: { createdAt: "desc" },
      include: productListInclude,
    });
  } catch {
    return [];
  }
}

export async function fetchRecentlyAddedProducts(): Promise<ProductListRow[]> {
  try {
    return await prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: RAIL_SIZE,
      orderBy: { createdAt: "desc" },
      include: productListInclude,
    });
  } catch {
    return [];
  }
}
