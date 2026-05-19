"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskPhone, maskCpf, maskCnpj } from "@/lib/cart/input-masks";
import { loadProfile, saveProfile } from "@/lib/account/profile-store";
import type { DocType } from "@/lib/cart/checkout-types";

const PROFILE_OPTIONS = [
  "ruralProducer",
  "professional",
  "company",
  "cooperative",
  "industry",
  "retailer",
] as const;

export default function PersonalDataPage() {
  const t = useTranslations("account");
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [docType, setDocType] = useState<DocType>("cpf");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profiles, setProfiles] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    const saved = loadProfile(userId);
    if (saved) {
      setName(saved.name || session?.user?.name || "");
      setEmail(saved.email || session?.user?.email || "");
      setPhone(saved.phone);
      setWhatsapp(saved.whatsapp);
      setDocType(saved.docType);
      setCpfCnpj(saved.cpfCnpj);
      setProfiles(saved.profiles);
    } else {
      setName(session?.user?.name || "");
      setEmail(session?.user?.email || "");
    }
  }, [session, userId]);

  function toggleProfile(key: string) {
    setProfiles((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    saveProfile(userId, { name, email, phone, docType, cpfCnpj, whatsapp, profiles });
    toast.success(t("personalSaved"));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-demo-target="personal-form">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("personalTitle")}</h1>
        <p className="text-sm text-brand-gray">{t("personalSubtitle")}</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("personalName")} *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("personalPassword")}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label>{t("personalEmail")} *</Label>
                <Input value={email} disabled className="bg-surface-light" />
              </div>
              <div className="space-y-2">
                <Label>{t("personalConfirmPassword")}</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label>{t("personalPhone")}</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 99999-0000"
                />
              </div>
              <div className="space-y-2 sm:row-start-4">
                <Label>{t("personalWhatsapp")}</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                  placeholder="(11) 99999-0000"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-baseline gap-4">
                  {(["cpf", "cnpj"] as const).map((dt) => (
                    <label key={dt} className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-dark">
                      <input
                        type="radio"
                        name="docType"
                        checked={docType === dt}
                        onChange={() => { setDocType(dt); setCpfCnpj(""); }}
                        className="accent-brand-blue"
                      />
                      {dt === "cpf" ? "CPF" : "CNPJ"}
                    </label>
                  ))}
                </div>
                <Input
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(docType === "cpf" ? maskCpf(e.target.value) : maskCnpj(e.target.value))}
                  placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                  maxLength={docType === "cpf" ? 14 : 18}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>{t("personalProfileType")}</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PROFILE_OPTIONS.map((key) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-brand-dark">
                    <input
                      type="checkbox"
                      checked={profiles.includes(key)}
                      onChange={() => toggleProfile(key)}
                      className="accent-brand-blue"
                    />
                    {t(`profile.${key}`)}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit">{t("personalSave")}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
