"use client";

import { LayoutDashboard, Package, Settings, Store } from "lucide-react";
import { useTranslations } from "next-intl";
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
    <div className="page-container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">{t("portalTitle")}</h1>
          {slug ? (
            <Link
              href={`/feira/${slug}`}
              className="mt-1 inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"
              target="_blank"
            >
              <Store className="h-4 w-4" />
              {t("viewStorefront")}
            </Link>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="flex shrink-0 gap-2 lg:w-52 lg:flex-col">
          {NAV.map(({ href, icon: Icon, labelKey }) => {
            const active = pathname === href || (href !== "/feira-vendor" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-brand-blue text-white" : "text-brand-gray hover:bg-surface-light",
                )}
              >
                <Icon className="h-4 w-4" />
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
