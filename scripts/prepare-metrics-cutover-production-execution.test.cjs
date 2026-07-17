const assert = require("node:assert/strict");
const { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  ARTIFACT_REGENERATION_ORDER,
  CLAIM_STORE_PROFILE_CONTRACT_VERSION,
  EXECUTION_POLICY_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS,
  HOST_PROFILE_CONTRACT_VERSION,
  MANUAL_REVIEW_STATES,
  OPERATION_ORDER,
  POST_WRITE_CHECKS,
  PREPARATION_SUMMARY_CONTRACT_VERSION,
  REPOSITORY_LOCK_PROFILE_CONTRACT_VERSION,
  REPOSITORY_PREIMAGE_CHECKS,
  RUNBOOK_CONTRACT_VERSION,
  SELECTOR_PREIMAGE_CHECKS,
  SPECS,
  TARGET_ABSENCE_CHECKS,
  TERMINAL_STATES,
  prepareMetricsCutoverProductionExecution,
  sealContract,
  validatePreparationSummary,
} = require("./lib/metrics-cutover-production-execution-preparation.cjs");
const {
  parseArguments,
  runCli,
} = require("./prepare-metrics-cutover-production-execution.cjs");

function claimStoreProfile() {
  return sealContract({
    contractVersion: CLAIM_STORE_PROFILE_CONTRACT_VERSION,
    providerClass: "distributed_consistent_store",
    atomicCreateIfAbsent: true,
    claimKeyBinding: "step114_2w_receipt_id_and_hash",
    globallyUniqueClaimIdentity: true,
    durableAcknowledgement: "provider_documented_before_success",
    durabilityDocumentationReviewed: true,
    readAfterWriteConsistency: true,
    initialState: "claim_in_progress",
    terminalStates: [...TERMINAL_STATES],
    conditionalTerminalTransition: true,
    terminalStateImmutable: true,
    reusableAfterTerminal: false,
    claimDeletionAllowed: false,
    retryByDeletionAllowed: false,
    immutableAuditIdentity: true,
    immutableTimestamps: true,
    retentionPolicyDocumented: true,
    retentionMinimumDays: 365,
    operatorAccessBoundary: "named_least_privilege_manual_operators",
    localFileBacked: false,
    capabilityProfileOnly: true,
    realProviderConnectionAttempted: false,
  }, SPECS.claimStore);
}

function hostProfile() {
  return sealContract({
    contractVersion: HOST_PROFILE_CONTRACT_VERSION,
    operatingSystem: "linux",
    architecture: "x64",
    filesystemDurability: "descriptor_and_parent_directory_sync_required",
    utcClockSource: "authenticated_utc_source",
    maximumClockSkewMs: 1000,
    nodeMinimumVersion: "20.0.0",
    gitMinimumVersion: "2.40.0",
    pythonMinimumVersion: "3.11.0",
    nonInteractiveProcess: true,
    leastPrivilegeOperatorRole: true,
    repositoryRealpathPolicy: "canonical_dedicated_local_checkout",
    workingDirectoryPolicy: "dedicated_non_shared_local_directory",
    temporaryFilePolicy: "same_filesystem_private_directory_no_downloads",
    checkoutTrustPolicy: "trusted_dedicated_non_synchronized_non_download",
    sharedDirectoryProhibited: true,
    networkSynchronizedDirectoryProhibited: true,
    userDownloadDirectoryProhibited: true,
    logRedactionPolicy: "deny_raw_authority_identity_and_host_metadata",
    artifactRetentionPolicy: "documented_restricted_access_manual_disposal",
    windowsTestEvidenceIsProductionClaimEvidence: false,
    realMachineProbed: false,
  }, SPECS.host);
}

