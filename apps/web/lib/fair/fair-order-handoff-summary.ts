import { formatStorefrontMoney } from "@/lib/money-format";

export type FairShippingAddress = {
  street?: string;
  city?: string;
  state?: string | null;
  postalCode?: string;
  country?: string;
};

export type FairOrderHandoffItem = {
  productName: string;
  sku: string;
  quantity: number;
  unitPriceBrl: number;
  lineTotalBrl: number;
};

export type FairOrderHandoffInput = {
  orderId: string;
  status: string;
  createdAt: Date;
  boothName: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  guestCpf: string | null;
  guestDocumentType?: string | null;
  shippingAddress?: FairShippingAddress | null;
  items: FairOrderHandoffItem[];
  totalBrl: number;
  locale?: string;
};

const STATUS_LABELS_PT: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  PROCESSING: "Em processamento",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  DISPUTED: "Em disputa",
};

function formatMoneyBrl(amount: number): string {
  return formatStorefrontMoney(amount, "BRL");
}

function formatDate(d: Date, locale: string): string {
  return d.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAddress(addr: FairShippingAddress | null | undefined): string {
  if (!addr?.street && !addr?.city) return "Não informado";
  const parts = [
    addr.street,
    [addr.city, addr.state].filter(Boolean).join(" - "),
    addr.postalCode ? `CEP ${addr.postalCode}` : null,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
}

function documentLabel(type: string | null | undefined): string {
  return type === "CNPJ" ? "CNPJ" : "CPF";
}

/** Plain-text handoff summary for the commercial team (fair booth orders). */
export function buildFairOrderHandoffSummary(input: FairOrderHandoffInput): string {
  const locale = input.locale ?? "pt-BR";
  const statusLabel = STATUS_LABELS_PT[input.status] ?? input.status;
  const docType = documentLabel(input.guestDocumentType);

  const lines: string[] = [
    "PEDIDO FEIRA — NxinMall",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `Pedido: ${input.orderId}`,
    `Data: ${formatDate(input.createdAt, locale)}`,
    `Estande: ${input.boothName}`,
    `Status: ${statusLabel}`,
    "",
    "CLIENTE",
    `Nome: ${input.guestName ?? "—"}`,
    `E-mail: ${input.guestEmail ?? "—"}`,
    `Telefone: ${input.guestPhone ?? "—"}`,
    `${docType}: ${input.guestCpf ?? "—"}`,
    "",
    "ENDEREÇO DE ENTREGA",
    formatAddress(input.shippingAddress),
    "",
    "ITENS",
  ];

  for (const item of input.items) {
    lines.push(
      `- ${item.productName} | SKU: ${item.sku} | Qtd: ${item.quantity} | ${formatMoneyBrl(item.unitPriceBrl)} un. | Subtotal ${formatMoneyBrl(item.lineTotalBrl)}`,
    );
  }

  lines.push(
    "",
    `TOTAL: ${formatMoneyBrl(input.totalBrl)}`,
    "Pagamento: Pix",
    "Frete: A combinar com vendedor",
    "",
    "Observação: Pedido originado da vitrine da feira.",
  );

  return lines.join("\n");
}

export function fairProductNameFromJson(name: unknown): string {
  if (name && typeof name === "object") {
    const o = name as { pt?: string; en?: string; zh?: string };
    return o.pt ?? o.en ?? o.zh ?? "—";
  }
  return "—";
}
