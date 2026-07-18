"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const stepL = require("./lib/metrics-cutover-sanitized-observation-intake.cjs");
const stepK = require("./lib/metrics-cutover-disposable-environment-provisioning-evidence.cjs");
const stepH = require("./lib/metrics-cutover-operator-observation-run-package.cjs");
const { evaluateCliRequest } = require(
  "./check-metrics-cutover-sanitized-observation-intake.cjs"
);

const CLOCK = "2026-07-18T00:03:00.000Z";

function assertAuthorityFalse(result) {
  for (const field of stepL.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertBlocked(result, issue) {
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.approvalRequestPreparationSummary, {});
  if (issue) assert.ok(result.blockingIssues.includes(issue), `${issue}: ${result.blockingIssues}`);
  assertAuthorityFalse(result);
}

function resealIntake(packet, mutate) {
  mutate(packet.intake);
  delete packet.intake.sanitizedObservationIntakeRecordId;
  delete packet.intake.sanitizedObservationIntakeRecordHash;
  packet.intake = stepL.sealContract(packet.intake, "intake");
}

function resealRequest(packet, mutate) {
  mutate(packet.approvalRequest);
  delete packet.approvalRequest.approvalRequestId;
  delete packet.approvalRequest.approvalRequestHash;
  packet.approvalRequest = stepH.sealContract(packet.approvalRequest, "request");
}

function intakeIssues(packet, clock = CLOCK) {
  return stepL.validateSanitizedObservationIntake(
    packet.intake, packet.intakeContext, clock,
  );
}

function requestIssues(packet, clock = CLOCK) {
  return stepL.validateApprovalRequestEnvelope(
    packet.approvalRequest,
    packet.intake,
    packet.intakeContext,
    packet.requestContext,
    clock,
  );
}

test("zero input awaits external sanitized intake with every authority false", () => {
  const result = stepL.evaluateSanitizedObservationIntakePackage();
  assert.equal(result.status, "awaiting_external_sanitized_observation_intake");
  assert.equal(result.ok, false);
  assert.deepEqual(result.approvalRequestPreparationSummary, {});
  assertAuthorityFalse(result);
});

test("valid synthetic intake and exact Step H non-authorizing request pass", () => {
  const packet = stepL.buildValidSyntheticPacket();
  assert.deepEqual(intakeIssues(packet), []);
  assert.deepEqual(requestIssues(packet), []);
  const result = stepL.evaluateSanitizedObservationIntakePackage(packet);
  assert.equal(result.status, "sanitized_observation_intake_validated");
  assert.equal(result.ok, true);
  assert.equal(result.approvalRequestPreparationSummary.syntheticValidationOnly, true);
  assert.equal(result.approvalRequestPreparationSummary.rawMaterialPresent, false);
  assert.equal(packet.approvalRequest.contractVersion, stepH.VERSIONS.request);
  assert.equal(packet.approvalRequest.approvalRequested, false);
  assert.equal(packet.approvalRequest.approvalGranted, false);
  assertAuthorityFalse(result);
});

test("public states and CLI zero-argument default are exact", () => {
  assert.deepEqual(stepL.PUBLIC_STATES, [
    "awaiting_external_sanitized_observation_intake",
    "sanitized_observation_intake_validated",
    "blocked",
  ]);
  const result = evaluateCliRequest([]);
  assert.equal(result.status, "awaiting_external_sanitized_observation_intake");
  assertAuthorityFalse(result);
  const cli = spawnSync(process.execPath, [
    path.join(__dirname, "check-metrics-cutover-sanitized-observation-intake.cjs"),
  ], { encoding: "utf8" });
  assert.equal(cli.status, 0);
  assert.equal(JSON.parse(cli.stdout).status, "awaiting_external_sanitized_observation_intake");
});

test("missing or extra intake fields block exact-key validation", () => {
  for (const mode of ["missing", "extra"]) {
    const packet = stepL.buildValidSyntheticPacket();
    if (mode === "missing") delete packet.intake.observerAttestationHash;
    else packet.intake.endpoint = "forbidden";
    assert.ok(intakeIssues(packet).includes("intake_fields_invalid"));
  }
});

test("missing or extra request fields block the reused Step H envelope", () => {
  for (const mode of ["missing", "extra"]) {
    const packet = stepL.buildValidSyntheticPacket();
    if (mode === "missing") delete packet.approvalRequest.requestNonceHash;
    else packet.approvalRequest.provider = "forbidden";
    assert.ok(requestIssues(packet).includes("request_fields_invalid"));
  }
});

test("tampered or resealed Step K package and summary block", () => {
  const templatePacket = stepL.buildValidSyntheticPacket();
  const kPacket = templatePacket.intakeContext.upstream.stepKPacket;
  kPacket.template.exactDestinationCount = 2;
  delete kPacket.template.observationIntakeTemplateId;
  delete kPacket.template.observationIntakeTemplateHash;
  kPacket.template = stepK.sealContract(kPacket.template, "template");
  assert.notDeepEqual(intakeIssues(templatePacket), []);

  const summaryPacket = stepL.buildValidSyntheticPacket();
  summaryPacket.intakeContext.upstream.stepKSummary.publicState = "blocked";
  delete summaryPacket.intakeContext.upstream.stepKSummary.provisioningEvidenceSummaryId;
  delete summaryPacket.intakeContext.upstream.stepKSummary.provisioningEvidenceSummaryHash;
  summaryPacket.intakeContext.upstream.stepKSummary = stepK.sealContract(
    summaryPacket.intakeContext.upstream.stepKSummary, "summary",
  );
  assert.ok(intakeIssues(summaryPacket).includes("step_k_summary_binding_mismatch"));
});

test("tampered or resealed Step H readiness intake credential disposal approval blocks", () => {
  for (const [name, field, value] of [
    ["readiness", "separateApprovalRequired", false],
    ["intake", "exactDestinationCount", 2],
    ["credential", "runtimeSuperuserAllowed", true],
    ["disposal", "environmentDisposalRequired", false],
    ["approval", "maximumObservationCount", 2],
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    const hPacket = stepL.getStepHMaterial(packet.intakeContext.upstream).packet;
    hPacket.contracts[name][field] = value;
    delete hPacket.contracts[name][stepH.SPECS[name].idField];
    delete hPacket.contracts[name][stepH.SPECS[name].hashField];
    hPacket.contracts[name] = stepH.sealContract(hPacket.contracts[name], name);
    assert.notDeepEqual(intakeIssues(packet), [], name);
  }
});

test("Step H request context tampering cannot escape the Step K-bound context", () => {
  const packet = stepL.buildValidSyntheticPacket();
  packet.requestContext.runPackageSummary = {
    ...packet.requestContext.runPackageSummary,
    runPackageSummaryHash: "f".repeat(64),
  };
  assert.notDeepEqual(requestIssues(packet), []);
});

test("selected class purpose namespace and destination bindings are exact", () => {
  for (const [field, value] of [
    ["selectedCandidateClass", "another_abstract_class"],
    ["targetPurposeClassification", "another_purpose"],
    ["namespaceCategory", "another_namespace"],
    ["destinationCount", 2],
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    resealIntake(packet, (intake) => { intake[field] = value; });
    assert.ok(intakeIssues(packet).some((issue) => issue.includes(field) ||
      issue === "intake_destination_or_disposal_scope_invalid"), field);
  }
});

test("Step K and Step H ordered arrays cannot drift or reorder", () => {
  for (const field of [
    "allowedFields", "requiredHashPlaceholders", "requiredTimestampPlaceholders",
    "credentialAttestationCategories", "runtimeDeniedPrivileges",
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    resealIntake(packet, (intake) => { intake[field] = [...intake[field]].reverse(); });
    assert.ok(intakeIssues(packet).includes(`intake_scope_invalid:${field}`));
  }
});

test("every required sanitized hash must be present and SHA-256", () => {
  const valid = stepL.buildValidSyntheticPacket();
  const fields = valid.intake.requiredHashPlaceholders;
  for (const field of fields) {
    const packet = stepL.buildValidSyntheticPacket();
    resealIntake(packet, (intake) => { intake[field] = "not-a-sha256"; });
    assert.ok(intakeIssues(packet).includes(`intake_hash_placeholder_invalid:${field}`));
  }
});

test("migration and runtime credential-category hashes must remain distinct", () => {
  const packet = stepL.buildValidSyntheticPacket();
  resealIntake(packet, (intake) => {
    intake.runtimeCredentialCategoryAttestationHash =
      intake.migrationCredentialCategoryAttestationHash;
  });
  assert.ok(intakeIssues(packet).includes("intake_credential_categories_not_distinct"));
});

test("intake nonce replay and malformed duplicate unsorted contexts block", () => {
  const replay = stepL.buildValidSyntheticPacket();
  replay.intakeContext.priorIntakeNonceHashes = [replay.intake.intakeNonceHash];
  assert.ok(intakeIssues(replay).includes("intake_nonce_replay_manual_review"));

  for (const values of [
    ["bad"], ["1".repeat(64), "1".repeat(64)], ["b".repeat(64), "a".repeat(64)],
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    packet.intakeContext.priorIntakeNonceHashes = values;
    assert.notDeepEqual(intakeIssues(packet), []);
  }
});

test("request nonce replay and malformed duplicate unsorted contexts block", () => {
  const replay = stepL.buildValidSyntheticPacket();
  replay.requestContext.priorRequestNonceHashes = [replay.approvalRequest.requestNonceHash];
  assert.ok(requestIssues(replay).includes("approval_request_nonce_replay_manual_review"));

  for (const values of [
    ["bad"], ["1".repeat(64), "1".repeat(64)], ["b".repeat(64), "a".repeat(64)],
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    packet.requestContext.priorRequestNonceHashes = values;
    assert.notDeepEqual(requestIssues(packet), []);
  }
});

test("request nonce must differ from the intake nonce", () => {
  const packet = stepL.buildValidSyntheticPacket();
  resealRequest(packet, (request) => { request.requestNonceHash = packet.intake.intakeNonceHash; });
  assert.ok(requestIssues(packet).includes("approval_request_nonce_must_differ_from_intake_nonce"));
});

test("intake canonical time inversion lifetime expiry template and clock skew failures block", () => {
  for (const [field, value, expected] of [
    ["issuedAt", "not-canonical", "intake_issued_at_invalid"],
    ["expiresAt", "2026-07-18T00:02:40.000Z", "intake_timestamp_inversion"],
    ["issuedAt", "2026-07-18T00:01:00.000Z", "intake_lifetime_excessive"],
    ["expiresAt", "2026-07-18T00:03:00.000Z", "intake_expired"],
    ["observationWindowExpiresAt", "2026-07-18T00:05:00.000Z", "intake_outlives_step_k_template"],
    ["issuedAt", "2026-07-18T00:03:31.000Z", "intake_future_dated"],
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    resealIntake(packet, (intake) => { intake[field] = value; });
    assert.ok(intakeIssues(packet).includes(expected), `${field}: ${intakeIssues(packet)}`);
  }
});

test("request operations cannot be skipped reordered duplicated or extended", () => {
  for (const mutate of [
    (values) => values.slice(1),
    (values) => [...values].reverse(),
    (values) => [...values, values[0]],
    (values) => [...values, "extra_operation"],
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    resealRequest(packet, (request) => {
      request.requestedOperationSet = mutate(request.requestedOperationSet);
    });
    assert.ok(requestIssues(packet).includes("approval_request_operation_scope_invalid"));
  }
});

test("request maximum observation count remains exactly one", () => {
  const packet = stepL.buildValidSyntheticPacket();
  resealRequest(packet, (request) => { request.maximumObservationCount = 2; });
  assert.ok(requestIssues(packet).includes("approval_request_operation_scope_invalid"));
});

test("all sanitized intake hashes and timestamps bind into the request", () => {
  for (const field of [
    ...stepL.buildValidSyntheticPacket().intake.requiredHashPlaceholders,
    "observationWindowStartsAt", "observationWindowExpiresAt",
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    resealRequest(packet, (request) => {
      request[field] = field.endsWith("At")
        ? "2026-07-18T00:03:30.000Z" : "f".repeat(64);
    });
    assert.ok(requestIssues(packet).includes(`approval_request_intake_binding_mismatch:${field}`));
  }
});

test("request cannot outlive the intake or Step K template", () => {
  const packet = stepL.buildValidSyntheticPacket();
  resealRequest(packet, (request) => { request.expiresAt = "2026-07-18T00:04:25.000Z"; });
  assert.ok(requestIssues(packet).includes("approval_request_outlives_intake_or_template"));
});

test("forbidden provider target endpoint secret observation and raw fields block", () => {
  for (const field of [
    "provider", "product", "price", "accountId", "projectId", "serviceId",
    "endpoint", "hostname", "ip", "port", "url", "databaseName", "schemaName",
    "tableName", "credential", "certificate", "secret", "operator", "path",
    "screenshot", "command", "sql", "rawEvidence",
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    packet.intake[field] = "forbidden";
    assert.ok(intakeIssues(packet).includes("intake_fields_invalid"), field);
  }
});

test("real intake approval observation and raw-material implications block", () => {
  for (const [field, value] of [
    ["realIntakeRecorded", true],
    ["observationPerformed", true],
    ["rawMaterialPresent", true],
    ["providerSpecificMaterialPresent", true],
    ["syntheticValidationOnly", false],
  ]) {
    const packet = stepL.buildValidSyntheticPacket();
    resealIntake(packet, (intake) => { intake[field] = value; });
    assert.ok(intakeIssues(packet).includes("intake_synthetic_non_recording_boundary_invalid"));
  }
  for (const field of ["approvalRequested", "approvalGranted", "rawMaterialPresent"]) {
    const packet = stepL.buildValidSyntheticPacket();
    resealRequest(packet, (request) => { request[field] = true; });
    assert.notDeepEqual(requestIssues(packet), [], field);
  }
});

test("Step L summary exact keys IDs hashes and bindings reject tampering", () => {
  const packet = stepL.buildValidSyntheticPacket();
  const summary = stepL.buildSummary(
    packet.intake, packet.approvalRequest, packet.intakeContext.upstream,
  );
  assert.deepEqual(stepL.validateSummary(
    summary, packet.intake, packet.approvalRequest, packet.intakeContext.upstream,
  ), []);
  summary.publicState = "blocked";
  assert.notDeepEqual(stepL.validateSummary(
    summary, packet.intake, packet.approvalRequest, packet.intakeContext.upstream,
  ), []);
});

test("blocked CLI failure and exception results retain fixed-false authority", () => {
  assertBlocked(evaluateCliRequest(["forbidden"]), "cli_arguments_forbidden");
  assertBlocked(evaluateCliRequest([], { runCheck() { throw new Error("synthetic"); } }),
    "sanitized_observation_intake_check_failed");
  assertBlocked(stepL.evaluateSanitizedObservationIntakePackage({}),
    "sanitized_observation_packet_fields_invalid");
});

test("source directly calls Step K and all required Step H validators", () => {
  const source = fs.readFileSync(path.join(
    __dirname, "lib", "metrics-cutover-sanitized-observation-intake.cjs",
  ), "utf8");
  for (const call of [
    "stepK.validateUpstream(", "stepK.validateEvidenceContext(",
    "stepK.validateProvisioningEvidence(", "stepK.validateTemplateContext(",
    "stepK.validateObservationIntakeTemplate(", "stepK.validateSummary(",
    "stepH.validateUpstream(", "stepH.validateContract(",
    "stepH.validateRunPackageSummary(", "stepH.validateRequestContext(",
    "stepH.validateLiveObservationApprovalRequest(",
  ]) assert.ok(source.includes(call), call);
  assert.ok(source.includes("contractVersion: stepH.VERSIONS.request"));
});

test("core has no ambient filesystem network DB process provider approval or deployment capability", () => {
  const source = fs.readFileSync(path.join(
    __dirname, "lib", "metrics-cutover-sanitized-observation-intake.cjs",
  ), "utf8");
  for (const forbidden of [
    "node:fs", "process.env", "process.stdin", "Date.now(", "new Date()", "fetch(",
    "node:http", "node:https", "node:net", "node:tls", "node:dns", "require(\"pg\")",
    "postgresql://", "node:child_process", "dockerode", "@supabase", "@render",
    "approvalService", "signRequest", "deploy(",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
});
