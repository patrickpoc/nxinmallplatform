"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/lib/wishlist/wishlist-context";
import type { WishlistItem } from "@/lib/wishlist/types";
import { cn } from "@/lib/utils";

type ToggleWishlistButtonProps = {
  item: WishlistItem;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
};

export function ToggleWishlistButton({ item, className, size = "icon" }: ToggleWishlistButtonProps) {
  const t = useTranslations("product");
  const { isInWishlist, addItem, removeItem } = useWishlist();
  const active = isInWishlist(item.productId);

  function handleClick() {
    if (active) {
      removeItem(item.productId);
      toast.success(t("removeFromFavorites"));
    } else {
      addItem(item);
      toast.success(t("addToFavorites"));
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={cn("shrink-0", className)}
      aria-label={active ? t("removeFromFavorites") : t("addToFavorites")}
      aria-pressed={active}
      onClick={handleClick}
    >
      <Heart
        className={cn("h-5 w-5 transition-colors", active ? "fill-red-500 text-red-500" : "text-brand-gray")}
        aria-hidden
      />
    </Button>
  );
}
