import { FairCheckoutPageClient } from "@/components/fair/fair-checkout-page-client";
import { getFairBoothBySlug } from "@/lib/fair/fair-booth";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function FairCheckoutPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(params.locale);
  const booth = await getFairBoothBySlug(params.slug);
  if (!booth) notFound();

  return (
    <FairCheckoutPageClient
      slug={params.slug}
      locale={params.locale}
      boothPix={{
        pixKey: booth.pixKey,
        pixBeneficiaryName: booth.pixBeneficiaryName,
        pixImageUrl: booth.pixImageUrl,
      }}
    />
  );
}
