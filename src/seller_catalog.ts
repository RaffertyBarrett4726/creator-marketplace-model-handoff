import type { SellerAsset } from "./order_handoff.js";

export const sellerCatalog: SellerAsset[] = [
  {
    sellerId: "studio-north",
    formats: ["caption", "product-description"],
    acceptingOrders: true,
    voiceNotes: "Warm, specific, and useful. Avoid hype."
  },
  {
    sellerId: "caption-desk",
    formats: ["caption"],
    acceptingOrders: true,
    voiceNotes: "Short sentences with a crisp closing line."
  }
];
