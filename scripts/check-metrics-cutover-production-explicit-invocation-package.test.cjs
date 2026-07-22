"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { generateKeyPairSync } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const subject = require("./lib/metrics-cutover-production-explicit-invocation-package.cjs");
const fixture = require("./test-support/metrics-cutover-production-explicit-invocation-package-fixture.cjs");

function assertNoCalls(built) { assert.deepEqual(built.calls, []); }
function assertZeroCounts(result) {
  assert.deepEqual(result.capabilityInvocationCounts,
    Object.fromEntries(Object.keys(result.capabilityInvocationCounts).map((key) => [key, 0])));
  for (const field of ["commandConstructionCount", "envelopeClaimAcquisitionCount",
    "envelopeClaimTerminalizationCount", "productionCsvReplacementCount",
    "selectorMutationCount", "cutoverReceiptPersistenceCount",
    "rollbackInvocationCount"]) assert.equal(result[field], 0, field);
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}
function assertDeepFrozen(value) {
  if (value && typeof value === "object") {
    assert.equal(Object.isFrozen(value), true);
    for (const child of Object.values(value)) assertDeepFrozen(child);
  }
}
function assertSanitized(value) {
  assert.equal(Buffer.isBuffer(value), false);
  assert.notEqual(typeof value, "function");
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      assert.ok(!["signatureBase64", "publicKeyPem", "contentBase64", "selectorContentBase64",
        "credential", "endpoint", "privateKey", "command", "stack"].includes(key), key);
      assertSanitized(child);
    }
  }
}
function expectBlocked(mutator, issue, classification) {
  const built = fixture.buildFixture();
  mutator(built.packet, built);
  const result = subject.evaluateExplicitProductionCutoverInvocation(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[2]);
  assert.ok(result.blockingIssues.some((item) => item.includes(issue)),
    JSON.stringify(result.blockingIssues));
  if (classification) assert.equal(result.failureClassification, classification);
  assert.deepEqual(result.invocationPackage, {});
  assertNoCalls(built); assertZeroCounts(result);
  return result;
}
function expectCommandBlocked(mutator, issue) {
  const built = fixture.buildFixture();
  const verified = subject.evaluateExplicitProductionCutoverInvocation(built.packet);
  assert.equal(verified.status, subject.PUBLIC_STATES[1]);
  const input = fixture.commandInput(verified, built);
  mutator(input, built, verified);
  const result = subject.dryValidateOneRunInvocation(input);
  assert.equal(result.status, subject.PUBLIC_STATES[2]);
  assert.ok(result.blockingIssues.some((item) => item.includes(issue)),
    JSON.stringify(result.blockingIssues));
  assertNoCalls(built); assertZeroCounts(result);
  return result;
}

test("public states, zero input, zero-argument CLI, and forbidden arguments are exact", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_explicit_production_cutover_invocation_authorization",
    "explicit_production_cutover_invocation_package_verified", "blocked",
  ]);
  const idle = subject.evaluateExplicitProductionCutoverInvocation();
  assert.equal(idle.status, subject.PUBLIC_STATES[0]);
  assertZeroCounts(idle); assertDeepFrozen(idle);
  const cliPath = path.join(__dirname,
    "check-metrics-cutover-production-explicit-invocation-package.cjs");
  const cli = spawnSync(process.execPath, [cliPath], { encoding: "utf8" });
  assert.equal(cli.status, 0);
  assert.equal(JSON.parse(cli.stdout).status, subject.PUBLIC_STATES[0]);
  const forbidden = spawnSync(process.execPath, [cliPath, "--execute"],
  { encoding: "utf8" });
  assert.equal(forbidden.status, 1);
  assert.equal(JSON.parse(forbidden.stdout).blockingIssues[0], "cli_arguments_forbidden");
});

