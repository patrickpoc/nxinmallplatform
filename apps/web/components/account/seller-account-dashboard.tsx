"use client";

import { useLocale, useTranslations } from "next-intl";
import { DollarSign, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SellerDashboardData } from "@/lib/seller/seller-dashboard-data";
import { moneyFormatOptions, roundMoney } from "@/lib/money-format";

const LOCALE_MAP: Record<string, string> = { en: "en-US", pt: "pt-BR", zh: "zh-CN" };

type Props = {
  data: SellerDashboardData;
};

export function SellerAccountDashboard({ data }: Props) {
  const t = useTranslations("account");
  const locale = useLocale();
  const { metrics, recentOrders } = data;

  const fmtUsd = (n: number) =>
    new Intl.NumberFormat(LOCALE_MAP[locale] ?? "en-US", {
      style: "currency",
      currency: "USD",
      ...moneyFormatOptions(),
    }).format(roundMoney(n));

  const fmtDate = (d: Date) =>
    d.toLocaleDateString(LOCALE_MAP[locale] ?? "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="mx-auto max-w-3xl space-y-8" data-demo-target="seller-account-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("sellerDashboardTitle")}</h1>
        <p className="text-sm text-brand-gray">{t("sellerDashboardSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          label={t("sellerKpiRevenue")}
          value={fmtUsd(metrics.revenueUsd)}
        />
        <KpiCard
          icon={<ShoppingBag className="h-5 w-5 text-brand-blue" />}
          label={t("sellerKpiOrders")}
          value={String(metrics.ordersCount)}
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-brand-blue" />}
          label={t("sellerKpiUnits")}
          value={String(metrics.unitsSold)}
        />
        <KpiCard
          icon={<Package className="h-5 w-5 text-brand-gray" />}
          label={t("sellerKpiListings")}
          value={String(metrics.activeProducts)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/seller/dashboard">{t("sellerOpenPortal")}</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/seller/products">{t("sellerManageProducts")}</Link>
        </Button>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-brand-dark">{t("sellerRecentSales")}</h2>
        {recentOrders.length === 0 ? (
          <p className="rounded-lg border border-border bg-white px-4 py-8 text-center text-sm text-brand-gray">
            {t("sellerRecentSalesEmpty")}
          </p>
        ) : (
          <div className="space-y-2">
            {recentOrders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-brand-blue">{order.id}</p>
                  <p className="text-xs text-brand-gray">{fmtDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-dark">{fmtUsd(order.totalUsd)}</p>
                  <p className="text-xs text-brand-gray">
                    {order.itemCount} {t("sellerOrderItems")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-light">{icon}</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{label}</p>
          <p className="text-2xl font-bold text-brand-dark">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
