import type { PaymentGateway } from "./payment.js";

/** PagSeguro PIX/boleto/card for Brazil domestic buyers (merchant: Oboya Reciclagem). */
export const pagseguroGateway: PaymentGateway = {
  name: "PAGSEGURO",
  supportedCurrencies: ["BRL"],
  supportedCountries: ["BR"],
  async processPayment() {
    return { reference: "pagseguro-demo", status: "PENDING" };
  },
  async getStatus(reference: string) {
    return { status: reference.includes("fail") ? "FAILED" : "PENDING" };
  },
  async handleWebhook() {
    return;
  },
};
