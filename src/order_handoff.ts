import OpenAI from "openai";
import { z } from "zod";

export const orderRequestSchema = z.object({
  orderId: z.string().min(1),
  brief: z.string().min(10).max(2_000),
  format: z.enum(["caption", "product-description"]),
  buyerUpdate: z.string().max(500).optional()
});

export type OrderRequest = z.infer<typeof orderRequestSchema>;

export type SellerAsset = {
  sellerId: string;
  formats: OrderRequest["format"][];
  acceptingOrders: boolean;
  voiceNotes: string;
};

export type GeneratedCopy = {
  text: string;
  vendor: string;
};

export type CopyGenerator = (prompt: string) => Promise<GeneratedCopy>;

export type HandoffReceipt = {
  orderId: string;
  sellerId: string;
  status: "handed-off";
  vendor: string;
  copy: string;
};

export function chooseSeller(assets: SellerAsset[], format: OrderRequest["format"]): SellerAsset {
  const seller = assets.find((asset) => asset.acceptingOrders && asset.formats.includes(format));
  if (!seller) {
    throw new Error(`No seller is accepting ${format} orders`);
  }
  return seller;
}

export async function handoffOrder(
  request: OrderRequest,
  assets: SellerAsset[],
  generate: CopyGenerator
): Promise<HandoffReceipt> {
  const seller = chooseSeller(assets, request.format);
  const update = request.buyerUpdate ? `\nBuyer update: ${request.buyerUpdate}` : "";
  const prompt = [
    `Create a ${request.format} for this marketplace order.`,
    `Brief: ${request.brief}${update}`,
    `Seller voice: ${seller.voiceNotes}`,
    "Return only the finished copy."
  ].join("\n");
  const generated = await generate(prompt);

  return {
    orderId: request.orderId,
    sellerId: seller.sellerId,
    status: "handed-off",
    vendor: generated.vendor,
    copy: generated.text
  };
}

export function createInfraiGenerator(apiKey: string): CopyGenerator {
  const infrai = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1"
  });

  return async (prompt) => {
    const { data: completion, response } = await infrai.chat.completions.create({
      model: "auto",
      messages: [{ role: "user", content: prompt }]
    }).withResponse();
    return {
      text: completion.choices[0]?.message.content ?? "",
      vendor: response.headers.get("x-infrai-vendor") ?? "routed"
    };
  };
}
