import { prisma, type Company } from "@nxinmall/database";
import { getTranslations } from "next-intl/server";
import { approveCompany, rejectCompany } from "@/lib/actions/admin-verification";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AdminVerificationPage({ params }: { params: { locale: string } }) {
  const t = await getTranslations("admin");
  let rows: Company[] = [];
  try {
    rows = await prisma.company.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
    });
  } catch {
    rows = [];
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">{t("verificationTitle")}</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium text-brand-dark">{c.name}</TableCell>
              <TableCell>{c.country}</TableCell>
              <TableCell>{c.type}</TableCell>
              <TableCell className="space-x-2 text-right">
                <form action={approveCompany.bind(null, c.id, params.locale)} className="inline">
                  <Button type="submit" size="sm">
                    {t("approve")}
                  </Button>
                </form>
                <form action={rejectCompany.bind(null, c.id, params.locale)} className="inline">
                  <Button type="submit" size="sm" variant="destructive">
                    {t("reject")}
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
