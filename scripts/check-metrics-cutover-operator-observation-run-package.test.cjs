"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const stepH = require("./lib/metrics-cutover-operator-observation-run-package.cjs");
const stepG = require("./lib/metrics-cutover-disposable-test-database-execution-plan.cjs");
const { evaluateCliRequest } = require("./check-metrics-cutover-operator-observation-run-package.cjs");

const ISSUED_AT = "2026-07-18T00:01:00.000Z";
const EVALUATION_CLOCK = "2026-07-18T00:02:00.000Z";
const EXPIRES_AT = "2026-07-18T00:06:00.000Z";
const WINDOW_STARTS_AT = "2026-07-18T00:01:00.000Z";
const WINDOW_EXPIRES_AT = "2026-07-18T00:10:00.000Z";

function assertAuthorityFalse(result) {
  for (const field of stepH.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertBlocked(result, issue) {
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.runPackageSummary, {});
  assert.ok(result.blockingIssues.includes(issue), `${issue}: ${result.blockingIssues}`);
  assertAuthorityFalse(result);
}

function resealStepHContract(packet, name) {
  const value = packet.contracts[name];
  delete value[stepH.SPECS[name].idField];
  delete value[stepH.SPECS[name].hashField];
  packet.contracts[name] = stepH.sealContract(value, name);
}

function resealStepGContract(packet, name) {
  const value = packet.upstream.executionPlanPacket.contracts[name];
  delete value[stepG.SPECS[name].idField];
  delete value[stepG.SPECS[name].hashField];
  packet.upstream.executionPlanPacket.contracts[name] = stepG.sealContract(value, name);
}

function buildRequestFixture() {
  const packet = stepH.buildValidPreparationPacket();
  const summary = stepH.buildRunPackageSummary(packet.upstream, packet.contracts);
  const bindings = stepH.buildUpstreamBindings(packet.upstream);
  const contracts = packet.contracts;
  const request = stepH.sealContract({
    contractVersion: stepH.VERSIONS.request,
    runPackageSummaryId: summary.runPackageSummaryId,
    runPackageSummaryHash: summary.runPackageSummaryHash,
    readinessChecklistId: contracts.readiness.readinessChecklistId,
    readinessChecklistHash: contracts.readiness.readinessChecklistHash,
    sanitizedEnvironmentIntakeSchemaId:
      contracts.intake.sanitizedEnvironmentIntakeSchemaId,
    sanitizedEnvironmentIntakeSchemaHash:
      contracts.intake.sanitizedEnvironmentIntakeSchemaHash,
    approvalRequestPolicyId: contracts.approval.approvalRequestPolicyId,
    approvalRequestPolicyHash: contracts.approval.approvalRequestPolicyHash,
    credentialProvisioningBoundaryId:
      contracts.credential.credentialProvisioningBoundaryId,
    credentialProvisioningBoundaryHash:
      contracts.credential.credentialProvisioningBoundaryHash,
    disposalResponsibilityPolicyId: contracts.disposal.disposalResponsibilityPolicyId,
    disposalResponsibilityPolicyHash: contracts.disposal.disposalResponsibilityPolicyHash,
    executionPreflightSummaryId: bindings.executionPreflightSummaryId,
    executionPreflightSummaryHash: bindings.executionPreflightSummaryHash,
    targetSelectionPolicyId: bindings.targetSelectionPolicyId,
    targetSelectionPolicyHash: bindings.targetSelectionPolicyHash,
    sequencePolicyId: bindings.sequencePolicyId,
    sequencePolicyHash: bindings.sequencePolicyHash,
    rollbackPolicyId: bindings.rollbackPolicyId,
    rollbackPolicyHash: bindings.rollbackPolicyHash,
    evidenceCollectionPlanId: bindings.evidenceCollectionPlanId,
    evidenceCollectionPlanHash: bindings.evidenceCollectionPlanHash,
    targetPurposeClassification: "disposable_isolated_conformance_only",
    namespaceCategory: "new_empty_disposable_namespace",
    destinationCount: 1,
    environmentBindingHash: "1".repeat(64),
    namespaceEvidenceHash: "2".repeat(64),
    destinationAllowlistHash: "3".repeat(64),
    databaseFingerprintHash: "4".repeat(64),
    certificateFingerprintHash: "5".repeat(64),
    observerAttestationHash: "6".repeat(64),
    migrationCredentialCategoryAttestationHash: "7".repeat(64),
    runtimeCredentialCategoryAttestationHash: "8".repeat(64),
    credentialExpiryAttestationHash: "9".repeat(64),
    credentialRotationAttestationHash: "a".repeat(64),
    credentialRevocationAttestationHash: "b".repeat(64),
    credentialDestructionAttestationHash: "c".repeat(64),
    disposalResponsibilityAttestationHash: "d".repeat(64),
    disposalDeadlineCategory: "within_operator_approved_window",
    observationWindowStartsAt: WINDOW_STARTS_AT,
    observationWindowExpiresAt: WINDOW_EXPIRES_AT,
    manualReviewRequired: false,
    rawMaterialPresent: false,
    requestedOperationSet: [...stepH.REQUESTED_OPERATION_SET],
    maximumObservationCount: 1,
    runtimeDeniedPrivileges: [...stepH.RUNTIME_DENIED_PRIVILEGES],
    categoriesDistinct: true,
    migrationCredentialUsedForObservation: false,
    sanitizedApproverIdentityHash: "e".repeat(64),
    requestNonceHash: "f".repeat(64),
    issuedAt: ISSUED_AT,
    expiresAt: EXPIRES_AT,
    approvalRequested: false,
    approvalGranted: false,
  }, "request");
  const context = {
    upstream: packet.upstream,
    contracts,
    runPackageSummary: summary,
    priorRequestNonceHashes: [],
  };
  return { packet, request, context };
}

function resealRequest(fixture, mutate) {
  const value = { ...fixture.request };
  delete value.approvalRequestId;
  delete value.approvalRequestHash;
  mutate(value, fixture.context, fixture);
  fixture.request = stepH.sealContract(value, "request");
  return stepH.validateLiveObservationApprovalRequest(
    fixture.request, fixture.context, EVALUATION_CLOCK,
  );
}

test("valid synthetic package is prepared with every authority false", () => {
  const result = stepH.evaluateOperatorObservationRunPackage(
    stepH.buildValidPreparationPacket(),
  );
  assert.equal(result.ok, true);
  assert.equal(result.status, "operator_observation_run_package_prepared");
  assert.equal(result.packagePrepared, true);
  assert.equal(result.runPackageSummary.packagePrepared, true);
  assert.equal(result.runPackageSummary.operatorDecisionsRecorded, false);
  assert.equal(result.runPackageSummary.intakeCollected, false);
  assert.equal(result.runPackageSummary.approvalRequestGenerated, false);
  assert.deepEqual(result.blockingIssues, []);
  assertAuthorityFalse(result);
});

test("idle, malformed, CLI failure, and exception results remain fixed false", () => {
  const idle = stepH.evaluateOperatorObservationRunPackage();
  assert.equal(idle.status, "idle");
  assertAuthorityFalse(idle);
  assertBlocked(
    stepH.evaluateOperatorObservationRunPackage({ upstream: {}, contracts: {}, extra: true }),
    "operator_observation_packet_fields_invalid",
  );
  assertBlocked(evaluateCliRequest(["--material", "forbidden"]), "cli_arguments_forbidden");
  assertBlocked(evaluateCliRequest([], { runCheck() { throw new Error("synthetic"); } }),
    "operator_observation_run_package_check_failed");
});

test("all required contracts and summary use exact sealed fields", () => {
  const packet = stepH.buildValidPreparationPacket();
  for (const name of ["readiness", "intake", "credential", "disposal", "approval"]) {
    assert.deepEqual(
      stepH.validateContract(packet.contracts[name], name, packet.upstream, packet.contracts),
      [], name,
    );
    assert.deepEqual(Object.keys(packet.contracts[name]).sort(),
      [...stepH.FIELD_SETS[name]].sort());
  }
  const summary = stepH.buildRunPackageSummary(packet.upstream, packet.contracts);
  assert.deepEqual(stepH.validateRunPackageSummary(summary, packet.upstream, packet.contracts), []);
  assert.deepEqual(Object.keys(summary).sort(), [...stepH.FIELD_SETS.summary].sort());
});

test("complete Step G package and transitive bindings are directly revalidated", () => {
  const packet = stepH.buildValidPreparationPacket();
  packet.upstream.executionPlanPacket.contracts.targetSelection.productionAllowed = true;
  resealStepGContract(packet, "targetSelection");
  assertBlocked(
    stepH.evaluateOperatorObservationRunPackage(packet),
    "targetSelection_field_invalid:productionAllowed",
  );
});

test("missing or tampered Step G summary and contracts block", () => {
  const missing = stepH.buildValidPreparationPacket();
  delete missing.upstream.executionPlanPacket.contracts.sequence;
  assertBlocked(stepH.evaluateOperatorObservationRunPackage(missing),
    "step_g_execution_plan_packet_fields_invalid");

  const tampered = stepH.buildValidPreparationPacket();
  tampered.upstream.executionPreflightSummary.executionPreflightSummaryHash = "0".repeat(64);
  const result = stepH.evaluateOperatorObservationRunPackage(tampered);
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.some((issue) => issue.includes("summary")));
  assertAuthorityFalse(result);
});

