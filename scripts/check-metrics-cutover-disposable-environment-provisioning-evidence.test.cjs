"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const stepK = require("./lib/metrics-cutover-disposable-environment-provisioning-evidence.cjs");
const stepJ = require("./lib/metrics-cutover-operator-environment-class-decision.cjs");
const stepH = require("./lib/metrics-cutover-operator-observation-run-package.cjs");
const { evaluateCliRequest } = require(
  "./check-metrics-cutover-disposable-environment-provisioning-evidence.cjs"
);

const CLOCK = "2026-07-18T00:03:00.000Z";

function assertAuthorityFalse(result) {
  for (const field of stepK.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function assertBlocked(result, issue) {
  assert.equal(result.ok, false);
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.provisioningEvidenceSummary, {});
  if (issue) assert.ok(result.blockingIssues.includes(issue), `${issue}: ${result.blockingIssues}`);
  assertAuthorityFalse(result);
}

function resealEvidence(packet, mutate) {
  mutate(packet.evidence);
  delete packet.evidence.provisioningEvidenceId;
  delete packet.evidence.provisioningEvidenceHash;
  packet.evidence = stepK.sealContract(packet.evidence, "evidence");
}

function resealTemplate(packet, mutate) {
  mutate(packet.template);
  delete packet.template.observationIntakeTemplateId;
  delete packet.template.observationIntakeTemplateHash;
  packet.template = stepK.sealContract(packet.template, "template");
}

function resealJReceipt(packet, mutate) {
  const jPacket = packet.evidenceContext.upstream.stepJPacket;
  mutate(jPacket.receipt);
  delete jPacket.receipt.decisionReceiptId;
  delete jPacket.receipt.decisionReceiptHash;
  jPacket.receipt = stepJ.sealContract(jPacket.receipt, "receipt");
}

function resealHContract(packet, name, mutate) {
  const material = stepK.getStepHMaterial(packet.evidenceContext.upstream);
  mutate(material.packet.contracts[name]);
  delete material.packet.contracts[name][stepH.SPECS[name].idField];
  delete material.packet.contracts[name][stepH.SPECS[name].hashField];
  material.packet.contracts[name] = stepH.sealContract(
    material.packet.contracts[name], name,
  );
}

function evidenceIssues(packet, clock = CLOCK) {
  return stepK.validateProvisioningEvidence(packet.evidence, packet.evidenceContext, clock);
}

function templateIssues(packet, clock = CLOCK) {
  return stepK.validateObservationIntakeTemplate(
    packet.template, packet.evidence, packet.templateContext, clock,
  );
}

test("zero input awaits external evidence with every authority false", () => {
  const result = stepK.evaluateProvisioningEvidencePackage();
  assert.equal(result.status, "awaiting_external_disposable_environment_provisioning_evidence");
  assert.equal(result.ok, false);
  assert.deepEqual(result.provisioningEvidenceSummary, {});
  assertAuthorityFalse(result);
});

test("valid synthetic evidence and non-authorizing intake template pass", () => {
  const packet = stepK.buildValidSyntheticPacket();
  assert.deepEqual(evidenceIssues(packet), []);
  assert.deepEqual(templateIssues(packet), []);
  const result = stepK.evaluateProvisioningEvidencePackage(packet);
  assert.equal(result.status, "disposable_environment_provisioning_evidence_validated");
  assert.equal(result.ok, true);
  assert.equal(result.provisioningEvidenceSummary.syntheticValidationOnly, true);
  assert.equal(result.provisioningEvidenceSummary.rawMaterialPresent, false);
  assertAuthorityFalse(result);
  for (const name of ["evidence", "template"]) {
    assert.deepEqual(Object.keys(packet[name]).sort(), [...stepK.FIELD_SETS[name]].sort());
    assert.equal(packet[name].contractVersion, stepK.VERSIONS[name]);
  }
});

test("public states and CLI default are exact", () => {
  assert.deepEqual(stepK.PUBLIC_STATES, [
    "awaiting_external_disposable_environment_provisioning_evidence",
    "disposable_environment_provisioning_evidence_validated",
    "blocked",
  ]);
  const result = evaluateCliRequest([]);
  assert.equal(result.status, stepK.PUBLIC_STATES[0]);
  assert.equal(result.provisioningEvidenceValidated, false);
  assert.equal(result.observationIntakeTemplatePrepared, false);
});

test("complete Step J and Step H packages are directly revalidated", () => {
  const packet = stepK.buildValidSyntheticPacket();
  assert.deepEqual(stepK.validateUpstream(packet.evidenceContext.upstream), []);
  const binding = stepK.buildBindings(packet.evidenceContext.upstream);
  assert.equal(binding.operationSequence.length, 11);
  assert.equal(binding.exactDestinationCount, 1);
  assert.equal(binding.separateLiveObservationApprovalRequired, true);
  const transitive = binding.transitiveStepIHGBindings.transitiveStepHGBindings
    .transitiveExecutionPlanBindings;
  assert.equal(transitive.executionSequence.length, 12);
  assert.equal(transitive.exactScenarioCount, 15);
});

test("missing, malformed, tampered, or resealed Step J material blocks", () => {
  const missing = stepK.buildValidSyntheticPacket();
  delete missing.evidenceContext.upstream.stepJPacket.request;
  assertBlocked(stepK.evaluateProvisioningEvidencePackage(missing));

  const summary = stepK.buildValidSyntheticPacket();
  summary.evidenceContext.upstream.stepJPreparationSummary.preparationSummaryHash = "0".repeat(64);
  assertBlocked(stepK.evaluateProvisioningEvidencePackage(summary));

  const resealed = stepK.buildValidSyntheticPacket();
  resealJReceipt(resealed, (receipt) => {
    receipt.realProvisioningRecorded = true;
    receipt.manualReviewRequired = true;
  });
  assertBlocked(stepK.evaluateProvisioningEvidencePackage(resealed));
});

test("tampered or resealed Step H intake, credential, disposal, and approval block", () => {
  for (const [name, mutate] of [
    ["intake", (value) => value.allowedFields.reverse()],
    ["credential", (value) => { value.runtimeSuperuserAllowed = true; }],
    ["disposal", (value) => { value.environmentDisposalRequired = false; }],
    ["approval", (value) => { value.connectionAuthorityAllowed = true; }],
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealHContract(packet, name, mutate);
    assertBlocked(stepK.evaluateProvisioningEvidencePackage(packet));
  }
});

test("selected class and every Step J ID/hash pair remain bound", () => {
  for (const field of [
    "stepJPreparationSummaryId", "stepJPreparationSummaryHash",
    "decisionReceiptId", "decisionReceiptHash", "provisioningRequestId",
    "provisioningRequestHash", "selectedCandidateClass",
    "stepIProvisioningRunbookId", "stepIProvisioningRunbookHash",
    "stepJDecisionNonceHash", "stepJRequestNonceHash",
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealEvidence(packet, (evidence) => {
      evidence[field] = field.endsWith("Hash") ? "1".repeat(64) : `${evidence[field]}-drift`;
      evidence.manualReviewRequired = true;
    });
    assert.ok(evidenceIssues(packet).includes(`evidence_upstream_binding_mismatch:${field}`));
  }
});

test("runbook operation skip, reorder, duplicate, and extension block", () => {
  for (const mutate of [
    (values) => values.pop(),
    (values) => values.reverse(),
    (values) => values.push(values[0]),
    (values) => values.push("extra_operation"),
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealEvidence(packet, (evidence) => {
      mutate(evidence.operationSequence);
      evidence.manualReviewRequired = true;
    });
    assert.ok(evidenceIssues(packet).includes("evidence_operation_sequence_invalid"));
  }
});

test("operation attestations reject missing, extra, reordered, malformed, or duplicate hashes", () => {
  for (const mutate of [
    (values) => values.pop(),
    (values) => values.push({ operation: "extra", completionAttestationHash: "1".repeat(64) }),
    (values) => values.reverse(),
    (values) => { values[0].completionAttestationHash = "bad"; },
    (values) => { values[1].completionAttestationHash = values[0].completionAttestationHash; },
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealEvidence(packet, (evidence) => {
      mutate(evidence.operationCompletionAttestations);
      evidence.manualReviewRequired = true;
    });
    assert.notDeepEqual(evidenceIssues(packet), []);
  }
});

test("environment, namespace, destination, credential, privilege, and disposal hashes are required", () => {
  for (const field of [
    "environmentBindingHash", "namespaceEvidenceHash", "destinationAllowlistHash",
    "migrationCredentialCategoryAttestationHash", "runtimeCredentialCategoryAttestationHash",
    "credentialExpiryAttestationHash", "credentialRotationAttestationHash",
    "credentialRevocationAttestationHash", "credentialDestructionAttestationHash",
    "runtimeDeniedPrivilegeAttestationHash", "disposalResponsibilityAttestationHash",
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealEvidence(packet, (evidence) => {
      evidence[field] = "bad";
      evidence.manualReviewRequired = true;
    });
    assert.ok(evidenceIssues(packet).includes(`evidence_hash_invalid:${field}`));
  }
});

test("destination count, credential separation, and runtime denied privileges are exact", () => {
  const destination = stepK.buildValidSyntheticPacket();
  resealEvidence(destination, (evidence) => {
    evidence.destinationCount = 2;
    evidence.manualReviewRequired = true;
  });
  assert.ok(evidenceIssues(destination).includes("evidence_destination_count_invalid"));

  const credentials = stepK.buildValidSyntheticPacket();
  resealEvidence(credentials, (evidence) => {
    evidence.runtimeCredentialCategoryAttestationHash =
      evidence.migrationCredentialCategoryAttestationHash;
    evidence.manualReviewRequired = true;
  });
  assert.ok(evidenceIssues(credentials).includes("evidence_credential_categories_not_distinct"));

  const privileges = stepK.buildValidSyntheticPacket();
  resealEvidence(privileges, (evidence) => {
    evidence.runtimeDeniedPrivileges.pop();
    evidence.manualReviewRequired = true;
  });
  assert.ok(evidenceIssues(privileges).includes("evidence_runtime_denied_privileges_invalid"));
});

test("evidence nonce replay and malformed prior contexts fail closed", () => {
  const replay = stepK.buildValidSyntheticPacket();
  replay.evidenceContext.priorEvidenceNonceHashes = [replay.evidence.evidenceNonceHash];
  assert.ok(evidenceIssues(replay).includes("evidence_nonce_replay_manual_review"));

  for (const prior of [
    "not-an-array", ["bad"], ["2".repeat(64), "1".repeat(64)],
    ["1".repeat(64), "1".repeat(64)],
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    packet.evidenceContext.priorEvidenceNonceHashes = prior;
    assert.notDeepEqual(evidenceIssues(packet), []);
  }
});

test("canonical timestamp, inversion, lifetime, expiry, request expiry, and skew block", () => {
  for (const [field, value, issue, clock] of [
    ["issuedAt", "2026-07-18T00:02:30Z", "evidence_issued_at_invalid", CLOCK],
    ["expiresAt", "2026-07-18T00:02:00.000Z", "evidence_timestamp_inversion", CLOCK],
    ["expiresAt", "2026-07-18T00:08:00.000Z", "evidence_lifetime_excessive", CLOCK],
    ["expiresAt", CLOCK, "evidence_expired", CLOCK],
    ["issuedAt", "2026-07-18T00:04:00.000Z", "evidence_future_dated", CLOCK],
    ["expiresAt", "2026-07-18T00:06:30.000Z", "evidence_outlives_step_j_authority_window", CLOCK],
    ["issuedAt", "2026-07-18T00:02:30.000Z", "evidence_evaluation_clock_invalid", "bad-clock"],
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealEvidence(packet, (evidence) => {
      evidence[field] = value;
      evidence.manualReviewRequired = true;
    });
    assert.ok(evidenceIssues(packet, clock).includes(issue), `${issue}: ${evidenceIssues(packet, clock)}`);
  }
});

test("synthetic evidence never records provisioning or infers environment existence", () => {
  for (const [field, value] of [
    ["externalProvisioningAttested", false],
    ["syntheticValidationOnly", false],
    ["realProvisioningRecorded", true],
    ["environmentExistenceInferred", true],
    ["rawMaterialPresent", true],
    ["providerSpecificMaterialPresent", true],
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealEvidence(packet, (evidence) => {
      evidence[field] = value;
      evidence.manualReviewRequired = true;
    });
    assert.ok(evidenceIssues(packet).includes("evidence_synthetic_non_inference_boundary_invalid"));
  }
});

test("forbidden provider, target, endpoint, secret, observation, and raw fields block", () => {
  for (const field of [
    "provider", "product", "price", "accountId", "projectId", "serviceId",
    "endpoint", "hostname", "ip", "port", "url", "databaseName", "schemaName",
    "tableName", "credential", "certificate", "secret", "operator", "path",
    "screenshot", "command", "sql", "rawEvidence",
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    packet.evidence[field] = "forbidden";
    assert.ok(evidenceIssues(packet).includes("evidence_fields_invalid"), field);
  }
});

test("template binds evidence, Step J request, and Step H schema ID/hash pairs", () => {
  for (const field of [
    "provisioningEvidenceId", "provisioningEvidenceHash",
    "stepJProvisioningRequestId", "stepJProvisioningRequestHash",
    "stepHSanitizedIntakeSchemaId", "stepHSanitizedIntakeSchemaHash",
    "selectedCandidateClass",
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealTemplate(packet, (template) => {
      template[field] = field.endsWith("Hash") ? "1".repeat(64) : `${template[field]}-drift`;
      template.manualReviewRequired = true;
    });
    assert.notDeepEqual(templateIssues(packet), []);
  }
});

test("template Step H allowed fields, placeholders, classifications, credentials, privileges, and disposal are exact", () => {
  for (const [field, mutate] of [
    ["allowedFields", (value) => value.reverse()],
    ["requiredHashPlaceholders", (value) => value.pop()],
    ["requiredTimestampPlaceholders", (value) => value.push("extra")],
    ["credentialAttestationCategories", (value) => value.reverse()],
    ["runtimeDeniedPrivileges", (value) => value.pop()],
    ["disposalDeadlineCategories", (value) => value.reverse()],
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealTemplate(packet, (template) => {
      mutate(template[field]);
      template.manualReviewRequired = true;
    });
    assert.notDeepEqual(templateIssues(packet), []);
  }

  for (const [field, value] of [
    ["targetPurposeClassification", "unknown"],
    ["namespaceCategory", "unknown"],
    ["exactDestinationCount", 2],
    ["separateLiveObservationApprovalRequired", false],
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    resealTemplate(packet, (template) => {
      template[field] = value;
      template.manualReviewRequired = true;
    });
    assert.notDeepEqual(templateIssues(packet), []);
  }
});

test("template nonce replay, malformed context, expiry, and lifetime block", () => {
  const replay = stepK.buildValidSyntheticPacket();
  replay.templateContext.priorTemplateNonceHashes = [replay.template.templateNonceHash];
  assert.ok(templateIssues(replay).includes("template_nonce_replay_manual_review"));

  for (const prior of [
    ["bad"], ["2".repeat(64), "1".repeat(64)], ["1".repeat(64), "1".repeat(64)],
  ]) {
    const packet = stepK.buildValidSyntheticPacket();
    packet.templateContext.priorTemplateNonceHashes = prior;
    assert.notDeepEqual(templateIssues(packet), []);
  }

  const outlives = stepK.buildValidSyntheticPacket();
  resealTemplate(outlives, (template) => {
    template.expiresAt = "2026-07-18T00:05:30.000Z";
    template.manualReviewRequired = true;
  });
  assert.ok(templateIssues(outlives).includes("template_outlives_evidence"));
});

test("intake template never collects or authorizes observation or connection", () => {
  for (const field of stepK.TEMPLATE_FALSE_FIELDS) {
    const packet = stepK.buildValidSyntheticPacket();
    resealTemplate(packet, (template) => {
      template[field] = true;
      template.manualReviewRequired = true;
    });
    assert.ok(templateIssues(packet).includes(`template_authority_must_be_false:${field}`));
  }
});

test("summary is exact, sealed, synthetic-only, and fixed false", () => {
  const packet = stepK.buildValidSyntheticPacket();
  const summary = stepK.buildSummary(
    packet.evidence, packet.template, packet.evidenceContext.upstream,
  );
  assert.deepEqual(Object.keys(summary).sort(), [...stepK.FIELD_SETS.summary].sort());
  assert.deepEqual(stepK.validateSummary(
    summary, packet.evidence, packet.template, packet.evidenceContext.upstream,
  ), []);
  assert.equal(summary.publicState, "disposable_environment_provisioning_evidence_validated");
  for (const field of stepK.FIXED_FALSE_FIELDS) assert.equal(summary[field], false, field);
});

test("idle, blocked, CLI failure, and exception results preserve fixed false", () => {
  for (const result of [
    stepK.evaluateProvisioningEvidencePackage(),
    stepK.evaluateProvisioningEvidencePackage({}),
    evaluateCliRequest(["forbidden"]),
    evaluateCliRequest([], { runCheck: () => { throw new Error("synthetic"); } }),
  ]) assertAuthorityFalse(result);
});

test("CLI rejects arguments and emits one sanitized awaiting result", () => {
  const script = path.join(
    __dirname, "check-metrics-cutover-disposable-environment-provisioning-evidence.cjs",
  );
  const ok = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(ok.status, 0);
  assert.equal(JSON.parse(ok.stdout.trim()).status, stepK.PUBLIC_STATES[0]);
  const denied = spawnSync(process.execPath, [script, "forbidden"], { encoding: "utf8" });
  assert.equal(denied.status, 2);
  assert.equal(JSON.parse(denied.stdout.trim()).status, "blocked");
});

test("core has no ambient, filesystem, network, DB, process, provider, or deployment capability", () => {
  const source = fs.readFileSync(path.join(
    __dirname, "lib", "metrics-cutover-disposable-environment-provisioning-evidence.cjs",
  ), "utf8");
  for (const forbidden of [
    "node:fs", "node:http", "node:https", "node:net", "node:tls", "node:dns",
    "child_process", "process.env", "process.stdin", "Date.now()", "new Date()",
    "require(\"pg\")", "postgresql://", "dockerode", "@supabase", "@render",
  ]) assert.equal(source.includes(forbidden), false, forbidden);
});
