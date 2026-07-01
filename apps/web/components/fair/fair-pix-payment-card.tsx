"use client";

import Image from "next/image";
import { ClipboardCopy, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PriceDisplay } from "@/components/brand/price-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type BoothPixInfo = {
  pixKey: string | null;
  pixBeneficiaryName: string | null;
  pixImageUrl: string | null;
};

type Props = {
  boothPix: BoothPixInfo;
  locale: string;
  totalBrl?: number;
  showTotal?: boolean;
};

export function FairPixPaymentCard({ boothPix, locale, totalBrl, showTotal }: Props) {
  const t = useTranslations("fairBooth");
  const hasPixKey = Boolean(boothPix.pixKey?.trim());

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-brand-dark">
        <QrCode className="h-5 w-5 text-brand-blue" />
        <span className="font-semibold">{t("pixOnly")}</span>
      </div>

      {hasPixKey ? (
        <p className="text-sm text-brand-gray">{t("pixOnlyHint")}</p>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {t("pixNotConfigured")}
        </p>
      )}

      {showTotal && totalBrl !== undefined ? (
        <p className="text-2xl font-bold">
          <PriceDisplay amount={totalBrl} currency="BRL" locale={locale} />
        </p>
      ) : null}

      {boothPix.pixBeneficiaryName ? (
        <p className="text-sm text-brand-gray">{boothPix.pixBeneficiaryName}</p>
      ) : null}

      {hasPixKey ? (
        <div className="space-y-2">
          <Label>{t("pixKey")}</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={boothPix.pixKey!} className="min-w-0 font-mono text-sm" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-full shrink-0 sm:w-10"
              aria-label={t("copyPixKey")}
              onClick={() => {
                void navigator.clipboard.writeText(boothPix.pixKey!);
                toast.success(t("copied"));
              }}
            >
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {boothPix.pixImageUrl ? (
        <div className="space-y-2">
          <Label>{t("pixQrImage")}</Label>
          <div className="relative mx-auto max-w-xs aspect-square overflow-hidden rounded-lg border border-border bg-white">
            <Image
              src={boothPix.pixImageUrl}
              alt={t("pixQrImage")}
              fill
              className="object-contain p-2"
              unoptimized
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