test("readiness checklist is outside source control and never records a target", () => {
  const checklist = stepH.buildValidPreparationPacket().contracts.readiness;
  assert.deepEqual(checklist.requiredDecisionItems, stepH.REQUIRED_DECISION_ITEMS);
  assert.equal(checklist.operatorConfirmationRequired, true);
  assert.equal(checklist.decisionsMustRemainOutsideSourceControl, true);
  assert.equal(checklist.separateApprovalRequired, true);
  assert.equal(checklist.operatorDecisionsRecorded, false);
  assert.equal(checklist.targetCreated, false);
  assert.equal(checklist.targetSelected, false);
  assert.equal(checklist.observationStarted, false);
});

test("readiness target, decision, or approval weakening blocks after reseal", () => {
  for (const [field, value] of [
    ["operatorConfirmationRequired", false],
    ["decisionsMustRemainOutsideSourceControl", false],
    ["separateApprovalRequired", false],
    ["operatorDecisionsRecorded", true], ["targetCreated", true],
    ["targetSelected", true], ["observationStarted", true],
  ]) {
    const packet = stepH.buildValidPreparationPacket();
    packet.contracts.readiness[field] = value;
    resealStepHContract(packet, "readiness");
    assertBlocked(stepH.evaluateOperatorObservationRunPackage(packet),
      `readiness_field_invalid:${field}`);
  }
});

