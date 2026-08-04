import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";

import { createServer } from "vite";

const DATA_BASE_URL = "/app-data/finple-universe-v2-2026-07-24";
const DATA_REPO_ROOT = `public${DATA_BASE_URL}`;
const INVENTORY_PATH = "reports/portfolio-analysis/step4-step5-eligibility-inventory.json";
const SUMMARY_PATH = "reports/portfolio-analysis/step4-step5-eligibility-summary.md";
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

function isBlankValue(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

function isPresentFiniteNumber(value) {
  return !isBlankValue(value) && Number.isFinite(Number(value));
}

function reportDateFromReleaseTimestamp(value) {
  const timestamp = String(value || "").trim();
  assert.match(timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/, "pinned release timestamp is invalid");
  assert.ok(Number.isFinite(Date.parse(timestamp)), "pinned release timestamp is invalid");
  return timestamp.slice(0, 10);
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

function remediationFor(state, policy, directLineageRecoveryFeasible) {
  if (!["review_required", "legacy_unproven"].includes(state)) return REMEDIATION_BY_STATE[state];
  if (policy?.policyEvidenceValid !== true) return "needs_manual_audit";
  if (policy?.ordinaryDistribution !== true) return "unsupported_product_policy";
  if (!directLineageRecoveryFeasible) return "needs_manual_audit";
  return state === "review_required" ? "review_completion" : "direct_lineage_metadata_repair";
}

function isDirectLineageRecoveryFeasible(evidence, policy) {
  return evidence.monthlyIdentityPresent && !evidence.identityMismatch && !evidence.proxyMarked &&
    evidence.policyRejected && (evidence.reviewRequired || evidence.legacyRows) &&
    policy?.policyEvidenceValid === true && policy?.ordinaryDistribution === true &&
    evidence.contiguousHistoryMonths >= MINIMUM_HISTORY_MONTHS && evidence.step3Ready && evidence.betaValid;
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
  for (const value of [null, undefined, "", " \t ", "N/A", Number.NaN]) assert.equal(isPresentFiniteNumber(value), false);
  for (const value of ["0", 0, "1.25"]) assert.equal(isPresentFiniteNumber(value), true);
  assert.equal(reportDateFromReleaseTimestamp("2026-07-24T12:34:56.000Z"), "2026-07-24");
  assert.throws(() => reportDateFromReleaseTimestamp("2026-07-24"));
  assert.deepEqual(portfolioEligibilityFromStates(0, 0, 59, true), {
    commonHistoryReady: false,
    commonHistoryReasonCategory: "common_history_lt_60",
    step4State: "expected_blocked",
    step5State: "expected_blocked",
  });
  assert.equal(portfolioEligibilityFromStates(0, 0, 60, true).step5State, "ready");
  assert.equal(portfolioEligibilityFromStates(0, 0, 0, true).step4State, "expected_blocked");
  assert.equal(portfolioEligibilityFromStates(0, 0, null, false).step5State, "ready");
  const repairEvidence = { ...base, policyRejected: true, reviewRequired: true };
  const repairPolicy = { policyEvidenceValid: true, ordinaryDistribution: true };
  assert.equal(isDirectLineageRecoveryFeasible(repairEvidence, repairPolicy), true);
  for (const evidence of [
    { ...repairEvidence, betaValid: false },
    { ...repairEvidence, step3Ready: false },
    { ...repairEvidence, contiguousHistoryMonths: 59 },
    { ...repairEvidence, proxyMarked: true },
  ]) assert.equal(isDirectLineageRecoveryFeasible(evidence, repairPolicy), false);
  assert.equal(remediationFor("review_required", repairPolicy, false), "needs_manual_audit");
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

function commonHistoryMonths(assets, rowsByIdentity, longestContiguousMonthSegment) {
  const identities = assets.filter((asset) => !isCash(asset)).map(identityFor);
  if (!identities.length) return null;
  if (identities.some((identity) => !rowsByIdentity[identity]?.length)) return 0;
  const monthSets = identities.map((identity) => new Set(rowsByIdentity[identity].map((row) => String(row.month).slice(0, 7))));
  const common = [...monthSets[0]].filter((month) =>
    monthSets.every((months) => months.has(month))
  );
  return longestContiguousMonthSegment(common).length;
}

function portfolioEligibilityFromStates(step4BlockedCount, step5BlockedCount, commonMonths, hasNonCashAssets) {
  const commonHistoryReady = !hasNonCashAssets || commonMonths >= MINIMUM_HISTORY_MONTHS;
  return {
    commonHistoryReady,
    commonHistoryReasonCategory: commonHistoryReady ? "ready" : "common_history_lt_60",
    step4State: step4BlockedCount === 0 && commonHistoryReady ? "ready" : "expected_blocked",
    step5State: step5BlockedCount === 0 && commonHistoryReady ? "ready" : "expected_blocked",
  };
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
      directLineageRecoveryFeasible: inventory.directLineageRecoveryFeasible,
      recommendedRemediationClass: inventory.recommendedRemediationClass,
    };
  });
  const totalWeight = assets.reduce((sum, asset) => sum + asset.targetWeight, 0);
  assert.ok(Math.abs(totalWeight - 100) < 0.0001, `${fixture.cohort}:${fixture.name} target weights do not total 100`);
  const step4Blocked = assets.filter((asset) => asset.step4State !== "ready");
  const step5Blocked = assets.filter((asset) => asset.step5State !== "ready");
  const hasNonCashAssets = assets.some((asset) => asset.identity !== "CASH:CASH");
  const commonMonths = commonHistoryMonths(
    fixture.assets,
    monthlyReturns.rowsByIdentity,
    modules.step4.longestContiguousMonthSegment,
  );
  const eligibility = portfolioEligibilityFromStates(step4Blocked.length, step5Blocked.length, commonMonths, hasNonCashAssets);
  const nonCashAssets = assets.filter((asset) => asset.identity !== "CASH:CASH");
  const step4BlockedForPortfolio = eligibility.commonHistoryReady ? step4Blocked : nonCashAssets;
  const step5BlockedForPortfolio = eligibility.commonHistoryReady ? step5Blocked : nonCashAssets;
  const step3 = modules.baseline.buildStep3MonthlyBaselineDetail({
    portfolio: { id: fixture.name },
    assets: fixture.assets,
    settings: { startValue: START_VALUE, monthlyCashFlow: 0, years: 10, inflationRate: 2.5, dividendReinvest: true },
  });
  const blockedStates = [...new Set(step5Blocked.map((asset) => asset.eligibilityState))].sort();
  const remediationDependency = [...new Set(step5Blocked.map((asset) =>
    asset.recommendedRemediationClass
  ))].filter(Boolean).sort();
  return {
    name: fixture.name,
    displayName: fixture.displayName,
    assets,
    blockedIdentities: step5BlockedForPortfolio.map((asset) => asset.identity).sort(),
    step4BlockedIdentities: step4BlockedForPortfolio.map((asset) => asset.identity).sort(),
    step5BlockedIdentities: step5BlockedForPortfolio.map((asset) => asset.identity).sort(),
    blockedTargetWeightPercent: round(step5BlockedForPortfolio.reduce((sum, asset) => sum + asset.targetWeight, 0)),
    step4BlockedTargetWeightPercent: round(step4BlockedForPortfolio.reduce((sum, asset) => sum + asset.targetWeight, 0)),
    step5BlockedTargetWeightPercent: round(step5BlockedForPortfolio.reduce((sum, asset) => sum + asset.targetWeight, 0)),
    step3State: step3.status === "ready" ? "ready" : "expected_blocked",
    step4State: eligibility.step4State,
    step5ModerateState: eligibility.step5State,
    step5SevereState: eligibility.step5State,
    primaryReasonCategory: blockedStates[0] || eligibility.commonHistoryReasonCategory,
    commonHistoryMonths: commonMonths,
    commonHistoryReady: eligibility.commonHistoryReady,
    commonHistoryReasonCategory: eligibility.commonHistoryReasonCategory,
    directLineageFeasible: eligibility.commonHistoryReady && step5Blocked.length > 0 &&
      step5Blocked.every((asset) => asset.directLineageRecoveryFeasible),
    remediationDependency,
  };
}

