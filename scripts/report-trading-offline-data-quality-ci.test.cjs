const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  ARTIFACT_NAME,
  ARTIFACT_RETENTION_DAYS,
  INTEGRATION_EFFECT_KEYS,
  JSON_REPORT_FILE,
  TEXT_REPORT_FILE,
  TOP_LEVEL_KEYS,
  assertNoSensitiveReportMaterial,
  buildCurrentOfflineDataQualityCiReport,
  formatOfflineDataQualityCiReport,
  writeOfflineDataQualityCiArtifact,
} = require("./report-trading-offline-data-quality-ci.cjs");

async function loadBuilders() {
  const [step230, step231, step232] = await Promise.all([
    import("../server/src/services/tradingAiMlDatasetQualityBatchSummary.js"),
    import("../server/src/services/tradingAiMlDatasetQualityGate.js"),
    import("../server/src/services/tradingAiMlDatasetQualityGateReadiness.js"),
  ]);
  return { step230, step231, step232 };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function passSummaryFrom(summary) {
  const source = clone(summary);
  source.fixtureCounts = { total: 1, pass: 1, reviewRequired: 0, blocked: 0 };
  source.recordCounts = { total: 6, train: 3, validation: 2, test: 1 };
  source.issueCounts = Object.fromEntries(Object.keys(source.issueCounts).map((key) => [key, 0]));
  source.fixtureResults = [{ fixtureKey: "balanced_valid", status: "pass" }];
  source.overallStatus = "pass";
  return source;
}

function reviewSummaryFrom(summary) {
  const source = passSummaryFrom(summary);
  source.fixtureCounts = { total: 1, pass: 0, reviewRequired: 1, blocked: 0 };
  source.issueCounts.labelImbalance = 1;
  source.fixtureResults = [{ fixtureKey: "label_imbalance", status: "review_required" }];
  source.overallStatus = "review_required";
  return source;
}

test("Step233 report exposes exact top-level and integrationEffect key sets", async () => {
  const report = await buildCurrentOfflineDataQualityCiReport();

  assert.deepEqual(Object.keys(report), TOP_LEVEL_KEYS);
  assert.deepEqual(Object.keys(report.integrationEffect), INTEGRATION_EFFECT_KEYS);
  assert.deepEqual(Object.keys(report.readiness), ["actualLiveTradingReady", "state"]);
  assert.equal(report.schemaVersion, "1.0.0");
  assert.equal(report.reportMode, "non_blocking_ci");
});

test("Step233 default report reuses Step229 through Step232 results", async () => {
  const report = await buildCurrentOfflineDataQualityCiReport();

  assert.equal(report.readinessStatus, "ready_for_non_blocking_ci_evaluation");
  assert.equal(report.executionStatus, "completed");
  assert.equal(report.qualityStatus, "blocked");
  assert.equal(report.gateDecision, "block_offline_promotion");
  assert.deepEqual(report.fixtureCounts, {
    total: 12,
    pass: 3,
    reviewRequired: 1,
    blocked: 8,
  });
  assert.deepEqual(report.reasonCodes, [
    "MISSING_REQUIRED_FIELDS",
    "DUPLICATE_RECORD_IDS",
    "CROSS_SPLIT_DUPLICATES",
    "TEMPORAL_OVERLAP",
    "FUTURE_LEAKAGE",
    "INVALID_WALK_FORWARD",
    "SENSITIVE_PAYLOAD",
    "THRESHOLD_TYPE_VIOLATION",
    "LABEL_IMBALANCE",
  ]);
});

test("Step233 readiness not_ready is skipped rather than completed", async () => {
  const builders = await loadBuilders();
  const batchSummary = builders.step230.buildStep230OfflineDatasetQualityBatchSummary();
  const gateDecision = builders.step231.buildStep231OfflineDataQualityGateDecision({ batchSummary });
  const readiness = builders.step232.buildStep232OfflineDataQualityGateReadiness({
    gateDecision,
    operatingModel: {},
    evidenceAvailability: {},
  });
  const report = await buildCurrentOfflineDataQualityCiReport({ builders, batchSummary, gateDecision, readiness });

  assert.equal(report.readinessStatus, "not_ready");
  assert.equal(report.executionStatus, "skipped_by_readiness_policy");
  assert.equal(report.integrationEffect.blocksMerge, false);
});

test("Step233 blocked review and pass quality statuses never become merge blocking", async () => {
  const builders = await loadBuilders();
  const blocked = await buildCurrentOfflineDataQualityCiReport({ builders });
  const baseSummary = builders.step230.buildStep230OfflineDatasetQualityBatchSummary();

  const reviewSummary = reviewSummaryFrom(baseSummary);
  const reviewGate = builders.step231.buildStep231OfflineDataQualityGateDecision({ batchSummary: reviewSummary });
  const review = await buildCurrentOfflineDataQualityCiReport({ builders, batchSummary: reviewSummary, gateDecision: reviewGate });

  const passingSummary = passSummaryFrom(baseSummary);
  const passGate = builders.step231.buildStep231OfflineDataQualityGateDecision({ batchSummary: passingSummary });
  const passing = await buildCurrentOfflineDataQualityCiReport({ builders, batchSummary: passingSummary, gateDecision: passGate });

  for (const report of [blocked, review, passing]) {
    assert.equal(report.integrationEffect.blocksMerge, false);
    assert.equal(report.integrationEffect.blocksDeployment, false);
    assert.equal(report.integrationEffect.startsModelTraining, false);
    assert.equal(report.integrationEffect.enablesProviderAccess, false);
    assert.equal(report.integrationEffect.enablesOrderSubmission, false);
    assert.equal(report.integrationEffect.enablesLiveTrading, false);
    assert.equal(report.readiness.actualLiveTradingReady, false);
    assert.equal(report.readiness.state, "blocked");
  }
});

test("Step233 report is deterministic canonical and mutation resistant", async () => {
  const builders = await loadBuilders();
  const batchSummary = builders.step230.buildStep230OfflineDatasetQualityBatchSummary();
  const gateDecision = clone(builders.step231.buildStep231OfflineDataQualityGateDecision({ batchSummary }));
  gateDecision.reasonCodes = [...gateDecision.reasonCodes, "FUTURE_LEAKAGE"].reverse();
  const beforeGate = JSON.stringify(gateDecision);
  const first = await buildCurrentOfflineDataQualityCiReport({ builders, batchSummary, gateDecision });
  const second = await buildCurrentOfflineDataQualityCiReport({ builders, gateDecision, batchSummary: clone(batchSummary) });

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(gateDecision), beforeGate);
  assert.equal(new Set(first.reasonCodes).size, first.reasonCodes.length);
  assert.deepEqual(first.reasonCodes, [
    "MISSING_REQUIRED_FIELDS",
    "DUPLICATE_RECORD_IDS",
    "CROSS_SPLIT_DUPLICATES",
    "TEMPORAL_OVERLAP",
    "FUTURE_LEAKAGE",
    "INVALID_WALK_FORWARD",
    "SENSITIVE_PAYLOAD",
    "THRESHOLD_TYPE_VIOLATION",
    "LABEL_IMBALANCE",
  ]);
});

