const {
  canonicalJson,
  hasExactKeys,
  hashWithDomain,
  isGitSha,
  isRecord,
  isSafeIdentity,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const {
  validatePreparationSummary,
} = require("./metrics-cutover-production-execution-preparation.cjs");

const CLAIM_STORE_ADAPTER_PROTOCOL_VERSION =
  "metrics-cutover-claim-store-adapter-protocol-v1-step114-2x-c";
const REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION =
  "metrics-cutover-repository-lock-adapter-protocol-v1-step114-2x-c";
const CONFORMANCE_SCENARIO_CONTRACT_VERSION =
  "metrics-cutover-adapter-conformance-scenario-v1-step114-2x-c";
const CONFORMANCE_EVENT_CONTRACT_VERSION =
  "metrics-cutover-adapter-conformance-event-v1-step114-2x-c";
const CONFORMANCE_LEDGER_CONTRACT_VERSION =
  "metrics-cutover-adapter-conformance-ledger-v1-step114-2x-c";
const CONFORMANCE_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-adapter-conformance-summary-v1-step114-2x-c";
const SYNTHETIC_EXECUTION_PROTOCOL_VERSION =
  "metrics-cutover-synthetic-execution-stage-v1-step114-2x-c";
const ZERO_HASH = "0".repeat(64);
const SYNTHETIC_ADAPTER_ATTESTATION = Symbol.for(
  "FINPLE_STEP114_2X_C_SYNTHETIC_ADAPTER_ATTESTATION",
);

const DOMAINS = Object.freeze({
  claimProtocolHash: "FINPLE_STEP114_2X_C_CLAIM_PROTOCOL_HASH\0",
  lockProtocolHash: "FINPLE_STEP114_2X_C_LOCK_PROTOCOL_HASH\0",
  scenarioId: "FINPLE_STEP114_2X_C_SCENARIO_ID\0",
  scenarioHash: "FINPLE_STEP114_2X_C_SCENARIO_HASH\0",
  eventHash: "FINPLE_STEP114_2X_C_EVENT_HASH\0",
  ledgerHash: "FINPLE_STEP114_2X_C_LEDGER_HASH\0",
  observationHash: "FINPLE_STEP114_2X_C_OBSERVATION_HASH\0",
  summaryId: "FINPLE_STEP114_2X_C_SUMMARY_ID\0",
  summaryHash: "FINPLE_STEP114_2X_C_SUMMARY_HASH\0",
});

const FIXED_FALSE_FIELDS = Object.freeze([
  "executionAuthorized",
  "fileWriteAuthorized",
  "productionClaimEligible",
  "realProviderAdapterValidated",
  "realRepositoryLockValidated",
  "commitAuthorized",
  "pushAuthorized",
  "mergeAuthorized",
  "deploymentAuthorized",
  "productionPublicationAuthorized",
  "appExportActivated",
  "pointerMutationExecuted",
  "rollbackExecuted",
  "loaderActivated",
]);
const CLAIM_ADAPTER_METHODS = Object.freeze([
  "acquireClaim",
  "readClaim",
  "transitionClaimTerminal",
]);
const REPOSITORY_LOCK_ADAPTER_METHODS = Object.freeze([
  "acquireLock",
  "readLock",
  "releaseLock",
]);
const CLAIM_TERMINAL_STATES = Object.freeze([
  "consumed_failed_manual_review",
  "consumed_success",
]);
const REPOSITORY_BINDING_FIELDS = Object.freeze([
  "repositoryIdentityHash",
  "repositoryHeadSha",
  "repositoryTreeSha",
  "repositoryBranchName",
  "trackedPathsSha256",
]);
const EVENT_OPERATIONS = Object.freeze([
  "validate_preparation_summary",
  "acquire_repository_lock",
  "verify_repository_lock",
  "acquire_receipt_claim",
  "verify_receipt_claim",
  "observe_synthetic_execution_stage",
  "transition_claim_terminal",
  "verify_terminal_claim",
  "release_repository_lock",
  "verify_released_repository_lock",
]);

const CLAIM_PROTOCOL_FIELDS = Object.freeze([
  "contractVersion", "methods", "initialState", "terminalStates",
  "atomicCreateIfAbsent", "readAfterWrite", "expectedVersionAndHashRequired",
  "singleTerminalTransition", "reusableAfterTerminal", "deletionAllowed",
  "resetAllowed", "releaseAllowed", "realProviderAccessAllowed", "protocolHash",
]);
const LOCK_PROTOCOL_FIELDS = Object.freeze([
  "contractVersion", "methods", "bindingFields", "atomicExclusiveAcquisition",
  "terminalClaimEvidenceRequired", "repeatedReleaseMutates",
  "lockStealingAllowed", "deleteAndRetryAllowed", "overwriteAllowed",
  "staleLockPolicy", "realLockAccessAllowed", "protocolHash",
]);
const SCENARIO_FIELDS = Object.freeze([
  "contractVersion", "scenarioId", "scenarioHash", "preparationSummary",
  "preparationSummaryHash", "claimStoreProtocol", "repositoryLockProtocol",
  "receiptIdentityHash", "receiptBindingHash", "repositoryIdentityHash",
  "repositoryHeadSha", "repositoryTreeSha", "repositoryBranchName",
  "trackedPathsSha256", "ownerLivenessHash", "terminalState",
  "testClockInstants",
]);
const EVENT_FIELDS = Object.freeze([
  "contractVersion", "sequence", "scenarioId", "scenarioHash",
  "adapterProtocolVersion", "operation", "resourceIdentityHash",
  "expectedPriorStateVersionHash", "resultCategory",
  "resultingStateVersionHash", "testClockInstant", "previousEventHash",
  "eventHash",
]);
const LEDGER_FIELDS = Object.freeze([
  "contractVersion", "scenarioId", "scenarioHash", "events", "eventCount",
  "ledgerHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "conformanceId", "scenarioId", "scenarioHash",
  "claimStoreProtocolHash", "repositoryLockProtocolHash",
  "preparationSummaryHash", "ledgerHash", "eventCount", "terminalState",
  ...FIXED_FALSE_FIELDS, "summaryHash",
]);
const ATTESTATION_FIELDS = Object.freeze([
  "adapterKind", "syntheticOnly", "filesystemAccess", "processAccess",
  "networkAccess", "providerAccess", "realResourceAccess",
]);

function without(value, field) {
  const result = structuredClone(value);
  delete result[field];
  return result;
}

function arrayEquals(value, expected) {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((item, index) => item === expected[index]);
}

function parseCanonicalInstant(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}Z$/.test(value)
  ) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value
    ? parsed
    : null;
}

