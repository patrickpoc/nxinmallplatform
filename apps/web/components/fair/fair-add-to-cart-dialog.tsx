"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type ReactNode } from "react";
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
import { buildFairCartItemName } from "@/lib/fair/fair-variant-display";
import type { CartPriceCurrency } from "@/lib/cart/types";
import { cn } from "@/lib/utils";

export type FairAddToCartVariant = {
  id: string;
  sku: string;
  label: string;
  imageUrl?: string;
  priceAmount: number;
  priceCurrency: CartPriceCurrency;
  unit: string;
  stockQty: number;
  minOrderQty: number;
};

export type FairAddToCartItem = {
  productId: string;
  productName: string;
  variants: FairAddToCartVariant[];
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
  const [selectedVariantId, setSelectedVariantId] = useState(item.variants[0]?.id ?? "");

  const selectedVariant = useMemo(
    () => item.variants.find((v) => v.id === selectedVariantId) ?? item.variants[0] ?? null,
    [item.variants, selectedVariantId],
  );

  const minQty = Math.max(1, selectedVariant?.minOrderQty ?? 1);
  const maxQty = selectedVariant && selectedVariant.stockQty > 0 ? selectedVariant.stockQty : 999;
  const [qty, setQty] = useState(minQty);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      const first = item.variants[0];
      if (first) {
        setSelectedVariantId(first.id);
        setQty(Math.max(1, first.minOrderQty));
      }
    }
  }

  function handleVariantChange(variantId: string) {
    const variant = item.variants.find((v) => v.id === variantId);
    if (!variant) return;
    setSelectedVariantId(variantId);
    setQty(Math.max(1, variant.minOrderQty));
  }

  function handleConfirm() {
    if (!selectedVariant) return;
    addItem({
      productId: item.productId,
      variantId: selectedVariant.id,
      name: buildFairCartItemName(item.productName, selectedVariant.label),
      imageUrl: selectedVariant.imageUrl,
      priceAmount: selectedVariant.priceAmount,
      priceCurrency: selectedVariant.priceCurrency,
      quantity: qty,
    });
    toast.success(t("addToCartSuccess"));
    setOpen(false);
  }

  if (!selectedVariant) return null;

  const lineTotal = selectedVariant.priceAmount * qty;
  const showVariantPicker = item.variants.length > 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="text-base">{t("addToCart")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="flex flex-col items-center gap-3">
            {selectedVariant.imageUrl ? (
              <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-border bg-white">
                <Image
                  src={selectedVariant.imageUrl}
                  alt=""
                  fill
                  className="object-contain p-2"
                  sizes="112px"
                  unoptimized
                />
              </div>
            ) : null}
            <p className="text-center text-sm font-semibold text-brand-dark">{item.productName}</p>
            <PriceDisplay
              amount={selectedVariant.priceAmount}
              currency={selectedVariant.priceCurrency}
              locale={locale}
              className="text-lg font-bold text-brand-dark"
            />
          </div>

          {showVariantPicker ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-brand-dark">{t("variant")}</p>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((variant) => {
                  const isSelected = variant.id === selectedVariant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleVariantChange(variant.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        isSelected
                          ? "border-brand-blue bg-brand-blue/5 font-medium text-brand-blue"
                          : "border-border hover:border-brand-gray/50",
                      )}
                      aria-pressed={isSelected}
                    >
                      <span className="flex items-center gap-2">
                        {variant.imageUrl ? (
                          <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded bg-white">
                            <Image
                              src={variant.imageUrl}
                              alt=""
                              fill
                              className="object-contain p-0.5"
                              sizes="32px"
                              unoptimized
                            />
                          </span>
                        ) : null}
                        {variant.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <dl className="grid gap-2 rounded-lg border border-border bg-surface-light px-3 py-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-brand-gray">{t("variant")}</dt>
              <dd className="font-medium text-brand-dark">{selectedVariant.label}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-brand-gray">{t("sku")}</dt>
              <dd className="font-mono text-brand-dark">{selectedVariant.sku}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-brand-gray">{t("unitLabel")}</dt>
              <dd className="text-brand-dark">{selectedVariant.unit}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-brand-gray">{t("stock")}</dt>
              <dd className="text-brand-dark">{selectedVariant.stockQty.toLocaleString(locale)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-brand-gray">{t("minOrder")}</dt>
              <dd className="text-brand-dark">{selectedVariant.minOrderQty}</dd>
            </div>
          </dl>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-brand-dark">{t("quantity")}</span>
            <QuantitySelector value={qty} onChange={setQty} min={minQty} max={maxQty} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span className="text-brand-gray">{t("total")}</span>
            <PriceDisplay
              amount={lineTotal}
              currency={selectedVariant.priceCurrency}
              locale={locale}
              className="font-semibold text-brand-dark"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" className="w-full" onClick={handleConfirm}>
            <ShoppingCart className="mr-2 h-4 w-4" aria-hidden />
            {t("addToCart")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
