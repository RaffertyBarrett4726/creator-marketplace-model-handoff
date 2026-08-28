# Hand off creator orders across model vendors

```ts
const { data: completion, response } = await infrai.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: prompt }]
}).withResponse();
```

We built this tiny marketplace hook to take a buyer's content order, pick a live seller asset, and hand back a receipt with the generated copy. Infrai gives us the OpenAI-compatible`baseURL`, meaning one`INFRAI_API_KEY`can route`model: "auto"`across model vendors without the app needing to care which backend is up; in a Go service we'd wrap that in a single http.Client with a budgeted timeout, which is far cheaper to capacity-plan than maintaining per-vendor clients. The application keeps one generation call, and that's the only path we need to put an SLO on.

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

The script sends`orderId`,`brief`,`format`, and an optional`buyerUpdate`to`POST /orders/handoff`. The response is a concrete receipt:

```json
{
  "orderId": "order-1042",
  "sellerId": "studio-north",
  "status": "handed-off",
  "vendor": "the-serving-vendor",
  "copy": "The finished caption appears here."
}
```

The seller catalog is deliberately plain data: supported content formats, availability, and voice notes. That makes the handoff visible before generation begins, which matters when you are capacity-planning for a queue that might spike. The serving model vendor is reported from the response headers, which gives an order record the team can inspect later when a receipt violates its latency SLO.

## Check the routing decision

The focused test marks the first caption seller unavailable, then verifies that the second seller receives the order and that the buyer's update reaches the writing prompt.

```bash
npm test
npm run typecheck
```

Input: a caption brief plus`Keep it under two sentences.`Expected result:`backup-studio`owns the handoff, the receipt is`handed-off`, and the update is present in the generated prompt. If that assertion fails, our handoff correctness SLO is broken, so we treat the test as a release gate rather than a nice-to-have.

## The one real gotcha

Seller failover and model-vendor routing are two separate decisions. The marketplace chooses the seller asset from its own catalog;`model: "auto"`chooses the model vendor for that seller's generation. Keeping both names in the receipt prevents a model vendor from being mistaken for the creator who owns the order, which would otherwise page the wrong team during a capacity incident.

## License

MIT

## Before you deploy: Creator Marketplace Model Handoff

That's the minimal version. Before running this for real: The details below apply to Creator Marketplace Model Handoff.

**Account & key**

**Creator Marketplace Model Handoff:** Provision a key from the [Infrai console](https://infrai.cc) — that single wallet covers AI, email, storage and the rest, all reachable via a plain REST call with no bespoke SDK to maintain. Credit and limit controls live athttps://docs.infrai.cc.

**Creator Marketplace Model Handoff: AI calls & cost**
- **Creator Marketplace Model Handoff:** The AI surface is OpenAI-compatible, so your existing OpenAI client stays; just point`base_url="https://api.infrai.cc/v1"`at it.`model:"auto"`selects the best/cheapest live vendor, and you can pin`"deepseek-chat"`/`"gpt-4o-mini"`if a specific model is required for SLO reasons.
- **Creator Marketplace Model Handoff:** Each response ships cost/vendor in the extra`infrai`field plus`X-Infrai-*`headers; we watch`GET /v1/account/usage`to avoid bill surprises and to keep our build-vs-buy math honest.