function sealHash(value, hashField, domain) {
  const sealed = structuredClone(value);
  sealed[hashField] = hashWithDomain(domain, without(sealed, hashField));
  return sealed;
}

function sealIdAndHash(value, specification) {
  const sealed = structuredClone(value);
  const idPayload = without(without(sealed, specification.idField), specification.hashField);
  sealed[specification.idField] = `${specification.idPrefix}-${hashWithDomain(
    specification.idDomain,
    idPayload,
  )}`;
  sealed[specification.hashField] = hashWithDomain(
    specification.hashDomain,
    without(sealed, specification.hashField),
  );
  return sealed;
}

function buildClaimStoreAdapterProtocol() {
  return sealHash({
    contractVersion: CLAIM_STORE_ADAPTER_PROTOCOL_VERSION,
    methods: [...CLAIM_ADAPTER_METHODS],
    initialState: "claim_in_progress",
    terminalStates: [...CLAIM_TERMINAL_STATES],
    atomicCreateIfAbsent: true,
    readAfterWrite: true,
    expectedVersionAndHashRequired: true,
    singleTerminalTransition: true,
    reusableAfterTerminal: false,
    deletionAllowed: false,
    resetAllowed: false,
    releaseAllowed: false,
    realProviderAccessAllowed: false,
  }, "protocolHash", DOMAINS.claimProtocolHash);
}

function buildRepositoryLockAdapterProtocol() {
  return sealHash({
    contractVersion: REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION,
    methods: [...REPOSITORY_LOCK_ADAPTER_METHODS],
    bindingFields: [...REPOSITORY_BINDING_FIELDS],
    atomicExclusiveAcquisition: true,
    terminalClaimEvidenceRequired: true,
    repeatedReleaseMutates: false,
    lockStealingAllowed: false,
    deleteAndRetryAllowed: false,
    overwriteAllowed: false,
    staleLockPolicy: "explicit_manual_review_only",
    realLockAccessAllowed: false,
  }, "protocolHash", DOMAINS.lockProtocolHash);
}

