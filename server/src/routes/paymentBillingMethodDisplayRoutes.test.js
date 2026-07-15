import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const DISPLAY_ROUTE_SOURCE = new URL("./paymentBillingMethodDisplayRoutes.js", import.meta.url);
const LEGACY_ROUTE_SOURCE = new URL("./paymentBillingMethodRoutes.js", import.meta.url);
const INDEX_SOURCE = new URL("../index.js", import.meta.url);

test("billing method display route is mounted before legacy route and returns only safe display fields", async () => {
  const displaySource = await readFile(DISPLAY_ROUTE_SOURCE, "utf8");
  const legacySource = await readFile(LEGACY_ROUTE_SOURCE, "utf8");
  const indexSource = await readFile(INDEX_SOURCE, "utf8");
  const displayReturnBody = displaySource.match(/return \{[\s\S]*?updatedAt: row\.updated_at,[\s\S]*?\};/)?.[0] || "";

  assert.ok(
    indexSource.indexOf("paymentBillingMethodDisplayRoutes") < indexSource.indexOf("paymentBillingMethodRoutes"),
    "display route must be mounted before the legacy billing method route"
  );
  assert.match(displaySource, /"33": "우리카드"/);
  assert.match(displaySource, /W1: "우리카드"/);
  assert.match(displaySource, /p\.metadata->>'recurringPaymentMethodId' = rpm\.id::text/);
  assert.match(displaySource, /pe\.payload->>'recurringPaymentMethodId' = rpm\.id::text/);
  assert.match(displaySource, /pe\.payload->>'orderId' = rpm\.metadata->>'orderId'/);
  assert.match(displaySource, /pe\.event_type IN \('billing\.key\.issued', 'billing\.first_payment\.confirmed'\)/);
  assert.match(displaySource, /const providerSummary = buildPaymentMethodSummary\([\s\S]*\.\.\.paymentEventCandidates,[\s\S]*row\.payment_metadata/);
  assert.ok(
    displaySource.indexOf("providerSummary ||") < displaySource.indexOf("buildStoredPaymentMethodSummary(row)"),
    "related provider metadata must be considered before the stored row fallback"
  );
  assert.doesNotMatch(displaySource, /relation_rank|ELSE 1/);
  assert.match(displaySource, /payment_metadata_candidates/);
  assert.match(displaySource, /payment_event_candidates/);
  assert.match(displaySource, /jsonb_agg\(candidate\.metadata/);
  assert.match(displaySource, /jsonb_agg\(event_candidate\.payload/);
  assert.match(displaySource, /FROM payment_events/);
  assert.match(displaySource, /LIMIT 5/);
  assert.match(displaySource, /LIMIT 10/);
  assert.match(displaySource, /maskedCardNumber/);
  assert.match(displaySource, /cardLast4/);
  assert.match(displaySource, /cardCompany/);
  assert.match(displaySource, /등록된 카드/);
  assert.doesNotMatch(displaySource, /카드 등록 완료/);
  assert.doesNotMatch(displayReturnBody, /billingKeyEncrypted|billing_key_encrypted|customerKey|customer_key/i);
  assert.doesNotMatch(legacySource.match(/return \{[\s\S]*?issuedAt: row\.issued_at,[\s\S]*?\};/)?.[0] || "", /customerKey|billingKey/i);
});
