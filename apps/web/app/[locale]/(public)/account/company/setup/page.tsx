import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserCompany, listOnboardingCategories } from "@/lib/actions/company";
import { CompanyOnboardingWizard } from "@/components/account/company-onboarding-wizard";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

function SetupSkeleton() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-4">
      <div className="h-8 w-2/3 rounded bg-surface-light" />
      <div className="h-64 rounded-xl bg-surface-light" />
    </div>
  );
}

async function SetupContent({ locale }: { locale: string }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  const company = await getUserCompany();
  if (company && session.user.role === "SELLER") {
    redirect(`/${locale}/seller/dashboard`);
  }

  const categories = await listOnboardingCategories();
  const t = await getTranslations("onboarding");
  const showGate = session.user.role === "SELLER" && !company;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {showGate ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="font-semibold text-brand-dark">{t("gateTitle")}</p>
          <p className="mt-1 text-brand-gray">{t("gateBody")}</p>
        </div>
      ) : null}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("sellerTitle")}</h1>
        <p className="text-sm text-brand-gray">{t("sellerSubtitle")}</p>
      </div>
      <CompanyOnboardingWizard categories={categories} />
    </div>
  );
}

export default function CompanySetupPage({ params }: { params: { locale: string } }) {
  return (
    <Suspense fallback={<SetupSkeleton />}>
      <SetupContent locale={params.locale} />
    </Suspense>
  );
}