function validateClaimStoreAdapterProtocol(value) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, CLAIM_PROTOCOL_FIELDS)) {
    return ["claim_store_protocol_fields_invalid"];
  }
  if (value.contractVersion !== CLAIM_STORE_ADAPTER_PROTOCOL_VERSION) issues.push("claim_store_protocol_version_invalid");
  if (!arrayEquals(value.methods, CLAIM_ADAPTER_METHODS)) issues.push("claim_store_protocol_methods_invalid");
  if (value.initialState !== "claim_in_progress") issues.push("claim_store_protocol_initial_state_invalid");
  if (!arrayEquals(value.terminalStates, CLAIM_TERMINAL_STATES)) issues.push("claim_store_protocol_terminal_states_invalid");
  for (const field of ["atomicCreateIfAbsent", "readAfterWrite", "expectedVersionAndHashRequired", "singleTerminalTransition"]) {
    if (value[field] !== true) issues.push(`claim_store_protocol_capability_missing:${field}`);
  }
  for (const field of ["reusableAfterTerminal", "deletionAllowed", "resetAllowed", "releaseAllowed", "realProviderAccessAllowed"]) {
    if (value[field] !== false) issues.push(`claim_store_protocol_forbidden:${field}`);
  }
  if (!isSha256(value.protocolHash)) issues.push("claim_store_protocol_hash_invalid");
  else if (value.protocolHash !== hashWithDomain(DOMAINS.claimProtocolHash, without(value, "protocolHash"))) issues.push("claim_store_protocol_hash_mismatch");
  return uniqueSorted(issues);
}

function validateRepositoryLockAdapterProtocol(value) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, LOCK_PROTOCOL_FIELDS)) {
    return ["repository_lock_protocol_fields_invalid"];
  }
  if (value.contractVersion !== REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION) issues.push("repository_lock_protocol_version_invalid");
  if (!arrayEquals(value.methods, REPOSITORY_LOCK_ADAPTER_METHODS)) issues.push("repository_lock_protocol_methods_invalid");
  if (!arrayEquals(value.bindingFields, REPOSITORY_BINDING_FIELDS)) issues.push("repository_lock_protocol_binding_fields_invalid");
  for (const field of ["atomicExclusiveAcquisition", "terminalClaimEvidenceRequired"]) {
    if (value[field] !== true) issues.push(`repository_lock_protocol_capability_missing:${field}`);
  }
  for (const field of ["repeatedReleaseMutates", "lockStealingAllowed", "deleteAndRetryAllowed", "overwriteAllowed", "realLockAccessAllowed"]) {
    if (value[field] !== false) issues.push(`repository_lock_protocol_forbidden:${field}`);
  }
  if (value.staleLockPolicy !== "explicit_manual_review_only") issues.push("repository_lock_protocol_stale_policy_invalid");
  if (!isSha256(value.protocolHash)) issues.push("repository_lock_protocol_hash_invalid");
  else if (value.protocolHash !== hashWithDomain(DOMAINS.lockProtocolHash, without(value, "protocolHash"))) issues.push("repository_lock_protocol_hash_mismatch");
  return uniqueSorted(issues);
}

function sealConformanceScenario(value) {
  return sealIdAndHash({
    ...structuredClone(value),
    contractVersion: CONFORMANCE_SCENARIO_CONTRACT_VERSION,
  }, {
    idField: "scenarioId",
    hashField: "scenarioHash",
    idPrefix: "metrics-cutover-adapter-conformance-scenario",
    idDomain: DOMAINS.scenarioId,
    hashDomain: DOMAINS.scenarioHash,
  });
}

