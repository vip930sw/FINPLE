import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";

import { createServer } from "vite";

const DATA_BASE_URL = "/app-data/finple-universe-v2-2026-07-24";
const DATA_REPO_ROOT = `public${DATA_BASE_URL}`;
const INVENTORY_PATH = "reports/portfolio-analysis/step4-step5-eligibility-inventory.json";
const SUMMARY_PATH = "reports/portfolio-analysis/step4-step5-eligibility-summary.md";
const REPORT_AS_OF = "2026-08-04";
const EXPECTED_CATALOG_COUNT = 6029;
const MINIMUM_HISTORY_MONTHS = 60;
const START_VALUE = 50_000_000;
const OFFICIAL_PRESET_NAMES = [
  "DEFAULT_ASSETS",
  "DIVIDEND_ASSETS",
  "STABLE_ASSETS",
  "GROWTH_ASSETS",
  "GOLD_DEFENSE_ASSETS",
  "REIT_INCOME_ASSETS",
  "GROWTH_ZERO_ASSETS",
  "GROWTH_FOCUS_ASSETS",
  "ALL_WEATHER_ASSETS",
  "HIGH_CONVICTION_ASSETS",
];
const PRIMARY_STATES = new Set([
  "ready",
  "missing_monthly_identity",
  "short_history_lt_60",
  "proxy_marked",
  "legacy_unproven",
  "review_required",
  "identity_mismatch",
  "missing_or_invalid_beta",
  "missing_or_invalid_metrics",
  "other_policy_block",
]);
const REMEDIATION_BY_STATE = Object.freeze({
  ready: "none",
  missing_monthly_identity: "direct_monthly_data_missing",
  short_history_lt_60: "direct_history_too_short",
  proxy_marked: "proxy_only_currently",
  legacy_unproven: "direct_lineage_metadata_repair",
  review_required: "review_completion",
  identity_mismatch: "identity_mapping_repair",
  missing_or_invalid_beta: "beta_repair",
  missing_or_invalid_metrics: "needs_manual_audit",
  other_policy_block: "unsupported_product_policy",
});

function normalize(value) {
  return String(value || "").trim().toUpperCase();
}

function identityFor(asset = {}) {
  const market = normalize(asset.market);
  const ticker = normalize(asset.ticker);
  return market && ticker ? `${market}:${ticker}` : "";
}

function isCash(asset = {}) {
  return normalize(asset.market) === "CASH" && normalize(asset.ticker) === "CASH";
}

function percent(count, total) {
  return total > 0 ? Number((count * 100 / total).toFixed(4)) : 0;
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}

