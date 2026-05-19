"use client";

import { PriceDisplay } from "@/components/brand/price-display";

type CurrencyDisplayProps = {
  amountUsd: number;
  className?: string;
  locale?: string;
};

/** Back-compat wrapper for older callsites that still pass USD-only amounts. */
export function CurrencyDisplay({ amountUsd, className, locale }: CurrencyDisplayProps) {
  return <PriceDisplay amount={amountUsd} currency="USD" className={className} locale={locale} />;
}
