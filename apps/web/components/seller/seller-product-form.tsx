"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { productCreateSchema, productVariantSchema } from "@nxinmall/validators";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSellerProduct,
  updateSellerProduct,
  type SellerProductFormInput,
} from "@/lib/actions/seller-products";

const formSchema = productCreateSchema.extend({
  variants: z.array(productVariantSchema).min(1),
});

type FormValues = z.infer<typeof formSchema>;

type CategoryOption = { id: string; slug: string; name: unknown };

type Props = {
  categories: CategoryOption[];
  productId?: string;
  defaultValues?: Partial<FormValues> & { imageUrls?: string[] };
};

function labelName(name: unknown): string {
  if (name && typeof name === "object" && "en" in (name as object)) {
    return String((name as { en?: string }).en ?? "");
  }
  return "";
}

function fieldError(errors: Record<string, unknown> | undefined, path: string): string | undefined {
  if (!errors) return undefined;
  const parts = path.split(".");
  let cur: unknown = errors;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  if (cur && typeof cur === "object" && "message" in cur) {
    return String((cur as { message?: unknown }).message);
  }
  return undefined;
}

export function SellerProductForm({ categories, productId, defaultValues }: Props) {
  const t = useTranslations("sellerPortal.products");
  const router = useRouter();
  const { data: session } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const { imageUrls: initialImages, ...formDefaults } = defaultValues ?? {};
  const [imageUrlRows, setImageUrlRows] = useState<string[]>(
    initialImages?.length ? initialImages : [""],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "DRAFT",
      name: { en: "", pt: "", zh: "" },
      categoryId: categories[0]?.id ?? "",
      variants: [
        {
          sku: "",
          priceUsd: "1.00",
          minOrderQty: 1,
          unit: "UNIT",
          stockQty: 0,
        },
      ],
      ...formDefaults,
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "variants" });

  async function onSubmit(values: FormValues) {
    if ((session?.user?.portalMode ?? "buyer") !== "seller") {
      form.setError("root", { message: t("errorSellerMode") });
      return;
    }

    const payload: SellerProductFormInput = {
      ...values,
      imageUrls: imageUrlRows.map((u) => u.trim()).filter(Boolean),
    };

    setSubmitting(true);
    try {
      if (productId) {
        await updateSellerProduct(productId, payload);
      } else {
        await createSellerProduct(payload);
      }
      router.push("/seller/products");
      router.refresh();
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : t("errorSave"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const errors = form.formState.errors;

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="name-en">{t("nameEn")}</Label>
          <Input id="name-en" {...form.register("name.en")} />
          {fieldError(errors.name as Record<string, unknown>, "en") ? (
            <p className="text-sm text-error">{fieldError(errors.name as Record<string, unknown>, "en")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name-pt">{t("namePt")}</Label>
          <Input id="name-pt" {...form.register("name.pt")} />
          {fieldError(errors.name as Record<string, unknown>, "pt") ? (
            <p className="text-sm text-error">{fieldError(errors.name as Record<string, unknown>, "pt")}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name-zh">{t("nameZh")}</Label>
          <Input id="name-zh" {...form.register("name.zh")} />
          {fieldError(errors.name as Record<string, unknown>, "zh") ? (
            <p className="text-sm text-error">{fieldError(errors.name as Record<string, unknown>, "zh")}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoryId">{t("category")}</Label>
          <select
            id="categoryId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("categoryId")}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {labelName(c.name)} ({c.slug})
              </option>
            ))}
          </select>
          {errors.categoryId?.message ? (
            <p className="text-sm text-error">{String(errors.categoryId.message)}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">{t("status")}</Label>
          <select
            id="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("status")}
          >
            <option value="DRAFT">{t("statusDraft")}</option>
            <option value="ACTIVE">{t("statusActive")}</option>
            <option value="PAUSED">{t("statusPaused")}</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-dark">{t("images")}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setImageUrlRows((rows) => (rows.length < 10 ? [...rows, ""] : rows))}
            disabled={imageUrlRows.length >= 10}
          >
            {t("addImage")}
          </Button>
        </div>
        <p className="text-sm text-brand-gray">{t("imagesHint")}</p>
        {imageUrlRows.map((url, index) => (
          <div key={index} className="flex gap-2">
            <Input
              type="url"
              placeholder="https://..."
              value={url}
              onChange={(e) => {
                const next = [...imageUrlRows];
                next[index] = e.target.value;
                setImageUrlRows(next);
              }}
            />
            {imageUrlRows.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setImageUrlRows((rows) => rows.filter((_, i) => i !== index))}
              >
                {t("removeImage")}
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-dark">{t("variants")}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                sku: "",
                priceUsd: "1.00",
                minOrderQty: 1,
                unit: "UNIT",
                stockQty: 0,
              })
            }
          >
            {t("addVariant")}
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border border-border p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("sku")}</Label>
                <Input {...form.register(`variants.${index}.sku`)} />
                {errors.variants?.[index]?.sku?.message ? (
                  <p className="text-sm text-error">{String(errors.variants[index]?.sku?.message)}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t("priceUsd")}</Label>
                <Input {...form.register(`variants.${index}.priceUsd`)} />
                {errors.variants?.[index]?.priceUsd?.message ? (
                  <p className="text-sm text-error">{String(errors.variants[index]?.priceUsd?.message)}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label>{t("minOrderQty")}</Label>
                <Input
                  type="number"
                  {...form.register(`variants.${index}.minOrderQty`, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("stockQty")}</Label>
                <Input
                  type="number"
                  {...form.register(`variants.${index}.stockQty`, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("unit")}</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...form.register(`variants.${index}.unit`)}
                >
                  <option value="KG">KG</option>
                  <option value="TON">TON</option>
                  <option value="UNIT">UNIT</option>
                  <option value="BOX">BOX</option>
                  <option value="PALLET">PALLET</option>
                </select>
              </div>
            </div>
            {fields.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                {t("removeVariant")}
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      {errors.root?.message ? (
        <p className="text-sm text-error">{String(errors.root.message)}</p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? t("saving") : productId ? t("save") : t("create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/seller/products")}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
