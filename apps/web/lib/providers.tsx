"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { SessionProvider } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart/cart-context";
import { CurrencyPreferenceProvider } from "@/lib/currency-preference";
import { WishlistProvider } from "@/lib/wishlist/wishlist-context";
import { DemoTourProvider } from "@/lib/demo/demo-context";
import { DemoShell } from "@/components/demo/demo-shell";

type ProvidersProps = {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
};

/**
 * Client-side providers: React Query for server state, next-intl for hydration, toasts.
 */
export function Providers({ children, locale, messages }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="America/Sao_Paulo">
          <CurrencyPreferenceProvider locale={locale}>
            <CartProvider>
              <WishlistProvider>
                <DemoTourProvider>
                  {children}
                  <DemoShell />
                  <Toaster position="top-center" richColors />
                </DemoTourProvider>
              </WishlistProvider>
            </CartProvider>
          </CurrencyPreferenceProvider>
        </NextIntlClientProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
