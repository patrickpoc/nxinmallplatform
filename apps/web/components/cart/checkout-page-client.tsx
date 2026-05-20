"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  Check,
  ClipboardCopy,
  CreditCard,
  Loader2,
  LogIn,
  Package,
  QrCode,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { PriceDisplay } from "@/components/brand/price-display";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/routing";
import { useCurrencyPreference } from "@/lib/currency-preference";
import { useCart } from "@/lib/cart/cart-context";
import type { CartLine } from "@/lib/cart/types";
import {
  EMPTY_ADDRESS,
  PAYMENT_DISCOUNTS,
  type DocType,
  type FreightOption,
  type PaymentMethod,
  type PaymentMethodType,
  type ShippingAddress,
} from "@/lib/cart/checkout-types";
import { lookupCep, simulateFreight } from "@/lib/cart/freight-simulator";
import { maskPhone, maskCpf, maskCnpj, maskCep, maskCardNumber, maskExpiry } from "@/lib/cart/input-masks";
import { useCurrency } from "@/lib/hooks/use-currency";
import { cn } from "@/lib/utils";
import { loadProfile, loadAddress } from "@/lib/account/profile-store";
import { saveOrder } from "@/lib/account/orders-store";
import { useDemoTourOptional } from "@/lib/demo/demo-context";
import { DEMO_CHECKOUT_ADDRESS } from "@/lib/demo/demo-checkout-prefill";

/* ─── Progress bar ─── */

const STEP_KEYS = ["address", "freight", "payment", "review"] as const;