function assertUniqueCatalog(candidates) {
  const identities = candidates.map(identityFor);
  assert.ok(identities.every(Boolean), "runtime catalog contains an invalid identity");
  const duplicates = identities.filter((item, index) => identities.indexOf(item) !== index);
  assert.deepEqual([...new Set(duplicates)].sort(), [], `duplicate runtime identities: ${duplicates.join(",")}`);
  return identities;
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

function createFixtureSet(modules) {
  const official = OFFICIAL_PRESET_NAMES.map((name) => ({
    cohort: "official",
    name,
    displayName: name,
    assets: structuredClone(modules.constants[name]),
  }));
  const mbti = ["US", "KR"].flatMap((market) =>
    Object.entries(modules.mbtiStorage.MBTI_PRESET_MAP).map(([name, preset]) => ({
      cohort: market === "US" ? "usMbti" : "krMbti",
      name,
      displayName: modules.mbtiStorage.buildMbtiProfileFromResult({ type: { typeId: name, preset } })?.nickname || name,
      assets: modules.mbtiPage.buildAssetsFromPreset(preset, START_VALUE, market),
    })),
  );
  assert.equal(official.length, 10);
  assert.equal(mbti.filter((item) => item.cohort === "usMbti").length, 16);
  assert.equal(mbti.filter((item) => item.cohort === "krMbti").length, 16);
  return [...official, ...mbti];
}

function usageMaps(fixtures) {
  const maps = {
    official: new Map(),
    usMbti: new Map(),
    krMbti: new Map(),
  };
  for (const fixture of fixtures) {
    for (const asset of fixture.assets) {
      if (isCash(asset)) continue;
      const identity = identityFor(asset);
      const usages = maps[fixture.cohort].get(identity) || [];
      usages.push(fixture.name);
      maps[fixture.cohort].set(identity, usages);
    }
  }
  return maps;
}

function catalogReviewRequired(policy) {
  if (!policy) return false;
  return !(
    String(policy.dataStatus || "").trim().toLowerCase() === "ready" &&
    String(policy.metricsStatus || "").trim().toLowerCase() === "ready" &&
    String(policy.reviewFlag || "").trim().toLowerCase() === "none" &&
    ["", "none"].includes(String(policy.reviewApprovalStatus || "").trim().toLowerCase()) &&
    !String(policy.reviewApprovalPolicyVersion || "").trim() &&
    !String(policy.reviewPolicy || "").trim()
  );
}

function remediationFor(state, policy) {
  if (state !== "review_required") return REMEDIATION_BY_STATE[state];
  if (policy?.policyEvidenceValid !== true) return "needs_manual_audit";
  if (policy?.ordinaryDistribution !== true) return "unsupported_product_policy";
  return "review_completion";
}

function classifyEvidence(evidence) {
  const known = [];
  if (evidence.identityMismatch) known.push("identity_mismatch");
  if (!evidence.monthlyIdentityPresent) known.push("missing_monthly_identity");
  if (evidence.proxyMarked) known.push("proxy_marked");
  if (evidence.policyRejected && evidence.reviewRequired) known.push("review_required");
  if (evidence.policyRejected && evidence.legacyRows) known.push("legacy_unproven");
  if (evidence.monthlyIdentityPresent && evidence.contiguousHistoryMonths < MINIMUM_HISTORY_MONTHS) {
    known.push("short_history_lt_60");
  }
  if (!evidence.step3Ready) known.push("missing_or_invalid_metrics");
  if (!evidence.betaValid) known.push("missing_or_invalid_beta");

  const primary = known[0] || (evidence.policyRejected ? "other_policy_block" : "ready");
  const secondaryFlags = [...new Set(known.slice(1))].sort();
  if (primary === "ready" && evidence.legacyRows) secondaryFlags.push("legacy_v1_allowed_by_pinned_policy");
  const step4Ready = primary === "ready" || primary === "missing_or_invalid_beta";
  return {
    primary,
    secondaryFlags: [...new Set(secondaryFlags)].sort(),
    step4State: step4Ready ? "ready" : "expected_blocked",
    step5State: primary === "ready" ? "ready" : "expected_blocked",
  };
}

function runCharacterizationChecks() {
  const base = {
    identityMismatch: false,
    monthlyIdentityPresent: true,
    proxyMarked: false,
    policyRejected: false,
    reviewRequired: false,
    legacyRows: false,
    contiguousHistoryMonths: 60,
    step3Ready: true,
    betaValid: true,
  };
  assert.equal(classifyEvidence(base).primary, "ready");
  assert.equal(classifyEvidence({ ...base, monthlyIdentityPresent: false, contiguousHistoryMonths: 0 }).primary, "missing_monthly_identity");
  assert.equal(classifyEvidence({ ...base, contiguousHistoryMonths: 59 }).primary, "short_history_lt_60");
  assert.equal(classifyEvidence({ ...base, proxyMarked: true, policyRejected: true }).primary, "proxy_marked");
  assert.equal(classifyEvidence({ ...base, legacyRows: true }).primary, "ready");
  assert.equal(classifyEvidence({ ...base, legacyRows: true, policyRejected: true }).primary, "legacy_unproven");
  const review = classifyEvidence({ ...base, legacyRows: true, policyRejected: true, reviewRequired: true });
  assert.equal(review.primary, "review_required");
  assert.ok(review.secondaryFlags.includes("legacy_unproven"));
  assert.equal(classifyEvidence({ ...base, identityMismatch: true }).primary, "identity_mismatch");
  const beta = classifyEvidence({ ...base, betaValid: false });
  assert.deepEqual([beta.primary, beta.step4State, beta.step5State], ["missing_or_invalid_beta", "ready", "expected_blocked"]);
  assert.equal(classifyEvidence({ ...base, policyRejected: true }).primary, "other_policy_block");
  assert.throws(() => assertUniqueCatalog([{ market: "US", ticker: "DUP" }, { market: "us", ticker: "dup" }]));
}

function step3Ready(candidate, baseline) {
  const result = baseline.buildStep3MonthlyBaselineDetail({
    portfolio: { id: identityFor(candidate) },
    assets: [{ ...candidate, targetWeight: 100, targetEvaluationAmount: START_VALUE }],
    settings: { startValue: START_VALUE, monthlyCashFlow: 0, years: 1, inflationRate: 2.5, dividendReinvest: true },
  });
  return result.status === "ready";
}

function stateDistribution(assets) {
  return Object.fromEntries([...PRIMARY_STATES].map((state) => {
    const count = assets.filter((asset) => asset.primaryEligibilityState === state).length;
    return [state, { count, percent: percent(count, assets.length) }];
  }));
}

function coverageTotals(assets) {
  const step3ReadyCount = assets.filter((asset) => asset.step3State === "ready").length;
  const step4ReadyCount = assets.filter((asset) => asset.step4State === "ready").length;
  const step5ReadyCount = assets.filter((asset) => asset.step5State === "ready").length;
  const betaOnly = assets.filter((asset) =>
    asset.step4State === "ready" && asset.primaryEligibilityState === "missing_or_invalid_beta"
  ).length;
  return {
    total: assets.length,
    step3Ready: { count: step3ReadyCount, percent: percent(step3ReadyCount, assets.length) },
    step4NumericReady: { count: step4ReadyCount, percent: percent(step4ReadyCount, assets.length) },
    step5NumericReady: { count: step5ReadyCount, percent: percent(step5ReadyCount, assets.length) },
    step4ReadyStep5BetaBlocked: { count: betaOnly, percent: percent(betaOnly, assets.length) },
    step4ExpectedBlocked: assets.length - step4ReadyCount,
    step5ExpectedBlocked: assets.length - step5ReadyCount,
    primaryStates: stateDistribution(assets),
  };
}

function commonHistoryMonths(assets, inventoryByIdentity, rowsByIdentity, longestContiguousMonthSegment) {
  const identities = assets.filter((asset) => !isCash(asset)).map(identityFor);
  if (!identities.length || identities.some((item) => inventoryByIdentity.get(item)?.step4State !== "ready")) return null;
  const common = rowsByIdentity[identities[0]].map((row) => row.month).filter((month) =>
    identities.every((item) => rowsByIdentity[item].some((row) => row.month === month))
  );
  return longestContiguousMonthSegment(common).length;
}

function portfolioCoverage(fixture, inventoryByIdentity, monthlyReturns, modules) {
  const assets = fixture.assets.map((asset) => {
    const identity = identityFor(asset);
    if (isCash(asset)) {
      return {
        identity: "CASH:CASH",
        targetWeight: Number(asset.targetWeight || 0),
        eligibilityState: "native_manual_reference",
        step4State: "ready",
        step5State: "ready",
      };
    }
    const inventory = inventoryByIdentity.get(identity);
    assert.ok(inventory, `${fixture.cohort}:${fixture.name} references missing catalog identity ${identity}`);
    return {
      identity,
      targetWeight: Number(asset.targetWeight || 0),
      eligibilityState: inventory.primaryEligibilityState,
      step4State: inventory.step4State,
      step5State: inventory.step5State,
    };
  });
  const totalWeight = assets.reduce((sum, asset) => sum + asset.targetWeight, 0);
  assert.ok(Math.abs(totalWeight - 100) < 0.0001, `${fixture.cohort}:${fixture.name} target weights do not total 100`);
  const step4Blocked = assets.filter((asset) => asset.step4State !== "ready");
  const step5Blocked = assets.filter((asset) => asset.step5State !== "ready");
  const step3 = modules.baseline.buildStep3MonthlyBaselineDetail({
    portfolio: { id: fixture.name },
    assets: fixture.assets,
    settings: { startValue: START_VALUE, monthlyCashFlow: 0, years: 10, inflationRate: 2.5, dividendReinvest: true },
  });
  const blockedStates = [...new Set(step5Blocked.map((asset) => asset.eligibilityState))].sort();
  const remediationDependency = [...new Set(step5Blocked.map((asset) =>
    REMEDIATION_BY_STATE[asset.eligibilityState]
  ))].filter(Boolean).sort();
  return {
    name: fixture.name,
    displayName: fixture.displayName,
    assets,
    blockedIdentities: step5Blocked.map((asset) => asset.identity).sort(),
    step4BlockedIdentities: step4Blocked.map((asset) => asset.identity).sort(),
    step5BlockedIdentities: step5Blocked.map((asset) => asset.identity).sort(),
    blockedTargetWeightPercent: round(step5Blocked.reduce((sum, asset) => sum + asset.targetWeight, 0)),
    step4BlockedTargetWeightPercent: round(step4Blocked.reduce((sum, asset) => sum + asset.targetWeight, 0)),
    step5BlockedTargetWeightPercent: round(step5Blocked.reduce((sum, asset) => sum + asset.targetWeight, 0)),
    step3State: step3.status === "ready" ? "ready" : "expected_blocked",
    step4State: step4Blocked.length ? "expected_blocked" : "ready",
    step5ModerateState: step5Blocked.length ? "expected_blocked" : "ready",
    step5SevereState: step5Blocked.length ? "expected_blocked" : "ready",
    primaryReasonCategory: blockedStates[0] || "ready",
    commonHistoryMonths: commonHistoryMonths(
      fixture.assets,
      inventoryByIdentity,
      monthlyReturns.rowsByIdentity,
      modules.step4.longestContiguousMonthSegment,
    ),
    directLineageFeasible: remediationDependency.length > 0 && remediationDependency.every((item) =>
      ["direct_lineage_metadata_repair", "review_completion"].includes(item)
    ),
    remediationDependency,
  };
}

function buildImpactRanking(inventory, portfolios) {
  const weightByIdentity = new Map();
  for (const portfolio of portfolios) {
    for (const asset of portfolio.assets) {
      if (asset.identity === "CASH:CASH" || asset.step5State === "ready") continue;
      weightByIdentity.set(asset.identity, (weightByIdentity.get(asset.identity) || 0) + asset.targetWeight);
    }
  }
  return inventory.filter((asset) => asset.step5State !== "ready").map((asset) => {
    const officialCount = asset.officialPresetUsage.length;
    const mbtiCount = asset.usMbtiUsage.length + asset.krMbtiUsage.length;
    const blockedWeightSum = weightByIdentity.get(asset.identity) || 0;
    const repairFeasible = asset.directLineageRecoveryFeasible;
    return {
      identity: asset.identity,
      primaryEligibilityState: asset.primaryEligibilityState,
      recommendedRemediationClass: asset.recommendedRemediationClass,
      officialPresetCount: officialCount,
      usMbtiCount: asset.usMbtiUsage.length,
      krMbtiCount: asset.krMbtiUsage.length,
      blockedTargetWeightSum: round(blockedWeightSum),
      monthlyIdentityPresent: asset.monthlyIdentityPresent,
      contiguousHistoryMonths: asset.contiguousHistoryMonths,
      directLineageRecoveryCandidate: repairFeasible,
      impactScore: round(officialCount * 100 + mbtiCount * 10 + blockedWeightSum / 100 + (asset.monthlyIdentityPresent ? 1 : 0) + (repairFeasible ? 1 : 0) + asset.contiguousHistoryMonths / 10_000, 6),
    };
  }).sort((a, b) => b.impactScore - a.impactScore || (a.identity < b.identity ? -1 : a.identity > b.identity ? 1 : 0));
}

function markdownTable(rows) {
  return rows.map((cells) => `| ${cells.map((cell) => String(cell ?? "").replaceAll("|", "\\|")).join(" | ")} |`).join("\n");
}

function buildMarkdown(report) {
  const stateRows = Object.entries(report.coverage.overall.primaryStates).map(([state, value]) =>
    [state, value.count, `${value.percent}%`, report.coverage.byMarket.KR.primaryStates[state].count, report.coverage.byMarket.US.primaryStates[state].count]
  );
  const cohortTable = (items) => markdownTable([
    ["Portfolio", "Step 3", "Step 4", "Step 5 moderate/severe", "Step 4 blocked weight", "Step 5 blocked weight", "Blocked identities"],
    ["---", "---", "---", "---", "---:", "---:", "---"],
    ...items.map((item) => [
      item.displayName === item.name ? item.name : `${item.name} (${item.displayName})`,
      item.step3State,
      item.step4State,
      item.step5ModerateState,
      `${item.step4BlockedTargetWeightPercent}%`,
      `${item.step5BlockedTargetWeightPercent}%`,
      item.blockedIdentities.join(", ") || "none",
    ]),
  ]);
  const audits = report.specialAudits.map((asset) =>
    `- \`${asset.identity}\`: **${asset.primaryEligibilityState}**; ${asset.availableHistoryMonths} rows / ${asset.contiguousHistoryMonths} contiguous months; Step 4 ${asset.step4State}, Step 5 ${asset.step5State}; secondary flags: ${asset.secondaryFlags.join(", ") || "none"}; remediation: \`${asset.recommendedRemediationClass}\`.`
  ).join("\n");
  const ranking = report.impactRanking.slice(0, 20).map((item, index) =>
    `${index + 1}. \`${item.identity}\` — score ${item.impactScore}; ${item.primaryEligibilityState}; official ${item.officialPresetCount}, US MBTI ${item.usMbtiCount}, KR MBTI ${item.krMbtiCount}, summed blocked weight ${item.blockedTargetWeightSum}%.`
  ).join("\n");
  const remediation = report.directLineageRecoveryPriorities.slice(0, 20).map((item, index) =>
    `${index + 1}. \`${item.identity}\` — ${item.primaryEligibilityState}; \`${item.recommendedRemediationClass}\`; impact score ${item.impactScore}.`
  ).join("\n") || "No current direct-lineage recovery candidate.";

  return `# Step 4/5 Eligibility and Coverage Inventory

- Report as of: \`${report.reportAsOf}\`
- Input release timestamp: \`${report.inputReleaseTimestamp}\` (source binding timestamp, not report generation time)
- Runtime catalog: \`${report.inputBindings.runtimeCatalogPath}\` — ${report.coverage.overall.total.toLocaleString("en-US")} identities, excluding \`CASH:CASH\`
- Monthly binding: \`${report.inputBindings.pinnedReleaseManifestPath}\`, \`${report.inputBindings.pinnedMonthlyIndexPath}\`, ${report.inputBindings.pinnedMonthlyShardCount} shards
- Monthly contract: \`${report.inputBindings.monthlyRowContract}\`

An \`expected_blocked\` checker result is not numeric Step 4/5 availability.

## Reconciliation and numeric coverage

| Dimension | Count | Percent |
| --- | ---: | ---: |
| Runtime identities | ${report.coverage.overall.total} | 100% |
| KR | ${report.coverage.byMarket.KR.total} | ${percent(report.coverage.byMarket.KR.total, report.coverage.overall.total)}% |
| US | ${report.coverage.byMarket.US.total} | ${percent(report.coverage.byMarket.US.total, report.coverage.overall.total)}% |
| Step 3 ready | ${report.coverage.overall.step3Ready.count} | ${report.coverage.overall.step3Ready.percent}% |
| Step 4 numeric ready | ${report.coverage.overall.step4NumericReady.count} | ${report.coverage.overall.step4NumericReady.percent}% |
| Step 5 numeric ready | ${report.coverage.overall.step5NumericReady.count} | ${report.coverage.overall.step5NumericReady.percent}% |
| Step 4 ready / Step 5 Beta blocked | ${report.coverage.overall.step4ReadyStep5BetaBlocked.count} | ${report.coverage.overall.step4ReadyStep5BetaBlocked.percent}% |

## Primary states

${markdownTable([
    ["State", "Overall", "Percent", "KR", "US"],
    ["---", "---:", "---:", "---:", "---:"],
    ...stateRows,
  ])}

Primary precedence: identity mismatch → missing monthly identity → proxy marked → current catalog review gate → denied legacy lineage → short history → invalid Step 3 metrics → invalid Beta → final policy fallback → ready. When review and legacy evidence coexist, the current catalog review gate is primary and legacy evidence stays in \`secondaryFlags\`.

## Official portfolio coverage

\`CASH:CASH\` is excluded from the 6,029-identity inventory and appears below only as \`native_manual_reference\`, ready for portfolio calculations but distinct from catalog ready.

${cohortTable(report.portfolioCoverage.official)}

## US Investment MBTI coverage (16)

${cohortTable(report.portfolioCoverage.usMbti)}

## KR Investment MBTI coverage (16)

${cohortTable(report.portfolioCoverage.krMbti)}

## High-use and saved-portfolio dimensions

- Popularity/high-use coverage: \`${report.highUseCoverageStatus}\`. No cohort membership or weights were inferred.
- Saved-portfolio coverage: \`${report.savedPortfolioCoverageStatus}\`. No user DB or holdings were queried.

## High-impact blocked identities

Score = official preset count × 100 + total MBTI type count × 10 + summed blocked target weight ÷ 100 + monthly-identity-present bonus 1 + direct-lineage-repair-feasible bonus 1 + contiguous history months ÷ 10,000. Popularity and saved-portfolio dimensions are excluded because their approved aggregate sources are unavailable.

${ranking}

## Direct-lineage recovery priorities

${remediation}

## Required individual audits

${audits}

## Personal-plan implications

Step 1–3 availability does not imply numeric Step 4/5 availability. Product copy should continue to describe advanced analysis as available only for assets whose monthly identity, direct-lineage policy, contiguous history, required metrics, and Beta pass the current gates.

## Limitations and privacy

This is a deterministic, read-only inventory of checked-in runtime definitions and the pinned monthly release. It does not call providers, query databases or individual holdings, infer popularity, change runtime eligibility, or modify canonical/public data and pinned artifacts. Remediation scores prioritize review; they do not authorize data repair or Production changes.
`;
}

function assertSafeObject(value, path = "report") {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.doesNotMatch(key, /sha256|hash|digest|approvedBy|userId|email|credential|accountIdentifier|privatePath/i, `unsafe report field ${path}.${key}`);
    assertSafeObject(child, `${path}.${key}`);
  }
}

