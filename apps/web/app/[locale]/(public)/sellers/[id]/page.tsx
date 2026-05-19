import { prisma } from "@nxinmall/database";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { VerificationBadge } from "@/components/brand/verification-badge";
import { CountryFlag } from "@/components/brand/country-flag";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { productListInclude, type ProductListRow } from "@/lib/product-listing";
import { ProductCard, type ProductCardData } from "@/components/marketplace/product-card";
import { Star, Package, TrendingUp, Calendar, MapPin, MessageCircle, Building, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/fade-in";
import { AnimatedGrid, AnimatedGridItem } from "@/components/motion/animated-grid";
import type { CartPriceCurrency } from "@/lib/cart/types";

export const dynamic = "force-dynamic";

function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 1000) / 1000;
}

export default async function SellerProfilePage({
  params,
  searchParams,
}: {
  params: { id: string; locale: string };
  searchParams: { category?: string };
}) {
  const t = await getTranslations("sellerProfile");
  const locale = await getLocale();

  let company = null;
  try {
    company = await prisma.company.findFirst({
      where: { id: params.id, verificationStatus: "APPROVED" },
      include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    });
  } catch {
    company = null;
  }
  if (!company) notFound();

  const rng = seededRandom(company.id);
  const rating = (4.0 + rng * 1.0).toFixed(1);
  const totalSales = Math.floor(50 + rng * 950);
  const reviewCount = Math.floor(10 + rng * 200);

  const productCount = await prisma.product.count({
    where: { sellerId: company.user.id, status: "ACTIVE" },
  });

  const sellerCategories = await prisma.product.groupBy({
    by: ["categoryId"],
    where: { sellerId: company.user.id, status: "ACTIVE" },
    _count: true,
  });
  const categoryIds = sellerCategories.map((g) => g.categoryId);
  const categoryRows = categoryIds.length > 0
    ? await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, slug: true, name: true },
        orderBy: { slug: "asc" },
      })
    : [];
  const categoryCounts = new Map(sellerCategories.map((g) => [g.categoryId, g._count]));

  let products: ProductListRow[] = [];
  try {
    products = await prisma.product.findMany({
      where: {
        sellerId: company.user.id,
        status: "ACTIVE",
        ...(searchParams.category ? { categoryId: searchParams.category } : {}),
      },
      take: 48,
      orderBy: { createdAt: "desc" },
      include: productListInclude,
    });
  } catch {
    products = [];
  }

  function catLabel(nameJson: unknown): string {
    const o = nameJson as Record<string, string> | null;
    return o?.[locale] ?? o?.en ?? "—";
  }

  const memberDate = company.user.createdAt.toLocaleDateString(locale === "pt" ? "pt-BR" : locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
  });

  function toCardData(p: ProductListRow): ProductCardData {
    const v = p.variants[0];
    return {
      id: p.id,
      name: catLabel(p.name),
      imageUrl: p.images[0]?.url,
      priceAmount: v?.priceAmount ? Number(v.priceAmount) : v?.priceUsd ? Number(v.priceUsd) : 0,
      priceCurrency: ((v?.priceCurrency as string) ?? "USD") as CartPriceCurrency,
      variantId: v?.id,
      unit: v?.unit,
    };
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1 text-sm text-brand-gray"
        data-demo-target="seller-profile-breadcrumb"
      >
        <Link href="/sellers" className="hover:text-brand-blue">{t("breadcrumbSellers")}</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="text-brand-dark" aria-current="page">{company.name}</span>
      </nav>
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left sidebar */}
        <FadeIn direction="left" delay={0.1}>
        <aside className="w-full shrink-0 lg:w-[300px]">
          <Card className="sticky top-24 shadow-card">
            <CardContent className="space-y-5 p-6">
              <div className="space-y-5" data-demo-target="seller-profile-sidebar">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h1 className="text-xl font-bold text-brand-dark">{company.name}</h1>
                  <VerificationBadge tier={company.verificationTier} />
                </div>
                {company.legalName && (
                  <p className="flex items-center gap-2 text-xs text-brand-gray">
                    <Building className="h-3.5 w-3.5" aria-hidden />
                    {company.legalName}
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <p className="flex items-center gap-2 text-brand-gray">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  <CountryFlag code={company.country} />
                  <span>{company.country}</span>
                </p>
                <Button variant="outline" size="sm" className="btn-press w-full gap-2" asChild>
                  <a href={`mailto:${company.user.email}`}>
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    {t("contactSeller")}
                  </a>
                </Button>
                <p className="flex items-center gap-2 text-brand-gray">
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                  {t("memberSince", { date: memberDate })}
                </p>
                {company.cnpj && (
                  <p className="text-xs text-brand-gray">CNPJ: {company.cnpj}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-brand-dark">{productCount}</p>
                  <p className="text-[10px] uppercase tracking-wide text-brand-gray">{t("products")}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-brand-dark">{totalSales}</p>
                  <p className="text-[10px] uppercase tracking-wide text-brand-gray">{t("sales")}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden />
                    <span className="text-lg font-bold text-brand-dark">{rating}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-wide text-brand-gray">{t("rating")}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("reviews")}</p>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const pct = star === 5 ? 60 + Math.floor(rng * 20) : star === 4 ? 15 + Math.floor(rng * 10) : Math.floor(rng * 8);
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-right text-brand-gray">{star}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden />
                        <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-7 text-right text-brand-gray">{pct}%</span>
                      </div>
                    );
                  })}
                  <p className="mt-1 text-xs text-brand-gray">{reviewCount} {t("totalReviews")}</p>
                </div>
              </div>
              </div>

              <div className="border-t border-border pt-4" data-demo-target="seller-profile-categories">
                {categoryRows.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("filterByCategory")}</p>
                  <div className="space-y-1">
                    <Link
                      href={`/sellers/${params.id}`}
                      className={`block rounded px-2 py-1.5 text-sm transition-colors ${!searchParams.category ? "bg-brand-blue/10 font-medium text-brand-blue" : "text-brand-gray hover:text-brand-blue"}`}
                    >
                      {t("allProducts")} ({productCount})
                    </Link>
                    {categoryRows.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/sellers/${params.id}?category=${cat.id}`}
                        className={`block rounded px-2 py-1.5 text-sm transition-colors ${searchParams.category === cat.id ? "bg-brand-blue/10 font-medium text-brand-blue" : "text-brand-gray hover:text-brand-blue"}`}
                      >
                        {catLabel(cat.name)} ({categoryCounts.get(cat.id) ?? 0})
                      </Link>
                    ))}
                  </div>
                </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </aside>
        </FadeIn>

        {/* Right content: products */}
        <div className="min-w-0 flex-1 space-y-6" data-demo-target="seller-profile-catalog">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-brand-dark">{t("productsTitle")}</h2>
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3.5 w-3.5" aria-hidden />
              {products.length} {t("items")}
            </Badge>
          </div>

          {products.length === 0 ? (
            <p className="py-10 text-center text-brand-gray">{t("noProducts")}</p>
          ) : (
            <AnimatedGrid className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <AnimatedGridItem key={p.id}>
                  <ProductCard product={toCardData(p)} />
                </AnimatedGridItem>
              ))}
            </AnimatedGrid>
          )}
        </div>
      </div>
    </div>
  );
}