function buildRecoveryCandidates(inventory, portfolios) {
  const weightByIdentity = new Map();
  for (const portfolio of portfolios) {
    for (const asset of portfolio.assets) {
      if (asset.identity === "CASH:CASH" || asset.step5State === "ready") continue;
      weightByIdentity.set(asset.identity, (weightByIdentity.get(asset.identity) || 0) + asset.targetWeight);
    }
  }
  const candidates = inventory.filter((asset) => asset.step5State !== "ready").map((asset) => {
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
      productImpact: officialCount > 0 || mbtiCount > 0 || blockedWeightSum > 0,
    };
  });
  const byIdentity = (a, b) => a.identity < b.identity ? -1 : a.identity > b.identity ? 1 : 0;
  return {
    productImpact: candidates.filter((item) => item.productImpact).sort((a, b) =>
      Number(b.directLineageRecoveryCandidate) - Number(a.directLineageRecoveryCandidate) ||
      b.officialPresetCount - a.officialPresetCount ||
      (b.usMbtiCount + b.krMbtiCount) - (a.usMbtiCount + a.krMbtiCount) ||
      b.blockedTargetWeightSum - a.blockedTargetWeightSum || byIdentity(a, b)
    ),
    catalogOnly: candidates.filter((item) => !item.productImpact).sort((a, b) =>
      Number(b.directLineageRecoveryCandidate) - Number(a.directLineageRecoveryCandidate) ||
      b.contiguousHistoryMonths - a.contiguousHistoryMonths || byIdentity(a, b)
    ),
  };
}

