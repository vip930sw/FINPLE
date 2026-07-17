const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  DESTRUCTIVE_OPERATIONS,
  FIXED_FALSE_FIELDS,
  FUTURE_SCENARIOS,
  LOGICAL_RESOURCES,
  MIGRATION_OPERATIONS,
  QUERY_OPERATIONS,
  SPECS,
  buildPackageSummary,
  buildValidPostgresqlTestPackage,
  evaluateMetricsCutoverPostgresqlTestPackage,
  sealContract,
  validatePackageSummary,
} = require("./lib/metrics-cutover-postgresql-test-package.cjs");
const {
  evaluateCliRequest,
} = require("./check-metrics-cutover-postgresql-test-package.cjs");

function reseal(packet, key, specName) {
  packet[key] = sealContract(packet[key], SPECS[specName]);
  return packet;
}

function evaluateMutation(mutator) {
  const packet = buildValidPostgresqlTestPackage();
  mutator(packet);
  return evaluateMetricsCutoverPostgresqlTestPackage(packet);
}

function assertAuthorityFalse(value) {
  for (const field of FIXED_FALSE_FIELDS) {
    assert.equal(value[field], false, field);
  }
}

function assertBlocked(result, issue) {
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.equal(result.packageReady, false);
  assert.deepEqual(result.packageSummary, {});
  assert.ok(result.blockingIssues.includes(issue), `${issue}: ${result.blockingIssues}`);
  assertAuthorityFalse(result);
}

test("valid inert PostgreSQL package is ready without authority", () => {
  const result = evaluateMetricsCutoverPostgresqlTestPackage(
    buildValidPostgresqlTestPackage(),
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "postgresql_test_package_ready");
  assert.equal(result.packageReady, true);
  assert.equal(result.packageSummary.logicalResourceCount, 2);
  assert.equal(result.packageSummary.queryOperationCount, 6);
  assert.equal(result.packageSummary.futureScenarioCount, 15);
  assertAuthorityFalse(result);
  assertAuthorityFalse(result.packageSummary);
});

test("idle and malformed inputs suppress summaries and authority", () => {
  const idle = evaluateMetricsCutoverPostgresqlTestPackage();
  assert.equal(idle.status, "idle");
  assert.deepEqual(idle.packageSummary, {});
  assertAuthorityFalse(idle);
  assertBlocked(
    evaluateMetricsCutoverPostgresqlTestPackage({}),
    "postgresql_test_package_fields_invalid",
  );
});

test("CLI rejects arguments and runtime failures through the fixed-false result", () => {
  const argumentResult = evaluateCliRequest(["--dsn=secret-value"]);
  assertBlocked(argumentResult, "cli_arguments_forbidden");
  assert.equal(JSON.stringify(argumentResult).includes("secret-value"), false);

  const runtimeResult = evaluateCliRequest([], {
    runCheck() { throw new Error("credential path must stay private"); },
  });
  assertBlocked(runtimeResult, "postgresql_test_package_check_failed");
  assert.equal(JSON.stringify(runtimeResult).includes("credential path"), false);
});

test("CLI ready path emits a sanitized summary and exits zero", () => {
  const cli = path.join(__dirname, "check-metrics-cutover-postgresql-test-package.cjs");
  const run = spawnSync(process.execPath, [cli], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.status, "postgresql_test_package_ready");
  assertAuthorityFalse(result);
});

test("CLI forbidden argument exits two without echoing it", () => {
  const cli = path.join(__dirname, "check-metrics-cutover-postgresql-test-package.cjs");
  const run = spawnSync(process.execPath, [cli, "private-dsn-value"], { encoding: "utf8" });
  assert.equal(run.status, 2);
  assert.equal(run.stdout.includes("private-dsn-value"), false);
  assertBlocked(JSON.parse(run.stdout), "cli_arguments_forbidden");
});

test("Step 114-2X-B preparation summary is directly validated", () => {
  const result = evaluateMutation((packet) => {
    packet.upstreamArtifacts.preparationSummary.productionClaimEligible = true;
  });
  assertBlocked(
    result,
    "step114_2x_b_preparation_summary_fixed_false_invalid:productionClaimEligible",
  );
});

test("Step 114-2X-C claim protocol object and hash are required", () => {
  const result = evaluateMutation((packet) => {
    packet.upstreamArtifacts.claimStoreProtocol.methods = ["readClaim"];
  });
  assertBlocked(result, "step114_2x_c_claim_store_protocol_methods_invalid");
});

