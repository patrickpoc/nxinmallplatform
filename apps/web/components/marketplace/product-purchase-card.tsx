"use client";

import { useState } from "react";
import { PriceDisplay } from "@/components/brand/price-display";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { ToggleWishlistButton } from "@/components/wishlist/toggle-wishlist-button";
import { AskQuotationModal } from "@/components/marketplace/ask-quotation-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { CountryDisplay } from "@/components/brand/country-display";
import { PRODUCT_PURCHASE_CARD_ASPECT_CLASS } from "@/lib/marketplace/product-media-aspect";
import type { CartPriceCurrency } from "@/lib/cart/types";

type ProductPurchaseCardProps = {
  locale: string;
  productId: string;
  /** When missing, add-to-cart is hidden (listing integrity). */
  variantId: string | null;
  productName: string;
  categoryId: string;
  primaryAmount: number;
  primaryCurrency: CartPriceCurrency;
  companyId: string | null;
  companyName: string | null;
  companyCountry: string | null;
  labels: {
    fromPrice: string;
    priceHint: string;
    askQuotation: string;
    viewSeller: string;
    sellerUnknown: string;
    sidebarTitle: string;
    sidebarBody: string;
    quantity: string;
  };
};

export function ProductPurchaseCard({
  locale,
  productId,
  variantId,
  productName,
  categoryId,
  primaryAmount,
  primaryCurrency,
  companyId,
  companyName,
  companyCountry,
  labels,
}: ProductPurchaseCardProps) {
  const [qty, setQty] = useState(1);

  return (
    <div className={PRODUCT_PURCHASE_CARD_ASPECT_CLASS}>
      <Card className="flex flex-col shadow-card" data-demo-target="purchase-card">
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{labels.fromPrice}</p>
            <p className="text-2xl font-bold text-brand-dark">
              <PriceDisplay amount={primaryAmount} currency={primaryCurrency} locale={locale} className="text-2xl font-bold" />
            </p>
              <p className="text-xs text-brand-gray">{labels.priceHint}</p>
            </div>
            <ToggleWishlistButton
              item={{
                productId,
                name: productName,
                priceAmount: primaryAmount,
                priceCurrency: primaryCurrency,
              }}
            />
          </div>

          <div className="space-y-1 text-sm text-brand-gray">
            {companyName ? (
              <>
                <p className="font-medium text-brand-dark">{companyName}</p>
                {companyCountry ? (
                  <CountryDisplay code={companyCountry} locale={locale} className="text-xs" />
                ) : null}
              </>
            ) : (
              <p>{labels.sellerUnknown}</p>
            )}
          </div>

          <div className="space-y-3 border-t border-border pt-4" data-demo-target="add-to-cart">
            {variantId ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-brand-dark">{labels.quantity}</span>
                  <QuantitySelector value={qty} onChange={setQty} className="shrink-0" />
                </div>
                <AddToCartButton
                  className="w-full"
                  item={{
                    productId,
                    variantId,
                    name: productName,
                    priceAmount: primaryAmount,
                    priceCurrency: primaryCurrency,
                    quantity: qty,
                  }}
                />
              </div>
            ) : null}
            <AskQuotationModal
              locale={locale}
              productId={productId}
              productName={productName}
              categoryId={categoryId}
              triggerLabel={labels.askQuotation}
            />
            {companyId ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/sellers/${companyId}`}>{labels.viewSeller}</Link>
              </Button>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-surface-light px-4 py-3 text-xs text-brand-gray">
            <p className="font-semibold text-brand-dark">{labels.sidebarTitle}</p>
            <p className="mt-1">{labels.sidebarBody}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
