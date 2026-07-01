import { auth } from "@/auth";
import { FairProductForm } from "@/components/fair/fair-product-form";
import { amountToPriceInputString } from "@/lib/money-format";
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
  const [booth, categories, product] = await Promise.all([
    prisma.fairBooth.findUnique({
      where: { userId: session.user.id },
      select: { slug: true },
    }),
    prisma.category.findMany({ select: { id: true, slug: true, name: true }, orderBy: { slug: "asc" } }),
    prisma.product.findFirst({
      where: { id: params.id, sellerId: session.user.id, salesChannel: "FAIR" },
      include: { variants: true, images: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  if (!product) notFound();
  if (!booth) redirect(`/${params.locale}/feira-vendor/perfil`);

  const name = product.name as { en?: string; pt?: string; zh?: string };
  const description = (product.description as { en?: string; pt?: string; zh?: string } | null) ?? {
    pt: "",
    en: "",
    zh: "",
  };

  const variantAttrs = product.variants.map(
    (v) =>
      (v.attributes as {
        label?: string;
        imageUrl?: string;
        imageUrls?: string[];
        isStorefront?: boolean;
      } | null) ?? {},
  );
  let storefrontIndex = variantAttrs.findIndex((attrs) => attrs.isStorefront);
  if (storefrontIndex < 0) {
    storefrontIndex = variantAttrs.findIndex((attrs) => attrs.imageUrl?.trim());
    if (storefrontIndex < 0) storefrontIndex = 0;
  }

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
          variants: product.variants.map((v, index) => {
            const attrs = variantAttrs[index] ?? {};
            return {
              sku: v.sku,
              priceAmount: amountToPriceInputString(v.priceAmount),
              minOrderQty: v.minOrderQty,
              unit: v.unit,
              stockQty: v.stockQty,
              variantLabel: attrs.label ?? "",
              variantImageUrl: attrs.imageUrl ?? "",
              variantImageUrls: attrs.imageUrls ?? [],
              isStorefrontVariant: index === storefrontIndex,
            };
          }),
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
