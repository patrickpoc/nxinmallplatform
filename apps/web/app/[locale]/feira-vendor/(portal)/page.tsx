import { auth } from "@/auth";
import { getFairDashboardData } from "@/lib/fair/fair-dashboard-data";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { StatusPill } from "@/components/brand/status-pill";

export default async function FairVendorDashboardPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const session = await auth();
  if (!session?.user) redirect(`/${params.locale}/feira-vendor/auth/login`);

  const t = await getTranslations("fairVendor");
  const data = await getFairDashboardData(session.user.id);
  if (!data) redirect(`/${params.locale}/feira-vendor/perfil`);

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
          { label: t("metricRevenue"), value: `R$ ${data.metrics.revenueBrl.toFixed(2)}` },
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
        {data.recentOrders.length === 0 ? (
          <p className="text-sm text-brand-gray">{t("noOrders")}</p>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {data.recentOrders.map((o) => (
                <div key={o.id} className="rounded-lg border border-border bg-white p-4 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs text-brand-gray">{o.id.slice(0, 8)}…</p>
                    <StatusPill status={o.status} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-brand-dark">{o.guestName ?? "—"}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-brand-gray">{o.createdAt.toLocaleDateString(params.locale)}</span>
                    <span className="font-semibold">R$ {o.totalBrl.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
            <table className="w-full text-sm">
              <thead className="bg-surface-light text-left text-brand-gray">
                <tr>
                  <th className="px-4 py-2">{t("orderId")}</th>
                  <th className="px-4 py-2">{t("orderCustomer")}</th>
                  <th className="px-4 py-2">{t("orderTotal")}</th>
                  <th className="px-4 py-2">{t("orderStatus")}</th>
                  <th className="px-4 py-2">{t("orderDate")}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-4 py-2 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                    <td className="px-4 py-2">{o.guestName ?? "—"}</td>
                    <td className="px-4 py-2">R$ {o.totalBrl.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-4 py-2 text-brand-gray">
                      {o.createdAt.toLocaleDateString(params.locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
