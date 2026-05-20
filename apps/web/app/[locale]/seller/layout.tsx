import { auth } from "@/auth";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { SellerShell } from "@/components/seller/seller-shell";
import { getPublicHeaderCategories } from "@/lib/layout/public-categories";
import { getSellerProfileState } from "@/lib/seller/seller-profile-gate";
import { getSellerDashboardData } from "@/lib/seller/seller-dashboard-data";
import { getUserCompany } from "@/lib/actions/company";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function SellerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const session = await auth();
  const locale = params.locale;

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  if (session.user.role !== "SELLER") {
    redirect(`/${locale}/account/company/setup`);
  }

  const profile = await getSellerProfileState(session.user.id);
  if (!profile.isPlatformUnlocked) {
    redirect(`/${locale}/account/company/setup`);
  }

  if ((session.user.portalMode ?? "buyer") !== "seller") {
    redirect(`/${locale}`);
  }

  const categories = await getPublicHeaderCategories();

  const [dashboardData, company] = await Promise.all([
    getSellerDashboardData(session.user.id),
    getUserCompany(),
  ]);

  const sidebarContext = {
    locale,
    companyName: dashboardData.companyName ?? company?.name ?? null,
    companyCountry: company?.country ?? null,
    logoUrl: company?.logoUrl ?? null,
    verificationTier: company?.verificationTier ?? null,
    metrics: {
      totalProducts: dashboardData.metrics.totalProducts,
      activeProducts: dashboardData.metrics.activeProducts,
      pendingOrders: dashboardData.metrics.pendingOrders,
      revenueUsd: dashboardData.metrics.revenueUsd,
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader categories={categories} />
      <main className="flex-1 bg-surface-light">
        <SellerShell locale={locale} sidebarContext={sidebarContext}>
          {children}
        </SellerShell>
      </main>
      <PublicFooter />
    </div>
  );
}
