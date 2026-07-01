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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href={`/feira/${slug}`} className="flex min-w-0 items-center gap-2">
          {logoUrl ? (
            <Image src={logoUrl} alt="" width={32} height={32} className="rounded object-contain" unoptimized />
          ) : null}
          <span className="truncate font-semibold text-brand-dark">{boothName}</span>
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link href={`/feira/${slug}/checkout`}>
            <ShoppingCart className="mr-1 h-4 w-4" />
            {t("cart")} {itemCount > 0 ? `(${itemCount})` : ""}
          </Link>
        </Button>
      </div>
    </header>
  );
}
