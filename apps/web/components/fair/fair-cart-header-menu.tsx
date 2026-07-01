"use client";

import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { PriceDisplay } from "@/components/brand/price-display";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/routing";
import { useFairCart } from "@/lib/fair/fair-cart-context";

type Props = {
  slug: string;
};

export function FairCartHeaderMenu({ slug }: Props) {
  const t = useTranslations("fairBooth");
  const locale = useLocale();
  const { lines, itemCount, updateQuantity, removeLine } = useFairCart();
  const [open, setOpen] = useState(false);

  const subtotal = lines.reduce((sum, line) => sum + line.priceAmount * line.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="relative shrink-0"
        aria-label={t("cart")}
        onClick={() => setOpen(true)}
      >
        <ShoppingCart className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">
          {t("cart")} {itemCount > 0 ? `(${itemCount})` : ""}
        </span>
        {itemCount > 0 ? (
          <>
            <Badge
              variant="default"
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center px-1 text-[10px] sm:hidden"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </Badge>
          </>
        ) : null}
      </Button>
      <DialogContent className="max-h-[80dvh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>{t("cartPreviewTitle")}</DialogTitle>
          <DialogDescription>{t("cartPreviewHint")}</DialogDescription>
        </DialogHeader>
        {lines.length === 0 ? (
          <p className="text-sm text-brand-gray">{t("emptyCart")}</p>
        ) : (
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.lineId} className="flex gap-3 rounded-lg border border-border p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-white">
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-brand-gray">—</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Link
                    href={`/feira/${slug}/produtos/${line.productId}`}
                    className="line-clamp-2 text-sm font-medium text-brand-dark hover:text-brand-blue"
                    onClick={() => setOpen(false)}
                  >
                    {line.name}
                  </Link>
                  <QuantitySelector
                    value={line.quantity}
                    onChange={(qty) => updateQuantity(line.lineId, qty)}
                    compact
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-brand-dark">
                      <PriceDisplay
                        amount={line.priceAmount * line.quantity}
                        currency={line.priceCurrency}
                        locale={locale}
                        className="text-sm font-semibold"
                      />
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-0 text-xs text-destructive"
                      onClick={() => removeLine(line.lineId)}
                    >
                      {t("removeFromCart")}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {lines.length > 0 ? (
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold text-brand-dark">
            <span>{t("total")}</span>
            <PriceDisplay amount={subtotal} currency="BRL" locale={locale} className="text-sm font-semibold" />
          </div>
        ) : null}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {lines.length > 0 ? (
            <Button asChild className="w-full">
              <Link href={`/feira/${slug}/checkout`} onClick={() => setOpen(false)}>
                {t("checkoutTitle")}
              </Link>
            </Button>
          ) : (
            <Button type="button" className="w-full" disabled>
              {t("checkoutTitle")}
            </Button>
          )}
          <Button type="button" variant="outline" className="w-full" onClick={() => setOpen(false)}>
            {t("continueShopping")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
