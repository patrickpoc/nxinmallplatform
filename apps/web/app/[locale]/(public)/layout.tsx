import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { getPublicHeaderCategories } from "@/lib/layout/public-categories";

export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const categories = await getPublicHeaderCategories();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader categories={categories} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
