import type { ShippingAddress } from "@/lib/cart/checkout-types";

export const DEMO_CHECKOUT_ADDRESS: ShippingAddress = {
  name: "Demo Buyer",
  email: "demo-buyer@nxinmall.local",
  phone: "(11) 99999-9999",
  docType: "cpf",
  cpfCnpj: "529.982.247-25",
  cep: "01310-100",
  street: "Avenida Paulista",
  number: "1000",
  complement: "Sala 101",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
};
