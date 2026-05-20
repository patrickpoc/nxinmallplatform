import { getTranslations } from "next-intl/server";
import { SellerStoreForm } from "@/components/seller/seller-store-form";
import { getSellerCompany } from "@/lib/actions/seller-store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SellerStorePage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("sellerPortal.store");
  const company = await getSellerCompany();

  if (!company) {
    redirect(`/${params.locale}/account/company/setup`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-dark">{t("title")}</h1>
      <p className="text-sm text-brand-gray">{t("subtitle")}</p>
      <SellerStoreForm
        verificationStatus={company.verificationStatus}
        defaultValues={{
          name: company.name,
          legalName: company.legalName ?? "",
          country: company.country,
          type: company.type,
        }}
      />
    </div>
  );
}
