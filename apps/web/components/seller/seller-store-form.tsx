"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSellerStore } from "@/lib/actions/seller-store";

const schema = z.object({
  name: z.string().min(2).max(200),
  legalName: z.string().max(300).optional(),
  country: z.string().length(2),
  type: z.string().min(1).max(100),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  defaultValues: FormValues;
  verificationStatus?: string;
};

export function SellerStoreForm({ defaultValues, verificationStatus }: Props) {
  const t = useTranslations("sellerPortal.store");
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  async function onSubmit(values: FormValues) {
    await updateSellerStore(values);
    form.reset(values);
  }

  return (
    <form
      className="max-w-lg space-y-4"
      data-demo-target="seller-store-form"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {verificationStatus ? (
        <p className="rounded-lg bg-surface-light px-3 py-2 text-sm text-brand-gray">
          {t("verificationStatus", { status: verificationStatus })}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" {...form.register("name")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="legalName">{t("legalName")}</Label>
        <Input id="legalName" {...form.register("legalName")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">{t("country")}</Label>
          <Input id="country" maxLength={2} {...form.register("country")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">{t("type")}</Label>
          <Input id="type" {...form.register("type")} />
        </div>
      </div>
      <Button type="submit">{t("save")}</Button>
    </form>
  );
}
