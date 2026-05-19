"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { newsletterSchema } from "@nxinmall/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormValues = z.infer<typeof newsletterSchema>;

/**
 * Posts the marketing email capture to `/api/newsletter` with Zod validation and user feedback.
 */
export function NewsletterForm() {
  const t = useTranslations("cta");
  const [pending, setPending] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    setPending(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        throw new Error("Request failed");
      }
      toast.success("Thanks — you are on the list.");
      form.reset();
    } catch {
      toast.error("Could not submit — try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row" onSubmit={form.handleSubmit(onSubmit)}>
      <Input type="email" placeholder={t("emailPlaceholder")} {...form.register("email")} aria-invalid={!!form.formState.errors.email} />
      <Button type="submit" disabled={pending} className="shrink-0">
        {t("submit")}
      </Button>
    </form>
  );
}
