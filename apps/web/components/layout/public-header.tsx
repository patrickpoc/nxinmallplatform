"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  ChevronDown,
  DollarSign,
  Heart,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  UserCircle,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { NxinLogo } from "@/components/brand/nxin-logo";
import { DemoStartButton } from "@/components/demo/demo-start-button";
import { useDemoTourOptional } from "@/lib/demo/demo-context";
import type { HeaderDemoHandlers } from "@/lib/demo/demo-header-bridge";
import { CartHeaderMenu } from "@/components/cart/cart-header-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/hooks/use-auth";
import { useCurrencyPreference } from "@/lib/currency-preference";
import { useCurrency } from "@/lib/hooks/use-currency";
import { useWishlist } from "@/lib/wishlist/wishlist-context";
import { cn } from "@/lib/utils";

const locales = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文" },
];

export type PublicHeaderCategory = {
  id: string;
  slug: string;
  name: unknown;
  children?: PublicHeaderCategory[];
};

type PublicHeaderProps = {
  categories: PublicHeaderCategory[];
};

export function PublicHeader({ categories }: PublicHeaderProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const { data: session } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const demo = useDemoTourOptional();
  const pathname = usePathname();
  const { displayCurrency, setDisplayCurrency } = useCurrencyPreference();
  const { brlPerUsd } = useCurrency();
  const { itemCount: wishlistCount } = useWishlist();
  const panelRef = useRef<HTMLElement>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!catOpen) return;
    document.addEventListener("keydown", trapFocus);
    return () => document.removeEventListener("keydown", trapFocus);
  }, [catOpen, trapFocus]);

  useEffect(() => {
    if (catOpen) {
      const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setCatOpen(false); };
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [catOpen]);

  useEffect(() => {
    if (!demo?.registerHeaderHandlers) return;
    const handlers: HeaderDemoHandlers = {
      openCategories: () => {
        setLocaleMenuOpen(false);
        setProfileMenuOpen(false);
        setCatOpen(true);
      },
      closeCategories: () => setCatOpen(false),
      openLocaleMenu: () => {
        setCatOpen(false);
        setProfileMenuOpen(false);
        setLocaleMenuOpen(true);
      },
      closeLocaleMenu: () => setLocaleMenuOpen(false),
      openProfileMenu: () => {
        setCatOpen(false);
        setLocaleMenuOpen(false);
        setProfileMenuOpen(true);
      },
      closeProfileMenu: () => setProfileMenuOpen(false),
    };
    demo.registerHeaderHandlers(handlers);
    return () => demo.registerHeaderHandlers(null);
  }, [demo]);

  function switchLocale(next: string) {
    const current = window.location.pathname;
    const replaced = current.replace(/^\/(en|pt|zh)(\/|$)/, `/${next}$2`);
    window.location.href = replaced || `/${next}`;
  }

  function categoryLabel(nameJson: unknown): string {
    const o = nameJson as Record<string, string> | null;
    const loc = locale as "en" | "pt" | "zh";
    return o?.[loc] ?? o?.en ?? "—";
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <span className="sr-only" data-demo-target="locale-settings-zone" aria-hidden />
      {/* ─── BAR 1: Logo + Search + Icon actions ─── */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-2.5 md:px-6 md:py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 justify-self-start" aria-label={t("logoHome")}>
          <NxinLogo />
        </Link>

        <form
          action={`/${locale}/products`}
          method="get"
          className="hidden w-full max-w-2xl justify-self-center md:flex"
          role="search"
          data-demo-target="search"
        >
          <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-light px-3 py-1.5">
            <Search className="h-4 w-4 shrink-0 text-brand-gray" aria-hidden />
            <Input
              name="q"
              type="search"
              placeholder={t("searchPlaceholder")}
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              aria-label={t("searchPlaceholder")}
            />
            <Button type="submit" size="sm" className="shrink-0">
              {t("search")}
            </Button>
          </div>
        </form>

        <div className="flex shrink-0 items-center gap-1 justify-self-end">
            {session?.user ? (
              <>
            <DemoStartButton className="hidden md:inline-flex" />
              <DropdownMenu open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:inline-flex"
                    aria-label={t("profile")}
                    data-demo-target="profile-menu-trigger"
                  >
                    <UserCircle className="h-5 w-5" aria-hidden />
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52" data-demo-target="profile-menu-panel">
                  <DropdownMenuLabel className="text-xs font-semibold text-brand-gray">{t("sectionBuy")}</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/account/purchases">{t("myPurchases")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {session.user.role === "SELLER" && (
                    <>
                      <DropdownMenuLabel className="text-xs font-semibold text-brand-gray">{t("sectionSell")}</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/account/sales">{t("mySales")}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/account/listings">{t("myListings")}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuLabel className="text-xs font-semibold text-brand-gray">{t("sectionAccount")}</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link href="/account/personal">{t("myData")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/financial">{t("financial")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/account/addresses">{t("addresses")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist">{t("favorites")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: `/${locale}` })} className="text-error">
                    <LogOut className="mr-2 h-4 w-4" aria-hidden />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : (
              <>
                <DemoStartButton />
                <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
                  <Link href="/auth/login">{t("login")}</Link>
                </Button>
              </>
            )}
            {/* Mobile profile icon (compact) */}
            {session?.user ? (
              <Button variant="ghost" size="icon" asChild className="md:hidden" aria-label={t("profile")}>
                <Link href="/account/dashboard">
                  <UserCircle className="h-5 w-5" aria-hidden />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild className="md:hidden" aria-label={t("login")}>
                <Link href="/auth/login">
                  <UserCircle className="h-5 w-5" aria-hidden />
                </Link>
              </Button>
            )}

            {/* Favorites */}
            <Button variant="ghost" size="icon" asChild aria-label={t("favorites")} className="relative">
              <Link href="/wishlist">
                <Heart className="h-5 w-5" aria-hidden />
                {wishlistCount > 0 ? (
                  <Badge variant="default" className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-0.5 text-[10px]">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </Badge>
                ) : null}
              </Link>
            </Button>

            {/* Cart */}
            <CartHeaderMenu />

            {/* Settings (language + currency) */}
            <DropdownMenu open={localeMenuOpen} onOpenChange={setLocaleMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("settings")} data-demo-target="locale-settings-trigger">
                  <Settings className="h-5 w-5" aria-hidden />
                  <span className="sr-only md:not-sr-only md:ml-1 md:text-xs md:font-medium md:uppercase">{locale}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" data-demo-target="locale-settings-panel">
                <DropdownMenuLabel className="text-xs font-semibold text-brand-gray">
                  {t("languageLabel")}
                </DropdownMenuLabel>
                {locales.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    disabled={l.code === locale}
                    onClick={() => switchLocale(l.code)}
                  >
                    {l.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-brand-gray">
                  {t("currencyLabel")}
                </DropdownMenuLabel>
                <DropdownMenuItem disabled={displayCurrency === "USD"} onClick={() => setDisplayCurrency("USD")}>
                  USD
                </DropdownMenuItem>
                <DropdownMenuItem disabled={displayCurrency === "BRL"} onClick={() => setDisplayCurrency("BRL")}>
                  BRL
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label={t("openMenu")}>
              <Menu className="h-5 w-5" />
            </Button>
        </div>
      </div>

      {/* Mobile search (below bar 1 on small screens) */}
      <div className="px-4 pb-2 md:hidden">
        <form
          action={`/${locale}/products`}
          method="get"
          className="flex"
          role="search"
        >
          <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-light px-2 py-1.5">
            <Search className="h-4 w-4 shrink-0 text-brand-gray" aria-hidden />
            <Input
              name="q"
              type="search"
              placeholder={t("searchPlaceholder")}
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              aria-label={t("searchPlaceholder")}
            />
            <Button type="submit" size="sm" className="shrink-0">
              {t("search")}
            </Button>
          </div>
        </form>
      </div>

      {/* ─── BAR 2: Categories nav + exchange rate (desktop) ─── */}
      <div className="hidden border-t border-border bg-surface-light/60 md:block">
        <div className="flex items-center gap-1 px-4 py-0 md:px-6">
          {/* ALL CATEGORIES slide panel trigger */}
          <button
            type="button"
            data-demo-target="category-nav-trigger"
            onClick={() => setCatOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors",
              catOpen ? "bg-brand-blue text-white" : "text-brand-dark hover:text-brand-blue",
            )}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            {t("allCategoriesHover")}
          </button>

          {/* Category direct links */}
          <nav aria-label={t("shopNavigation")} className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
            {categories.map((c) => {
              const isActive = pathname.includes(`category=${c.id}`);
              return (
                <Link
                  key={c.id}
                  href={`/products?category=${c.id}`}
                  className={cn(
                    "whitespace-nowrap rounded-md px-2.5 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "text-brand-blue underline decoration-2 underline-offset-4"
                      : "text-brand-dark hover:text-brand-blue hover:underline hover:decoration-brand-blue/40 hover:underline-offset-4",
                  )}
                >
                  {categoryLabel(c.name)}
                </Link>
              );
            })}
          </nav>

          {/* Exchange rate indicator */}
          <div
            data-demo-target="locale-exchange-rate"
            className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium text-brand-gray"
            suppressHydrationWarning
          >
            <DollarSign className="h-3.5 w-3.5 opacity-70" aria-hidden />
            <span suppressHydrationWarning>
              USD 1 = BRL {brlPerUsd.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border bg-white md:hidden"
          >
            <div className="px-4 py-3">
              <nav aria-label={t("shopNavigation")} className="flex flex-col gap-1 text-sm font-medium">
                <DemoStartButton variant="menu" onStarted={() => setMobileOpen(false)} />
                <Link href="/products" className="rounded-md px-3 py-2 transition-colors hover:bg-surface-light" onClick={() => setMobileOpen(false)}>
                  {t("products")}
                </Link>
                <Link href="/categories" className="rounded-md px-3 py-2 transition-colors hover:bg-surface-light" onClick={() => setMobileOpen(false)}>
                  {t("categories")}
                </Link>
                <Link href="/sellers" className="rounded-md px-3 py-2 transition-colors hover:bg-surface-light" onClick={() => setMobileOpen(false)}>
                  {t("sellers")}
                </Link>
                <Link href="/about" className="rounded-md px-3 py-2 transition-colors hover:bg-surface-light" onClick={() => setMobileOpen(false)}>
                  {t("about")}
                </Link>
                <div className="mt-2 space-y-3 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-brand-gray">{t("languageLabel")}:</span>
                    {locales.map((l) => (
                      <button key={l.code} type="button" disabled={l.code === locale}
                        className={cn("rounded px-2 py-0.5", l.code === locale ? "bg-brand-blue text-white" : "bg-surface-light text-brand-dark")}
                        onClick={() => switchLocale(l.code)}>{l.label}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-brand-gray">{t("currencyLabel")}:</span>
                    {(["USD", "BRL"] as const).map((c) => (
                      <button key={c} type="button" disabled={displayCurrency === c}
                        className={cn("rounded px-2 py-0.5", displayCurrency === c ? "bg-brand-blue text-white" : "bg-surface-light text-brand-dark")}
                        onClick={() => setDisplayCurrency(c)}>{c}</button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Link href="/wishlist" className="flex items-center gap-1 text-sm" onClick={() => setMobileOpen(false)}>
                      <Heart className="h-4 w-4" aria-hidden />
                      {t("favorites")}
                      {wishlistCount > 0 ? <span className="text-xs text-brand-blue">({wishlistCount})</span> : null}
                    </Link>
                    <CartHeaderMenu />
                  </div>
                  <div className="text-xs text-brand-gray" suppressHydrationWarning>
                    <DollarSign className="mr-1 inline h-3 w-3 opacity-70" aria-hidden />
                    USD 1 = BRL {brlPerUsd.toFixed(2)}
                  </div>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>

    {/* Categories slide panel */}
    <AnimatePresence>
      {catOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40"
            onClick={() => setCatOpen(false)}
            role="presentation"
          />
          <motion.aside
            ref={panelRef}
            data-demo-target="category-sidebar"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative z-10 flex h-full w-72 flex-col bg-white shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label={t("allCategoriesHover")}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-brand-blue" aria-hidden />
                <span className="text-sm font-semibold uppercase tracking-wide text-brand-dark">
                  {t("allCategoriesHover")}
                </span>
              </div>
              <button type="button" onClick={() => setCatOpen(false)} className="p-1 text-brand-gray hover:text-brand-dark" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2" aria-label={t("shopNavigation")}>
              {categories.map((c) => (
                <div key={c.id}>
                  <Link
                    href={`/products?category=${c.id}`}
                    onClick={() => setCatOpen(false)}
                    className="block px-5 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-surface-light hover:text-brand-blue"
                  >
                    {categoryLabel(c.name)}
                  </Link>
                  {c.children && c.children.length > 0 && (
                    <div className="pb-1">
                      {c.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/products?category=${sub.id}`}
                          onClick={() => setCatOpen(false)}
                          className="block px-8 py-2 text-sm text-brand-gray transition-colors hover:bg-surface-light hover:text-brand-blue"
                        >
                          {categoryLabel(sub.name)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