function validateConformanceScenario(value) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, SCENARIO_FIELDS)) {
    return ["conformance_scenario_fields_invalid"];
  }
  if (value.contractVersion !== CONFORMANCE_SCENARIO_CONTRACT_VERSION) issues.push("conformance_scenario_version_invalid");
  if (!isSafeIdentity(value.scenarioId) || !value.scenarioId.startsWith("metrics-cutover-adapter-conformance-scenario-")) issues.push("conformance_scenario_id_invalid");
  if (!isSha256(value.scenarioHash)) issues.push("conformance_scenario_hash_invalid");
  if (value.preparationSummaryHash !== value.preparationSummary?.summaryHash) issues.push("conformance_preparation_summary_binding_mismatch");
  issues.push(...validatePreparationSummary(value.preparationSummary).map((issue) => `step114_2x_b_${issue}`));
  issues.push(...validateClaimStoreAdapterProtocol(value.claimStoreProtocol));
  issues.push(...validateRepositoryLockAdapterProtocol(value.repositoryLockProtocol));
  for (const field of ["preparationSummaryHash", "receiptIdentityHash", "receiptBindingHash", "repositoryIdentityHash", "trackedPathsSha256", "ownerLivenessHash"]) {
    if (!isSha256(value[field])) issues.push(`conformance_scenario_hash_field_invalid:${field}`);
  }
  for (const field of ["repositoryHeadSha", "repositoryTreeSha"]) {
    if (!isGitSha(value[field])) issues.push(`conformance_scenario_git_sha_invalid:${field}`);
  }
  if (!isSafeIdentity(value.repositoryBranchName)) issues.push("conformance_scenario_branch_invalid");
  if (!CLAIM_TERMINAL_STATES.includes(value.terminalState)) issues.push("conformance_scenario_terminal_state_invalid");
  if (
    !Array.isArray(value.testClockInstants) ||
    value.testClockInstants.length !== EVENT_OPERATIONS.length ||
    value.testClockInstants.some((instant) => !parseCanonicalInstant(instant)) ||
    new Set(value.testClockInstants).size !== value.testClockInstants.length
  ) issues.push("conformance_scenario_test_clock_invalid");
  try {
    const expected = sealConformanceScenario(without(without(value, "scenarioId"), "scenarioHash"));
    if (value.scenarioId !== expected.scenarioId) issues.push("conformance_scenario_id_mismatch");
    if (value.scenarioHash !== expected.scenarioHash) issues.push("conformance_scenario_hash_mismatch");
  } catch {
    issues.push("conformance_scenario_canonicalization_failed");
  }
  return uniqueSorted(issues);
}

