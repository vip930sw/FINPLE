import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";

import { createServer } from "vite";

const DATA_BASE_URL = "/app-data/finple-universe-v2-2026-07-24";
const DATA_REPO_ROOT = `public${DATA_BASE_URL}`;
const OUTPUTS = {
  comparison: "reports/portfolio-analysis/step4-step5-lineage-cohort-comparison.json",
  summary: "reports/portfolio-analysis/step4-step5-lineage-cohort-summary.md",
  evidence: "reports/portfolio-analysis/step4-step5-lineage-evidence-availability-matrix.json",
  coreSix: "reports/portfolio-analysis/step4-step5-lineage-core-six-audit.md",
};
const INPUTS = {
  runtimeCatalog: "src/data/tickers/finple_app_candidates_v2.csv",
  universeManifest: "src/data/tickers/finple_universe_v2_manifest.json",
  reconciliation: "src/data/tickers/finple_universe_v2_reconciliation.json",
  sourceReviewManifest: `${DATA_REPO_ROOT}/app-preview-manifest.json`,
  releaseManifest: `${DATA_REPO_ROOT}/production-app-export-release.json`,
  metricsOverlay: `${DATA_REPO_ROOT}/metrics-overlay.json`,
  monthlyIndex: `${DATA_REPO_ROOT}/monthly-returns-index.json`,
  monthlyShards: `${DATA_REPO_ROOT}/monthly-returns`,
  eligibilityInventory: "reports/portfolio-analysis/step4-step5-eligibility-inventory.json",
};
const CONTRACTS = [
  "docs/portfolio-analysis/FINPLE_STEP4_STEP5_MONTHLY_LINEAGE_INHERITANCE_CONTRACT.md",
  "docs/portfolio-analysis/FINPLE_STEP4_STEP5_REVIEW_POLICY_DECISION_CONTRACT.md",
];
const EXPECTED = Object.freeze({
  total: 6029,
  ready: 1338,
  directCandidates: 2323,
  existingDirectCandidates: 2321,
  deltaDirectCandidates: 2,
  directCandidateTuples: Object.freeze({
    "ready / ready / review_required": 1329,
    "short_history / short_history / short_history": 986,
    "review_required / review_required / review_required": 8,
  }),
  readyByMarket: Object.freeze({ KR: 280, US: 1058 }),
  directCandidateByMarket: Object.freeze({ KR: 1120, US: 1203 }),
  readyByAssetType: Object.freeze({ ETF: 656, stock: 682 }),
  directCandidateByAssetType: Object.freeze({ ETF: 634, stock: 1689 }),
  deltaDirectIdentities: Object.freeze(["US:QYLG", "US:XYLG"]),
});
const MINIMUM_HISTORY_MONTHS = 60;
const START_VALUE = 50_000_000;
const EVIDENCE_STATUSES = new Set([
  "present_in_repository",
  "present_only_as_pinned_binding",
  "referenced_but_not_preserved",
  "external_evidence_required",
  "not_applicable",
  "unknown",
]);
const CORE_POLICY_GROUPS = Object.freeze({
  initial_calendar_gap: Object.freeze(["KR:069500"]),
  mdd_threshold: Object.freeze(["US:VNQ"]),
  five_year_metric_review: Object.freeze(["KR:273130", "KR:305720", "KR:329200", "US:BLOK"]),
});
const ALLOWED_CHANGED_FILES = new Set([
  ...Object.values(OUTPUTS),
  ...CONTRACTS,
  "scripts/check-step4-step5-lineage-forensics.mjs",
  "package.json",
]);

function normalize(value) {
  return String(value || "").trim().toUpperCase();
}

function lower(value, fallback = "not_available") {
  return String(value || fallback).trim().toLowerCase();
}

function identityFor(asset = {}) {
  const market = normalize(asset.market);
  const ticker = normalize(asset.ticker);
  return market && ticker ? `${market}:${ticker}` : "";
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function isFiniteValue(value) {
  return !isBlank(value) && Number.isFinite(Number(value));
}

function sortedCounts(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return Object.fromEntries([...counts].sort(([left], [right]) => left.localeCompare(right)));
}

function assertUniqueSorted(rows) {
  const identities = rows.map((row) => row.identity);
  assert.equal(new Set(identities).size, identities.length, "duplicate identity in comparison");
  assert.deepEqual(identities, [...identities].sort(), "comparison identities are not deterministic");
}

function assertSafeObject(value, path = "report") {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.doesNotMatch(key, /sha256|hash|digest|approvedBy|userId|email|credential|accountIdentifier|privatePath/i, `unsafe report field ${path}.${key}`);
    assertSafeObject(child, `${path}.${key}`);
  }
}

