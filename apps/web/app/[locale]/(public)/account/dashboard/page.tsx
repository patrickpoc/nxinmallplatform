"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Check, Clock, DollarSign, Info, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { loadOrders, type SavedOrder } from "@/lib/account/orders-store";
import { loadProfile } from "@/lib/account/profile-store";

function EmptySection({ title, message }: { title: string; message: string }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold text-brand-dark">{title}</h3>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-5">
        <Info className="h-5 w-5 shrink-0 text-brand-blue" />
        <p className="text-sm text-brand-gray">{message}</p>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccountDashboardPage() {
  const t = useTranslations("account");
  const [orders, setOrders] = useState<SavedOrder[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setOrders(loadOrders());
    const profile = loadProfile();
    if (profile?.name) setUserName(profile.name);
    const interval = setInterval(() => setOrders(loadOrders()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const recent = orders.slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl space-y-8" data-demo-target="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">
          {userName ? `${t("dashboardWelcome")}, ${userName}` : t("dashboardTitle")}
        </h1>
        <p className="text-sm text-brand-gray">{t("dashboardSubtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2" data-demo-target="dashboard-kpis">
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("dashboardSales")}</p>
              <p className="text-3xl font-bold text-brand-dark">0</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("dashboardPurchases")}</p>
              <p className="text-3xl font-bold text-brand-dark">{orders.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div data-demo-target="dashboard-recent-purchases">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-brand-dark">{t("recentPurchases")}</h3>
          {orders.length > 0 && (
            <Link href="/account/purchases" className="text-xs font-medium text-brand-blue hover:underline">
              {t("purchasesTitle")}
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-white px-4 py-8 text-center">
            <Info className="h-6 w-6 text-brand-blue" />
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
                className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-blue">{order.id}</p>
                  <p className="text-xs text-brand-gray">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-dark">{order.totalFormatted}</span>
                  {order.status === "pending" ? (
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <EmptySection title={t("recentSales")} message={t("noSales")} />
      <EmptySection title={t("recentQuestions")} message={t("noQuestions")} />
      <EmptySection title={t("recentAdQuestions")} message={t("noAdQuestions")} />
    </div>
  );
}
