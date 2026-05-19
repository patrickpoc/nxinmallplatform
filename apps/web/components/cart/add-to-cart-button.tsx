"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
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
import { useCart } from "@/lib/cart/cart-context";
import type { CartPriceCurrency } from "@/lib/cart/types";
import { cn } from "@/lib/utils";

export type AddToCartPayload = {
  productId: string;
  variantId: string;
  name: string;
  imageUrl?: string;
  priceAmount: number;
  priceCurrency: CartPriceCurrency;
  unit?: string;
  quantity?: number;
};

type AddToCartButtonProps = {
  item: AddToCartPayload;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
  /** Icon-only when sm + icon size */
  iconOnly?: boolean;
};

export function AddToCartButton({ item, className, size = "default", variant = "default", iconOnly }: AddToCartButtonProps) {
  const t = useTranslations("product");
  const locale = useLocale();
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);

  function doAdd(quantity: number) {
    if (!item.variantId) {
      toast.error(t("addToCartError"));
      return;
    }
    addItem({
      productId: item.productId,
      variantId: item.variantId,
      name: item.name,
      imageUrl: item.imageUrl,
      priceAmount: item.priceAmount,
      priceCurrency: item.priceCurrency,
      unit: item.unit,
      quantity,
    });
    toast.success(t("addToCartSuccess"));
  }

  if (iconOnly) {
    return (
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setQty(1); }}>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant={variant === "default" ? "outline" : variant}
            className={cn("shrink-0", className)}
            aria-label={t("addToCart")}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xs">
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
            <QuantitySelector value={qty} onChange={setQty} />
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => { doAdd(qty); setOpen(false); }}
            >
              <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
              {t("addToCart")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Button type="button" size={size} variant={variant} className={cn("w-full", className)} onClick={() => doAdd(item.quantity ?? 1)}>
      <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
      {t("addToCart")}
    </Button>
  );
}
