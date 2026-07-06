import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPaymentMethodSummary,
  buildStoredPaymentMethodSummary,
  formatCardDisplayLabel,
  getMaskedTail,
  resolveCardCompany,
} from "./paymentMethodDisplay.js";

test("payment method display maps Woori issuer codes to the requested card label", () => {
  assert.equal(resolveCardCompany("33"), "우리카드");
  assert.equal(resolveCardCompany("W1"), "우리카드");
  assert.equal(resolveCardCompany("우리은행"), "우리");
  assert.equal(formatCardDisplayLabel("33", "9121"), "우리카드 · **** 9121");
});

test("payment method display prefers latest payment card tail over billing issue fallback", () => {
  const latestPayment = {
    card: {
      issuerCode: "33",
      number: "**** **** **** 9121",
    },
  };
  const billingIssue = {
    card: {
      company: "33",
      number: "33********2912",
    },
  };

  const summary = buildPaymentMethodSummary(latestPayment, billingIssue);

  assert.equal(summary.displayLabel, "우리카드 · **** 9121");
  assert.equal(summary.cardCompany, "우리카드");
  assert.equal(summary.cardLast4, "9121");
});

test("stored payment method display prefers stored card company and last4 over stale metadata", () => {
  const summary = buildStoredPaymentMethodSummary(
    {
      display_label: "카드 등록 완료",
      card_company: "33",
      card_last4: "9121",
      masked_card_number: "****-****-****-9121",
    },
    {
      card: {
        issuerCode: "33",
        number: "**** **** **** 2912",
      },
    }
  );

  assert.equal(summary.displayLabel, "우리카드 · **** 9121");
  assert.equal(summary.cardCompany, "우리카드");
  assert.equal(summary.cardLast4, "9121");
  assert.equal(summary.source, "stored_card_company_last4");
});

test("stored payment method display does not expose issuer-code prefixes from stale labels", () => {
  const summary = buildStoredPaymentMethodSummary({
    display_label: "33 **** 2912",
    card_company: "33",
    card_last4: "9121",
  });

  assert.equal(summary.cardLast4, "9121");
  assert.equal(summary.source, "stored_card_company_last4");
  assert.match(summary.displayLabel, /9121$/);
  assert.doesNotMatch(summary.displayLabel, /^33\b/);
});

test("stored payment method display safely parses code-prefixed labels when last4 is missing", () => {
  const summary = buildStoredPaymentMethodSummary({
    display_label: "33 **** 2912",
  });

  assert.equal(summary.cardLast4, "2912");
  assert.equal(summary.source, "stored_display_label");
  assert.match(summary.displayLabel, /2912$/);
  assert.doesNotMatch(summary.displayLabel, /^33\b/);
});

test("stored payment method display keeps a safe company-only fallback", () => {
  const summary = buildStoredPaymentMethodSummary({
    display_label: "우리카드 등록 완료",
    card_company: "33",
  });

  assert.equal(summary.displayLabel, "우리카드");
  assert.equal(summary.cardLast4, null);
  assert.doesNotMatch(summary.displayLabel, /\b33\b/);
  assert.doesNotMatch(summary.displayLabel, /등록 완료/);
});

test("payment method display extracts safe tails from stored masked values", () => {
  assert.equal(getMaskedTail("****-****-****-9121"), "9121");
  assert.equal(getMaskedTail("9121"), "9121");
  assert.equal(getMaskedTail("****"), "");
});

test("payment method display extracts Toss last4 aliases without exposing front digits", () => {
  const summary = buildPaymentMethodSummary({
    card: {
      issuerCode: "33",
      last4: "9121",
    },
  });

  assert.equal(summary.displayLabel, "우리카드 · **** 9121");
  assert.equal(summary.cardLast4, "9121");
  assert.doesNotMatch(summary.displayLabel, /\b33\b|2912/);
});
