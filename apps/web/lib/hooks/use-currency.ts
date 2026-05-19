"use client";

import { useQuery } from "@tanstack/react-query";
import type { CurrencyCode } from "@/lib/currency-preference";

type ExchangePayload = { rates: { USD: number; BRL: number }; fetchedAt: string };

/**
 * Returns helpers to display stored USD amounts in the buyer-facing currency.
 * Brazilian buyers see BRL using a cached USD→BRL rate (1h) from `/api/exchange-rate`.
 */
export function useCurrency(countryCode?: string | null) {
  const isBrazil = countryCode === "BR";
  const { data, isLoading } = useQuery({
    queryKey: ["exchange", "usd-brl"],
    queryFn: async () => {
      const res = await fetch("/api/exchange-rate");
      if (!res.ok) {
        throw new Error("Failed to load exchange rate");
      }
      return (await res.json()) as ExchangePayload;
    },
    staleTime: 60 * 60 * 1000,
    enabled: true,
  });

  const brlPerUsd = data?.rates.BRL && data.rates.USD ? data.rates.BRL / data.rates.USD : 5.0;

  function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
    if (from === to) return amount;
    if (from === "USD" && to === "BRL") return amount * brlPerUsd;
    if (from === "BRL" && to === "USD") return amount / brlPerUsd;
    return amount;
  }

  function format(amount: number, currency: CurrencyCode, locale?: string) {
    const fmtLocale = locale ?? (currency === "BRL" ? "pt-BR" : "en-US");
    return new Intl.NumberFormat(fmtLocale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(amount);
  }

  return {
    isBrazil,
    isLoading,
    brlPerUsd,
    convert,
    format,
  };
}
