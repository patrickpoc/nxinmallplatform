import { FairVendorSignOutButton } from "@/components/fair/fair-vendor-sign-out-button";
import { auth } from "@/auth";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

export default async function FairVendorAuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const session = await auth();

  return (
    <div className={session?.user ? "relative flex flex-1 flex-col items-center justify-center px-4 pb-6 pt-16 sm:px-6 sm:pt-6" : "relative flex flex-1 items-center justify-center p-4 sm:p-6"}>
      {session?.user ? (
        <div className="absolute right-3 top-3 sm:right-6 sm:top-6">
          <FairVendorSignOutButton callbackUrl={`/${params.locale}/feira-vendor/auth/login`} />
        </div>
      ) : null}
      {children}
    </div>
  );
}
