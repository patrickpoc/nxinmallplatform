"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { PriceDisplay } from "@/components/brand/price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { QuantitySelector } from "@/components/cart/quantity-selector";
import { useCurrencyPreference } from "@/lib/currency-preference";
import { useCart } from "@/lib/cart/cart-context";
import type { CartLine } from "@/lib/cart/types";
import { useCurrency } from "@/lib/hooks/use-currency";

function CartTotalRow({ lines, locale }: { lines: CartLine[]; locale: string }) {
  const { displayCurrency } = useCurrencyPreference();
  const { convert, format, isLoading } = useCurrency();
  const sum = lines.reduce((acc, l) => acc + convert(l.priceAmount * l.quantity, l.priceCurrency, displayCurrency), 0);
  const label = format(sum, displayCurrency, locale);
  return (
    <p className="text-lg font-bold text-brand-dark" suppressHydrationWarning>
      {isLoading ? "…" : label}
    </p>
  );
}

export function CartPageClient() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { lines, updateQuantity, removeLine } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-16 text-center md:px-6">
        <h1 className="text-3xl font-bold text-brand-dark">{t("title")}</h1>
        <p className="text-brand-gray">{t("empty")}</p>
        <Button asChild variant="outline">
          <Link href="/products">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-16 md:px-6" data-demo-target="cart-summary">
      <h1 className="text-3xl font-bold text-brand-dark">{t("title")}</h1>
      <ul className="space-y-4">
        {lines.map((line) => (
          <li key={line.lineId}>
            <Card className="shadow-card">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-white">
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt="" fill className="object-contain p-2" sizes="96px" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-brand-gray">—</div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Link href={`/products/${line.productId}`} className="font-semibold text-brand-dark hover:text-brand-blue">
                    {line.name}
                  </Link>
                  <p className="text-xs text-brand-gray">
                    <PriceDisplay amount={line.priceAmount} currency={line.priceCurrency} locale={locale} className="text-xs" />{" "}
                    {t("each")}
                    {line.unit ? ` · ${line.unit}` : ""}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <QuantitySelector
                      value={line.quantity}
                      onChange={(n) => updateQuantity(line.lineId, n)}
                    />
                    <Button type="button" variant="ghost" size="sm" className="text-error" onClick={() => removeLine(line.lineId)}>
                      {t("remove")}
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-gray">{t("lineTotal")}</p>
                  <PriceDisplay
                    amount={line.priceAmount * line.quantity}
                    currency={line.priceCurrency}
                    locale={locale}
                    className="text-lg font-semibold"
                  />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
      <Card className="border-brand-blue/20 bg-surface-light/50 shadow-card">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-gray">{t("estimatedTotal")}</p>
            <p className="text-xs text-brand-gray">{t("totalDemoHint")}</p>
          </div>
          <CartTotalRow lines={lines} locale={locale} />
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/products">{t("continueShopping")}</Link>
        </Button>
        <Button asChild>
          <Link href="/checkout">{t("goCheckout")}</Link>
        </Button>
      </div>
    </div>
  );
}