function serializeDeterministicJson(value, depth = 0) {
  const indent = " ".repeat(depth);
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    if (value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      return `[\n${value.map((item) => `${indent}  ${JSON.stringify(item)}`).join(",\n")}\n${indent}]`;
    }
    return JSON.stringify(value);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (!entries.length) return "{}";
    return `{\n${entries.map(([key, child]) =>
      `${indent}  ${JSON.stringify(key)}: ${serializeDeterministicJson(child, depth + 2)}`
    ).join(",\n")}\n${indent}}`;
  }
  return JSON.stringify(value);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function localFetch(url) {
  const relative = String(url).split("?")[0].replace(DATA_BASE_URL, "").replace(/^\/+/, "");
  if (!relative || relative.split("/").includes("..")) return new Response(null, { status: 403 });
  try {
    return new Response(execFileSync("git", ["show", `HEAD:${DATA_REPO_ROOT}/${relative}`], {
      maxBuffer: 64 * 1024 * 1024,
    }), { status: 200 });
  } catch {
    return new Response(null, { status: 404 });
  }
}

function catalogReviewRequired(policy) {
  if (!policy) return false;
  return !(
    lower(policy.dataStatus, "") === "ready" &&
    lower(policy.metricsStatus, "") === "ready" &&
    lower(policy.reviewFlag, "") === "none" &&
    ["", "none"].includes(lower(policy.reviewApprovalStatus, "")) &&
    !String(policy.reviewApprovalPolicyVersion || "").trim() &&
    !String(policy.reviewPolicy || "").trim()
  );
}

function classifyEvidence(evidence) {
  const states = [];
  if (evidence.identityMismatch) states.push("identity_mismatch");
  if (!evidence.monthlyIdentityPresent) states.push("missing_monthly_identity");
  if (evidence.proxyMarked) states.push("proxy_marked");
  if (evidence.policyRejected && evidence.reviewRequired) states.push("review_required");
  if (evidence.policyRejected && evidence.legacyRows) states.push("legacy_unproven");
  if (evidence.monthlyIdentityPresent && evidence.contiguousHistoryMonths < MINIMUM_HISTORY_MONTHS) states.push("short_history_lt_60");
  if (!evidence.step3Ready) states.push("missing_or_invalid_metrics");
  if (!evidence.betaValid) states.push("missing_or_invalid_beta");
  const primary = states[0] || (evidence.policyRejected ? "other_policy_block" : "ready");
  const secondaryFlags = [...new Set(states.slice(1))].sort();
  if (primary === "ready" && evidence.legacyRows) secondaryFlags.push("legacy_v1_allowed_by_pinned_policy");
  return {
    primary,
    secondaryFlags: [...new Set(secondaryFlags)].sort(),
    step4Ready: primary === "ready" || primary === "missing_or_invalid_beta",
    step5Ready: primary === "ready",
  };
}

function directCandidate(evidence, policy) {
  return evidence.monthlyIdentityPresent && !evidence.identityMismatch && !evidence.proxyMarked &&
    evidence.policyRejected && evidence.reviewRequired && policy?.policyEvidenceValid === true &&
    policy?.ordinaryDistribution === true && evidence.contiguousHistoryMonths >= MINIMUM_HISTORY_MONTHS &&
    evidence.step3Ready && evidence.betaValid;
}

function reviewPolicyClass({ primary, isDirectCandidate, tuple, reviewReason }) {
  if (primary === "ready") return "none_current_catalog";
  if (!isDirectCandidate) return "outside_direct_candidate_scope";
  const reason = lower(reviewReason, "");
  if (tuple === "short_history / short_history / short_history") {
    return reason.includes("5y") ? "five_year_metric_review" : "short_history_metric_review";
  }
  if (reason.includes("missing calendar month")) return "initial_calendar_gap_review";
  if (reason.includes("mdd")) return "mdd_threshold_review";
  if (reason.includes("cagr")) return "cagr_threshold_review";
  if (reason.includes("beta")) return "beta_threshold_review";
  if (reason.includes("dividend")) return "dividend_threshold_review";
  if (tuple === "review_required / review_required / review_required") return "catalog_data_and_metrics_review";
  return "other_catalog_review";
}

function lineageEvidenceClass({ monthlyIdentityPresent, proxyMarked, legacyRows, explicitDirectRows }) {
  if (!monthlyIdentityPresent) return "no_monthly_identity";
  if (proxyMarked) return "proxy_detected";
  if (legacyRows) return "legacy_v1_pinned_binding_without_row_level_direct_receipt";
  if (explicitDirectRows) return "explicit_non_proxy_row_lineage";
  return "unknown_fail_closed";
}

function evidenceAvailabilityClass({ monthlyIdentityPresent, legacyRows, explicitDirectRows }) {
  if (!monthlyIdentityPresent) return "catalog_row_without_monthly_binding";
  if (legacyRows) return "pinned_binding_only_raw_receipt_not_preserved";
  if (explicitDirectRows) return "repository_explicit_row_lineage";
  return "unknown_fail_closed";
}

