"use client";

import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PriceDisplay } from "@/components/brand/price-display";
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
import { useCart } from "@/lib/cart/cart-context";
import { useLocale } from "next-intl";

export function CartHeaderMenu() {
  const t = useTranslations("nav");
  const tc = useTranslations("cart");
  const locale = useLocale();
  const { lines, itemCount, removeLine } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="ghost" size="icon" className="relative shrink-0" aria-label={t("cart")} onClick={() => setOpen(true)}>
        <ShoppingCart className="h-5 w-5" aria-hidden />
        {itemCount > 0 ? (
          <Badge variant="default" className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center px-1 text-[10px]">
            {itemCount > 99 ? "99+" : itemCount}
          </Badge>
        ) : null}
      </Button>
      <DialogContent className="max-h-[70dvh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>{tc("miniTitle")}</DialogTitle>
          <DialogDescription>{tc("miniDescription")}</DialogDescription>
        </DialogHeader>
        {lines.length === 0 ? (
          <p className="text-sm text-brand-gray">{tc("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {lines.map((line) => (
              <li key={line.lineId} className="flex gap-3 rounded-lg border border-border p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-light">
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt="" fill className="object-contain p-1" sizes="56px" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-brand-gray">—</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <Link
                    href={`/products/${line.productId}`}
                    className="line-clamp-2 text-sm font-medium text-brand-dark hover:text-brand-blue"
                    onClick={() => setOpen(false)}
                  >
                    {line.name}
                  </Link>
                  <p className="text-xs text-brand-gray">
                    ×{line.quantity}
                    {line.unit ? ` · ${line.unit}` : ""}
                  </p>
                  <p className="text-sm font-semibold text-brand-dark">
                    <PriceDisplay
                      amount={line.priceAmount * line.quantity}
                      currency={line.priceCurrency}
                      locale={locale}
                      className="text-sm font-semibold"
                    />
                  </p>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-0 text-xs text-error" onClick={() => removeLine(line.lineId)}>
                    {tc("remove")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild className="w-full">
            <Link href="/cart" onClick={() => setOpen(false)}>
              {tc("viewCart")}
            </Link>
          </Button>
          {lines.length > 0 ? (
            <Button asChild variant="outline" className="w-full">
              <Link href="/checkout" onClick={() => setOpen(false)}>
                {tc("goCheckout")}
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" className="w-full" disabled>
              {tc("goCheckout")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
