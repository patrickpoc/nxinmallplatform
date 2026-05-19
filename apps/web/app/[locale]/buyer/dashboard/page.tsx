import { auth } from "@/auth";

export default async function BuyerDashboardPage() {
  const session = await auth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-dark">Buyer dashboard</h1>
      <p className="text-sm text-brand-gray">Signed in as {session?.user?.email}</p>
    </div>
  );
}
