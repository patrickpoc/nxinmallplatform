import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { NxinLogo } from "@/components/brand/nxin-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
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
