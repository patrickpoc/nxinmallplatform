"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ProductGallery } from "@/components/marketplace/product-gallery";
import { FairPurchaseCard } from "@/components/fair/fair-purchase-card";
import {
  buildFairCartItemName,
  fairVariantsUseOwnImages,
  getFairVariantImageUrl,
  getFairVariantLabel,
  type FairVariantDisplayInput,
} from "@/lib/fair/fair-variant-display";
import { cn } from "@/lib/utils";
import type { CartPriceCurrency } from "@/lib/cart/types";

export type FairProductDetailVariant = FairVariantDisplayInput;

type Props = {
  slug: string;
  productId: string;
  productName: string;
  galleryImages: { url: string }[];
  variants: FairProductDetailVariant[];
  booth: {
    quotationUrl?: string | null;
    whatsappNumber?: string | null;
    phone?: string | null;
  };
};

export function FairProductDetailClient({
  slug,
  productId,
  productName,
  galleryImages,
  variants,
  booth,
}: Props) {
  const t = useTranslations("fairBooth");
  const locale = useLocale();

  const sortedVariants = useMemo(
    () => [...variants].sort((a, b) => a.priceAmount - b.priceAmount),
    [variants],
  );

  const [selectedVariantId, setSelectedVariantId] = useState(sortedVariants[0]?.id ?? "");
  const selectedVariant =
    sortedVariants.find((v) => v.id === selectedVariantId) ?? sortedVariants[0] ?? null;

  const useVariantImages = fairVariantsUseOwnImages(sortedVariants);
  const fallbackGalleryUrl = galleryImages[0]?.url;

  const displayImages = useMemo(() => {
    if (useVariantImages && selectedVariant) {
      const url = getFairVariantImageUrl(selectedVariant, fallbackGalleryUrl);
      return url ? [{ url }] : [];
    }
    return galleryImages;
  }, [useVariantImages, selectedVariant, fallbackGalleryUrl, galleryImages]);

  const [galleryIndex, setGalleryIndex] = useState(0);

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    setGalleryIndex(0);
  }

  if (!selectedVariant) {
    return null;
  }

  const selectedLabel = getFairVariantLabel(selectedVariant);

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <ProductGallery
          images={displayImages}
          alt={productName}
          index={galleryIndex}
          onIndexChange={setGalleryIndex}
        />
        {useVariantImages ? (
          <div className="flex flex-wrap gap-2">
            {sortedVariants.map((variant) => {
              const label = getFairVariantLabel(variant);
              const imageUrl = getFairVariantImageUrl(variant, fallbackGalleryUrl);
              const isSelected = variant.id === selectedVariant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant.id)}
                  className={cn(
                    "flex min-w-[4.5rem] flex-col items-center gap-1 rounded-lg border p-1.5 text-center transition-colors",
                    isSelected
                      ? "border-brand-blue ring-2 ring-brand-blue/20"
                      : "border-border hover:border-brand-gray/50",
                  )}
                  aria-pressed={isSelected}
                >
                  {imageUrl ? (
                    <span className="relative block h-14 w-14 overflow-hidden rounded-md bg-white">
                      <Image
                        src={imageUrl}
                        alt=""
                        fill
                        className="object-contain p-0.5"
                        sizes="56px"
                        unoptimized
                      />
                    </span>
                  ) : null}
                  <span className="max-w-[5.5rem] truncate text-xs font-medium text-brand-dark">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <FairPurchaseCard
        productId={productId}
        productName={productName}
        locale={locale}
        variants={sortedVariants}
        selectedVariantId={selectedVariant.id}
        onVariantChange={selectVariant}
        showVariantPicker={!useVariantImages && sortedVariants.length > 1}
        booth={booth}
        labels={{
          price: t("price"),
          addToCart: t("addToCart"),
          askQuotation: t("askQuotation"),
          askQuotationUnavailable: t("askQuotationUnavailable"),
          quantity: t("quantity"),
          variant: t("variant"),
          sku: t("sku"),
          unit: t("unitLabel"),
          stock: t("stock"),
          minOrder: t("minOrder"),
          purchaseInfoTitle: t("purchaseInfoTitle"),
          purchaseInfoBody: t("purchaseInfoBody"),
        }}
      />
    </div>
  );
}
