"use client";

import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  logoUrl: string | null;
  companyName: string | null;
  className?: string;
};

export function SellerLogoUpload({ logoUrl, companyName, className }: Props) {
  const t = useTranslations("sellerPortal.sidebar");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await fetch("/api/seller/logo", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? t("uploadError"));
      }
      if (data.url) {
        setPreview(data.url);
        URL.revokeObjectURL(objectUrl);
      }
      router.refresh();
    } catch (err) {
      setPreview(logoUrl);
      setError(err instanceof Error ? err.message : t("uploadError"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const initials = (companyName ?? "S").slice(0, 2).toUpperCase();

  return (
    <div className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-white shadow-sm transition hover:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 sm:h-16 sm:w-16"
        aria-label={t("uploadLogo")}
      >
        {preview ? (
          <Image src={preview} alt="" fill className="object-cover" sizes="64px" unoptimized />
        ) : (
          <span className="text-sm font-bold text-brand-gray">{initials}</span>
        )}
        <span className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-black/50">
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" aria-hidden />
          ) : (
            <Camera className="h-3.5 w-3.5 text-white" aria-hidden />
          )}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onFileChange}
      />
      {error ? <p className="mt-1 max-w-[4.5rem] text-center text-[10px] text-error">{error}</p> : null}
    </div>
  );
}
