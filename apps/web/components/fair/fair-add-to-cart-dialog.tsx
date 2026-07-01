"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { PriceDisplay } from "@/components/brand/price-display";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFairCart } from "@/lib/fair/fair-cart-context";
import type { CartPriceCurrency } from "@/lib/cart/types";

export type FairAddToCartItem = {
  productId: string;
  variantId: string;
  name: string;
  imageUrl?: string;
  priceAmount: number;
  priceCurrency: CartPriceCurrency;
  minOrderQty?: number;
  stockQty?: number;
};

type Props = {
  item: FairAddToCartItem;
  trigger: ReactNode;
};

export function FairAddToCartDialog({ item, trigger }: Props) {
  const t = useTranslations("fairBooth");
  const locale = useLocale();
  const { addItem } = useFairCart();
  const [open, setOpen] = useState(false);

  const minQty = Math.max(1, item.minOrderQty ?? 1);
  const maxQty = item.stockQty && item.stockQty > 0 ? item.stockQty : 999;
  const [qty, setQty] = useState(minQty);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setQty(minQty);
  }

  function handleConfirm() {
    addItem({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      imageUrl: item.imageUrl,
      priceAmount: item.priceAmount,
      priceCurrency: item.priceCurrency,
      quantity: qty,
    });
    toast.success(t("addToCartSuccess"));
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-xs" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-base">{t("addToCart")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          {item.imageUrl ? (
            <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-border bg-white">
              <Image src={item.imageUrl} alt="" fill className="object-contain p-2" sizes="112px" unoptimized />
            </div>
          ) : null}
          <p className="text-center text-sm font-semibold text-brand-dark">{item.name}</p>
          <PriceDisplay
            amount={item.priceAmount}
            currency={item.priceCurrency}
            locale={locale}
            className="text-lg font-bold text-brand-dark"
          />
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium text-brand-dark">{t("quantity")}</span>
            <QuantitySelector value={qty} onChange={setQty} min={minQty} max={maxQty} />
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full" onClick={handleConfirm}>
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
            {t("addToCart")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
