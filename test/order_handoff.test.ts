import assert from "node:assert/strict";
import test from "node:test";
import { handoffOrder, type SellerAsset } from "../src/order_handoff.js";

test("hands a caption order to the next active seller and keeps the buyer update", async () => {
  const sellers: SellerAsset[] = [
    {
      sellerId: "primary-studio",
      formats: ["caption"],
      acceptingOrders: false,
      voiceNotes: "Editorial"
    },
    {
      sellerId: "backup-studio",
      formats: ["caption"],
      acceptingOrders: true,
      voiceNotes: "Direct and friendly"
    }
  ];
  let capturedPrompt = "";

  const receipt = await handoffOrder(
    {
      orderId: "order-7",
      brief: "Introduce a creator interview series for independent filmmakers.",
      format: "caption",
      buyerUpdate: "Keep it under two sentences."
    },
    sellers,
    async (prompt) => {
      capturedPrompt = prompt;
      return { text: "Meet the filmmakers behind the frame.", vendor: "vendor-b" };
    }
  );

  assert.equal(receipt.sellerId, "backup-studio");
  assert.equal(receipt.status, "handed-off");
  assert.equal(receipt.vendor, "vendor-b");
  assert.match(capturedPrompt, /Keep it under two sentences/);
});