function markdownTable(rows) {
  return rows.map((cells) => `| ${cells.map((cell) => String(cell ?? "").replaceAll("|", "\\|")).join(" | ")} |`).join("\n");
}

function buildMarkdown(report) {
  const stateRows = Object.entries(report.coverage.overall.primaryStates).map(([state, value]) =>
    [state, value.count, `${value.percent}%`, report.coverage.byMarket.KR.primaryStates[state].count, report.coverage.byMarket.US.primaryStates[state].count]
  );
  const cohortTable = (items) => markdownTable([
    ["Portfolio", "Step 3", "Step 4", "Step 5 moderate/severe", "Common contiguous history", "Step 4 blocked weight", "Step 5 blocked weight", "Blocked identities"],
    ["---", "---", "---", "---", "---:", "---:", "---:", "---"],
    ...items.map((item) => [
      item.displayName === item.name ? item.name : `${item.name} (${item.displayName})`,
      item.step3State,
      item.step4State,
      item.step5ModerateState,
      item.commonHistoryMonths === null ? "cash-only" : `${item.commonHistoryMonths} months`,
      `${item.step4BlockedTargetWeightPercent}%`,
      `${item.step5BlockedTargetWeightPercent}%`,
      item.blockedIdentities.join(", ") || "none",
    ]),
  ]);
  const audits = report.specialAudits.map((asset) =>
    `- \`${asset.identity}\`: **${asset.primaryEligibilityState}**; Beta valid: ${asset.betaValid}; ${asset.availableHistoryMonths} rows / ${asset.contiguousHistoryMonths} contiguous months; Step 4 ${asset.step4State}, Step 5 ${asset.step5State}; secondary flags: ${asset.secondaryFlags.join(", ") || "none"}; remediation: \`${asset.recommendedRemediationClass}\`; direct single-fix recovery: ${asset.directLineageRecoveryFeasible}.`
  ).join("\n");
  const productPriorities = report.productImpactRecoveryPriorities.slice(0, 20).map((item, index) =>
    `${index + 1}. \`${item.identity}\` — ${item.primaryEligibilityState}; official ${item.officialPresetCount}, US MBTI ${item.usMbtiCount}, KR MBTI ${item.krMbtiCount}, summed blocked weight ${item.blockedTargetWeightSum}%; direct single-fix recovery: ${item.directLineageRecoveryCandidate}.`
  ).join("\n") || "No current product-impact recovery candidate.";
  const catalogCandidates = report.catalogOnlyRecoveryCandidates.slice(0, 20).map((item, index) =>
    `${index + 1}. \`${item.identity}\` — ${item.primaryEligibilityState}; ${item.contiguousHistoryMonths} contiguous months; \`${item.recommendedRemediationClass}\`; direct single-fix recovery: ${item.directLineageRecoveryCandidate}.`
  ).join("\n") || "No current catalog-only recovery candidate.";

  return `# Step 4/5 Eligibility and Coverage Inventory

- Report as of: \`${report.reportAsOf}\` (derived from the pinned release timestamp)
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
| Blank Beta values | ${report.betaValidation.blankValueCount} | ${percent(report.betaValidation.blankValueCount, report.coverage.overall.total)}% |
| Invalid Beta values | ${report.betaValidation.invalidValueCount} | ${percent(report.betaValidation.invalidValueCount, report.coverage.overall.total)}% |

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

Portfolio readiness additionally requires at least ${MINIMUM_HISTORY_MONTHS} common contiguous months across its non-cash assets. Common-history blocked portfolios: official ${report.portfolioCommonHistoryBlockedCounts.official}, US MBTI ${report.portfolioCommonHistoryBlockedCounts.usMbti}, KR MBTI ${report.portfolioCommonHistoryBlockedCounts.krMbti}.

## High-use and saved-portfolio dimensions

- Popularity/high-use coverage: \`${report.highUseCoverageStatus}\`. No cohort membership or weights were inferred.
- Saved-portfolio coverage: \`${report.savedPortfolioCoverageStatus}\`. No user DB or holdings were queried.

## Product-impact recovery priorities

Ordered deterministically by direct single-fix feasibility, official preset count, total MBTI count, summed blocked target weight, then identity. No arbitrary combined score is used. Popularity and saved-portfolio dimensions are excluded because their approved aggregate sources are unavailable.

${productPriorities}

## Catalog-only recovery candidates

${report.catalogOnlyRecoveryCandidateCount} blocked identities have no official/MBTI portfolio usage. They are kept separate from product-impact priorities and ordered by direct single-fix feasibility, contiguous history, then identity. First 20:

${catalogCandidates}

## Required individual audits

${audits}

## Personal-plan implications

Step 1–3 availability does not imply numeric Step 4/5 availability. Product copy should continue to describe advanced analysis as available only for assets whose monthly identity, direct-lineage policy, contiguous history, required metrics, and Beta pass the current gates.

## Limitations and privacy

This is a deterministic, read-only inventory of checked-in runtime definitions and the pinned monthly release. It does not call providers, query databases or individual holdings, infer popularity, change runtime eligibility, or modify canonical/public data and pinned artifacts. Recovery ordering prioritizes review; it does not authorize data repair or Production changes.
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
  assert.equal(report.reportAsOf, reportDateFromReleaseTimestamp(report.inputReleaseTimestamp));
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
    if (portfolio.commonHistoryMonths !== null && portfolio.commonHistoryMonths < MINIMUM_HISTORY_MONTHS) {
      assert.deepEqual([portfolio.step4State, portfolio.step5ModerateState, portfolio.step5SevereState], [
        "expected_blocked", "expected_blocked", "expected_blocked",
      ]);
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
    const months = rows.map((row) => String(row.month || "").slice(0, 7));
    assert.ok(months.every((month) => /^\d{4}-\d{2}$/.test(month)), `${identity} has an invalid month`);
    assert.equal(new Set(months).size, months.length, `${identity} has duplicate normalized months`);
    const sortedMonths = [...months].sort();
    const contiguous = step4.longestContiguousMonthSegment(sortedMonths);
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
    const betaValid = isPresentFiniteNumber(candidate.beta);
    const hasStep3 = step3Ready(candidate, baseline);
    const reviewRequired = catalogReviewRequired(policy);
    const states = classifyEvidence({
      identityMismatch,
      monthlyIdentityPresent,
      proxyMarked,
      policyRejected,
      reviewRequired,
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
      : reviewRequired
        ? String(policy.reviewFlag || policy.dataStatus || "review_required").trim().toLowerCase()
        : "none";
    const directLineageRecoveryFeasible = isDirectLineageRecoveryFeasible({
      monthlyIdentityPresent,
      identityMismatch,
      proxyMarked,
      policyRejected,
      reviewRequired,
      legacyRows,
      contiguousHistoryMonths: contiguous.length,
      step3Ready: hasStep3,
      betaValid,
    }, policy);
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
      dataStartMonth: sortedMonths[0] || null,
      dataEndMonth: sortedMonths.at(-1) || null,
      contiguousStartMonth: contiguous[0]?.slice(0, 7) || null,
      contiguousEndMonth: contiguous.at(-1)?.slice(0, 7) || null,
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
      directLineageRecoveryFeasible,
      recommendedRemediationClass: remediationFor(states.primary, policy, directLineageRecoveryFeasible),
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
  const recoveryCandidates = buildRecoveryCandidates(inventory, allPortfolios);
  const allRecoveryCandidates = [...recoveryCandidates.productImpact, ...recoveryCandidates.catalogOnly];
  const report = {
    schemaVersion: "finple.step4-step5-eligibility-coverage.v2",
    reportAsOf: reportDateFromReleaseTimestamp(productionCatalog.release.approvedAt),
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
    betaValidation: {
      blankValueCount: candidates.filter((candidate) => isBlankValue(candidate.beta)).length,
      invalidValueCount: candidates.filter((candidate) => !isPresentFiniteNumber(candidate.beta)).length,
    },
    highUseCoverageStatus: "unavailable_no_canonical_source",
    savedPortfolioCoverageStatus: "not_available_no_privacy_safe_aggregate",
    portfolioCoverage: portfolioCoverageReport,
    portfolioCommonHistoryBlockedCounts: Object.fromEntries(Object.entries(portfolioCoverageReport).map(([cohort, items]) => [
      cohort,
      items.filter((item) => !item.commonHistoryReady).length,
    ])),
    productImpactRecoveryPriorityOrder: "directSingleFix desc, officialPresetCount desc, totalMbtiCount desc, blockedTargetWeightSum desc, identity asc",
    productImpactRecoveryPriorityCount: recoveryCandidates.productImpact.length,
    productImpactRecoveryPriorities: recoveryCandidates.productImpact,
    catalogOnlyRecoveryCandidateOrder: "directSingleFix desc, contiguousHistoryMonths desc, identity asc",
    catalogOnlyRecoveryCandidateCount: recoveryCandidates.catalogOnly.length,
    catalogOnlyRecoveryCandidates: recoveryCandidates.catalogOnly.slice(0, 100),
    directLineageRecoveryCandidateCount: allRecoveryCandidates.filter((item) => item.directLineageRecoveryCandidate).length,
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
    const inventoryText = `${serializeDeterministicJson(report)}\n`;
    assert.deepEqual(JSON.parse(inventoryText), report);
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
