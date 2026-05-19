import type { PaymentGateway } from "./payment.js";

/** Lakala USD SWIFT settlement leg (Oboya Reciclagem → Agrichip SG) — webhook handler to be completed with live credentials. */
export const lakalaGateway: PaymentGateway = {
  name: "LAKALA",
  supportedCurrencies: ["USD"],
  supportedCountries: ["SG", "CN"],
  async processPayment() {
    return { reference: "lakala-demo", status: "PENDING" };
  },
  async getStatus(reference: string) {
    return { status: reference.includes("fail") ? "FAILED" : "PENDING" };
  },
  async handleWebhook() {
    return;
  },
};