function repositoryLockProfile() {
  return sealContract({
    contractVersion: REPOSITORY_LOCK_PROFILE_CONTRACT_VERSION,
    lockScope: "exact_repository_realpath",
    exclusiveProcess: true,
    bindsRepositoryRealpath: true,
    bindsRepositoryHead: true,
    bindsRepositoryTree: true,
    bindsRepositoryBranch: true,
    bindsTrackedPathsInventory: true,
    atomicAcquisitionBeforeReceiptClaim: true,
    atomicAcquisitionBeforeWrites: true,
    ownerLivenessEvidence: "sanitized_process_liveness_without_host_identity",
    ownerIdentityRedacted: true,
    automaticLockStealing: false,
    staleLockPolicy: "explicit_manual_review_only",
    releaseAfterTerminalClaimPersistenceOnly: true,
    retryByDeleteOrOverwrite: false,
    syntheticAdapterOnly: true,
    realCheckoutLockAcquired: false,
  }, SPECS.lock);
}

function humanDecisionGate() {
  return {
    documented: true,
    immediatelyBeforeExecution: true,
    separateApprovalRequired: true,
    prApprovalAuthorizesExecution: false,
    receiptConsumptionAuthorized: false,
    targetOrSelectorWritesAuthorized: false,
    gitOperationsAuthorized: false,
    deploymentOrActivationAuthorized: false,
  };
}

function runbook() {
  return sealContract({
    contractVersion: RUNBOOK_CONTRACT_VERSION,
    artifactRegenerationOrder: [...ARTIFACT_REGENERATION_ORDER],
    singleControlledSession: true,
    noArtifactReuse: true,
    approvalResponseMaximumAgeMs: 1800000,
    approvalResponseFutureSkewMs: 60000,
    invocationMaximumAgeMs: 600000,
    invocationFutureSkewMs: 60000,
    invocationMaximumLifetimeMs: 900000,
    signerIdentitySeparationRequired: true,
    signerKeyIdSeparationRequired: true,
    signerFingerprintSeparationRequired: true,
    repositoryPreimageChecks: [...REPOSITORY_PREIMAGE_CHECKS],
    targetAbsenceChecks: [...TARGET_ABSENCE_CHECKS],
    selectorPreimageChecks: [...SELECTOR_PREIMAGE_CHECKS],
    operationOrder: [...OPERATION_ORDER],
    postWriteVerificationChecks: [...POST_WRITE_CHECKS],
    terminalManualReviewStates: [...MANUAL_REVIEW_STATES],
    humanDecisionGate: humanDecisionGate(),
    automaticRetryAllowed: false,
    automaticRollbackAllowed: false,
    targetDeletionAllowed: false,
    selectorRestorationAllowed: false,
    lockStealingAllowed: false,
    claimDeletionAllowed: false,
    historyRewriteAllowed: false,
    forcedContinuationAllowed: false,
  }, SPECS.runbook);
}

function executionPolicy(input) {
  return sealContract({
    contractVersion: EXECUTION_POLICY_CONTRACT_VERSION,
    executionMode: "preparation_only",
    claimStoreProfileId: input.claimStoreProfile.profileId,
    claimStoreProfileHash: input.claimStoreProfile.profileHash,
    hostProfileId: input.hostProfile.profileId,
    hostProfileHash: input.hostProfile.profileHash,
    repositoryLockProfileId: input.repositoryLockProfile.profileId,
    repositoryLockProfileHash: input.repositoryLockProfile.profileHash,
    runbookId: input.runbook.runbookId,
    runbookHash: input.runbook.runbookHash,
    humanDecisionGateRequired: true,
    productionExecutionApprovalGranted: false,
    receiptConsumptionAuthorized: false,
    repositoryWritesAuthorized: false,
    commitAuthorized: false,
    pushAuthorized: false,
    mergeAuthorized: false,
    deploymentAuthorized: false,
    runtimeActivationAuthorized: false,
  }, SPECS.policy);
}

function validInput() {
  const input = {
    claimStoreProfile: claimStoreProfile(),
    hostProfile: hostProfile(),
    repositoryLockProfile: repositoryLockProfile(),
    runbook: runbook(),
  };
  input.executionPolicy = executionPolicy(input);
  return input;
}

function reseal(input, field, spec) {
  input[field] = sealContract(input[field], spec);
  input.executionPolicy = executionPolicy(input);
  return input;
}

