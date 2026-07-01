import { PublicFooter } from "@/components/layout/public-footer";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

/** Shared shell for feira vendor auth and portal routes (no role gate here). */
export default function FairVendorRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);

  return (
    <div className="flex min-h-screen flex-col bg-surface-light">
      <main className="flex flex-1 flex-col">{children}</main>
      <PublicFooter />
    </div>
  );
}
