import { prisma, prismaWrite } from "@nxinmall/database";
import { productListInclude, type ProductListRow } from "@/lib/product-listing";

const RAIL_SIZE = 12;

export type HomeRailsData = {
  topSellers: ProductListRow[];
  sponsored: ProductListRow[];
  recentlyAdded: ProductListRow[];
};

/** Load ACTIVE products by id (direct connection — avoids pooler failures after login). */
async function fetchActiveProductsByIds(ids: string[]): Promise<ProductListRow[]> {
  if (ids.length === 0) return [];
  try {
    const rows = await prismaWrite.product.findMany({
      where: { id: { in: ids }, status: "ACTIVE" },
      include: productListInclude,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter((r): r is ProductListRow => r != null);
  } catch (error) {
    console.error("[home-rails] fetchActiveProductsByIds failed", error);
    return [];
  }
}

async function fetchTopSellerFallback(): Promise<ProductListRow[]> {
  try {
    return await prismaWrite.product.findMany({
      where: { status: "ACTIVE" },
      take: RAIL_SIZE,
      orderBy: { updatedAt: "desc" },
      include: productListInclude,
    });
  } catch (error) {
    console.error("[home-rails] top sellers fallback findMany failed", error);
    return [];
  }
}

async function fetchTopSellerProducts(): Promise<ProductListRow[]> {
  try {
    const reviewRank = await prismaWrite.productReview.groupBy({
      by: ["productId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: RAIL_SIZE,
    });
    if (reviewRank.length > 0) {
      const ranked = await fetchActiveProductsByIds(reviewRank.map((r) => r.productId));
      if (ranked.length > 0) return ranked;
      console.warn(
        "[home-rails] review rank returned",
        reviewRank.length,
        "product id(s) but none resolved as ACTIVE; using fallback",
      );
    }
  } catch (error) {
    console.error("[home-rails] top sellers review rank failed", error);
  }

  return fetchTopSellerFallback();
}

async function fetchSponsoredProducts(): Promise<ProductListRow[]> {
  try {
    const sponsored = await prisma.product.findMany({
      where: { status: "ACTIVE", isSponsored: true },
      take: RAIL_SIZE,
      orderBy: [{ sponsoredSortOrder: "asc" }, { createdAt: "desc" }],
      include: productListInclude,
    });
    if (sponsored.length > 0) return sponsored;
  } catch {
    // isSponsored may be missing before migration
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

async function fetchRecentlyAddedProducts(): Promise<ProductListRow[]> {
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

/** Uncached loader; use getCachedHomeRails() in pages. */
export async function fetchHomeRailsUncached(): Promise<HomeRailsData> {
  const [topSellers, sponsored, recentlyAdded] = await Promise.all([
    fetchTopSellerProducts(),
    fetchSponsoredProducts(),
    fetchRecentlyAddedProducts(),
  ]);
  return { topSellers, sponsored, recentlyAdded };
}
