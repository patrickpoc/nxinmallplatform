export type WishlistItem = {
  productId: string;
  name: string;
  imageUrl?: string;
  priceAmount: number;
  priceCurrency: "USD" | "BRL";
};
