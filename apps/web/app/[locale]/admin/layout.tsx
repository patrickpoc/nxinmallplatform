import { auth } from "@/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.locale}/auth/login`);
  }
  if (session.user.role !== "ADMIN") {
    redirect(`/${params.locale}/dashboard`);
  }
  const t = await getTranslations("admin");

  return (
    <div className="page-container py-8 md:py-10">
      <nav className="mb-8 flex gap-2 overflow-x-auto border-b border-border pb-4 text-sm font-medium [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
        <AdminNavLink href="/admin/dashboard" label={t("navDashboard")} />
        <AdminNavLink href="/admin/verification" label={t("navVerification")} />
        <AdminNavLink href="/admin/products" label={t("navProducts")} />
      </nav>
      {children}
    </div>
  );
}

function AdminNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-brand-dark hover:bg-surface-light hover:text-brand-blue"
    >
      {label}
    </Link>
  );
}