function sourceCohortFor(identity, deltaIdentities) {
  return deltaIdentities.has(identity) ? "us_delta_29" : "existing_6000";
}

function collectorCohortFor(identity, market, deltaIdentities) {
  if (deltaIdentities.has(identity)) return "us_delta_29_collector_path_receipt_not_preserved";
  return market === "KR"
    ? "existing_6000_kr_collector_path_receipt_not_preserved"
    : "existing_6000_us_collector_path_receipt_not_preserved";
}

function step3Ready(candidate, baseline) {
  return baseline.buildStep3MonthlyBaselineDetail({
    portfolio: { id: identityFor(candidate) },
    assets: [{ ...candidate, targetWeight: 100, targetEvaluationAmount: START_VALUE }],
    settings: { startValue: START_VALUE, monthlyCashFlow: 0, years: 1, inflationRate: 2.5, dividendReinvest: true },
  }).status === "ready";
}

function safeReasonCodes(row) {
  const codes = [row.currentEligibility, row.reviewPolicyClass, row.lineageEvidenceClass, row.sourceCohort];
  if (row.directCandidate) codes.push("catalog_review_gate_effective_blocker", "not_provenance_approved");
  if (row.currentEligibility === "ready") codes.push("pinned_legacy_binding_catalog_ready");
  if (row.monthlyRowContract === "legacy_v1") codes.push("legacy_v1_evidence_gap");
  return [...new Set(codes)].sort();
}

function buildEvidenceMatrix(reportAsOf) {
  const same = (key, status, note, repositoryPaths = []) => ({
    key,
    statusByGroup: { currentReady: status, directCandidate: status },
    repositoryPaths,
    note,
  });
  return {
    schemaVersion: "finple.step4-step5-lineage-evidence-availability.v1",
    reportAsOf,
    groups: { currentReady: EXPECTED.ready, directCandidate: EXPECTED.directCandidates },
    allowedStatuses: [...EVIDENCE_STATUSES].sort(),
    items: [
      same("runtime_catalog_row", "present_in_repository", "The frozen runtime catalog row is committed.", [INPUTS.runtimeCatalog]),
      same("metrics_overlay_row", "present_in_repository", "The pinned overlay row and catalog review fields are committed.", [INPUTS.metricsOverlay]),
      same("monthly_index_identity", "present_in_repository", "Every ready and direct-candidate identity is in the pinned monthly index.", [INPUTS.monthlyIndex]),
      same("monthly_shard_rows", "present_in_repository", "The bound legacy_v1 rows are committed in 64 shards.", [INPUTS.monthlyShards]),
      same("release_manifest", "present_in_repository", "The Production release binding is committed.", [INPUTS.releaseManifest]),
      same("source_review_manifest", "present_in_repository", "The app-export source review manifest is committed.", [INPUTS.sourceReviewManifest]),
      same("source_provider_class", "referenced_but_not_preserved", "Repository code is consistent with the documented provider class, but the exact executed provider session is not preserved."),
      same("collector_ref", "referenced_but_not_preserved", "Collector code exists, but the exact operator checkout used for each source run is not preserved."),
      same("per_identity_collector_ref", "external_evidence_required", "No per-identity collector/run receipt is committed."),
      same("raw_daily_bytes", "external_evidence_required", "Raw daily source bytes are intentionally outside this repository."),
      same("source_audit_csv", "referenced_but_not_preserved", "The source audit is referenced by runbooks but is not committed."),
      same("operator_run_receipt", "referenced_but_not_preserved", "No exact operator execution receipt is committed."),
      same("candidate_zip", "referenced_but_not_preserved", "A pinned digest does not mean the candidate ZIP bytes are present in the repository."),
      same("normalization_version", "present_in_repository", "The common normalization version is bound in the source review manifest and overlay.", [INPUTS.sourceReviewManifest, INPUTS.metricsOverlay]),
      same("calculation_version", "present_in_repository", "The calculation policy version is bound in the source review manifest.", [INPUTS.sourceReviewManifest]),
      same("direct_non_proxy_row_fields", "referenced_but_not_preserved", "legacy_v1 rows do not carry explicit row-level isProxy=false or direct-lineage fields."),
      same("review_decision", "present_in_repository", "Current catalog review fields are committed; direct candidates remain unapproved review triggers.", [INPUTS.metricsOverlay]),
      same("previous_release_binding", "present_only_as_pinned_binding", "The exact current legacy binding is present, but a reusable previous-release inheritance receipt is not."),
    ],
  };
}

