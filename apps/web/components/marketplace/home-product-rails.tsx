import { getLocale, getTranslations } from "next-intl/server";
import { getCachedHomeRails, getCachedProductRatings } from "@/lib/marketplace/cached-catalog";
import type { ProductListRow } from "@/lib/product-listing";
import type { CartPriceCurrency } from "@/lib/cart/types";
import { HorizontalRail } from "./horizontal-rail";
import { RailProductCard } from "./rail-product-card";
import { FadeIn } from "@/components/motion/fade-in";

function labelName(nameJson: unknown, locale: string): string {
  const o = nameJson as Record<string, string> | null;
  const key = locale as "en" | "pt" | "zh";
  return o?.[key] ?? o?.en ?? "—";
}

function toRailCard(
  p: ProductListRow,
  locale: string,
  ratingsMap: Map<string, { average: number; count: number }>,
  options?: { isSponsored?: boolean },
) {
  const v = p.variants[0];
  const rating = ratingsMap.get(p.id);
  return {
    id: p.id,
    name: labelName(p.name, locale),
    imageUrl: p.images[0]?.url,
    priceAmount: v?.priceAmount ? Number(v.priceAmount) : v?.priceUsd ? Number(v.priceUsd) : 0,
    priceCurrency: ((v?.priceCurrency as string) ?? "USD") as CartPriceCurrency,
    variantId: v?.id,
    unit: v?.unit,
    ratingAverage: rating?.average,
    reviewCount: rating?.count,
    isSponsored: options?.isSponsored,
  };
}

export async function HomeProductRails() {
  const t = await getTranslations("marketplaceHome");
  const locale = await getLocale();
  const { topSellers, sponsored, recentlyAdded } = await getCachedHomeRails();
  const allRailIds = [...topSellers, ...sponsored, ...recentlyAdded].map((p) => p.id);
  const ratingsMap = await getCachedProductRatings(allRailIds);

  return (
    <>
      <FadeIn delay={0.15}>
        <section className="border-b border-border bg-surface-light/40 py-10">
          <div className="page-container">
            <HorizontalRail
              title={t("railTopSellers")}
              scrollPrevLabel={t("carouselPrev")}
              scrollNextLabel={t("carouselNext")}
            >
              {topSellers.map((p) => (
                <RailProductCard key={p.id} product={toRailCard(p, locale, ratingsMap)} />
              ))}
            </HorizontalRail>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.2}>
        <section className="border-b border-border py-10">
          <div className="page-container">
            <HorizontalRail
              title={t("railSponsored")}
              scrollPrevLabel={t("carouselPrev")}
              scrollNextLabel={t("carouselNext")}
            >
              {sponsored.map((p) => (
                <RailProductCard
                  key={p.id}
                  product={toRailCard(p, locale, ratingsMap, { isSponsored: true })}
                  sponsoredBadgeLabel={t("sponsoredBadge")}
                />
              ))}
            </HorizontalRail>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.25}>
        <section className="border-b border-border bg-surface-light/40 py-10">
          <div className="page-container">
            <HorizontalRail
              title={t("railRecentlyAdded")}
              scrollPrevLabel={t("carouselPrev")}
              scrollNextLabel={t("carouselNext")}
            >
              {recentlyAdded.map((p) => (
                <RailProductCard key={p.id} product={toRailCard(p, locale, ratingsMap)} />
              ))}
            </HorizontalRail>
          </div>
        </section>
      </FadeIn>
    </>
  );
}