test("Step 114-2X-C lock release inputs remain exact", () => {
  const result = evaluateMutation((packet) => {
    packet.upstreamArtifacts.repositoryLockProtocol.releaseInputFields.push("unsafeExtra");
  });
  assertBlocked(
    result,
    "step114_2x_c_repository_lock_protocol_release_input_fields_invalid",
  );
});

test("Step 114-2X-D preflight summary and supporting artifacts are validated", () => {
  const summary = evaluateMutation((packet) => {
    packet.upstreamArtifacts.preflightSummary.summaryHash = "f".repeat(64);
  });
  assertBlocked(summary, "step114_2x_d_preflight_summary_hash_mismatch");

  const schema = evaluateMutation((packet) => {
    packet.upstreamArtifacts.schemaPlan.resources[0].uniqueConstraints.push("state");
  });
  assertBlocked(schema, "step114_2x_d_claim_schema_semantics_invalid");
});

test("migration contract version, ID, and hash tampering block", () => {
  const version = evaluateMutation((packet) => {
    packet.migrationSpec.contractVersion = "wrong";
  });
  assertBlocked(version, "migration_spec_contract_version_invalid");

  const id = evaluateMutation((packet) => {
    packet.migrationSpec.migrationSpecId = `metrics-cutover-postgresql-migration-spec-${"b".repeat(64)}`;
  });
  assertBlocked(id, "migration_spec_id_mismatch");

  const hash = evaluateMutation((packet) => {
    packet.migrationSpec.migrationSpecHash = "b".repeat(64);
  });
  assertBlocked(hash, "migration_spec_hash_mismatch");
});

test("migration resources and ordered operations are exact", () => {
  const resource = evaluateMutation((packet) => {
    packet.migrationSpec.logicalResources = [...LOGICAL_RESOURCES].reverse();
    reseal(packet, "migrationSpec", "migration");
  });
  assertBlocked(resource, "migration_logical_resources_invalid");

  const operation = evaluateMutation((packet) => {
    packet.migrationSpec.orderedOperations = [...MIGRATION_OPERATIONS].reverse();
    reseal(packet, "migrationSpec", "migration");
  });
  assertBlocked(operation, "migration_operation_order_invalid");
});

test("claim and lock unique constraints are exact", () => {
  const claim = evaluateMutation((packet) => {
    packet.migrationSpec.resourceDefinitions[0].uniqueConstraints.push("receipt_binding_hash");
    reseal(packet, "migrationSpec", "migration");
  });
  assertBlocked(claim, "claim_resource_uniqueConstraints_invalid");

  const lock = evaluateMutation((packet) => {
    packet.migrationSpec.resourceDefinitions[1].uniqueConstraints = ["state"];
    reseal(packet, "migrationSpec", "migration");
  });
  assertBlocked(lock, "lock_resource_uniqueConstraints_invalid");
});

test("state constraints and immutable protections are exact", () => {
  const states = evaluateMutation((packet) => {
    packet.migrationSpec.resourceDefinitions[0].states.push("claim_reset");
    reseal(packet, "migrationSpec", "migration");
  });
  assertBlocked(states, "claim_resource_states_invalid");

  const immutable = evaluateMutation((packet) => {
    packet.migrationSpec.resourceDefinitions[1].immutableFields.pop();
    reseal(packet, "migrationSpec", "migration");
  });
  assertBlocked(immutable, "lock_resource_immutableFields_invalid");
});

test("destructive, down, extension, superuser, and advisory-only flags block", () => {
  for (const field of [
    "destructiveOperationsAllowed", "downMigrationAllowed",
    "extensionInstallAllowed", "superuserOperationAllowed",
    "advisoryLockOnlyAllowed",
  ]) {
    const result = evaluateMutation((packet) => {
      packet.migrationSpec[field] = true;
      reseal(packet, "migrationSpec", "migration");
    });
    assertBlocked(result, `migration_forbidden_behavior:${field}`);
  }
  assert.deepEqual(
    buildValidPostgresqlTestPackage().migrationSpec.destructiveOperationVocabulary,
    DESTRUCTIVE_OPERATIONS,
  );
});

