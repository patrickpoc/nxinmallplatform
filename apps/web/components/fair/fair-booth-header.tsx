"use client";

import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useFairCart } from "@/lib/fair/fair-cart-context";

type Props = {
  slug: string;
  boothName: string;
  logoUrl?: string | null;
};

export function FairBoothHeader({ slug, boothName, logoUrl }: Props) {
  const t = useTranslations("fairBooth");
  const { itemCount } = useFairCart();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        <Link href={`/feira/${slug}`} className="flex min-w-0 flex-1 items-center gap-2">
          {logoUrl ? (
            <Image src={logoUrl} alt="" width={32} height={32} className="shrink-0 rounded object-contain" unoptimized />
          ) : null}
          <span className="truncate text-sm font-semibold text-brand-dark sm:text-base">{boothName}</span>
        </Link>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={`/feira/${slug}/checkout`}>
            <ShoppingCart className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">
              {t("cart")} {itemCount > 0 ? `(${itemCount})` : ""}
            </span>
            {itemCount > 0 ? <span className="sm:hidden">({itemCount})</span> : null}
          </Link>
        </Button>
      </div>
    </header>
  );
}
