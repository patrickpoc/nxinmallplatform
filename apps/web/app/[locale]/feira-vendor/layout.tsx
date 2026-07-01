import { auth } from "@/auth";
import { PublicFooter } from "@/components/layout/public-footer";
import { FairVendorShell } from "@/components/fair/fair-vendor-shell";
import { prisma } from "@nxinmall/database";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function FairVendorLayout({
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
    return (
      <div className="flex min-h-screen flex-col bg-surface-light">
        <main className="flex flex-1 items-center justify-center p-6">{children}</main>
        <PublicFooter />
      </div>
    );
  }

  if (session.user.role !== "FAIR_VENDOR") {
    redirect(`/${locale}`);
  }

  const booth = await prisma.fairBooth.findUnique({
    where: { userId: session.user.id },
    select: { slug: true },
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-light">
      <main className="flex-1">
        <FairVendorShell locale={locale} slug={booth?.slug}>
          {children}
        </FairVendorShell>
      </main>
      <PublicFooter />
    </div>
  );
}
