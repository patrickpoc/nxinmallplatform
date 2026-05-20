"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isSellerSetupAccountPath } from "@/lib/seller/seller-profile-gate-paths";

type Props = {
  locale: string;
  role: string;
  hasCompany: boolean;
  children: React.ReactNode;
};

/** Redirects SELLER without company to setup except allowlisted account routes. */
export function SellerAccountGate({ locale, role, hasCompany, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (role !== "SELLER" || hasCompany) return;

    const prefix = `/${locale}`;
    const pathWithoutLocale = pathname.startsWith(prefix)
      ? pathname.slice(prefix.length) || "/"
      : pathname;

    if (!isSellerSetupAccountPath(pathWithoutLocale)) {
      router.replace(`${prefix}/account/company/setup`);
    }
  }, [role, hasCompany, locale, pathname, router]);

  return <>{children}</>;
}
