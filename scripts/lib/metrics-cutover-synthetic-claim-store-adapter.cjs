const {
  hasExactKeys,
  hashWithDomain,
  isRecord,
  isSafeIdentity,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const {
  CLAIM_TERMINAL_STATES,
  SYNTHETIC_ADAPTER_ATTESTATION,
} = require("./metrics-cutover-adapter-conformance.cjs");

const CLAIM_RECORD_CONTRACT_VERSION =
  "metrics-cutover-synthetic-claim-record-v1-step114-2x-c";
const CLAIM_RECORD_FIELDS = Object.freeze([
  "contractVersion", "claimId", "receiptIdentityHash", "receiptBindingHash",
  "state", "version", "createdAt", "terminalAt", "terminalEvidenceHash",
  "claimHash",
]);
const ACQUIRE_FIELDS = Object.freeze([
  "receiptIdentityHash", "receiptBindingHash", "testClockInstant",
]);
const READ_FIELDS = Object.freeze(["receiptIdentityHash"]);
const TRANSITION_FIELDS = Object.freeze([
  "receiptIdentityHash", "expectedState", "expectedVersion",
  "expectedClaimHash", "terminalState", "terminalEvidenceHash",
  "testClockInstant",
]);
const DOMAINS = Object.freeze({
  id: "FINPLE_STEP114_2X_C_SYNTHETIC_CLAIM_ID\0",
  hash: "FINPLE_STEP114_2X_C_SYNTHETIC_CLAIM_HASH\0",
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

function sealClaim(fields) {
  const claim = {
    contractVersion: CLAIM_RECORD_CONTRACT_VERSION,
    ...structuredClone(fields),
  };
  claim.claimId = `metrics-cutover-synthetic-claim-${hashWithDomain(
    DOMAINS.id,
    without(without(claim, "claimId"), "claimHash"),
  )}`;
  claim.claimHash = hashWithDomain(DOMAINS.hash, without(claim, "claimHash"));
  return Object.freeze(claim);
}

function validateSyntheticClaimRecord(value) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, CLAIM_RECORD_FIELDS)) {
    return ["synthetic_claim_record_fields_invalid"];
  }
  if (value.contractVersion !== CLAIM_RECORD_CONTRACT_VERSION) issues.push("synthetic_claim_record_version_invalid");
  if (!isSafeIdentity(value.claimId) || !value.claimId.startsWith("metrics-cutover-synthetic-claim-")) issues.push("synthetic_claim_id_invalid");
  for (const field of ["receiptIdentityHash", "receiptBindingHash", "terminalEvidenceHash", "claimHash"]) {
    if (!isSha256(value[field])) issues.push(`synthetic_claim_hash_invalid:${field}`);
  }
  if (!Number.isInteger(value.version) || ![1, 2].includes(value.version)) issues.push("synthetic_claim_version_number_invalid");
  if (!parseCanonicalInstant(value.createdAt)) issues.push("synthetic_claim_created_at_invalid");
  if (value.state === "claim_in_progress") {
    if (value.version !== 1 || value.terminalAt !== "" || value.terminalEvidenceHash !== "0".repeat(64)) issues.push("synthetic_claim_initial_state_invalid");
  } else if (CLAIM_TERMINAL_STATES.includes(value.state)) {
    if (value.version !== 2 || !parseCanonicalInstant(value.terminalAt) || !isSha256(value.terminalEvidenceHash)) issues.push("synthetic_claim_terminal_state_invalid");
  } else {
    issues.push("synthetic_claim_state_invalid");
  }
  try {
    const expected = sealClaim(without(without(value, "claimId"), "claimHash"));
    if (expected.claimId !== value.claimId) issues.push("synthetic_claim_id_mismatch");
    if (expected.claimHash !== value.claimHash) issues.push("synthetic_claim_hash_mismatch");
  } catch {
    issues.push("synthetic_claim_canonicalization_failed");
  }
  return uniqueSorted(issues);
}

function blocked(status, issues, claim = {}) {
  return { ok: false, status, claim, blockingIssues: uniqueSorted(issues) };
}

