import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { getCachedHeaderCategories } from "@/lib/marketplace/cached-catalog";
import { PackageSearch, Grid3x3, Users, Sparkles, Tractor, Wheat, Cpu, Wrench, Leaf, ShoppingBag } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { HeroBanner } from "./hero-banner";
import { HomeProductRails } from "./home-product-rails";
import { RailSkeleton } from "./rail-skeleton";

export async function MarketplaceHome() {
  const t = await getTranslations("marketplaceHome");
  const locale = await getLocale();
  const catLocaleKey = locale as "en" | "pt" | "zh";
  const headerCategories = await getCachedHeaderCategories();
  const categories = headerCategories.map(({ id, slug, name }) => ({ id, slug, name }));

  function labelName(nameJson: unknown): string {
    const o = nameJson as Record<string, string> | null;
    return o?.[catLocaleKey] ?? o?.en ?? "—";
  }

  const tileIconClass = "h-5 w-5 shrink-0 text-brand-blue";

  const categoryIcons: Record<string, JSX.Element> = {
    "agri-inputs": <Leaf className="h-5 w-5 text-brand-blue" aria-hidden />,
    equipment: <Tractor className="h-5 w-5 text-brand-blue" aria-hidden />,
    seeds: <Wheat className="h-5 w-5 text-brand-blue" aria-hidden />,
    feed: <ShoppingBag className="h-5 w-5 text-brand-blue" aria-hidden />,
    technology: <Cpu className="h-5 w-5 text-brand-blue" aria-hidden />,
    services: <Wrench className="h-5 w-5 text-brand-blue" aria-hidden />,
  };

  return (
    <div className="bg-white">
      <FadeIn>
        <HeroBanner categories={categories} />
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="border-b border-border py-6">
          <div className="page-container">
            <h2 className="mb-3 text-center text-sm font-semibold uppercase tracking-wide text-brand-gray">
              {t("categoriesStrip")}
            </h2>
            <div className="grid grid-cols-2 gap-2 pb-1 sm:grid-cols-3 sm:gap-3 md:flex md:flex-wrap md:justify-center">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.id}`}
                  className="flex snap-start items-center gap-2 whitespace-nowrap rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-brand-dark shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-blue hover:text-brand-blue hover:shadow-md"
                >
                  {categoryIcons[c.slug] ?? <Grid3x3 className="h-5 w-5 text-brand-blue" aria-hidden />}
                  <span>{labelName(c.name)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      <Suspense
        fallback={
          <>
            <section className="border-b border-border bg-surface-light/40 py-10">
              <div className="page-container">
                <RailSkeleton
                  title={t("railTopSellers")}
                  scrollPrevLabel={t("carouselPrev")}
                  scrollNextLabel={t("carouselNext")}
                />
              </div>
            </section>
            <section className="border-b border-border py-10">
              <div className="page-container">
                <RailSkeleton
                  title={t("railSponsored")}
                  scrollPrevLabel={t("carouselPrev")}
                  scrollNextLabel={t("carouselNext")}
                />
              </div>
            </section>
            <section className="border-b border-border bg-surface-light/40 py-10">
              <div className="page-container">
                <RailSkeleton
                  title={t("railRecentlyAdded")}
                  scrollPrevLabel={t("carouselPrev")}
                  scrollNextLabel={t("carouselNext")}
                />
              </div>
            </section>
          </>
        }
      >
        <HomeProductRails />
      </Suspense>

      <FadeIn delay={0.3}>
        <section className="mx-auto max-w-6xl space-y-4 px-4 py-10 md:px-6">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-brand-gray">{t("quickLinks")}</h2>
          <div className="grid justify-center gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/products" as const, icon: <Sparkles className={tileIconClass} aria-hidden />, title: t("tileNew"), desc: t("tileNewDesc") },
              { href: "/categories" as const, icon: <Grid3x3 className={tileIconClass} aria-hidden />, title: t("tileCategories"), desc: t("tileCategoriesDesc") },
              { href: "/products" as const, icon: <PackageSearch className={tileIconClass} aria-hidden />, title: t("tileCatalog"), desc: t("tileCatalogDesc") },
              { href: "/sellers" as const, icon: <Users className={tileIconClass} aria-hidden />, title: t("tileSellers"), desc: t("tileSellersDesc") },
            ].map((tile) => (
              <Link key={tile.title} href={tile.href}>
                <Card className="h-full shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                  <CardContent className="flex items-start gap-3 p-4">
                    {tile.icon}
                    <div>
                      <p className="font-semibold text-brand-dark">{tile.title}</p>
                      <p className="text-xs text-brand-gray">{tile.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
