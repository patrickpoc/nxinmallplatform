"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Requests a password reset email (Resend integration wired in Phase 1 follow-up). */
export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
  }

  return (
    <Card className="w-full max-w-md shadow-card">
      <CardHeader>
        <CardTitle>{t("forgot")}</CardTitle>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-brand-gray">If an account exists, you will receive reset instructions.</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">
              Send reset link
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
