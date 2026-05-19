"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { maskCep } from "@/lib/cart/input-masks";
import { lookupCep } from "@/lib/cart/freight-simulator";
import { loadAddress, saveAddress, type SavedAddress } from "@/lib/account/profile-store";

const BRAZILIAN_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const EMPTY: SavedAddress = { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };

export default function AddressesPage() {
  const t = useTranslations("account");
  const tc = useTranslations("checkout");

  const [saved, setSaved] = useState<SavedAddress | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<SavedAddress>(EMPTY);

  useEffect(() => {
    const loaded = loadAddress();
    if (loaded) setSaved(loaded);
  }, []);

  function update(field: keyof SavedAddress, value: string) {
    const next = { ...form, [field]: value };

    if (field === "cep") {
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
    setForm(next);
  }

  function handleSave() {
    saveAddress(form);
    setSaved(form);
    setEditing(false);
    toast.success(t("personalSaved"));
  }

  function handleEdit() {
    setForm(saved ?? EMPTY);
    setEditing(true);
  }

  function handleDelete() {
    saveAddress(EMPTY);
    setSaved(null);
    setForm(EMPTY);
    setEditing(false);
  }

  function handleCreate() {
    setForm(EMPTY);
    setEditing(true);
  }

  const canSave = form.cep.replace(/\D/g, "").length === 8 && form.street && form.number && form.city && form.state;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">{t("addressesTitle")}</h1>
          <p className="text-sm text-brand-gray">{t("addressesSubtitle")}</p>
        </div>
        {!editing && (
          <Button onClick={handleCreate} size="sm">{t("addrCreate")}</Button>
        )}
      </div>

      {editing && (
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>{tc("cep")} *</Label>
                <Input value={form.cep} onChange={(e) => update("cep", e.target.value)} placeholder="00000-000" maxLength={9} />
                {form.city && form.state && (
                  <p className="text-xs text-brand-blue">{form.city} / {form.state}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{tc("street")} *</Label>
                <Input value={form.street} onChange={(e) => update("street", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tc("number")} *</Label>
                <Input value={form.number} onChange={(e) => update("number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tc("complement")}</Label>
                <Input value={form.complement} onChange={(e) => update("complement", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tc("neighborhood")}</Label>
                <Input value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tc("city")} *</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{tc("state")} *</Label>
                <select
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30"
                >
                  <option value="">—</option>
                  {BRAZILIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={!canSave}>{t("personalSave")}</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>{tc("back")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div data-demo-target="address-list">
        <h2 className="mb-3 text-lg font-bold text-brand-dark">{t("registeredAddresses")}</h2>
        {saved && saved.cep ? (
          <Card className="shadow-card">
            <CardContent className="flex items-start gap-4 p-5">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
              <div className="min-w-0 flex-1 space-y-0.5 text-sm text-brand-dark">
                <p className="font-semibold">{saved.street}, {saved.number}{saved.complement ? ` - ${saved.complement}` : ""}</p>
                <p className="text-brand-gray">{saved.neighborhood ? `${saved.neighborhood} — ` : ""}{saved.city}/{saved.state}</p>
                <p className="text-brand-gray">CEP: {saved.cep}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" onClick={handleEdit} aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Delete" className="text-error hover:text-error">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-border bg-white px-4 py-8 text-center text-sm text-brand-gray shadow-card">
            {t("addressesEmpty")}
          </div>
        )}
      </div>
    </div>
  );
}
