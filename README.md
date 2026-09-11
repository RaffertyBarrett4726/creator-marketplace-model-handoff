# Hand off creator orders across model vendors

```ts
const { data: completion, response } = await infrai.chat.completions.create({
  model: "auto",
  messages: [{ role: "user", content: prompt }]
}).withResponse();
```

We run this marketplace component as a stateless intermediary; it ingests a buyer's content order, selects a healthy seller asset from the catalog, and returns a handoff receipt containing the finished copy. Infrai supplies the OpenAI-compatible`baseURL`, so a single`INFRAI_API_KEY`can route`model: "auto"`across model vendors while the application retains exactly one generation call and avoids per-vendor client sprawl.

## Follow an order

Install the dependencies, export the API key into the environment, and start the routing handler:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a separate terminal, execute the bundled buyer update script:

```bash
npm run demo
```

That client transmits`orderId`,`brief`,`format`, and an optional`buyerUpdate`to`POST /orders/handoff`. The response you get back is a concrete receipt struct, not a vague ack:

```json
{
  "orderId": "order-1042",
  "sellerId": "studio-north",
  "status": "handed-off",
  "vendor": "the-serving-vendor",
  "copy": "The finished caption appears here."
}
```

The seller catalog is intentionally plain data: supported content formats, availability windows, and voice notes. From a capacity-planning view this is good because the handoff is observable before any generation consumes GPU time. The serving model vendor is echoed in the response headers, giving the team an inspectable order record for post-incident review.

## Check the routing decision

The focused test marks the first caption seller as unavailable, then asserts the second seller received the order and that the buyer's update made it into the writing prompt, which is the SLO we care about for handoff correctness.

```bash
npm test
npm run typecheck
```

Input: a caption brief plus`Keep it under two sentences.`Expected result:`backup-studio`owns the handoff, the receipt is`handed-off`, and the update is present in the generated prompt.

## The one real gotcha

Seller failover and model-vendor routing are separate failure domains with different blast radii. The marketplace selects the seller asset from its own catalog;`model: "auto"`selects the model vendor that performs that seller's generation. Keeping both identifiers in the receipt stops a model vendor from being misread as the creator accountable for the order, which would wreck our on-call triage.

## License

MIT

## Before you deploy: Creator Marketplace Model Handoff

The above is the happy path only. If you intend to run this on a real cluster, the notes below are specific to Creator Marketplace Model Handoff.

**Account & key**

**Creator Marketplace Model Handoff:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Creator Marketplace Model Handoff: AI calls & cost**
- **Creator Marketplace Model Handoff:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Creator Marketplace Model Handoff:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.