test("sanitized intake schema is abstract and uncollected", () => {
  const intake = stepH.buildValidPreparationPacket().contracts.intake;
  assert.deepEqual(intake.allowedFields, stepH.INTAKE_ALLOWED_FIELDS);
  assert.equal(intake.exactDestinationCount, 1);
  assert.equal(intake.rawMaterialAllowed, false);
  assert.equal(intake.intakeCollected, false);
  assert.deepEqual(intake.allowedTargetPurposeClassifications,
    ["disposable_isolated_conformance_only"]);
});

test("intake destination, classification, namespace, or raw boundary weakening blocks", () => {
  for (const [field, value] of [
    ["exactDestinationCount", 2], ["rawMaterialAllowed", true],
    ["intakeCollected", true],
    ["allowedTargetPurposeClassifications", ["shared"]],
    ["allowedNamespaceCategories", ["existing"]],
    ["credentialAttestationCategories", ["future_runtime"]],
  ]) {
    const packet = stepH.buildValidPreparationPacket();
    packet.contracts.intake[field] = value;
    resealStepHContract(packet, "intake");
    assertBlocked(stepH.evaluateOperatorObservationRunPackage(packet),
      `intake_field_invalid:${field}`);
  }
});

test("credential categories are distinct, external, least-privilege, and unprovisioned", () => {
  const credential = stepH.buildValidPreparationPacket().contracts.credential;
  assert.deepEqual(credential.credentialCategories, ["future_migration", "future_runtime"]);
  assert.deepEqual(credential.runtimeDeniedPrivileges, stepH.RUNTIME_DENIED_PRIVILEGES);
  assert.equal(credential.categoriesDistinct, true);
  assert.equal(credential.externalInjectionOnly, true);
  assert.equal(credential.credentialProvisioned, false);
  assert.equal(credential.credentialInjected, false);
});