function createSyntheticClaimStoreAdapter(options = {}) {
  const scheduler = isRecord(options.scheduler) && typeof options.scheduler.wait === "function"
    ? options.scheduler
    : { wait: async () => {} };
  const records = new Map();
  let mutationCount = 0;

  async function acquireClaim(input) {
    if (!isRecord(input) || !hasExactKeys(input, ACQUIRE_FIELDS)) return blocked("blocked", ["claim_acquire_fields_invalid"]);
    if (!isSha256(input.receiptIdentityHash) || !isSha256(input.receiptBindingHash) || !parseCanonicalInstant(input.testClockInstant)) {
      return blocked("blocked", ["claim_acquire_input_invalid"]);
    }
    await scheduler.wait("before_claim_acquire_commit", { receiptIdentityHash: input.receiptIdentityHash });
    const existing = records.get(input.receiptIdentityHash);
    if (existing) return blocked("already_claimed", ["receipt_claim_already_exists"], structuredClone(existing));
    const claim = sealClaim({
      receiptIdentityHash: input.receiptIdentityHash,
      receiptBindingHash: input.receiptBindingHash,
      state: "claim_in_progress",
      version: 1,
      createdAt: input.testClockInstant,
      terminalAt: "",
      terminalEvidenceHash: "0".repeat(64),
    });
    records.set(input.receiptIdentityHash, claim);
    mutationCount += 1;
    return { ok: true, status: "claim_acquired", claim: structuredClone(claim), blockingIssues: [] };
  }

  async function readClaim(input) {
    if (!isRecord(input) || !hasExactKeys(input, READ_FIELDS) || !isSha256(input.receiptIdentityHash)) return blocked("blocked", ["claim_read_input_invalid"]);
    const claim = records.get(input.receiptIdentityHash);
    if (!claim) return blocked("claim_not_found", ["receipt_claim_not_found"]);
    return { ok: true, status: "claim_found", claim: structuredClone(claim), blockingIssues: [] };
  }

  async function transitionClaimTerminal(input) {
    if (!isRecord(input) || !hasExactKeys(input, TRANSITION_FIELDS)) return blocked("blocked", ["claim_transition_fields_invalid"]);
    if (!isSha256(input.receiptIdentityHash) || !isSha256(input.expectedClaimHash) ||
        !isSha256(input.terminalEvidenceHash) || input.expectedState !== "claim_in_progress" ||
        !Number.isInteger(input.expectedVersion) || !CLAIM_TERMINAL_STATES.includes(input.terminalState) ||
        !parseCanonicalInstant(input.testClockInstant)) return blocked("blocked", ["claim_transition_input_invalid"]);
    await scheduler.wait("before_claim_terminal_commit", { receiptIdentityHash: input.receiptIdentityHash });
    const existing = records.get(input.receiptIdentityHash);
    if (!existing) return blocked("claim_not_found", ["receipt_claim_not_found"]);
    if (existing.state !== input.expectedState || existing.version !== input.expectedVersion || existing.claimHash !== input.expectedClaimHash) {
      return blocked("stale_claim", ["claim_expected_state_version_hash_stale"], structuredClone(existing));
    }
    const terminal = sealClaim({
      receiptIdentityHash: existing.receiptIdentityHash,
      receiptBindingHash: existing.receiptBindingHash,
      state: input.terminalState,
      version: existing.version + 1,
      createdAt: existing.createdAt,
      terminalAt: input.testClockInstant,
      terminalEvidenceHash: input.terminalEvidenceHash,
    });
    records.set(input.receiptIdentityHash, terminal);
    mutationCount += 1;
    return { ok: true, status: "claim_transitioned_terminal", claim: structuredClone(terminal), blockingIssues: [] };
  }

  const adapter = { acquireClaim, readClaim, transitionClaimTerminal };
  Object.defineProperty(adapter, SYNTHETIC_ADAPTER_ATTESTATION, {
    enumerable: false,
    value: Object.freeze({
      adapterKind: "claim_store", syntheticOnly: true,
      filesystemAccess: false, processAccess: false, networkAccess: false,
      providerAccess: false, realResourceAccess: false,
    }),
  });
  Object.freeze(adapter);
  const diagnostics = Object.freeze({
    get mutationCount() { return mutationCount; },
    snapshot() {
      return [...records.values()].map((record) => structuredClone(record));
    },
  });
  return Object.freeze({ adapter, diagnostics });
}

module.exports = {
  CLAIM_RECORD_CONTRACT_VERSION,
  createSyntheticClaimStoreAdapter,
  validateSyntheticClaimRecord,
};