test("SQL previews and callable execution methods are forbidden", () => {
  const sql = evaluateMutation((packet) => {
    packet.migrationSpec.sqlPreviews = ["CREATE TABLE forbidden"];
    reseal(packet, "migrationSpec", "migration");
  });
  assertBlocked(sql, "migration_inert_boundary_invalid");

  const callable = evaluateMutation((packet) => {
    packet.querySpec.callableMethods = ["execute"];
    reseal(packet, "querySpec", "query");
  });
  assertBlocked(callable, "query_inert_boundary_invalid");
});

test("query operation set and order are exact", () => {
  const result = evaluateMutation((packet) => {
    packet.querySpec.operationOrder = [...QUERY_OPERATIONS].reverse();
    reseal(packet, "querySpec", "query");
  });
  assertBlocked(result, "query_operation_order_invalid");
});

test("query parameters and state/version/hash predicates are exact", () => {
  const params = evaluateMutation((packet) => {
    packet.querySpec.operations[0].parameters.pop();
    reseal(packet, "querySpec", "query");
  });
  assertBlocked(params, "query_operation_parameters_invalid:acquireClaim");

  const predicates = evaluateMutation((packet) => {
    packet.querySpec.operations[2].stateVersionHashPredicates = ["expected_version"];
    reseal(packet, "querySpec", "query");
  });
  assertBlocked(
    predicates,
    "query_operation_stateVersionHashPredicates_invalid:transitionClaimTerminal",
  );
});

test("lock release binds terminal evidence and immutable receipt identity", () => {
  const result = evaluateMutation((packet) => {
    const release = packet.querySpec.operations.find((entry) => entry.operation === "releaseLock");
    release.immutableBindingPredicates = ["repository_identity_hash"];
    reseal(packet, "querySpec", "query");
  });
  assertBlocked(
    result,
    "query_operation_immutableBindingPredicates_invalid:releaseLock",
  );
});

test("mutation ambiguity is manual review and retry requires proven no mutation", () => {
  const ambiguity = evaluateMutation((packet) => {
    packet.querySpec.operations[0].ambiguousOutcomePolicy = "retry";
    reseal(packet, "querySpec", "query");
  });
  assertBlocked(
    ambiguity,
    "query_operation_ambiguousOutcomePolicy_invalid:acquireClaim",
  );

  const retry = evaluateMutation((packet) => {
    packet.querySpec.operations[5].retryClassification = "automatic_retry";
    reseal(packet, "querySpec", "query");
  });
  assertBlocked(retry, "query_operation_retryClassification_invalid:releaseLock");
});

test("mutation success requires durable commit acknowledgement", () => {
  const result = evaluateMutation((packet) => {
    packet.querySpec.operations[2].durableCommitAcknowledgement = "optional";
    reseal(packet, "querySpec", "query");
  });
  assertBlocked(
    result,
    "query_operation_durableCommitAcknowledgement_invalid:transitionClaimTerminal",
  );
});

test("every query operation carries a sealed operation hash", () => {
  const result = evaluateMutation((packet) => {
    packet.querySpec.operations[4].querySpecHash = "a".repeat(64);
    reseal(packet, "querySpec", "query");
  });
  assertBlocked(result, "query_operation_hash_mismatch:readLock");
});

test("introspection is expected evidence only and denies dangerous privileges", () => {
  const catalog = evaluateMutation((packet) => {
    packet.introspectionSpec.catalogQueryExecutionAllowed = true;
    reseal(packet, "introspectionSpec", "introspection");
  });
  assertBlocked(catalog, "introspection_forbidden_state:catalogQueryExecutionAllowed");

  const privilege = evaluateMutation((packet) => {
    packet.introspectionSpec.runtimeDeniedPrivileges.pop();
    reseal(packet, "introspectionSpec", "introspection");
  });
  assertBlocked(privilege, "introspection_runtime_privileges_invalid");
});

test("introspection requires role separation, UTC, isolation, and backup capability", () => {
  for (const field of [
    "migrationRuntimeRolesDistinct", "utcTimezoneRequired",
    "backupRestoreCapabilityDeclarationRequired",
  ]) {
    const result = evaluateMutation((packet) => {
      packet.introspectionSpec[field] = false;
      reseal(packet, "introspectionSpec", "introspection");
    });
    assertBlocked(result, `introspection_required_evidence_missing:${field}`);
  }
});

