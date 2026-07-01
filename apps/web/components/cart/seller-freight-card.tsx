"use client";

import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  selected?: boolean;
  className?: string;
};

export function SellerFreightCard({ selected = true, className }: Props) {
  const t = useTranslations("checkout");

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border-2 p-4 text-left",
        selected ? "border-brand-blue bg-brand-blue/5" : "border-border",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 shrink-0 text-brand-blue" />
        <span className="font-semibold text-brand-dark">Vendedor</span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {t("freightSellerCheck")}
        </span>
        <span className="text-xs text-brand-gray">{t("freightSellerTbd")}</span>
      </div>
    </div>
  );
}
