import { getTranslations } from "next-intl/server";

export default async function VerifyEmailPage() {
  const t = await getTranslations("auth");
  return (
    <div className="w-full max-w-lg rounded-lg border border-border bg-white p-8 text-center shadow-card">
      <h1 className="text-2xl font-bold text-brand-dark">{t("verifyTitle")}</h1>
      <p className="mt-3 text-sm text-brand-gray">{t("verifyHint")}</p>
    </div>
  );
}
