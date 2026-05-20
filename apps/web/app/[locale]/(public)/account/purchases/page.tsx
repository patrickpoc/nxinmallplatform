"use client";

import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Check, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SellOnNxinmallCta } from "@/components/account/sell-on-nxinmall-cta";
import { orderAmount } from "@/lib/account/buyer-stats";
import { loadOrders, confirmOrder, removeOrder, type SavedOrder } from "@/lib/account/orders-store";
import type { CurrencyCode } from "@/lib/currency-preference";
import { useCurrency } from "@/lib/hooks/use-currency";

const LOCALE_MAP: Record<string, string> = { en: "en-US", pt: "pt-BR", zh: "zh-CN" };

export default function PurchasesPage() {
  const t = useTranslations("account");
  const locale = useLocale();
  const { data: session } = useSession();
  const { format } = useCurrency();
  const userId = session?.user?.id;
  const [orders, setOrders] = useState<SavedOrder[]>([]);

  const formatOrderTotal = (order: SavedOrder) => {
    const amount =
      typeof order.totalAmount === "number" && !Number.isNaN(order.totalAmount)
        ? order.totalAmount
        : orderAmount(order);
    const currency = (order.currency === "BRL" ? "BRL" : "USD") as CurrencyCode;
    return format(amount, currency, locale);
  };

  const refresh = useCallback(() => {
    if (userId) setOrders(loadOrders(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

  function handleConfirm(orderId: string) {
    if (!userId) return;
    confirmOrder(userId, orderId);
    refresh();
    toast.success(t("confirmPaymentSuccess"));
  }

  function handleRemove(orderId: string) {
    if (!userId) return;
    if (!window.confirm(t("removePurchaseConfirm"))) return;
    if (removeOrder(userId, orderId)) {
      refresh();
      toast.success(t("removePurchaseSuccess"));
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(LOCALE_MAP[locale] ?? "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const itemCount = (o: SavedOrder) => o.items.reduce((sum, i) => sum + i.quantity, 0);

  const statusBadge = (status: string) =>
    status === "pending" ? (
      <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
        <Clock className="h-3 w-3" />
        {t("statusPending")}
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1 border-green-300 bg-green-50 text-green-700">
        <Check className="h-3 w-3" />
        {t("statusApproved")}
      </Badge>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-demo-target="purchases-list">
      <h1 className="text-2xl font-bold text-brand-dark">{t("purchasesTitle")}</h1>

      {orders.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-brand-gray">{t("purchasesEmpty")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-light">
                  <th className="px-4 py-3 font-semibold text-brand-dark">{t("colNumber")}</th>
                  <th className="px-4 py-3 font-semibold text-brand-dark">{t("colDate")}</th>
                  <th className="px-4 py-3 font-semibold text-brand-dark">{t("colItemCount")}</th>
                  <th className="px-4 py-3 font-semibold text-brand-dark">{t("colTotalValue")}</th>
                  <th className="px-4 py-3 font-semibold text-brand-dark">{t("colStatus")}</th>
                  <th className="px-4 py-3 font-semibold text-brand-dark">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-brand-blue">{order.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-brand-gray">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-brand-dark">{itemCount(order)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums text-brand-dark">
                      {formatOrderTotal(order)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(order.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === "pending" && (
                          <Button size="sm" variant="outline" className="btn-press" onClick={() => handleConfirm(order.id)}>
                            {t("confirmPayment")}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="btn-press text-brand-gray hover:text-destructive"
                          onClick={() => handleRemove(order.id)}
                          aria-label={t("removePurchase")}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t("removePurchase")}</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <Card key={order.id} className="shadow-card">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brand-blue">{order.id}</span>
                    {statusBadge(order.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-brand-gray">{t("colDate")}</p>
                      <p className="text-brand-dark">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-brand-gray">{t("colTotalValue")}</p>
                      <p className="font-medium tabular-nums text-brand-dark">{formatOrderTotal(order)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-brand-gray">{itemCount(order)} {t("colItemCount").toLowerCase()}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {order.status === "pending" && (
                      <Button size="sm" variant="outline" className="btn-press flex-1" onClick={() => handleConfirm(order.id)}>
                        {t("confirmPayment")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="btn-press flex-1 text-brand-gray hover:text-destructive"
                      onClick={() => handleRemove(order.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("removePurchase")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <SellOnNxinmallCta />
    </div>
  );
}