test("valid synthetic authorization verifies one deterministic non-executing package", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateExplicitProductionCutoverInvocation(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], result.blockingIssues.join(","));
  assert.equal(result.stepZADirectlyValidated, true);
  assert.equal(result.completeStepZAZYXWVUTSChainValidated, true);
  assert.equal(result.operatorAuthorizationVerified, true);
  assert.equal(result.signerSeparationValidated, true);
  assert.equal(result.nonceValidated, true);
  assert.equal(result.chronologyValidated, true);
  assert.equal(result.dryValidationCompleted, true);
  assertNoCalls(built); assertZeroCounts(result);
  assertDeepFrozen(result); assertSanitized(result);
});

test("complete ZA/Z/Y/X/W/V/U/T/S chain and handoff are directly reconstructed", () => {
  const built = fixture.buildFixture();
  const direct = subject.validateStepZA(built.packet.stepZAPacket,
    built.packet.stepZAResult);
  assert.deepEqual(direct.issues, []);
  assert.equal(direct.handoff.explicitExecutionHandoffId,
    built.packet.stepZAResult.explicitExecutionHandoff.explicitExecutionHandoffId);
  assert.equal(direct.inventory.capabilityCount, 7);
  assertNoCalls(built);
});

test("operator authorization contract binds exact role scope algorithm package and claim namespace", () => {
  const built = fixture.buildFixture();
  const auth = built.authorization;
  assert.equal(auth.role, subject.ROLE);
  assert.equal(auth.scope, subject.SCOPE);
  assert.equal(auth.signatureAlgorithm, subject.SIGNATURE_ALGORITHM);
  assert.equal(auth.invocationPackageId, built.core.invocationPackageId);
  assert.equal(auth.invocationPackageHash, built.core.invocationPackageHash);
  assert.equal(auth.singleUseClaimNamespaceHash, built.core.singleUseClaimNamespaceHash);
  assert.deepEqual(subject.validateSignedOperatorAuthorization(auth, built.allowlist,
    built.packet.stepZAPacket, built.core, [], built.packet.evaluationClockInstant).issues, []);
  assertNoCalls(built);
});

test("allowlist requires exactly one active exact-role Ed25519 signer", () => {
  expectBlocked((packet, built) => {
    const allowlist = fixture.clone(built.allowlist);
    allowlist.entries = [];
    packet.productionCutoverOperatorAllowlist = fixture.resealAllowlist(allowlist);
  }, "operator_allowlist_exact_resolution_invalid");
  expectBlocked((packet, built) => {
    const allowlist = fixture.clone(built.allowlist);
    allowlist.entries = [allowlist.entries[0], { ...allowlist.entries[0],
      signerKeyId: "duplicate-zb-operator" }];
    packet.productionCutoverOperatorAllowlist = fixture.resealAllowlist(allowlist);
  }, "operator_allowlist_exact_resolution_invalid");
  expectBlocked((packet, built) => {
    const allowlist = fixture.clone(built.allowlist);
    allowlist.entries[0].revoked = true;
    packet.productionCutoverOperatorAllowlist = fixture.resealAllowlist(allowlist);
  }, "validity_or_revocation_invalid");
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 });
  expectBlocked((packet) => {
    const invalid = fixture.clone(packet.productionCutoverOperatorAllowlist);
    invalid.entries[0].publicKeyPem = rsa.publicKey.export({ type: "spki", format: "pem" });
    packet.productionCutoverOperatorAllowlist = fixture.resealAllowlist(invalid);
  }, "public_key_invalid_or_not_ed25519");
});

test("signature, role, scope, and algorithm failures block", () => {
  expectBlocked((packet, built) => {
    packet.signedOperatorAuthorization = { ...built.authorization,
      signatureBase64: Buffer.from("bad-signature").toString("base64") };
  }, "operator_authorization_signature_invalid");
  for (const [field, value] of [["role", "wrong_role"], ["scope", "wrong_scope"],
    ["signatureAlgorithm", "RSA"]]) {
    expectBlocked((packet, built) => {
      packet.signedOperatorAuthorization = fixture.resealAuthorization(
        built.authorization, { [field]: value });
    }, "operator_authorization_role_scope_or_algorithm_invalid");
  }
});