test("Step233 JSON and text reports use fixed artifact names and consistent summary values", async () => {
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "finple-step233-report-"));
  try {
    const report = await buildCurrentOfflineDataQualityCiReport();
    const artifact = writeOfflineDataQualityCiArtifact(report, outputDir);
    const jsonPath = path.join(outputDir, JSON_REPORT_FILE);
    const textPath = path.join(outputDir, TEXT_REPORT_FILE);
    const writtenJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const writtenText = fs.readFileSync(textPath, "utf8");

    assert.equal(artifact.artifactName, ARTIFACT_NAME);
    assert.equal(artifact.retentionDays, ARTIFACT_RETENTION_DAYS);
    assert.deepEqual(path.basename(artifact.files[0]), JSON_REPORT_FILE);
    assert.deepEqual(path.basename(artifact.files[1]), TEXT_REPORT_FILE);
    assert.deepEqual(writtenJson, report);
    assert.match(writtenText, /FINPLE Offline Data-Quality Report/);
    assert.match(writtenText, /Readiness: ready_for_non_blocking_ci_evaluation/);
    assert.match(writtenText, /Execution: completed/);
    assert.match(writtenText, /Quality status: blocked/);
    assert.match(writtenText, /Merge blocking: No/);
  } finally {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

test("Step233 execution error is sanitized and non-blocking", async () => {
  const report = await buildCurrentOfflineDataQualityCiReport({
    executionErrorCode: "QUALITY_CHECK_EXECUTION_FAILED",
  });

  assert.equal(report.executionStatus, "execution_error");
  assert.equal(report.executionErrorCode, "QUALITY_CHECK_EXECUTION_FAILED");
  assert.equal(report.integrationEffect.blocksMerge, false);
  assert.equal(formatOfflineDataQualityCiReport(report).includes("QUALITY_CHECK_EXECUTION_FAILED"), true);
});

test("Step233 output excludes sensitive material", async () => {
  const report = await buildCurrentOfflineDataQualityCiReport();
  const text = formatOfflineDataQualityCiReport(report);
  const sensitive = assertNoSensitiveReportMaterial(report, text);

  assert.equal(sensitive.ok, true);
  assert.deepEqual(sensitive.violations, []);
});
