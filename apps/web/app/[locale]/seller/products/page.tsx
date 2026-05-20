import { prisma } from "@nxinmall/database";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { StatusPill } from "@/components/brand/status-pill";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("sellerPortal.products");
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.locale}/auth/login`);
  }
  const rows = await prisma.product.findMany({
    where: { sellerId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { variants: { take: 1 } },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">{t("listTitle")}</h1>
          <p className="text-sm text-brand-gray">{t("listSubtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/seller/products/new">{t("newProduct")}</Link>
        </Button>
      </div>
      <Table data-demo-target="seller-products-list">
        <TableHeader>
          <TableRow>
            <TableHead>{t("nameEn")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("priceUsd")}</TableHead>
            <TableHead className="text-right">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{(p.name as { en?: string }).en ?? "—"}</TableCell>
              <TableCell>
                <StatusPill status={p.status} />
              </TableCell>
              <TableCell className="font-mono text-xs">{p.variants[0]?.priceUsd?.toString() ?? "—"}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/seller/products/${p.id}/edit`}>{t("edit")}</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
