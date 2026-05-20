"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  BarChart3,
  Boxes,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { StatusPill } from "@/components/brand/status-pill";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/account/buyer-kpi-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SellerDashboardData } from "@/lib/seller/seller-dashboard-data";
import { moneyFormatOptions, roundMoney } from "@/lib/money-format";

const LOCALE_MAP: Record<string, string> = { en: "en-US", pt: "pt-BR", zh: "zh-CN" };

type Props = {
  data: SellerDashboardData;
  showSetupBanner?: boolean;
};

export function SellerDashboardTabs({ data, showSetupBanner }: Props) {
  const t = useTranslations("sellerPortal.dashboard");
  const tPortal = useTranslations("sellerPortal");
  const locale = useLocale();
  const { metrics, products, recentOrders } = data;

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
    <Tabs defaultValue="overview" className="space-y-6" data-demo-target="seller-dashboard-overview">
      {showSetupBanner ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="font-semibold text-brand-dark">{tPortal("setupIncompleteTitle")}</p>
          <p className="mt-1 text-brand-gray">{tPortal("setupIncompleteBody")}</p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link href="/account/company/setup">{tPortal("setupIncompleteLink")}</Link>
          </Button>
        </div>
      ) : null}
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="overview">{t("tabOverview")}</TabsTrigger>
        <TabsTrigger value="products">{t("tabProducts")}</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 min-[400px]:gap-4 xl:grid-cols-4">
          <KpiCard
            icon={<DollarSign className="h-5 w-5 text-green-600" />}
            iconClassName="bg-green-100"
            label={t("metricRevenue")}
            value={fmtUsd(metrics.revenueUsd)}
            valueTitle={fmtUsd(metrics.revenueUsd)}
            hint={t("metricRevenueHint")}
            className="min-[400px]:col-span-2 xl:col-span-1"
          />
          <KpiCard
            icon={<ShoppingBag className="h-5 w-5 text-brand-blue" />}
            iconClassName="bg-blue-100"
            label={t("metricOrders")}
            value={String(metrics.ordersCount)}
            hint={t("metricOrdersHint", {
              pending: String(metrics.pendingOrders),
              done: String(metrics.completedOrders),
            })}
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5 text-brand-blue" />}
            iconClassName="bg-blue-100"
            label={t("metricUnitsSold")}
            value={String(metrics.unitsSold)}
            hint={t("metricUnitsSoldHint")}
          />
          <KpiCard
            icon={<BarChart3 className="h-5 w-5 text-brand-blue" />}
            iconClassName="bg-surface-light"
            label={t("metricAvgOrder")}
            value={metrics.ordersCount > 0 ? fmtUsd(metrics.avgOrderUsd) : "—"}
            valueTitle={metrics.ordersCount > 0 ? fmtUsd(metrics.avgOrderUsd) : undefined}
            hint={t("metricAvgOrderHint")}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 min-[400px]:gap-4 xl:grid-cols-4">
          <KpiCard
            icon={<Package className="h-5 w-5 text-brand-gray" />}
            label={t("metricListings")}
            value={String(metrics.totalProducts)}
            hint={t("metricListingsHint", {
              active: String(metrics.activeProducts),
              draft: String(metrics.draftProducts),
            })}
          />
          <KpiCard
            icon={<Boxes className="h-5 w-5 text-brand-gray" />}
            label={t("metricStock")}
            value={String(metrics.unitsInStock)}
            hint={t("metricStockHint", { variants: String(metrics.totalVariants) })}
          />
          <KpiCard
            icon={<DollarSign className="h-5 w-5 text-brand-gray" />}
            label={t("metricCatalogValue")}
            value={fmtUsd(metrics.catalogValueUsd)}
            valueTitle={fmtUsd(metrics.catalogValueUsd)}
            hint={t("metricCatalogValueHint")}
            className="min-[400px]:col-span-2 xl:col-span-2"
          />
          <Card className="overflow-hidden min-[400px]:col-span-2 xl:col-span-2">
            <CardContent className="flex min-w-0 flex-col justify-center gap-2 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("storeStatus")}</p>
              <p className="font-medium text-brand-dark">{data.companyName ?? "—"}</p>
              <p className="text-xs text-brand-gray">
                {t("verification")}: {data.verificationStatus ?? "—"}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-1 w-fit">
                <Link href="/seller/store">{t("editStore")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-dark">{t("recentSales")}</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/seller/products">{t("manageProducts")}</Link>
            </Button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="rounded-lg border border-border bg-white px-4 py-8 text-center text-sm text-brand-gray">
              {t("noSalesYet")}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("colOrder")}</TableHead>
                    <TableHead>{t("colDate")}</TableHead>
                    <TableHead>{t("colItems")}</TableHead>
                    <TableHead>{t("colTotal")}</TableHead>
                    <TableHead>{t("colStatus")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id.slice(0, 10)}…</TableCell>
                      <TableCell>{fmtDate(o.createdAt)}</TableCell>
                      <TableCell>{o.itemCount}</TableCell>
                      <TableCell className="font-semibold">{fmtUsd(o.totalUsd)}</TableCell>
                      <TableCell>
                        <StatusPill status={o.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="products" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-dark">{t("productsTabTitle")}</h2>
            <p className="text-sm text-brand-gray">{t("productsTabSubtitle")}</p>
          </div>
          <Button asChild>
            <Link href="/seller/products/new">{t("newProduct")}</Link>
          </Button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("colProduct")}</TableHead>
                <TableHead>{t("colStatus")}</TableHead>
                <TableHead>{t("colVariants")}</TableHead>
                <TableHead>{t("colFromPrice")}</TableHead>
                <TableHead>{t("colStock")}</TableHead>
                <TableHead className="text-right">{t("colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-brand-gray">
                    {t("noProducts")}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-[200px] font-medium">{p.nameEn}</TableCell>
                    <TableCell>
                      <StatusPill status={p.status} />
                    </TableCell>
                    <TableCell>{p.variantCount}</TableCell>
                    <TableCell className="font-mono text-xs">${p.minPriceUsd}</TableCell>
                    <TableCell>{p.stockUnits}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/seller/products/${p.id}/edit`}>{t("edit")}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
