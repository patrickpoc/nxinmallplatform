"use client";

import Image from "next/image";
import { ImageOff, ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriceDisplay } from "@/components/brand/price-display";
import { useFairCart } from "@/lib/fair/fair-cart-context";
import type { CartPriceCurrency } from "@/lib/cart/types";

export type FairProductCardData = {
  id: string;
  name: string;
  imageUrl?: string;
  priceAmount: number;
  priceCurrency: CartPriceCurrency;
  variantId?: string;
};

type Props = {
  slug: string;
  product: FairProductCardData;
};

export function FairProductCard({ slug, product }: Props) {
  const t = useTranslations("fairBooth");
  const locale = useLocale();
  const { addItem } = useFairCart();
  const { id, name, imageUrl, priceAmount, priceCurrency, variantId } = product;

  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-card">
      <Link href={`/feira/${slug}/produtos/${id}`} className="block">
        <div className="relative aspect-square border-b border-border bg-white">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-contain p-3" sizes="200px" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-gray">
              <ImageOff className="h-8 w-8 opacity-40" />
            </div>
          )}
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/feira/${slug}/produtos/${id}`}>
          <p className="line-clamp-2 min-h-10 text-sm font-semibold text-brand-dark">{name}</p>
        </Link>
        <p className="text-sm font-bold text-brand-blue">
          <PriceDisplay amount={priceAmount} currency={priceCurrency} locale={locale} />
        </p>
        {variantId ? (
          <Button
            size="sm"
            className="mt-auto w-full justify-center"
            onClick={() =>
              addItem({
                productId: id,
                variantId,
                name,
                imageUrl,
                priceAmount,
                priceCurrency,
              })
            }
          >
            <ShoppingCart className="mr-1 h-4 w-4" />
            {t("addToCart")}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
