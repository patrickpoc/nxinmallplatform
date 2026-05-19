"use client";

import type { CurrencyCode } from "@/lib/currency-preference";
import { useCurrencyPreference } from "@/lib/currency-preference";
import { useCurrency } from "@/lib/hooks/use-currency";
import { cn } from "@/lib/utils";

type PriceDisplayProps = {
  amount: number;
  currency: CurrencyCode;
  className?: string;
  locale?: string;
};

export function PriceDisplay({ amount, currency, className, locale }: PriceDisplayProps) {
  const { displayCurrency } = useCurrencyPreference();
  const { convert, format, isLoading } = useCurrency();

  const converted = convert(amount, currency, displayCurrency);
  const label = format(converted, displayCurrency, locale);

  return (
    <span className={cn("font-mono tabular-nums text-brand-dark", className)} suppressHydrationWarning>
      {isLoading ? "…" : label}
    </span>
  );
}