function buildSummary(report) {
  const tupleRows = Object.entries(report.counts.directCandidateReviewTuples)
    .map(([key, count]) => `| \`${key}\` | ${count} |`).join("\n");
  const policyRows = Object.entries(report.distributions.directCandidateByReviewPolicyClass)
    .map(([key, count]) => `| \`${key}\` | ${count} |`).join("\n");
  return `# Step 4/5 Lineage Cohort Summary

- Report as of: \`${report.reportAsOf}\` (derived from the pinned release timestamp)
- Runtime identities: ${report.counts.total.toLocaleString("en-US")}
- Current ready: ${report.counts.ready.toLocaleString("en-US")}
- Direct candidates: ${report.counts.directCandidates.toLocaleString("en-US")}
- Scope: repository-only forensics; no asset is approved or made ready by this report

## Reconciliation

| Group | Total | KR | US | ETF | Stock |
| --- | ---: | ---: | ---: | ---: | ---: |
| All runtime identities | ${report.counts.total} | ${report.distributions.allByMarket.KR} | ${report.distributions.allByMarket.US} | ${report.distributions.allByAssetType.ETF} | ${report.distributions.allByAssetType.stock} |
| Current ready | ${report.counts.ready} | ${report.distributions.readyByMarket.KR} | ${report.distributions.readyByMarket.US} | ${report.distributions.readyByAssetType.ETF} | ${report.distributions.readyByAssetType.stock} |
| Direct candidate | ${report.counts.directCandidates} | ${report.distributions.directCandidateByMarket.KR} | ${report.distributions.directCandidateByMarket.US} | ${report.distributions.directCandidateByAssetType.ETF} | ${report.distributions.directCandidateByAssetType.stock} |

The direct-candidate total reconciles as \`1,329 + 986 + 8 = 2,323\`. These identities are **not provenance-approved**. Their effective current blocker is the frozen catalog review tuple after monthly identity, Step 3, Beta, 60-month history, ordinary-distribution, and pinned-binding checks pass.

| Catalog tuple: dataStatus / metricsStatus / reviewFlag | Count |
| --- | ---: |
${tupleRows}

## Collection cohorts

| Cohort | Runtime identities | Current ready | Direct candidates |
| --- | ---: | ---: | ---: |
| Existing 6,000 | ${report.cohorts.existing6000.total} | ${report.cohorts.existing6000.ready} | ${report.cohorts.existing6000.directCandidates} |
| 29-US delta | ${report.cohorts.usDelta29.total} | ${report.cohorts.usDelta29.ready} | ${report.cohorts.usDelta29.directCandidates} |

The delta direct candidates are \`US:QYLG\` and \`US:XYLG\`. The two source cohorts enter the same pinned candidate package and downstream normalization/export/release path, but the repository does not prove one shared raw Colab execution.

## Review-policy classes

| Class | Direct candidates |
| --- | ---: |
${policyRows}

Lineage evidence and review-policy decisions are separate fields and separate contracts. The 1,338 ready identities also retain the same \`legacy_v1\` evidence gap: no explicit row-level direct/non-proxy field and no repository-preserved per-identity collector/run receipt. Their current readiness comes from the exact pinned legacy binding plus frozen \`ready / ready / none\` catalog fields.

## Evidence boundary and next step

Repository evidence is sufficient to reproduce the 6,029-identity comparison, cohort counts, current discriminator, evidence matrix, and core-six policy grouping. It is not sufficient to claim identical raw collection execution or modern row-level direct lineage.

Colab is not required or authorized for this phase. Continue with repository review of the proposed lineage-inheritance and generic review-policy contracts. Use bounded Colab reproduction only after separate approval if a named identity or evidence-homogeneous cohort needs new direct-source evidence.
`;
}

function buildCoreSixAudit(report) {
  const byIdentity = new Map(report.identities.map((row) => [row.identity, row]));
  const requirements = {
    initial_calendar_gap: "Generic observed-row gap policy; forbid forward fill and returns crossing the gap; retain deterministic gap evidence.",
    mdd_threshold: "Generic MDD review trigger and approval evidence; distinguish valid extreme drawdown from metric error.",
    five_year_metric_review: "Generic conditions for accepting 5Y metrics; keep metric-window review separate from the 60-month Step 4/5 floor.",
  };
  const sections = Object.entries(CORE_POLICY_GROUPS).map(([group, identities]) => {
    const rows = identities.map((identity) => {
      const row = byIdentity.get(identity);
      return `| \`${identity}\` | \`${row.catalogDataStatus} / ${row.catalogMetricsStatus} / ${row.reviewFlag}\` | ${row.monthlyIdentityPresent} | ${row.contiguousHistoryMonths} | ${row.step3Ready} | ${row.betaValid} | \`${row.lineageEvidenceClass}\` | \`${row.reviewPolicyClass}\` | \`${row.primaryBlocker}\` | \`${row.evidenceAvailability}\` | policy decision possible without recollection; not approved | no |`;
    }).join("\n");
    return `## ${group.replaceAll("_", " ")}

Generic policy requirement: ${requirements[group]}

| Identity | Catalog data / metrics / review | Monthly identity | Contiguous months | Step 3 | Beta | Lineage evidence | Review-policy class | Current blocker | Repository evidence | Repository-only recoverability | Colab now |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}`;
  }).join("\n\n");
  return `# Step 4/5 Lineage Core-Six Audit

- Report as of: \`${report.reportAsOf}\`
- Result: audit only; no review flag, eligibility state, monthly data, or runtime behavior changed
- Common state: monthly identity present, Step 3 ready, Beta valid, at least 60 contiguous months, ordinary distribution, legacy_v1 pinned binding

The common state does not make these six identities one approval cohort. They require three generic review-policy decisions and retain the same legacy lineage-evidence gap as the current ready group.

${sections}

## Decision

All six remain \`review_required\` in current runtime policy. Repository-only contract and policy review is the next step. Colab remains prohibited unless later review identifies a named evidence gap that cannot be resolved from preserved evidence and receives separate bounded approval.
`;
}

