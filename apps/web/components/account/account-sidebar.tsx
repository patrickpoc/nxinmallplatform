"use client";

import {
  DollarSign,
  LayoutDashboard,
  MapPin,
  Menu,
  Package,
  ShoppingBag,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { loadProfile } from "@/lib/account/profile-store";

type SidebarProps = {
  locale: string;
  role: string;
  userName: string | null;
  userEmail: string;
};

const ITEMS = [
  { key: "dashboard", icon: LayoutDashboard, href: "/account/dashboard" as const, roles: ["BUYER", "SELLER"] },
  { key: "personal", icon: User, href: "/account/personal" as const, roles: ["BUYER", "SELLER"] },
  { key: "financial", icon: DollarSign, href: "/account/financial" as const, roles: ["BUYER", "SELLER"] },
  { key: "listings", icon: ShoppingBag, href: "/account/listings" as const, roles: ["SELLER"] },
  { key: "addresses", icon: MapPin, href: "/account/addresses" as const, roles: ["BUYER", "SELLER"] },
  { key: "purchases", icon: ShoppingCart, href: "/account/purchases" as const, roles: ["BUYER", "SELLER"] },
  { key: "sales", icon: Package, href: "/account/sales" as const, roles: ["SELLER"] },
] as const;

function NavItems({
  role,
  pathname,
  locale,
  t,
  onNavigate,
}: {
  role: string;
  pathname: string;
  locale: string;
  t: (k: string) => string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {ITEMS.filter((item) => item.roles.includes(role as "BUYER" | "SELLER")).map((item) => {
        const fullHref = `/${locale}${item.href}`;
        const active = pathname === fullHref || pathname.startsWith(fullHref + "/");
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
            {t(`sidebar.${item.key}`)}
          </Link>
        );
      })}
    </nav>
  );
}

export function AccountSidebar({ locale, role, userName, userEmail }: SidebarProps) {
  const t = useTranslations("account");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(userName);

  useEffect(() => {
    const saved = loadProfile();
    if (saved?.name) setDisplayName(saved.name);
  }, []);

  const avatar = (displayName ?? userEmail).charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile toggle */}
      <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-1.5 text-brand-gray hover:bg-surface-light"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-brand-dark">{t("title")}</span>
      </div>

      {/* Mobile overlay with animation */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              role="presentation"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative z-10 flex h-full w-72 flex-col bg-white shadow-lg"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-sm font-bold text-white">
                    {avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-brand-dark">{displayName ?? userEmail}</p>
                    <p className="truncate text-xs text-brand-gray">{userEmail}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-1 text-brand-gray" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <NavItems locale={locale} role={role} pathname={pathname} t={t} onNavigate={() => setMobileOpen(false)} />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-white md:block">
        <div className="flex items-center gap-3 border-b border-border px-4 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue text-sm font-bold text-white">
            {avatar}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-dark">{displayName ?? userEmail}</p>
            <p className="truncate text-xs text-brand-gray">{userEmail}</p>
          </div>
        </div>
        <div className="px-3 py-4">
          <NavItems locale={locale} role={role} pathname={pathname} t={t} />
        </div>
      </aside>
    </>
  );
}
