export {};

const response = await fetch("http://localhost:3000/orders/handoff", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    orderId: "order-1042",
    brief: "Announce a new weekly video series about practical home recording.",
    format: "caption",
    buyerUpdate: "Mention that the first episode arrives Friday."
  })
});

const result: unknown = await response.json();
console.log(JSON.stringify(result, null, 2));
