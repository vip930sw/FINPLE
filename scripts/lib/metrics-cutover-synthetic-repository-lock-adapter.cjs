const {
  hasExactKeys,
  hashWithDomain,
  isGitSha,
  isRecord,
  isSafeIdentity,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const {
  CLAIM_TERMINAL_STATES,
  SYNTHETIC_ADAPTER_ATTESTATION,
} = require("./metrics-cutover-adapter-conformance.cjs");
const {
  validateSyntheticClaimRecord,
} = require("./metrics-cutover-synthetic-claim-store-adapter.cjs");

const LOCK_RECORD_CONTRACT_VERSION =
  "metrics-cutover-synthetic-repository-lock-record-v1-step114-2x-c";
const LOCK_RECORD_FIELDS = Object.freeze([
  "contractVersion", "lockId", "repositoryIdentityHash", "repositoryHeadSha",
  "repositoryTreeSha", "repositoryBranchName", "trackedPathsSha256",
  "ownerLivenessHash", "state", "version", "acquiredAt", "releasedAt",
  "terminalClaimEvidenceHash", "lockHash",
]);
const ACQUIRE_FIELDS = Object.freeze([
  "repositoryIdentityHash", "repositoryHeadSha", "repositoryTreeSha",
  "repositoryBranchName", "trackedPathsSha256", "ownerLivenessHash",
  "testClockInstant",
]);
const READ_FIELDS = Object.freeze(["repositoryIdentityHash"]);
const RELEASE_FIELDS = Object.freeze([
  "repositoryIdentityHash", "expectedState", "expectedVersion",
  "expectedLockHash", "terminalClaim", "testClockInstant",
]);
const DOMAINS = Object.freeze({
  id: "FINPLE_STEP114_2X_C_SYNTHETIC_REPOSITORY_LOCK_ID\0",
  hash: "FINPLE_STEP114_2X_C_SYNTHETIC_REPOSITORY_LOCK_HASH\0",
});

function without(value, field) {
  const copy = structuredClone(value);
  delete copy[field];
  return copy;
}

function parseCanonicalInstant(value) {
  if (typeof value !== "string" ||
      !/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/.test(value)) return null;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) && instant.toISOString() === value
    ? instant
    : null;
}

function sealLock(fields) {
  const lock = {
    contractVersion: LOCK_RECORD_CONTRACT_VERSION,
    ...structuredClone(fields),
  };
  lock.lockId = `metrics-cutover-synthetic-repository-lock-${hashWithDomain(
    DOMAINS.id,
    without(without(lock, "lockId"), "lockHash"),
  )}`;
  lock.lockHash = hashWithDomain(DOMAINS.hash, without(lock, "lockHash"));
  return Object.freeze(lock);
}

function validateSyntheticRepositoryLockRecord(value) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, LOCK_RECORD_FIELDS)) return ["synthetic_repository_lock_fields_invalid"];
  if (value.contractVersion !== LOCK_RECORD_CONTRACT_VERSION) issues.push("synthetic_repository_lock_version_invalid");
  if (!isSafeIdentity(value.lockId) || !value.lockId.startsWith("metrics-cutover-synthetic-repository-lock-")) issues.push("synthetic_repository_lock_id_invalid");
  if (!isSha256(value.repositoryIdentityHash) || !isSha256(value.trackedPathsSha256) || !isSha256(value.ownerLivenessHash) ||
      !isSha256(value.terminalClaimEvidenceHash) || !isSha256(value.lockHash)) issues.push("synthetic_repository_lock_hash_field_invalid");
  if (!isGitSha(value.repositoryHeadSha) || !isGitSha(value.repositoryTreeSha) || !isSafeIdentity(value.repositoryBranchName)) issues.push("synthetic_repository_lock_binding_invalid");
  if (!Number.isInteger(value.version) || ![1, 2].includes(value.version) || !parseCanonicalInstant(value.acquiredAt)) issues.push("synthetic_repository_lock_state_metadata_invalid");
  if (value.state === "lock_held") {
    if (value.version !== 1 || value.releasedAt !== "" || value.terminalClaimEvidenceHash !== "0".repeat(64)) issues.push("synthetic_repository_lock_held_state_invalid");
  } else if (value.state === "lock_released") {
    if (value.version !== 2 || !parseCanonicalInstant(value.releasedAt) || !isSha256(value.terminalClaimEvidenceHash) || value.terminalClaimEvidenceHash === "0".repeat(64)) issues.push("synthetic_repository_lock_released_state_invalid");
  } else issues.push("synthetic_repository_lock_state_invalid");
  try {
    const expected = sealLock(without(without(value, "lockId"), "lockHash"));
    if (expected.lockId !== value.lockId) issues.push("synthetic_repository_lock_id_mismatch");
    if (expected.lockHash !== value.lockHash) issues.push("synthetic_repository_lock_hash_mismatch");
  } catch {
    issues.push("synthetic_repository_lock_canonicalization_failed");
  }
  return uniqueSorted(issues);
}

function blocked(status, issues, lock = {}) {
  return { ok: false, status, lock, blockingIssues: uniqueSorted(issues) };
}

