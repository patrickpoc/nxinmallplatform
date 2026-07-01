"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { fairBoothProfileSchema } from "@nxinmall/validators";
import type { FairBooth, PixKeyType } from "@nxinmall/database";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateFairBoothProfile } from "@/lib/actions/fair-vendor/profile";
import { useState } from "react";
import { toast } from "sonner";
import { ImageUrlOrUploadField } from "@/components/fair/image-url-or-upload-field";

type Form = z.infer<typeof fairBoothProfileSchema>;

type Props = { booth: FairBooth; locale: string };

export function FairBoothProfileForm({ booth, locale }: Props) {
  const t = useTranslations("fairVendor");
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(fairBoothProfileSchema),
    defaultValues: {
      companyName: booth.companyName,
      legalName: booth.legalName ?? "",
      cnpj: booth.cnpj ?? "",
      country: booth.country,
      type: booth.type,
      street: booth.street ?? "",
      city: booth.city ?? "",
      state: booth.state ?? "",
      postalCode: booth.postalCode ?? "",
      addressCountry: booth.addressCountry ?? "BR",
      phone: booth.phone ?? "",
      whatsappNumber: booth.whatsappNumber ?? "",
      quotationUrl: booth.quotationUrl ?? "",
      pixKey: booth.pixKey ?? "",
      pixKeyType: (booth.pixKeyType as PixKeyType | null) ?? undefined,
      pixBeneficiaryName: booth.pixBeneficiaryName ?? "",
      pixImageUrl: booth.pixImageUrl ?? "",
      logoUrl: booth.logoUrl ?? "",
      bannerUrl: booth.bannerUrl ?? "",
      slug: booth.slug,
      isActive: booth.isActive,
    },
  });

  async function onSubmit(values: Form) {
    setSaving(true);
    try {
      await updateFairBoothProfile(values);
      toast.success(t("profileSaved"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("profileError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="max-w-2xl space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
      <section className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-brand-dark">{t("sectionCompany")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("companyName")}</Label>
            <Input {...form.register("companyName")} />
          </div>
          <div className="space-y-2">
            <Label>{t("legalName")}</Label>
            <Input {...form.register("legalName")} />
          </div>
          <div className="space-y-2">
            <Label>{t("cnpj")}</Label>
            <Input {...form.register("cnpj")} />
          </div>
          <div className="space-y-2">
            <Label>{t("country")}</Label>
            <Input {...form.register("country")} maxLength={2} />
          </div>
          <div className="space-y-2">
            <Label>{t("companyType")}</Label>
            <Input {...form.register("type")} />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-brand-dark">{t("sectionAddress")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("street")}</Label>
            <Input {...form.register("street")} />
          </div>
          <div className="space-y-2">
            <Label>{t("city")}</Label>
            <Input {...form.register("city")} />
          </div>
          <div className="space-y-2">
            <Label>{t("state")}</Label>
            <Input {...form.register("state")} />
          </div>
          <div className="space-y-2">
            <Label>{t("postalCode")}</Label>
            <Input {...form.register("postalCode")} />
          </div>
          <div className="space-y-2">
            <Label>{t("addressCountry")}</Label>
            <Input {...form.register("addressCountry")} maxLength={2} />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-brand-dark">{t("sectionContact")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("phone")}</Label>
            <Input {...form.register("phone")} />
          </div>
          <div className="space-y-2">
            <Label>{t("whatsapp")}</Label>
            <Input {...form.register("whatsappNumber")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("quotationUrl")}</Label>
            <Input {...form.register("quotationUrl")} placeholder="https://wa.me/5511999999999" />
            <p className="text-xs text-brand-gray">{t("quotationUrlHint")}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-brand-dark">{t("sectionPix")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("pixKeyType")}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...form.register("pixKeyType")}
            >
              <option value="">{t("selectOption")}</option>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
              <option value="EMAIL">E-mail</option>
              <option value="PHONE">Telefone</option>
              <option value="RANDOM">Chave aleatória</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t("pixKey")}</Label>
            <Input {...form.register("pixKey")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>{t("pixBeneficiary")}</Label>
            <Input {...form.register("pixBeneficiaryName")} />
          </div>
          <div className="sm:col-span-2">
            <ImageUrlOrUploadField
              label={t("pixImageUrl")}
              hint={t("pixImageHint")}
              purpose="pix"
              value={form.watch("pixImageUrl") ?? ""}
              onChange={(url) => form.setValue("pixImageUrl", url, { shouldDirty: true })}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-lg border border-border p-4">
        <h2 className="font-semibold text-brand-dark">{t("sectionStorefront")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("boothSlug")}</Label>
            <div className="flex items-center gap-1 text-sm text-brand-gray">
              <span>/{locale}/feira/</span>
              <Input className="flex-1" {...form.register("slug")} />
            </div>
          </div>
          <div className="space-y-2">
            <ImageUrlOrUploadField
              label={t("logoUrl")}
              purpose="logo"
              value={form.watch("logoUrl") ?? ""}
              onChange={(url) => form.setValue("logoUrl", url, { shouldDirty: true })}
            />
          </div>
          <div className="sm:col-span-2">
            <ImageUrlOrUploadField
              label={t("bannerUrl")}
              purpose="banner"
              value={form.watch("bannerUrl") ?? ""}
              onChange={(url) => form.setValue("bannerUrl", url, { shouldDirty: true })}
            />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" {...form.register("isActive")} />
            <span className="text-sm">{t("isActive")}</span>
          </label>
        </div>
      </section>

      <Button type="submit" disabled={saving}>
        {saving ? t("saving") : t("saveProfile")}
      </Button>
    </form>
  );
}