test("operator signer is separated from Step M N Q S V and Y in all three dimensions", () => {
  const base = fixture.buildFixture();
  const upstream = subject.buildUpstreamSignerIdentities(base.packet.stepZAPacket);
  assert.deepEqual(upstream.map((entry) => entry.role), [
    "step_m_approver", "step_n_invoker", "step_q_operator",
    "step_s_execution_confirmer", "step_v_external_observation_approver",
    "step_y_production_cutover_approver",
  ]);
  for (const [field, upstreamField] of [["signerKeyId", "keyId"],
    ["signerSanitizedIdentityHash", "identityHash"]]) {
    expectBlocked((packet, built) => {
      const allowlist = fixture.clone(built.allowlist);
      allowlist.entries[0][field] = upstream[0][upstreamField];
      packet.productionCutoverOperatorAllowlist = fixture.resealAllowlist(allowlist);
      const signer = fixture.signerFromAllowlist(packet.productionCutoverOperatorAllowlist);
      const body = subject.buildOperatorAuthorizationBody(packet.stepZAPacket, built.core,
        signer, [], packet.evaluationClockInstant);
      packet.signedOperatorAuthorization = fixture.signAuthorizationBody(body);
    }, "operator_signer_upstream_separation_failed");
  }
  expectBlocked((packet, built) => {
    const allowlist = fixture.clone(built.allowlist);
    allowlist.entries[0].publicKeyFingerprintSha256 = upstream[0].fingerprint;
    packet.productionCutoverOperatorAllowlist = fixture.resealAllowlist(allowlist);
  }, "fingerprint_invalid_or_duplicate");
});

test("nonce replay malformed duplicate unsorted and upstream collision fail closed", () => {
  expectBlocked((packet, built) => {
    packet.priorAuthorizationNonceHashes = [built.authorization.authorizationNonceHash];
  }, "operator_authorization_nonce_invalid_or_replayed");
  expectBlocked((packet) => { packet.priorAuthorizationNonceHashes = ["bad"]; },
    "prior_authorization_nonce_context_invalid");
  expectBlocked((packet) => { packet.priorAuthorizationNonceHashes =
    ["a".repeat(64), "a".repeat(64)]; }, "prior_authorization_nonce_context_duplicate");
  expectBlocked((packet) => { packet.priorAuthorizationNonceHashes =
    ["b".repeat(64), "a".repeat(64)]; }, "prior_authorization_nonce_context_unsorted");
  expectBlocked((packet, built) => {
    const upstream = require("./lib/metrics-cutover-production-approval-envelope.cjs")
      .collectUpstreamNonceHashes(packet.stepZAPacket)[0];
    packet.signedOperatorAuthorization = fixture.resealAuthorization(
      built.authorization, { authorizationNonceHash: upstream });
  }, "operator_authorization_nonce_matches_upstream_nonce");
});

test("chronology expiry equality lifetime and signer validity are fail closed", () => {
  expectBlocked((packet, built) => {
    packet.evaluationClockInstant = built.authorization.effectiveExpiresAt;
  }, "operator_authorization_chronology_or_expiry_invalid");
  expectBlocked((packet, built) => {
    packet.signedOperatorAuthorization = fixture.resealAuthorization(built.authorization, {
      issuedAt: "2026-07-18T00:03:28.000Z", expiresAt: "2026-07-18T00:09:00.000Z",
      effectiveExpiresAt: built.core.effectiveExpiry,
    });
  }, "operator_authorization_chronology_or_expiry_invalid");
  expectBlocked((packet, built) => {
    const allowlist = fixture.clone(built.allowlist);
    allowlist.entries[0].validFrom = "2026-07-18T00:03:30.000Z";
    packet.productionCutoverOperatorAllowlist = fixture.resealAllowlist(allowlist);
  }, "operator_signer_outside_validity_interval");
});

