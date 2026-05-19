export type PaymentGatewayName = "LAKALA" | "STRIPE" | "PAGSEGURO" | "WIRE";

export type PaymentParams = {
  amount: string;
  currency: string;
  orderId: string;
  metadata?: Record<string, unknown>;
};

export type PaymentResult = { reference: string; status: "PENDING" | "AUTHORIZED" | "FAILED" };
export type PaymentStatus = { status: "PENDING" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED" };

/**
 * Payment gateway abstraction used by checkout flows (Phase 3).
 * Each concrete gateway implements provider-specific SDK calls + webhook signature validation.
 */
export interface PaymentGateway {
  name: PaymentGatewayName;
  supportedCurrencies: string[];
  supportedCountries: string[];
  processPayment(params: PaymentParams): Promise<PaymentResult>;
  getStatus(reference: string): Promise<PaymentStatus>;
  handleWebhook(payload: unknown): Promise<void>;
}
