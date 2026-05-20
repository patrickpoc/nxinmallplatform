"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { setPortalMode } from "@/lib/actions/portal-mode";
import type { PortalMode } from "@/lib/portal/portal-mode";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "header" | "sidebar";
  className?: string;
};

export function PortalModeSwitch({ variant = "header", className }: Props) {
  const t = useTranslations("sellerPortal");
  const { data: session, update } = useSession();
  const router = useRouter();

  const role = session?.user?.role;
  const portalMode = session?.user?.portalMode ?? "buyer";

  async function switchTo(mode: PortalMode) {
    const result = await setPortalMode(mode);
    if (!result.ok) {
      if (result.error === "NOT_SELLER" || result.error === "NO_COMPANY") {
        router.push("/account/company/setup");
      }
      return;
    }
    await update({ portalMode: mode });
    if (mode === "seller") {
      router.push("/seller/dashboard");
    } else {
      router.push("/");
    }
    router.refresh();
  }

  if (!session?.user) return null;

  if (role !== "SELLER") {
    return (
      <Button
        type="button"
        variant={variant === "header" ? "outline" : "default"}
        size="sm"
        className={cn(variant === "sidebar" && "w-full", className)}
        onClick={() => router.push("/account/company/setup")}
      >
        {t("startSelling")}
      </Button>
    );
  }

  if (portalMode === "seller") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(variant === "sidebar" && "w-full", className)}
        onClick={() => void switchTo("buyer")}
      >
        {t("backToMarketplace")}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant === "header" ? "outline" : "default"}
      size="sm"
      className={cn(variant === "sidebar" && "w-full", className)}
      onClick={() => void switchTo("seller")}
    >
      {t("sellerMode")}
    </Button>
  );
}
