"use client";

import Image from "next/image";
import { Link } from "@/i18n/routing";
import { FairBoothAuthMenu } from "@/components/fair/fair-booth-auth-menu";
import { FairCartHeaderMenu } from "@/components/fair/fair-cart-header-menu";

type Props = {
  slug: string;
  boothName: string;
  logoUrl?: string | null;
};

export function FairBoothHeader({ slug, boothName, logoUrl }: Props) {
  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        <Link href={`/feira/${slug}`} className="flex min-w-0 flex-1 items-center gap-2">
          {logoUrl ? (
            <Image src={logoUrl} alt="" width={32} height={32} className="shrink-0 rounded object-contain" unoptimized />
          ) : null}
          <span className="truncate text-sm font-semibold text-brand-dark sm:text-base">{boothName}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <FairBoothAuthMenu slug={slug} />
          <FairCartHeaderMenu slug={slug} />
        </div>
      </div>
    </header>
  );
}
