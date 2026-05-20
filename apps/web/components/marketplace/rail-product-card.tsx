"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ToggleWishlistButton } from "@/components/wishlist/toggle-wishlist-button";
import { PriceDisplay } from "@/components/brand/price-display";
import { ProductRatingMini } from "@/components/marketplace/product-rating-mini";
import type { CartPriceCurrency } from "@/lib/cart/types";

export type RailProductCardData = {
  id: string;
  name: string;
  imageUrl?: string;
  priceAmount: number;
  priceCurrency: CartPriceCurrency;
  variantId?: string;
  unit?: string;
  ratingAverage?: number;
  reviewCount?: number;
  isSponsored?: boolean;
};

export function RailProductCard({
  product,
  sponsoredBadgeLabel,
}: {
  product: RailProductCardData;
  sponsoredBadgeLabel?: string;
}) {
  const t = useTranslations("product");
  const locale = useLocale();
  const { id, name, imageUrl, priceAmount, priceCurrency, variantId, unit, ratingAverage, reviewCount, isSponsored } =
    product;
  const showSponsoredBadge = isSponsored && sponsoredBadgeLabel;

  return (
    <div className="w-[min(85vw,240px)] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md sm:w-[240px]">
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-[4/3] bg-white">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain p-3"
              sizes="240px"
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-brand-gray">
              <ImageOff className="h-6 w-6 opacity-40" aria-hidden />
              <span className="text-xs">{t("noImage")}</span>
            </div>
          )}
          {showSponsoredBadge ? (
            <span className="absolute right-2 top-2 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              {sponsoredBadgeLabel}
            </span>
          ) : null}
          <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)]">
            <ProductRatingMini
              average={ratingAverage}
              reviewCount={reviewCount ?? 0}
              variant="overlay"
            />
          </div>
        </div>
      </Link>
      <div className="space-y-2 border-t border-border p-3">
        <Link href={`/products/${id}`} className="block">
          <p className="line-clamp-2 text-sm font-semibold text-brand-dark hover:text-brand-blue">{name}</p>
        </Link>
        <p className="text-sm font-semibold text-brand-dark">
          <PriceDisplay amount={priceAmount} currency={priceCurrency} locale={locale} className="text-sm font-semibold" />
        </p>
        <div className="flex items-center justify-end gap-1">
          <ToggleWishlistButton
            size="icon"
            item={{ productId: id, name, imageUrl, priceAmount, priceCurrency }}
            className="h-8 w-8"
          />
          {variantId ? (
            <AddToCartButton
              iconOnly
              variant="outline"
              item={{ productId: id, variantId, name, imageUrl, priceAmount, priceCurrency, unit }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
