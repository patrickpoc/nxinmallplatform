"use client";

import { ChevronDown, Loader2, LogOut, UserCircle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/routing";

function dashboardHref(role?: string | null): string {
  switch (role) {
    case "FAIR_VENDOR":
      return "/feira-vendor";
    case "SELLER":
      return "/seller/dashboard";
    case "ADMIN":
      return "/admin";
    default:
      return "/account/dashboard";
  }
}

export function FairBoothAuthMenu({ slug }: { slug: string }) {
  const t = useTranslations("fairBooth");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(pathname || "/")}`;

  if (status === "loading") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center" aria-busy="true" aria-label={t("myAccount")}>
        <Loader2 className="h-4 w-4 animate-spin text-brand-gray" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Button variant="outline" size="sm" asChild className="shrink-0">
        <Link href={loginHref}>{tNav("login")}</Link>
      </Button>
    );
  }

  const dashboard = dashboardHref(session.user.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0" aria-label={t("myAccount")}>
          <UserCircle className="h-5 w-5" aria-hidden />
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate text-xs font-normal text-brand-gray">
          {session.user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={dashboard}>{t("dashboard")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: `/${locale}/feira/${slug}` })}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden />
          {tNav("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
