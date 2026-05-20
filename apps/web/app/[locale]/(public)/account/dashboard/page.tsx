import { auth } from "@/auth";
import { BuyerDashboard } from "@/components/account/buyer-dashboard";
import { SellerAccountDashboard } from "@/components/account/seller-account-dashboard";
import { getSellerDashboardData } from "@/lib/seller/seller-dashboard-data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage({ params }: { params: { locale: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${params.locale}/auth/login`);
  }

  if (session.user.role === "SELLER") {
    const data = await getSellerDashboardData(session.user.id);
    return <SellerAccountDashboard data={data} />;
  }

  return <BuyerDashboard />;
}