test("main and complete ZA Z Y X chain tampering blocks before package construction", () => {
  expectBlocked((packet) => { packet.mergedMainSha = "0".repeat(40); },
    "merged_main_sha_invalid", subject.FAILURE_CLASSIFICATIONS[0]);
  expectBlocked((packet) => {
    packet.stepZAResult = fixture.clone(packet.stepZAResult);
    packet.stepZAResult.explicitExecutionHandoff.explicitExecutionHandoffHash =
      "0".repeat(64);
  }, "step_za_packet_or_result_canonical_mismatch");
  expectBlocked((packet) => {
    const stepYPacket = fixture.clone(packet.stepZAPacket.stepZPacket.stepYPacket);
    stepYPacket.stepXResult.productionCutoverReadinessSummary
      .productionCutoverReadinessSummaryHash = "f".repeat(64);
    packet.stepZAPacket = { ...packet.stepZAPacket,
      stepZPacket: { ...packet.stepZAPacket.stepZPacket, stepYPacket } };
  }, "step_za_packet_or_result_canonical_mismatch");
});

test("capability descriptor drift blocks before authorization or command construction", () => {
  expectBlocked((packet) => {
    const capability = packet.stepZAPacket.stepZPacket.cutoverReceiptStore;
    packet.stepZAPacket = { ...packet.stepZAPacket,
      stepZPacket: { ...packet.stepZAPacket.stepZPacket,
        cutoverReceiptStore: { ...capability, descriptor: { ...capability.descriptor,
          automaticRetryAllowed: true } } } };
  }, "step_za_packet_or_result_canonical_mismatch");
});

test("US KR order content schema dataset package row and byte drift block", () => {
  for (const field of ["contentSha256", "schemaIdentitySha256", "datasetIdentityHash",
    "candidatePackageHash", "datasetPackageHash", "rowCount", "byteCount"]) {
    expectBlocked((packet) => {
      const material = fixture.clone(packet.stepZAPacket.runtimeMaterial);
      material.targetReadiness.targets[0][field] = field.endsWith("Count") ? 999 :
        "0".repeat(64);
      packet.stepZAPacket = { ...packet.stepZAPacket, runtimeMaterial: material };
    }, "step_za_packet_or_result_canonical_mismatch");
  }
  expectBlocked((packet) => {
    const material = fixture.clone(packet.stepZAPacket.runtimeMaterial);
    material.targetReadiness.targets.reverse();
    packet.stepZAPacket = { ...packet.stepZAPacket, runtimeMaterial: material };
  }, "step_za_packet_or_result_canonical_mismatch");
});

test("selector repository attestation and operation-order drift block", () => {
  for (const mutate of [
    (m) => { m.targetReadiness.selector.preimageSha256 = "0".repeat(64); },
    (m) => { m.targetReadiness.selector.expectedPostimageSha256 = "0".repeat(64); },
    (m) => { m.targetReadiness.repository.repositoryTreeSha = "0".repeat(40); },
    (m) => { m.targetReadiness.repository.targetAbsenceAttestationHash = "0".repeat(64); },
    (m) => { m.targetReadiness.repository.noDriftAttestationHash = "0".repeat(64); },
    (m) => { m.operationPlan[0].operationId = m.operationPlan[1].operationId; },
  ]) {
    expectBlocked((packet) => {
      const material = fixture.clone(packet.stepZAPacket.runtimeMaterial);
      mutate(material);
      packet.stepZAPacket = { ...packet.stepZAPacket, runtimeMaterial: material };
    }, "step_za_packet_or_result_canonical_mismatch");
  }
});

