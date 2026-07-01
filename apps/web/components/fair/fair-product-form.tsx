"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FAIR_NEW_CATEGORY_ID } from "@nxinmall/constants";
import { fairProductCreateSchema } from "@nxinmall/validators";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useFieldArray, useForm, type FieldErrors, type UseFormReturn } from "react-hook-form";
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

function VariantExtraImagesFields({
  variantIndex,
  form,
  t,
}: {
  variantIndex: number;
  form: UseFormReturn<FormValues>;
  t: ReturnType<typeof useTranslations<"fairVendor">>;
}) {
  const extraImages = form.watch(`variants.${variantIndex}.variantImageUrls`) ?? [];

  function setExtraImages(urls: string[]) {
    form.setValue(`variants.${variantIndex}.variantImageUrls`, urls, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  function updateImage(imageIndex: number, url: string) {
    const next = [...extraImages];
    next[imageIndex] = url;
    setExtraImages(next);
  }

  function addImage() {
    if (extraImages.length >= 5) return;
    setExtraImages([...extraImages, ""]);
  }

  function removeImage(imageIndex: number) {
    setExtraImages(extraImages.filter((_, i) => i !== imageIndex));
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <div>
        <Label>{t("variantExtraImages")}</Label>
        <p className="mt-1 text-xs text-brand-gray">{t("variantExtraImagesHint")}</p>
      </div>
      {extraImages.map((url, imageIndex) => (
        <div key={`${variantIndex}-extra-${imageIndex}`} className="space-y-2 rounded-md border border-border p-3">
          <ImageUrlOrUploadField
            label={t("imageUrl")}
            purpose="product"
            value={url ?? ""}
            onChange={(nextUrl) => updateImage(imageIndex, nextUrl)}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(imageIndex)}>
            {t("remove")}
          </Button>
        </div>
      ))}
      {extraImages.length < 5 ? (
        <Button type="button" variant="outline" size="sm" onClick={addImage}>
          {t("addVariantImage")}
        </Button>
      ) : null}
    </div>
  );
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
          variantImageUrls: [],
          isStorefrontVariant: true,
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

  function selectStorefrontVariant(index: number) {
    variantFields.forEach((_, i) => {
      form.setValue(`variants.${i}.isStorefrontVariant`, i === index, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  }

  function handleRemoveVariant(index: number) {
    const wasStorefront = form.getValues(`variants.${index}.isStorefrontVariant`);
    removeVariant(index);
    if (wasStorefront) {
      form.setValue("variants.0.isStorefrontVariant", true, { shouldValidate: true, shouldDirty: true });
    }
  }

  function handleAppendVariant() {
    const current = form.getValues("variants");
    appendVariant({
      sku: "",
      priceAmount: "",
      minOrderQty: 1,
      unit: "UNIT",
      stockQty: 0,
      variantLabel: "",
      variantImageUrl: "",
      variantImageUrls: [],
      isStorefrontVariant: false,
    });
    if (current.length === 1 && !current[0]?.isStorefrontVariant) {
      form.setValue("variants.0.isStorefrontVariant", true, { shouldValidate: true, shouldDirty: true });
    }
  }

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
            onClick={handleAppendVariant}
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
                <VariantExtraImagesFields
                  variantIndex={index}
                  form={form}
                  t={t}
                />
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
              <Label>{t("minOrderQty")}</Label>
              <Input
                type="number"
                min={1}
                className={invalidClass(Boolean(errors.variants?.[index]?.minOrderQty?.message))}
                {...form.register(`variants.${index}.minOrderQty`, { valueAsNumber: true })}
              />
              <p className="text-xs text-brand-gray">{t("minOrderQtyHint")}</p>
              {errors.variants?.[index]?.minOrderQty?.message ? (
                <p className="text-sm text-destructive">
                  {errors.variants[index]?.minOrderQty?.message}
                </p>
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
              <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveVariant(index)}>
                {t("remove")}
              </Button>
            ) : null}
          </div>
        ))}

        {multiVariant ? (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <div>
              <h3 className="font-semibold">{t("storefrontImage")}</h3>
              <p className="mt-1 text-xs text-brand-gray">{t("storefrontImageHint")}</p>
            </div>
            {errors.variants?.message ? (
              <p className="text-sm text-destructive">{String(errors.variants.message)}</p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              {variantFields.map((field, index) => {
                const variantLabel = form.watch(`variants.${index}.variantLabel`)?.trim();
                const imageUrl = form.watch(`variants.${index}.variantImageUrl`) ?? "";
                const isSelected = Boolean(form.watch(`variants.${index}.isStorefrontVariant`));
                const displayLabel = variantLabel || `${t("variantLabel")} ${index + 1}`;
                return (
                  <button
                    key={`storefront-${field.id}`}
                    type="button"
                    onClick={() => selectStorefrontVariant(index)}
                    className={cn(
                      "flex min-w-[5rem] flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-colors",
                      isSelected
                        ? "border-brand-blue ring-2 ring-brand-blue/20"
                        : "border-border hover:border-brand-gray/50",
                    )}
                    aria-pressed={isSelected}
                  >
                    <span className="relative block h-16 w-16 overflow-hidden rounded-md bg-white">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt=""
                          fill
                          className="object-contain p-0.5"
                          sizes="64px"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs text-brand-gray">
                          —
                        </span>
                      )}
                    </span>
                    <span className="max-w-[6rem] truncate text-xs font-medium text-brand-dark">
                      {displayLabel}
                    </span>
                    <span className="text-[10px] text-brand-gray">{t("storefrontImageVariant")}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">{t("sharedImages")}</h2>
            <p className="mt-1 text-xs text-brand-gray">{t("sharedImagesHint")}</p>
          </div>
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
            {!multiVariant ? (
              <label className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <input type="checkbox" {...form.register(`images.${index}.isPrimary`)} />
                  <span className="text-sm">{t("imagePrimary")}</span>
                </span>
                <span className="pl-6 text-xs text-brand-gray">{t("imagePrimaryHint")}</span>
              </label>
            ) : null}
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
