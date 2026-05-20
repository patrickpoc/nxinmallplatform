import { auth } from "@/auth";
import { prisma } from "@nxinmall/database";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryDisplay } from "@/components/brand/country-display";
import { VerificationBadge } from "@/components/brand/verification-badge";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerProfilePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("sellerPortal.profile");
  const session = await auth();
  const company = await prisma.company.findUnique({
    where: { userId: session!.user!.id },
  });

  if (!company) {
    redirect(`/${params.locale}/account/company/setup`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-dark">{t("title")}</h1>
      <p className="text-sm text-brand-gray">{t("subtitle")}</p>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{company.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <VerificationBadge tier={company.verificationTier} />
          <CountryDisplay code={company.country} locale={params.locale} />
          <p className="text-brand-gray">
            {t("type")}: {company.type}
          </p>
          <Button asChild>
            <Link href={`/sellers/${company.id}`}>{t("viewPublic")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