function validateEvidenceMatrix(matrix) {
  assert.equal(matrix.items.length, 18);
  const keys = matrix.items.map((item) => item.key);
  assert.equal(new Set(keys).size, keys.length, "duplicate evidence key");
  for (const item of matrix.items) {
    for (const status of Object.values(item.statusByGroup)) {
      assert.ok(EVIDENCE_STATUSES.has(status), `unknown evidence status: ${status}`);
    }
  }
}

function validateReport(report, deltaIdentities) {
  assert.equal(report.identities.length, EXPECTED.total);
  assertUniqueSorted(report.identities);
  assert.equal(report.counts.ready, EXPECTED.ready);
  assert.equal(report.counts.directCandidates, EXPECTED.directCandidates);
  assert.deepEqual(report.counts.directCandidateReviewTuples, EXPECTED.directCandidateTuples);
  assert.deepEqual(report.distributions.readyByMarket, EXPECTED.readyByMarket);
  assert.deepEqual(report.distributions.directCandidateByMarket, EXPECTED.directCandidateByMarket);
  assert.deepEqual(report.distributions.readyByAssetType, EXPECTED.readyByAssetType);
  assert.deepEqual(report.distributions.directCandidateByAssetType, EXPECTED.directCandidateByAssetType);
  assert.equal(report.cohorts.existing6000.directCandidates, EXPECTED.existingDirectCandidates);
  assert.equal(report.cohorts.usDelta29.directCandidates, EXPECTED.deltaDirectCandidates);
  assert.deepEqual(report.cohorts.usDelta29.directCandidateIdentities, EXPECTED.deltaDirectIdentities);
  assert.equal(deltaIdentities.size, 29);

  const readyAndDirect = report.identities.filter((row) => row.currentEligibility === "ready" || row.directCandidate);
  assert.equal(readyAndDirect.length, EXPECTED.ready + EXPECTED.directCandidates);
  for (const row of readyAndDirect) {
    assert.equal(row.monthlyIdentityPresent, true);
    assert.equal(row.step3Ready, true);
    assert.equal(row.betaValid, true);
    assert.ok(row.contiguousHistoryMonths >= MINIMUM_HISTORY_MONTHS);
    assert.equal(row.distributionPolicyState, "ordinary");
    assert.equal(row.monthlyRowContract, "legacy_v1");
    assert.equal(row.monthlyLineageState, "legacy_unproven");
    assert.equal(row.proxyEvidenceState, "not_proxy_marked_legacy");
    assert.equal(row.monthlyRowDataStatus, "candidate");
    assert.equal(row.lineageEvidenceClass, "legacy_v1_pinned_binding_without_row_level_direct_receipt");
    assert.ok(Object.hasOwn(row, "reviewPolicyClass"));
    assert.ok(Object.hasOwn(row, "lineageEvidenceClass"));
  }
  for (const identity of Object.values(CORE_POLICY_GROUPS).flat()) {
    assert.ok(report.identities.some((row) => row.identity === identity), `missing core-six identity ${identity}`);
  }
  for (const [group, identities] of Object.entries(CORE_POLICY_GROUPS)) {
    const expectedClass = group === "initial_calendar_gap" ? "initial_calendar_gap_review"
      : group === "mdd_threshold" ? "mdd_threshold_review"
        : "five_year_metric_review";
    for (const identity of identities) {
      assert.equal(report.identities.find((row) => row.identity === identity).reviewPolicyClass, expectedClass);
    }
  }
}

