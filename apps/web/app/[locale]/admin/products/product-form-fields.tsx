import { getTranslations } from "next-intl/server";
import type { Category } from "@nxinmall/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const UNITS = ["KG", "TON", "UNIT", "BOX", "PALLET"] as const;

const selectClass = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type ProductFormValues = {
  nameEn: string;
  namePt: string;
  nameZh: string;
  descEn: string;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED";
  imageUrl: string;
  priceAmount: string;
  priceCurrency: "USD" | "BRL";
  stockQty: number;
  unit: (typeof UNITS)[number];
};

type ProductFormFieldsProps = {
  locale: string;
  categories: Pick<Category, "id" | "name">[];
  action: (formData: FormData) => Promise<void>;
  cancelHref: string;
  submitLabel: string;
  productId?: string;
  initial?: Partial<ProductFormValues>;
  deleteAction?: (formData: FormData) => Promise<void>;
};

export async function ProductFormFields({
  locale,
  categories,
  action,
  cancelHref,
  submitLabel,
  productId,
  initial,
  deleteAction,
}: ProductFormFieldsProps) {
  const t = await getTranslations("admin");

  function labelName(nameJson: unknown): string {
    const o = nameJson as Record<string, string> | null;
    return o?.en ?? "—";
  }

  const v: ProductFormValues = {
    nameEn: initial?.nameEn ?? "",
    namePt: initial?.namePt ?? "",
    nameZh: initial?.nameZh ?? "",
    descEn: initial?.descEn ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    status: initial?.status ?? "ACTIVE",
    imageUrl: initial?.imageUrl ?? "",
    priceAmount: initial?.priceAmount ?? "99",
    priceCurrency: initial?.priceCurrency ?? "USD",
    stockQty: initial?.stockQty ?? 10,
    unit: initial?.unit ?? "UNIT",
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <form action={action} className="space-y-6">
        <input type="hidden" name="locale" value={locale} />
        {productId ? <input type="hidden" name="productId" value={productId} /> : null}

        <div className="space-y-2">
          <Label htmlFor="nameEn">{t("productFormNameEn")}</Label>
          <Input id="nameEn" name="nameEn" required defaultValue={v.nameEn} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="namePt">{t("productFormNamePt")}</Label>
          <Input id="namePt" name="namePt" defaultValue={v.namePt} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameZh">{t("productFormNameZh")}</Label>
          <Input id="nameZh" name="nameZh" defaultValue={v.nameZh} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descEn">{t("productFormDescEn")}</Label>
          <Input id="descEn" name="descEn" defaultValue={v.descEn} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">{t("productFormCategory")}</Label>
          <select id="categoryId" name="categoryId" className={selectClass} defaultValue={v.categoryId} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {labelName(c.name)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">{t("productFormStatus")}</Label>
          <select id="status" name="status" className={selectClass} defaultValue={v.status}>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PAUSED">PAUSED</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imageUrl">{t("productFormImageUrl")}</Label>
          <Input id="imageUrl" name="imageUrl" type="url" placeholder="https://…" defaultValue={v.imageUrl} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="priceAmount">{t("productFormPriceUsd")}</Label>
            <Input id="priceAmount" name="priceAmount" required defaultValue={v.priceAmount} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceCurrency">{t("productFormCurrency")}</Label>
            <select id="priceCurrency" name="priceCurrency" className={selectClass} defaultValue={v.priceCurrency}>
              <option value="USD">USD</option>
              <option value="BRL">BRL</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stockQty">{t("productFormStock")}</Label>
            <Input id="stockQty" name="stockQty" type="number" min={0} required defaultValue={v.stockQty} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">{t("productFormUnit")}</Label>
          <select id="unit" name="unit" className={selectClass} defaultValue={v.unit}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit">{submitLabel}</Button>
          <Button type="button" variant="outline" asChild>
            <Link href={cancelHref}>{t("productFormCancel")}</Link>
          </Button>
        </div>
      </form>

      {deleteAction && productId ? (
        <form action={deleteAction} className="border-t border-border pt-6">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="productId" value={productId} />
          <Button type="submit" variant="destructive">
            {t("productFormDelete")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
