"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { PriceDisplay } from "@/components/brand/price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { useWishlist } from "@/lib/wishlist/wishlist-context";

export function WishlistPageClient() {
  const t = useTranslations("wishlist");
  const locale = useLocale();
  const { items, removeItem } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-16 md:px-6">
        <h1 className="heading-page">{t("title")}</h1>
        <p className="text-brand-gray">{t("empty")}</p>
        <Button asChild variant="outline">
          <Link href="/products">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-16 md:px-6">
      <h1 className="heading-page">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-2" data-demo-target="wishlist-list">
        {items.map((item) => (
          <Card key={item.productId} className="shadow-card">
            <CardContent className="flex gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill className="object-contain p-2" sizes="80px" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-brand-gray">—</div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Link href={`/products/${item.productId}`} className="font-semibold text-brand-dark hover:text-brand-blue">
                  {item.name}
                </Link>
                <p className="text-sm">
                  <PriceDisplay amount={item.priceAmount} currency={item.priceCurrency} locale={locale} className="text-sm font-semibold" />
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/products/${item.productId}`}>{t("viewProduct")}</Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-error" onClick={() => removeItem(item.productId)}>
                    {t("remove")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