function changedFiles() {
  const commands = [
    ["diff", "--name-only"],
    ["diff", "--cached", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
    ["diff", "--name-only", "main...HEAD"],
  ];
  return [...new Set(commands.flatMap((args) => {
    try {
      return execFileSync("git", args, { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
    } catch {
      return [];
    }
  }).map((path) => path.replaceAll("\\", "/")))].sort();
}

function assertProtectedScope() {
  const unexpected = changedFiles().filter((path) => !ALLOWED_CHANGED_FILES.has(path));
  assert.deepEqual(unexpected, [], `protected input mutation detected: ${unexpected.join(", ")}`);
}

async function assertContracts() {
  const requiredMarkers = [
    ["canonical MARKET:TICKER identity", "historical prefix integrity", "59 months to 60 months", "release timestamp"],
    ["threshold is a review trigger", "ticker-specific exceptions are prohibited", "short_history", "review-policy version"],
  ];
  for (let index = 0; index < CONTRACTS.length; index += 1) {
    const text = await readFile(CONTRACTS[index], "utf8");
    for (const marker of requiredMarkers[index]) {
      assert.ok(text.toLowerCase().includes(marker.toLowerCase()), `${CONTRACTS[index]} missing ${marker}`);
    }
  }
}

async function buildReport(vite) {
  const [catalog, production, baseline, step4, lineage, sourceReview, release, reconciliation, metricsOverlay, eligibilityInventory] = await Promise.all([
    vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js"),
    vite.ssrLoadModule("/src/data/tickers/productionAppExportDataSource.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/monthlyBaselineEngine.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/appPreviewScenarioService.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/monthlyScenarioLineagePolicy.js"),
    readJson(INPUTS.sourceReviewManifest),
    readJson(INPUTS.releaseManifest),
    readJson(INPUTS.reconciliation),
    readJson(INPUTS.metricsOverlay),
    readJson(INPUTS.eligibilityInventory),
  ]);
  await catalog.loadScreenerCandidateRuntime();
  const candidates = [...catalog.ALL_SCREENER_CANDIDATES].sort((left, right) => identityFor(left).localeCompare(identityFor(right)));
  assert.equal(candidates.length, EXPECTED.total);
  assert.equal(new Set(candidates.map(identityFor)).size, candidates.length, "duplicate runtime identity");
  const deltaIdentities = new Set(reconciliation.newIdentities);
  const options = {
    enabled: true,
    monthlyEnabled: true,
    baseUrl: DATA_BASE_URL,
    releaseManifestSha256: production.PINNED_LEGACY_PRODUCTION_RELEASE_SHA256,
    sourceAppExportSha256: production.PINNED_LEGACY_SOURCE_APP_EXPORT_SHA256,
    fetchImpl: localFetch,
  };
  const productionCatalog = await production.loadProductionAppExportCatalog(options);
  const overlayByIdentity = new Map(metricsOverlay.rows.map((row) => [row.identity, row]));
  const monthlyIdentities = Object.keys(productionCatalog.index.assets).sort();
  const monthlyReturns = await production.loadProductionMonthlyReturnsForIdentities(monthlyIdentities, options);
  assert.deepEqual(monthlyReturns.missingIdentities, []);

  const identities = candidates.map((candidate) => {
    const identity = identityFor(candidate);
    const market = normalize(candidate.market);
    const rows = monthlyReturns.rowsByIdentity[identity] || [];
    const indexRecord = productionCatalog.index.assets[identity] || null;
    const policy = productionCatalog.catalogPolicyByIdentity[identity] || null;
    const overlayRow = overlayByIdentity.get(identity) || null;
    const months = rows.map((row) => String(row.month || "").slice(0, 7));
    assert.equal(new Set(months).size, months.length, `${identity} has duplicate months`);
    assert.ok(months.every((month) => /^\d{4}-\d{2}$/.test(month)), `${identity} has invalid month`);
    const contiguous = step4.longestContiguousMonthSegment([...months].sort());
    const monthlyIdentityPresent = Boolean(indexRecord && rows.length);
    const identityMismatch = Boolean(indexRecord && (
      `${normalize(indexRecord.market)}:${normalize(indexRecord.ticker)}` !== identity ||
      rows.some((row) => identityFor(row) !== identity)
    ));
    const proxyMarked = rows.some((row) => row.isProxy === true || String(row.proxyTicker || "").trim() ||
      /(?:^|[*:_\-\s])proxy(?:$|[*:_\-\s])/i.test(String(row.dataStatus || "")));
    const legacyRows = rows.length > 0 && rows.every((row) => row.proxyLineageStatus === "legacy_unproven");
    const explicitDirectRows = rows.length > 0 && rows.every((row) => row.proxyLineageStatus === "non_proxy_proven");
    let policyRejected = false;
    if (monthlyIdentityPresent && !identityMismatch) {
      try {
        lineage.assertMonthlyScenarioLineage(identity, rows, {
          runtimeMode: "production_app_export_ready",
          monthlyRowContract: monthlyReturns.monthlyRowContract,
          legacyProductionBindingVerified: monthlyReturns.legacyProductionBindingVerified,
          catalogPolicyByIdentity: monthlyReturns.catalogPolicyByIdentity,
        });
      } catch {
        policyRejected = true;
      }
    }
    const evidence = {
      identityMismatch,
      monthlyIdentityPresent,
      proxyMarked,
      policyRejected,
      reviewRequired: catalogReviewRequired(policy),
      legacyRows,
      contiguousHistoryMonths: contiguous.length,
      step3Ready: step3Ready(candidate, baseline),
      betaValid: isFiniteValue(candidate.beta),
    };
    const states = classifyEvidence(evidence);
    const isDirectCandidate = directCandidate(evidence, policy);
    const dataStatus = lower(policy?.dataStatus);
    const metricsStatus = lower(policy?.metricsStatus);
    const reviewFlag = lower(policy?.reviewFlag);
    const tuple = `${dataStatus} / ${metricsStatus} / ${reviewFlag}`;
    const lineageClass = lineageEvidenceClass({ monthlyIdentityPresent, proxyMarked, legacyRows, explicitDirectRows });
    const row = {
      identity,
      market,
      ticker: normalize(candidate.ticker),
      assetType: candidate.assetType || candidate.type || "unknown",
      currentEligibility: states.primary,
      step3Ready: evidence.step3Ready,
      step4Ready: states.step4Ready,
      step5Ready: states.step5Ready,
      betaValid: evidence.betaValid,
      monthlyIdentityPresent,
      contiguousHistoryMonths: contiguous.length,
      monthlyRowContract: monthlyIdentityPresent ? monthlyReturns.monthlyRowContract : null,
      monthlyRowDataStatus: rows.length && new Set(rows.map((item) => lower(item.dataStatus))).size === 1 ? lower(rows[0].dataStatus) : null,
      monthlyLineageState: !monthlyIdentityPresent ? "not_available" : legacyRows ? "legacy_unproven" : explicitDirectRows ? "direct_non_proxy_proven" : "invalid_or_mixed",
      proxyEvidenceState: !monthlyIdentityPresent ? "not_available" : proxyMarked ? "proxy_marked" : legacyRows ? "not_proxy_marked_legacy" : "not_proxy_marked_direct",
      catalogDataStatus: dataStatus,
      catalogMetricsStatus: metricsStatus,
      reviewFlag,
      reviewApprovalStatus: isBlank(policy?.reviewApprovalStatus) ? null : lower(policy.reviewApprovalStatus),
      reviewPolicy: isBlank(policy?.reviewPolicy) ? null : String(policy.reviewPolicy),
      distributionPolicyState: policy?.ordinaryDistribution === true ? "ordinary" : policy?.ordinaryDistribution === false ? "non_ordinary" : "unknown",
      sourceCohort: sourceCohortFor(identity, deltaIdentities),
      sourceProviderClass: "repository_provider_path_referenced_execution_unproven",
      collectorCohort: collectorCohortFor(identity, market, deltaIdentities),
      normalizationCohort: overlayRow?.normalizationVersion || sourceReview.normalizationVersion || "not_available",
      calculationPolicyVersion: sourceReview.calculationPolicyVersion,
      lineageEvidenceClass: lineageClass,
      reviewPolicyClass: reviewPolicyClass({ primary: states.primary, isDirectCandidate, tuple, reviewReason: overlayRow?.reviewReason }),
      primaryBlocker: states.primary === "ready" ? null : states.primary,
      secondaryFlags: states.secondaryFlags,
      directCandidate: isDirectCandidate,
      evidenceAvailability: evidenceAvailabilityClass({ monthlyIdentityPresent, legacyRows, explicitDirectRows }),
      colabRequired: false,
      colabAssessment: isDirectCandidate || states.primary === "ready" ? "not_required_current_repository_phase" : "not_assessed_outside_ready_direct_candidate_scope",
      reasonCodes: [],
    };
    row.reasonCodes = safeReasonCodes(row);
    return row;
  });

  const ready = identities.filter((row) => row.currentEligibility === "ready");
  const candidatesDirect = identities.filter((row) => row.directCandidate);
  const existing = identities.filter((row) => row.sourceCohort === "existing_6000");
  const delta = identities.filter((row) => row.sourceCohort === "us_delta_29");
  const report = {
    schemaVersion: "finple.step4-step5-lineage-cohort-comparison.v1",
    reportAsOf: String(release.approvedAt).slice(0, 10),
    inputReleaseTimestamp: release.approvedAt,
    scopeStatement: "Repository-only characterization. Direct candidates are not provenance-approved and no eligibility state is changed.",
    inputBindings: {
      ...INPUTS,
      monthlyShardCount: release.shardCount,
      monthlyIdentityCount: release.monthlyReturnAssetCount,
      monthlyRowCount: release.monthlyReturnRowCount,
      monthlyRowContract: monthlyReturns.monthlyRowContract,
      normalizationVersion: sourceReview.normalizationVersion,
      calculationPolicyVersion: sourceReview.calculationPolicyVersion,
      sourceCandidatePackageVersion: sourceReview.sourceCandidatePackageVersion,
    },
    counts: {
      total: identities.length,
      ready: ready.length,
      directCandidates: candidatesDirect.length,
      directCandidateReviewTuples: sortedCounts(candidatesDirect.map((row) => `${row.catalogDataStatus} / ${row.catalogMetricsStatus} / ${row.reviewFlag}`)),
    },
    cohorts: {
      existing6000: { total: existing.length, ready: existing.filter((row) => row.currentEligibility === "ready").length, directCandidates: existing.filter((row) => row.directCandidate).length },
      usDelta29: { total: delta.length, ready: delta.filter((row) => row.currentEligibility === "ready").length, directCandidates: delta.filter((row) => row.directCandidate).length, directCandidateIdentities: delta.filter((row) => row.directCandidate).map((row) => row.identity) },
    },
    distributions: {
      allByMarket: sortedCounts(identities.map((row) => row.market)),
      allByAssetType: sortedCounts(identities.map((row) => row.assetType)),
      readyByMarket: sortedCounts(ready.map((row) => row.market)),
      readyByAssetType: sortedCounts(ready.map((row) => row.assetType)),
      directCandidateByMarket: sortedCounts(candidatesDirect.map((row) => row.market)),
      directCandidateByAssetType: sortedCounts(candidatesDirect.map((row) => row.assetType)),
      directCandidateByReviewPolicyClass: sortedCounts(candidatesDirect.map((row) => row.reviewPolicyClass)),
    },
    identities,
  };
  const acceptedInventoryByIdentity = new Map(eligibilityInventory.assets.map((row) => [row.identity, row]));
  assert.equal(acceptedInventoryByIdentity.size, identities.length, "accepted eligibility inventory count mismatch");
  for (const row of identities) {
    const accepted = acceptedInventoryByIdentity.get(row.identity);
    assert.ok(accepted, `accepted eligibility inventory missing ${row.identity}`);
    assert.deepEqual({
      currentEligibility: row.currentEligibility,
      step3Ready: row.step3Ready,
      step4Ready: row.step4Ready,
      step5Ready: row.step5Ready,
      betaValid: row.betaValid,
      monthlyIdentityPresent: row.monthlyIdentityPresent,
      contiguousHistoryMonths: row.contiguousHistoryMonths,
      catalogDataStatus: row.catalogDataStatus,
      catalogMetricsStatus: row.catalogMetricsStatus,
      directCandidate: row.directCandidate,
    }, {
      currentEligibility: accepted.primaryEligibilityState,
      step3Ready: accepted.step3State === "ready",
      step4Ready: accepted.step4State === "ready",
      step5Ready: accepted.step5State === "ready",
      betaValid: accepted.betaValid,
      monthlyIdentityPresent: accepted.monthlyIdentityPresent,
      contiguousHistoryMonths: accepted.contiguousHistoryMonths,
      catalogDataStatus: accepted.catalogDataStatus,
      catalogMetricsStatus: accepted.catalogMetricsStatus,
      directCandidate: accepted.directLineageRecoveryFeasible,
    }, `accepted eligibility inventory mismatch for ${row.identity}`);
  }
  validateReport(report, deltaIdentities);
  assertSafeObject(report);
  return report;
}

async function writeOrCheck(outputs, writeMode) {
  await mkdir("reports/portfolio-analysis", { recursive: true });
  for (const [path, text] of Object.entries(outputs)) {
    if (writeMode) await writeFile(path, text, "utf8");
    else assert.equal(await readFile(path, "utf8"), text, `${path} is stale; run with --write`);
  }
}

async function main() {
  const writeMode = process.argv.includes("--write");
  const checkMode = process.argv.includes("--check");
  assert.notEqual(writeMode, checkMode, "use exactly one of --write or --check");
  for (const path of Object.values(INPUTS)) {
    if (path === INPUTS.monthlyShards) continue;
    await access(path);
  }
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    define: { "import.meta.env": "{}" },
    server: { middlewareMode: true },
  });
  try {
    const report = await buildReport(vite);
    const matrix = buildEvidenceMatrix(report.reportAsOf);
    validateEvidenceMatrix(matrix);
    const comparisonText = `${serializeDeterministicJson(report)}\n`;
    assert.deepEqual(JSON.parse(comparisonText), report);
    const outputs = {
      [OUTPUTS.comparison]: comparisonText,
      [OUTPUTS.summary]: buildSummary(report),
      [OUTPUTS.evidence]: `${JSON.stringify(matrix, null, 2)}\n`,
      [OUTPUTS.coreSix]: buildCoreSixAudit(report),
    };
    await writeOrCheck(outputs, writeMode);
    await assertContracts();
    assertProtectedScope();
    console.log(JSON.stringify({
      ok: true,
      mode: writeMode ? "write" : "check",
      totalIdentities: report.counts.total,
      ready: report.counts.ready,
      directCandidates: report.counts.directCandidates,
      directCandidateReviewTuples: report.counts.directCandidateReviewTuples,
      existing6000DirectCandidates: report.cohorts.existing6000.directCandidates,
      usDelta29DirectCandidates: report.cohorts.usDelta29.directCandidates,
      protectedInputMutation: false,
    }, null, 2));
  } finally {
    await vite.close();
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
