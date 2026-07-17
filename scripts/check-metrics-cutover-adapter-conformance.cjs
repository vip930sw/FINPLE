#!/usr/bin/env node

const {
  buildClaimStoreAdapterProtocol,
  buildRepositoryLockAdapterProtocol,
  runMetricsCutoverAdapterConformance,
  sealConformanceScenario,
} = require("./lib/metrics-cutover-adapter-conformance.cjs");
const {
  buildPreparationSummary,
} = require("./lib/metrics-cutover-production-execution-preparation.cjs");
const {
  createSyntheticClaimStoreAdapter,
} = require("./lib/metrics-cutover-synthetic-claim-store-adapter.cjs");
const {
  createSyntheticRepositoryLockAdapter,
} = require("./lib/metrics-cutover-synthetic-repository-lock-adapter.cjs");

function buildSyntheticPreparationSummary() {
  return buildPreparationSummary({
    executionPolicy: { policyId: "synthetic-policy", policyHash: "1".repeat(64) },
    claimStoreProfile: { profileId: "synthetic-claim-store", profileHash: "2".repeat(64) },
    hostProfile: { profileId: "synthetic-host", profileHash: "3".repeat(64) },
    repositoryLockProfile: { profileId: "synthetic-lock", profileHash: "4".repeat(64) },
    runbook: { runbookId: "synthetic-runbook", runbookHash: "5".repeat(64) },
  });
}

function buildSyntheticConformanceScenario(overrides = {}) {
  const preparationSummary = overrides.preparationSummary || buildSyntheticPreparationSummary();
  return sealConformanceScenario({
    preparationSummary,
    preparationSummaryHash: preparationSummary.summaryHash,
    claimStoreProtocol: buildClaimStoreAdapterProtocol(),
    repositoryLockProtocol: buildRepositoryLockAdapterProtocol(),
    receiptIdentityHash: "6".repeat(64),
    receiptBindingHash: "7".repeat(64),
    repositoryIdentityHash: "8".repeat(64),
    repositoryHeadSha: "9".repeat(40),
    repositoryTreeSha: "a".repeat(40),
    repositoryBranchName: "synthetic-conformance-fixture",
    trackedPathsSha256: "b".repeat(64),
    ownerLivenessHash: "c".repeat(64),
    terminalState: "consumed_success",
    testClockInstants: Array.from(
      { length: 10 },
      (_, index) => `2026-07-17T00:00:${String(index).padStart(2, "0")}.000Z`,
    ),
    ...structuredClone(overrides),
  });
}

async function runCheck(options = {}) {
  const claimStore = options.claimStore || createSyntheticClaimStoreAdapter(options.claimStoreOptions);
  const repositoryLock = options.repositoryLock || createSyntheticRepositoryLockAdapter(options.repositoryLockOptions);
  const scenario = options.scenario || buildSyntheticConformanceScenario(options.scenarioOverrides);
  return runMetricsCutoverAdapterConformance(
    { scenario },
    {
      claimStoreAdapter: claimStore.adapter,
      repositoryLockAdapter: repositoryLock.adapter,
    },
  );
}

async function main() {
  const result = await runCheck();
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.ok ? 0 : 2;
}

if (require.main === module) {
  main().catch(() => {
    process.stdout.write(`${JSON.stringify({
      ok: false,
      status: "blocked",
      blockingIssues: ["adapter_conformance_check_failed"],
    })}\n`);
    process.exitCode = 2;
  });
}

module.exports = {
  buildSyntheticConformanceScenario,
  buildSyntheticPreparationSummary,
  runCheck,
};
