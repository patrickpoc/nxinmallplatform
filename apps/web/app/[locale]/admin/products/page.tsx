import { DEMO_PLATFORM_SELLER_EMAIL } from "@nxinmall/constants";
import { prisma } from "@nxinmall/database";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyDisplay } from "@/components/brand/currency-display";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("admin");
  const demo = await prisma.user.findUnique({
    where: { email: DEMO_PLATFORM_SELLER_EMAIL },
    select: { id: true },
  });

  const products = demo
    ? await prisma.product.findMany({
        where: { sellerId: demo.id },
        orderBy: { updatedAt: "desc" },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { take: 1, orderBy: { priceUsd: "asc" } },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">{t("productsTitle")}</h1>
          <p className="mt-1 text-sm text-brand-gray">{t("productsSubtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">{t("productsNew")}</Link>
        </Button>
      </div>

      {!demo ? (
        <p className="text-sm text-error">Demo seller missing — run `pnpm db:seed`.</p>
      ) : products.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center text-sm text-brand-gray">{t("productsEmpty")}</CardContent>
        </Card>
      ) : (
        <>
        <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-light">
              <tr>
                <th className="px-4 py-3 font-semibold text-brand-dark">{t("productsColImage")}</th>
                <th className="px-4 py-3 font-semibold text-brand-dark">{t("productsColName")}</th>
                <th className="px-4 py-3 font-semibold text-brand-dark">{t("productsColPrice")}</th>
                <th className="px-4 py-3 font-semibold text-brand-dark">{t("productsColStatus")}</th>
                <th className="px-4 py-3 font-semibold text-brand-dark">{t("productsColActions")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const name = (p.name as { en?: string }).en ?? p.id;
                const price = p.variants[0]?.priceUsd ? Number(p.variants[0].priceUsd) : 0;
                const img = p.images[0]?.url;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded bg-surface-light">
                        {img ? (
                          <Image src={img} alt="" fill className="object-contain p-1" unoptimized sizes="48px" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-brand-gray">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-dark">{name}</td>
                    <td className="px-4 py-3">
                      <CurrencyDisplay amountUsd={price} />
                    </td>
                    <td className="px-4 py-3 text-brand-gray">{p.status}</td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/products/${p.id}/edit`}>{t("productsEdit")}</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {products.map((p) => {
            const name = (p.name as { en?: string }).en ?? p.id;
            const price = p.variants[0]?.priceUsd ? Number(p.variants[0].priceUsd) : 0;
            const img = p.images[0]?.url;
            return (
              <Card key={p.id} className="shadow-card">
                <CardContent className="flex gap-4 p-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-light">
                    {img ? (
                      <Image src={img} alt="" fill className="object-contain p-1" unoptimized sizes="64px" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-xs text-brand-gray">—</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-medium text-brand-dark">{name}</p>
                    <p className="text-sm text-brand-gray">
                      <CurrencyDisplay amountUsd={price} />
                    </p>
                    <p className="text-xs text-brand-gray">{p.status}</p>
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                      <Link href={`/admin/products/${p.id}/edit`}>{t("productsEdit")}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
