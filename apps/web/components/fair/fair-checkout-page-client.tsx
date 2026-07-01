"use client";

import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PriceDisplay } from "@/components/brand/price-display";
import { SellerFreightCard } from "@/components/cart/seller-freight-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FairPixPaymentCard, type BoothPixInfo } from "@/components/fair/fair-pix-payment-card";
import { useFairCart } from "@/lib/fair/fair-cart-context";
import { createFairOrder } from "@/lib/actions/fair-vendor/orders";
import { maskCep, maskCnpj, maskCpf, maskPhone } from "@/lib/cart/input-masks";

type Props = {
  slug: string;
  locale: string;
  boothPix: BoothPixInfo;
};

type DocumentType = "CPF" | "CNPJ";

const STEP_KEYS = ["buyer", "freight", "pix", "review"] as const;

function documentDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isDocumentValid(type: DocumentType, value: string): boolean {
  const digits = documentDigits(value);
  return type === "CPF" ? digits.length === 11 : digits.length === 14;
}

export function FairCheckoutPageClient({ slug, locale, boothPix }: Props) {
  const t = useTranslations("fairBooth");
  const tCheckout = useTranslations("checkout");
  const router = useRouter();
  const { lines, clear } = useFairCart();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [totalBrl, setTotalBrl] = useState(0);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("CPF");
  const [document, setDocument] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.priceAmount * l.quantity, 0),
    [lines],
  );

  const hasPixKey = Boolean(boothPix.pixKey?.trim());
  const documentValid = isDocumentValid(documentType, document);
  const addressValid =
    Boolean(name && email && phone && street && city && postalCode.replace(/\D/g, "").length >= 8);

  const doConfirm = useCallback(async () => {
    setSubmitting(true);
    try {
      const result = await createFairOrder({
        boothSlug: slug,
        guestName: name,
        guestEmail: email,
        guestPhone: phone.replace(/\D/g, ""),
        guestDocumentType: documentType,
        guestCpf: documentDigits(document),
        street,
        city,
        state: state || undefined,
        postalCode: postalCode.replace(/\D/g, ""),
        country: "BR",
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      });
      setOrderId(result.orderId);
      setTotalBrl(result.totalBrl);
      clear();
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("checkoutError"));
    } finally {
      setSubmitting(false);
    }
  }, [slug, name, email, phone, documentType, document, street, city, state, postalCode, lines, clear, t]);

  if (lines.length === 0 && !done) {
    return (
      <div className="py-12 text-center">
        <p className="text-brand-gray">{t("emptyCart")}</p>
        <Button className="mt-4" onClick={() => router.push(`/feira/${slug}`)}>
          {t("backToStore")}
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-brand-dark">{t("orderPlaced")}</h2>
          <p className="text-sm text-brand-gray">{t("orderId")}: {orderId.slice(0, 12)}…</p>
          <p className="text-base text-brand-dark">{t("orderThankYou")}</p>
        </div>
        <Button className="w-full" onClick={() => router.push(`/feira/${slug}`)}>
          {t("backToStore")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-6">
      <h1 className="text-xl font-bold text-brand-dark">{t("checkoutTitle")}</h1>

      <nav className="flex flex-wrap justify-center gap-3 text-xs font-medium">
        {STEP_KEYS.map((key, i) => (
          <span key={key} className={step === i + 1 ? "text-brand-blue" : "text-brand-gray"}>
            {i + 1}. {t(`step${key}`)}
          </span>
        ))}
      </nav>

      {step === 1 ? (
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label>{t("buyerName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("buyerEmail")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t("buyerPhone")}</Label>
              <Input value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>{t("buyerDocumentType")}</Label>
              <div className="flex gap-2">
                {(["CPF", "CNPJ"] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={documentType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDocumentType(type);
                      setDocument("");
                    }}
                  >
                    {type === "CPF" ? t("documentCpf") : t("documentCnpj")}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{documentType === "CPF" ? t("buyerCpf") : t("buyerCnpj")}</Label>
              <Input
                value={document}
                onChange={(e) =>
                  setDocument(
                    documentType === "CPF"
                      ? maskCpf(e.target.value)
                      : maskCnpj(e.target.value),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("street")}</Label>
              <Input value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("city")}</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("state")}</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("postalCode")}</Label>
              <Input value={postalCode} onChange={(e) => setPostalCode(maskCep(e.target.value))} />
            </div>
            <Button
              className="w-full"
              disabled={!addressValid || !documentValid}
              onClick={() => setStep(2)}
            >
              {t("continue")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-brand-dark">{tCheckout("freightTitle")}</h2>
            <SellerFreightCard />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                {t("back")}
              </Button>
              <Button className="flex-1" onClick={() => setStep(3)}>
                {t("continue")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-6">
            <FairPixPaymentCard
              boothPix={boothPix}
              locale={locale}
              totalBrl={subtotal}
              showTotal
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                {t("back")}
              </Button>
              <Button className="flex-1" disabled={!hasPixKey} onClick={() => setStep(4)}>
                {t("continue")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-6">
            <h3 className="font-semibold">{t("reviewOrder")}</h3>
            <ul className="space-y-2 text-sm">
              {lines.map((l) => (
                <li key={l.lineId} className="flex justify-between">
                  <span>
                    {l.name} × {l.quantity}
                  </span>
                  <span>
                    <PriceDisplay amount={l.priceAmount * l.quantity} currency="BRL" locale={locale} />
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-sm">
              <span className="text-brand-gray">{tCheckout("freightLabel")}</span>
              <span>{tCheckout("freightSellerTbd")}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-bold">
              <span>{t("total")}</span>
              <PriceDisplay amount={subtotal} currency="BRL" locale={locale} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                {t("back")}
              </Button>
              <Button className="flex-1" disabled={submitting || !hasPixKey} onClick={() => void doConfirm()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmOrder")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