function validateReport(report) {
  assert.equal(report.coverage.overall.total, EXPECTED_CATALOG_COUNT);
  assert.equal(report.assets.length, EXPECTED_CATALOG_COUNT);
  assert.equal(new Set(report.assets.map((asset) => asset.identity)).size, EXPECTED_CATALOG_COUNT);
  assert.ok(!report.assets.some((asset) => asset.identity === "CASH:CASH"));
  assert.deepEqual(report.assets.map((asset) => asset.identity), [...report.assets.map((asset) => asset.identity)].sort());
  assert.ok(report.assets.every((asset) => PRIMARY_STATES.has(asset.primaryEligibilityState)));
  assert.equal(Object.values(report.coverage.overall.primaryStates).reduce((sum, value) => sum + value.count, 0), EXPECTED_CATALOG_COUNT);
  assert.equal(report.coverage.byMarket.KR.total + report.coverage.byMarket.US.total, EXPECTED_CATALOG_COUNT);
  for (const market of ["KR", "US"]) {
    assert.equal(Object.values(report.coverage.byMarket[market].primaryStates).reduce((sum, value) => sum + value.count, 0), report.coverage.byMarket[market].total);
  }
  assert.equal(report.portfolioCoverage.official.length, 10);
  assert.equal(report.portfolioCoverage.usMbti.length, 16);
  assert.equal(report.portfolioCoverage.krMbti.length, 16);
  for (const portfolio of [...report.portfolioCoverage.official, ...report.portfolioCoverage.usMbti, ...report.portfolioCoverage.krMbti]) {
    assert.ok(portfolio.blockedTargetWeightPercent >= 0 && portfolio.blockedTargetWeightPercent <= 100);
    assert.ok(portfolio.step4BlockedTargetWeightPercent >= 0 && portfolio.step4BlockedTargetWeightPercent <= 100);
    assert.ok(portfolio.step5BlockedTargetWeightPercent >= 0 && portfolio.step5BlockedTargetWeightPercent <= 100);
    for (const cash of portfolio.assets.filter((asset) => asset.identity === "CASH:CASH")) {
      assert.deepEqual([cash.eligibilityState, cash.step4State, cash.step5State], ["native_manual_reference", "ready", "ready"]);
    }
  }
  assert.equal(report.coverage.overall.step4NumericReady.count, report.assets.filter((asset) => asset.step4State === "ready").length);
  assert.equal(report.coverage.overall.step5NumericReady.count, report.assets.filter((asset) => asset.step5State === "ready").length);
  assert.equal(report.highUseCoverageStatus, "unavailable_no_canonical_source");
  assert.equal(report.savedPortfolioCoverageStatus, "not_available_no_privacy_safe_aggregate");
  for (const identity of ["KR:069500", "US:VNQ", "US:BLOK"]) {
    const audit = report.specialAudits.find((asset) => asset.identity === identity);
    assert.ok(audit, `missing special audit ${identity}`);
    assert.equal(audit.primaryEligibilityState, "review_required");
    assert.ok(audit.secondaryFlags.includes("legacy_unproven"));
    assert.equal(audit.step4State, "expected_blocked");
    assert.equal(audit.step5State, "expected_blocked");
  }
  assertSafeObject(report);
}

