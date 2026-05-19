import { prisma } from "@nxinmall/database";
import { getTranslations } from "next-intl/server";
import { createDemoProduct } from "../actions";
import { ProductFormFields } from "../product-form-fields";

export const dynamic = "force-dynamic";

export default async function AdminNewProductPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { error?: string };
}) {
  const t = await getTranslations("admin");
  const categories = await prisma.category.findMany({
    orderBy: { slug: "asc" },
    select: { id: true, name: true },
  });

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-brand-dark">{t("productFormTitleNew")}</h1>
        <p className="text-sm text-brand-gray">No categories in database — run migrations and seed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">{t("productFormTitleNew")}</h1>
      {searchParams.error ? <p className="text-sm text-error">{t("productFormError")}</p> : null}
      <ProductFormFields
        locale={params.locale}
        categories={categories}
        action={createDemoProduct}
        cancelHref="/admin/products"
        submitLabel={t("productFormSubmit")}
      />
    </div>
  );
}
