import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const BILLING_ROUTE_SOURCE = new URL("./paymentBillingRoutes.js", import.meta.url);
const ONE_WAY_BILLING_ROUTE_SOURCE = new URL("./paymentOneWayBillingRoutes.js", import.meta.url);

test("billing method update can restore safe tail from recent confirmed payment metadata", async () => {
  const source = await readFile(BILLING_ROUTE_SOURCE, "utf8");

  assert.match(source, /function getRecentConfirmedPaymentCardSummary/);
  assert.match(source, /FROM payments[\s\S]*status = 'confirmed'[\s\S]*LIMIT 5/);
  assert.match(source, /FROM payment_events[\s\S]*processing_status IN \('confirmed', 'processed'\)[\s\S]*LIMIT 10/);
  assert.match(source, /buildPaymentMethodSummary\([\s\S]*paymentResult\.rows\.map\(\(row\) => row\.metadata\)[\s\S]*eventResult\.rows\.map\(\(row\) => row\.payload\)/);
  assert.match(source, /canUseRecentPaymentCardSummary\(cardSummary, recentPaymentCardSummary\)/);
  assert.match(source, /storedCardSummary\.cardLast4/);
  assert.match(source, /storedCardSummary\.maskedCardNumber/);
});

test("billing method upserts preserve existing safe card tail when Toss issue payload omits it", async () => {
  const billingSource = await readFile(BILLING_ROUTE_SOURCE, "utf8");
  const oneWaySource = await readFile(ONE_WAY_BILLING_ROUTE_SOURCE, "utf8");

  [billingSource, oneWaySource].forEach((source) => {
    assert.match(source, /ON CONFLICT \(provider, customer_key\)/);
    assert.match(source, /display_label = CASE[\s\S]*recurring_payment_methods\.display_label[\s\S]*ELSE EXCLUDED\.display_label/);
    assert.match(source, /card_company = COALESCE\(EXCLUDED\.card_company, recurring_payment_methods\.card_company\)/);
    assert.match(source, /card_last4 = COALESCE\(EXCLUDED\.card_last4, recurring_payment_methods\.card_last4\)/);
    assert.match(source, /masked_card_number = COALESCE\(EXCLUDED\.masked_card_number, recurring_payment_methods\.masked_card_number\)/);
    assert.doesNotMatch(source, /card_last4 = EXCLUDED\.card_last4/);
    assert.doesNotMatch(source, /masked_card_number = EXCLUDED\.masked_card_number/);
  });
});

test("one-way billing prefers the Billing issue card and never uses billingKey as an event id", async () => {
  const source = await readFile(ONE_WAY_BILLING_ROUTE_SOURCE, "utf8");
  const issuedEventInsert = source.match(/INSERT INTO payment_events[\s\S]*?'billing\.key\.issued'[\s\S]*?\);/)?.[0] || "";

  assert.match(source, /getBillingCardSummary\(issuePayload, paymentPayload\)/);
  assert.match(source, /const billingKeyIssuedEventId = `\$\{authOrderId \|\| firstPaymentOrderId\}:billing-key-issued`/);
  assert.match(issuedEventInsert, /billingKeyIssuedEventId/);
  assert.doesNotMatch(issuedEventInsert, /issuePayload\.billingKey/);
  assert.match(source, /cardSummary\.maskedCardNumber/);
});

test("billing method update uses an internal order event id and keeps masked issue metadata primary", async () => {
  const source = await readFile(BILLING_ROUTE_SOURCE, "utf8");
  const issuedEventInsert = source.match(/INSERT INTO payment_events[\s\S]*?'billing\.key\.issued'[\s\S]*?\);/)?.[0] || "";

  assert.match(source, /const billingKeyIssuedEventId = `\$\{orderId\}:billing-key-issued`/);
  assert.match(source, /cardSummary\.cardLast4 \|\| cardSummary\.maskedCardNumber/);
  assert.match(issuedEventInsert, /billingKeyIssuedEventId/);
  assert.doesNotMatch(issuedEventInsert, /issuePayload\.billingKey/);
});
