export type CartPriceCurrency = "USD" | "BRL";

export type CartLine = {
  lineId: string;
  productId: string;
  variantId: string;
  name: string;
  imageUrl?: string;
  priceAmount: number;
  priceCurrency: CartPriceCurrency;
  quantity: number;
  unit?: string;
};
