import { prisma } from "@nxinmall/database";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { StatusPill } from "@/components/brand/status-pill";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function SellerProductsPage({ params }: { params: { locale: string } }) {
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-dark">My products</h1>
        <Button asChild>
          <Link href="/seller/products/new">New product</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name (EN)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>From price</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
