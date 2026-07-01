"use client";

import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteFairProduct } from "@/lib/actions/fair-vendor/products";

type Props = {
  productId: string;
  variant?: "list" | "form";
};

export function FairProductDeleteButton({ productId, variant = "list" }: Props) {
  const t = useTranslations("fairVendor");
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(t("deleteProductConfirm"))) return;
    setDeleting(true);
    try {
      await deleteFairProduct(productId);
      toast.success(t("deleteProductSuccess"));
      router.push("/feira-vendor/produtos");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("deleteProductError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant === "form" ? "outline" : "ghost"}
      size="sm"
      className={variant === "list" ? "text-destructive hover:text-destructive" : undefined}
      disabled={deleting}
      onClick={() => void handleDelete()}
    >
      {deleting ? t("deleting") : t("deleteProduct")}
    </Button>
  );
}
