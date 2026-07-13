import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  STEP234B_LABEL_DISCLAIMER,
  STEP234B_REAL_FORMAT_DATASET_ADAPTER_CONTRACT,
  assertNoStep234BSensitiveMaterial,
  buildStep234BRealFormatDatasetDryRun,
  buildStep234BRealFormatDatasetDryRunReport,
  buildStep234BRealFormatDatasetFixture,
  validateStep234BRealFormatDatasetFixture,
} from "./tradingAiMlRealFormatDatasetAdapter.js";
import { buildStep229OfflineDatasetQualityProfile } from "./tradingAiMlDatasetQualityProfile.js";

const US_CSV = fs.readFileSync("src/data/tickers/us_screener_candidates.sample.csv", "utf8");
const KR_CSV = fs.readFileSync("src/data/tickers/kr_screener_candidates.sample.csv", "utf8");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function reverseDataRows(csv) {
  const lines = csv.trimEnd().split(/\r?\n/);
  return [lines[0], ...lines.slice(1).reverse()].join("\n");
}

test("Step234B builds a pass dry-run through Step229 to Step232", () => {
  const result = buildStep234BRealFormatDatasetDryRun({ usCsv: US_CSV, krCsv: KR_CSV });

  assert.equal(result.status, "pass");
  assert.equal(result.fixture.records.length, 10);
  assert.deepEqual(result.qualityProfile.recordCounts, { total: 10, train: 6, validation: 2, test: 2 });
  assert.deepEqual(result.qualityProfile.labelDistribution, [
    { label: "KR", count: 5, ratio: 0.5 },
    { label: "US", count: 5, ratio: 0.5 },
  ]);
  assert.equal(result.qualityProfile.status, "pass");
  assert.equal(result.batchSummary.overallStatus, "pass");
  assert.equal(result.gateDecision.decision, "allow_offline_promotion");
  assert.equal(result.gateDecision.allowedActions.offlineDatasetPromotion, true);
  assert.equal(result.gateDecision.allowedActions.modelTraining, false);
  assert.equal(result.gateDecision.allowedActions.providerAccess, false);
  assert.equal(result.gateDecision.allowedActions.orderSubmission, false);
  assert.equal(result.gateDecision.allowedActions.liveTrading, false);
  assert.equal(result.readiness.status, "ready_for_standalone_dry_run");
  assert.equal(result.readiness.readiness.actualLiveTradingReady, false);
  assert.equal(result.readiness.readiness.state, "blocked");
});

test("Step234B fixture uses exact allowed sanitized source fields and Step192 metadata", () => {
  const { sourceRows, fixture } = buildStep234BRealFormatDatasetFixture({ usCsv: US_CSV, krCsv: KR_CSV });

  assert.equal(sourceRows.length, 10);
  for (const row of sourceRows) {
    assert.deepEqual(Object.keys(row), STEP234B_REAL_FORMAT_DATASET_ADAPTER_CONTRACT.allowedSourceFields);
  }
  for (const record of fixture.records) {
    assert.deepEqual(Object.keys(record.sanitizedFields), [
      "market",
      "assetType",
      "strategy",
      "riskLevel",
      "beginnerFit",
      "tags",
      "sourceRowIndex",
    ]);
    assert.equal(record.versioning.datasetVersion, "step234b-dry-run-v1");
    assert.equal(record.lineage.sourceType, "repository_sanitized_sample");
    assert.equal(record.lineage.sourceContract, "step192");
    assert.equal(record.retentionPolicy.policyId, "test_fixture_only");
    assert.equal(record.retentionPolicy.rawValueStorageAllowed, false);
  }
  assert.equal(fixture.metadata.labelDisclaimer, STEP234B_LABEL_DISCLAIMER);
  assert.equal(fixture.metadata.timestampMode, "synthetic_for_adapter_dry_run");
});

test("Step234B deterministic split is balanced and chronological", () => {
  const { fixture } = buildStep234BRealFormatDatasetFixture({ usCsv: US_CSV, krCsv: KR_CSV });
  const bySplit = Object.groupBy(fixture.records, (record) => record.split);

  assert.deepEqual(bySplit.train.map((record) => record.label).sort(), ["KR", "KR", "KR", "US", "US", "US"]);
  assert.deepEqual(bySplit.validation.map((record) => record.label).sort(), ["KR", "US"]);
  assert.deepEqual(bySplit.test.map((record) => record.label).sort(), ["KR", "US"]);
  for (const record of fixture.records) {
    assert.equal(Date.parse(record.featureTimestamp) < Date.parse(record.labelTimestamp), true);
  }
  assert.equal(Date.parse(bySplit.train.at(-1).featureTimestamp) < Date.parse(bySplit.validation[0].featureTimestamp), true);
  assert.equal(Date.parse(bySplit.validation.at(-1).featureTimestamp) < Date.parse(bySplit.test[0].featureTimestamp), true);
});

