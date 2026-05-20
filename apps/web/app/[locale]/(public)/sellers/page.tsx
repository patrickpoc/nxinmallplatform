import { prisma } from "@nxinmall/database";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CountryDisplay } from "@/components/brand/country-display";
import { VerificationBadge } from "@/components/brand/verification-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Package } from "lucide-react";
import { AnimatedGrid, AnimatedGridItem } from "@/components/motion/animated-grid";

export const dynamic = "force-dynamic";

function seededRandom(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 1000) / 1000;
}

export default async function SellersPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("sellersPage");
  const locale = params.locale;

  let companies: {
    id: string;
    name: string;
    country: string;
    verificationTier: string;
    userId: string;
    user: { _count: { products: number } };
  }[] = [];

  try {
    companies = await prisma.company.findMany({
      where: { verificationStatus: "APPROVED" },
      orderBy: { name: "asc" },
      take: 100,
      select: {
        id: true,
        name: true,
        country: true,
        verificationTier: true,
        userId: true,
        user: {
          select: { _count: { select: { products: true } } },
        },
      },
    }) as any;
  } catch {
    companies = [];
  }

  if (companies.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 md:px-6">
        <h1 className="heading-page">{t("title")}</h1>
        <p className="mt-4 text-brand-gray">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-16 md:px-6" data-demo-target="sellers-page">
      <h1 className="heading-page">{t("title")}</h1>
      <AnimatedGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-demo-target="sellers-grid">
        {companies.map((co) => {
          const rng = seededRandom(co.id);
          const rating = (4.0 + rng * 1.0).toFixed(1);
          const productCount = co.user?._count?.products ?? 0;
          return (
            <AnimatedGridItem key={co.id}>
            <Link href={`/sellers/${co.id}`} className="block">
              <Card className="h-full shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-lg font-semibold text-brand-dark">{co.name}</p>
                    <VerificationBadge tier={co.verificationTier} />
                  </div>
                  <CountryDisplay code={co.country} locale={locale} className="text-sm" />
                  <div className="flex items-center gap-4 border-t border-border pt-3 text-sm">
                    <span className="flex items-center gap-1 text-brand-gray">
                      <Package className="h-4 w-4" aria-hidden />
                      {productCount} {t("products")}
                    </span>
                    <span className="flex items-center gap-1 text-brand-gray">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden />
                      {rating}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
            </AnimatedGridItem>
          );
        })}
      </AnimatedGrid>
    </div>
  );
}
