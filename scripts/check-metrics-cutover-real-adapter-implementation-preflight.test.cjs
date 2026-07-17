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
  assertBlocked(
    evaluateMetricsCutoverRealAdapterImplementationPreflight({}),
    "preflight_packet_fields_invalid",
  );
});

test("candidate comparison contains exactly one preferred candidate", () => {
  const result = evaluateMutation((packet) => {
    packet.persistenceDecision.candidates[1].preferred = true;
    reseal(packet, "persistenceDecision", "decision");
  });
  assertBlocked(result, "persistence_preferred_candidate_count_invalid");
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

test("validation-only CLI returns ready and rejects every argument", () => {
  const cli = path.join(__dirname, "check-metrics-cutover-real-adapter-implementation-preflight.cjs");
  const ready = JSON.parse(execFileSync(process.execPath, [cli], { encoding: "utf8" }));
  assert.equal(ready.status, "real_adapter_implementation_preflight_ready");
  const blocked = spawnSync(process.execPath, [cli, "--dsn=forbidden"], { encoding: "utf8" });
  assert.equal(blocked.status, 2);
  assert.equal(JSON.parse(blocked.stdout).blockingIssues[0], "cli_arguments_forbidden");
});
