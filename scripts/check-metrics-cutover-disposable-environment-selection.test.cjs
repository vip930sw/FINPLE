"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const stepI = require("./lib/metrics-cutover-disposable-environment-selection.cjs");
const stepH = require("./lib/metrics-cutover-operator-observation-run-package.cjs");
const { evaluateCliRequest } = require("./check-metrics-cutover-disposable-environment-selection.cjs");

const EVALUATION_CLOCK = "2026-07-18T00:02:00.000Z";

function assertAuthorityFalse(result) {
  for (const field of stepI.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertBlocked(result, issue) {
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.selectionSummary, {});
  if (issue) assert.ok(result.blockingIssues.includes(issue), `${issue}: ${result.blockingIssues}`);
  assertAuthorityFalse(result);
}

function resealContract(packet, name, mutate) {
  const value = packet.contracts[name];
  mutate(value);
  delete value[stepI.SPECS[name].idField];
  delete value[stepI.SPECS[name].hashField];
  packet.contracts[name] = stepI.sealContract(value, name);
}

function resealHContract(packet, name, mutate) {
  const value = packet.upstream.operatorObservationPacket.contracts[name];
  mutate(value);
  delete value[stepH.SPECS[name].idField];
  delete value[stepH.SPECS[name].hashField];
  packet.upstream.operatorObservationPacket.contracts[name] = stepH.sealContract(value, name);
}

function buildDecisionFixture() {
  const packet = stepI.buildValidPreparationPacket();
  const selectionSummary = stepI.buildSelectionSummary(packet.upstream, packet.contracts);
  const context = {
    upstream: packet.upstream,
    contracts: packet.contracts,
    selectionSummary,
    priorDecisionNonceHashes: [],
  };
  return { packet, context, decision: stepI.buildSyntheticFutureDecisionFixture(context) };
}

function resealDecision(fixture, mutate) {
  mutate(fixture.decision);
  delete fixture.decision.futureDecisionId;
  delete fixture.decision.futureDecisionHash;
  fixture.decision = stepI.sealContract(fixture.decision, "futureDecision");
}

function assertDecisionIssue(fixture, issue, clock = EVALUATION_CLOCK) {
  const issues = stepI.validateFutureSelectionDecision(fixture.decision, fixture.context, clock);
  assert.ok(issues.includes(issue), `${issue}: ${issues}`);
}

test("valid synthetic package is prepared with every authority false", () => {
  const result = stepI.evaluateDisposableEnvironmentSelectionPackage(
    stepI.buildValidPreparationPacket(),
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "disposable_environment_selection_package_prepared");
  assert.equal(result.selectionSummary.candidateClassCount, 3);
  assert.equal(result.selectionSummary.criterionCount, 14);
  assert.equal(result.selectionSummary.runbookStepCount, 11);
  assertAuthorityFalse(result);
});

test("idle, malformed, CLI failure, and exception results remain fixed false", () => {
  for (const result of [
    stepI.evaluateDisposableEnvironmentSelectionPackage(),
    stepI.evaluateDisposableEnvironmentSelectionPackage({}),
    evaluateCliRequest(["forbidden"]),
    evaluateCliRequest([], { runCheck: () => { throw new Error("synthetic"); } }),
  ]) assertAuthorityFalse(result);
});

test("required contracts and summary have exact sealed fields and versions", () => {
  const packet = stepI.buildValidPreparationPacket();
  for (const name of ["criteria", "matrix", "runbook", "decision"]) {
    assert.deepEqual(Object.keys(packet.contracts[name]).sort(), [...stepI.FIELD_SETS[name]].sort());
    assert.equal(packet.contracts[name].contractVersion, stepI.VERSIONS[name]);
    assert.deepEqual(stepI.validateContract(
      packet.contracts[name], name, packet.upstream, packet.contracts,
    ), []);
  }
  const summary = stepI.buildSelectionSummary(packet.upstream, packet.contracts);
  assert.deepEqual(Object.keys(summary).sort(), [...stepI.FIELD_SETS.summary].sort());
  assert.deepEqual(stepI.validateSelectionSummary(summary, packet.upstream, packet.contracts), []);
});

test("complete Step H package and transitive bindings are directly revalidated", () => {
  const packet = stepI.buildValidPreparationPacket();
  assert.deepEqual(stepI.validateUpstream(packet.upstream), []);
  const binding = stepI.buildUpstreamBindings(packet.upstream);
  assert.deepEqual(binding.requestedObservationOperations, stepH.REQUESTED_OPERATION_SET);
  assert.equal(binding.transitiveExecutionPlanBindings.exactScenarioCount, 15);
  assert.equal(binding.transitiveExecutionPlanBindings.executionSequence.length, 12);
});

test("missing or malformed Step H artifacts block", () => {
  const missing = stepI.buildValidPreparationPacket();
  delete missing.upstream.operatorObservationPacket.contracts.readiness;
  assertBlocked(stepI.evaluateDisposableEnvironmentSelectionPackage(missing));

  const malformed = stepI.buildValidPreparationPacket();
  malformed.upstream.operatorObservationSummary.runPackageSummaryHash = "0".repeat(64);
  assertBlocked(stepI.evaluateDisposableEnvironmentSelectionPackage(malformed));
});

test("weakened and resealed Step H contracts still block", () => {
  const packet = stepI.buildValidPreparationPacket();
  resealHContract(packet, "credential", (value) => { value.runtimeSuperuserAllowed = true; });
  assertBlocked(stepI.evaluateDisposableEnvironmentSelectionPackage(packet));
});

test("candidate classes are exact, provider-neutral, ordered, and complete", () => {
  const packet = stepI.buildValidPreparationPacket();
  assert.deepEqual(packet.contracts.matrix.candidateClasses, stepI.CANDIDATE_CLASSES);
  assert.equal(packet.contracts.matrix.candidateScores.length, 3);
  assert.equal(packet.contracts.matrix.liveResearchPerformed, false);
  assert.equal(packet.contracts.matrix.livePricingLookupPerformed, false);
  assert.equal(packet.contracts.matrix.providerSpecificClaimsPresent, false);
});

test("candidate omission, addition, and order drift block after reseal", () => {
  for (const mutate of [
    (values) => values.pop(),
    (values) => values.push("extra_candidate"),
    (values) => values.reverse(),
  ]) {
    const packet = stepI.buildValidPreparationPacket();
    resealContract(packet, "matrix", (value) => mutate(value.candidateClasses));
    assertBlocked(stepI.evaluateDisposableEnvironmentSelectionPackage(packet),
      "matrix_field_invalid:candidateClasses");
  }
});

test("criteria order, weights, and score bounds are exact", () => {
  const packet = stepI.buildValidPreparationPacket();
  const criteria = packet.contracts.criteria;
  assert.equal(criteria.criteria.length, 14);
  assert.equal(criteria.criteria.reduce((sum, value) => sum + value.weight, 0), 100);
  assert.ok(criteria.criteria.every((value) =>
    value.minimumScore === 0 && value.maximumScore === 5 && Number.isInteger(value.weight)));
});

test("criteria omission, order, weight, and score-range drift block", () => {
  for (const mutate of [
    (criteria) => criteria.pop(),
    (criteria) => criteria.reverse(),
    (criteria) => { criteria[0].weight = 13; },
    (criteria) => { criteria[0].maximumScore = 6; },
  ]) {
    const packet = stepI.buildValidPreparationPacket();
    resealContract(packet, "criteria", (value) => mutate(value.criteria));
    assertBlocked(stepI.evaluateDisposableEnvironmentSelectionPackage(packet));
  }
});

test("candidate weighted totals and ranking are deterministic and tie-free", () => {
  const packet = stepI.buildValidPreparationPacket();
  const matrix = packet.contracts.matrix;
  assert.deepEqual(matrix.candidateTotals, stepI.referenceCandidateTotals());
  assert.deepEqual(matrix.deterministicRanking, stepI.referenceRanking());
  assert.equal(new Set(matrix.candidateTotals.map((value) => value.weightedTotal)).size, 3);
  for (const candidate of matrix.candidateScores) {
    assert.ok(candidate.scores.every(({ score }) => Number.isInteger(score) && score >= 0 && score <= 5));
  }
});

test("score, total, ranking, and tie-policy tampering blocks", () => {
  for (const mutate of [
    (value) => { value.candidateScores[0].scores[0].score = 6; },
    (value) => { value.candidateTotals[0].weightedTotal += 1; },
    (value) => { value.deterministicRanking.reverse(); },
    (value) => { value.tiePolicy = "allow"; },
  ]) {
    const packet = stepI.buildValidPreparationPacket();
    resealContract(packet, "matrix", mutate);
    assertBlocked(stepI.evaluateDisposableEnvironmentSelectionPackage(packet));
  }
});

test("decision policy requires one highest-ranked future selection without recording one", () => {
  const policy = stepI.buildValidPreparationPacket().contracts.decision;
  assert.equal(policy.exactSelectedCandidateCount, 1);
  assert.equal(policy.highestRankedCandidateRequired, true);
  assert.equal(policy.unresolvedTieAllowed, false);
  assert.equal(policy.decisionRecorded, false);
  assert.equal(policy.humanSelectionRecorded, false);
  assert.equal(policy.realEnvironmentClassSelected, false);
});

test("runbook has the exact provider-neutral future sequence", () => {
  const runbook = stepI.buildValidPreparationPacket().contracts.runbook;
  assert.deepEqual(runbook.operationSequence, stepI.RUNBOOK_SEQUENCE);
  assert.deepEqual(runbook.forbiddenMaterialCategories, stepI.FORBIDDEN_MATERIAL_CATEGORIES);
  assert.equal(runbook.externalOperatorOnly, true);
  for (const field of [
    "automaticProvisioningAllowed", "automaticSelectionAllowed", "automaticCleanupAllowed",
    "automaticRetryAllowed", "automaticDisposalAllowed", "applicationCredentialReuseAllowed",
    "migrationCredentialReuseForObservationAllowed", "liveObservationAllowed", "connectionAllowed",
    "runbookActivated",
  ]) assert.equal(runbook[field], false, field);
});

test("runbook step skip, reorder, duplicate, and extension block", () => {
  for (const mutate of [
    (steps) => steps.splice(3, 1),
    (steps) => steps.reverse(),
    (steps) => steps.splice(2, 0, steps[2]),
    (steps) => steps.push("unexpected_operation"),
  ]) {
    const packet = stepI.buildValidPreparationPacket();
    resealContract(packet, "runbook", (value) => mutate(value.operationSequence));
    assertBlocked(stepI.evaluateDisposableEnvironmentSelectionPackage(packet),
      "runbook_field_invalid:operationSequence");
  }
});

test("runbook automation, connection, credential reuse, or observation weakening blocks", () => {
  for (const field of [
    "automaticProvisioningAllowed", "automaticSelectionAllowed", "automaticCleanupAllowed",
    "automaticRetryAllowed", "automaticDisposalAllowed", "applicationCredentialReuseAllowed",
    "migrationCredentialReuseForObservationAllowed", "liveObservationAllowed", "connectionAllowed",
    "runbookActivated",
  ]) {
    const packet = stepI.buildValidPreparationPacket();
    resealContract(packet, "runbook", (value) => { value[field] = true; });
    assertBlocked(stepI.evaluateDisposableEnvironmentSelectionPackage(packet));
  }
});

test("pure validator accepts only the complete synthetic future decision", () => {
  const fixture = buildDecisionFixture();
  assert.deepEqual(stepI.validateFutureSelectionDecision(
    fixture.decision, fixture.context, EVALUATION_CLOCK,
  ), []);
  assert.equal(fixture.decision.selectedCandidateClasses.length, 1);
  assert.equal(fixture.decision.realSelectionRecorded, false);
});

test("future decision exact fields, version, ID, and hash are enforced", () => {
  const fixture = buildDecisionFixture();
  delete fixture.decision.selectionRationaleHash;
  assertDecisionIssue(fixture, "futureDecision_fields_invalid");

  const extra = buildDecisionFixture();
  extra.decision.unexpected = true;
  assertDecisionIssue(extra, "futureDecision_fields_invalid");

  const version = buildDecisionFixture();
  version.decision.contractVersion = "wrong";
  assertDecisionIssue(version, "futureDecision_contract_version_invalid");
});

test("future decision summary and contract bindings cannot drift", () => {
  for (const [field, issue] of [
    ["selectionSummaryHash", "future_decision_summary_binding_mismatch:selectionSummaryHash"],
    ["selectionCriteriaHash", "future_decision_contract_binding_mismatch:selectionCriteriaId"],
    ["candidateMatrixHash", "future_decision_contract_binding_mismatch:candidateMatrixId"],
    ["provisioningRunbookHash", "future_decision_contract_binding_mismatch:provisioningRunbookId"],
  ]) {
    const fixture = buildDecisionFixture();
    resealDecision(fixture, (value) => { value[field] = "0".repeat(64); });
    assertDecisionIssue(fixture, issue);
  }
});

test("future decision requires exactly one highest-ranked synthetic class", () => {
  for (const mutate of [
    (value) => { value.selectedCandidateClasses = []; },
    (value) => { value.selectedCandidateClasses.push(value.deterministicRanking[1]); },
    (value) => { value.selectedCandidateClasses = [value.deterministicRanking[1]]; },
  ]) {
    const fixture = buildDecisionFixture();
    resealDecision(fixture, mutate);
    assertDecisionIssue(fixture, "future_decision_selection_invalid");
  }
});

test("future decision criteria, totals, ranking, and ties cannot drift", () => {
  for (const [mutate, issue] of [
    [(value) => value.criteriaOrder.reverse(), "future_decision_matrix_scope_invalid"],
    [(value) => { value.criterionWeights[0].weight += 1; }, "future_decision_matrix_scope_invalid"],
    [(value) => { value.candidateTotals[0].weightedTotal += 1; }, "future_decision_total_or_ranking_invalid"],
    [(value) => value.deterministicRanking.reverse(), "future_decision_total_or_ranking_invalid"],
    [(value) => { value.unresolvedTie = true; }, "future_decision_unresolved_tie_manual_review"],
  ]) {
    const fixture = buildDecisionFixture();
    resealDecision(fixture, mutate);
    assertDecisionIssue(fixture, issue);
  }
});

test("rationale, operator attestation, and nonce hashes must be SHA-256", () => {
  for (const field of [
    "selectionRationaleHash", "operatorDecisionAttestationHash", "decisionNonceHash",
  ]) {
    const fixture = buildDecisionFixture();
    resealDecision(fixture, (value) => { value[field] = "invalid"; });
    assertDecisionIssue(fixture, `future_decision_hash_invalid:${field}`);
  }
});

test("decision nonce replay and malformed prior contexts fail closed", () => {
  const replay = buildDecisionFixture();
  replay.context.priorDecisionNonceHashes = [replay.decision.decisionNonceHash];
  assertDecisionIssue(replay, "future_decision_nonce_replay_manual_review");

  for (const values of [
    "not-array", ["bad"], ["2".repeat(64), "2".repeat(64)],
    ["2".repeat(64), "1".repeat(64)],
  ]) {
    const fixture = buildDecisionFixture();
    fixture.context.priorDecisionNonceHashes = values;
    const issues = stepI.validateFutureSelectionDecision(
      fixture.decision, fixture.context, EVALUATION_CLOCK,
    );
    assert.ok(issues.some((issue) => issue.startsWith("prior_decision_nonce_hashes_")), issues);
  }
});

test("canonical timestamps, lifetime, expiry, and clock skew are enforced", () => {
  for (const [mutate, clock, issue] of [
    [(value) => { value.issuedAt = "2026-07-18T00:01:00Z"; }, EVALUATION_CLOCK,
      "future_decision_issued_at_invalid"],
    [(value) => { value.expiresAt = "2026-07-18T00:00:00.000Z"; }, EVALUATION_CLOCK,
      "future_decision_timestamp_inversion"],
    [(value) => { value.expiresAt = "2026-07-18T00:20:00.000Z"; }, EVALUATION_CLOCK,
      "future_decision_lifetime_excessive"],
    [(value) => { value.issuedAt = "2026-07-18T00:03:00.000Z"; }, EVALUATION_CLOCK,
      "future_decision_future_dated"],
    [() => {}, "2026-07-18T00:07:00.000Z", "future_decision_expired"],
  ]) {
    const fixture = buildDecisionFixture();
    resealDecision(fixture, mutate);
    assertDecisionIssue(fixture, issue, clock);
  }
});

test("raw or real-selection implications are rejected", () => {
  for (const [field, value] of [
    ["rawMaterialPresent", true], ["realSelectionRecorded", true],
    ["syntheticFutureValidationOnly", false],
  ]) {
    const fixture = buildDecisionFixture();
    resealDecision(fixture, (decision) => { decision[field] = value; });
    assertDecisionIssue(fixture, "future_decision_real_or_raw_material_boundary_invalid");
  }
});

test("provider, endpoint, credential, certificate, operator, path, SQL, or project fields block", () => {
  for (const field of [
    "providerName", "endpoint", "credential", "certificate", "operatorIdentity",
    "filesystemPath", "sql", "projectId",
  ]) {
    const fixture = buildDecisionFixture();
    fixture.decision[field] = "forbidden";
    assertDecisionIssue(fixture, "futureDecision_fields_invalid");
  }
});

test("manual review is false only for a completely valid decision", () => {
  const valid = buildDecisionFixture();
  assert.equal(valid.decision.manualReviewRequired, false);
  const invalid = buildDecisionFixture();
  resealDecision(invalid, (value) => { value.rawMaterialPresent = true; });
  assertDecisionIssue(invalid, "future_decision_manual_review_required");
  const unexpected = buildDecisionFixture();
  resealDecision(unexpected, (value) => { value.manualReviewRequired = true; });
  assertDecisionIssue(unexpected, "future_decision_manual_review_unexpected");
});

test("malformed decision contexts return blocking issues without throwing", () => {
  const fixture = buildDecisionFixture();
  assert.doesNotThrow(() => stepI.validateFutureSelectionDecision(
    fixture.decision, null, EVALUATION_CLOCK,
  ));
  assert.ok(stepI.validateFutureSelectionDecision(
    fixture.decision, {}, EVALUATION_CLOCK,
  ).includes("decision_context_fields_invalid"));
});

test("summary binds every contract and never claims a real action", () => {
  const packet = stepI.buildValidPreparationPacket();
  const summary = stepI.buildSelectionSummary(packet.upstream, packet.contracts);
  for (const field of stepI.FIXED_FALSE_FIELDS) assert.equal(summary[field], false, field);
  assert.equal(summary.selectionCriteriaId, packet.contracts.criteria.selectionCriteriaId);
  assert.equal(summary.candidateMatrixId, packet.contracts.matrix.candidateMatrixId);
  assert.equal(summary.selectionDecisionPolicyId, packet.contracts.decision.selectionDecisionPolicyId);
  assert.equal(summary.provisioningRunbookId, packet.contracts.runbook.provisioningRunbookId);
});

test("summary authority tampering blocks even after reseal", () => {
  const packet = stepI.buildValidPreparationPacket();
  const summary = stepI.buildSelectionSummary(packet.upstream, packet.contracts);
  summary.realEnvironmentProvisioned = true;
  delete summary.selectionSummaryId;
  delete summary.selectionSummaryHash;
  const resealed = stepI.sealContract(summary, "summary");
  assert.ok(stepI.validateSelectionSummary(
    resealed, packet.upstream, packet.contracts,
  ).includes("selection_summary_field_invalid:realEnvironmentProvisioned"));
});

test("CLI emits one sanitized prepared line and rejects arguments", () => {
  const script = path.join(__dirname, "check-metrics-cutover-disposable-environment-selection.cjs");
  const success = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(success.status, 0, success.stderr);
  assert.equal(success.stdout.trim().split(/\r?\n/u).length, 1);
  const parsed = JSON.parse(success.stdout);
  assert.equal(parsed.status, "disposable_environment_selection_package_prepared");
  assertAuthorityFalse(parsed);
  const blocked = spawnSync(process.execPath, [script, "forbidden"], { encoding: "utf8" });
  assert.equal(blocked.status, 2);
  assertBlocked(JSON.parse(blocked.stdout), "cli_arguments_forbidden");
});

test("core and CLI have no ambient, filesystem, external, DB, container, or execution capability", () => {
  const sources = [
    "lib/metrics-cutover-disposable-environment-selection.cjs",
    "check-metrics-cutover-disposable-environment-selection.cjs",
  ].map((file) => fs.readFileSync(path.join(__dirname, file), "utf8"));
  const forbidden = [
    /require\(["']node:fs["']\)/u, /require\(["']node:(?:net|tls|dns|http|https)["']\)/u,
    /require\(["']node:child_process["']\)/u, /require\(["'](?:pg|postgres)["']\)/u,
    /process\.env/u, /process\.stdin/u, /fetch\s*\(/u, /Date\.now\s*\(/u,
    /new Date\s*\(\s*\)/u, /spawn\s*\(/u, /exec\s*\(/u,
  ];
  for (const source of sources) {
    for (const pattern of forbidden) assert.doesNotMatch(source, pattern);
  }
});
