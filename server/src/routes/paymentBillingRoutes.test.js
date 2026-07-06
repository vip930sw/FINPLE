import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const BILLING_ROUTE_SOURCE = new URL("./paymentBillingRoutes.js", import.meta.url);
const ONE_WAY_BILLING_ROUTE_SOURCE = new URL("./paymentOneWayBillingRoutes.js", import.meta.url);

test("billing method update can restore safe tail from recent confirmed payment metadata", async () => {
  const source = await readFile(BILLING_ROUTE_SOURCE, "utf8");

  assert.match(source, /function getRecentConfirmedPaymentCardSummary/);
  assert.match(source, /FROM payments[\s\S]*status = 'confirmed'[\s\S]*LIMIT 5/);
  assert.match(source, /buildPaymentMethodSummary\(\.\.\.result\.rows\.map\(\(row\) => row\.metadata\)\)/);
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
