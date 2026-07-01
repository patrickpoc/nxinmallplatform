"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { PriceDisplay } from "@/components/brand/price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { useFairCart } from "@/lib/fair/fair-cart-context";
import { getQuotationHref } from "@/lib/fair/quotation-href";
import {
  buildFairCartItemName,
  getFairVariantImageUrl,
  getFairVariantLabel,
  type FairVariantDisplayInput,
} from "@/lib/fair/fair-variant-display";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  productName: string;
  locale: string;
  variants: FairVariantDisplayInput[];
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
  showVariantPicker: boolean;
  booth: {
    quotationUrl?: string | null;
    whatsappNumber?: string | null;
    phone?: string | null;
  };
  labels: {
    price: string;
    addToCart: string;
    askQuotation: string;
    askQuotationUnavailable: string;
    quantity: string;
    variant: string;
    sku: string;
    unit: string;
    stock: string;
    minOrder: string;
    purchaseInfoTitle: string;
    purchaseInfoBody: string;
  };
};

export function FairPurchaseCard({
  productId,
  productName,
  locale,
  variants,
  selectedVariantId,
  onVariantChange,
  showVariantPicker,
  booth,
  labels,
}: Props) {
  const t = useTranslations("fairBooth");
  const { addItem } = useFairCart();
  const [qty, setQty] = useState(1);
  const quotationHref = getQuotationHref(booth);

  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;

  if (!selectedVariant) {
    return null;
  }

  const variantLabel = getFairVariantLabel(selectedVariant);
  const imageUrl = getFairVariantImageUrl(selectedVariant);

  return (
    <Card className="shadow-card">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-brand-gray">{labels.price}</p>
          <p className="text-2xl font-bold text-brand-dark">
            <PriceDisplay
              amount={selectedVariant.priceAmount}
              currency={selectedVariant.priceCurrency}
              locale={locale}
              className="text-2xl font-bold"
            />
          </p>
        </div>

        {showVariantPicker ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-brand-dark">{labels.variant}</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const label = getFairVariantLabel(variant);
                const thumb = getFairVariantImageUrl(variant);
                const isSelected = variant.id === selectedVariant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => onVariantChange(variant.id)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "border-brand-blue bg-brand-blue/5 font-medium text-brand-blue"
                        : "border-border hover:border-brand-gray/50",
                    )}
                    aria-pressed={isSelected}
                  >
                    <span className="flex items-center gap-2">
                      {thumb ? (
                        <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded bg-white">
                          <Image src={thumb} alt="" fill className="object-contain p-0.5" sizes="32px" unoptimized />
                        </span>
                      ) : null}
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <dl className="grid gap-2 rounded-lg border border-border bg-surface-light px-3 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-brand-gray">{labels.variant}</dt>
            <dd className="font-medium text-brand-dark">{variantLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-brand-gray">{labels.sku}</dt>
            <dd className="font-mono text-brand-dark">{selectedVariant.sku}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-brand-gray">{labels.unit}</dt>
            <dd className="text-brand-dark">{selectedVariant.unit}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-brand-gray">{labels.stock}</dt>
            <dd className="text-brand-dark">{selectedVariant.stockQty.toLocaleString(locale)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-brand-gray">{labels.minOrder}</dt>
            <dd className="text-brand-dark">{selectedVariant.minOrderQty}</dd>
          </div>
        </dl>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-brand-dark">{labels.quantity}</span>
            <QuantitySelector
              value={qty}
              onChange={setQty}
              min={selectedVariant.minOrderQty}
              max={selectedVariant.stockQty > 0 ? selectedVariant.stockQty : 999}
              className="shrink-0"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => {
              addItem({
                productId,
                variantId: selectedVariant.id,
                name: buildFairCartItemName(productName, variantLabel),
                imageUrl,
                priceAmount: selectedVariant.priceAmount,
                priceCurrency: selectedVariant.priceCurrency,
                quantity: qty,
              });
              toast.success(t("addToCartSuccess"));
            }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {labels.addToCart}
          </Button>
          {quotationHref ? (
            <Button asChild variant="outline" className="w-full">
              <a href={quotationHref} target="_blank" rel="noopener noreferrer">
                {labels.askQuotation}
              </a>
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              {labels.askQuotationUnavailable}
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-border bg-surface-light px-4 py-3 text-xs text-brand-gray">
          <p className="font-semibold text-brand-dark">{labels.purchaseInfoTitle}</p>
          <p className="mt-1">{labels.purchaseInfoBody}</p>
        </div>
      </CardContent>
    </Card>
  );
}
