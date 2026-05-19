"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Password reset form — completes reset when `token` query param matches a valid verification row. */
export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const token = useSearchParams().get("token") ?? "";

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle>{t("resetTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" method="POST" action="/api/auth/reset-password">
          <input type="hidden" name="token" value={token} />
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
          <Button type="submit" className="w-full">
            {t("resetSubmit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
