"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useMemo, useState } from "react";
import { type FieldErrors, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { setPortalMode } from "@/lib/actions/portal-mode";
import type { OnboardingCategoryOption } from "@/lib/actions/company";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const wizardSchema = z.object({
  name: z.string().min(2).max(200),
  legalName: z.string().max(300).optional(),
  companyCountry: z.string().length(2),
  type: z.string().min(1).max(100),
  street: z.string().min(1).max(300),
  city: z.string().min(1).max(120),
  state: z.string().max(120).optional(),
  postalCode: z.string().min(1).max(32),
  addressCountry: z.string().length(2),
  tradeLicenseUrl: z.union([z.string().url(), z.literal("")]).optional(),
  taxIdUrl: z.union([z.string().url(), z.literal("")]).optional(),
  categoryIds: z.array(z.string().min(1)).max(50).default([]),
});

type WizardValues = z.infer<typeof wizardSchema>;

const FIELD_STEP: Record<string, number> = {
  name: 1,
  legalName: 1,
  companyCountry: 1,
  type: 1,
  street: 2,
  city: 2,
  state: 2,
  postalCode: 2,
  addressCountry: 2,
  tradeLicenseUrl: 3,
  taxIdUrl: 3,
  categoryIds: 4,
};

function firstErrorStep(errors: FieldErrors<WizardValues>): number {
  for (const field of Object.keys(FIELD_STEP)) {
    if (errors[field as keyof WizardValues]) {
      return FIELD_STEP[field] ?? 1;
    }
  }
  return 1;
}

function labelName(name: unknown, locale: string): string {
  if (name && typeof name === "object") {
    const o = name as { en?: string; pt?: string; zh?: string };
    return o[locale as keyof typeof o] ?? o.en ?? o.pt ?? "";
  }
  return "";
}

type Props = {
  categories: OnboardingCategoryOption[];
};

export function CompanyOnboardingWizard({ categories }: Props) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const resolver = useMemo(() => zodResolver(wizardSchema), []);
  const form = useForm<WizardValues>({
    resolver,
    defaultValues: {
      companyCountry: "BR",
      addressCountry: "BR",
      type: "Importer",
      tradeLicenseUrl: "",
      taxIdUrl: "",
      categoryIds: [],
    },
  });

  const steps = [
    ["name", "legalName", "companyCountry", "type"] as const,
    ["street", "city", "state", "postalCode", "addressCountry"] as const,
    ["tradeLicenseUrl", "taxIdUrl"] as const,
    [] as const,
    [] as const,
  ];

  const totalSteps = 5;

  async function nextStep() {
    const fields = steps[step - 1] ?? [];
    const ok = fields.length === 0 ? true : await form.trigger(fields as never);
    if (!ok) return;
    if (step === 4) {
      form.setValue("categoryIds", selectedCategories);
    }
    setStep((s) => Math.min(totalSteps, s + 1));
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  async function submit() {
    form.setValue("categoryIds", selectedCategories);
    const ok = await form.trigger();
    if (!ok) {
      const errStep = firstErrorStep(form.formState.errors);
      setStep(errStep);
      const firstKey = Object.keys(form.formState.errors)[0] as keyof WizardValues | undefined;
      const fieldMsg = firstKey ? form.formState.errors[firstKey]?.message : undefined;
      toast.error(typeof fieldMsg === "string" ? fieldMsg : t("errorValidation"));
      return;
    }

    const v = form.getValues();
    setIsSubmitting(true);
    try {
      const result = await completeOnboarding({
        locale,
        asSeller: true,
        name: v.name,
        legalName: v.legalName,
        country: v.companyCountry,
        type: v.type,
        street: v.street,
        city: v.city,
        state: v.state,
        postalCode: v.postalCode,
        addressCountry: v.addressCountry,
        tradeLicenseUrl: v.tradeLicenseUrl || undefined,
        taxIdUrl: v.taxIdUrl || undefined,
        categoryIds: v.categoryIds,
      });

      if (!result.ok) {
        toast.error(result.message ?? t(`error${result.error}` as "errorSERVER"));
        return;
      }

      toast.success(t("success"));
      await setPortalMode("seller");
      await updateSession({ portalMode: "seller", role: "SELLER" });
      router.push("/seller/dashboard");
      router.refresh();
    } catch {
      toast.error(t("errorSERVER"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const values = form.watch();

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>{t("sellerTitle")}</CardTitle>
        <p className="text-sm text-brand-gray">
          {t("stepProgress", { current: String(step), total: String(totalSteps) })} — {t(`step${step}` as never)}
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-light">
          <div
            className="h-full rounded-full bg-brand-blue transition-all"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 ? (
          <>
            <FormField label={t("fieldName")} error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </FormField>
            <FormField label={t("fieldLegalName")} error={form.formState.errors.legalName?.message}>
              <Input {...form.register("legalName")} />
            </FormField>
            <FormField label={t("fieldCompanyCountry")} error={form.formState.errors.companyCountry?.message}>
              <Input maxLength={2} {...form.register("companyCountry")} />
            </FormField>
            <FormField label={t("fieldType")} error={form.formState.errors.type?.message}>
              <Input {...form.register("type")} />
            </FormField>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <FormField label={t("fieldStreet")} error={form.formState.errors.street?.message}>
              <Input {...form.register("street")} />
            </FormField>
            <FormField label={t("fieldCity")} error={form.formState.errors.city?.message}>
              <Input {...form.register("city")} />
            </FormField>
            <FormField label={t("fieldState")} error={form.formState.errors.state?.message}>
              <Input {...form.register("state")} />
            </FormField>
            <FormField label={t("fieldPostalCode")} error={form.formState.errors.postalCode?.message}>
              <Input {...form.register("postalCode")} />
            </FormField>
            <FormField label={t("fieldAddressCountry")} error={form.formState.errors.addressCountry?.message}>
              <Input maxLength={2} {...form.register("addressCountry")} />
            </FormField>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <FormField label={t("fieldTradeLicense")} error={form.formState.errors.tradeLicenseUrl?.message}>
              <Input type="url" placeholder="https://" {...form.register("tradeLicenseUrl")} />
            </FormField>
            <FormField label={t("fieldTaxId")} error={form.formState.errors.taxIdUrl?.message}>
              <Input type="url" placeholder="https://" {...form.register("taxIdUrl")} />
            </FormField>
            <p className="text-xs text-brand-gray">{t("documentsHint")}</p>
          </>
        ) : null}

        {step === 4 ? (
          <div className="space-y-3">
            <p className="text-sm text-brand-gray">{t("categoriesHint")}</p>
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
              {categories.length === 0 ? (
                <p className="text-sm text-brand-gray">{t("categoriesEmpty")}</p>
              ) : (
                categories.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-light",
                      selectedCategories.includes(c.id) && "bg-brand-blue/5",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedCategories.includes(c.id)}
                      onChange={() => toggleCategory(c.id)}
                    />
                    <span>
                      <span className="font-medium text-brand-dark">{labelName(c.name, locale)}</span>
                      {c.parentSlug ? (
                        <span className="ml-1 text-xs text-brand-gray">({c.parentSlug})</span>
                      ) : null}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <div className="space-y-3 rounded-lg border border-border bg-surface-light p-4 text-sm">
            <p className="font-semibold text-brand-dark">{t("reviewTitle")}</p>
            <ul className="space-y-1 text-brand-gray">
              <li>
                <strong>{t("fieldName")}:</strong> {values.name}
              </li>
              <li>
                <strong>{t("fieldCity")}:</strong> {values.city}, {values.addressCountry}
              </li>
              <li>
                <strong>{t("step4")}:</strong> {selectedCategories.length} {t("categoriesSelected")}
              </li>
            </ul>
            <p className="text-xs">{t("reviewNote")}</p>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1 || isSubmitting}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="w-full sm:w-auto"
          >
            {t("back")}
          </Button>
          {step < totalSteps ? (
            <Button type="button" onClick={() => void nextStep()} className="w-full sm:w-auto">
              {t("next")}
            </Button>
          ) : (
            <Button type="button" onClick={() => void submit()} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
