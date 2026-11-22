import { test } from "node:test";
import assert from "node:assert/strict";
import { URL } from "node:url";
import { createQuoteMessage } from "../src/quoteMessage.ts";

test("includes every item, quantity and entered contact detail in the WhatsApp draft", () => {
  const message = createQuoteMessage("Kavita Surgical", "https://example.com/?private=value#quote", [
    { id: "first", name: "Scissors", sku: "SC-1", quantity: 3, price: "₹500", gstRate: 12 },
    { id: "second", name: "Forceps", sku: "FO-2", quantity: 7 },
  ], {
    buyerName: "A & B", organisation: "Clinic", phone: "+91 123", location: "Mumbai", notes: "Delivery & setup",
  });
  const url = new URL(`https://wa.me/918425019124?text=${encodeURIComponent(message)}`);
  const decoded = url.searchParams.get("text");
  assert.equal(decoded, message);
  for (const text of [
    "Scissors | SKU: SC-1 | Product ID: first | Quantity: 3",
    "Forceps | SKU: FO-2 | Product ID: second | Quantity: 7",
    "https://example.com/#product/first", "https://example.com/#product/second",
    "Indicative unit price: ₹500", "GST: 12%", "Name: A & B",
    "Organisation: Clinic", "Phone: +91 123", "Location: Mumbai", "Notes: Delivery & setup",
  ]) assert.ok(message.includes(text), text);
  assert.ok(!message.includes("private=value"));
  assert.equal((message.match(/Indicative unit price:/g) ?? []).length, 1);
});
