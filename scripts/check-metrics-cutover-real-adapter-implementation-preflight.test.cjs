const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const {
  CANDIDATE_CLASSES,
  FIXED_FALSE_FIELDS,
  SPECS,
  buildSummary,
  buildValidPreflightPacket,
  evaluateMetricsCutoverRealAdapterImplementationPreflight,
  sealContract,
  validateSummary,
} = require("./lib/metrics-cutover-real-adapter-implementation-preflight.cjs");
const {
  evaluateCliRequest,
} = require("./check-metrics-cutover-real-adapter-implementation-preflight.cjs");

function reseal(packet, key, specName) {
  packet[key] = sealContract(packet[key], SPECS[specName]);
  return packet;
}

function evaluateMutation(mutator) {
  const packet = buildValidPreflightPacket();
  mutator(packet);
  return evaluateMetricsCutoverRealAdapterImplementationPreflight(packet);
}

function assertBlocked(result, issue) {
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.preflightReady, false);
  assert.deepEqual(result.preflightSummary, {});
  assert.ok(result.blockingIssues.includes(issue), `${issue}: ${result.blockingIssues}`);
  for (const field of FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertAllAuthorityFalse(result) {
  for (const field of FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

test("valid PostgreSQL table-backed design is preflight-ready with no authority", () => {
  const packet = buildValidPreflightPacket();
  const result = evaluateMetricsCutoverRealAdapterImplementationPreflight(packet);
  assert.equal(result.ok, true);
  assert.equal(result.status, "real_adapter_implementation_preflight_ready");
  assert.equal(result.preflightSummary.preferredCandidate, CANDIDATE_CLASSES[0]);
  assert.equal(result.preflightSummary.syntheticConformanceIsRealProviderValidation, false);
  for (const field of FIXED_FALSE_FIELDS) {
    assert.equal(result[field], false, field);
    assert.equal(result.preflightSummary[field], false, `summary.${field}`);
  }
});

test("idle and malformed input suppress the summary", () => {
  const idle = evaluateMetricsCutoverRealAdapterImplementationPreflight();
  assert.equal(idle.status, "idle");
  assert.deepEqual(idle.preflightSummary, {});
  assertAllAuthorityFalse(idle);
  assertBlocked(
    evaluateMetricsCutoverRealAdapterImplementationPreflight({}),
    "preflight_packet_fields_invalid",
  );
});

test("Step 114-2X-B preparation summary is required, validated, and hash-bound", () => {
  const tampered = evaluateMutation((packet) => {
    packet.preparationSummary.productionClaimEligible = true;
  });
  assertBlocked(
    tampered,
    "step114_2x_b_preparation_summary_fixed_false_invalid:productionClaimEligible",
  );
  const malformed = evaluateMutation((packet) => {
    packet.preparationSummary = {};
  });
  assertBlocked(malformed, "step114_2x_b_preparation_summary_fields_invalid");
  const binding = evaluateMutation((packet) => {
    packet.persistenceDecision.preparationSummaryHash = "f".repeat(64);
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(binding, "persistence_decision_preparation_binding_mismatch");
});

test("candidate comparison contains exactly one preferred candidate", () => {
  const result = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[1].preferred = true;
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(result, "persistence_preferred_candidate_count_invalid");
});

test("preferred and accepted candidate rows must be the same PostgreSQL row", () => {
  const swappedPreferred = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[0].preferred = false;
    packet.persistenceDecision.candidates[1].preferred = true;
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(swappedPreferred, "persistence_preferred_accepted_candidate_mismatch");

  const postgresNotPreferred = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[0].preferred = false;
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(postgresNotPreferred, "postgresql_candidate_capabilities_invalid");

  const secondAccepted = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[1].accepted = true;
    packet.persistenceDecision.candidates[1].rejectionReasons = [];
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(secondAccepted, "persistence_accepted_candidate_count_invalid");

  const postgresRejected = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[0].rejectionReasons = ["unexpected_rejection"];
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(postgresRejected, "accepted_candidate_rejection_reason_forbidden:dedicated_postgresql_transactional_store");

  const topLevelDrift = evaluateMutation((packet) => {
    packet.persistenceDecision.preferredCandidate = CANDIDATE_CLASSES[1];
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(topLevelDrift, "persistence_preferred_candidate_binding_mismatch");
});

test("candidate matrix types and sanitized rejection reasons are strict", () => {
  const truthy = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[1].accepted = "false";
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(
    truthy,
    "persistence_candidate_boolean_invalid:distributed_strongly_consistent_kv:accepted",
  );
  const unsafeReason = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[1].rejectionReasons = ["unsafe reason"];
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(
    unsafeReason,
    "persistence_candidate_rejection_reasons_invalid:distributed_strongly_consistent_kv",
  );
  const capabilitySpoof = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[1].atomicCreateIfAbsent = true;
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(
    capabilitySpoof,
    "persistence_candidate_capability_matrix_invalid:distributed_strongly_consistent_kv:atomicCreateIfAbsent",
  );
});

test("local filesystem candidate cannot be accepted", () => {
  const result = evaluateMutation((packet) => {
    const candidate = packet.persistenceDecision.candidates.find(
      (entry) => entry.candidateClass === "local_filesystem",
    );
    candidate.accepted = true;
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(result, "persistence_candidate_rejection_missing:local_filesystem");
});

test("Redis-like TTL or eviction risk must remain rejected", () => {
  const result = evaluateMutation((packet) => {
    const candidate = packet.persistenceDecision.candidates.find(
      (entry) => entry.candidateClass === "redis_like_ephemeral_store",
    );
    candidate.ttlOrEvictionRisk = false;
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(result, "redis_like_risk_not_rejected");
});

test("advisory-lock-only PostgreSQL design blocks", () => {
  const result = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[0].advisoryLockOnly = true;
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(result, "postgresql_candidate_capabilities_invalid");
});

test("missing unique receipt constraint blocks", () => {
  const result = evaluateMutation((packet) => {
    packet.schemaPlan.resources[0].uniqueConstraints = [];
    reseal(packet, "schemaPlan", "schema");
  });
  assertBlocked(result, "claim_schema_semantics_invalid");
});

for (const [resourceIndex, label, expected, mutations] of [
  [0, "claim", "claim_schema_semantics_invalid", [
    [], ["receipt_identity_hash", "receipt_identity_hash"],
    ["receipt_identity_hash", "state"],
    ["receipt_identity_hash", "receipt_binding_hash"],
    ["unknown_constraint", "receipt_identity_hash"],
  ]],
  [1, "lock", "repository_lock_schema_semantics_invalid", [
    [], ["repository_identity_hash", "repository_identity_hash"],
    ["repository_identity_hash", "state"],
    ["repository_identity_hash", "receipt_binding_hash"],
    ["unknown_constraint", "repository_identity_hash"],
  ]],
]) {
  test(`${label} unique constraints are the exact ordered singleton`, () => {
    for (const uniqueConstraints of mutations) {
      const result = evaluateMutation((packet) => {
        packet.schemaPlan.resources[resourceIndex].uniqueConstraints = uniqueConstraints;
        reseal(packet, "schemaPlan", "schema");
      });
      assertBlocked(result, expected);
    }
  });
}

test("missing atomic insert semantics blocks", () => {
  const result = evaluateMutation((packet) => {
    packet.transactionPlan.claimSemantics.acquireClaim = "read_then_insert";
    reseal(packet, "transactionPlan", "transaction");
  });
  assertBlocked(result, "claim_atomic_insert_semantics_missing");
});

test("missing state-version-hash conditional transition blocks", () => {
  const result = evaluateMutation((packet) => {
    packet.transactionPlan.claimSemantics.transitionClaimTerminal = "state_only_update";
    reseal(packet, "transactionPlan", "transaction");
  });
  assertBlocked(result, "claim_conditional_update_semantics_missing");
});

for (const field of ["terminalUpdateAllowed", "deleteAllowed", "resetAllowed", "reuseAllowed"]) {
  test(`claim terminal ${field} cannot be enabled`, () => {
    const result = evaluateMutation((packet) => {
      packet.schemaPlan.resources[0][field] = true;
      reseal(packet, "schemaPlan", "schema");
    });
    assertBlocked(result, `claim_schema_forbidden_behavior:${field}`);
  });
}

test("terminal claim evidence is mandatory for lock release", () => {
  const result = evaluateMutation((packet) => {
    packet.transactionPlan.lockSemantics.releaseLock = "conditional_update_without_terminal_claim";
    reseal(packet, "transactionPlan", "transaction");
  });
  assertBlocked(result, "terminal_claim_lock_release_binding_missing");
});

test("schema, transaction, credential, and runbook bindings are exact", () => {
  const result = evaluateMutation((packet) => {
    packet.migrationRunbook.credentialPlanHash = "f".repeat(64);
    reseal(packet, "migrationRunbook", "runbook");
  });
  assertBlocked(result, "migration_runbook_binding_mismatch:credentialPlanId");
});

test("runtime DELETE DROP TRUNCATE and ALTER denial is mandatory", () => {
  const result = evaluateMutation((packet) => {
    packet.credentialPlan.runtimeDeniedPrivileges = ["DROP"];
    reseal(packet, "credentialPlan", "credential");
  });
  assertBlocked(result, "runtime_destructive_privilege_denial_missing");
});

test("runtime and migration credentials must be separate", () => {
  const result = evaluateMutation((packet) => {
    packet.credentialPlan.migrationCredentialCategory =
      packet.credentialPlan.runtimeCredentialCategory;
    reseal(packet, "credentialPlan", "credential");
  });
  assertBlocked(result, "runtime_migration_credential_separation_missing");
});

test("unrelated app, auth, payment, trading, or portfolio access blocks", () => {
  const result = evaluateMutation((packet) => {
    packet.credentialPlan.runtimeUnrelatedResourceAccess = true;
    reseal(packet, "credentialPlan", "credential");
  });
  assertBlocked(result, "runtime_resource_scope_invalid");
});

test("automatic retry after ambiguous commit blocks", () => {
  const result = evaluateMutation((packet) => {
    packet.transactionPlan.ambiguousPostCommitPolicy = "automatic_retry";
    reseal(packet, "transactionPlan", "transaction");
  });
  assertBlocked(result, "ambiguous_commit_retry_policy_invalid");
});

for (const field of ["automaticRollbackAllowed", "destructiveCleanupAllowed", "dropAllowed", "truncateAllowed", "deleteAllowed", "resetAllowed", "forcedContinuationAllowed"]) {
  test(`migration ${field} cannot be enabled`, () => {
    const result = evaluateMutation((packet) => {
      packet.migrationRunbook[field] = true;
      reseal(packet, "migrationRunbook", "runbook");
    });
    assertBlocked(result, `migration_runbook_forbidden_instruction:${field}`);
  });
}

test("Step 114-2X-C protocol and exact methods cannot drift", () => {
  const result = evaluateMutation((packet) => {
    packet.transactionPlan.claimMethods = ["acquireClaim", "readClaim"];
    reseal(packet, "transactionPlan", "transaction");
  });
  assertBlocked(result, "step114_2x_c_method_or_protocol_mismatch");
});

test("Step 114-2X-C sealed protocols, capabilities, release fields, versions, and hashes are bound", () => {
  const cases = [
    ["claim protocol hash", (packet) => { packet.claimStoreProtocol.protocolHash = "f".repeat(64); }, "step114_2x_c_claim_store_protocol_hash_mismatch"],
    ["claim capability", (packet) => { packet.claimStoreProtocol.atomicCreateIfAbsent = false; }, "step114_2x_c_claim_store_protocol_capability_missing:atomicCreateIfAbsent"],
    ["release fields", (packet) => { packet.repositoryLockProtocol.releaseInputFields = ["repositoryIdentityHash"]; }, "step114_2x_c_repository_lock_protocol_release_input_fields_invalid"],
    ["method drift", (packet) => { packet.claimStoreProtocol.methods = ["acquireClaim"]; }, "step114_2x_c_claim_store_protocol_methods_invalid"],
    ["version drift", (packet) => { packet.repositoryLockProtocol.contractVersion = "invalid-version"; }, "step114_2x_c_repository_lock_protocol_version_invalid"],
  ];
  for (const [label, mutate, issue] of cases) {
    const result = evaluateMutation(mutate);
    assertBlocked(result, issue);
    assert.equal(result.blockingIssues.some((entry) => entry.includes(label)), false);
  }
  const bindingMismatch = evaluateMutation((packet) => {
    packet.transactionPlan.claimStoreProtocolHash = "e".repeat(64);
    reseal(packet, "transactionPlan", "transaction");
  });
  assertBlocked(bindingMismatch, "step114_2x_c_method_or_protocol_mismatch");
});

test("tampered contract ID and hash fail closed", () => {
  const idTamper = evaluateMutation((packet) => {
    packet.persistenceDecision.decisionId =
      `metrics-cutover-production-persistence-decision-${"a".repeat(64)}`;
  });
  assertBlocked(idTamper, "persistence_decision_id_mismatch");
  const hashTamper = evaluateMutation((packet) => {
    packet.schemaPlan.schemaPlanHash = "a".repeat(64);
  });
  assertBlocked(hashTamper, "schema_plan_hash_mismatch");
});

test("summary validator rejects identity, hash, and fixed-false tampering", () => {
  const packet = buildValidPreflightPacket();
  const summary = buildSummary(packet);
  const tamperedId = { ...summary, preflightId: `metrics-cutover-real-adapter-implementation-preflight-${"b".repeat(64)}` };
  assert.ok(validateSummary(tamperedId, packet).includes("preflight_summary_id_mismatch"));
  const tamperedHash = { ...summary, summaryHash: "c".repeat(64) };
  assert.ok(validateSummary(tamperedHash, packet).includes("preflight_summary_hash_mismatch"));
  const authority = { ...summary, executionAuthorized: true };
  assert.ok(validateSummary(authority, packet).includes("preflight_summary_fixed_false_invalid:executionAuthorized"));
});

test("public result is sanitized and contains no connection or credential material", () => {
  const serialized = JSON.stringify(
    evaluateMetricsCutoverRealAdapterImplementationPreflight(buildValidPreflightPacket()),
  );
  for (const forbidden of ["postgres://", "password", "hostname", "endpoint", "connectionString", "service_role", "receiptId", "repositoryHeadSha", "absolutePath"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("pure core imports no filesystem, process, network, provider, or database client", () => {
  const source = require("node:fs").readFileSync(
    path.join(__dirname, "lib", "metrics-cutover-real-adapter-implementation-preflight.cjs"),
    "utf8",
  );
  for (const forbidden of ["node:fs", "node:child_process", "node:net", "node:http", "node:https", "pg", "postgres", "redis", "supabase", "process.env"]) {
    assert.equal(source.includes(`require(\"${forbidden}\")`), false, forbidden);
  }
});

test("validation-only CLI ready, argument rejection, and runtime failures use fixed-false safe results", () => {
  const cli = path.join(__dirname, "check-metrics-cutover-real-adapter-implementation-preflight.cjs");
  const ready = JSON.parse(execFileSync(process.execPath, [cli], { encoding: "utf8" }));
  assert.equal(ready.status, "real_adapter_implementation_preflight_ready");
  assertAllAuthorityFalse(ready);
  const blocked = spawnSync(
    process.execPath,
    [cli, "--dsn=private-secret-value-at-C:\\private\\path"],
    { encoding: "utf8" },
  );
  assert.equal(blocked.status, 2);
  const blockedResult = JSON.parse(blocked.stdout);
  assert.equal(blockedResult.blockingIssues[0], "cli_arguments_forbidden");
  assert.deepEqual(blockedResult.preflightSummary, {});
  assertAllAuthorityFalse(blockedResult);
  assert.equal(blocked.stdout.includes("private-secret-value"), false);
  assert.equal(blocked.stdout.includes("C:\\private\\path"), false);

  const syntheticFailure = evaluateCliRequest([], {
    runCheck() {
      throw new Error("private-path-and-credential-must-not-leak");
    },
  });
  assert.equal(syntheticFailure.status, "blocked");
  assert.deepEqual(syntheticFailure.preflightSummary, {});
  assert.deepEqual(syntheticFailure.blockingIssues, ["preflight_check_failed"]);
  assertAllAuthorityFalse(syntheticFailure);
  assert.equal(JSON.stringify(syntheticFailure).includes("private-path"), false);
});
