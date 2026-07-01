"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FAIR_NEW_CATEGORY_ID } from "@nxinmall/constants";
import { fairProductCreateSchema } from "@nxinmall/validators";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUrlOrUploadField } from "@/components/fair/image-url-or-upload-field";
import { FairProductDeleteButton } from "@/components/fair/fair-product-delete-button";
import {
  createFairProduct,
  updateFairProduct,
  type FairProductFormInput,
} from "@/lib/actions/fair-vendor/products";

const formSchema = fairProductCreateSchema;

type FormValues = z.infer<typeof formSchema>;

type CategoryOption = { id: string; slug: string; name: unknown };

type Props = {
  categories: CategoryOption[];
  productId?: string;
  defaultValues?: Partial<FormValues>;
};

function labelName(name: unknown): string {
  if (name && typeof name === "object" && "pt" in (name as object)) {
    return String((name as { pt?: string }).pt ?? (name as { en?: string }).en ?? "");
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

function galleryDefaults(defaultValues?: Partial<FormValues>) {
  const gallery = defaultValues?.images?.filter((img) => img.kind === "GALLERY") ?? [];
  return gallery.length > 0
    ? gallery
    : [{ url: "", isPrimary: true, kind: "GALLERY" as const }];
}

function descriptionImageDefault(defaultValues?: Partial<FormValues>) {
  return defaultValues?.images?.find((img) => img.kind === "DESCRIPTION")?.url ?? "";
}

export function FairProductForm({ categories, productId, defaultValues }: Props) {
  const t = useTranslations("fairVendor");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [descriptionImageUrl, setDescriptionImageUrl] = useState(() =>
    descriptionImageDefault(defaultValues),
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "DRAFT",
      name: { pt: "", en: "", zh: "" },
      description: { pt: "", en: "", zh: "" },
      categoryId: categories[0]?.id ?? FAIR_NEW_CATEGORY_ID,
      newCategoryName: "",
      variants: [
        { sku: "", priceAmount: "0.00", minOrderQty: 1, unit: "UNIT", stockQty: 0 },
      ],
      ...defaultValues,
      images: galleryDefaults(defaultValues),
    },
  });

  const categoryId = form.watch("categoryId");
  const isNewCategory = categoryId === FAIR_NEW_CATEGORY_ID;

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: "images",
  });

  function onInvalid() {
    toast.error(t("productValidationError"));
  }

  async function onSubmit(values: FormValues) {
    const galleryImages = values.images
      .filter((img) => img.url.trim())
      .map((img) => ({ ...img, kind: "GALLERY" as const }));
    const images = [
      ...galleryImages,
      ...(descriptionImageUrl.trim()
        ? [{ url: descriptionImageUrl.trim(), isPrimary: false, kind: "DESCRIPTION" as const }]
        : []),
    ];
    const payload = { ...values, images } as FairProductFormInput;

    setSubmitting(true);
    try {
      if (productId) {
        await updateFairProduct(productId, payload);
        toast.success(t("productSaved"));
      } else {
        await createFairProduct(payload);
        toast.success(t("productCreated"));
      }
      router.push("/feira-vendor/produtos");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("productSaveError");
      form.setError("root", { message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const errors = form.formState.errors;

  return (
    <form
      className="w-full max-w-2xl space-y-6"
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
    >
      {errors.root?.message ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>{t("productNamePt")}</Label>
        <Input {...form.register("name.pt")} />
        {fieldError(errors.name as Record<string, unknown>, "pt") ? (
          <p className="text-sm text-destructive">
            {fieldError(errors.name as Record<string, unknown>, "pt")}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("productDescPt")}</Label>
          <Textarea rows={4} {...form.register("description.pt")} />
        </div>
        <ImageUrlOrUploadField
          label={t("descriptionImage")}
          hint={t("descriptionImageHint")}
          purpose="product"
          value={descriptionImageUrl}
          onChange={setDescriptionImageUrl}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("category")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("categoryId")}
          >
            <option value={FAIR_NEW_CATEGORY_ID}>{t("newCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {labelName(c.name)}
              </option>
            ))}
          </select>
          {isNewCategory ? (
            <div className="mt-2 space-y-1">
              <Input
                placeholder={t("newCategoryPlaceholder")}
                {...form.register("newCategoryName")}
              />
              {errors.newCategoryName?.message ? (
                <p className="text-sm text-destructive">{errors.newCategoryName.message}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>{t("status")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...form.register("status")}
          >
            <option value="DRAFT">{t("statusDraft")}</option>
            <option value="ACTIVE">{t("statusActive")}</option>
            <option value="PAUSED">{t("statusPaused")}</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">{t("variants")}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              appendVariant({ sku: "", priceAmount: "0.00", minOrderQty: 1, unit: "UNIT", stockQty: 0 })
            }
          >
            {t("addVariant")}
          </Button>
        </div>
        {variantFields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("sku")}</Label>
              <Input {...form.register(`variants.${index}.sku`)} />
              {fieldError(errors.variants as Record<string, unknown>, `${index}.sku`) ? (
                <p className="text-sm text-destructive">
                  {fieldError(errors.variants as Record<string, unknown>, `${index}.sku`)}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t("priceBrl")}</Label>
              <Input {...form.register(`variants.${index}.priceAmount`)} />
              {fieldError(errors.variants as Record<string, unknown>, `${index}.priceAmount`) ? (
                <p className="text-sm text-destructive">
                  {fieldError(errors.variants as Record<string, unknown>, `${index}.priceAmount`)}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t("stockQty")}</Label>
              <Input type="number" {...form.register(`variants.${index}.stockQty`, { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>{t("unit")}</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...form.register(`variants.${index}.unit`)}
              >
                <option value="UNIT">UNIT</option>
                <option value="KG">KG</option>
                <option value="BOX">BOX</option>
                <option value="PALLET">PALLET</option>
              </select>
            </div>
            {variantFields.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(index)}>
                {t("remove")}
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">{t("images")}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendImage({ url: "", isPrimary: false, kind: "GALLERY" })}
          >
            {t("addImage")}
          </Button>
        </div>
        {imageFields.map((field, index) => (
          <div key={field.id} className="space-y-3 rounded-lg border border-border p-4">
            <ImageUrlOrUploadField
              label={t("imageUrl")}
              purpose="product"
              value={form.watch(`images.${index}.url`) ?? ""}
              onChange={(url) =>
                form.setValue(`images.${index}.url`, url, { shouldValidate: true, shouldDirty: true })
              }
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" {...form.register(`images.${index}.isPrimary`)} />
              <span className="text-sm">{t("imagePrimary")}</span>
            </label>
            {imageFields.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)}>
                {t("remove")}
              </Button>
            ) : null}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : productId ? (
            t("saveProduct")
          ) : (
            t("createProduct")
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={submitting}
          onClick={() => router.push("/feira-vendor/produtos")}
        >
          {t("cancel")}
        </Button>
        {productId ? <FairProductDeleteButton productId={productId} variant="form" /> : null}
      </div>
    </form>
  );
}