async function buildReport(vite) {
  const [constants, mbtiPage, mbtiStorage, catalog, production, baseline, step4, lineage] = await Promise.all([
    vite.ssrLoadModule("/src/components/portfolio/constants.js"),
    vite.ssrLoadModule("/src/components/InvestmentMbtiPage.jsx"),
    vite.ssrLoadModule("/src/components/portfolio/utils/mbtiProfileStorage.js"),
    vite.ssrLoadModule("/src/data/tickers/screenerCandidateLoader.js"),
    vite.ssrLoadModule("/src/data/tickers/productionAppExportDataSource.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/monthlyBaselineEngine.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/appPreviewScenarioService.js"),
    vite.ssrLoadModule("/src/components/portfolio/utils/monthlyScenarioLineagePolicy.js"),
  ]);
  await catalog.loadScreenerCandidateRuntime();
  const modules = { constants, mbtiPage, mbtiStorage, catalog, production, baseline, step4, lineage };
  const candidates = [...catalog.ALL_SCREENER_CANDIDATES].sort((a, b) => {
    const left = identityFor(a);
    const right = identityFor(b);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  assert.equal(candidates.length, EXPECTED_CATALOG_COUNT);
  assertUniqueCatalog(candidates);
  assert.ok(!candidates.some(isCash));

  const options = {
    enabled: true,
    monthlyEnabled: true,
    baseUrl: DATA_BASE_URL,
    releaseManifestSha256: production.PINNED_LEGACY_PRODUCTION_RELEASE_SHA256,
    sourceAppExportSha256: production.PINNED_LEGACY_SOURCE_APP_EXPORT_SHA256,
    fetchImpl: localFetch,
  };
  const productionCatalog = await production.loadProductionAppExportCatalog(options);
  const monthlyIdentities = Object.keys(productionCatalog.index.assets).sort();
  const monthlyReturns = await production.loadProductionMonthlyReturnsForIdentities(monthlyIdentities, options);
  assert.deepEqual(monthlyReturns.missingIdentities, []);
  const fixtures = createFixtureSet(modules);
  const usages = usageMaps(fixtures);

  const inventory = candidates.map((candidate) => {
    const identity = identityFor(candidate);
    const indexRecord = productionCatalog.index.assets[identity] || null;
    const rows = monthlyReturns.rowsByIdentity[identity] || [];
    const policy = productionCatalog.catalogPolicyByIdentity[identity] || null;
    const months = rows.map((row) => row.month);
    const contiguous = step4.longestContiguousMonthSegment(months);
    const monthlyIdentityPresent = Boolean(indexRecord && rows.length);
    const identityMismatch = Boolean(indexRecord && (
      `${normalize(indexRecord.market)}:${normalize(indexRecord.ticker)}` !== identity ||
      rows.some((row) => identityFor(row) !== identity)
    ));
    const proxyMarked = rows.some((row) =>
      row.isProxy === true || String(row.proxyTicker || "").trim() || /(?:^|[*:_\-\s])proxy(?:$|[*:_\-\s])/i.test(String(row.dataStatus || ""))
    );
    const legacyRows = rows.length > 0 && rows.every((row) => row.proxyLineageStatus === "legacy_unproven");
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
    const betaValid = Number.isFinite(Number(candidate.beta));
    const hasStep3 = step3Ready(candidate, baseline);
    const states = classifyEvidence({
      identityMismatch,
      monthlyIdentityPresent,
      proxyMarked,
      policyRejected,
      reviewRequired: catalogReviewRequired(policy),
      legacyRows,
      contiguousHistoryMonths: contiguous.length,
      step3Ready: hasStep3,
      betaValid,
    });
    const lineageState = !monthlyIdentityPresent
      ? "not_available"
      : proxyMarked
        ? "proxy_declared"
        : legacyRows
          ? "legacy_unproven"
          : rows.every((row) => row.proxyLineageStatus === "non_proxy_proven")
            ? "direct_non_proxy_proven"
            : "invalid_or_mixed";
    const reviewState = !policy
      ? "not_available"
      : catalogReviewRequired(policy)
        ? String(policy.reviewFlag || policy.dataStatus || "review_required").trim().toLowerCase()
        : "none";
    return {
      identity,
      market: normalize(candidate.market),
      ticker: normalize(candidate.ticker),
      displayName: candidate.koreanName || candidate.nameKr || candidate.ticker,
      assetType: candidate.assetType || candidate.type || "",
      productType: candidate.type || candidate.assetType || "",
      step3State: hasStep3 ? "ready" : "expected_blocked",
      monthlyIdentityPresent,
      availableHistoryMonths: rows.length,
      contiguousHistoryMonths: contiguous.length,
      dataStartMonth: contiguous[0]?.slice(0, 7) || null,
      dataEndMonth: contiguous.at(-1)?.slice(0, 7) || null,
      monthlyRowContract: monthlyIdentityPresent ? monthlyReturns.monthlyRowContract : null,
      proxyState: !monthlyIdentityPresent ? "not_available" : proxyMarked ? "proxy_marked" : legacyRows ? "not_proxy_marked_legacy" : "not_proxy_marked_direct",
      lineageState,
      catalogDataStatus: policy?.dataStatus || "not_available",
      catalogMetricsStatus: policy?.metricsStatus || "not_available",
      catalogReviewState: reviewState,
      betaValid,
      step4State: states.step4State,
      step4ReasonCategory: states.step4State === "ready" ? "ready" : states.primary,
      step5State: states.step5State,
      step5ReasonCategory: states.primary,
      primaryEligibilityState: states.primary,
      secondaryFlags: states.secondaryFlags,
      officialPresetUsage: [...(usages.official.get(identity) || [])].sort(),
      usMbtiUsage: [...(usages.usMbti.get(identity) || [])].sort(),
      krMbtiUsage: [...(usages.krMbti.get(identity) || [])].sort(),
      highUseCohortMembership: null,
      directLineageRecoveryFeasible: monthlyIdentityPresent && legacyRows && policyRejected &&
        policy?.policyEvidenceValid === true && policy?.ordinaryDistribution === true,
      recommendedRemediationClass: remediationFor(states.primary, policy),
    };
  });

  const inventoryByIdentity = new Map(inventory.map((asset) => [asset.identity, asset]));
  const coveredPortfolios = fixtures.map((fixture) => ({
    cohort: fixture.cohort,
    value: portfolioCoverage(fixture, inventoryByIdentity, monthlyReturns, modules),
  }));
  const portfolioCoverageReport = {
    official: coveredPortfolios.filter((item) => item.cohort === "official").map((item) => item.value),
    usMbti: coveredPortfolios.filter((item) => item.cohort === "usMbti").map((item) => item.value),
    krMbti: coveredPortfolios.filter((item) => item.cohort === "krMbti").map((item) => item.value),
  };
  const allPortfolios = Object.values(portfolioCoverageReport).flat();
  const fullImpactRanking = buildImpactRanking(inventory, allPortfolios);
  const directLineageRecoveryCandidates = fullImpactRanking.filter((item) => item.directLineageRecoveryCandidate);
  const report = {
    schemaVersion: "finple.step4-step5-eligibility-coverage.v1",
    reportAsOf: REPORT_AS_OF,
    inputReleaseTimestamp: productionCatalog.release.approvedAt,
    inputBindings: {
      runtimeCatalogPath: "src/data/tickers/finple_app_candidates_v2.csv",
      runtimeCatalogCount: candidates.length,
      pinnedReleaseManifestPath: `${DATA_REPO_ROOT}/production-app-export-release.json`,
      pinnedMonthlyIndexPath: `${DATA_REPO_ROOT}/monthly-returns-index.json`,
      pinnedMonthlyShardDirectory: `${DATA_REPO_ROOT}/monthly-returns`,
      pinnedMonthlyShardCount: productionCatalog.release.shardCount,
      pinnedMonthlyIdentityCount: productionCatalog.release.monthlyReturnAssetCount,
      pinnedMonthlyRowCount: productionCatalog.release.monthlyReturnRowCount,
      monthlyRowContract: monthlyReturns.monthlyRowContract,
      officialPortfolioDefinitionPath: "src/components/portfolio/constants.js",
      mbtiWeightDefinitionPath: "src/components/portfolio/utils/mbtiProfileStorage.js",
      mbtiMarketTemplatePath: "src/components/InvestmentMbtiPage.jsx",
    },
    classificationPrecedence: [
      "identity_mismatch",
      "missing_monthly_identity",
      "proxy_marked",
      "review_required",
      "legacy_unproven",
      "short_history_lt_60",
      "missing_or_invalid_metrics",
      "missing_or_invalid_beta",
      "other_policy_block_final_fallback",
      "ready",
    ],
    coverage: {
      overall: coverageTotals(inventory),
      byMarket: {
        KR: coverageTotals(inventory.filter((asset) => asset.market === "KR")),
        US: coverageTotals(inventory.filter((asset) => asset.market === "US")),
      },
    },
    highUseCoverageStatus: "unavailable_no_canonical_source",
    savedPortfolioCoverageStatus: "not_available_no_privacy_safe_aggregate",
    portfolioCoverage: portfolioCoverageReport,
    impactScoringFormula: "officialPresetCount*100 + totalMbtiCount*10 + blockedTargetWeightSum/100 + monthlyIdentityPresentBonus + directLineageRecoveryBonus + contiguousHistoryMonths/10000",
    impactRanking: fullImpactRanking.slice(0, 100),
    directLineageRecoveryCandidateCount: directLineageRecoveryCandidates.length,
    directLineageRecoveryPriorities: directLineageRecoveryCandidates.slice(0, 100),
    specialAudits: ["KR:069500", "US:VNQ", "US:BLOK"].map((identity) => inventoryByIdentity.get(identity)),
    assets: inventory,
  };
  validateReport(report);
  return report;
}

async function main() {
  runCharacterizationChecks();
  const vite = await createServer({
    root: process.cwd(),
    appType: "custom",
    logLevel: "silent",
    define: { "import.meta.env": "{}" },
    server: { middlewareMode: true },
  });
  try {
    const report = await buildReport(vite);
    const inventoryText = `${JSON.stringify(report, null, 2)}\n`;
    const summaryText = buildMarkdown(report);
    if (process.argv.includes("--write")) {
      await mkdir("reports/portfolio-analysis", { recursive: true });
      await Promise.all([
        writeFile(INVENTORY_PATH, inventoryText, "utf8"),
        writeFile(SUMMARY_PATH, summaryText, "utf8"),
      ]);
    } else {
      const [committedInventory, committedSummary] = await Promise.all([
        readFile(INVENTORY_PATH, "utf8"),
        readFile(SUMMARY_PATH, "utf8"),
      ]);
      assert.equal(committedInventory, inventoryText, `${INVENTORY_PATH} is stale; run this checker with --write`);
      assert.equal(committedSummary, summaryText, `${SUMMARY_PATH} is stale; run this checker with --write`);
    }
    console.log(JSON.stringify({
      ok: true,
      mode: process.argv.includes("--write") ? "write" : "check",
      runtimeIdentityCount: report.coverage.overall.total,
      step4NumericReady: report.coverage.overall.step4NumericReady.count,
      step5NumericReady: report.coverage.overall.step5NumericReady.count,
      officialPortfolioCount: report.portfolioCoverage.official.length,
      usMbtiCount: report.portfolioCoverage.usMbti.length,
      krMbtiCount: report.portfolioCoverage.krMbti.length,
    }, null, 2));
  } finally {
    await vite.close();
  }
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
