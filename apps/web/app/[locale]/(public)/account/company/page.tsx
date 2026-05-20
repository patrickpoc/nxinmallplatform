import { auth } from "@/auth";
import { StatusPill } from "@/components/brand/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getUserCompany } from "@/lib/actions/company";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountCompanyPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.locale}/auth/login`);
  }

  const t = await getTranslations("account");
  const company = await getUserCompany();

  if (!company) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-bold text-brand-dark">{t("companyTitle")}</h1>
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-brand-gray">{t("companyNoCompany")}</p>
            <Button asChild>
              <Link href="/account/company/setup">{t("companySetupLink")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusKey =
    company.verificationStatus === "APPROVED"
      ? "companyStatusApproved"
      : company.verificationStatus === "REJECTED"
        ? "companyStatusRejected"
        : "companyStatusPending";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("companyTitle")}</h1>
        <p className="text-sm text-brand-gray">{t("companySubtitle")}</p>
      </div>

      <Card className="shadow-card" data-demo-target="seller-company-status">
        <CardHeader>
          <CardTitle className="text-lg">{company.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-brand-gray">{t("companyCountry")}</dt>
              <dd className="text-brand-dark">{company.country}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-brand-gray">{t("companyType")}</dt>
              <dd className="text-brand-dark">{company.type}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="mb-1 text-xs font-semibold uppercase text-brand-gray">{t("companyVerification")}</dt>
              <dd>
                <StatusPill status={company.verificationStatus} />
                <span className="ml-2 text-brand-gray">{t(statusKey)}</span>
              </dd>
            </div>
          </dl>
          <p className="text-brand-gray">{t("companyNextSteps")}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/seller/store">{t("companyEditStore")}</Link>
            </Button>
            {session.user.role === "SELLER" ? (
              <Button asChild size="sm">
                <Link href="/seller/dashboard">{t("companyOpenPortal")}</Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/account/company/setup">{t("companySetupLink")}</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
