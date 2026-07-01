"use client";

import Image from "next/image";
import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  purpose: "pix" | "product" | "logo" | "banner";
};

export function ImageUrlOrUploadField({ label, hint, value, onChange, purpose }: Props) {
  const t = useTranslations("fairVendor");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", purpose);
      const res = await fetch("/api/v1/uploads/fair", { method: "POST", body: formData });
      const json = (await res.json()) as { success?: boolean; data?: { url: string }; error?: { message: string } };
      if (!res.ok || !json.success || !json.data?.url) {
        throw new Error(json.error?.message ?? t("uploadError"));
      }
      onChange(json.data.url);
      toast.success(t("uploadSuccess"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("uploadError"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-brand-gray">{hint}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="min-w-0 flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          className="w-full sm:w-auto"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="ml-2">{uploading ? t("uploading") : t("uploadImage")}</span>
        </Button>
      </div>
      <p className="text-xs text-brand-gray">{t("orPasteUrl")}</p>
      {value ? (
        <div className="relative mx-auto mt-2 max-w-xs aspect-square overflow-hidden rounded-lg border border-border bg-muted">
          <Image src={value} alt="" fill className="object-contain p-2" unoptimized />
        </div>
      ) : null}
    </div>
  );
}
