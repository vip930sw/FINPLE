const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const {
  CLAIM_ADAPTER_METHODS,
  EVENT_OPERATIONS,
  FIXED_FALSE_FIELDS,
  REPOSITORY_LOCK_ADAPTER_METHODS,
  SYNTHETIC_ADAPTER_ATTESTATION,
  runMetricsCutoverAdapterConformance,
  validateConformanceLedger,
  validateConformanceSummary,
} = require("./lib/metrics-cutover-adapter-conformance.cjs");
const {
  createSyntheticClaimStoreAdapter,
  validateSyntheticClaimRecord,
} = require("./lib/metrics-cutover-synthetic-claim-store-adapter.cjs");
const {
  createSyntheticRepositoryLockAdapter,
  validateSyntheticRepositoryLockRecord,
} = require("./lib/metrics-cutover-synthetic-repository-lock-adapter.cjs");
const {
  buildSyntheticConformanceScenario,
  runCheck,
} = require("./check-metrics-cutover-adapter-conformance.cjs");

const SHA = Object.freeze({
  receipt: "6".repeat(64), binding: "7".repeat(64), repository: "8".repeat(64),
  tracked: "b".repeat(64), owner: "c".repeat(64), evidence: "d".repeat(64),
});
const TIME = Object.freeze({
  acquire: "2026-07-17T01:00:00.000Z",
  terminal: "2026-07-17T01:00:01.000Z",
  release: "2026-07-17T01:00:02.000Z",
});

function barrier(parties, point) {
  let waiting = 0;
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  return {
    async wait(actualPoint) {
      if (actualPoint !== point) return;
      waiting += 1;
      if (waiting === parties) release();
      await gate;
    },
  };
}

function claimAcquireInput(receiptIdentityHash = SHA.receipt) {
  return {
    receiptIdentityHash,
    receiptBindingHash: SHA.binding,
    testClockInstant: TIME.acquire,
  };
}

function lockAcquireInput(repositoryIdentityHash = SHA.repository) {
  return {
    repositoryIdentityHash,
    repositoryHeadSha: "9".repeat(40),
    repositoryTreeSha: "a".repeat(40),
    repositoryBranchName: "synthetic-conformance-fixture",
    trackedPathsSha256: SHA.tracked,
    ownerLivenessHash: SHA.owner,
    testClockInstant: TIME.acquire,
  };
}

async function terminalClaim(claimStore, receiptIdentityHash = SHA.receipt) {
  const acquired = await claimStore.adapter.acquireClaim(claimAcquireInput(receiptIdentityHash));
  assert.equal(acquired.ok, true);
  const terminal = await claimStore.adapter.transitionClaimTerminal({
    receiptIdentityHash,
    expectedState: "claim_in_progress",
    expectedVersion: acquired.claim.version,
    expectedClaimHash: acquired.claim.claimHash,
    terminalState: "consumed_success",
    terminalEvidenceHash: SHA.evidence,
    testClockInstant: TIME.terminal,
  });
  assert.equal(terminal.ok, true);
  return terminal.claim;
}

