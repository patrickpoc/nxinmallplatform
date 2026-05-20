"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { registerSchema } from "@nxinmall/validators";
import { DemoRegisterSync } from "@/components/demo/demo-register-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { useDemoTourOptional } from "@/lib/demo/demo-context";
import { DEMO_REGISTER_VALUES } from "@/lib/demo/demo-register-prefill";
import type { RegisterPhase } from "@/lib/demo/demo-steps";

type Form = z.infer<typeof registerSchema>;

const EMPTY_REGISTER_DEFAULTS = {
  email: "",
  password: "",
  confirmPassword: "",
  role: "BUYER" as const,
};

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tDemo = useTranslations("demo");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demo = useDemoTourOptional();
  const roleParam = searchParams.get("role");
  const defaultBuyerCallback = `/${locale}/account/personal`;
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<Form>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: roleParam === "seller" ? "SELLER" : "BUYER",
    },
  });

  const demoRegisterLocked =
    demo?.isActive === true &&
    demo.isGuestFlow === true &&
    demo.currentStep.path === "/auth/register" &&
    demo.currentStep.id !== "register-login";

  const handleDemoPrefill = useCallback(
    (phase: RegisterPhase) => {
      if (phase === "intro") {
        form.reset({
          ...EMPTY_REGISTER_DEFAULTS,
          role: roleParam === "seller" ? "SELLER" : "BUYER",
        });
        return;
      }
      if (phase === "credentials") {
        form.setValue("email", DEMO_REGISTER_VALUES.email, { shouldValidate: true });
        form.setValue("password", DEMO_REGISTER_VALUES.password, { shouldValidate: true });
        form.setValue("confirmPassword", DEMO_REGISTER_VALUES.confirmPassword, { shouldValidate: true });
        return;
      }
      if (phase === "role") {
        form.setValue("role", DEMO_REGISTER_VALUES.role, { shouldValidate: true });
        form.setValue("acceptTerms", DEMO_REGISTER_VALUES.acceptTerms, { shouldValidate: true });
        return;
      }
      if (phase === "review") {
        form.reset({
          email: DEMO_REGISTER_VALUES.email,
          password: DEMO_REGISTER_VALUES.password,
          confirmPassword: DEMO_REGISTER_VALUES.confirmPassword,
          role: DEMO_REGISTER_VALUES.role,
          acceptTerms: DEMO_REGISTER_VALUES.acceptTerms,
        });
      }
    },
    [form, roleParam],
  );

  async function onSubmit(values: Form) {
    if (demoRegisterLocked) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      let json: { success?: boolean; error?: { message?: string } | null } = {};
      try {
        json = (await res.json()) as typeof json;
      } catch {
        setError(t("registerError"));
        return;
      }
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? t("registerError"));
        return;
      }
      const postRegisterUrl =
        values.role === "SELLER"
          ? `/${locale}/account/company/setup`
          : defaultBuyerCallback;

      const sign = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: postRegisterUrl,
      });
      if (sign?.error) {
        setError(t("signInAfterRegisterError"));
        return;
      }
      router.push(postRegisterUrl);
      router.refresh();
    } catch {
      setError(t("registerError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleDemo() {
    if (demoRegisterLocked) return;
    setGoogleLoading(true);
    setError(null);
    try {
      const res = await signIn("credentials", {
        email: "demo-buyer@nxinmall.local",
        password: "demo",
        redirect: false,
        callbackUrl: defaultBuyerCallback,
      });
      if (res?.error) {
        setError(t("demoUnavailable"));
        return;
      }
      router.push(defaultBuyerCallback);
      router.refresh();
    } catch {
      setError(t("demoUnavailable"));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
  <>
    <DemoRegisterSync onPrefill={handleDemoPrefill} />
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle>{t("registerTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" data-demo-target="register-form">
        {demoRegisterLocked ? (
          <p className="rounded-lg border border-brand-blue/30 bg-brand-blue-50 px-3 py-2 text-xs text-brand-dark">
            {tDemo("registerBanner")}
          </p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="btn-press flex w-full items-center justify-center gap-2"
          onClick={handleGoogleDemo}
          disabled={googleLoading || demoRegisterLocked}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span className="text-sm text-brand-gray">{t("googleDemoHint")}</span>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-brand-gray">{t("orDivider")}</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2" data-demo-target="register-email">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              readOnly={demoRegisterLocked}
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-error">{t("emailRequired")}</p>
            ) : null}
          </div>

          <div data-demo-target="register-password" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  className="pr-10"
                  readOnly={demoRegisterLocked}
                  aria-invalid={!!form.formState.errors.password}
                  {...form.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brand-gray hover:text-brand-dark"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-brand-gray">{t("passwordRules")}</p>
              {form.formState.errors.password ? (
                <p className="text-xs text-error">
                  {form.formState.errors.password.type === "too_small"
                    ? t("passwordRules")
                    : t("passwordRequired")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">{t("confirmPassword")}</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  className="pr-10"
                  readOnly={demoRegisterLocked}
                  aria-invalid={!!form.formState.errors.confirmPassword}
                  {...form.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brand-gray hover:text-brand-dark"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword ? (
                <p className="text-xs text-error">{t("passwordMismatch")}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2" data-demo-target="register-role">
            <Label>{t("role")}</Label>
            {form.watch("role") === "SELLER" ? (
              <p className="text-xs text-brand-gray">{t("sellerRegisterHint")}</p>
            ) : null}
            <div className="flex gap-6 text-sm">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 transition-colors has-[:checked]:border-brand-blue has-[:checked]:bg-brand-blue-50">
                <input
                  type="radio"
                  value="BUYER"
                  disabled={demoRegisterLocked}
                  {...form.register("role")}
                  className="accent-brand-blue"
                />{" "}
                {t("buyer")}
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 transition-colors has-[:checked]:border-brand-blue has-[:checked]:bg-brand-blue-50">
                <input
                  type="radio"
                  value="SELLER"
                  disabled={demoRegisterLocked}
                  {...form.register("role")}
                  className="accent-brand-blue"
                />{" "}
                {t("seller")}
              </label>
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-brand-gray">
            <input
              type="checkbox"
              disabled={demoRegisterLocked}
              {...form.register("acceptTerms")}
              className="mt-1 accent-brand-blue"
            />{" "}
            {t("terms")}
          </label>
          {form.formState.errors.acceptTerms ? (
            <p className="text-xs text-error">{t("termsRequired")}</p>
          ) : null}
          {error ? <p className="rounded-md bg-error-surface px-3 py-2 text-sm text-error">{error}</p> : null}
          <Button
            type="submit"
            className="btn-press w-full"
            disabled={submitting || demoRegisterLocked}
            data-demo-target="register-submit"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {t("submitRegister")}
          </Button>
          <p className="text-center text-sm text-brand-gray">
            {t("alreadyRegistered")}{" "}
            <Link href="/auth/login" className="font-semibold text-brand-blue hover:underline">
              {t("loginTitle")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  </>
  );
}