test("credential category, privilege, lifecycle, and injection weakening blocks", () => {
  for (const [field, value] of [
    ["categoriesDistinct", false], ["externalInjectionOnly", false],
    ["applicationCredentialReuseAllowed", true],
    ["migrationCredentialReuseForObservationAllowed", true],
    ["runtimeDeniedPrivileges", stepH.RUNTIME_DENIED_PRIVILEGES.slice(1)],
    ["runtimeSchemaOwnerAllowed", true], ["runtimeSuperuserAllowed", true],
    ["leastPrivilegeRequired", false], ["expiryAttestationRequired", false],
    ["rotationAttestationRequired", false], ["revocationAttestationRequired", false],
    ["postRunDestructionAttestationRequired", false],
    ["credentialProvisioned", true], ["credentialInjected", true],
  ]) {
    const packet = stepH.buildValidPreparationPacket();
    packet.contracts.credential[field] = value;
    resealStepHContract(packet, "credential");
    assertBlocked(stepH.evaluateOperatorObservationRunPackage(packet),
      `credential_field_invalid:${field}`);
  }
});

test("disposal policy preserves rollback-unavailable and responsibility boundaries", () => {
  const disposal = stepH.buildValidPreparationPacket().contracts.disposal;
  assert.equal(disposal.safeReversiblePackageAvailable, false);
  assert.equal(disposal.environmentDisposalRequired, true);
  assert.equal(disposal.disposalAfterCredentialRevocationRequired, true);
  assert.equal(disposal.disposalAfterEvidenceFinalizationRequired, true);
  assert.equal(disposal.responsibilityAttestationHashRequired, true);
  assert.equal(disposal.environmentDisposalAuthorized, false);
  assert.equal(disposal.environmentDisposalExecuted, false);
});

test("disposal responsibility or destructive-cleanup weakening blocks", () => {
  for (const [field, value] of [
    ["safeReversiblePackageAvailable", true], ["environmentDisposalRequired", false],
    ["disposalAfterCredentialRevocationRequired", false],
    ["disposalAfterEvidenceFinalizationRequired", false],
    ["responsibilityAttestationHashRequired", false],
    ["disposalDeadlineCategoryRequired", false],
    ["destructiveSharedCleanupAllowed", true],
    ["applicationSystemCleanupAllowed", true], ["unrelatedSystemCleanupAllowed", true],
    ["environmentDisposalAuthorized", true], ["environmentDisposalExecuted", true],
  ]) {
    const packet = stepH.buildValidPreparationPacket();
    packet.contracts.disposal[field] = value;
    resealStepHContract(packet, "disposal");
    assertBlocked(stepH.evaluateOperatorObservationRunPackage(packet),
      `disposal_field_invalid:${field}`);
  }
});

