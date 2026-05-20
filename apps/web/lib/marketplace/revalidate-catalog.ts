import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/marketplace/cache-tags";

/** Invalidate catalog, home rails, and rating aggregates after product mutations. */
export function revalidateCatalogCache() {
  revalidateTag(CACHE_TAGS.categories);
  revalidateTag(CACHE_TAGS.homeRails);
  revalidateTag(CACHE_TAGS.ratings);
}
