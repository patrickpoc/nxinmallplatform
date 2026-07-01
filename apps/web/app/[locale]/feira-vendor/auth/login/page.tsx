import { auth } from "@/auth";
import { FairVendorLoginForm } from "@/components/fair/fair-vendor-login-form";
import { FairVendorWrongAccount } from "@/components/fair/fair-vendor-wrong-account";
import { fairVendorRoleLabel } from "@/lib/fair/fair-vendor-role-label";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function FairVendorLoginPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const session = await auth();
  if (session?.user?.role === "FAIR_VENDOR") {
    redirect(`/${params.locale}/feira-vendor`);
  }
  if (session?.user && session.user.role !== "FAIR_VENDOR") {
    return (
      <FairVendorWrongAccount
        email={session.user.email ?? ""}
        role={await fairVendorRoleLabel(session.user.role)}
        signOutCallbackUrl={`/${params.locale}/feira-vendor/auth/login`}
      />
    );
  }
  return <FairVendorLoginForm />;
}
