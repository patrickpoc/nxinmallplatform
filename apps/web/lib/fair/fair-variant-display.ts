import type { CartPriceCurrency } from "@/lib/cart/types";

export type FairVariantAttributes = {
  label?: string;
  imageUrl?: string;
  imageUrls?: string[];
  isStorefront?: boolean;
  cor?: string;
  color?: string;
};

export type FairVariantDisplayInput = {
  id: string;
  sku: string;
  priceAmount: number;
  priceCurrency: CartPriceCurrency;
  unit: string;
  stockQty: number;
  minOrderQty: number;
  attributes?: unknown;
};

export function parseFairVariantAttributes(attributes: unknown): FairVariantAttributes {
  if (!attributes || typeof attributes !== "object") return {};
  return attributes as FairVariantAttributes;
}

export function getFairVariantLabel(variant: Pick<FairVariantDisplayInput, "sku" | "attributes">): string {
  const attrs = parseFairVariantAttributes(variant.attributes);
  const label = attrs.label ?? attrs.cor ?? attrs.color;
  if (label && String(label).trim()) return String(label).trim();
  return variant.sku;
}

export function getFairVariantImageUrl(
  variant: Pick<FairVariantDisplayInput, "attributes">,
  fallbackGalleryUrl?: string,
): string | undefined {
  const attrs = parseFairVariantAttributes(variant.attributes);
  const url = attrs.imageUrl?.trim();
  if (url) return url;
  return fallbackGalleryUrl;
}

export function getSharedGalleryUrls(galleryImages: { url: string }[]): string[] {
  return galleryImages.map((img) => img.url).filter(Boolean);
}

export function getVariantImageUrls(variant: Pick<FairVariantDisplayInput, "attributes">): string[] {
  const attrs = parseFairVariantAttributes(variant.attributes);
  const urls: string[] = [];
  const primary = attrs.imageUrl?.trim();
  if (primary) urls.push(primary);
  for (const extra of attrs.imageUrls ?? []) {
    const url = extra?.trim();
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

export function buildFairDisplayGallery(
  variant: Pick<FairVariantDisplayInput, "attributes">,
  sharedUrls: string[],
): string[] {
  const variantUrls = getVariantImageUrls(variant);
  const merged = [...variantUrls];
  for (const url of sharedUrls) {
    if (url && !merged.includes(url)) merged.push(url);
  }
  return merged;
}

export function buildFairCartItemName(productName: string, variantLabel: string): string {
  if (!variantLabel || variantLabel === productName) return productName;
  return `${productName} — ${variantLabel}`;
}

export function fairVariantsUseOwnImages(variants: FairVariantDisplayInput[]): boolean {
  return variants.length > 1 && variants.some((v) => getVariantImageUrls(v).length > 0);
}

function getVariantMainImageUrl(
  variant: Pick<FairVariantDisplayInput, "attributes">,
): string | undefined {
  const attrs = parseFairVariantAttributes(variant.attributes);
  const url = attrs.imageUrl?.trim();
  return url || undefined;
}

export function getFairStorefrontImageUrl(
  variants: Pick<FairVariantDisplayInput, "attributes">[],
  galleryImages: { url: string; isPrimary?: boolean }[],
): string | undefined {
  if (variants.length > 1) {
    const flagged = variants.find((v) => parseFairVariantAttributes(v.attributes).isStorefront);
    const withImage = variants.find((v) => getVariantMainImageUrl(v));
    const candidate = flagged ?? withImage;
    const url = candidate ? getVariantMainImageUrl(candidate) : undefined;
    if (url) return url;
  }

  if (variants.length === 1) {
    const url = getVariantMainImageUrl(variants[0]!);
    if (url) return url;
  }

  const primary = galleryImages.find((i) => i.isPrimary) ?? galleryImages[0];
  return primary?.url;
}
