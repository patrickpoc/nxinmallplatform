import type { ReactNode } from "react";
import { SellerSidebar } from "@/components/seller/seller-sidebar";

export function SellerShell({ locale, children }: { locale: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-8 md:py-10">
      <SellerSidebar locale={locale} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