test("rollback receipt and terminalization readiness are mandatory", () => {
  for (const field of ["rollbackAvailable", "restorationVerificationAvailable",
    "receiptPersistenceAvailable", "claimTerminalizationAvailable"]) {
    expectBlocked((packet) => {
      const material = fixture.clone(packet.stepZAPacket.runtimeMaterial);
      material.availability[field] = false;
      packet.stepZAPacket = { ...packet.stepZAPacket, runtimeMaterial: material };
    }, "step_za_packet_or_result_canonical_mismatch");
  }
});

test("merge CI Vercel and repository ownership never imply authorization", () => {
  for (const field of ["executionAuthorityInferredFromMerge",
    "executionAuthorityInferredFromCi", "executionAuthorityInferredFromVercel",
    "executionAuthorityInferredFromRepositoryOwnership"]) {
    expectBlocked((packet) => {
      const material = fixture.clone(packet.stepZAPacket.runtimeMaterial);
      material.authority[field] = true;
      packet.stepZAPacket = { ...packet.stepZAPacket, runtimeMaterial: material };
    }, "step_za_packet_or_result_canonical_mismatch");
  }
});

test("invocation package contains exact identities policies operations and fixed states", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateExplicitProductionCutoverInvocation(built.packet);
  const value = result.invocationPackage;
  assert.deepEqual(subject.validateInvocationPackageSeal(value), []);
  assert.equal(value.stepZContractVersion,
    "finple.step114-2x-z.production-single-use-cutover-executor.v1");
  assert.equal(value.capabilityInventory.length, 7);
  assert.equal(value.executionTrace.length, 11);
  assert.equal(value.oneRunOperationPlan.length, 12);
  assert.equal(value.fixedCapabilityTimeoutMilliseconds, 100);
  assert.equal(value.singleUse, true);
  assert.equal(value.explicitInvocationRequired, true);
  assert.equal(value.rollbackPreimageRestorationRequired, true);
  assert.equal(value.receiptPersistenceRequired, true);
  assert.equal(value.claimTerminalizationRequired, true);
  assert.match(value.oneRunCommandIdentity, /^[0-9a-f]{64}$/);
  assertNoCalls(built); assertZeroCounts(result);
});

test("package is deterministic recursively frozen sanitized and signature-specific", () => {
  const first = fixture.buildFixture();
  const second = fixture.buildFixture();
  const left = subject.evaluateExplicitProductionCutoverInvocation(first.packet);
  const right = subject.evaluateExplicitProductionCutoverInvocation(second.packet);
  assert.deepEqual(left, right);
  assertDeepFrozen(left); assertSanitized(left);
  assert.equal(JSON.stringify(left).includes(first.authorization.signatureBase64), false);
  assertNoCalls(first); assertNoCalls(second);
});

test("dry validation accepts only exact package and explicit Step Z dependencies", () => {
  const built = fixture.buildFixture();
  const verified = subject.evaluateExplicitProductionCutoverInvocation(built.packet);
  const input = fixture.commandInput(verified, built);
  const dry = subject.dryValidateOneRunInvocation(input);
  const prepared = subject.prepareOneRunInvocationCommand(input);
  assert.equal(dry.status, subject.PUBLIC_STATES[1],
    JSON.stringify(dry.blockingIssues));
  assert.equal(prepared.status, subject.PUBLIC_STATES[1],
    JSON.stringify(prepared.blockingIssues));
  assert.equal(dry.commandBoundary.dryValidationCompleted, true);
  assert.equal(dry.commandBoundary.commandConstructed, false);
  assert.equal(dry.commandBoundary.descriptorState, "dry_validation_completed");
  assert.equal(prepared.commandBoundary.commandConstructed, true);
  assert.equal(prepared.commandBoundary.descriptorState,
    "sanitized_descriptor_constructed");
  assert.notEqual(prepared.commandBoundary.commandBoundaryDescriptorHash,
    dry.commandBoundary.commandBoundaryDescriptorHash);
  assert.equal(dry.commandBoundary.executionPerformed, false);
  assert.equal(prepared.commandBoundary.executionPerformed, false);
  assert.equal(prepared.commandBoundary.executorInvoked, false);
  assert.deepEqual(prepared.commandBoundary.explicitDependencyNames,
    subject.EXPLICIT_DEPENDENCY_NAMES);
  assertDeepFrozen(prepared); assertSanitized(prepared);
  assertNoCalls(built); assertZeroCounts(dry); assertZeroCounts(prepared);
});

