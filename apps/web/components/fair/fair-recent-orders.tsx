"use client";

import { ClipboardCopy, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StatusPill } from "@/components/brand/status-pill";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cancelFairOrder,
  confirmFairOrder,
  dismissFairOrder,
  getFairOrderHandoffSummary,
} from "@/lib/actions/fair-vendor/orders";

export type FairRecentOrderRow = {
  id: string;
  status: string;
  createdAt: string;
  totalBrl: number;
  guestName: string | null;
  itemCount: number;
};

type Props = {
  orders: FairRecentOrderRow[];
  locale: string;
  boothName: string;
};

export function FairRecentOrders({ orders, locale, boothName }: Props) {
  const t = useTranslations("fairVendor");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [, startTransition] = useTransition();

  async function openSummary(orderId: string) {
    setPendingId(orderId);
    try {
      const text = await getFairOrderHandoffSummary(orderId, locale);
      setSummaryText(text);
      setSummaryOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("orderActionError"));
    } finally {
      setPendingId(null);
    }
  }

  async function handleConfirm(orderId: string) {
    setPendingId(orderId);
    try {
      const { summary } = await confirmFairOrder(orderId);
      setSummaryText(summary);
      setSummaryOpen(true);
      toast.success(t("orderConfirmed"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("orderActionError"));
    } finally {
      setPendingId(null);
    }
  }

  function handleCancel(orderId: string) {
    if (!window.confirm(t("confirmCancel"))) return;
    setPendingId(orderId);
    startTransition(async () => {
      try {
        await cancelFairOrder(orderId);
        toast.success(t("orderCancelled"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("orderActionError"));
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleDismiss(orderId: string) {
    if (!window.confirm(t("confirmRemove"))) return;
    setPendingId(orderId);
    startTransition(async () => {
      try {
        await dismissFairOrder(orderId);
        toast.success(t("orderRemoved"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("orderActionError"));
      } finally {
        setPendingId(null);
      }
    });
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      toast.success(t("summaryCopied"));
    } catch {
      toast.error(t("orderActionError"));
    }
  }

  function renderActions(order: FairRecentOrderRow) {
    const busy = pendingId === order.id;
    const canConfirm = order.status === "PENDING";
    const canCopySummary = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);
    const canCancel = order.status === "PENDING" || order.status === "CONFIRMED";
    const canDismiss = order.status === "CANCELLED";

    return (
      <div className="flex flex-wrap gap-2">
        {canConfirm ? (
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => void handleConfirm(order.id)}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("confirmOrder")}
          </Button>
        ) : null}
        {canCopySummary ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void openSummary(order.id)}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("copySummary")}
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => handleCancel(order.id)}
          >
            {t("cancelOrder")}
          </Button>
        ) : null}
        {canDismiss ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => handleDismiss(order.id)}
          >
            {t("removeOrder")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (orders.length === 0) {
    return <p className="text-sm text-brand-gray">{t("noOrders")}</p>;
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {orders.map((o) => (
          <div key={o.id} className="rounded-lg border border-border bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-xs text-brand-gray">{o.id.slice(0, 8)}…</p>
              <StatusPill status={o.status} />
            </div>
            <p className="mt-2 text-sm font-medium text-brand-dark">{o.guestName ?? "—"}</p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-brand-gray">
                {new Date(o.createdAt).toLocaleDateString(locale)}
              </span>
              <span className="font-semibold">R$ {o.totalBrl.toFixed(2)}</span>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-brand-gray">{t("orderActions")}</p>
              {renderActions(o)}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-light text-left text-brand-gray">
            <tr>
              <th className="px-4 py-2">{t("orderId")}</th>
              <th className="px-4 py-2">{t("orderCustomer")}</th>
              <th className="px-4 py-2">{t("orderTotal")}</th>
              <th className="px-4 py-2">{t("orderStatus")}</th>
              <th className="px-4 py-2">{t("orderDate")}</th>
              <th className="px-4 py-2">{t("orderActions")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                <td className="px-4 py-2">{o.guestName ?? "—"}</td>
                <td className="px-4 py-2">R$ {o.totalBrl.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <StatusPill status={o.status} />
                </td>
                <td className="px-4 py-2 text-brand-gray">
                  {new Date(o.createdAt).toLocaleDateString(locale)}
                </td>
                <td className="px-4 py-2">{renderActions(o)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-h-[85dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto sm:w-full">
          <DialogHeader>
            <DialogTitle>{t("summaryTitle", { booth: boothName })}</DialogTitle>
          </DialogHeader>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-surface-light p-3 text-xs text-brand-dark">
            {summaryText}
          </pre>
          <Button type="button" variant="outline" className="w-full gap-2" onClick={() => void copySummary()}>
            <ClipboardCopy className="h-4 w-4" />
            {t("copySummary")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
