import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPaymentMethodSummary,
  formatCardDisplayLabel,
  getMaskedTail,
  resolveCardCompany,
} from "./paymentMethodDisplay.js";

test("payment method display maps Woori issuer codes to the requested bank label", () => {
  assert.equal(resolveCardCompany("33"), "우리은행");
  assert.equal(resolveCardCompany("W1"), "우리은행");
  assert.equal(formatCardDisplayLabel("33", "9121"), "우리은행 9121");
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

  assert.equal(summary.displayLabel, "우리은행 9121");
  assert.equal(summary.cardCompany, "우리은행");
  assert.equal(summary.cardLast4, "9121");
});

test("payment method display extracts safe tails from stored masked values", () => {
  assert.equal(getMaskedTail("****-****-****-9121"), "9121");
  assert.equal(getMaskedTail("9121"), "9121");
  assert.equal(getMaskedTail("****"), "");
});
