import { getTranslations } from "next-intl/server";
import { SellerProductForm } from "@/components/seller/seller-product-form";
import { listSellerCategories } from "@/lib/actions/seller-products";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const t = await getTranslations("sellerPortal.products");
  const categories = await listSellerCategories();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-dark">{t("createTitle")}</h1>
      <p className="text-sm text-brand-gray">{t("createSubtitle")}</p>
      <SellerProductForm categories={categories} />
    </div>
  );
}
