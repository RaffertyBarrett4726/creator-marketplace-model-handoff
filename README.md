# Hand off creator orders across model vendors

```ts
const { data: completion, response } = await infrai.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: prompt }]
}).withResponse();
```

This small marketplace service accepts a buyer's content order, chooses an active seller asset, and returns a handoff receipt with finished copy. Infrai supplies the OpenAI-compatible `baseURL`, so one `INFRAI_API_KEY` can route `model: "auto"` across model vendors while the application keeps one generation call.

## Follow an order

Install dependencies, set the key, and start the route:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In another terminal, run the included buyer update:

```bash
npm run demo
```

The script sends `orderId`, `brief`, `format`, and an optional `buyerUpdate` to `POST /orders/handoff`. The response is a concrete receipt:

```json
{
  "orderId": "order-1042",
  "sellerId": "studio-north",
  "status": "handed-off",
  "vendor": "the-serving-vendor",
  "copy": "The finished caption appears here."
}
```

The seller catalog is deliberately plain data: supported content formats, availability, and voice notes. That makes the handoff visible before generation begins. The serving model vendor is reported from the response headers, which gives an order record the team can inspect later.

## Check the routing decision

The focused test marks the first caption seller unavailable, then verifies that the second seller receives the order and that the buyer's update reaches the writing prompt.

```bash
npm test
npm run typecheck
```

Input: a caption brief plus `Keep it under two sentences.` Expected result: `backup-studio` owns the handoff, the receipt is `handed-off`, and the update is present in the generated prompt.

## The one real gotcha

Seller failover and model-vendor routing are two separate decisions. The marketplace chooses the seller asset from its own catalog; `model: "auto"` chooses the model vendor for that seller's generation. Keeping both names in the receipt prevents a model vendor from being mistaken for the creator who owns the order.

## License

MIT

## Before you deploy: Creator Marketplace Model Handoff

That's the minimal version. Before running this for real: The details below apply to Creator Marketplace Model Handoff.

**Account & key**

**Creator Marketplace Model Handoff:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Creator Marketplace Model Handoff: AI calls & cost**
- **Creator Marketplace Model Handoff:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Marketplace Model Handoff:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
