import { auth } from "@/auth";
import { FairVendorLoginForm } from "@/components/fair/fair-vendor-login-form";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

export default async function FairVendorLoginPage({ params }: { params: { locale: string } }) {
  setRequestLocale(params.locale);
  const session = await auth();
  if (session?.user?.role === "FAIR_VENDOR") {
    redirect(`/${params.locale}/feira-vendor`);
  }
  return <FairVendorLoginForm />;
}