test("self-resealed forged operator identity package is rejected at command boundary", () => {
  expectCommandBlocked((input) => {
    input.invocationPackage = fixture.resealInvocationPackage(
      input.invocationPackage, { operatorSignerIdentity: {
        ...input.invocationPackage.operatorSignerIdentity,
        signerKeyId: "forged-step-zb-operator-key",
      } });
  }, "invocation_package_operator_authorization_binding_invalid");
});

test("self-resealed forged authorization hash package is rejected at command boundary", () => {
  expectCommandBlocked((input) => {
    input.invocationPackage = fixture.resealInvocationPackage(
      input.invocationPackage, { operatorAuthorizationHash: "0".repeat(64) });
  }, "invocation_package_operator_authorization_binding_invalid");
});

test("self-resealed forged signature digest package is rejected at command boundary", () => {
  expectCommandBlocked((input) => {
    input.invocationPackage = fixture.resealInvocationPackage(
      input.invocationPackage, { operatorSignatureDigest: "f".repeat(64) });
  }, "invocation_package_operator_authorization_binding_invalid");
});

test("authorization expired between package creation and command validation is rejected", () => {
  expectCommandBlocked((input) => {
    input.evaluationClockInstant =
      input.signedOperatorAuthorization.effectiveExpiresAt;
  }, "operator_authorization_chronology_or_expiry_invalid");
});

test("command-boundary nonce replay is rejected", () => {
  expectCommandBlocked((input) => {
    input.priorAuthorizationNonceHashes = [
      input.signedOperatorAuthorization.authorizationNonceHash,
    ];
  }, "operator_authorization_nonce_invalid_or_replayed");
});

test("missing or tampered Step Z execution packet is rejected", () => {
  expectCommandBlocked((input) => { delete input.stepZExecutionPacket; },
    "explicit_command_dependencies_invalid");
  expectCommandBlocked((input) => {
    input.stepZExecutionPacket = { ...input.stepZExecutionPacket,
      mergedMainSha: "0".repeat(40) };
  }, "step_z_execution_merged_main_binding_invalid");
});

test("Step Y packet or result mismatch in execution material is rejected", () => {
  expectCommandBlocked((input) => {
    const stepYResult = fixture.clone(input.stepZExecutionPacket.stepYResult);
    stepYResult.singleUseProductionCutoverEnvelope
      .singleUseProductionCutoverEnvelopeHash = "0".repeat(64);
    input.stepZExecutionPacket = { ...input.stepZExecutionPacket, stepYResult };
  }, "step_z_execution_step_y_binding_invalid");
});

test("Step Z execution clock mismatch is rejected", () => {
  expectCommandBlocked((input) => {
    input.stepZExecutionPacket = { ...input.stepZExecutionPacket,
      executionClockInstant: "2026-07-18T00:03:28.500Z" };
  }, "step_z_execution_clock_binding_invalid");
});

test("actual upstream public-key fingerprint collision reaches signer separation failure", () => {
  const base = fixture.buildFixture();
  const upstreamKeys = base.zaBase.stepZBase.stepYFixture.approverKeys;
  const built = fixture.buildFixture({ operatorKeys: upstreamKeys });
  const result = subject.evaluateExplicitProductionCutoverInvocation(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[2]);
  assert.ok(result.blockingIssues.includes(
    "operator_signer_upstream_separation_failed"),
  JSON.stringify(result.blockingIssues));
  assertNoCalls(built); assertZeroCounts(result);
});

