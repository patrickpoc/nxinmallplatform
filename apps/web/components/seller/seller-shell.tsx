import type { ReactNode } from "react";
import { SellerSidebar, type SellerSidebarContext } from "@/components/seller/seller-sidebar";

export function SellerShell({
  locale,
  sidebarContext,
  children,
}: {
  locale: string;
  sidebarContext: SellerSidebarContext;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:px-8 md:py-10">
      <SellerSidebar locale={locale} context={sidebarContext} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
