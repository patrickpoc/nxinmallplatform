import type { ReactNode } from "react";
import { prisma } from "@nxinmall/database";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  let categories: { id: string; slug: string; name: unknown; children?: { id: string; slug: string; name: unknown }[] }[] = [];
  try {
    categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        children: {
          select: { id: true, slug: true, name: true },
          orderBy: { slug: "asc" },
        },
      },
    });
  } catch {
    categories = [];
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
