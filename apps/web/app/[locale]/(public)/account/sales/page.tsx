import { getTranslations } from "next-intl/server";

export default async function SalesPage() {
  const t = await getTranslations("account");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">{t("salesTitle")}</h1>

      <div className="rounded-lg border border-border bg-white px-4 py-8 text-center text-sm text-brand-gray shadow-card">
        {t("salesEmpty")}
      </div>
    </div>
  );
}
