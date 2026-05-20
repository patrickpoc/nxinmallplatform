"use client";

import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Package, ShoppingCart, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { SellOnNxinmallCta } from "@/components/account/sell-on-nxinmall-cta";
import { computeBuyerStats, orderAmount } from "@/lib/account/buyer-stats";
import { loadOrders, type SavedOrder } from "@/lib/account/orders-store";
import { loadProfile } from "@/lib/account/profile-store";
import type { CurrencyCode } from "@/lib/currency-preference";
import { useCurrency } from "@/lib/hooks/use-currency";

const LOCALE_MAP: Record<string, string> = { en: "en-US", pt: "pt-BR", zh: "zh-CN" };

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(LOCALE_MAP[locale] ?? "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function orderCurrency(order: SavedOrder, fallback: string): CurrencyCode {
  const code = order.currency ?? order.items[0]?.priceCurrency ?? fallback;
  return code === "BRL" ? "BRL" : "USD";
}

export function BuyerDashboard() {
  const t = useTranslations("account");
  const locale = useLocale();
  const { data: session } = useSession();
  const { format } = useCurrency();
  const userId = session?.user?.id;
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      setOrders(loadOrders(userId));
      const profile = loadProfile(userId);
      if (profile?.name) setUserName(profile.name);
    };
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [userId]);

  const stats = useMemo(() => computeBuyerStats(orders), [orders]);
  const recent = orders.slice(0, 5);

  const displayCurrency = (stats.primaryCurrency === "BRL" ? "BRL" : "USD") as CurrencyCode;

  const fmtMoney = (amount: number, currency: CurrencyCode = displayCurrency) =>
    format(amount, currency, locale);

  const formatOrderTotal = (order: SavedOrder) => {
    const amount =
      typeof order.totalAmount === "number" && !Number.isNaN(order.totalAmount)
        ? order.totalAmount
        : orderAmount(order);
    return fmtMoney(amount, orderCurrency(order, stats.primaryCurrency));
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8" data-demo-target="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">
          {userName ? `${t("buyerDashboardWelcome")}, ${userName}` : t("buyerDashboardTitle")}
        </h1>
        <p className="text-sm text-brand-gray">{t("buyerDashboardSubtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" data-demo-target="dashboard-kpis">
        <Card className="shadow-card">
          <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 sm:h-11 sm:w-11">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gray sm:text-xs">
                {t("buyerKpiOrders")}
              </p>
              <p className="text-xl font-bold tabular-nums text-brand-dark sm:text-2xl">{stats.totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-11 sm:w-11">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gray sm:text-xs">
                {t("buyerKpiSpent")}
              </p>
              <p
                className="text-base font-bold tabular-nums leading-tight text-brand-dark sm:text-lg xl:text-2xl"
                title={fmtMoney(stats.totalSpent)}
              >
                {fmtMoney(stats.totalSpent)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 sm:h-11 sm:w-11">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gray sm:text-xs">
                {t("buyerKpiPending")}
              </p>
              <p className="text-xl font-bold tabular-nums text-brand-dark sm:text-2xl">{stats.pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex min-w-0 items-center gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-mid sm:h-11 sm:w-11">
              <Package className="h-5 w-5 text-brand-blue" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gray sm:text-xs">
                {t("buyerKpiUnits")}
              </p>
              <p className="text-xl font-bold tabular-nums text-brand-dark sm:text-2xl">{stats.totalUnits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/products">{t("browseProducts")}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/account/purchases">{t("purchasesTitle")}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/account/financial">{t("financialNavBuyer")}</Link>
        </Button>
      </div>

      <div data-demo-target="dashboard-recent-purchases">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-brand-dark">{t("recentPurchases")}</h2>
          {orders.length > 0 ? (
            <Link href="/account/purchases" className="shrink-0 text-xs font-medium text-brand-blue hover:underline">
              {t("viewAllPurchases")}
            </Link>
          ) : null}
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-white px-4 py-8 text-center">
            <ShoppingCart className="h-8 w-8 text-brand-blue" />
            <p className="text-sm text-brand-gray">{t("noPurchases")}</p>
            <Button asChild variant="outline" size="sm" className="btn-press">
              <Link href="/products">{t("browseProducts")}</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-border bg-white px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-medium text-brand-blue">{order.id}</p>
                    <p className="text-xs text-brand-gray">{formatDate(order.createdAt, locale)}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-brand-gray">
                      {order.items.map((i) => i.name).join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-border pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                    <span
                      className="whitespace-nowrap text-base font-semibold tabular-nums text-brand-dark"
                      title={formatOrderTotal(order)}
                    >
                      {formatOrderTotal(order)}
                    </span>
                    {order.status === "pending" ? (
                      <Badge variant="outline" className="shrink-0 gap-1 border-amber-300 bg-amber-50 text-amber-700">
                        <Clock className="h-3 w-3" />
                        {t("statusPending")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 gap-1 border-green-300 bg-green-50 text-green-700">
                        <Check className="h-3 w-3" />
                        {t("statusApproved")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SellOnNxinmallCta />
    </div>
  );
}
