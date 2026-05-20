"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Props = {
  average?: number;
  reviewCount?: number;
  className?: string;
  /** Overlay on product thumbnail (white pill). */
  variant?: "overlay" | "inline";
};

/** Supplier-style rating slot: score when reviews exist, otherwise "no ratings yet". */
export function ProductRatingMini({ average, reviewCount = 0, className, variant = "inline" }: Props) {
  const t = useTranslations("product");
  const hasRating = reviewCount > 0 && average != null && !Number.isNaN(average);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 text-xs font-medium",
        hasRating ? "text-brand-gray" : "text-brand-gray/80",
        variant === "overlay" &&
          "rounded-md bg-white/95 px-1.5 py-0.5 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <Star
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          hasRating ? "fill-yellow-400 text-yellow-400" : "fill-none text-brand-gray/50",
        )}
        aria-hidden
      />
      {hasRating ? (
        <span className="tabular-nums text-brand-dark">{average.toFixed(1)}</span>
      ) : (
        <span className="truncate text-[10px] leading-tight sm:text-xs">{t("noRatingYet")}</span>
      )}
    </span>
  );
}
