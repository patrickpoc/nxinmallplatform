"use client";

import {
  LayoutDashboard,
  Menu,
  Package,
  Store,
  UserCircle,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { PortalModeSwitch } from "@/components/seller/portal-mode-switch";
import { cn } from "@/lib/utils";

const NAV = [
  { key: "dashboard", href: "/seller/dashboard" as const, icon: LayoutDashboard },
  { key: "store", href: "/seller/store" as const, icon: Store },
  { key: "products", href: "/seller/products" as const, icon: Package },
  { key: "profile", href: "/seller/profile" as const, icon: UserCircle },
] as const;

export function SellerSidebar({ locale }: { locale: string }) {
  const t = useTranslations("sellerPortal");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
        {t("nav.menu")}
      </button>

      <aside
        className={cn(
          "w-full shrink-0 border-border bg-white md:w-56 md:border-r md:pr-6",
          "md:sticky md:top-20 md:self-start",
        )}
      >
        <div className="mb-4 hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("title")}</p>
        </div>
        <nav className="hidden space-y-1 md:block">
          {NAV.map((item) => {
            const full = `/${locale}${item.href}`;
            const active = pathname === full || pathname.startsWith(`${full}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-blue/10 text-brand-blue"
                    : "text-brand-gray hover:bg-surface-light hover:text-brand-dark",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 hidden md:block">
          <PortalModeSwitch variant="sidebar" />
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("nav.close")} onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-xl bg-white p-4 shadow-dropdown">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-brand-dark">{t("title")}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("nav.close")}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV.map((item) => {
                const full = `/${locale}${item.href}`;
                const active = pathname === full || pathname.startsWith(`${full}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      active ? "bg-brand-blue/10 text-brand-blue" : "text-brand-gray",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {t(`nav.${item.key}`)}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-4 border-t border-border pt-4">
              <PortalModeSwitch variant="sidebar" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
