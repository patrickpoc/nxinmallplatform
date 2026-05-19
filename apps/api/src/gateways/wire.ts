import type { PaymentGateway } from "./payment.js";

/** Manual wire transfer confirmation workflow (buyer uploads SWIFT receipt, admin confirms). */
export const wireGateway: PaymentGateway = {
  name: "WIRE",
  supportedCurrencies: ["USD"],
  supportedCountries: ["*"],
  async processPayment() {
    return { reference: "wire-demo", status: "PENDING" };
  },
  async getStatus(reference: string) {
    return { status: reference.includes("paid") ? "CAPTURED" : "PENDING" };
  },
  async handleWebhook() {
    return;
  },
};