function assertFixedFalse(result) {
  for (const field of FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

test("valid synthetic conformance follows the exact ten-operation order", async () => {
  const result = await runCheck();
  assert.equal(result.ok, true);
  assert.equal(result.status, "adapter_conformance_ready");
  assert.deepEqual(result.eventLedger.events.map((event) => event.operation), EVENT_OPERATIONS);
  assert.deepEqual(validateConformanceLedger(result.eventLedger), []);
  assert.deepEqual(validateConformanceSummary(result.conformanceSummary), []);
  assertFixedFalse(result);
});

test("idle and blocked results suppress ledger and summary and preserve fixed false", async () => {
  const idle = await runMetricsCutoverAdapterConformance();
  const blocked = await runMetricsCutoverAdapterConformance({ unexpected: true });
  for (const result of [idle, blocked]) {
    assert.deepEqual(result.eventLedger, {});
    assert.deepEqual(result.conformanceSummary, {});
    assertFixedFalse(result);
  }
});

test("claim adapter exposes the exact immutable protocol method set", () => {
  const { adapter } = createSyntheticClaimStoreAdapter();
  assert.deepEqual(Reflect.ownKeys(adapter).filter((key) => typeof key === "string").sort(), [...CLAIM_ADAPTER_METHODS].sort());
  assert.equal(adapter.deleteClaim, undefined);
  assert.equal(adapter.resetClaim, undefined);
  assert.equal(adapter.releaseClaim, undefined);
  assert.equal(Object.isFrozen(adapter), true);
});

test("repository lock adapter exposes the exact immutable protocol method set", () => {
  const { adapter } = createSyntheticRepositoryLockAdapter();
  assert.deepEqual(Reflect.ownKeys(adapter).filter((key) => typeof key === "string").sort(), [...REPOSITORY_LOCK_ADAPTER_METHODS].sort());
  assert.equal(adapter.stealLock, undefined);
  assert.equal(adapter.deleteLock, undefined);
  assert.equal(adapter.overwriteLock, undefined);
  assert.equal(Object.isFrozen(adapter), true);
});

test("extra adapter method is rejected before orchestration", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const invalid = { ...claimStore.adapter, deleteClaim() {} };
  Object.defineProperty(invalid, SYNTHETIC_ADAPTER_ATTESTATION, {
    value: claimStore.adapter[SYNTHETIC_ADAPTER_ATTESTATION],
  });
  const result = await runMetricsCutoverAdapterConformance(
    { scenario: buildSyntheticConformanceScenario() },
    { claimStoreAdapter: invalid, repositoryLockAdapter: lockStore.adapter },
  );
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.includes("claim_store_adapter_method_set_invalid"));
  assert.deepEqual(result.eventLedger, {});
});

test("non-synthetic adapter attestation is rejected", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const invalid = { ...claimStore.adapter };
  Object.defineProperty(invalid, SYNTHETIC_ADAPTER_ATTESTATION, {
    value: { ...claimStore.adapter[SYNTHETIC_ADAPTER_ATTESTATION], providerAccess: true },
  });
  const result = await runMetricsCutoverAdapterConformance(
    { scenario: buildSyntheticConformanceScenario() },
    { claimStoreAdapter: invalid, repositoryLockAdapter: lockStore.adapter },
  );
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.includes("claim_store_adapter_forbidden_access:providerAccess"));
});

test("claim evidence must bind the exact scenario receipt", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const invalid = {
    async acquireClaim(input) {
      const result = await claimStore.adapter.acquireClaim(input);
      return { ...result, claim: { ...result.claim, receiptIdentityHash: "f".repeat(64) } };
    },
    readClaim: claimStore.adapter.readClaim,
    transitionClaimTerminal: claimStore.adapter.transitionClaimTerminal,
  };
  Object.defineProperty(invalid, SYNTHETIC_ADAPTER_ATTESTATION, {
    value: claimStore.adapter[SYNTHETIC_ADAPTER_ATTESTATION],
  });
  const result = await runMetricsCutoverAdapterConformance(
    { scenario: buildSyntheticConformanceScenario() },
    { claimStoreAdapter: invalid, repositoryLockAdapter: lockStore.adapter },
  );
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.includes("claim_acquire_evidence_invalid"));
  assert.deepEqual(result.eventLedger, {});
});

test("lock evidence must bind the exact repository HEAD tree branch and inventory", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const invalid = {
    async acquireLock(input) {
      const result = await lockStore.adapter.acquireLock(input);
      return { ...result, lock: { ...result.lock, repositoryHeadSha: "f".repeat(40) } };
    },
    readLock: lockStore.adapter.readLock,
    releaseLock: lockStore.adapter.releaseLock,
  };
  Object.defineProperty(invalid, SYNTHETIC_ADAPTER_ATTESTATION, {
    value: lockStore.adapter[SYNTHETIC_ADAPTER_ATTESTATION],
  });
  const result = await runMetricsCutoverAdapterConformance(
    { scenario: buildSyntheticConformanceScenario() },
    { claimStoreAdapter: claimStore.adapter, repositoryLockAdapter: invalid },
  );
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.includes("repository_lock_acquire_evidence_invalid"));
  assert.deepEqual(result.eventLedger, {});
});

