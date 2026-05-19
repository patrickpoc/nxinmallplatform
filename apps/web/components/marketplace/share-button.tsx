"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton() {
  const t = useTranslations("product");

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("shareCopied"));
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <Button variant="outline" size="sm" className="btn-press shrink-0 gap-1.5" onClick={handleShare}>
      <Share2 className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">{t("shareLink")}</span>
    </Button>
  );
}
