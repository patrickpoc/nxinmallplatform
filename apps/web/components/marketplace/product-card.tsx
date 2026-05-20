"use client";

import Image from "next/image";
import { ImageOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ToggleWishlistButton } from "@/components/wishlist/toggle-wishlist-button";
import { PriceDisplay } from "@/components/brand/price-display";
import { ProductRatingMini } from "@/components/marketplace/product-rating-mini";
import { Card, CardContent } from "@/components/ui/card";
import type { CartPriceCurrency } from "@/lib/cart/types";

export type ProductCardData = {
  id: string;
  name: string;
  imageUrl?: string;
  priceAmount: number;
  priceCurrency: CartPriceCurrency;
  variantId?: string;
  unit?: string;
  ratingAverage?: number;
  reviewCount?: number;
};

type ProductCardProps = {
  product: ProductCardData;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const t = useTranslations("productsPage");
  const tp = useTranslations("product");
  const locale = useLocale();

  const { id, name, imageUrl, priceAmount, priceCurrency, variantId, unit, ratingAverage, reviewCount } = product;

  return (
    <Card className={`group h-full overflow-hidden shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className ?? ""}`}>
      <Link href={`/products/${id}`} className="block">
        <div className="relative aspect-[4/3] border-b border-border bg-white">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-brand-gray">
              <ImageOff className="h-8 w-8 opacity-40" aria-hidden />
              <span className="text-xs">{tp("noImage")}</span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)]">
            <ProductRatingMini
              average={ratingAverage}
              reviewCount={reviewCount ?? 0}
              variant="overlay"
            />
          </div>
        </div>
      </Link>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${id}`} className="block min-w-0">
            <p className="line-clamp-2 text-sm font-semibold text-brand-dark group-hover:text-brand-blue">
              {name}
            </p>
          </Link>
          <ToggleWishlistButton
            item={{ productId: id, name, imageUrl, priceAmount, priceCurrency }}
          />
        </div>
        <p className="text-sm text-brand-gray">
          <PriceDisplay amount={priceAmount} currency={priceCurrency} locale={locale} />
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/products/${id}`} className="text-sm font-medium text-brand-blue hover:underline">
            {t("view")}
          </Link>
          {variantId ? (
            <AddToCartButton
              iconOnly
              variant="outline"
              item={{
                productId: id,
                variantId,
                name,
                imageUrl,
                priceAmount,
                priceCurrency,
                unit,
              }}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