function StepBar({ current, t }: { current: number; t: (k: string) => string }) {
  return (
    <nav className="mb-8 flex items-center justify-center gap-1 text-xs font-medium sm:gap-2 sm:text-sm" aria-label={t("stepProgress")}>
      {STEP_KEYS.map((key, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={key} className="flex items-center gap-1 sm:gap-2">
            {i > 0 && <div className={cn("h-px w-4 sm:w-8", done || active ? "bg-brand-blue" : "bg-border")} />}
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                done && "border-brand-blue bg-brand-blue text-white",
                active && "border-brand-blue bg-white text-brand-blue",
                !done && !active && "border-border bg-white text-brand-gray",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : stepNum}
            </div>
            <span
              className={cn(
                "max-w-[4.5rem] truncate text-[10px] leading-tight sm:max-w-none sm:text-xs",
                active ? "text-brand-blue" : done ? "text-brand-dark" : "text-brand-gray",
              )}
            >
              {t(`step${stepNum}Label`)}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

/* ─── Total helpers ─── */

function useTotals(lines: CartLine[], freight: FreightOption | null, payment: PaymentMethod | null) {
  const { displayCurrency } = useCurrencyPreference();
  const { convert, format, isLoading } = useCurrency();
  const locale = useLocale();

  const subtotal = useMemo(
    () => lines.reduce((acc, l) => acc + convert(l.priceAmount * l.quantity, l.priceCurrency, displayCurrency), 0),
    [lines, convert, displayCurrency],
  );

  const freightConverted = useMemo(
    () => (freight && freight.price > 0 ? convert(freight.price, "BRL", displayCurrency) : 0),
    [freight, convert, displayCurrency],
  );

  const discountRate = payment ? PAYMENT_DISCOUNTS[payment.type] : 0;
  const discount = subtotal * discountRate;
  const total = subtotal - discount + freightConverted;

  const fmt = useCallback((v: number) => format(v, displayCurrency, locale), [format, displayCurrency, locale]);

  return { subtotal, freightConverted, discount, discountRate, total, fmt, isLoading, displayCurrency };
}

/* ─── Step 1: Address ─── */

function StepAddress({
  address,
  setAddress,
  onNext,
  t,
}: {
  address: ShippingAddress;
  setAddress: (a: ShippingAddress) => void;
  onNext: () => void;
  t: (k: string) => string;
}) {
  function update(field: keyof ShippingAddress, value: string) {
    const next = { ...address, [field]: value };

    if (field === "phone") {
      next.phone = maskPhone(value);
    } else if (field === "cpfCnpj") {
      next.cpfCnpj = address.docType === "cpf" ? maskCpf(value) : maskCnpj(value);
    } else if (field === "cep") {
      next.cep = maskCep(value);
      const clean = value.replace(/\D/g, "");
      if (clean.length === 8) {
        const result = lookupCep(clean);
        if (result) {
          next.city = result.city;
          next.state = result.state;
          next.neighborhood = result.neighborhood;
          next.street = result.street;
        }
      }
    }

    setAddress(next);
  }

  function setDocType(dt: DocType) {
    setAddress({ ...address, docType: dt, cpfCnpj: "" });
  }

  const canAdvance = address.name && address.email && address.cep.replace(/\D/g, "").length === 8 && address.street && address.number && address.city && address.state;

  return (
    <div className="space-y-6" data-demo-target="checkout-form">
      <h2 className="text-xl font-bold text-brand-dark">{t("addressTitle")}</h2>
      <div className="grid gap-4 sm:grid-cols-2" data-demo-target="checkout-address-form">
        <div className="space-y-2">
          <Label>{t("fullName")} *</Label>
          <Input value={address.name} onChange={(e) => update("name", e.target.value)} required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label>{t("email")} *</Label>
          <Input type="email" value={address.email} onChange={(e) => update("email", e.target.value)} required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label>{t("phone")}</Label>
          <Input value={address.phone} onChange={(e) => update("phone", e.target.value)} autoComplete="tel" placeholder="(11) 99999-0000" />
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline gap-4">
            {(["cpf", "cnpj"] as const).map((dt) => (
              <label key={dt} className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-dark">
                <input
                  type="radio"
                  name="docType"
                  checked={address.docType === dt}
                  onChange={() => setDocType(dt)}
                  className="accent-brand-blue"
                />
                {dt === "cpf" ? t("docTypeCpf") : t("docTypeCnpj")}
              </label>
            ))}
          </div>
          <Input
            value={address.cpfCnpj}
            onChange={(e) => update("cpfCnpj", e.target.value)}
            placeholder={address.docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
            maxLength={address.docType === "cpf" ? 14 : 18}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("cep")} *</Label>
          <Input value={address.cep} onChange={(e) => update("cep", e.target.value)} placeholder="00000-000" maxLength={9} />
          {address.city && address.state && (
            <p className="text-xs text-brand-blue">{address.city} / {address.state}</p>
          )}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("street")} *</Label>
          <Input value={address.street} onChange={(e) => update("street", e.target.value)} autoComplete="street-address" />
        </div>
        <div className="space-y-2">
          <Label>{t("number")} *</Label>
          <Input value={address.number} onChange={(e) => update("number", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("complement")}</Label>
          <Input value={address.complement} onChange={(e) => update("complement", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("neighborhood")}</Label>
          <Input value={address.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("city")} *</Label>
          <Input value={address.city} onChange={(e) => update("city", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>{t("state")} *</Label>
          <Input value={address.state} onChange={(e) => update("state", e.target.value)} maxLength={2} />
        </div>
      </div>
      <Button onClick={onNext} disabled={!canAdvance} className="w-full sm:w-auto">
        {t("next")}
      </Button>
    </div>
  );
}

/* ─── Step 2: Freight ─── */

function StepFreight({
  cep,
  selected,
  onSelect,
  onNext,
  onBack,
  t,
}: {
  cep: string;
  selected: FreightOption | null;
  onSelect: (o: FreightOption) => void;
  onNext: () => void;
  onBack: () => void;
  t: (k: string) => string;
}) {
  const [options, setOptions] = useState<FreightOption[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    setLoading(true);
    simulateFreight(cep).then((opts) => {
      setOptions(opts);
      setLoading(false);
    });
  }, [cep]);

  const isSeller = (o: FreightOption) => o.id === "seller";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-brand-dark">{t("freightTitle")}</h2>
      <p className="text-sm text-brand-gray">{t("freightCep")}: <span className="font-semibold text-brand-dark">{cep}</span></p>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-brand-gray">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>{t("freightLoading")}</span>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2" data-demo-target="checkout-freight-options">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onSelect(o)}
              className={cn(
                "flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-colors",
                selected?.id === o.id ? "border-brand-blue bg-brand-blue/5" : "border-border hover:border-brand-gray/50",
              )}
            >
              <div className="flex items-center gap-2">
                {isSeller(o) ? (
                  <Package className="h-5 w-5 shrink-0 text-brand-blue" />
                ) : (
                  <Truck className="h-5 w-5 shrink-0 text-brand-blue" />
                )}
                <span className="font-semibold text-brand-dark">{o.carrier}</span>
                {!isSeller(o) && <span className="text-sm text-brand-gray">{o.service}</span>}
              </div>
              <div className="flex items-baseline justify-between">
                {isSeller(o) ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {t("freightSellerCheck")}
                  </span>
                ) : (
                  <PriceDisplay amount={o.price} currency="BRL" locale={locale} className="text-lg font-bold text-brand-dark" />
                )}
                <span className="text-xs text-brand-gray">
                  {isSeller(o) ? t("freightSellerTbd") : `${o.deliveryDays} ${t("freightDays")}`}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>{t("back")}</Button>
        <Button onClick={onNext} disabled={!selected}>{t("next")}</Button>
      </div>
    </div>
  );
}

/* ─── Step 3: Payment ─── */

function StepPayment({
  payment,
  setPayment,
  onNext,
  onBack,
  t,
}: {
  payment: PaymentMethod | null;
  setPayment: (p: PaymentMethod) => void;
  onNext: () => void;
  onBack: () => void;
  t: (k: string) => string;
}) {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [installments, setInstallments] = useState(1);

  function selectMethod(type: PaymentMethodType) {
    if (type === "boleto") setPayment({ type: "boleto" });
    else if (type === "pix") setPayment({ type: "pix" });
    else setPayment({ type: "credit_card", cardName, cardNumber, expiry, cvv, installments });
  }

  useEffect(() => {
    if (payment?.type === "credit_card") {
      setPayment({ type: "credit_card", cardName, cardNumber, expiry, cvv, installments });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardName, cardNumber, expiry, cvv, installments]);

  const methods: { type: PaymentMethodType; icon: typeof Barcode; label: string; desc: string }[] = [
    { type: "boleto", icon: Barcode, label: t("payBoleto"), desc: t("payBoletoDesc") },
    { type: "pix", icon: QrCode, label: t("payPix"), desc: t("payPixDesc") },
    { type: "credit_card", icon: CreditCard, label: t("payCard"), desc: t("payCardDesc") },
  ];

  const canAdvance = !!payment && (payment.type !== "credit_card" || (cardName && cardNumber && expiry && cvv));

  return (
    <div className="space-y-6" data-demo-target="checkout-payment">
      <h2 className="text-xl font-bold text-brand-dark">{t("paymentTitle")}</h2>

      <div className="space-y-3">
        {methods.map((m) => {
          const Icon = m.icon;
          const active = payment?.type === m.type;
          return (
            <div key={m.type}>
              <button
                type="button"
                onClick={() => selectMethod(m.type)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors",
                  active ? "border-brand-blue bg-brand-blue/5" : "border-border hover:border-brand-gray/50",
                )}
              >
                <Icon className="mt-0.5 h-6 w-6 shrink-0 text-brand-blue" />
                <div>
                  <p className="font-semibold text-brand-dark">{m.label}</p>
                  <p className="text-sm text-brand-gray">{m.desc}</p>
                </div>
                <div className="ml-auto mt-1">
                  <div className={cn("h-5 w-5 rounded-full border-2", active ? "border-brand-blue bg-brand-blue" : "border-border")}>
                    {active && <Check className="h-4 w-4 text-white" />}
                  </div>
                </div>
              </button>

              {m.type === "credit_card" && active && (
                <div className="ml-9 mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">{t("cardName")}</Label>
                    <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder={t("cardNamePlaceholder")} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">{t("cardNumber")}</Label>
                    <Input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(maskCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("cardExpiry")}</Label>
                    <Input
                      value={expiry}
                      onChange={(e) => setExpiry(maskExpiry(e.target.value))}
                      placeholder="MM/AA"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t("cardCvv")}</Label>
                    <Input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="000" maxLength={4} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">{t("installments")}</Label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>{t("back")}</Button>
        <Button onClick={onNext} disabled={!canAdvance}>{t("next")}</Button>
      </div>
    </div>
  );
}

/* ─── Step 4: Review ─── */

function StepReview({
  lines,
  address,
  freight,
  payment,
  onConfirm,
  onBack,
  t,
}: {
  lines: CartLine[];
  address: ShippingAddress;
  freight: FreightOption;
  payment: PaymentMethod;
  onConfirm: () => void;
  onBack: () => void;
  t: (k: string) => string;
}) {
  const locale = useLocale();
  const { subtotal, freightConverted, discount, discountRate, total, fmt, isLoading } = useTotals(lines, freight, payment);
  const isSeller = freight.id === "seller";

  const payLabel = payment.type === "boleto" ? t("payBoleto") : payment.type === "pix" ? t("payPix") : t("payCard");
  const payExtra = payment.type === "credit_card" ? ` (${payment.installments}x)` : "";

  return (
    <div className="space-y-6" data-demo-target="checkout-review">
      <h2 className="text-xl font-bold text-brand-dark">{t("reviewTitle")}</h2>

      <div className="space-y-6" data-demo-target="checkout-review-body">
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5">
          <p className="text-sm font-semibold text-brand-dark">{t("reviewItems")}</p>
          <ul className="divide-y divide-border">
            {lines.map((line) => (
              <li key={line.lineId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                  {line.imageUrl ? (
                    <Image src={line.imageUrl} alt="" fill className="object-contain p-1" sizes="48px" unoptimized />
                  ) : (
                    <Package className="m-auto h-5 w-5 text-brand-gray" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-dark">{line.name}</p>
                  <p className="text-xs text-brand-gray">×{line.quantity}</p>
                </div>
                <PriceDisplay amount={line.priceAmount * line.quantity} currency={line.priceCurrency} locale={locale} className="shrink-0 text-sm font-semibold" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="space-y-1 p-5">
          <p className="text-sm font-semibold text-brand-dark">{t("reviewAddress")}</p>
          <p className="text-sm text-brand-gray">{address.name}</p>
          <p className="text-sm text-brand-gray">{address.street}, {address.number}{address.complement ? ` - ${address.complement}` : ""}</p>
          <p className="text-sm text-brand-gray">{address.neighborhood} — {address.city}/{address.state}</p>
          <p className="text-sm text-brand-gray">CEP: {address.cep}</p>
          {address.phone && <p className="text-sm text-brand-gray">{address.phone}</p>}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-brand-dark">{t("reviewFreight")}</p>
            {isSeller ? (
              <p className="text-sm text-amber-700">{t("freightSellerCheck")}</p>
            ) : (
              <p className="text-sm text-brand-gray">{freight.carrier} {freight.service} — {freight.deliveryDays} {t("freightDays")}</p>
            )}
          </div>
          {!isSeller && <PriceDisplay amount={freight.price} currency="BRL" locale={locale} className="text-sm font-semibold" />}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-brand-dark">{t("reviewPayment")}</p>
          <p className="text-sm text-brand-gray">{payLabel}{payExtra}</p>
          {discountRate > 0 && (
            <p className="mt-1 text-xs font-medium text-green-600">
              {t("discountLabel")} {(discountRate * 100).toFixed(0)}%
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-brand-blue/20 bg-surface-light/50 shadow-card">
        <CardContent className="space-y-2 p-5" suppressHydrationWarning>
          <div className="flex justify-between text-sm">
            <span className="text-brand-gray">{t("subtotal")}</span>
            <span className="font-medium text-brand-dark">{isLoading ? "…" : fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">{t("discountLabel")} ({(discountRate * 100).toFixed(0)}%)</span>
              <span className="font-medium text-green-600">-{fmt(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-brand-gray">{t("freightLabel")}</span>
            <span className="font-medium text-brand-dark">
              {isSeller ? t("freightSellerTbd") : isLoading ? "…" : fmt(freightConverted)}
            </span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
            <span className="text-brand-dark">{t("total")}</span>
            <span className="text-brand-dark">{isLoading ? "…" : fmt(total)}</span>
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>{t("back")}</Button>
        <Button onClick={onConfirm} className="flex-1 sm:flex-none">{t("confirmOrder")}</Button>
      </div>
    </div>
  );
}

/* ─── Payment pending screen ─── */

const DEMO_CARDS = [
  { last4: "4242", brand: "Visa" },
  { last4: "5555", brand: "Mastercard" },
  { last4: "3782", brand: "Amex" },
];

function generateBoletoLine(): string {
  const seg = () => String(Math.floor(10000 + Math.random() * 90000));
  return `23793.${seg()} ${seg()}.000003 00000.000${Math.floor(100 + Math.random() * 900)} 1 8434000001${Math.floor(1000 + Math.random() * 9000)}`;
}

function generatePixCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "00020126580014br.gov.bcb.pix0136";
  for (let i = 0; i < 36; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code + "5204000053039865802BR";
}

function PaymentPendingScreen({
  payment,
  orderId,
  totalFormatted,
  t,
}: {
  payment: PaymentMethod;
  orderId: string;
  totalFormatted: string;
  t: (k: string) => string;
}) {
  const [copied, setCopied] = useState(false);
  const [boletoLine] = useState(generateBoletoLine);
  const [pixCode] = useState(generatePixCode);
  const pixKey = "nxinmall-demo@pix.nxinmall.com";
  const demoCard = useMemo(() => DEMO_CARDS[Math.floor(Math.random() * DEMO_CARDS.length)]!, []);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard not available");
    }
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  const dueDateStr = dueDate.toLocaleDateString("pt-BR");

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-16 md:px-6 text-center" data-demo-target="checkout-done">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-brand-dark">{t("pendingTitle")}</h1>
      <p className="text-lg font-semibold text-brand-blue">{orderId}</p>
      <p className="text-sm text-brand-gray">{totalFormatted}</p>

      {payment.type === "boleto" && (
        <Card className="text-left shadow-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Barcode className="h-5 w-5 text-brand-blue" />
              <p className="font-semibold text-brand-dark">{t("payBoleto")}</p>
            </div>
            <div>
              <p className="text-xs text-brand-gray">{t("pendingBoletoLine")}</p>
              <p className="mt-1 break-all rounded-lg border border-border bg-surface-light px-3 py-2 font-mono text-xs text-brand-dark">
                {boletoLine}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => copyToClipboard(boletoLine)}>
              <ClipboardCopy className="h-4 w-4" />
              {copied ? t("copied") : t("copyCode")}
            </Button>
            <p className="text-xs text-brand-gray">{t("pendingBoletoDue").replace("{date}", dueDateStr)}</p>
          </CardContent>
        </Card>
      )}

      {payment.type === "pix" && (
        <Card className="text-left shadow-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-brand-blue" />
              <p className="font-semibold text-brand-dark">{t("payPix")}</p>
            </div>
            <div>
              <p className="text-xs text-brand-gray">{t("pendingPixKey")}</p>
              <p className="mt-1 rounded-lg border border-border bg-surface-light px-3 py-2 text-sm font-medium text-brand-dark">
                {pixKey}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-gray">{t("pendingPixCopy")}</p>
              <p className="mt-1 break-all rounded-lg border border-border bg-surface-light px-3 py-2 font-mono text-[10px] text-brand-gray">
                {pixCode}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => copyToClipboard(pixCode)}>
              <ClipboardCopy className="h-4 w-4" />
              {copied ? t("copied") : t("copyCode")}
            </Button>
            <p className="text-xs text-brand-gray">{t("pendingPixHint")}</p>
          </CardContent>
        </Card>
      )}

      {payment.type === "credit_card" && (
        <Card className="text-left shadow-card">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-brand-blue" />
              <p className="font-semibold text-brand-dark">{t("payCard")}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 items-center rounded-lg border border-border bg-surface-light px-3">
                <span className="font-mono text-sm text-brand-dark">**** **** **** {demoCard.last4}</span>
              </div>
              <span className="text-xs font-medium text-brand-gray">{demoCard.brand}</span>
            </div>
            <p className="text-sm text-brand-dark">
              {t("pendingCardInstallments")
                .replace("{n}", String(payment.installments))
                .replace("{amount}", totalFormatted)}
            </p>
            <p className="rounded-lg bg-green-50 px-3 py-2 text-center text-sm font-semibold text-green-700">
              {t("pendingCardApproved")}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="btn-press flex-1">
          <Link href="/products">{t("backToShop")}</Link>
        </Button>
        <Button asChild className="btn-press flex-1">
          <Link href="/account/purchases">{t("viewMyOrders")}</Link>
        </Button>
      </div>
    </div>
  );
}

/* ─── Main checkout component ─── */

export function CheckoutPageClient() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  const { data: session, status: sessionStatus } = useSession();
  const { lines, clear } = useCart();
  const demo = useDemoTourOptional();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [selectedFreight, setSelectedFreight] = useState<FreightOption | null>(null);
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [savedPayment, setSavedPayment] = useState<PaymentMethod | null>(null);

  const userId = session?.user?.id;
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current || !userId) return;
    hydrated.current = true;
    const profile = loadProfile(userId);
    const addr = loadAddress(userId);
    if (!profile && !addr) return;
    setAddress((prev) => ({
      ...prev,
      name: profile?.name || prev.name,
      email: profile?.email || prev.email,
      phone: profile?.phone || prev.phone,
      docType: profile?.docType || prev.docType,
      cpfCnpj: profile?.cpfCnpj || prev.cpfCnpj,
      cep: addr?.cep || prev.cep,
      street: addr?.street || prev.street,
      number: addr?.number || prev.number,
      complement: addr?.complement || prev.complement,
      neighborhood: addr?.neighborhood || prev.neighborhood,
      city: addr?.city || prev.city,
      state: addr?.state || prev.state,
    }));
  }, [userId]);

  const { total, fmt, isLoading, displayCurrency } = useTotals(lines, selectedFreight, payment);
  const totalFormatted = isLoading ? "…" : fmt(total);

  const doConfirm = useCallback(() => {
    if (!selectedFreight || !payment) return;
    const id = `#NXM-${Date.now().toString(36).toUpperCase()}`;
    if (userId) {
      saveOrder(userId, {
        id,
        createdAt: new Date().toISOString(),
        items: lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          priceAmount: l.priceAmount,
          priceCurrency: l.priceCurrency,
          imageUrl: l.imageUrl,
        })),
        address,
        freight: selectedFreight,
        payment,
        totalFormatted: isLoading ? "…" : fmt(total),
        totalAmount: total,
        currency: displayCurrency,
        status: "pending",
      });
    }
    setOrderId(id);
    setSavedPayment(payment);
    clear();
    setDone(true);
  }, [address, clear, displayCurrency, fmt, isLoading, lines, payment, selectedFreight, total, userId]);

  useEffect(() => {
    if (!demo?.isActive) {
      demo?.registerCheckoutHandlers(null);
      return;
    }
    demo.registerCheckoutHandlers({
      setStep,
      prefill: () => {
        setAddress({
          ...DEMO_CHECKOUT_ADDRESS,
          name: session?.user?.name ?? DEMO_CHECKOUT_ADDRESS.name,
          email: session?.user?.email ?? DEMO_CHECKOUT_ADDRESS.email,
        });
        setStep(1);
      },
      confirmOrder: doConfirm,
      isDone: () => done,
    });
    return () => demo.registerCheckoutHandlers(null);
  }, [demo, demo?.isActive, doConfirm, done, session?.user?.email, session?.user?.name]);

  useEffect(() => {
    if (!demo?.isActive) return;
    const sub = demo.currentStep.checkoutSubStep;
    if (sub) setStep(sub);
  }, [demo?.isActive, demo?.stepIndex, demo?.currentStep.checkoutSubStep]);

  useEffect(() => {
    if (!demo?.isActive || step !== 2 || selectedFreight) return;
    const cleanCep = address.cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    void simulateFreight(address.cep).then((opts) => {
      if (opts[0]) setSelectedFreight(opts[0]);
    });
  }, [demo?.isActive, step, address.cep, selectedFreight]);

  useEffect(() => {
    if (!demo?.isActive || step !== 3 || payment) return;
    setPayment({ type: "pix" });
  }, [demo?.isActive, step, payment]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-16 text-center md:px-6">
        <LogIn className="mx-auto h-12 w-12 text-brand-blue" />
        <h1 className="text-2xl font-bold text-brand-dark">{t("loginRequired")}</h1>
        <p className="text-brand-gray">{t("loginRequiredHint")}</p>
        <Button asChild>
          <Link href={`/auth/login?callbackUrl=/${locale}/checkout`}>{t("loginButton")}</Link>
        </Button>
      </div>
    );
  }

  if (lines.length === 0 && !done) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-16 md:px-6">
        <h1 className="heading-page">{t("title")}</h1>
        <p className="text-brand-gray">{t("emptyCart")}</p>
        <Button asChild variant="outline">
          <Link href="/cart">{t("backToCart")}</Link>
        </Button>
      </div>
    );
  }

  if (done && savedPayment) {
    return <PaymentPendingScreen payment={savedPayment} orderId={orderId} totalFormatted={totalFormatted} t={t} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-2 px-4 py-10 md:px-6">
      <h1 className="text-center text-2xl font-bold text-brand-dark">{t("title")}</h1>
      <p className="text-center text-sm text-brand-gray">{t("demoNote")}</p>

      <StepBar current={step} t={t} />

      {step === 1 && (
        <StepAddress address={address} setAddress={setAddress} onNext={() => setStep(2)} t={t} />
      )}

      {step === 2 && (
        <StepFreight
          cep={address.cep}
          selected={selectedFreight}
          onSelect={setSelectedFreight}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
          t={t}
        />
      )}

      {step === 3 && (
        <StepPayment
          payment={payment}
          setPayment={setPayment}
          onNext={() => setStep(4)}
          onBack={() => setStep(2)}
          t={t}
        />
      )}

      {step === 4 && selectedFreight && payment && (
        <StepReview
          lines={lines}
          address={address}
          freight={selectedFreight}
          payment={payment}
          onConfirm={doConfirm}
          onBack={() => setStep(3)}
          t={t}
        />
      )}
    </div>
  );
}
