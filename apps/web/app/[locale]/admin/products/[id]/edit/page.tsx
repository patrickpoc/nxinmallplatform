import { DEMO_PLATFORM_SELLER_EMAIL } from "@nxinmall/constants";
import { prisma } from "@nxinmall/database";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { deleteDemoProduct, updateDemoProduct } from "../../actions";
import { ProductFormFields } from "../../product-form-fields";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
  searchParams,
}: {
  params: { locale: string; id: string };
  searchParams: { error?: string };
}) {
  const t = await getTranslations("admin");
  const demo = await prisma.user.findUnique({
    where: { email: DEMO_PLATFORM_SELLER_EMAIL },
    select: { id: true },
  });
  if (!demo) {
    notFound();
  }

  const product = await prisma.product.findFirst({
    where: { id: params.id, sellerId: demo.id },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { take: 1, orderBy: { priceUsd: "asc" } },
    },
  });
  if (!product) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { slug: "asc" },
    select: { id: true, name: true },
  });

  if (categories.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-brand-dark">{t("productFormTitleEdit")}</h1>
        <p className="text-sm text-brand-gray">No categories in database — run migrations and seed.</p>
      </div>
    );
  }

  const nm = product.name as { en?: string; pt?: string; zh?: string };
  const desc = product.description as { en?: string } | null;

  const initial = {
    nameEn: nm.en ?? "",
    namePt: nm.pt ?? "",
    nameZh: nm.zh ?? "",
    descEn: desc?.en ?? "",
    categoryId: product.categoryId,
    status: product.status as "DRAFT" | "ACTIVE" | "PAUSED",
    imageUrl: product.images[0]?.url ?? "",
    priceAmount: product.variants[0]?.priceAmount?.toString() ?? product.variants[0]?.priceUsd?.toString() ?? "0",
    priceCurrency: (product.variants[0]?.priceCurrency as "USD" | "BRL" | undefined) ?? "USD",
    stockQty: product.variants[0]?.stockQty ?? 0,
    unit: product.variants[0]?.unit ?? "UNIT",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">{t("productFormTitleEdit")}</h1>
      {searchParams.error ? <p className="text-sm text-error">{t("productFormError")}</p> : null}
      <ProductFormFields
        locale={params.locale}
        categories={categories}
        action={updateDemoProduct}
        cancelHref="/admin/products"
        submitLabel={t("productFormSubmit")}
        productId={product.id}
        initial={initial}
        deleteAction={deleteDemoProduct}
      />
    </div>
  );
}
