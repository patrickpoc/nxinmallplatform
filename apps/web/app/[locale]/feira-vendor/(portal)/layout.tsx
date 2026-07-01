import { auth } from "@/auth";
import { FairVendorShell } from "@/components/fair/fair-vendor-shell";
import { prisma } from "@nxinmall/database";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function FairVendorPortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/feira-vendor/auth/login`);
  }

  if (session.user.role !== "FAIR_VENDOR") {
    redirect(`/${locale}/feira-vendor/auth/login`);
  }

  const booth = await prisma.fairBooth.findUnique({
    where: { userId: session.user.id },
    select: { slug: true },
  });

  return (
    <FairVendorShell locale={locale} slug={booth?.slug}>
      {children}
    </FairVendorShell>
  );
}
