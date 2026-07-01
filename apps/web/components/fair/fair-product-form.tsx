"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FAIR_NEW_CATEGORY_ID } from "@nxinmall/constants";
import { fairProductCreateSchema } from "@nxinmall/validators";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
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
import { cn } from "@/lib/utils";

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

function collectFormErrors(errors: FieldErrors<FormValues> | undefined): string[] {
  if (!errors) return [];
  const messages: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    if ("message" in node && typeof (node as { message?: unknown }).message === "string") {
      const message = (node as { message: string }).message;
      if (!messages.includes(message)) messages.push(message);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item));
      return;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "ref") continue;
      walk(value);
    }
  }

  walk(errors);
  return messages;
}

function invalidClass(hasError: boolean) {
  return hasError ? "border-destructive focus-visible:ring-destructive/30" : "";
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  const [validationSummary, setValidationSummary] = useState<string[]>([]);
  const [descriptionImageError, setDescriptionImageError] = useState<string | undefined>();
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
        {
          sku: "",
          priceAmount: "",
          minOrderQty: 1,
          unit: "UNIT",
          stockQty: 0,
          variantLabel: "",
          variantImageUrl: "",
        },
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

  const multiVariant = variantFields.length > 1;

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control: form.control,
    name: "images",
  });

  function onInvalid(fieldErrors: FieldErrors<FormValues>) {
    const messages = collectFormErrors(fieldErrors);
    setValidationSummary(messages);
    toast.error(messages[0] ?? t("productValidationError"));
  }

  async function onSubmit(values: FormValues) {
    setValidationSummary([]);
    setDescriptionImageError(undefined);

    if (descriptionImageUrl.trim() && !isValidHttpUrl(descriptionImageUrl.trim())) {
      const message = t("invalidImageUrl");
      setDescriptionImageError(message);
      setValidationSummary([message]);
      toast.error(message);
      return;
    }
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
      const parts = message.split("; ").map((part) => part.trim()).filter(Boolean);
      setValidationSummary(parts.length > 0 ? parts : [message]);
      form.setError("root", { message });
      toast.error(parts[0] ?? message);
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
      {validationSummary.length > 0 ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">{t("productValidationError")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validationSummary.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {errors.root?.message && validationSummary.length === 0 ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errors.root.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>{t("productNamePt")}</Label>
        <Input
          className={invalidClass(Boolean(errors.name?.pt?.message))}
          {...form.register("name.pt")}
        />
        {errors.name?.pt?.message ? (
          <p className="text-sm text-destructive">{errors.name.pt.message}</p>
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
          onChange={(url) => {
            setDescriptionImageUrl(url);
            setDescriptionImageError(undefined);
          }}
          error={descriptionImageError}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("category")}</Label>
          <select
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              invalidClass(Boolean(errors.categoryId?.message)),
            )}
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
                className={invalidClass(Boolean(errors.newCategoryName?.message))}
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
              appendVariant({
                sku: "",
                priceAmount: "",
                minOrderQty: 1,
                unit: "UNIT",
                stockQty: 0,
                variantLabel: "",
                variantImageUrl: "",
              })
            }
          >
            {t("addVariant")}
          </Button>
        </div>
        {variantFields.map((field, index) => (
          <div
            key={field.id}
            className={cn(
              "grid gap-3 rounded-lg border p-4 sm:grid-cols-2",
              errors.variants?.[index] ? "border-destructive/50 bg-destructive/5" : "border-border",
            )}
          >
            <input
              type="hidden"
              {...form.register(`variants.${index}.minOrderQty`, { valueAsNumber: true })}
            />
            {multiVariant ? (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label>{t("variantLabel")}</Label>
                  <Input
                    placeholder={t("variantLabelPlaceholder")}
                    className={invalidClass(Boolean(errors.variants?.[index]?.variantLabel?.message))}
                    {...form.register(`variants.${index}.variantLabel`)}
                  />
                  {errors.variants?.[index]?.variantLabel?.message ? (
                    <p className="text-sm text-destructive">
                      {errors.variants[index]?.variantLabel?.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <ImageUrlOrUploadField
                    label={t("variantImage")}
                    hint={t("variantImageHint")}
                    purpose="product"
                    value={form.watch(`variants.${index}.variantImageUrl`) ?? ""}
                    onChange={(url) =>
                      form.setValue(`variants.${index}.variantImageUrl`, url, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                    error={errors.variants?.[index]?.variantImageUrl?.message}
                  />
                </div>
              </>
            ) : null}
            <div className="space-y-2">
              <Label>{t("sku")}</Label>
              <Input
                className={invalidClass(Boolean(errors.variants?.[index]?.sku?.message))}
                {...form.register(`variants.${index}.sku`)}
              />
              {errors.variants?.[index]?.sku?.message ? (
                <p className="text-sm text-destructive">{errors.variants[index]?.sku?.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t("priceBrl")}</Label>
              <Input
                inputMode="decimal"
                placeholder="0.59"
                className={invalidClass(Boolean(errors.variants?.[index]?.priceAmount?.message))}
                {...form.register(`variants.${index}.priceAmount`)}
              />
              <p className="text-xs text-brand-gray">{t("priceBrlHint")}</p>
              {errors.variants?.[index]?.priceAmount?.message ? (
                <p className="text-sm text-destructive">
                  {errors.variants[index]?.priceAmount?.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>{t("stockQty")}</Label>
              <Input
                type="number"
                className={invalidClass(Boolean(errors.variants?.[index]?.stockQty?.message))}
                {...form.register(`variants.${index}.stockQty`, {
                  valueAsNumber: true,
                  setValueAs: (value) => {
                    if (value === "" || value === null || value === undefined) return 0;
                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? 0 : parsed;
                  },
                })}
              />
              {errors.variants?.[index]?.stockQty?.message ? (
                <p className="text-sm text-destructive">{errors.variants[index]?.stockQty?.message}</p>
              ) : null}
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
          <div
            key={field.id}
            className={cn(
              "space-y-3 rounded-lg border p-4",
              errors.images?.[index]?.url?.message ? "border-destructive/50 bg-destructive/5" : "border-border",
            )}
          >
            <input type="hidden" {...form.register(`images.${index}.kind`)} />
            <ImageUrlOrUploadField
              label={t("imageUrl")}
              purpose="product"
              value={form.watch(`images.${index}.url`) ?? ""}
              onChange={(url) =>
                form.setValue(`images.${index}.url`, url, { shouldValidate: true, shouldDirty: true })
              }
              error={errors.images?.[index]?.url?.message}
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
