"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const UNITS = ["KG", "TON", "UNIT", "BOX", "PALLET"] as const;
type Unit = (typeof UNITS)[number];

type AskQuotationModalProps = {
  locale: string;
  productId: string;
  productName: string;
  categoryId: string;
  triggerLabel: string;
};

export function AskQuotationModal({ locale, productId, productName, categoryId, triggerLabel }: AskQuotationModalProps) {
  const t = useTranslations("product");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      productId,
      categoryId,
      productName,
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim() || null,
      quantity: Number(fd.get("quantity") ?? 0),
      unit: String(fd.get("unit") ?? "UNIT") as Unit,
      message: String(fd.get("message") ?? "").trim(),
      locale,
    };

    if (!payload.name || !payload.email || !payload.message || !Number.isFinite(payload.quantity) || payload.quantity <= 0) {
      toast.error(t("quoteError"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("bad");
      }
      toast.success(t("quoteSuccess"));
      setOpen(false);
    } catch {
      toast.error(t("quoteError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" type="button">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("quoteTitle")}</DialogTitle>
          <DialogDescription>{t("quoteSubtitle", { product: productName })}</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="raqName">{t("quoteName")}</Label>
              <Input id="raqName" name="name" autoComplete="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="raqEmail">{t("quoteEmail")}</Label>
              <Input id="raqEmail" name="email" type="email" autoComplete="email" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="raqPhone">{t("quotePhone")}</Label>
              <Input id="raqPhone" name="phone" autoComplete="tel" />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="raqQty">{t("quoteQuantity")}</Label>
              <Input id="raqQty" name="quantity" type="number" min={1} step={1} required defaultValue={10} />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <Label htmlFor="raqUnit">{t("quoteUnit")}</Label>
              <select
                id="raqUnit"
                name="unit"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                defaultValue="UNIT"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="raqMsg">{t("quoteMessage")}</Label>
            <Textarea id="raqMsg" name="message" required placeholder={t("quoteMessagePlaceholder")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("quoteCancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("quoteSending") : t("quoteSend")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

