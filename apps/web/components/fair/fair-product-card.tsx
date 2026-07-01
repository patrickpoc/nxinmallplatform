"use client";

import Image from "next/image";
import { ImageOff, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriceDisplay } from "@/components/brand/price-display";
import { FairAddToCartDialog } from "@/components/fair/fair-add-to-cart-dialog";
import type { CartPriceCurrency } from "@/lib/cart/types";

export type FairProductCardData = {
  id: string;
  name: string;
  imageUrl?: string;
  priceAmount: number;
  priceCurrency: CartPriceCurrency;
  variantId?: string;
  minOrderQty?: number;
  stockQty?: number;
};

type Props = {
  slug: string;
  product: FairProductCardData;
};

export function FairProductCard({ slug, product }: Props) {
  const t = useTranslations("fairBooth");
  const locale = useLocale();
  const { id, name, imageUrl, priceAmount, priceCurrency, variantId, minOrderQty, stockQty } = product;

  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-card">
      <Link href={`/feira/${slug}/produtos/${id}`} className="block">
        <div className="relative aspect-square border-b border-border bg-white">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-contain p-2 sm:p-3" sizes="(max-width: 640px) 50vw, 200px" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-gray">
              <ImageOff className="h-8 w-8 opacity-40" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 p-2.5 sm:p-3">
        <Link href={`/feira/${slug}/produtos/${id}`}>
          <p className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold text-brand-dark sm:min-h-10 sm:text-sm">{name}</p>
        </Link>
        <PriceDisplay
          amount={priceAmount}
          currency={priceCurrency}
          locale={locale}
          className="text-sm font-bold text-brand-blue"
        />
        {variantId ? (
          <FairAddToCartDialog
            item={{
              productId: id,
              variantId,
              name,
              imageUrl,
              priceAmount,
              priceCurrency,
              minOrderQty,
              stockQty,
            }}
            trigger={
              <Button size="sm" className="mt-auto w-full justify-center" onClick={(e) => e.stopPropagation()}>
                <ShoppingCart className="mr-1 h-4 w-4" />
                {t("addToCart")}
              </Button>
            }
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