test("concurrent claim acquisition has exactly one winner without timing sleeps", async () => {
  const store = createSyntheticClaimStoreAdapter({ scheduler: barrier(2, "before_claim_acquire_commit") });
  const results = await Promise.all([
    store.adapter.acquireClaim(claimAcquireInput()),
    store.adapter.acquireClaim(claimAcquireInput()),
  ]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.filter((result) => result.status === "already_claimed").length, 1);
  assert.equal(store.diagnostics.mutationCount, 1);
});

test("concurrent repository lock acquisition has exactly one winner", async () => {
  const store = createSyntheticRepositoryLockAdapter({ scheduler: barrier(2, "before_repository_lock_acquire_commit") });
  const results = await Promise.all([
    store.adapter.acquireLock(lockAcquireInput()),
    store.adapter.acquireLock(lockAcquireInput()),
  ]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.filter((result) => result.status === "repository_locked").length, 1);
  assert.equal(store.diagnostics.mutationCount, 1);
});

test("concurrent terminal transition has exactly one winner", async () => {
  const store = createSyntheticClaimStoreAdapter({ scheduler: barrier(2, "before_claim_terminal_commit") });
  const acquired = await store.adapter.acquireClaim(claimAcquireInput());
  const input = {
    receiptIdentityHash: SHA.receipt, expectedState: "claim_in_progress",
    expectedVersion: 1, expectedClaimHash: acquired.claim.claimHash,
    terminalState: "consumed_success", terminalEvidenceHash: SHA.evidence,
    testClockInstant: TIME.terminal,
  };
  const results = await Promise.all([
    store.adapter.transitionClaimTerminal(input),
    store.adapter.transitionClaimTerminal(input),
  ]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.filter((result) => result.status === "stale_claim").length, 1);
  assert.equal(store.diagnostics.mutationCount, 2);
});

test("stale claim state version or hash cannot transition", async () => {
  const store = createSyntheticClaimStoreAdapter();
  const acquired = await store.adapter.acquireClaim(claimAcquireInput());
  for (const override of [
    { expectedVersion: 2 },
    { expectedClaimHash: "e".repeat(64) },
    { expectedState: "consumed_success" },
  ]) {
    const result = await store.adapter.transitionClaimTerminal({
      receiptIdentityHash: SHA.receipt, expectedState: "claim_in_progress",
      expectedVersion: 1, expectedClaimHash: acquired.claim.claimHash,
      terminalState: "consumed_success", terminalEvidenceHash: SHA.evidence,
      testClockInstant: TIME.terminal, ...override,
    });
    assert.equal(result.ok, false);
  }
  assert.equal(store.diagnostics.mutationCount, 1);
});

test("terminal claim cannot transition again or be reused", async () => {
  const store = createSyntheticClaimStoreAdapter();
  const terminal = await terminalClaim(store);
  const reacquire = await store.adapter.acquireClaim(claimAcquireInput());
  const again = await store.adapter.transitionClaimTerminal({
    receiptIdentityHash: SHA.receipt, expectedState: "claim_in_progress",
    expectedVersion: terminal.version, expectedClaimHash: terminal.claimHash,
    terminalState: "consumed_failed_manual_review", terminalEvidenceHash: SHA.evidence,
    testClockInstant: TIME.release,
  });
  assert.equal(reacquire.status, "already_claimed");
  assert.equal(again.status, "stale_claim");
  assert.equal(store.diagnostics.mutationCount, 2);
});

test("lock release before terminal claim persistence is rejected", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const claim = await claimStore.adapter.acquireClaim(claimAcquireInput());
  const lock = await lockStore.adapter.acquireLock(lockAcquireInput());
  const result = await lockStore.adapter.releaseLock({
    repositoryIdentityHash: SHA.repository, expectedState: "lock_held",
    expectedVersion: 1, expectedLockHash: lock.lock.lockHash,
    terminalClaim: claim.claim, testClockInstant: TIME.release,
  });
  assert.equal(result.status, "terminal_claim_required");
  assert.equal(lockStore.diagnostics.mutationCount, 1);
});

