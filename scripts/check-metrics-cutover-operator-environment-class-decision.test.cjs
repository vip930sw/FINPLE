"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const stepJ = require("./lib/metrics-cutover-operator-environment-class-decision.cjs");
const stepI = require("./lib/metrics-cutover-disposable-environment-selection.cjs");
const { evaluateCliRequest } = require("./check-metrics-cutover-operator-environment-class-decision.cjs");

const CLOCK = "2026-07-18T00:02:00.000Z";

function assertAuthorityFalse(result) {
  for (const field of stepJ.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertBlocked(result, issue) {
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.preparationSummary, {});
  if (issue) assert.ok(result.blockingIssues.includes(issue), `${issue}: ${result.blockingIssues}`);
  assertAuthorityFalse(result);
}

function resealReceipt(packet, mutate) {
  mutate(packet.receipt);
  delete packet.receipt.decisionReceiptId;
  delete packet.receipt.decisionReceiptHash;
  packet.receipt = stepJ.sealContract(packet.receipt, "receipt");
}

function resealRequest(packet, mutate) {
  mutate(packet.request);
  delete packet.request.provisioningRequestId;
  delete packet.request.provisioningRequestHash;
  packet.request = stepJ.sealContract(packet.request, "request");
}

function resealStepIContract(packet, name, mutate) {
  const contracts = packet.decisionContext.upstream.selectionPacket.contracts;
  mutate(contracts[name]);
  delete contracts[name][stepI.SPECS[name].idField];
  delete contracts[name][stepI.SPECS[name].hashField];
  contracts[name] = stepI.sealContract(contracts[name], name);
}

function receiptIssues(packet, clock = CLOCK) {
  return stepJ.validateOperatorDecisionReceipt(packet.receipt, packet.decisionContext, clock);
}

function requestIssues(packet, clock = CLOCK) {
  return stepJ.validateProvisioningRequest(
    packet.request, packet.receipt, packet.requestContext, clock,
  );
}

test("zero input awaits an explicit operator decision with every authority false", () => {
  const result = stepJ.evaluateOperatorEnvironmentClassDecision();
  assert.equal(result.ok, false);
  assert.equal(result.status, "awaiting_operator_environment_class_decision");
  assert.deepEqual(result.preparationSummary, {});
  assertAuthorityFalse(result);
});

test("valid synthetic receipt and non-authorizing request pass exact contracts", () => {
  const packet = stepJ.buildValidSyntheticPacket();
  assert.deepEqual(receiptIssues(packet), []);
  assert.deepEqual(requestIssues(packet), []);
  const result = stepJ.evaluateOperatorEnvironmentClassDecision(packet);
  assert.equal(result.ok, true);
  assert.equal(result.status, "operator_environment_class_decision_validated");
  assert.equal(result.preparationSummary.syntheticValidationOnly, true);
  assert.equal(result.preparationSummary.rawMaterialPresent, false);
  assertAuthorityFalse(result);
  for (const name of ["receipt", "request"]) {
    assert.deepEqual(Object.keys(packet[name]).sort(), [...stepJ.FIELD_SETS[name]].sort());
    assert.equal(packet[name].contractVersion, stepJ.VERSIONS[name]);
  }
});

test("public states are exact and production CLI only exposes awaiting", () => {
  assert.deepEqual(stepJ.PUBLIC_STATES, [
    "awaiting_operator_environment_class_decision",
    "operator_environment_class_decision_validated",
    "blocked",
  ]);
  const result = evaluateCliRequest([]);
  assert.equal(result.status, "awaiting_operator_environment_class_decision");
  assert.equal(result.receiptValidated, false);
  assert.equal(result.provisioningRequestPrepared, false);
});

test("Step I and transitive Step H/G contracts are directly revalidated", () => {
  const packet = stepJ.buildValidSyntheticPacket();
  assert.deepEqual(stepJ.validateUpstream(packet.decisionContext.upstream), []);
  const binding = stepJ.buildStepIBindings(packet.decisionContext.upstream);
  assert.deepEqual(binding.candidateClasses, stepI.CANDIDATE_CLASSES);
  assert.equal(binding.criteriaOrder.length, 14);
  assert.equal(binding.criterionWeights.reduce((sum, item) => sum + item.weight, 0), 100);
  assert.equal(binding.operationSequence.length, 11);
  assert.equal(binding.transitiveStepHGBindings.transitiveExecutionPlanBindings.executionSequence.length, 12);
  assert.equal(binding.transitiveStepHGBindings.transitiveExecutionPlanBindings.exactScenarioCount, 15);
});

test("missing, malformed, weakened, and resealed Step I material blocks", () => {
  const missing = stepJ.buildValidSyntheticPacket();
  delete missing.decisionContext.upstream.selectionPacket.contracts.criteria;
  assertBlocked(stepJ.evaluateOperatorEnvironmentClassDecision(missing));

  const malformed = stepJ.buildValidSyntheticPacket();
  malformed.decisionContext.upstream.selectionSummary.selectionSummaryHash = "0".repeat(64);
  assertBlocked(stepJ.evaluateOperatorEnvironmentClassDecision(malformed));

  const weakened = stepJ.buildValidSyntheticPacket();
  resealStepIContract(weakened, "runbook", (value) => { value.connectionAllowed = true; });
  assertBlocked(stepJ.evaluateOperatorEnvironmentClassDecision(weakened),
    "runbook_field_invalid:connectionAllowed");
});

test("candidate omission, addition, order, and substitution block after reseal", () => {
  for (const mutate of [
    (values) => values.pop(),
    (values) => values.push("unknown_candidate"),
    (values) => values.reverse(),
    (values) => { values[0] = "unknown_candidate"; },
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealStepIContract(packet, "matrix", (value) => mutate(value.candidateClasses));
    assertBlocked(stepJ.evaluateOperatorEnvironmentClassDecision(packet));
  }
});

test("criteria order, weights, totals, ranking, and ties cannot drift", () => {
  for (const [name, mutate] of [
    ["criteria", (value) => value.criteria.reverse()],
    ["criteria", (value) => { value.criteria[0].weight = 13; }],
    ["matrix", (value) => { value.candidateTotals[0].weightedTotal -= 1; }],
    ["matrix", (value) => value.deterministicRanking.reverse()],
    ["matrix", (value) => { value.candidateTotals[0].weightedTotal = value.candidateTotals[1].weightedTotal; }],
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealStepIContract(packet, name, mutate);
    assertBlocked(stepJ.evaluateOperatorEnvironmentClassDecision(packet));
  }
});

test("receipt Step I ID/hash pairs and future contract version are bound", () => {
  for (const field of [
    "stepISelectionSummaryId", "stepISelectionSummaryHash",
    "selectionCriteriaId", "selectionCriteriaHash", "candidateMatrixId", "candidateMatrixHash",
    "selectionDecisionPolicyId", "selectionDecisionPolicyHash",
    "provisioningRunbookId", "provisioningRunbookHash", "futureDecisionContractVersion",
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealReceipt(packet, (value) => {
      value[field] = field.endsWith("Hash") ? "9".repeat(64) : `${value[field]}-drift`;
      value.manualReviewRequired = true;
    });
    assert.ok(receiptIssues(packet).some((issue) => issue.includes("receipt_step_i_binding_mismatch")));
  }
});

test("zero, multiple, non-highest-ranked, and unknown selections block", () => {
  for (const selected of [
    [],
    [...stepI.CANDIDATE_CLASSES.slice(0, 2)],
    [stepI.CANDIDATE_CLASSES[0]],
    ["unknown_candidate"],
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealReceipt(packet, (value) => {
      value.selectedCandidateClasses = selected;
      value.manualReviewRequired = true;
    });
    assert.ok(receiptIssues(packet).includes("receipt_selected_candidate_invalid"));
  }
});

test("receipt rationale, attestation, and nonce must be SHA-256", () => {
  for (const field of [
    "selectionRationaleHash", "operatorDecisionAttestationHash", "decisionNonceHash",
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealReceipt(packet, (value) => {
      value[field] = "not-a-sha256";
      value.manualReviewRequired = true;
    });
    assert.ok(receiptIssues(packet).includes(`receipt_hash_invalid:${field}`));
  }
});

test("decision nonce replay and malformed prior contexts fail closed", () => {
  const replay = stepJ.buildValidSyntheticPacket();
  replay.decisionContext.priorDecisionNonceHashes = [replay.receipt.decisionNonceHash];
  assert.ok(receiptIssues(replay).includes("receipt_decision_nonce_replay_manual_review"));

  for (const prior of [
    "not-an-array",
    ["not-a-hash"],
    ["2".repeat(64), "1".repeat(64)],
    ["1".repeat(64), "1".repeat(64)],
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    packet.decisionContext.priorDecisionNonceHashes = prior;
    assert.notDeepEqual(receiptIssues(packet), []);
  }
});

test("canonical timestamps, inversion, lifetime, expiry, and skew fail closed", () => {
  for (const [field, value, issue, clock] of [
    ["issuedAt", "2026-07-18T00:01:00Z", "receipt_issued_at_invalid", CLOCK],
    ["expiresAt", "2026-07-18T00:00:00.000Z", "receipt_timestamp_inversion", CLOCK],
    ["expiresAt", "2026-07-18T00:20:00.000Z", "receipt_lifetime_excessive", CLOCK],
    ["expiresAt", "2026-07-18T00:02:00.000Z", "receipt_expired", CLOCK],
    ["issuedAt", "2026-07-18T00:03:00.000Z", "receipt_future_dated", CLOCK],
    ["issuedAt", "2026-07-18T00:01:00.000Z", "receipt_evaluation_clock_invalid", "bad-clock"],
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealReceipt(packet, (receipt) => {
      receipt[field] = value;
      receipt.manualReviewRequired = true;
    });
    assert.ok(receiptIssues(packet, clock).includes(issue), `${issue}: ${receiptIssues(packet, clock)}`);
  }
});

test("raw/provider/endpoint/credential/operator/path/command/SQL/price fields block", () => {
  for (const field of [
    "provider", "endpoint", "port", "databaseName", "credential", "certificate",
    "accountId", "projectId", "serviceId", "operator", "path", "screenshot",
    "command", "sql", "livePrice",
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    packet.receipt[field] = "forbidden";
    assert.ok(receiptIssues(packet).includes("receipt_fields_invalid"), field);
  }
});

test("receipt boolean boundaries and manual review consistency are enforced", () => {
  for (const [field, value] of [
    ["humanDecisionExplicit", false],
    ["syntheticValidationOnly", false],
    ["rawMaterialPresent", true],
    ["providerSpecificMaterialPresent", true],
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealReceipt(packet, (receipt) => {
      receipt[field] = value;
      receipt.manualReviewRequired = true;
    });
    assert.ok(receiptIssues(packet).includes("receipt_synthetic_or_raw_boundary_invalid"));
  }
  const unexpected = stepJ.buildValidSyntheticPacket();
  resealReceipt(unexpected, (receipt) => { receipt.manualReviewRequired = true; });
  assert.ok(receiptIssues(unexpected).includes("receipt_manual_review_unexpected"));
});

test("request binds receipt, selected class, and Step I runbook ID/hash", () => {
  for (const field of [
    "decisionReceiptId", "decisionReceiptHash", "selectedCandidateClass",
    "stepIProvisioningRunbookId", "stepIProvisioningRunbookHash",
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealRequest(packet, (request) => {
      request[field] = field.endsWith("Hash") ? "9".repeat(64) : `${request[field]}-drift`;
    });
    assert.notDeepEqual(requestIssues(packet), []);
  }
});

test("provisioning request skip, reorder, duplicate, and extension block", () => {
  for (const mutate of [
    (sequence) => sequence.pop(),
    (sequence) => sequence.reverse(),
    (sequence) => sequence.push(sequence[0]),
    (sequence) => sequence.push("extra_operation"),
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealRequest(packet, (request) => mutate(request.operationSequence));
    assert.ok(requestIssues(packet).includes("request_operation_sequence_invalid"));
  }
});

test("required and forbidden evidence category order and scope are exact", () => {
  for (const field of ["requiredEvidenceCategories", "forbiddenMaterialCategories"]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealRequest(packet, (request) => request[field].reverse());
    assert.ok(requestIssues(packet).includes("request_material_category_scope_invalid"));
  }
});

test("every provisioning and execution authority remains fixed false", () => {
  for (const field of stepJ.AUTHORITY_FALSE_FIELDS) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealRequest(packet, (request) => { request[field] = true; });
    assert.ok(requestIssues(packet).includes(`request_authority_must_be_false:${field}`), field);
  }
});

test("request non-authorizing, synthetic, external-operator-only boundary is exact", () => {
  for (const [field, value] of [
    ["externalOperatorOnly", false],
    ["syntheticValidationOnly", false],
    ["rawMaterialPresent", true],
    ["providerSpecificMaterialPresent", true],
    ["requestAuthorizesExecution", true],
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    resealRequest(packet, (request) => { request[field] = value; });
    assert.ok(requestIssues(packet).includes("request_non_authorizing_boundary_invalid"));
  }
});

test("request nonce, replay context, expiry, and receipt lifetime are enforced", () => {
  const malformed = stepJ.buildValidSyntheticPacket();
  resealRequest(malformed, (request) => { request.requestNonceHash = "bad"; });
  assert.ok(requestIssues(malformed).includes("request_nonce_hash_invalid"));

  const replay = stepJ.buildValidSyntheticPacket();
  replay.requestContext.priorRequestNonceHashes = [replay.request.requestNonceHash];
  assert.ok(requestIssues(replay).includes("request_nonce_replay_manual_review"));

  for (const prior of [
    ["2".repeat(64), "1".repeat(64)],
    ["1".repeat(64), "1".repeat(64)],
    ["bad"],
  ]) {
    const packet = stepJ.buildValidSyntheticPacket();
    packet.requestContext.priorRequestNonceHashes = prior;
    assert.notDeepEqual(requestIssues(packet), []);
  }

  const outlives = stepJ.buildValidSyntheticPacket();
  resealRequest(outlives, (request) => { request.expiresAt = "2026-07-18T00:07:00.000Z"; });
  assert.ok(requestIssues(outlives).includes("request_outlives_receipt"));
});

test("preparation summary is exact, sealed, and fixed false", () => {
  const packet = stepJ.buildValidSyntheticPacket();
  const summary = stepJ.buildPreparationSummary(
    packet.receipt, packet.request, packet.decisionContext.upstream,
  );
  assert.deepEqual(Object.keys(summary).sort(), [...stepJ.FIELD_SETS.summary].sort());
  assert.deepEqual(stepJ.validatePreparationSummary(
    summary, packet.receipt, packet.request, packet.decisionContext.upstream,
  ), []);
  assert.equal(summary.publicState, "operator_environment_class_decision_validated");
  for (const field of stepJ.FIXED_FALSE_FIELDS) assert.equal(summary[field], false, field);
});

test("idle, malformed, blocked, CLI failure, and exception results preserve false fields", () => {
  for (const result of [
    stepJ.evaluateOperatorEnvironmentClassDecision(),
    stepJ.evaluateOperatorEnvironmentClassDecision({}),
    evaluateCliRequest(["forbidden"]),
    evaluateCliRequest([], { runCheck: () => { throw new Error("synthetic"); } }),
  ]) assertAuthorityFalse(result);
});

test("CLI rejects input and emits one sanitized awaiting result", () => {
  const script = path.join(__dirname, "check-metrics-cutover-operator-environment-class-decision.cjs");
  const ok = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(ok.status, 0);
  const result = JSON.parse(ok.stdout.trim());
  assert.equal(result.status, "awaiting_operator_environment_class_decision");
  assert.equal(result.preparationSummary && Object.keys(result.preparationSummary).length, 0);

  const denied = spawnSync(process.execPath, [script, "forbidden"], { encoding: "utf8" });
  assert.equal(denied.status, 2);
  assert.equal(JSON.parse(denied.stdout.trim()).status, "blocked");
});

test("core has no ambient, filesystem, network, DB, process, provider, or deployment capability", () => {
  const source = fs.readFileSync(path.join(
    __dirname, "lib", "metrics-cutover-operator-environment-class-decision.cjs",
  ), "utf8");
  for (const forbidden of [
    "node:fs", "node:http", "node:https", "node:net", "node:tls", "node:dns",
    "child_process", "process.env", "process.stdin", "Date.now()", "new Date()",
    "require(\"pg\")", "postgresql://", "dockerode", "@supabase", "@render",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
});
