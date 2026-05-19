import { getTranslations } from "next-intl/server";

export default async function FinancialPage() {
  const t = await getTranslations("account");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">{t("financialTitle")}</h1>

      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light">
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colDate")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colValue")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colSaleItem")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-brand-gray">
                {t("financialEmpty")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
