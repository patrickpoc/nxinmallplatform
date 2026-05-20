import { prisma } from "@nxinmall/database";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { SellerProductForm } from "@/components/seller/seller-product-form";
import { listSellerCategories } from "@/lib/actions/seller-products";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const t = await getTranslations("sellerPortal.products");
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.locale}/auth/login`);
  }

  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id: params.id, sellerId: session.user.id },
      include: { variants: true, images: { orderBy: { sortOrder: "asc" } } },
    }),
    listSellerCategories(),
  ]);

  if (!product) notFound();

  const name = product.name as { en: string; pt: string; zh: string };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-dark">{t("editTitle")}</h1>
      <SellerProductForm
        productId={product.id}
        categories={categories}
        defaultValues={{
          name: {
            en: name.en ?? "",
            pt: name.pt ?? name.en ?? "",
            zh: name.zh ?? name.en ?? "",
          },
          categoryId: product.categoryId,
          status: product.status as "DRAFT" | "ACTIVE" | "PAUSED",
          variants: product.variants.map((v) => ({
            sku: v.sku,
            priceUsd: v.priceUsd.toString(),
            minOrderQty: v.minOrderQty,
            unit: v.unit as "KG" | "TON" | "UNIT" | "BOX" | "PALLET",
            stockQty: v.stockQty,
          })),
          imageUrls:
            product.images.length > 0
              ? product.images.map((i) => i.url)
              : [""],
        }}
      />
    </div>
  );
}
