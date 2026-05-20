"use client";

import { Store } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "inline" | "card";
  className?: string;
};

/** Discrete seller CTA for buyer account pages — hidden for sellers with a company. */
export function SellOnNxinmallCta({ variant = "inline", className }: Props) {
  const t = useTranslations("account");
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (!session?.user) return null;
  if (role === "SELLER") return null;

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-border bg-surface-light/50 px-4 py-4",
          className,
        )}
      >
        <p className="text-sm font-semibold text-brand-dark">{t("sellCardTitle")}</p>
        <p className="mt-1 text-sm text-brand-gray">{t("sellCardBody")}</p>
        <Link
          href="/account/company/setup"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:underline"
        >
          <Store className="h-4 w-4" aria-hidden />
          {t("sellCardLink")}
        </Link>
      </div>
    );
  }

  return (
    <footer
      className={cn(
        "border-t border-border pt-6 text-center text-sm text-brand-gray",
        className,
      )}
    >
      <p className="font-medium text-brand-dark">{t("sellCtaTitle")}</p>
      <p className="mt-1 text-xs">{t("sellCtaBody")}</p>
      <Link
        href="/account/company/setup"
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-blue hover:underline"
      >
        <Store className="h-3.5 w-3.5" aria-hidden />
        {t("sellCtaLink")}
      </Link>
    </footer>
  );
}
