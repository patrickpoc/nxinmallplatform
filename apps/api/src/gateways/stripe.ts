import type { PaymentGateway } from "./payment.js";

/** Stripe card rails (BRL/USD) — integrate with Oboya Reciclagem merchant profile in production. */
export const stripeGateway: PaymentGateway = {
  name: "STRIPE",
  supportedCurrencies: ["BRL", "USD"],
  supportedCountries: ["BR", "US", "SG"],
  async processPayment() {
    return { reference: "stripe-demo", status: "PENDING" };
  },
  async getStatus(reference: string) {
    return { status: reference.includes("fail") ? "FAILED" : "AUTHORIZED" };
  },
  async handleWebhook() {
    return;
  },
};