test("test database gate permits only disposable isolated conformance", () => {
  const purpose = evaluateMutation((packet) => {
    packet.testDatabaseGate.testDatabasePurpose = "staging";
    reseal(packet, "testDatabaseGate", "gate");
  });
  assertBlocked(purpose, "test_database_gate_purpose_invalid");

  for (const field of ["production", "staging", "sharedDevelopment", "applicationDataStorage"] ) {
    const result = evaluateMutation((packet) => {
      packet.testDatabaseGate[field] = true;
      reseal(packet, "testDatabaseGate", "gate");
    });
    assertBlocked(result, `test_database_gate_forbidden_state:${field}`);
  }
});

test("test database credentials are future-injected, distinct, and have no fallback", () => {
  const same = evaluateMutation((packet) => {
    packet.testDatabaseGate.credentialCategoriesDistinct = false;
    reseal(packet, "testDatabaseGate", "gate");
  });
  assertBlocked(same, "test_database_gate_credential_boundary_invalid");

  const fallback = evaluateMutation((packet) => {
    packet.testDatabaseGate.credentialFallbackAllowed = true;
    reseal(packet, "testDatabaseGate", "gate");
  });
  assertBlocked(fallback, "test_database_gate_forbidden_state:credentialFallbackAllowed");
});

test("later destination/fingerprint observations and one-time approval remain required", () => {
  const observations = evaluateMutation((packet) => {
    packet.testDatabaseGate.laterObservations = ["database_fingerprint"];
    reseal(packet, "testDatabaseGate", "gate");
  });
  assertBlocked(observations, "test_database_gate_later_authorization_invalid");

  const approval = evaluateMutation((packet) => {
    packet.testDatabaseGate.laterOneTimeAuthorizationRequired = false;
    reseal(packet, "testDatabaseGate", "gate");
  });
  assertBlocked(approval, "test_database_gate_later_authorization_invalid");
});

test("all gate authority fields are fixed false", () => {
  for (const field of FIXED_FALSE_FIELDS) {
    const result = evaluateMutation((packet) => {
      packet.testDatabaseGate[field] = true;
      reseal(packet, "testDatabaseGate", "gate");
    });
    assertBlocked(result, `test_database_gate_fixed_false_invalid:${field}`);
  }
});

test("future evidence plan contains the exact 15 scenarios without execution", () => {
  const packet = buildValidPostgresqlTestPackage();
  assert.deepEqual(packet.futureEvidenceSpec.scenarioClasses, FUTURE_SCENARIOS);
  const scenario = evaluateMutation((value) => {
    value.futureEvidenceSpec.scenarioClasses.pop();
    value.futureEvidenceSpec.exactScenarioCount -= 1;
    reseal(value, "futureEvidenceSpec", "evidence");
  });
  assertBlocked(scenario, "future_evidence_scenarios_invalid");

  const executed = evaluateMutation((value) => {
    value.futureEvidenceSpec.executionOccurred = true;
    reseal(value, "futureEvidenceSpec", "evidence");
  });
  assertBlocked(executed, "future_evidence_forbidden_state:executionOccurred");
});

test("cross-contract hashes bind gate, evidence, and summary to the same package", () => {
  const gate = evaluateMutation((packet) => {
    packet.testDatabaseGate.packageBindings.querySpecHash = "e".repeat(64);
    reseal(packet, "testDatabaseGate", "gate");
  });
  assertBlocked(gate, "test_database_gate_binding_mismatch");

  const evidence = evaluateMutation((packet) => {
    packet.futureEvidenceSpec.packageBindings.migrationSpecHash = "e".repeat(64);
    reseal(packet, "futureEvidenceSpec", "evidence");
  });
  assertBlocked(evidence, "future_evidence_binding_mismatch");

  const packet = buildValidPostgresqlTestPackage();
  const summary = buildPackageSummary(packet);
  summary.querySpecHash = "e".repeat(64);
  assert.ok(
    validatePackageSummary(summary, packet).includes(
      "package_summary_binding_invalid:querySpecHash",
    ),
  );
});

test("core module has no filesystem, process, network, provider, or SQL client boundary", () => {
  const sourcePath = path.join(
    __dirname,
    "lib",
    "metrics-cutover-postgresql-test-package.cjs",
  );
  const source = fs.readFileSync(sourcePath, "utf8");
  for (const forbidden of [
    "node:fs", "node:child_process", "node:net", "node:http", "node:https",
    "require(\"pg\")", "require('pg')", "postgresql://", "supabase",
    "process.env", "process.stdin",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  const exported = require(sourcePath);
  for (const name of ["execute", "connect", "query", "migrate", "apply", "runSql"]) {
    assert.equal(typeof exported[name], "undefined", name);
  }
});
