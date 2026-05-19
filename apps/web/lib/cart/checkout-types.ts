export type DocType = "cpf" | "cnpj";

export type ShippingAddress = {
  name: string;
  email: string;
  phone: string;
  docType: DocType;
  cpfCnpj: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type FreightOption = {
  id: string;
  carrier: string;
  service: string;
  price: number;
  currency: "BRL";
  deliveryDays: number;
};

export type PaymentMethodType = "boleto" | "pix" | "credit_card";

export type PaymentMethod =
  | { type: "boleto" }
  | { type: "pix" }
  | {
      type: "credit_card";
      cardName: string;
      cardNumber: string;
      expiry: string;
      cvv: string;
      installments: number;
    };

export const PAYMENT_DISCOUNTS: Record<PaymentMethodType, number> = {
  boleto: 0.02,
  pix: 0.03,
  credit_card: 0,
};

export const EMPTY_ADDRESS: ShippingAddress = {
  name: "",
  email: "",
  phone: "",
  docType: "cpf",
  cpfCnpj: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};
