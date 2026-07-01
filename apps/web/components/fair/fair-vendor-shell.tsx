"use client";

import { LayoutDashboard, Package, Settings, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { FairVendorSignOutButton } from "@/components/fair/fair-vendor-sign-out-button";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/feira-vendor", icon: LayoutDashboard, labelKey: "navDashboard" as const },
  { href: "/feira-vendor/produtos", icon: Package, labelKey: "navProducts" as const },
  { href: "/feira-vendor/perfil", icon: Settings, labelKey: "navProfile" as const },
];

type Props = {
  locale: string;
  slug?: string;
  children: React.ReactNode;
};

export function FairVendorShell({ locale, slug, children }: Props) {
  const t = useTranslations("fairVendor");
  const pathname = usePathname();

  return (
    <div className="page-container py-4 md:py-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-brand-dark sm:text-xl">{t("portalTitle")}</h1>
          {slug ? (
            <Link
              href={`/feira/${slug}`}
              className="mt-1 inline-flex max-w-full items-center gap-1 text-sm text-brand-blue hover:underline"
              target="_blank"
            >
              <Store className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("viewStorefront")}</span>
            </Link>
          ) : null}
        </div>
        <FairVendorSignOutButton className="w-full shrink-0 sm:w-auto" />
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <nav className="-mx-1 flex gap-2 overflow-x-auto pb-1 lg:mx-0 lg:w-52 lg:flex-col lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map(({ href, icon: Icon, labelKey }) => {
            const active = pathname === href || (href !== "/feira-vendor" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:min-h-0",
                  active ? "bg-brand-blue text-white" : "text-brand-gray hover:bg-surface-light",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
