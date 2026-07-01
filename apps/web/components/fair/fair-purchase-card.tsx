"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PriceDisplay } from "@/components/brand/price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { useFairCart } from "@/lib/fair/fair-cart-context";
import { getQuotationHref } from "@/lib/fair/quotation-href";
import type { CartPriceCurrency } from "@/lib/cart/types";

type Props = {
  slug: string;
  productId: string;
  variantId: string | null;
  productName: string;
  primaryAmount: number;
  primaryCurrency: CartPriceCurrency;
  booth: {
    quotationUrl?: string | null;
    whatsappNumber?: string | null;
    phone?: string | null;
  };
};

export function FairPurchaseCard({
  slug,
  productId,
  variantId,
  productName,
  primaryAmount,
  primaryCurrency,
  booth,
}: Props) {
  const t = useTranslations("fairBooth");
  const locale = useLocale();
  const { addItem } = useFairCart();
  const [qty, setQty] = useState(1);
  const quotationHref = getQuotationHref(booth);

  return (
    <Card className="shadow-card">
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase text-brand-gray">{t("price")}</p>
          <p className="text-2xl font-bold text-brand-dark">
            <PriceDisplay amount={primaryAmount} currency={primaryCurrency} locale={locale} />
          </p>
        </div>
        {variantId ? (
          <>
            <QuantitySelector value={qty} onChange={setQty} />
            <Button
              className="w-full"
              onClick={() =>
                addItem({
                  productId,
                  variantId,
                  name: productName,
                  priceAmount: primaryAmount,
                  priceCurrency: primaryCurrency,
                  quantity: qty,
                })
              }
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {t("addToCart")}
            </Button>
          </>
        ) : null}
        {quotationHref ? (
          <Button asChild variant="outline" className="w-full">
            <a href={quotationHref} target="_blank" rel="noopener noreferrer">
              {t("askQuotation")}
            </a>
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            {t("askQuotationUnavailable")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
