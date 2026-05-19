import { prisma } from "@nxinmall/database";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ProductCard, type ProductCardData } from "@/components/marketplace/product-card";
import { SortSelect } from "@/components/marketplace/sort-select";
import { productListInclude, productNameContainsWhere, type ProductListRow } from "@/lib/product-listing";
import { AnimatedGrid, AnimatedGridItem } from "@/components/motion/animated-grid";
import { ChevronRight, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartPriceCurrency } from "@/lib/cart/types";

export const dynamic = "force-dynamic";

type Search = { category?: string; q?: string; sort?: string };

function catLabel(nameJson: unknown, locale: string): string {
  const o = nameJson as Record<string, string> | null;
  return o?.[locale] ?? o?.en ?? "—";
}

export default async function ProductsPage({ params, searchParams }: { params: { locale: string }; searchParams: Search }) {
  const t = await getTranslations("productsPage");
  const locale = params.locale;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const nameWhere = q ? productNameContainsWhere(q) : {};

  let categoryIds: string[] = [];
  let activeCat: { id: string; name: unknown; parentId: string | null } | null = null;
  let parentCatId: string | null = null;
  let parentCatName: unknown = null;
  let subcategories: { id: string; slug: string; name: unknown }[] = [];

  if (searchParams.category) {
    const cat = await prisma.category.findUnique({
      where: { id: searchParams.category },
      select: {
        id: true,
        name: true,
        parentId: true,
        children: { select: { id: true, slug: true, name: true }, orderBy: { slug: "asc" } },
      },
    });
    if (cat) {
      activeCat = cat;
      if (cat.children.length > 0) {
        categoryIds = [cat.id, ...cat.children.map((c) => c.id)];
        subcategories = cat.children;
        parentCatId = cat.id;
        parentCatName = cat.name;
      } else {
        categoryIds = [cat.id];
        if (cat.parentId) {
          const parent = await prisma.category.findUnique({
            where: { id: cat.parentId },
            select: { id: true, name: true },
          });
          if (parent) {
            parentCatId = parent.id;
            parentCatName = parent.name;
          }
          const siblings = await prisma.category.findMany({
            where: { parentId: cat.parentId },
            select: { id: true, slug: true, name: true },
            orderBy: { slug: "asc" },
          });
          subcategories = siblings;
        }
      }
    }
  }

  const sort = searchParams.sort ?? "newest";

  let products: ProductListRow[] = [];
  try {
    products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {}),
        ...(q ? nameWhere : {}),
      },
      take: 48,
      orderBy: { createdAt: "desc" },
      include: productListInclude,
    });
  } catch {
    products = [];
  }

  if (sort === "price_asc" || sort === "price_desc") {
    products.sort((a, b) => {
      const va = a.variants[0];
      const vb = b.variants[0];
      const pa = va?.priceAmount ? Number(va.priceAmount) : va?.priceUsd ? Number(va.priceUsd) : 0;
      const pb = vb?.priceAmount ? Number(vb.priceAmount) : vb?.priceUsd ? Number(vb.priceUsd) : 0;
      return sort === "price_asc" ? pa - pb : pb - pa;
    });
  }

  function toCardData(p: ProductListRow): ProductCardData {
    const loc = locale as "en" | "pt" | "zh";
    const nm = p.name as { en?: string; pt?: string; zh?: string };
    const v = p.variants[0];
    return {
      id: p.id,
      name: nm?.[loc] ?? nm?.en ?? "Product",
      imageUrl: p.images[0]?.url,
      priceAmount: v?.priceAmount ? Number(v.priceAmount) : v?.priceUsd ? Number(v.priceUsd) : 0,
      priceCurrency: ((v?.priceCurrency as string) ?? "USD") as CartPriceCurrency,
      variantId: v?.id,
      unit: v?.unit,
    };
  }

  const currentSort = sort;
  function sortUrl(s: string) {
    const p = new URLSearchParams();
    if (searchParams.category) p.set("category", searchParams.category);
    if (q) p.set("q", q);
    p.set("sort", s);
    return `/products?${p.toString()}`;
  }

  const breadcrumbs = (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-brand-gray">
      <Link href="/" className="hover:text-brand-blue">{t("breadcrumbHome")}</Link>
      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      {parentCatName ? (
        <>
          <Link href={`/products?category=${parentCatId}`} className="hover:text-brand-blue">
            {catLabel(parentCatName, locale)}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          {activeCat && !activeCat.parentId ? null : (
            <span className="text-brand-dark" aria-current="page">
              {activeCat ? catLabel(activeCat.name, locale) : t("title")}
            </span>
          )}
        </>
      ) : (
        <span className="text-brand-dark" aria-current="page">{t("title")}</span>
      )}
    </nav>
  );

  const subcategoryChips = subcategories.length > 0 && (
    <div className="flex flex-wrap gap-3">
      {parentCatId && (
        <Link
          href={`/products?category=${parentCatId}`}
          className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-sm transition-colors ${searchParams.category === parentCatId ? "border-brand-blue bg-brand-blue text-white" : "border-border bg-white text-brand-dark hover:border-brand-blue hover:text-brand-blue"}`}
        >
          {t("all")}
        </Link>
      )}
      {subcategories.map((sub) => (
        <Link
          key={sub.id}
          href={`/products?category=${sub.id}`}
          className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-sm transition-colors ${sub.id === searchParams.category ? "border-brand-blue bg-brand-blue text-white" : "border-border bg-white text-brand-dark hover:border-brand-blue hover:text-brand-blue"}`}
        >
          {catLabel(sub.name, locale)}
        </Link>
      ))}
    </div>
  );

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-16 md:px-6">
        {breadcrumbs}
        <h1 className="text-3xl font-bold text-brand-dark">{t("title")}</h1>
        {parentCatName ? <p className="text-lg font-medium text-brand-blue">{catLabel(parentCatName, locale)}</p> : null}
        {!parentCatName && activeCat ? <p className="text-lg font-medium text-brand-blue">{catLabel(activeCat.name, locale)}</p> : null}
        {subcategoryChips}
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <PackageSearch className="h-16 w-16 text-brand-gray/40" aria-hidden />
          <p className="text-brand-gray">{q ? t("emptySearch") : t("empty")}</p>
          <Button asChild variant="outline" className="btn-press">
            <Link href="/categories">{t("browseCategories")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-16 md:px-6">
      {breadcrumbs}

      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-brand-dark">{t("title")}</h1>
        {parentCatName ? <p className="text-lg font-medium text-brand-blue">{catLabel(parentCatName, locale)}</p> : null}
        {!parentCatName && activeCat ? <p className="text-lg font-medium text-brand-blue">{catLabel(activeCat.name, locale)}</p> : null}
        {q ? <p className="text-sm text-brand-gray">{t("searchingFor", { q })}</p> : null}
        {subcategoryChips}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-brand-gray">{t("showingCount", { count: products.length })}</p>
        <SortSelect
          currentSort={currentSort}
          sortUrls={{
            newest: sortUrl("newest"),
            price_asc: sortUrl("price_asc"),
            price_desc: sortUrl("price_desc"),
          }}
        />
      </div>

      <div data-demo-target="product-grid">
        <AnimatedGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <AnimatedGridItem key={p.id}>
              <ProductCard product={toCardData(p)} />
            </AnimatedGridItem>
          ))}
        </AnimatedGrid>
      </div>
    </div>
  );
}
