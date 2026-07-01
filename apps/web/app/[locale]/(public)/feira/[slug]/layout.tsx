import { getFairBoothBySlug } from "@/lib/fair/fair-booth";
import { FairCartProvider } from "@/lib/fair/fair-cart-context";
import { FairBoothHeader } from "@/components/fair/fair-booth-header";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

export default async function FairBoothLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string; slug: string };
}) {
  setRequestLocale(params.locale);
  const booth = await getFairBoothBySlug(params.slug);
  if (!booth) notFound();

  return (
    <FairCartProvider slug={params.slug}>
      <div className="min-h-screen bg-surface-light">
        <FairBoothHeader slug={params.slug} boothName={booth.companyName} logoUrl={booth.logoUrl} />
        <main className="mx-auto max-w-5xl px-3 pb-10 sm:px-4 sm:pb-12">{children}</main>
      </div>
    </FairCartProvider>
  );
}
