"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Props = {
  callbackUrl?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function FairVendorSignOutButton({
  callbackUrl,
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const t = useTranslations("nav");
  const locale = useLocale();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => signOut({ callbackUrl: callbackUrl ?? `/${locale}/feira-vendor/auth/login` })}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {t("signOut")}
    </Button>
  );
}
