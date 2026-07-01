"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FairVendorSignOutButton } from "@/components/fair/fair-vendor-sign-out-button";

type Props = {
  email: string;
  role: string;
  signOutCallbackUrl: string;
};

export function FairVendorWrongAccount({ email, role, signOutCallbackUrl }: Props) {
  const t = useTranslations("fairVendor");

  return (
    <Card className="mx-auto w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle>{t("wrongAccountTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-brand-gray">{t("wrongAccountBody", { email, role })}</p>
        <FairVendorSignOutButton className="w-full" size="default" callbackUrl={signOutCallbackUrl} />
      </CardContent>
    </Card>
  );
}
