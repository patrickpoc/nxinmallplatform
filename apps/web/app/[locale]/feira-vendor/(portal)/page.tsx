import { auth } from "@/auth";
import { FairRecentOrders } from "@/components/fair/fair-recent-orders";
import { getFairDashboardData } from "@/lib/fair/fair-dashboard-data";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { formatStorefrontMoney } from "@/lib/money-format";

export default async function FairVendorDashboardPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const session = await auth();
  if (!session?.user) redirect(`/${params.locale}/feira-vendor/auth/login`);

  const t = await getTranslations("fairVendor");
  const data = await getFairDashboardData(session.user.id);
  if (!data) redirect(`/${params.locale}/feira-vendor/perfil`);

  const recentOrders = data.recentOrders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand-dark">{t("dashboardTitle")}</h2>
        <p className="text-sm text-brand-gray">{data.boothName}</p>
      </div>

      {!data.isActive ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("storefrontInactive")}{" "}
          <Link href="/feira-vendor/perfil" className="font-medium underline">
            {t("activateStorefront")}
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("metricOrdersToday"), value: data.metrics.ordersToday },
          { label: t("metricPending"), value: data.metrics.pendingOrders },
          { label: t("metricRevenue"), value: formatStorefrontMoney(data.metrics.revenueBrl, "BRL") },
          { label: t("metricActiveProducts"), value: data.metrics.activeProducts },
        ].map((m) => (
          <Card key={m.label} className="shadow-card">
            <CardContent className="p-4">
              <p className="text-xs text-brand-gray">{m.label}</p>
              <p className="mt-1 text-2xl font-bold text-brand-dark">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-brand-dark">{t("recentOrders")}</h3>
        <FairRecentOrders orders={recentOrders} locale={params.locale} boothName={data.boothName} />
      </div>
    </div>
  );
}
