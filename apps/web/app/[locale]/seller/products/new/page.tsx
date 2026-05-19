import { getTranslations } from "next-intl/server";

export default async function NewProductPage() {
  const t = await getTranslations("productsPage");
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-brand-dark">Create product</h1>
      <p className="text-sm text-brand-gray">
        Use the seller console or POST `/api/v1/products` with a bearer token (`session.user.id`) until the TipTap editor UI ships.
      </p>
      <p className="text-xs text-brand-gray">{t("title")}</p>
    </div>
  );
}
