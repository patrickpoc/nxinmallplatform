import { prismaWrite } from "@nxinmall/database";

export type ProductReviewRow = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  locale: string;
  createdAt: Date;
};

export type ProductReviewSummary = {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: ProductReviewRow[];
};

export type ProductRatingAggregate = {
  average: number;
  count: number;
};

const EMPTY_DISTRIBUTION: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

function logReviewError(context: string, error: unknown) {
  console.error(`[product-reviews] ${context}`, error);
}

export async function getProductReviewSummary(
  productId: string,
  limit = 20,
): Promise<ProductReviewSummary> {
  const reviews = await prismaWrite.productReview.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      authorName: true,
      rating: true,
      body: true,
      locale: true,
      createdAt: true,
    },
  });

  const all = await prismaWrite.productReview.groupBy({
    by: ["rating"],
    where: { productId },
    _count: { rating: true },
  });

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { ...EMPTY_DISTRIBUTION };
  let count = 0;
  let sum = 0;
  for (const row of all) {
    const r = row.rating as 1 | 2 | 3 | 4 | 5;
    if (r >= 1 && r <= 5) {
      distribution[r] = row._count.rating;
      count += row._count.rating;
      sum += r * row._count.rating;
    }
  }

  return {
    average: count > 0 ? sum / count : 0,
    count,
    distribution,
    reviews: reviews.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      locale: r.locale,
      createdAt: r.createdAt,
    })),
  };
}

export async function getProductRatingsBatch(
  productIds: string[],
): Promise<Map<string, ProductRatingAggregate>> {
  const map = new Map<string, ProductRatingAggregate>();
  if (productIds.length === 0) {
    return map;
  }

  try {
    const rows = await prismaWrite.productReview.groupBy({
      by: ["productId"],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { _all: true },
    });

    for (const row of rows) {
      const count = row._count._all;
      const avg = row._avg.rating;
      if (count > 0 && avg != null) {
        map.set(row.productId, { average: avg, count });
      }
    }
  } catch (error) {
    logReviewError("getProductRatingsBatch failed", error);
    throw error;
  }

  return map;
}