test("tampered terminal evidence cannot release a lock", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const claim = await terminalClaim(claimStore);
  const lock = await lockStore.adapter.acquireLock(lockAcquireInput());
  const tampered = { ...claim, terminalEvidenceHash: "f".repeat(64) };
  const result = await lockStore.adapter.releaseLock({
    repositoryIdentityHash: SHA.repository, expectedState: "lock_held",
    expectedVersion: 1, expectedLockHash: lock.lock.lockHash,
    terminalClaim: tampered, testClockInstant: TIME.release,
  });
  assert.equal(result.status, "terminal_claim_required");
  assert.equal(lockStore.diagnostics.mutationCount, 1);
});

test("lock release requires fresh expected state version and hash", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const claim = await terminalClaim(claimStore);
  const lock = await lockStore.adapter.acquireLock(lockAcquireInput());
  const result = await lockStore.adapter.releaseLock({
    repositoryIdentityHash: SHA.repository, expectedState: "lock_held",
    expectedVersion: 2, expectedLockHash: lock.lock.lockHash,
    terminalClaim: claim, testClockInstant: TIME.release,
  });
  assert.equal(result.status, "stale_repository_lock");
  assert.equal(lockStore.diagnostics.mutationCount, 1);
});

test("stale lock is manual review and is never stolen", async () => {
  const store = createSyntheticRepositoryLockAdapter({ observeLiveness: async () => "stale_suspected" });
  await store.adapter.acquireLock(lockAcquireInput());
  const result = await store.adapter.acquireLock(lockAcquireInput());
  assert.equal(result.status, "stale_lock_manual_review");
  assert.ok(result.blockingIssues.includes("stale_repository_lock_requires_manual_review"));
  assert.equal(store.diagnostics.mutationCount, 1);
});

test("released lock persists and repeated release cannot mutate", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const claim = await terminalClaim(claimStore);
  const acquired = await lockStore.adapter.acquireLock(lockAcquireInput());
  const input = {
    repositoryIdentityHash: SHA.repository, expectedState: "lock_held",
    expectedVersion: 1, expectedLockHash: acquired.lock.lockHash,
    terminalClaim: claim, testClockInstant: TIME.release,
  };
  const released = await lockStore.adapter.releaseLock(input);
  const repeated = await lockStore.adapter.releaseLock(input);
  assert.equal(released.ok, true);
  assert.equal(repeated.status, "stale_repository_lock");
  assert.equal(lockStore.diagnostics.mutationCount, 2);
});

test("record validators reject state or hash tampering", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const claim = await claimStore.adapter.acquireClaim(claimAcquireInput());
  const lock = await lockStore.adapter.acquireLock(lockAcquireInput());
  assert.deepEqual(validateSyntheticClaimRecord(claim.claim), []);
  assert.deepEqual(validateSyntheticRepositoryLockRecord(lock.lock), []);
  assert.ok(validateSyntheticClaimRecord({ ...claim.claim, version: 2 }).length > 0);
  assert.ok(validateSyntheticRepositoryLockRecord({ ...lock.lock, repositoryHeadSha: "f".repeat(40) }).length > 0);
});

test("completed scenario replay is blocked without mutation", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const scenario = buildSyntheticConformanceScenario();
  const adapters = { claimStoreAdapter: claimStore.adapter, repositoryLockAdapter: lockStore.adapter };
  const first = await runMetricsCutoverAdapterConformance({ scenario }, adapters);
  const before = [claimStore.diagnostics.mutationCount, lockStore.diagnostics.mutationCount];
  const replay = await runMetricsCutoverAdapterConformance({ scenario }, adapters);
  assert.equal(first.ok, true);
  assert.equal(replay.status, "blocked");
  assert.deepEqual([claimStore.diagnostics.mutationCount, lockStore.diagnostics.mutationCount], before);
  assert.deepEqual(replay.eventLedger, {});
});

