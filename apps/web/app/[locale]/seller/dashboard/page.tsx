import { auth } from "@/auth";
import { SellerDashboardTabs } from "@/components/seller/seller-dashboard-tabs";
import { getUserCompany } from "@/lib/actions/company";
import { getSellerDashboardData } from "@/lib/seller/seller-dashboard-data";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerDashboardPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("sellerPortal.dashboard");
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${params.locale}/auth/login`);
  }

  const [data, company] = await Promise.all([
    getSellerDashboardData(session.user.id),
    getUserCompany(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("title")}</h1>
        <p className="mt-1 text-sm text-brand-gray">{t("subtitle")}</p>
      </div>
      <SellerDashboardTabs data={data} showSetupBanner={!company} />
    </div>
  );
}