function createSyntheticRepositoryLockAdapter(options = {}) {
  const scheduler = isRecord(options.scheduler) && typeof options.scheduler.wait === "function"
    ? options.scheduler
    : { wait: async () => {} };
  const observeLiveness = typeof options.observeLiveness === "function"
    ? options.observeLiveness
    : async () => "active";
  const records = new Map();
  let mutationCount = 0;

  async function acquireLock(input) {
    if (!isRecord(input) || !hasExactKeys(input, ACQUIRE_FIELDS)) return blocked("blocked", ["repository_lock_acquire_fields_invalid"]);
    if (!isSha256(input.repositoryIdentityHash) || !isGitSha(input.repositoryHeadSha) || !isGitSha(input.repositoryTreeSha) ||
        !isSafeIdentity(input.repositoryBranchName) || !isSha256(input.trackedPathsSha256) ||
        !isSha256(input.ownerLivenessHash) || !parseCanonicalInstant(input.testClockInstant)) {
      return blocked("blocked", ["repository_lock_acquire_input_invalid"]);
    }
    await scheduler.wait("before_repository_lock_acquire_commit", { repositoryIdentityHash: input.repositoryIdentityHash });
    const existing = records.get(input.repositoryIdentityHash);
    if (existing) {
      const liveness = await observeLiveness(structuredClone(existing));
      if (liveness !== "active") return blocked("stale_lock_manual_review", ["stale_repository_lock_requires_manual_review"], structuredClone(existing));
      return blocked("repository_locked", ["repository_lock_already_exists"], structuredClone(existing));
    }
    const lock = sealLock({
      repositoryIdentityHash: input.repositoryIdentityHash,
      repositoryHeadSha: input.repositoryHeadSha,
      repositoryTreeSha: input.repositoryTreeSha,
      repositoryBranchName: input.repositoryBranchName,
      trackedPathsSha256: input.trackedPathsSha256,
      ownerLivenessHash: input.ownerLivenessHash,
      state: "lock_held", version: 1,
      acquiredAt: input.testClockInstant, releasedAt: "",
      terminalClaimEvidenceHash: "0".repeat(64),
    });
    records.set(input.repositoryIdentityHash, lock);
    mutationCount += 1;
    return { ok: true, status: "lock_acquired", lock: structuredClone(lock), blockingIssues: [] };
  }

  async function readLock(input) {
    if (!isRecord(input) || !hasExactKeys(input, READ_FIELDS) || !isSha256(input.repositoryIdentityHash)) return blocked("blocked", ["repository_lock_read_input_invalid"]);
    const lock = records.get(input.repositoryIdentityHash);
    if (!lock) return blocked("repository_lock_not_found", ["repository_lock_not_found"]);
    return { ok: true, status: "lock_found", lock: structuredClone(lock), blockingIssues: [] };
  }

  async function releaseLock(input) {
    if (!isRecord(input) || !hasExactKeys(input, RELEASE_FIELDS)) return blocked("blocked", ["repository_lock_release_fields_invalid"]);
    if (!isSha256(input.repositoryIdentityHash) || input.expectedState !== "lock_held" ||
        !Number.isInteger(input.expectedVersion) || !isSha256(input.expectedLockHash) ||
        !parseCanonicalInstant(input.testClockInstant)) return blocked("blocked", ["repository_lock_release_input_invalid"]);
    const claimIssues = validateSyntheticClaimRecord(input.terminalClaim);
    if (claimIssues.length > 0 || !CLAIM_TERMINAL_STATES.includes(input.terminalClaim?.state)) {
      return blocked("terminal_claim_required", ["terminal_claim_evidence_invalid"]);
    }
    await scheduler.wait("before_repository_lock_release_commit", { repositoryIdentityHash: input.repositoryIdentityHash });
    const existing = records.get(input.repositoryIdentityHash);
    if (!existing) return blocked("repository_lock_not_found", ["repository_lock_not_found"]);
    if (existing.state !== input.expectedState || existing.version !== input.expectedVersion || existing.lockHash !== input.expectedLockHash) {
      return blocked("stale_repository_lock", ["repository_lock_expected_state_version_hash_stale"], structuredClone(existing));
    }
    const released = sealLock({
      repositoryIdentityHash: existing.repositoryIdentityHash,
      repositoryHeadSha: existing.repositoryHeadSha,
      repositoryTreeSha: existing.repositoryTreeSha,
      repositoryBranchName: existing.repositoryBranchName,
      trackedPathsSha256: existing.trackedPathsSha256,
      ownerLivenessHash: existing.ownerLivenessHash,
      state: "lock_released", version: existing.version + 1,
      acquiredAt: existing.acquiredAt,
      releasedAt: input.testClockInstant,
      terminalClaimEvidenceHash: input.terminalClaim.claimHash,
    });
    records.set(input.repositoryIdentityHash, released);
    mutationCount += 1;
    return { ok: true, status: "lock_released", lock: structuredClone(released), blockingIssues: [] };
  }

  const adapter = { acquireLock, readLock, releaseLock };
  Object.defineProperty(adapter, SYNTHETIC_ADAPTER_ATTESTATION, {
    enumerable: false,
    value: Object.freeze({
      adapterKind: "repository_lock", syntheticOnly: true,
      filesystemAccess: false, processAccess: false, networkAccess: false,
      providerAccess: false, realResourceAccess: false,
    }),
  });
  Object.freeze(adapter);
  const diagnostics = Object.freeze({
    get mutationCount() { return mutationCount; },
    snapshot() { return [...records.values()].map((record) => structuredClone(record)); },
  });
  return Object.freeze({ adapter, diagnostics });
}

module.exports = {
  LOCK_RECORD_CONTRACT_VERSION,
  createSyntheticRepositoryLockAdapter,
  validateSyntheticRepositoryLockRecord,
};
