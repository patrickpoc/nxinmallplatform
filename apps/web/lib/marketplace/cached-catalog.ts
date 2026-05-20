import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@nxinmall/database";
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

async function loadHomeRailsSerialized(): Promise<SerializableHomeRails> {
  const data = await fetchHomeRailsUncached();
  return serializeHomeRails(data);
}

const loadHomeRails = unstable_cache(loadHomeRailsSerialized, ["home-rails"], {
  revalidate: 120,
  tags: [CACHE_TAGS.homeRails],
});

export const getCachedHomeRails = cache(async (): Promise<HomeRailsData> => {
  const serialized = await loadHomeRails();
  return deserializeHomeRails(serialized);
});

function ratingsCacheKey(productIds: string[]): string {
  return [...productIds].sort().join(",");
}

async function loadProductRatingsRecord(
  productIds: string[],
): Promise<Record<string, ProductRatingAggregate>> {
  const map = await getProductRatingsBatch(productIds);
  return Object.fromEntries(map);
}

export const getCachedProductRatings = cache(
  async (productIds: string[]): Promise<Map<string, ProductRatingAggregate>> => {
    if (productIds.length === 0) return new Map();

    const key = ratingsCacheKey(productIds);
    const record = await unstable_cache(
      () => loadProductRatingsRecord(productIds),
      ["product-ratings", key],
      { revalidate: 180, tags: [CACHE_TAGS.ratings] },
    )();

    return new Map(Object.entries(record));
  },
);
