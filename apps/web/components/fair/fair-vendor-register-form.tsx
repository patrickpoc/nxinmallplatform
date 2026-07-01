"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { fairVendorRegisterSchema } from "@nxinmall/validators";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";

type Form = z.infer<typeof fairVendorRegisterSchema>;

export function FairVendorRegisterForm() {
  const t = useTranslations("fairVendor");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(fairVendorRegisterSchema),
    defaultValues: { acceptTerms: undefined },
  });

  async function onSubmit(values: Form) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/register-fair-vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? t("registerError"));
        return;
      }
      const signInRes = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (signInRes?.error) {
        router.push("/feira-vendor/auth/login");
        return;
      }
      router.push("/feira-vendor/perfil");
      router.refresh();
    } catch {
      setError(t("registerError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle>{t("registerTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="companyName">{t("companyName")}</Label>
            <Input id="companyName" {...form.register("companyName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">{t("boothSlug")}</Label>
            <div className="flex flex-col gap-1 text-sm text-brand-gray sm:flex-row sm:items-center">
              <span className="shrink-0">/{locale}/feira/</span>
              <Input id="slug" className="min-w-0 flex-1" placeholder="minha-empresa" {...form.register("slug")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" {...form.register("password")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...form.register("acceptTerms")} />
            <span>{t("acceptTerms")}</span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("registerSubmit")}
          </Button>
          <p className="text-center text-sm text-brand-gray">
            {t("hasAccount")}{" "}
            <Link href="/feira-vendor/auth/login" className="text-brand-blue hover:underline">
              {t("loginLink")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
