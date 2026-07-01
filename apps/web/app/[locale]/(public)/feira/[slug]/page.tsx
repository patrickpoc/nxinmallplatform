import { prisma } from "@nxinmall/database";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { FairProductCard } from "@/components/fair/fair-product-card";
import { FairFiltersBar } from "@/components/fair/fair-filters-bar";
import { productNameContainsWhere } from "@/lib/product-listing";
import { getFairBoothBySlug } from "@/lib/fair/fair-booth";
import type { CartPriceCurrency } from "@/lib/cart/types";

export const dynamic = "force-dynamic";

type Search = {
  category?: string;
  q?: string;
  sort?: string;
};

function catLabel(nameJson: unknown, locale: string): string {
  const o = nameJson as Record<string, string> | null;
  return o?.[locale] ?? o?.pt ?? o?.en ?? "—";
}

export default async function FairBoothPage({
  params,
  searchParams,
}: {
  params: { locale: string; slug: string };
  searchParams: Search;
}) {
  setRequestLocale(params.locale);
  const t = await getTranslations("fairBooth");
  const locale = params.locale;

  const booth = await getFairBoothBySlug(params.slug);
  if (!booth) notFound();

  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const nameWhere = q ? productNameContainsWhere(q) : {};
  const sort = searchParams.sort ?? "newest";

  let products = await prisma.product.findMany({
    where: {
      sellerId: booth.userId,
      salesChannel: "FAIR",
      status: "ACTIVE",
      ...(searchParams.category ? { categoryId: searchParams.category } : {}),
      ...(q ? nameWhere : {}),
    },
    include: {
      variants: true,
      images: { where: { kind: "GALLERY" }, orderBy: { sortOrder: "asc" }, take: 1 },
      category: { select: { id: true, name: true } },
    },
    orderBy: sort === "newest" ? { createdAt: "desc" } : undefined,
    take: 100,
  });

  if (sort === "price_asc" || sort === "price_desc") {
    products.sort((a, b) => {
      const pa = Number(a.variants[0]?.priceAmount ?? 0);
      const pb = Number(b.variants[0]?.priceAmount ?? 0);
      return sort === "price_asc" ? pa - pb : pb - pa;
    });
  }

  const sellerCategories = await prisma.product.groupBy({
    by: ["categoryId"],
    where: { sellerId: booth.userId, salesChannel: "FAIR", status: "ACTIVE" },
    _count: true,
  });
  const categoryRows =
    sellerCategories.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: sellerCategories.map((g) => g.categoryId) } },
          select: { id: true, name: true },
          orderBy: { slug: "asc" },
        })
      : [];

  const categoryChips = categoryRows.map((c) => ({
    id: c.id,
    label: catLabel(c.name, locale),
  }));

  return (
    <div className="space-y-4 py-3 sm:py-4">
      {booth.bannerUrl ? (
        <div
          className="h-24 rounded-lg bg-cover bg-center sm:h-32"
          style={{ backgroundImage: `url(${booth.bannerUrl})` }}
        />
      ) : null}
      <div>
        <h1 className="text-xl font-bold text-brand-dark sm:text-2xl">{booth.companyName}</h1>
        <p className="text-sm text-brand-gray">{t("storeSubtitle")}</p>
      </div>

      <FairFiltersBar
        slug={params.slug}
        categories={categoryChips}
        current={{
          q: searchParams.q,
          category: searchParams.category,
          sort: searchParams.sort,
        }}
      />

      {products.length === 0 ? (
        <p className="py-12 text-center text-brand-gray">{t("noProducts")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:gap-4">
          {products.map((p) => {
            const nameObj = p.name as { pt?: string; en?: string };
            const name = nameObj?.pt ?? nameObj?.en ?? "—";
            const v = p.variants.slice().sort((a, b) => Number(a.priceAmount) - Number(b.priceAmount))[0];
            const primaryImage = p.images.find((i) => i.isPrimary) ?? p.images[0];
            return (
              <FairProductCard
                key={p.id}
                slug={params.slug}
                product={{
                  id: p.id,
                  name,
                  imageUrl: primaryImage?.url,
                  priceAmount: v ? Number(v.priceAmount) : 0,
                  priceCurrency: (v?.priceCurrency as CartPriceCurrency) ?? "BRL",
                  variantId: v?.id,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
