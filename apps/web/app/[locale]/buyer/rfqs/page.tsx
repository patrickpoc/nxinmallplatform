import { prisma } from "@nxinmall/database";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { StatusPill } from "@/components/brand/status-pill";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function BuyerRfqsPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.locale}/auth/login`);
  }
  const rows = await prisma.rFQ.findMany({
    where: { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { category: { select: { slug: true } }, _count: { select: { responses: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-dark">My RFQs</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Quotes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>{r.category.slug}</TableCell>
              <TableCell>
                <StatusPill status={r.status} />
              </TableCell>
              <TableCell>{r._count.responses}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
