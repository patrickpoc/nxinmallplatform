import type { ReactNode } from "react";

/**
 * Root layout passes through to `[locale]` layouts.
 * Required by Next.js App Router when localized routes own `<html>`.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