test("approval policy has exact three-operation, single-observation, no-authority scope", () => {
  const approval = stepH.buildValidPreparationPacket().contracts.approval;
  assert.deepEqual(approval.requestedOperationSet, stepH.REQUESTED_OPERATION_SET);
  assert.equal(approval.maximumObservationCount, 1);
  for (const field of [
    "connectionAuthorityAllowed", "sqlAuthorityAllowed", "migrationAuthorityAllowed",
    "scenarioAuthorityAllowed", "claimAuthorityAllowed", "receiptAuthorityAllowed",
    "rollbackAuthorityAllowed", "disposalAuthorityAllowed", "approvalRequested",
    "approvalGranted",
  ]) assert.equal(approval[field], false, field);
});

test("approval operation order, count, scope, or binding drift blocks", () => {
  for (const [field, value] of [
    ["requestedOperationSet", [...stepH.REQUESTED_OPERATION_SET].reverse()],
    ["maximumObservationCount", 2], ["connectionAuthorityAllowed", true],
    ["sqlAuthorityAllowed", true], ["migrationAuthorityAllowed", true],
    ["scenarioAuthorityAllowed", true], ["claimAuthorityAllowed", true],
    ["receiptAuthorityAllowed", true], ["rollbackAuthorityAllowed", true],
    ["disposalAuthorityAllowed", true], ["approvalRequested", true],
    ["approvalGranted", true], ["readinessChecklistHash", "0".repeat(64)],
  ]) {
    const packet = stepH.buildValidPreparationPacket();
    packet.contracts.approval[field] = value;
    resealStepHContract(packet, "approval");
    assertBlocked(stepH.evaluateOperatorObservationRunPackage(packet),
      `approval_field_invalid:${field}`);
  }
});

test("summary binds every contract and never claims an external action", () => {
  const packet = stepH.buildValidPreparationPacket();
  const summary = stepH.buildRunPackageSummary(packet.upstream, packet.contracts);
  assert.equal(summary.requestedOperationCount, 3);
  assert.equal(summary.packagePrepared, true);
  assert.equal(summary.operatorDecisionsRecorded, false);
  assert.equal(summary.intakeCollected, false);
  assert.equal(summary.approvalRequestGenerated, false);
  assert.equal(summary.credentialProvisioned, false);
  assert.equal(summary.credentialInjected, false);
  for (const field of stepH.FIXED_FALSE_FIELDS) assert.equal(summary[field], false, field);
});

test("pure go/no-go validator accepts only the complete synthetic request", () => {
  const { request, context } = buildRequestFixture();
  assert.deepEqual(stepH.validateLiveObservationApprovalRequest(
    request, context, EVALUATION_CLOCK,
  ), []);
  assert.deepEqual(Object.keys(request).sort(), [...stepH.FIELD_SETS.request].sort());
});

test("request exact fields, version, ID, and hash are enforced", () => {
  for (const mutate of [
    (fixture) => { delete fixture.request.environmentBindingHash; },
    (fixture) => { fixture.request.rawConnectionMaterial = "forbidden"; },
    (fixture) => { fixture.request.contractVersion = "wrong"; },
    (fixture) => { fixture.request.approvalRequestId = "wrong"; },
    (fixture) => { fixture.request.approvalRequestHash = "0".repeat(64); },
  ]) {
    const fixture = buildRequestFixture();
    mutate(fixture);
    const issues = stepH.validateLiveObservationApprovalRequest(
      fixture.request, fixture.context, EVALUATION_CLOCK,
    );
    assert.ok(issues.some((issue) => issue.startsWith("request_")), issues.join(","));
  }
});

