"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CurrencyCode = "USD" | "BRL";

type CurrencyPreferenceContextValue = {
  displayCurrency: CurrencyCode;
  setDisplayCurrency: (c: CurrencyCode) => void;
};

const CurrencyPreferenceContext = createContext<CurrencyPreferenceContextValue | null>(null);

function defaultCurrencyForLocale(locale: string): CurrencyCode {
  return locale === "pt" ? "BRL" : "USD";
}

export function CurrencyPreferenceProvider({ children, locale }: { children: ReactNode; locale: string }) {
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(() => defaultCurrencyForLocale(locale));

  useEffect(() => {
    try {
      const v = window.localStorage.getItem("nxinmall:displayCurrency");
      if (v === "USD" || v === "BRL") {
        setDisplayCurrency(v);
        return;
      }
    } catch {
      // ignore
    }
    setDisplayCurrency(defaultCurrencyForLocale(locale));
  }, [locale]);

  useEffect(() => {
    try {
      window.localStorage.setItem("nxinmall:displayCurrency", displayCurrency);
    } catch {
      // ignore
    }
  }, [displayCurrency]);

  const value = useMemo(() => ({ displayCurrency, setDisplayCurrency }), [displayCurrency]);
  return <CurrencyPreferenceContext.Provider value={value}>{children}</CurrencyPreferenceContext.Provider>;
}

export function useCurrencyPreference() {
  const ctx = useContext(CurrencyPreferenceContext);
  if (!ctx) {
    throw new Error("useCurrencyPreference must be used within CurrencyPreferenceProvider");
  }
  return ctx;
}