function validateAdapter(adapter, expectedMethods, expectedKind) {
  const issues = [];
  if (!isRecord(adapter)) return [`${expectedKind}_adapter_not_object`];
  const stringKeys = Reflect.ownKeys(adapter).filter((key) => typeof key === "string").sort();
  const expected = [...expectedMethods].sort();
  if (stringKeys.length !== expected.length || stringKeys.some((key, index) => key !== expected[index])) {
    issues.push(`${expectedKind}_adapter_method_set_invalid`);
  }
  for (const method of expectedMethods) {
    if (typeof adapter[method] !== "function") issues.push(`${expectedKind}_adapter_method_invalid:${method}`);
  }
  const attestation = adapter[SYNTHETIC_ADAPTER_ATTESTATION];
  if (!isRecord(attestation) || !hasExactKeys(attestation, ATTESTATION_FIELDS)) {
    issues.push(`${expectedKind}_adapter_attestation_invalid`);
  } else {
    if (attestation.adapterKind !== expectedKind || attestation.syntheticOnly !== true) issues.push(`${expectedKind}_adapter_not_synthetic`);
    for (const field of ["filesystemAccess", "processAccess", "networkAccess", "providerAccess", "realResourceAccess"]) {
      if (attestation[field] !== false) issues.push(`${expectedKind}_adapter_forbidden_access:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function buildEvent(fields) {
  return sealHash({
    contractVersion: CONFORMANCE_EVENT_CONTRACT_VERSION,
    ...structuredClone(fields),
  }, "eventHash", DOMAINS.eventHash);
}

function validateConformanceEvent(value, expected = {}) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, EVENT_FIELDS)) return ["conformance_event_fields_invalid"];
  if (value.contractVersion !== CONFORMANCE_EVENT_CONTRACT_VERSION) issues.push("conformance_event_version_invalid");
  if (!Number.isInteger(value.sequence) || value.sequence <= 0) issues.push("conformance_event_sequence_invalid");
  if (!isSafeIdentity(value.scenarioId) || !isSha256(value.scenarioHash)) issues.push("conformance_event_scenario_identity_invalid");
  if (!isSafeIdentity(value.adapterProtocolVersion)) issues.push("conformance_event_protocol_invalid");
  if (!EVENT_OPERATIONS.includes(value.operation)) issues.push("conformance_event_operation_invalid");
  for (const field of ["resourceIdentityHash", "expectedPriorStateVersionHash", "resultingStateVersionHash", "previousEventHash", "eventHash"]) {
    if (!isSha256(value[field])) issues.push(`conformance_event_hash_invalid:${field}`);
  }
  if (!isSafeIdentity(value.resultCategory)) issues.push("conformance_event_result_invalid");
  if (!parseCanonicalInstant(value.testClockInstant)) issues.push("conformance_event_time_invalid");
  for (const [field, expectedValue] of Object.entries(expected)) {
    if (expectedValue !== undefined && value[field] !== expectedValue) issues.push(`conformance_event_expected_mismatch:${field}`);
  }
  if (isSha256(value.eventHash) && value.eventHash !== hashWithDomain(DOMAINS.eventHash, without(value, "eventHash"))) issues.push("conformance_event_hash_mismatch");
  return uniqueSorted(issues);
}

function buildLedger(scenario, events) {
  return sealHash({
    contractVersion: CONFORMANCE_LEDGER_CONTRACT_VERSION,
    scenarioId: scenario.scenarioId,
    scenarioHash: scenario.scenarioHash,
    events: structuredClone(events),
    eventCount: events.length,
  }, "ledgerHash", DOMAINS.ledgerHash);
}

function validateConformanceLedger(value) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, LEDGER_FIELDS)) return ["conformance_ledger_fields_invalid"];
  if (value.contractVersion !== CONFORMANCE_LEDGER_CONTRACT_VERSION) issues.push("conformance_ledger_version_invalid");
  if (!isSafeIdentity(value.scenarioId) || !isSha256(value.scenarioHash)) issues.push("conformance_ledger_scenario_identity_invalid");
  if (!Array.isArray(value.events) || value.events.length !== EVENT_OPERATIONS.length || value.eventCount !== value.events.length) {
    issues.push("conformance_ledger_event_count_invalid");
  } else {
    let previousEventHash = ZERO_HASH;
    value.events.forEach((event, index) => {
      issues.push(...validateConformanceEvent(event, {
        sequence: index + 1,
        scenarioId: value.scenarioId,
        scenarioHash: value.scenarioHash,
        operation: EVENT_OPERATIONS[index],
        previousEventHash,
      }).map((issue) => `${issue}:${index + 1}`));
      previousEventHash = event?.eventHash;
    });
  }
  if (!isSha256(value.ledgerHash)) issues.push("conformance_ledger_hash_invalid");
  else if (value.ledgerHash !== hashWithDomain(DOMAINS.ledgerHash, without(value, "ledgerHash"))) issues.push("conformance_ledger_hash_mismatch");
  return uniqueSorted(issues);
}

function buildConformanceSummary(scenario, ledger) {
  return sealIdAndHash({
    contractVersion: CONFORMANCE_SUMMARY_CONTRACT_VERSION,
    scenarioId: scenario.scenarioId,
    scenarioHash: scenario.scenarioHash,
    claimStoreProtocolHash: scenario.claimStoreProtocol.protocolHash,
    repositoryLockProtocolHash: scenario.repositoryLockProtocol.protocolHash,
    preparationSummaryHash: scenario.preparationSummaryHash,
    ledgerHash: ledger.ledgerHash,
    eventCount: ledger.eventCount,
    terminalState: scenario.terminalState,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, {
    idField: "conformanceId",
    hashField: "summaryHash",
    idPrefix: "metrics-cutover-adapter-conformance-summary",
    idDomain: DOMAINS.summaryId,
    hashDomain: DOMAINS.summaryHash,
  });
}

function validateConformanceSummary(value) {
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, SUMMARY_FIELDS)) return ["conformance_summary_fields_invalid"];
  if (value.contractVersion !== CONFORMANCE_SUMMARY_CONTRACT_VERSION) issues.push("conformance_summary_version_invalid");
  if (!isSafeIdentity(value.conformanceId) || !value.conformanceId.startsWith("metrics-cutover-adapter-conformance-summary-")) issues.push("conformance_summary_id_invalid");
  for (const field of ["scenarioHash", "claimStoreProtocolHash", "repositoryLockProtocolHash", "preparationSummaryHash", "ledgerHash", "summaryHash"]) {
    if (!isSha256(value[field])) issues.push(`conformance_summary_hash_invalid:${field}`);
  }
  if (!Number.isInteger(value.eventCount) || value.eventCount !== EVENT_OPERATIONS.length) issues.push("conformance_summary_event_count_invalid");
  if (!CLAIM_TERMINAL_STATES.includes(value.terminalState)) issues.push("conformance_summary_terminal_state_invalid");
  for (const field of FIXED_FALSE_FIELDS) if (value[field] !== false) issues.push(`conformance_summary_fixed_false_invalid:${field}`);
  try {
    const expected = sealIdAndHash(without(without(value, "conformanceId"), "summaryHash"), {
      idField: "conformanceId", hashField: "summaryHash",
      idPrefix: "metrics-cutover-adapter-conformance-summary",
      idDomain: DOMAINS.summaryId, hashDomain: DOMAINS.summaryHash,
    });
    if (value.conformanceId !== expected.conformanceId) issues.push("conformance_summary_id_mismatch");
    if (value.summaryHash !== expected.summaryHash) issues.push("conformance_summary_hash_mismatch");
  } catch {
    issues.push("conformance_summary_canonicalization_failed");
  }
  return uniqueSorted(issues);
}

function safeResult(status, fields = {}, issues = []) {
  const ready = status === "adapter_conformance_ready";
  return {
    ok: ready,
    status,
    contractVersion: CONFORMANCE_SUMMARY_CONTRACT_VERSION,
    adapterConformanceReady: ready,
    syntheticClaimStoreValidated: ready,
    syntheticRepositoryLockValidated: ready,
    eventLedger: ready ? fields.eventLedger || {} : {},
    conformanceSummary: ready ? fields.conformanceSummary || {} : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: ready
      ? ["synthetic_conformance_is_not_real_adapter_validation"]
      : [],
  };
}

function recordsEqual(left, right) {
  try {
    return canonicalJson(left) === canonicalJson(right);
  } catch {
    return false;
  }
}

function validateClaimEvidence(claim, scenario, expectedState) {
  const {
    validateSyntheticClaimRecord,
  } = require("./metrics-cutover-synthetic-claim-store-adapter.cjs");
  const issues = validateSyntheticClaimRecord(claim);
  if (claim?.receiptIdentityHash !== scenario.receiptIdentityHash) issues.push("claim_receipt_identity_binding_mismatch");
  if (claim?.receiptBindingHash !== scenario.receiptBindingHash) issues.push("claim_receipt_evidence_binding_mismatch");
  if (claim?.state !== expectedState) issues.push("claim_state_evidence_mismatch");
  return uniqueSorted(issues);
}

function validateLockEvidence(lock, scenario, expectedState, terminalClaimHash = null) {
  const {
    validateSyntheticRepositoryLockRecord,
  } = require("./metrics-cutover-synthetic-repository-lock-adapter.cjs");
  const issues = validateSyntheticRepositoryLockRecord(lock);
  const expectedBindings = {
    repositoryIdentityHash: scenario.repositoryIdentityHash,
    repositoryHeadSha: scenario.repositoryHeadSha,
    repositoryTreeSha: scenario.repositoryTreeSha,
    repositoryBranchName: scenario.repositoryBranchName,
    trackedPathsSha256: scenario.trackedPathsSha256,
    ownerLivenessHash: scenario.ownerLivenessHash,
  };
  for (const [field, expected] of Object.entries(expectedBindings)) {
    if (lock?.[field] !== expected) issues.push(`repository_lock_binding_mismatch:${field}`);
  }
  if (lock?.state !== expectedState) issues.push("repository_lock_state_evidence_mismatch");
  if (terminalClaimHash !== null && lock?.terminalClaimEvidenceHash !== terminalClaimHash) {
    issues.push("repository_lock_terminal_claim_binding_mismatch");
  }
  return uniqueSorted(issues);
}

function requireValidEvidence(issues, issueCode) {
  if (issues.length > 0) throw new Error(issueCode);
}

async function runMetricsCutoverAdapterConformance(input, adapters = {}) {
  if (input === undefined || input === null) return safeResult("idle");
  if (!isRecord(input) || !hasExactKeys(input, ["scenario"])) return safeResult("blocked", {}, ["conformance_input_fields_invalid"]);
  const scenario = input.scenario;
  const issues = [
    ...validateConformanceScenario(scenario),
    ...validateAdapter(adapters.claimStoreAdapter, CLAIM_ADAPTER_METHODS, "claim_store"),
    ...validateAdapter(adapters.repositoryLockAdapter, REPOSITORY_LOCK_ADAPTER_METHODS, "repository_lock"),
  ];
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  const events = [];
  const appendEvent = (operation, adapterProtocolVersion, resourceIdentityHash, expectedPriorStateVersionHash, resultCategory, resultingStateVersionHash) => {
    const sequence = events.length + 1;
    events.push(buildEvent({
      sequence,
      scenarioId: scenario.scenarioId,
      scenarioHash: scenario.scenarioHash,
      adapterProtocolVersion,
      operation,
      resourceIdentityHash,
      expectedPriorStateVersionHash,
      resultCategory,
      resultingStateVersionHash,
      testClockInstant: scenario.testClockInstants[sequence - 1],
      previousEventHash: sequence === 1 ? ZERO_HASH : events[sequence - 2].eventHash,
    }));
  };

  try {
    appendEvent(
      EVENT_OPERATIONS[0],
      CONFORMANCE_SCENARIO_CONTRACT_VERSION,
      scenario.preparationSummaryHash,
      ZERO_HASH,
      "validated",
      scenario.preparationSummaryHash,
    );

    const lockAcquire = await adapters.repositoryLockAdapter.acquireLock({
      repositoryIdentityHash: scenario.repositoryIdentityHash,
      repositoryHeadSha: scenario.repositoryHeadSha,
      repositoryTreeSha: scenario.repositoryTreeSha,
      repositoryBranchName: scenario.repositoryBranchName,
      trackedPathsSha256: scenario.trackedPathsSha256,
      ownerLivenessHash: scenario.ownerLivenessHash,
      testClockInstant: scenario.testClockInstants[1],
    });
    if (lockAcquire?.ok !== true || lockAcquire.status !== "lock_acquired" || !isRecord(lockAcquire.lock)) throw new Error("repository_lock_acquire_failed");
    requireValidEvidence(
      validateLockEvidence(lockAcquire.lock, scenario, "lock_held"),
      "repository_lock_acquire_evidence_invalid",
    );
    appendEvent(EVENT_OPERATIONS[1], REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION, scenario.repositoryIdentityHash, ZERO_HASH, "acquired", lockAcquire.lock.lockHash);

    const lockRead = await adapters.repositoryLockAdapter.readLock({
      repositoryIdentityHash: scenario.repositoryIdentityHash,
    });
    if (lockRead?.ok !== true || lockRead.status !== "lock_found" || !recordsEqual(lockRead.lock, lockAcquire.lock)) throw new Error("repository_lock_read_after_write_mismatch");
    appendEvent(EVENT_OPERATIONS[2], REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION, scenario.repositoryIdentityHash, lockAcquire.lock.lockHash, "verified", lockRead.lock.lockHash);

    const claimAcquire = await adapters.claimStoreAdapter.acquireClaim({
      receiptIdentityHash: scenario.receiptIdentityHash,
      receiptBindingHash: scenario.receiptBindingHash,
      testClockInstant: scenario.testClockInstants[3],
    });
    if (claimAcquire?.ok !== true || claimAcquire.status !== "claim_acquired" || !isRecord(claimAcquire.claim)) throw new Error("claim_acquire_failed");
    requireValidEvidence(
      validateClaimEvidence(claimAcquire.claim, scenario, "claim_in_progress"),
      "claim_acquire_evidence_invalid",
    );
    appendEvent(EVENT_OPERATIONS[3], CLAIM_STORE_ADAPTER_PROTOCOL_VERSION, scenario.receiptIdentityHash, ZERO_HASH, "acquired", claimAcquire.claim.claimHash);

    const claimRead = await adapters.claimStoreAdapter.readClaim({
      receiptIdentityHash: scenario.receiptIdentityHash,
    });
    if (claimRead?.ok !== true || claimRead.status !== "claim_found" || !recordsEqual(claimRead.claim, claimAcquire.claim)) throw new Error("claim_read_after_write_mismatch");
    appendEvent(EVENT_OPERATIONS[4], CLAIM_STORE_ADAPTER_PROTOCOL_VERSION, scenario.receiptIdentityHash, claimAcquire.claim.claimHash, "verified", claimRead.claim.claimHash);

    const observationHash = hashWithDomain(DOMAINS.observationHash, {
      scenarioId: scenario.scenarioId,
      repositoryLockHash: lockRead.lock.lockHash,
      claimHash: claimRead.claim.claimHash,
      observation: "synthetic_execution_stage_only",
    });
    appendEvent(EVENT_OPERATIONS[5], SYNTHETIC_EXECUTION_PROTOCOL_VERSION, scenario.scenarioHash, claimRead.claim.claimHash, "observed_no_execution", observationHash);

    const terminal = await adapters.claimStoreAdapter.transitionClaimTerminal({
      receiptIdentityHash: scenario.receiptIdentityHash,
      expectedState: "claim_in_progress",
      expectedVersion: claimRead.claim.version,
      expectedClaimHash: claimRead.claim.claimHash,
      terminalState: scenario.terminalState,
      terminalEvidenceHash: observationHash,
      testClockInstant: scenario.testClockInstants[6],
    });
    if (terminal?.ok !== true || terminal.status !== "claim_transitioned_terminal" || !isRecord(terminal.claim)) throw new Error("claim_terminal_transition_failed");
    requireValidEvidence(
      validateClaimEvidence(terminal.claim, scenario, scenario.terminalState),
      "claim_terminal_evidence_invalid",
    );
    appendEvent(EVENT_OPERATIONS[6], CLAIM_STORE_ADAPTER_PROTOCOL_VERSION, scenario.receiptIdentityHash, claimRead.claim.claimHash, "terminal_persisted", terminal.claim.claimHash);

    const terminalRead = await adapters.claimStoreAdapter.readClaim({
      receiptIdentityHash: scenario.receiptIdentityHash,
    });
    if (terminalRead?.ok !== true || terminalRead.status !== "claim_found" || !recordsEqual(terminalRead.claim, terminal.claim)) throw new Error("terminal_claim_read_mismatch");
    appendEvent(EVENT_OPERATIONS[7], CLAIM_STORE_ADAPTER_PROTOCOL_VERSION, scenario.receiptIdentityHash, terminal.claim.claimHash, "terminal_verified", terminalRead.claim.claimHash);

    const released = await adapters.repositoryLockAdapter.releaseLock({
      repositoryIdentityHash: scenario.repositoryIdentityHash,
      expectedState: "lock_held",
      expectedVersion: lockRead.lock.version,
      expectedLockHash: lockRead.lock.lockHash,
      terminalClaim: terminalRead.claim,
      testClockInstant: scenario.testClockInstants[8],
    });
    if (released?.ok !== true || released.status !== "lock_released" || !isRecord(released.lock)) throw new Error("repository_lock_release_failed");
    requireValidEvidence(
      validateLockEvidence(released.lock, scenario, "lock_released", terminalRead.claim.claimHash),
      "repository_lock_release_evidence_invalid",
    );
    appendEvent(EVENT_OPERATIONS[8], REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION, scenario.repositoryIdentityHash, lockRead.lock.lockHash, "released", released.lock.lockHash);

    const releasedRead = await adapters.repositoryLockAdapter.readLock({
      repositoryIdentityHash: scenario.repositoryIdentityHash,
    });
    if (releasedRead?.ok !== true || releasedRead.status !== "lock_found" || !recordsEqual(releasedRead.lock, released.lock)) throw new Error("released_lock_read_mismatch");
    appendEvent(EVENT_OPERATIONS[9], REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION, scenario.repositoryIdentityHash, released.lock.lockHash, "released_verified", releasedRead.lock.lockHash);

    const ledger = buildLedger(scenario, events);
    const ledgerIssues = validateConformanceLedger(ledger);
    if (ledgerIssues.length > 0) return safeResult("blocked", {}, ledgerIssues);
    const summary = buildConformanceSummary(scenario, ledger);
    const summaryIssues = validateConformanceSummary(summary);
    if (summaryIssues.length > 0) return safeResult("blocked", {}, summaryIssues);
    return safeResult("adapter_conformance_ready", {
      eventLedger: ledger,
      conformanceSummary: summary,
    });
  } catch (error) {
    const safeIssue = isSafeIdentity(error?.message || "")
      ? error.message
      : "adapter_conformance_runtime_failure";
    return safeResult("blocked", {}, [safeIssue]);
  }
}

module.exports = {
  CLAIM_ADAPTER_METHODS,
  CLAIM_STORE_ADAPTER_PROTOCOL_VERSION,
  CLAIM_TERMINAL_STATES,
  CONFORMANCE_EVENT_CONTRACT_VERSION,
  CONFORMANCE_LEDGER_CONTRACT_VERSION,
  CONFORMANCE_SCENARIO_CONTRACT_VERSION,
  CONFORMANCE_SUMMARY_CONTRACT_VERSION,
  DOMAINS,
  EVENT_OPERATIONS,
  FIXED_FALSE_FIELDS,
  REPOSITORY_BINDING_FIELDS,
  REPOSITORY_LOCK_ADAPTER_METHODS,
  REPOSITORY_LOCK_ADAPTER_PROTOCOL_VERSION,
  SYNTHETIC_ADAPTER_ATTESTATION,
  SYNTHETIC_EXECUTION_PROTOCOL_VERSION,
  ZERO_HASH,
  buildClaimStoreAdapterProtocol,
  buildConformanceSummary,
  buildRepositoryLockAdapterProtocol,
  runMetricsCutoverAdapterConformance,
  safeResult,
  sealConformanceScenario,
  validateClaimStoreAdapterProtocol,
  validateConformanceEvent,
  validateConformanceLedger,
  validateConformanceScenario,
  validateConformanceSummary,
  validateRepositoryLockAdapterProtocol,
};
