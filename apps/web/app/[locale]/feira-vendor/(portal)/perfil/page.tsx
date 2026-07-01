import { auth } from "@/auth";
import { FairBoothProfileForm } from "@/components/fair/fair-booth-profile-form";
import { getFairBoothForVendor } from "@/lib/actions/fair-vendor/profile";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function FairVendorProfilePage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const session = await auth();
  if (!session?.user) redirect(`/${params.locale}/feira-vendor/auth/login`);

  const t = await getTranslations("fairVendor");
  const booth = await getFairBoothForVendor();
  if (!booth) redirect(`/${params.locale}/feira-vendor/auth/register`);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-brand-dark">{t("profileTitle")}</h2>
      <FairBoothProfileForm booth={booth} locale={params.locale} />
    </div>
  );
}