test("Step234B threshold policies preserve numeric zero and string threshold types", () => {
  const { fixture } = buildStep234BRealFormatDatasetFixture({ usCsv: US_CSV, krCsv: KR_CSV });
  const profile = buildStep229OfflineDatasetQualityProfile(fixture);

  assert(fixture.records.some((record) => record.threshold === 0));
  assert(fixture.records.every((record) => typeof record.threshold === "number"));
  assert(fixture.records.every((record) => typeof record.stringThreshold === "string"));
  assert.deepEqual(profile.thresholdPolicy, {
    numericThresholdZeroPreserved: true,
    numericThresholdType: "number",
    stringThresholdTypePreserved: true,
    stringThresholdType: "string",
  });
});

test("Step234B failure fixtures block required quality risks", () => {
  const { fixture } = buildStep234BRealFormatDatasetFixture({ usCsv: US_CSV, krCsv: KR_CSV });
  const cases = [
    ["missing required value", (draft) => { delete draft.records[0].label; }, "profile"],
    ["duplicate split record", (draft) => { draft.records[1].recordId = draft.records[0].recordId; }, "profile"],
    ["cross split duplicate", (draft) => { draft.records[6].recordId = draft.records[0].recordId; }, "profile"],
    ["feature timestamp equal to label timestamp", (draft) => { draft.records[0].featureTimestamp = draft.records[0].labelTimestamp; }, "adapter"],
    ["future leakage", (draft) => { draft.records[0].featureTimestamp = "2020-01-16T00:00:00.000Z"; }, "profile"],
    ["temporal overlap", (draft) => { draft.records[6].featureTimestamp = "2020-05-01T00:00:00.000Z"; }, "profile"],
    ["provider payload shape", (draft) => { draft.records[0].rawProviderPayload = { raw: "provider payload" }; }, "profile"],
    ["disallowed field copied into output", (draft) => { draft.records[0].currency = "USD"; }, "adapter"],
    ["threshold type violation", (draft) => { draft.records[0].threshold = "0"; draft.records[1].stringThreshold = 0; }, "profile"],
  ];

  for (const [label, mutate, validator] of cases) {
    const draft = clone(fixture);
    mutate(draft);
    if (validator === "adapter") {
      assert.equal(validateStep234BRealFormatDatasetFixture(draft).status, "blocked", label);
    } else {
      const profile = buildStep229OfflineDatasetQualityProfile(draft);
      assert.equal(profile.status, "blocked", label);
    }
  }
});

test("Step234B blocks samples with fewer than five selected rows", () => {
  const shortUs = US_CSV.trimEnd().split(/\r?\n/).slice(0, 5).join("\n");
  const shortKr = KR_CSV.trimEnd().split(/\r?\n/).slice(0, 5).join("\n");

  assert.equal(buildStep234BRealFormatDatasetDryRun({ usCsv: shortUs, krCsv: KR_CSV }).status, "blocked");
  assert.equal(buildStep234BRealFormatDatasetDryRun({ usCsv: US_CSV, krCsv: shortKr }).status, "blocked");
  assert.equal(buildStep234BRealFormatDatasetDryRun({ usCsv: shortUs, krCsv: KR_CSV }).blocker.code, "US_SAMPLE_TOO_SMALL");
  assert.equal(buildStep234BRealFormatDatasetDryRun({ usCsv: US_CSV, krCsv: shortKr }).blocker.code, "KR_SAMPLE_TOO_SMALL");
});

test("Step234B output is deterministic despite source row and file processing order", () => {
  const first = buildStep234BRealFormatDatasetDryRunReport({ usCsv: US_CSV, krCsv: KR_CSV });
  const second = buildStep234BRealFormatDatasetDryRunReport({ usCsv: US_CSV, krCsv: KR_CSV });
  const reversed = buildStep234BRealFormatDatasetDryRunReport({
    usCsv: reverseDataRows(US_CSV),
    krCsv: reverseDataRows(KR_CSV),
  });

  assert.deepEqual(first, second);
  assert.deepEqual(first, reversed);
});

test("Step234B does not mutate parsed inputs or builder outputs", () => {
  const beforeUs = US_CSV;
  const beforeKr = KR_CSV;
  const result = buildStep234BRealFormatDatasetDryRun({ usCsv: US_CSV, krCsv: KR_CSV });
  const reportBefore = JSON.stringify(result.report);

  assert.equal(US_CSV, beforeUs);
  assert.equal(KR_CSV, beforeKr);
  assert.throws(() => {
    result.report.adapter.version = "mutated";
  }, /Cannot assign/);
  assert.equal(JSON.stringify(result.report), reportBefore);
});

test("Step234B report has canonical keys and no sensitive or trading-signal material", () => {
  const report = buildStep234BRealFormatDatasetDryRunReport({ usCsv: US_CSV, krCsv: KR_CSV });

  assert.deepEqual(Object.keys(report), STEP234B_REAL_FORMAT_DATASET_ADAPTER_CONTRACT.reportTopLevelKeys);
  assert.doesNotThrow(() => assertNoStep234BSensitiveMaterial(report));
  assert.equal(JSON.stringify(report).includes("VOO"), false);
  assert.equal(JSON.stringify(report).includes("005930"), false);
  assert.equal(report.adapter.labelPurpose, "adapter_conformance_only");
  assert.equal(report.adapter.labelDisclaimer, STEP234B_LABEL_DISCLAIMER);
});
