import { getTranslations } from "next-intl/server";

export default async function AboutPage() {
  const t = await getTranslations("about");
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-16 md:px-6">
      <h1 className="text-3xl font-bold text-brand-dark">{t("title")}</h1>
      <p className="text-brand-gray">{t("body")}</p>
    </div>
  );
}
