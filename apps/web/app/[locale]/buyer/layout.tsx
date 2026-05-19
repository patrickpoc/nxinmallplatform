import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function BuyerLayout({ children, params }: { children: ReactNode; params: { locale: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.locale}/auth/login`);
  }
  if (session.user.role !== "BUYER") {
    redirect(`/${params.locale}/dashboard`);
  }
  return <div className="page-container py-8 md:py-10">{children}</div>;
}