function assertFixedFalse(result) {
  for (const field of FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertBlocked(input, issue) {
  const result = prepareMetricsCutoverProductionExecution(input);
  assert.equal(result.status, "blocked", JSON.stringify(result));
  assert.equal(result.preparationReady, false);
  assert.deepEqual(result.preparationSummary, {});
  assert.ok(result.blockingIssues.includes(issue), result.blockingIssues.join(","));
  assertFixedFalse(result);
  return result;
}

test("valid preparation profile is ready while every authority remains false", () => {
  const result = prepareMetricsCutoverProductionExecution(validInput());
  assert.equal(result.status, "production_execution_preparation_ready", result.blockingIssues.join(","));
  assert.equal(result.ok, true);
  assert.equal(result.preparationReady, true);
  assert.equal(result.productionClaimEligible, false);
  assert.equal(result.preparationSummary.contractVersion, PREPARATION_SUMMARY_CONTRACT_VERSION);
  assert.deepEqual(validatePreparationSummary(result.preparationSummary), []);
  assert.deepEqual(result.warningIssues, ["preparation_ready_is_not_production_execution_approval"]);
  assertFixedFalse(result);
});

test("a local-file claim profile is never production eligible", () => {
  const input = validInput();
  input.claimStoreProfile.providerClass = "local_file";
  input.claimStoreProfile.localFileBacked = true;
  reseal(input, "claimStoreProfile", SPECS.claimStore);
  assertBlocked(input, "local_file_claim_store_not_production_eligible");
});

test("missing atomic create-if-absent blocks", () => {
  const input = validInput();
  input.claimStoreProfile.atomicCreateIfAbsent = false;
  reseal(input, "claimStoreProfile", SPECS.claimStore);
  assertBlocked(input, "claim_store_capability_missing:atomicCreateIfAbsent");
});

test("durable acknowledgement and read-after-write consistency are mandatory", () => {
  for (const [field, value, issue] of [
    ["durableAcknowledgement", "process_memory_only", "claim_store_durable_acknowledgement_invalid"],
    ["readAfterWriteConsistency", false, "claim_store_capability_missing:readAfterWriteConsistency"],
  ]) {
    const input = validInput();
    input.claimStoreProfile[field] = value;
    reseal(input, "claimStoreProfile", SPECS.claimStore);
    assertBlocked(input, issue);
  }
});

test("reusable or deletable claims block", () => {
  for (const field of ["reusableAfterTerminal", "claimDeletionAllowed", "retryByDeletionAllowed"]) {
    const input = validInput();
    input.claimStoreProfile[field] = true;
    reseal(input, "claimStoreProfile", SPECS.claimStore);
    assertBlocked(input, `claim_store_forbidden_capability:${field}`);
  }
});

test("conditional terminal transition and exact terminal states are mandatory", () => {
  const missingConditional = validInput();
  missingConditional.claimStoreProfile.conditionalTerminalTransition = false;
  reseal(missingConditional, "claimStoreProfile", SPECS.claimStore);
  assertBlocked(missingConditional, "claim_store_capability_missing:conditionalTerminalTransition");

  const reusableState = validInput();
  reusableState.claimStoreProfile.terminalStates.push("unconsumed");
  reseal(reusableState, "claimStoreProfile", SPECS.claimStore);
  assertBlocked(reusableState, "claim_store_terminal_states_invalid");
});

test("unsupported host, clock, and tool profiles block", () => {
  for (const [field, value, issue] of [
    ["operatingSystem", "windows", "host_operating_system_unsupported"],
    ["maximumClockSkewMs", 1001, "host_clock_skew_invalid"],
    ["nodeMinimumVersion", "18.0.0", "host_tool_version_unsupported:nodeMinimumVersion"],
    ["architecture", "ia32", "host_architecture_unsupported"],
  ]) {
    const input = validInput();
    input.hostProfile[field] = value;
    reseal(input, "hostProfile", SPECS.host);
    assertBlocked(input, issue);
  }
});

test("shared, synchronized, download, and untrusted checkout policies block", () => {
  for (const field of ["sharedDirectoryProhibited", "networkSynchronizedDirectoryProhibited", "userDownloadDirectoryProhibited"]) {
    const input = validInput();
    input.hostProfile[field] = false;
    reseal(input, "hostProfile", SPECS.host);
    assertBlocked(input, `host_required_control_missing:${field}`);
  }
  const untrusted = validInput();
  untrusted.hostProfile.checkoutTrustPolicy = "shared_download_directory";
  reseal(untrusted, "hostProfile", SPECS.host);
  assertBlocked(untrusted, "host_policy_invalid:checkoutTrustPolicy");
});

test("insufficient repository-lock semantics block", () => {
  for (const field of ["exclusiveProcess", "bindsRepositoryHead", "bindsRepositoryTree", "bindsRepositoryBranch", "bindsTrackedPathsInventory", "atomicAcquisitionBeforeReceiptClaim", "releaseAfterTerminalClaimPersistenceOnly"]) {
    const input = validInput();
    input.repositoryLockProfile[field] = false;
    reseal(input, "repositoryLockProfile", SPECS.lock);
    assertBlocked(input, `repository_lock_semantics_missing:${field}`);
  }
});

test("lock stealing and automatic stale-lock recovery block", () => {
  const stealing = validInput();
  stealing.repositoryLockProfile.automaticLockStealing = true;
  reseal(stealing, "repositoryLockProfile", SPECS.lock);
  assertBlocked(stealing, "repository_lock_forbidden_behavior:automaticLockStealing");

  const stale = validInput();
  stale.repositoryLockProfile.staleLockPolicy = "delete_and_retry";
  stale.repositoryLockProfile.retryByDeleteOrOverwrite = true;
  reseal(stale, "repositoryLockProfile", SPECS.lock);
  assertBlocked(stale, "repository_lock_stale_policy_invalid");
});

test("fresh-authority regeneration runbook is complete and ordered", () => {
  const input = validInput();
  input.runbook.artifactRegenerationOrder = input.runbook.artifactRegenerationOrder.slice(1);
  reseal(input, "runbook", SPECS.runbook);
  assertBlocked(input, "runbook_sequence_invalid:artifactRegenerationOrder");
});

test("exact freshness windows and all three signer-separation dimensions are required", () => {
  for (const [field, value, issue] of [
    ["approvalResponseMaximumAgeMs", 1800001, "runbook_freshness_invalid:approvalResponseMaximumAgeMs"],
    ["invocationMaximumAgeMs", 600001, "runbook_freshness_invalid:invocationMaximumAgeMs"],
    ["signerFingerprintSeparationRequired", false, "runbook_required_control_missing:signerFingerprintSeparationRequired"],
  ]) {
    const input = validInput();
    input.runbook[field] = value;
    reseal(input, "runbook", SPECS.runbook);
    assertBlocked(input, issue);
  }
});

test("a separately documented immediate human decision gate is mandatory", () => {
  for (const [field, value, issue] of [
    ["documented", false, "runbook_human_decision_gate_missing:documented"],
    ["immediatelyBeforeExecution", false, "runbook_human_decision_gate_missing:immediatelyBeforeExecution"],
    ["prApprovalAuthorizesExecution", true, "runbook_human_decision_gate_authority_invalid:prApprovalAuthorizesExecution"],
  ]) {
    const input = validInput();
    input.runbook.humanDecisionGate[field] = value;
    reseal(input, "runbook", SPECS.runbook);
    assertBlocked(input, issue);
  }
});

test("automatic retry, rollback, deletion, restoration, lock stealing, and history rewrite instructions block", () => {
  for (const field of ["automaticRetryAllowed", "automaticRollbackAllowed", "targetDeletionAllowed", "selectorRestorationAllowed", "lockStealingAllowed", "claimDeletionAllowed", "historyRewriteAllowed", "forcedContinuationAllowed"]) {
    const input = validInput();
    input.runbook[field] = true;
    reseal(input, "runbook", SPECS.runbook);
    assertBlocked(input, `runbook_forbidden_instruction:${field}`);
  }
});

test("caller-controlled authority and profile binding mismatches block", () => {
  const authority = validInput();
  authority.executionPolicy.commitAuthorized = true;
  authority.executionPolicy = sealContract(authority.executionPolicy, SPECS.policy);
  assertBlocked(authority, "execution_policy_authority_must_be_false:commitAuthorized");

  const mismatch = validInput();
  mismatch.executionPolicy.claimStoreProfileHash = "0".repeat(64);
  mismatch.executionPolicy = sealContract(mismatch.executionPolicy, SPECS.policy);
  assertBlocked(mismatch, "execution_policy_binding_mismatch:claimStoreProfileHash");
});

test("contract IDs and hashes are domain-separated and tampering blocks", () => {
  const input = validInput();
  input.hostProfile.profileHash = "f".repeat(64);
  assertBlocked(input, "host_profile_hash_mismatch");
  assert.notEqual(validInput().claimStoreProfile.profileHash, validInput().hostProfile.profileHash);
});

test("blocked and idle results suppress contract identities and capability material", () => {
  const idle = prepareMetricsCutoverProductionExecution();
  assert.equal(idle.status, "idle");
  assert.deepEqual(idle.preparationSummary, {});
  assertFixedFalse(idle);

  const input = validInput();
  input.claimStoreProfile.providerClass = "credential://sensitive-provider-material";
  input.claimStoreProfile.secret = "must-never-appear";
  const blocked = prepareMetricsCutoverProductionExecution(input);
  const serialized = JSON.stringify(blocked);
  assert.equal(serialized.includes("sensitive-provider-material"), false);
  assert.equal(serialized.includes("must-never-appear"), false);
  assert.deepEqual(blocked.preparationSummary, {});
});

test("pure preparation has no filesystem, process, network, provider, claim, or lock side effect", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "finple-2x-b-pure-"));
  try {
    const before = readdirSync(root);
    const result = prepareMetricsCutoverProductionExecution(validInput());
    const after = readdirSync(root);
    assert.equal(result.status, "production_execution_preparation_ready");
    assert.deepEqual(after, before);
    const source = readFileSync(path.join(__dirname, "lib", "metrics-cutover-production-execution-preparation.cjs"), "utf8");
    for (const forbidden of ["node:fs", "node:child_process", "node:http", "node:https", "node:net", "node:tls", "redis", "postgres", "aws-sdk", "@google-cloud"]) {
      assert.equal(source.includes(`require(\"${forbidden}\")`), false, forbidden);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

function cliArgs(files) {
  return [
    "--policy", files.executionPolicy,
    "--claim-store-profile", files.claimStoreProfile,
    "--host-profile", files.hostProfile,
    "--repository-lock-profile", files.repositoryLockProfile,
    "--runbook", files.runbook,
  ];
}

test("validation-only CLI accepts exactly five sanitized JSON files and emits one line", async (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "finple-2x-b-cli-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const input = validInput();
  const files = {};
  for (const [field, value] of Object.entries(input)) {
    files[field] = path.join(root, `${field}.json`);
    writeFileSync(files[field], JSON.stringify(value));
  }
  let stdout = "";
  let exitCode = -1;
  await runCli(cliArgs(files), {
    writeStdout(value) { stdout += value; },
    setExitCode(value) { exitCode = value; },
  });
  assert.equal(exitCode, 0);
  assert.equal(stdout.split("\n").length, 2);
  const result = JSON.parse(stdout.trim());
  assert.equal(result.status, "production_execution_preparation_ready");
  assertFixedFalse(result);
});

test("CLI rejects provider, execution, stdin-style, and duplicate flags", async () => {
  assert.throws(() => parseArguments(["--provider-endpoint", "x"]), /expected_exactly_five/);
  const duplicated = [
    "--policy", "a", "--policy", "b",
    "--host-profile", "c", "--repository-lock-profile", "d", "--runbook", "e",
  ];
  assert.throws(() => parseArguments(duplicated), /duplicate_flag/);
  let stdout = "";
  let exitCode = -1;
  await runCli(["--stdin", "-"], {
    writeStdout(value) { stdout += value; },
    setExitCode(value) { exitCode = value; },
  });
  assert.equal(exitCode, 2);
  assert.equal(JSON.parse(stdout).status, "blocked");
});
