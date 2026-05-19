import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/${params.locale}/auth/login`);
  }
  const role = session.user.role;
  if (role === "ADMIN") {
    redirect(`/${params.locale}/admin/dashboard`);
  }
  redirect(`/${params.locale}/account/dashboard`);
}
