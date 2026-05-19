import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountSidebar } from "@/components/account/account-sidebar";

export default async function AccountLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.locale}/auth/login`);
  }
  if (session.user.role === "ADMIN") {
    redirect(`/${params.locale}/admin/dashboard`);
  }

  return (
    <div className="flex flex-1 flex-col bg-surface-light md:flex-row">
      <AccountSidebar
        locale={params.locale}
        role={session.user.role}
        userId={session.user.id}
        userName={session.user.name ?? null}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
