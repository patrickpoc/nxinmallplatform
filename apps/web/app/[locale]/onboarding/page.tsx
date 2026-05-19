"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { completeOnboarding } from "@/lib/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  tradeLicenseUrl: z.string().url().optional().or(z.literal("")),
  taxIdUrl: z.string().url().optional().or(z.literal("")),
  categoryIdsRaw: z.string().optional(),
});

type WizardValues = z.infer<typeof wizardSchema>;

/**
 * Five-step company onboarding wizard (single RHF instance, step-wise `trigger` for UX).
 * Step 4 accepts comma-separated category UUIDs (seeded via Prisma) until a tree picker ships.
 */
export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const resolver = useMemo(() => zodResolver(wizardSchema), []);
  const form = useForm<WizardValues>({
    resolver,
    defaultValues: {
      companyCountry: "BR",
      addressCountry: "BR",
      type: "Importer",
      tradeLicenseUrl: "",
      taxIdUrl: "",
      categoryIdsRaw: "",
    },
  });

  const steps = [
    ["name", "legalName", "companyCountry", "type"] as const,
    ["street", "city", "state", "postalCode", "addressCountry"] as const,
    ["tradeLicenseUrl", "taxIdUrl"] as const,
    ["categoryIdsRaw"] as const,
    [] as const,
  ];

  async function nextStep() {
    const fields = steps[step - 1] ?? [];
    const ok = fields.length === 0 ? true : await form.trigger(fields as never);
    if (!ok) {
      return;
    }
    setStep((s) => Math.min(5, s + 1));
  }

  async function submit() {
    const ok = await form.trigger();
    if (!ok) {
      return;
    }
    const v = form.getValues();
    const ids =
      v.categoryIdsRaw
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    const parsedIds = ids.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    await completeOnboarding({
      locale,
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
      categoryIds: parsedIds,
    });
    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <p className="text-sm text-brand-gray">
            Step {step} of 5 — {t(`step${step}` as never)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 ? (
            <>
              <Field label="Company name" {...form.register("name")} />
              <Field label="Legal name" {...form.register("legalName")} />
              <Field label="Company country (ISO-2)" {...form.register("companyCountry")} />
              <Field label="Company type" {...form.register("type")} />
            </>
          ) : null}
          {step === 2 ? (
            <>
              <Field label="Street" {...form.register("street")} />
              <Field label="City" {...form.register("city")} />
              <Field label="State/region" {...form.register("state")} />
              <Field label="Postal code" {...form.register("postalCode")} />
              <Field label="Address country (ISO-2)" {...form.register("addressCountry")} />
            </>
          ) : null}
          {step === 3 ? (
            <>
              <Field label="Trade license URL (optional)" {...form.register("tradeLicenseUrl")} />
              <Field label="Tax ID URL (optional)" {...form.register("taxIdUrl")} />
            </>
          ) : null}
          {step === 4 ? (
            <div className="space-y-2">
              <Label>Category UUIDs (comma-separated)</Label>
              <Input placeholder="uuid, uuid, ..." {...form.register("categoryIdsRaw")} />
              <p className="text-xs text-brand-gray">Leave blank if you do not have IDs yet — you can add interests later.</p>
            </div>
          ) : null}
          {step === 5 ? (
            <div className="rounded-md border border-border bg-surface-light p-4 text-sm text-brand-gray">
              {t("step5")} — confirm and submit your company profile for NxinMall operations review.
            </div>
          ) : null}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
              Back
            </Button>
            {step < 5 ? (
              <Button type="button" onClick={nextStep}>
                {t("next")}
              </Button>
            ) : (
              <Button type="button" onClick={submit}>
                {t("submit")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, ...rest }: { label: string } & import("react").ComponentProps<"input">) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input {...rest} />
    </div>
  );
}
