import { auth } from "@/auth";
import { FairProductForm } from "@/components/fair/fair-product-form";
import { prisma } from "@nxinmall/database";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

export default async function FairVendorEditProductPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(params.locale);
  const session = await auth();
  if (!session?.user) redirect(`/${params.locale}/feira-vendor/auth/login`);

  const t = await getTranslations("fairVendor");
  const [categories, product] = await Promise.all([
    prisma.category.findMany({ select: { id: true, slug: true, name: true }, orderBy: { slug: "asc" } }),
    prisma.product.findFirst({
      where: { id: params.id, sellerId: session.user.id, salesChannel: "FAIR" },
      include: { variants: true, images: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  if (!product) notFound();

  const name = product.name as { en?: string; pt?: string; zh?: string };
  const description = (product.description as { en?: string; pt?: string; zh?: string } | null) ?? {
    pt: "",
    en: "",
    zh: "",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-brand-dark">{t("editProduct")}</h2>
      <FairProductForm
        categories={categories}
        productId={product.id}
        defaultValues={{
          name: { pt: name.pt ?? name.en ?? "", en: name.en ?? "", zh: name.zh ?? "" },
          description,
          categoryId: product.categoryId,
          status: product.status as "DRAFT" | "ACTIVE" | "PAUSED",
          variants: product.variants.map((v) => ({
            sku: v.sku,
            priceAmount: Number(v.priceAmount).toFixed(2),
            minOrderQty: v.minOrderQty,
            unit: v.unit,
            stockQty: v.stockQty,
          })),
          images:
            product.images.length > 0
              ? product.images.map((img) => ({
                  url: img.url,
                  isPrimary: img.isPrimary,
                  kind: img.kind as "GALLERY" | "DESCRIPTION",
                }))
              : [{ url: "", isPrimary: true, kind: "GALLERY" as const }],
        }}
      />
    </div>
  );
}