test("different receipts and repositories are processed independently", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const adapters = { claimStoreAdapter: claimStore.adapter, repositoryLockAdapter: lockStore.adapter };
  const first = await runMetricsCutoverAdapterConformance({ scenario: buildSyntheticConformanceScenario() }, adapters);
  const second = await runMetricsCutoverAdapterConformance({ scenario: buildSyntheticConformanceScenario({
    receiptIdentityHash: "d".repeat(64), repositoryIdentityHash: "e".repeat(64),
  }) }, adapters);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(claimStore.diagnostics.snapshot().length, 2);
  assert.equal(lockStore.diagnostics.snapshot().length, 2);
});

test("preparation summary tampering blocks before adapter mutation", async () => {
  const claimStore = createSyntheticClaimStoreAdapter();
  const lockStore = createSyntheticRepositoryLockAdapter();
  const valid = buildSyntheticConformanceScenario();
  const scenario = { ...valid, preparationSummary: { ...valid.preparationSummary, executionAuthorized: true } };
  const result = await runMetricsCutoverAdapterConformance({ scenario }, {
    claimStoreAdapter: claimStore.adapter, repositoryLockAdapter: lockStore.adapter,
  });
  assert.equal(result.status, "blocked");
  assert.equal(claimStore.diagnostics.mutationCount, 0);
  assert.equal(lockStore.diagnostics.mutationCount, 0);
});

test("ledger sequence tampering is detected", async () => {
  const ledger = structuredClone((await runCheck()).eventLedger);
  ledger.events[2].sequence = 9;
  assert.ok(validateConformanceLedger(ledger).some((issue) => issue.includes("sequence")));
});

test("ledger previous-event chain tampering is detected", async () => {
  const ledger = structuredClone((await runCheck()).eventLedger);
  ledger.events[4].previousEventHash = "f".repeat(64);
  assert.ok(validateConformanceLedger(ledger).some((issue) => issue.includes("previousEventHash")));
});

test("ledger event state-version hash tampering is detected", async () => {
  const ledger = structuredClone((await runCheck()).eventLedger);
  ledger.events[6].resultingStateVersionHash = "f".repeat(64);
  assert.ok(validateConformanceLedger(ledger).some((issue) => issue.includes("event_hash_mismatch")));
});

test("ledger payload or ledger hash tampering is detected", async () => {
  const ledger = structuredClone((await runCheck()).eventLedger);
  ledger.events[5].resultCategory = "replayed";
  assert.ok(validateConformanceLedger(ledger).length > 0);
  const hashOnly = structuredClone((await runCheck()).eventLedger);
  hashOnly.ledgerHash = "f".repeat(64);
  assert.ok(validateConformanceLedger(hashOnly).includes("conformance_ledger_hash_mismatch"));
});

test("public result suppresses raw receipt path provider identity and lock token", async () => {
  const serialized = JSON.stringify(await runCheck());
  for (const forbidden of ["receiptId", "repositoryPath", "providerIdentity", "lockToken", "credential", "nonce", "signature"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("core and synthetic adapter modules have no filesystem process network or provider imports", () => {
  const files = [
    "metrics-cutover-adapter-conformance.cjs",
    "metrics-cutover-synthetic-claim-store-adapter.cjs",
    "metrics-cutover-synthetic-repository-lock-adapter.cjs",
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, "lib", file), "utf8");
    assert.doesNotMatch(source, /require\(["'](?:node:)?(?:fs|child_process|net|http|https|tls|dgram)["']\)/);
    assert.doesNotMatch(source, /(?:supabase|redis|database|object.store|provider.sdk)/i);
  }
});

test("CLI emits one sanitized ready result and exits zero", () => {
  const completed = spawnSync(process.execPath, [
    path.join(__dirname, "check-metrics-cutover-adapter-conformance.cjs"),
  ], { encoding: "utf8" });
  assert.equal(completed.status, 0, completed.stderr);
  const lines = completed.stdout.trim().split(/\r?\n/);
  assert.equal(lines.length, 1);
  const result = JSON.parse(lines[0]);
  assert.equal(result.status, "adapter_conformance_ready");
  assertFixedFalse(result);
});
