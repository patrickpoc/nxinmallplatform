import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma, prismaWrite } from "@nxinmall/database";
import {
  getProductRatingsBatch,
  type ProductRatingAggregate,
} from "@/lib/marketplace/product-reviews";
import { fetchHomeRailsUncached, type HomeRailsData } from "@/lib/marketplace/home-rails";
import type { ProductListRow } from "@/lib/product-listing";
import { CACHE_TAGS } from "@/lib/marketplace/cache-tags";

export type PublicHeaderCategory = {
  id: string;
  slug: string;
  name: unknown;
  children?: { id: string; slug: string; name: unknown }[];
};

/** JSON-safe product row for unstable_cache (Prisma Decimal is not serializable). */
type SerializableProductListRow = {
  id: string;
  name: unknown;
  description: unknown;
  status: string;
  sellerId: string;
  categoryId: string;
  isSponsored: boolean;
  sponsoredSortOrder: number | null;
  createdAt: string;
  updatedAt: string;
  category: { slug: string };
  images: { id: string; url: string; isPrimary: boolean; sortOrder: number }[];
  variants: {
    id: string;
    sku: string;
    priceUsd: number;
    priceAmount: number;
    priceCurrency: string;
    minOrderQty: number;
    unit: string;
    stockQty: number;
  }[];
  seller: { company: { country: string | null } | null };
};

type SerializableHomeRails = {
  topSellers: SerializableProductListRow[];
  sponsored: SerializableProductListRow[];
  recentlyAdded: SerializableProductListRow[];
};

function serializeProductRow(row: ProductListRow): SerializableProductListRow {
  const v = row.variants[0];
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    sellerId: row.sellerId,
    categoryId: row.categoryId,
    isSponsored: row.isSponsored,
    sponsoredSortOrder: row.sponsoredSortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    category: row.category,
    images: row.images.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })),
    variants: row.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      priceUsd: Number(variant.priceUsd),
      priceAmount: Number(variant.priceAmount),
      priceCurrency: variant.priceCurrency,
      minOrderQty: variant.minOrderQty,
      unit: variant.unit,
      stockQty: variant.stockQty,
    })),
    seller: row.seller,
  };
}

function deserializeProductRow(row: SerializableProductListRow): ProductListRow {
  return row as unknown as ProductListRow;
}

function serializeHomeRails(data: HomeRailsData): SerializableHomeRails {
  return {
    topSellers: data.topSellers.map(serializeProductRow),
    sponsored: data.sponsored.map(serializeProductRow),
    recentlyAdded: data.recentlyAdded.map(serializeProductRow),
  };
}

function deserializeHomeRails(data: SerializableHomeRails): HomeRailsData {
  return {
    topSellers: data.topSellers.map(deserializeProductRow),
    sponsored: data.sponsored.map(deserializeProductRow),
    recentlyAdded: data.recentlyAdded.map(deserializeProductRow),
  };
}

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

/** Thrown inside unstable_cache loader to avoid caching empty topSellers when catalog has products. */
class SkipHomeRailsCacheError extends Error {
  constructor() {
    super("skip-home-rails-cache");
    this.name = "SkipHomeRailsCacheError";
  }
}

async function homeRailsLooksSuspiciouslyEmpty(data: HomeRailsData): Promise<boolean> {
  if (data.topSellers.length > 0) return false;
  if (data.sponsored.length > 0) return true;
  try {
    const activeCount = await prismaWrite.product.count({ where: { status: "ACTIVE" } });
    return activeCount > 0;
  } catch {
    return false;
  }
}

async function loadHomeRailsSerialized(): Promise<SerializableHomeRails> {
  const data = await fetchHomeRailsUncached();
  if (await homeRailsLooksSuspiciouslyEmpty(data)) {
    throw new SkipHomeRailsCacheError();
  }
  return serializeHomeRails(data);
}

async function loadHomeRailsFresh(): Promise<HomeRailsData> {
  return fetchHomeRailsUncached();
}

const loadHomeRails = unstable_cache(loadHomeRailsSerialized, ["home-rails"], {
  revalidate: 120,
  tags: [CACHE_TAGS.homeRails],
});

export const getCachedHomeRails = cache(async (): Promise<HomeRailsData> => {
  try {
    const serialized = await loadHomeRails();
    const data = deserializeHomeRails(serialized);
    if (await homeRailsLooksSuspiciouslyEmpty(data)) {
      return loadHomeRailsFresh();
    }
    return data;
  } catch (error) {
    if (error instanceof SkipHomeRailsCacheError) {
      return loadHomeRailsFresh();
    }
    console.error("[cached-catalog] home-rails cache load failed", error);
    return loadHomeRailsFresh();
  }
});

function ratingsCacheKey(productIds: string[]): string {
  return [...productIds].sort().join(",");
}

/** Thrown inside unstable_cache loader to avoid caching empty ratings when DB has reviews. */
class SkipRatingsCacheError extends Error {
  constructor() {
    super("skip-ratings-cache");
    this.name = "SkipRatingsCacheError";
  }
}

async function loadProductRatingsRecord(
  productIds: string[],
): Promise<Record<string, ProductRatingAggregate>> {
  const map = await getProductRatingsBatch(productIds);
  const record = Object.fromEntries(map);
  if (productIds.length > 0 && Object.keys(record).length === 0) {
    const total = await prismaWrite.productReview.count();
    if (total > 0) {
      throw new SkipRatingsCacheError();
    }
  }
  return record;
}

async function loadProductRatingsFresh(
  productIds: string[],
): Promise<Map<string, ProductRatingAggregate>> {
  try {
    const map = await getProductRatingsBatch(productIds);
    return map;
  } catch (error) {
    console.error("[cached-catalog] product-ratings fresh load failed", error);
    return new Map();
  }
}

export const getCachedProductRatings = cache(
  async (productIds: string[]): Promise<Map<string, ProductRatingAggregate>> => {
    if (productIds.length === 0) return new Map();

    const key = ratingsCacheKey(productIds);

    try {
      const record = await unstable_cache(
        () => loadProductRatingsRecord(productIds),
        ["product-ratings", key],
        { revalidate: 180, tags: [CACHE_TAGS.ratings] },
      )();

      if (productIds.length > 0 && Object.keys(record).length === 0) {
        const total = await prismaWrite.productReview.count();
        if (total > 0) {
          return loadProductRatingsFresh(productIds);
        }
      }

      return new Map(Object.entries(record));
    } catch (error) {
      if (error instanceof SkipRatingsCacheError) {
        return loadProductRatingsFresh(productIds);
      }
      console.error("[cached-catalog] product-ratings cache load failed", error);
      return loadProductRatingsFresh(productIds);
    }
  },
);
