"use client";

import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock, CreditCard, QrCode, Barcode, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { BuyerKpiCard } from "@/components/account/buyer-kpi-card";
import { SellOnNxinmallCta } from "@/components/account/sell-on-nxinmall-cta";
import { buildBuyerLedger, computeBuyerStats } from "@/lib/account/buyer-stats";
import { loadOrders } from "@/lib/account/orders-store";
import type { CurrencyCode } from "@/lib/currency-preference";
import { useCurrency } from "@/lib/hooks/use-currency";

function asCurrency(code: string): CurrencyCode {
  return code === "BRL" ? "BRL" : "USD";
}

const LOCALE_MAP: Record<string, string> = { en: "en-US", pt: "pt-BR", zh: "zh-CN" };

function PaymentIcon({ type }: { type: string }) {
  if (type === "pix") return <QrCode className="h-4 w-4" />;
  if (type === "boleto") return <Barcode className="h-4 w-4" />;
  if (type === "credit_card") return <CreditCard className="h-4 w-4" />;
  return <CreditCard className="h-4 w-4" />;
}

export function FinancialLedger() {
  const t = useTranslations("account");
  const locale = useLocale();
  const { format } = useCurrency();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [orders, setOrders] = useState(() => (userId ? loadOrders(userId) : []));

  const refresh = useCallback(() => {
    if (userId) setOrders(loadOrders(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const stats = useMemo(() => computeBuyerStats(orders), [orders]);
  const ledger = useMemo(() => buildBuyerLedger(orders), [orders]);

  const fmt = (amount: number, currency: string) => format(amount, asCurrency(currency), locale);

  const paymentLabel = (type: string) => {
    if (type === "pix" || type === "boleto" || type === "credit_card" || type === "unknown") {
      return t(`paymentType.${type}`);
    }
    return type;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("financialBuyerTitle")}</h1>
        <p className="text-sm text-brand-gray">{t("financialBuyerSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 min-[400px]:gap-4 lg:grid-cols-3">
        <BuyerKpiCard
          label={t("financialTotalSpent")}
          value={fmt(stats.totalSpent, stats.primaryCurrency)}
          valueTitle={fmt(stats.totalSpent, stats.primaryCurrency)}
          icon={<Wallet className="h-5 w-5 text-green-600" />}
          iconClassName="bg-green-100"
          className="min-[400px]:col-span-2 lg:col-span-1"
        />
        <BuyerKpiCard
          label={t("financialPending")}
          value={stats.pendingCount}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          iconClassName="bg-amber-100"
          valueClassName="text-amber-700"
        />
        <BuyerKpiCard
          label={t("financialCompleted")}
          value={stats.approvedCount}
          icon={<Check className="h-5 w-5 text-green-600" />}
          iconClassName="bg-green-50"
          valueClassName="text-green-700"
        />
      </div>

      {stats.byPayment.length > 0 ? (
        <div>
          <h2 className="mb-3 text-sm font-bold text-brand-dark">{t("financialByMethod")}</h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {stats.byPayment.map((row) => (
              <Card key={row.method} className="shadow-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <PaymentIcon type={row.method} />
                  <div>
                    <p className="text-xs font-medium text-brand-gray">{paymentLabel(row.method)}</p>
                    <p className="text-sm font-bold text-brand-dark">{fmt(row.total, stats.primaryCurrency)}</p>
                    <p className="text-xs text-brand-gray">
                      {t("financialOrderCount", { count: String(row.count) })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-card">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light">
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colDate")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colOrder")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colPayment")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colValue")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-brand-gray">
                  <p>{t("financialBuyerEmpty")}</p>
                  <Link href="/products" className="mt-2 inline-block text-sm font-medium text-brand-blue hover:underline">
                    {t("browseProducts")}
                  </Link>
                </td>
              </tr>
            ) : (
              ledger.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-brand-gray">
                    {new Date(row.date).toLocaleDateString(LOCALE_MAP[locale] ?? "en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-blue">{row.id}</p>
                    <p className="max-w-[200px] truncate text-xs text-brand-gray">{row.itemSummary}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-brand-dark">
                      <PaymentIcon type={row.paymentLabel} />
                      {paymentLabel(row.paymentLabel)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-brand-dark">
                    {fmt(row.amount, row.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {row.status === "pending" ? (
                      <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
                        <Clock className="h-3 w-3" />
                        {t("statusPending")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-green-300 bg-green-50 text-green-700">
                        <Check className="h-3 w-3" />
                        {t("statusApproved")}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SellOnNxinmallCta />
    </div>
  );
}
