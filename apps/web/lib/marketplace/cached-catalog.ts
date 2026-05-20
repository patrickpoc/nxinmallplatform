import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@nxinmall/database";
export type PublicHeaderCategory = {
  id: string;
  slug: string;
  name: unknown;
  children?: { id: string; slug: string; name: unknown }[];
};
import {
  getProductRatingsBatch,
  type ProductRatingAggregate,
} from "@/lib/marketplace/product-reviews";
import { fetchHomeRailsUncached, type HomeRailsData } from "@/lib/marketplace/home-rails";
import { CACHE_TAGS } from "@/lib/marketplace/cache-tags";

const loadHeaderCategories = unstable_cache(
  async (): Promise<PublicHeaderCategory[]> => {
    try {
      return await prisma.category.findMany({
        where: { parentId: null },
        orderBy: { slug: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          children: {
            select: { id: true, slug: true, name: true },
            orderBy: { slug: "asc" },
          },
        },
      });
    } catch {
      return [];
    }
  },
  ["header-categories"],
  { revalidate: 300, tags: [CACHE_TAGS.categories] },
);

/** Cross-request cache (5 min) + per-request dedupe for layout + home. */
export const getCachedHeaderCategories = cache(async () => loadHeaderCategories());

const loadHomeRails = unstable_cache(fetchHomeRailsUncached, ["home-rails"], {
  revalidate: 120,
  tags: [CACHE_TAGS.homeRails],
});

export const getCachedHomeRails = cache(async (): Promise<HomeRailsData> => loadHomeRails());

function ratingsCacheKey(productIds: string[]): string {
  return [...productIds].sort().join(",");
}

export const getCachedProductRatings = cache(
  async (productIds: string[]): Promise<Map<string, ProductRatingAggregate>> => {
    if (productIds.length === 0) return new Map();

    const key = ratingsCacheKey(productIds);
    const loader = unstable_cache(
      async () => getProductRatingsBatch(productIds),
      ["product-ratings", key],
      { revalidate: 180, tags: [CACHE_TAGS.ratings] },
    );

    return loader();
  },
);
