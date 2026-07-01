import { auth } from "@/auth";
import { fairProductLabel } from "@/lib/fair/fair-dashboard-data";
import { prisma } from "@nxinmall/database";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/brand/status-pill";
import { FairProductDeleteButton } from "@/components/fair/fair-product-delete-button";
import { Plus } from "lucide-react";

export default async function FairVendorProductsPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const session = await auth();
  if (!session?.user) redirect(`/${params.locale}/feira-vendor/auth/login`);

  const t = await getTranslations("fairVendor");
  const products = await prisma.product.findMany({
    where: { sellerId: session.user.id, salesChannel: "FAIR" },
    orderBy: { updatedAt: "desc" },
    include: { variants: true },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-dark">{t("productsTitle")}</h2>
        <Button asChild size="sm">
          <Link href="/feira-vendor/produtos/novo">
            <Plus className="mr-1 h-4 w-4" />
            {t("newProduct")}
          </Link>
        </Button>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-brand-gray">{t("noProducts")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-light text-left text-brand-gray">
              <tr>
                <th className="px-4 py-2">{t("productName")}</th>
                <th className="px-4 py-2">{t("status")}</th>
                <th className="px-4 py-2">{t("priceBrl")}</th>
                <th className="px-4 py-2">{t("stockQty")}</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const v = p.variants[0];
                const price = v ? Number(v.priceAmount).toFixed(2) : "—";
                const stock = v?.stockQty ?? 0;
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{fairProductLabel(p.name)}</td>
                    <td className="px-4 py-2">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-2">R$ {price}</td>
                    <td className="px-4 py-2">{stock}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/feira-vendor/produtos/${p.id}/editar`}
                          className="text-brand-blue hover:underline"
                        >
                          {t("edit")}
                        </Link>
                        <FairProductDeleteButton productId={p.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
