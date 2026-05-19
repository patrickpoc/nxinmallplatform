import { getTranslations } from "next-intl/server";
import { CheckCircle, Clock, XCircle, Pause, AlertTriangle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const COUNTERS = [
  { key: "published", icon: CheckCircle, color: "text-green-600 bg-green-100" },
  { key: "inReview", icon: Clock, color: "text-amber-600 bg-amber-100" },
  { key: "incomplete", icon: XCircle, color: "text-red-600 bg-red-100" },
  { key: "paused", icon: Pause, color: "text-brand-gray bg-gray-100" },
  { key: "outOfStock", icon: AlertTriangle, color: "text-orange-600 bg-orange-100" },
  { key: "total", icon: Layers, color: "text-brand-blue bg-blue-100" },
] as const;

export default async function ListingsPage() {
  const t = await getTranslations("account");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Status counters */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {COUNTERS.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.key} className="shadow-card">
              <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-brand-dark">0</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-brand-gray">{t(`counter.${c.key}`)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{t("listingsTitle")}</h1>
        <p className="text-sm text-brand-gray">{t("listingsSubtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button disabled>{t("createUnit")}</Button>
        <Button variant="outline" disabled>{t("createBulk")}</Button>
      </div>

      {/* Search filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-semibold text-brand-dark">{t("searchListings")}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">{t("filterTitle")}</Label>
              <Input placeholder="" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("filterOriginState")}</Label>
              <select className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm">
                <option value="">—</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("filterStatus")}</Label>
              <select className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm">
                <option value="">—</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("filterSort")}</Label>
              <select className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm">
                <option value="">—</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("filterId")}</Label>
              <Input placeholder="" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("filterLastUpdate")}</Label>
              <select className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm">
                <option value="">—</option>
              </select>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm">{t("filterSearch")}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Listings table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light">
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colListing")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colLot")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colStatus")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colDefaultValue")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colActions")}</th>
              <th className="px-4 py-3 font-semibold text-brand-dark">{t("colVisits")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-brand-gray">
                {t("listingsEmpty")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
