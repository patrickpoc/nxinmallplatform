"use client";

import { loginSchema } from "@nxinmall/validators";
import { Loader2 } from "lucide-react";
import { getSession, signIn, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";

export function FairVendorLoginForm() {
  const t = useTranslations("fairVendor");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(t("loginError"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
      if (res?.error) {
        setError(t("loginError"));
        return;
      }
      const session = await getSession();
      if (session?.user?.role !== "FAIR_VENDOR") {
        await signOut({ redirect: false });
        setError(t("wrongRoleError"));
        return;
      }
      router.push("/feira-vendor");
      router.refresh();
    } catch {
      setError(t("loginError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle>{t("loginTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("loginSubmit")}
          </Button>
          <p className="text-center text-sm text-brand-gray">
            {t("noAccount")}{" "}
            <Link href="/feira-vendor/auth/register" className="text-brand-blue hover:underline">
              {t("registerLink")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