test("request summary, Step G, and H contract bindings cannot drift", () => {
  for (const [field, issue] of [
    ["runPackageSummaryHash", "approval_request_summary_binding_mismatch:runPackageSummaryHash"],
    ["targetSelectionPolicyHash", "approval_request_upstream_binding_mismatch:targetSelectionPolicyHash"],
    ["readinessChecklistHash", "approval_request_contract_binding_mismatch:readiness"],
    ["credentialProvisioningBoundaryHash", "approval_request_contract_binding_mismatch:credential"],
  ]) {
    const fixture = buildRequestFixture();
    const issues = resealRequest(fixture, (value) => { value[field] = "0".repeat(64); });
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("all sanitized hash placeholders and approver hash must be SHA-256", () => {
  for (const field of [
    ...stepH.buildValidPreparationPacket().contracts.intake.requiredHashPlaceholders,
    "sanitizedApproverIdentityHash", "requestNonceHash",
  ]) {
    const fixture = buildRequestFixture();
    const issues = resealRequest(fixture, (value) => { value[field] = "invalid"; });
    assert.ok(issues.some((issue) => issue.includes("hash") || issue.includes("nonce")),
      `${field}: ${issues}`);
  }
});

test("raw material, approval, and authority implications are rejected", () => {
  for (const [field, value, issue] of [
    ["rawMaterialPresent", true, "approval_request_raw_material_boundary_invalid"],
    ["approvalRequested", true, "approval_request_authority_boundary_invalid"],
    ["approvalGranted", true, "approval_request_authority_boundary_invalid"],
    ["maximumObservationCount", 2, "approval_request_operation_scope_invalid"],
  ]) {
    const fixture = buildRequestFixture();
    const issues = resealRequest(fixture, (request) => { request[field] = value; });
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("target purpose, destination count, namespace, and disposal deadline are exact", () => {
  for (const [field, value] of [
    ["targetPurposeClassification", "shared"], ["destinationCount", 2],
    ["namespaceCategory", "existing"], ["disposalDeadlineCategory", "unassigned"],
  ]) {
    const fixture = buildRequestFixture();
    const issues = resealRequest(fixture, (request) => { request[field] = value; });
    assert.ok(issues.includes("approval_request_target_classification_invalid"),
      `${field}: ${issues}`);
  }
});

test("credential category separation and denied privileges are exact", () => {
  for (const [field, value] of [
    ["runtimeDeniedPrivileges", stepH.RUNTIME_DENIED_PRIVILEGES.slice(1)],
    ["categoriesDistinct", false], ["migrationCredentialUsedForObservation", true],
  ]) {
    const fixture = buildRequestFixture();
    const issues = resealRequest(fixture, (request) => { request[field] = value; });
    assert.ok(issues.includes("approval_request_credential_boundary_invalid"),
      `${field}: ${issues}`);
  }
});

test("requested operation order and maximum count are exact", () => {
  for (const mutate of [
    (request) => request.requestedOperationSet.reverse(),
    (request) => request.requestedOperationSet.splice(1, 1),
    (request) => request.requestedOperationSet.push(request.requestedOperationSet[0]),
  ]) {
    const fixture = buildRequestFixture();
    const issues = resealRequest(fixture, mutate);
    assert.ok(issues.includes("approval_request_operation_scope_invalid"), issues.join(","));
  }
});

test("request nonce replay and malformed prior contexts fail closed", () => {
  const replay = buildRequestFixture();
  replay.context.priorRequestNonceHashes = [replay.request.requestNonceHash];
  let issues = stepH.validateLiveObservationApprovalRequest(
    replay.request, replay.context, EVALUATION_CLOCK,
  );
  assert.ok(issues.includes("approval_request_nonce_replay_manual_review"), issues.join(","));

  for (const hashes of [
    "not-an-array", ["bad"], ["a".repeat(64), "a".repeat(64)],
    ["f".repeat(64), "a".repeat(64)],
  ]) {
    const fixture = buildRequestFixture();
    fixture.context.priorRequestNonceHashes = hashes;
    issues = stepH.validateLiveObservationApprovalRequest(
      fixture.request, fixture.context, EVALUATION_CLOCK,
    );
    assert.ok(issues.some((issue) => issue.startsWith("prior_request_nonce_hashes_")),
      `${JSON.stringify(hashes)}: ${issues}`);
  }
});

test("canonical timestamps, lifetime, expiry, and skew are enforced", () => {
  for (const [clock, mutate, issue] of [
    [EVALUATION_CLOCK, (request) => { request.issuedAt = "2026-07-18T00:01:00Z"; },
      "approval_request_issued_at_invalid"],
    ["2026-07-18T00:06:00.000Z", () => {}, "approval_request_expired"],
    ["2026-07-18T00:00:00.000Z", () => {}, "approval_request_future_dated"],
    [EVALUATION_CLOCK, (request) => { request.expiresAt = request.issuedAt; },
      "approval_request_timestamp_inversion"],
    [EVALUATION_CLOCK, (request) => { request.expiresAt = "2026-07-18T00:12:00.000Z"; },
      "approval_request_lifetime_excessive"],
  ]) {
    const fixture = buildRequestFixture();
    const value = { ...fixture.request };
    delete value.approvalRequestId;
    delete value.approvalRequestHash;
    mutate(value);
    fixture.request = stepH.sealContract(value, "request");
    const issues = stepH.validateLiveObservationApprovalRequest(
      fixture.request, fixture.context, clock,
    );
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("observation window is canonical, ordered, and bounds the request", () => {
  for (const [mutate, issue] of [
    [(request) => { request.observationWindowStartsAt = "2026-07-18T00:01:00Z"; },
      "approval_request_window_starts_at_invalid"],
    [(request) => { request.observationWindowExpiresAt = request.observationWindowStartsAt; },
      "approval_request_observation_window_inversion"],
    [(request) => { request.observationWindowStartsAt = "2026-07-18T00:00:00.000Z"; },
      "approval_request_outside_observation_window"],
    [(request) => { request.observationWindowExpiresAt = "2026-07-18T00:05:00.000Z"; },
      "approval_request_outside_observation_window"],
  ]) {
    const fixture = buildRequestFixture();
    const issues = resealRequest(fixture, mutate);
    assert.ok(issues.includes(issue), `${issue}: ${issues}`);
  }
});

test("manual review is false only for a completely valid request", () => {
  const unexpected = buildRequestFixture();
  let issues = resealRequest(unexpected, (request) => { request.manualReviewRequired = true; });
  assert.ok(issues.includes("approval_request_manual_review_unexpected"), issues.join(","));

  const required = buildRequestFixture();
  issues = resealRequest(required, (request) => {
    request.rawMaterialPresent = true;
    request.manualReviewRequired = false;
  });
  assert.ok(issues.includes("approval_request_manual_review_required"), issues.join(","));
});

test("malformed request contexts return blocking issues without throwing", () => {
  const fixture = buildRequestFixture();
  for (const context of [
    {}, { ...fixture.context, upstream: {} },
    { ...fixture.context, contracts: { ...fixture.context.contracts, extra: {} } },
    { ...fixture.context, runPackageSummary: {} },
  ]) {
    assert.doesNotThrow(() => {
      const issues = stepH.validateLiveObservationApprovalRequest(
        fixture.request, context, EVALUATION_CLOCK,
      );
      assert.ok(issues.length > 0);
    });
  }
});

test("CLI emits one sanitized prepared line and no arguments are accepted", () => {
  const cli = path.join(__dirname, "check-metrics-cutover-operator-observation-run-package.cjs");
  const result = spawnSync(process.execPath, [cli], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout.trim().split(/\r?\n/).length, 1);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.status, "operator_observation_run_package_prepared");
  assertAuthorityFalse(parsed);
});

test("core and CLI have no filesystem, ambient input, external, or execution capability", () => {
  const sources = [
    path.join(__dirname, "lib", "metrics-cutover-operator-observation-run-package.cjs"),
    path.join(__dirname, "check-metrics-cutover-operator-observation-run-package.cjs"),
  ].map((file) => fs.readFileSync(file, "utf8"));
  for (const source of sources) {
    assert.doesNotMatch(source,
      /require\(["'](?:node:fs|node:net|node:tls|node:dns|node:http|node:https|node:child_process|pg|postgres)["']\)/);
    assert.doesNotMatch(source,
      /process\.env|process\.stdin|readFileSync|writeFileSync|fetch\s*\(|execSync|spawnSync|createConnection/);
  }
});
