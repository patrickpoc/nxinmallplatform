import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { NxinLogo } from "@/components/brand/nxin-logo";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  return (
    <div className="flex min-h-screen flex-col bg-surface-light">
      <header className="border-b border-border bg-white px-4 py-4 md:px-6">
        <Link href="/" className="inline-flex">
          <NxinLogo />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">{children}</div>
    </div>
  );
}
