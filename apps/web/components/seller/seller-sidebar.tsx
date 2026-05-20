"use client";

import {
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Store,
  UserCircle,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Link } from "@/i18n/routing";
import { VerificationBadge } from "@/components/brand/verification-badge";
import { CountryDisplay } from "@/components/brand/country-display";
import { PortalModeSwitch } from "@/components/seller/portal-mode-switch";
import { SellerLogoUpload } from "@/components/seller/seller-logo-upload";
import { cn } from "@/lib/utils";

export type SellerSidebarContext = {
  locale: string;
  companyName: string | null;
  companyCountry: string | null;
  logoUrl: string | null;
  verificationTier: string | null;
  metrics: {
    totalProducts: number;
    activeProducts: number;
    pendingOrders: number;
    revenueUsd: number;
  };
};

const NAV = [
  { key: "dashboard", href: "/seller/dashboard" as const, icon: LayoutDashboard },
  { key: "store", href: "/seller/store" as const, icon: Store },
  { key: "products", href: "/seller/products" as const, icon: Package },
  { key: "newProduct", href: "/seller/products/new" as const, icon: Plus },
  { key: "profile", href: "/seller/profile" as const, icon: UserCircle },
] as const;

function SidebarIdentity({ ctx }: { ctx: SellerSidebarContext }) {
  const t = useTranslations("sellerPortal");

  return (
    <div className="mb-4 rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        <SellerLogoUpload logoUrl={ctx.logoUrl} companyName={ctx.companyName} />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gray">{t("sidebar.store")}</p>
          {ctx.companyName ? (
            <p className="text-sm font-semibold leading-tight text-brand-dark">{ctx.companyName}</p>
          ) : (
            <p className="text-sm text-brand-gray">{t("sidebar.noCompany")}</p>
          )}
          {ctx.companyCountry ? (
            <CountryDisplay code={ctx.companyCountry} locale={ctx.locale} className="text-xs" />
          ) : null}
          {ctx.verificationTier ? (
            <div className="pt-0.5">
              <VerificationBadge tier={ctx.verificationTier} />
            </div>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-brand-gray">{t("sidebar.activeProducts")}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-brand-dark">
            {ctx.metrics.activeProducts}/{ctx.metrics.totalProducts}
          </dd>
        </div>
        <div>
          <dt className="text-brand-gray">{t("sidebar.openOrders")}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-brand-dark">{ctx.metrics.pendingOrders}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-brand-gray">{t("sidebar.revenue")}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-brand-dark">
            ${ctx.metrics.revenueUsd.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 3 })}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function NavLinks({
  locale,
  pathname,
  onNavigate,
}: {
  locale: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("sellerPortal");

  return (
    <>
      {NAV.map((item) => {
        const full = `/${locale}${item.href}`;
        const active = pathname === full || pathname.startsWith(`${full}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
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
    </>
  );
}

export function SellerSidebar({
  locale,
  context,
}: {
  locale: string;
  context: SellerSidebarContext;
}) {
  const t = useTranslations("sellerPortal");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ctx = { ...context, locale };

  return (
    <>
      <button
        type="button"
        className="mb-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-sm font-medium md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4 shrink-0" />
        {t("nav.menu")}
      </button>

      <aside
        className={cn(
          "w-full shrink-0 md:w-64 md:border-r md:border-border md:pr-4",
          "md:sticky md:top-20 md:self-start",
        )}
      >
        <div className="mb-2 hidden md:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("title")}</p>
        </div>
        <div className="hidden md:block">
          <SidebarIdentity ctx={ctx} />
        </div>
        <nav className="hidden space-y-0.5 md:block">
          <NavLinks locale={locale} pathname={pathname} />
        </nav>
        <div className="mt-4 hidden md:block">
          <PortalModeSwitch variant="sidebar" />
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("nav.close")}
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[min(85dvh,100%)] overflow-y-auto rounded-t-2xl bg-surface-light p-4 pb-6 shadow-dropdown">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-brand-dark">{t("title")}</p>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white"
                onClick={() => setOpen(false)}
                aria-label={t("nav.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarIdentity ctx={ctx} />
            <nav className="mt-2 space-y-0.5 rounded-lg bg-white p-2">
              <NavLinks locale={locale} pathname={pathname} onNavigate={() => setOpen(false)} />
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
