"use client";

import { useTranslations } from "next-intl";
import { ArrowUp, Barcode, CreditCard, QrCode } from "lucide-react";
import { Link } from "@/i18n/routing";
import { NxinLogo } from "@/components/brand/nxin-logo";

export function PublicFooter() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");
  const year = new Date().getFullYear();

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <footer className="border-t border-border bg-white">
      <div className="border-b border-border bg-surface-light/50">
        <div className="page-container">
          <button
            type="button"
            onClick={scrollToTop}
            className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-brand-gray transition-colors hover:text-brand-blue focus-visible:outline-none"
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
            {t("backToTop")}
          </button>
        </div>
      </div>

      <div className="page-container py-8 sm:py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <NxinLogo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-gray">
              B2B agricultural marketplace connecting verified suppliers and buyers worldwide.
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray">{t("paymentMethods")}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-brand-gray">
                  <QrCode className="h-3.5 w-3.5" aria-hidden /> PIX
                </span>
                <span className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-brand-gray">
                  <Barcode className="h-3.5 w-3.5" aria-hidden /> Boleto
                </span>
                <span className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-brand-gray">
                  <CreditCard className="h-3.5 w-3.5" aria-hidden /> Card
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-brand-dark">{t("company")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-brand-gray transition-colors hover:text-brand-blue focus-visible:outline-none">{tn("about")}</Link></li>
              <li><Link href="/sellers" className="text-brand-gray transition-colors hover:text-brand-blue focus-visible:outline-none">{tn("sellers")}</Link></li>
              <li><Link href="/categories" className="text-brand-gray transition-colors hover:text-brand-blue focus-visible:outline-none">{tn("categories")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-brand-dark">{t("support")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-brand-gray transition-colors hover:text-brand-blue focus-visible:outline-none">{t("helpCenter")}</Link></li>
              <li><Link href="/about" className="text-brand-gray transition-colors hover:text-brand-blue focus-visible:outline-none">{t("contactUs")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-brand-dark">{t("legal")}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="text-brand-gray transition-colors hover:text-brand-blue focus-visible:outline-none">{t("terms")}</Link></li>
              <li><Link href="/about" className="text-brand-gray transition-colors hover:text-brand-blue focus-visible:outline-none">{t("privacy")}</Link></li>
              <li><Link href="/about" className="text-brand-gray transition-colors hover:text-brand-blue focus-visible:outline-none">{t("cookies")}</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="page-container py-4">
          <p className="text-center text-xs text-brand-gray">{t("rights", { year })}</p>
        </div>
      </div>
    </footer>
  );
}