test("valid complete command descriptor is exact frozen sanitized and non-executing", () => {
  const built = fixture.buildFixture();
  const verified = subject.evaluateExplicitProductionCutoverInvocation(built.packet);
  const prepared = subject.prepareOneRunInvocationCommand(
    fixture.commandInput(verified, built));
  const descriptor = prepared.commandBoundary;
  assert.equal(prepared.status, subject.PUBLIC_STATES[1],
    JSON.stringify(prepared.blockingIssues));
  assert.equal(descriptor.commandConstructed, true);
  assert.equal(descriptor.executionPerformed, false);
  assert.equal(descriptor.executorInvoked, false);
  assert.equal(descriptor.capabilityMethodInvoked, false);
  assert.equal(descriptor.rawMaterialPresent, false);
  assert.deepEqual(descriptor.stepZExecutionPacketBinding.exactInputFields,
    require("./lib/metrics-cutover-production-single-use-executor.cjs").INPUT_FIELDS);
  assert.match(descriptor.commandBoundaryDescriptorId,
    /^step114-2x-zb-command-boundary-[0-9a-f]{64}$/);
  assert.match(descriptor.commandBoundaryDescriptorHash, /^[0-9a-f]{64}$/);
  assertDeepFrozen(prepared); assertSanitized(prepared);
  assertNoCalls(built); assertZeroCounts(prepared);
});

test("command boundary blocks missing package dependency drift and zero input awaits", () => {
  assert.equal(subject.dryValidateOneRunInvocation().status, subject.PUBLIC_STATES[0]);
  const built = fixture.buildFixture();
  const verified = subject.evaluateExplicitProductionCutoverInvocation(built.packet);
  const missing = fixture.commandInput(verified, built);
  delete missing.rollbackCoordinator;
  const absent = subject.dryValidateOneRunInvocation(missing);
  assert.equal(absent.status, subject.PUBLIC_STATES[2]);
  assert.ok(absent.blockingIssues.includes("explicit_command_dependencies_invalid"));
  const malformed = fixture.commandInput(verified, built);
  malformed.invocationPackage = null;
  const malformedResult = subject.dryValidateOneRunInvocation(malformed);
  assert.equal(malformedResult.status, subject.PUBLIC_STATES[2]);
  assert.ok(malformedResult.blockingIssues.includes("invocation_package_fields_invalid"));
  const drift = fixture.commandInput(verified, built);
  drift.cutoverClock = { ...drift.cutoverClock,
    descriptor: { ...drift.cutoverClock.descriptor, automaticRetryAllowed: true } };
  const invalid = subject.dryValidateOneRunInvocation(drift);
  assert.equal(invalid.status, subject.PUBLIC_STATES[2]);
  assert.ok(invalid.blockingIssues.some((item) => item.includes("cutoverClock_descriptor_invalid")));
  assertNoCalls(built); assertZeroCounts(absent); assertZeroCounts(malformedResult);
  assertZeroCounts(invalid);
});

test("production source has no ambient filesystem network DB provider deployment or executor call", () => {
  const source = fs.readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-production-explicit-invocation-package.cjs"), "utf8");
  for (const forbidden of ["node:fs", "node:http", "node:https", "node:net",
    "child_process", "process.env", "process.stdin", "fetch(",
    "executeSingleUseProductionCutover(", "acquireEnvelopeClaim(",
    "replaceProductionCsvAtomically(", "mutateSelectorExactlyOnce(",
    "persistCutoverReceipt(", "terminalizeEnvelopeClaim(",
    "restoreBoundPreimages("]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("missing extra malformed and raw packet material fail closed", () => {
  expectBlocked((packet) => { delete packet.productionCutoverOperatorAllowlist; },
    "step_zb_packet_fields_invalid");
  expectBlocked((packet) => { packet.endpoint = "forbidden"; },
    "step_zb_packet_fields_invalid");
  expectBlocked((packet) => { packet.signedOperatorAuthorization = {}; },
    "signed_operator_authorization_fields_invalid");
});
