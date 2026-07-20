"use strict";

const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const { generateKeyPairSync } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const stepT = require("./lib/metrics-cutover-live-observation-controlled-runner.cjs");
const stepU = require("./lib/metrics-cutover-live-observation-execution-ceremony.cjs");
const subject = require("./lib/metrics-cutover-live-observation-external-execution-approval.cjs");
const fixture = require("./test-support/metrics-cutover-live-observation-external-execution-approval-fixture.cjs");

function assertFixedFalse(result) {
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}
function assertDeepFrozen(value) {
  if (value && typeof value === "object") {
    assert.equal(Object.isFrozen(value), true);
    for (const item of Object.values(value)) assertDeepFrozen(item);
  }
}
function assertNoBinaryMaterial(value) {
  assert.equal(Buffer.isBuffer(value), false);
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) assertNoBinaryMaterial(item);
  }
}
function expectBlocked(mutator, issue) {
  const built = fixture.buildFixture();
  mutator(built.packet, built);
  const result = subject.evaluateExternalExecutionApproval(built.packet);
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.some((item) => item.includes(issue)),
    JSON.stringify(result.blockingIssues));
  assert.deepEqual(built.calls, []);
  assertFixedFalse(result);
  return result;
}

test("public states, zero input, and CLI default are exact", () => {
  assert.deepEqual(subject.PUBLIC_STATES, [
    "awaiting_external_signed_execution_approval",
    "signed_single_use_external_execution_envelope_verified",
    "blocked",
  ]);
  const idle = subject.evaluateExternalExecutionApproval();
  assert.equal(idle.status, subject.PUBLIC_STATES[0]);
  assert.deepEqual(idle.singleUseExecutionEnvelope, {});
  assert.deepEqual(idle.executionEnvelopeSummary, {});
  assertFixedFalse(idle);
  assertDeepFrozen(idle);
  const cli = JSON.parse(execFileSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-live-observation-external-execution-approval.cjs")],
  { encoding: "utf8" }));
  assert.equal(cli.status, subject.PUBLIC_STATES[0]);
});

test("valid synthetic Ed25519 approval verifies one frozen sanitized envelope", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateExternalExecutionApproval(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], JSON.stringify(result.blockingIssues));
  assert.equal(result.signatureVerified, true);
  assert.equal(result.signerSeparationValidated, true);
  assert.equal(result.nonceValidated, true);
  assert.equal(result.chronologyValidated, true);
  assert.equal(result.singleUseExecutionEnvelope.singleUse, true);
  assert.equal(built.packet.externalExecutionApproval.evaluationClockInstant,
    built.packet.evaluationClockInstant);
  assert.equal(built.packet.externalExecutionApproval.upstreamEffectiveExpiresAt,
    built.packet.stepUCeremonyResult.runtimeMaterialManifest.effectiveExpiry);
  assert.equal(built.packet.externalExecutionApproval.effectiveExecutionExpiresAt,
    result.singleUseExecutionEnvelope.effectiveExecutionExpiresAt);
  assert.match(result.singleUseExecutionEnvelope.singleUseExecutionEnvelopeId,
    /^step114-2x-v-single-use-execution-envelope-[0-9a-f]{64}$/);
  assert.match(result.singleUseExecutionEnvelope.singleUseExecutionEnvelopeHash,
    /^[0-9a-f]{64}$/);
  assert.deepEqual(result.singleUseExecutionEnvelope.operationPlan,
    stepT.buildOperationPlan(built.stepSPackage.oneRunRunnerLaunchPackage
      .oneRunRunnerLaunchPackageHash));
  assert.deepEqual(Object.values(result.capabilityInvocationCounts),
    Array(stepT.CAPABILITY_NAMES.length).fill(0));
  assert.deepEqual(built.calls, []);
  assertFixedFalse(result);
  assertDeepFrozen(result);
  assertNoBinaryMaterial(result);
});

test("Step U result, all exposed validators, Step T plan, and Step S package revalidate", () => {
  const built = fixture.buildFixture();
  const direct = subject.directValidateStepU(built.packet.stepUPacket,
    built.packet.stepUCeremonyResult);
  assert.deepEqual(direct.issues, []);
  assert.equal(direct.expectedPlan.length, 21);
  assert.equal(direct.expectedPlanHash, stepT.hashOperationPlan(direct.expectedPlan));
  assert.deepEqual(stepT.validateDirectStepSPackage(built.packet.stepUPacket.stepSPackage), []);
  assert.deepEqual(stepU.validateMergedStepTContract(), []);
  assert.deepEqual(stepU.validateRuntimeCapabilities(
    built.packet.stepUPacket.runtimeCapabilities), []);
  assert.deepEqual(built.calls, []);
});

test("Step U, Step T, and Step S tampering blocks before execution", () => {
  expectBlocked((packet) => {
    packet.stepUCeremonyResult = fixture.clone(packet.stepUCeremonyResult);
    packet.stepUCeremonyResult.evidenceHandoffManifest.externalExecutionApproved = true;
  }, "step_u_result_canonical_mismatch");
  expectBlocked((packet) => {
    packet.stepUPacket.runtimeMaterial.operationPlan[0].operationId =
      `step114-2x-t-operation-${"0".repeat(64)}`;
  }, "step_u:");
  expectBlocked((packet) => {
    packet.stepUPacket = { ...packet.stepUPacket,
      stepSPackage: fixture.clone(packet.stepUPacket.stepSPackage) };
    packet.stepUPacket.stepSPackage.oneRunRunnerLaunchPackage
      .oneRunRunnerLaunchPackageHash = "0".repeat(64);
  }, "step_s:");
});

test("operation plan, inventory, material, and evidence hash tampering blocks", () => {
  for (const [field, issue] of [
    ["runtimeMaterialInventory", "runtime_material_inventory_invalid"],
    ["runtimeMaterialManifest", "runtime_material_manifest_invalid"],
    ["evidenceHandoffManifest", "step_u_result_canonical_mismatch"],
  ]) expectBlocked((packet) => {
    packet.stepUCeremonyResult = fixture.clone(packet.stepUCeremonyResult);
    const hashField = field === "runtimeMaterialInventory"
      ? "runtimeMaterialInventoryHash" : field === "runtimeMaterialManifest"
        ? "runtimeMaterialManifestHash" : "evidenceHandoffManifestHash";
    packet.stepUCeremonyResult[field][hashField] = "0".repeat(64);
  }, issue);
  expectBlocked((packet) => {
    packet.externalExecutionApproval = fixture.rehashApprovalWithoutResigning(
      packet.externalExecutionApproval, { operationPlanHash: "0".repeat(64) });
  }, "external_execution_approval_upstream_binding_mismatch");
});

test("signer outside the exact allowlist and signer role separation fail closed", () => {
  expectBlocked((packet) => {
    const outsider = generateKeyPairSync("ed25519");
    packet.externalExecutionApproverAllowlist =
      subject.buildExternalExecutionApproverAllowlist(fixture.pem(outsider));
  }, "external_execution_approval_signer_resolution_failed");
  expectBlocked((packet) => {
    const confirmation = packet.stepUPacket.stepSPackage.inputPacket.executionConfirmation;
    const allowlist = subject.buildExternalExecutionApproverAllowlist(
      fixture.pem(fixture.EXTERNAL_APPROVER_KEYS), { entry: {
        signerKeyId: confirmation.operatorKeyId,
        signerSanitizedIdentityHash: confirmation.operatorIdentityHash,
      } });
    packet.externalExecutionApproverAllowlist = allowlist;
    const body = subject.buildApprovalBody(packet.stepUPacket,
      packet.stepUCeremonyResult, fixture.signerFromAllowlist(allowlist));
    packet.externalExecutionApproval = fixture.signApprovalBody(body);
  }, "external_execution_approver_operator_separation_failed");
  expectBlocked((packet) => {
    const qPacket = packet.stepUPacket.stepSPackage.inputPacket.context.upstream
      .upstream.stepQPacket;
    const nPacket = qPacket.context.upstream.stepPPacket.context.upstream.stepOPacket
      .context.upstream.stepNPacket;
    const allowlist = subject.buildExternalExecutionApproverAllowlist(
      fixture.pem(fixture.EXTERNAL_APPROVER_KEYS), { entry: {
        signerKeyId: nPacket.invocation.invokerKeyId,
        signerSanitizedIdentityHash: nPacket.invocation.invokerIdentityHash,
      } });
    packet.externalExecutionApproverAllowlist = allowlist;
    const body = subject.buildApprovalBody(packet.stepUPacket,
      packet.stepUCeremonyResult, fixture.signerFromAllowlist(allowlist));
    packet.externalExecutionApproval = fixture.signApprovalBody(body);
  }, "external_execution_approver_invoker_separation_failed");
});

test("approval role, scope, algorithm, allowlist seal, and signature are exact", () => {
  for (const [field, value, issue] of [
    ["approvalRole", "wrong_role", "upstream_binding"],
    ["approvalScope", "wrong_scope", "upstream_binding"],
  ]) expectBlocked((packet) => {
    packet.externalExecutionApproval = fixture.rehashApprovalWithoutResigning(
      packet.externalExecutionApproval, { [field]: value });
  }, issue);
  expectBlocked((packet) => {
    packet.externalExecutionApproval.signatureAlgorithm = "Ed448";
  }, "algorithm_invalid");
  expectBlocked((packet) => {
    packet.externalExecutionApproval.signatureBase64 = "A".repeat(86) + "==";
    const signed = { ...packet.externalExecutionApproval };
    delete signed.externalExecutionApprovalHash;
    packet.externalExecutionApproval.externalExecutionApprovalHash = subject.hashContract(
      "FINPLE_STEP114_2X_V_EXTERNAL_EXECUTION_APPROVAL_HASH\0", signed);
  }, "signature_invalid");
  expectBlocked((packet) => {
    packet.externalExecutionApproverAllowlist.externalExecutionApproverAllowlistHash =
      "0".repeat(64);
  }, "allowlist_seal_invalid");
  expectBlocked((packet) => {
    packet.externalExecutionApproval = Object.fromEntries(
      Object.entries(packet.externalExecutionApproval).reverse());
  }, "fields_or_order_invalid");
});

test("replayed duplicate unsorted and malformed approval nonce contexts block", () => {
  expectBlocked((packet) => {
    packet.priorApprovalNonceHashes = [packet.externalExecutionApproval.approvalNonceHash];
  }, "nonce_invalid_or_replayed");
  expectBlocked((packet) => {
    packet.priorApprovalNonceHashes = ["c".repeat(64), "c".repeat(64)];
  }, "nonce_context_invalid");
  expectBlocked((packet) => {
    packet.priorApprovalNonceHashes = ["d".repeat(64), "c".repeat(64)];
  }, "nonce_context_invalid");
  expectBlocked((packet) => { packet.priorApprovalNonceHashes = ["bad"]; },
    "nonce_context_invalid");
  expectBlocked((packet) => {
    packet.externalExecutionApproval = fixture.rehashApprovalWithoutResigning(
      packet.externalExecutionApproval, { approvalNonceHash: "bad" });
  }, "nonce_invalid_or_replayed");
});

test("approval expiry equality blocks and one millisecond before verifies", () => {
  expectBlocked((packet) => {
    packet.externalExecutionApproval = fixture.resealApproval(
      packet.externalExecutionApproval, { expiresAt: "2026-07-18T00:03:25.000Z" });
    packet.evaluationClockInstant = "2026-07-18T00:03:25.000Z";
  }, "chronology_or_expiry_invalid");
  const built = fixture.buildFixture({
    approvalOverrides: { expiresAt: "2026-07-18T00:03:25.000Z" },
    evaluationClockInstant: "2026-07-18T00:03:24.999Z",
  });
  const result = subject.evaluateExternalExecutionApproval(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], JSON.stringify(result.blockingIssues));
  assert.equal(result.singleUseExecutionEnvelope.effectiveExecutionExpiresAt,
    "2026-07-18T00:03:25.000Z");
  assert.deepEqual(built.calls, []);
});

test("later approval expiry selects the upstream Step U and Step S effective expiry", () => {
  const built = fixture.buildFixture({ approvalOverrides: {
    expiresAt: "2026-07-18T00:05:00.000Z",
  } });
  const result = subject.evaluateExternalExecutionApproval(built.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], JSON.stringify(result.blockingIssues));
  assert.equal(result.singleUseExecutionEnvelope.effectiveExecutionExpiresAt,
    built.packet.stepUCeremonyResult.runtimeMaterialManifest.effectiveExpiry);
  assert.deepEqual(built.calls, []);
});

test("evaluation exactly at upstream effective expiry blocks", () => {
  expectBlocked((packet) => {
    packet.externalExecutionApproval = fixture.resealApproval(
      packet.externalExecutionApproval, { expiresAt: "2026-07-18T00:05:00.000Z" });
    packet.evaluationClockInstant =
      packet.stepUCeremonyResult.runtimeMaterialManifest.effectiveExpiry;
  }, "chronology_or_expiry_invalid");
});

test("caller resealing changed expiry nonce or upstream hash without a new signature blocks", () => {
  for (const [overrides, issue] of [
    [{ expiresAt: "2026-07-18T00:03:41.000Z" }, "signature_invalid"],
    [{ approvalNonceHash: "c".repeat(64) }, "signature_invalid"],
    [{ stepURuntimeMaterialInventoryHash: "0".repeat(64) }, "upstream_binding"],
    [{ stepURuntimeMaterialManifestHash: "1".repeat(64) }, "upstream_binding"],
    [{ stepUEvidenceHandoffManifestHash: "2".repeat(64) }, "upstream_binding"],
  ]) expectBlocked((packet) => {
    packet.externalExecutionApproval = fixture.rehashApprovalWithoutResigning(
      packet.externalExecutionApproval, overrides);
  }, issue);
});

test("a legitimately re-signed fresh approval produces a different envelope identity", () => {
  const first = fixture.buildFixture();
  const left = subject.evaluateExternalExecutionApproval(first.packet);
  const second = fixture.buildFixture({ approvalOverrides: {
    approvalNonceHash: "c".repeat(64), expiresAt: "2026-07-18T00:03:41.000Z",
  } });
  const right = subject.evaluateExternalExecutionApproval(second.packet);
  assert.equal(left.status, subject.PUBLIC_STATES[1]);
  assert.equal(right.status, subject.PUBLIC_STATES[1]);
  assert.notEqual(left.singleUseExecutionEnvelope.singleUseExecutionEnvelopeId,
    right.singleUseExecutionEnvelope.singleUseExecutionEnvelopeId);
  assert.notEqual(left.singleUseExecutionEnvelope.singleUseExecutionEnvelopeHash,
    right.singleUseExecutionEnvelope.singleUseExecutionEnvelopeHash);
  assert.deepEqual(first.calls, []); assert.deepEqual(second.calls, []);
});

test("envelope and summary reject canonical identity or hash tampering", () => {
  const built = fixture.buildFixture();
  const result = subject.evaluateExternalExecutionApproval(built.packet);
  const envelope = fixture.clone(result.singleUseExecutionEnvelope);
  envelope.singleUseExecutionEnvelopeHash = "0".repeat(64);
  assert.deepEqual(subject.validateSingleUseExecutionEnvelope(envelope,
    built.packet.stepUPacket, built.packet.stepUCeremonyResult,
    built.packet.externalExecutionApproval,
    built.packet.externalExecutionApproverAllowlist),
  ["single_use_execution_envelope_invalid"]);
  const summary = fixture.clone(result.executionEnvelopeSummary);
  summary.executionEnvelopeSummaryHash = "0".repeat(64);
  assert.deepEqual(subject.validateExecutionEnvelopeSummary(summary,
    result.singleUseExecutionEnvelope), ["execution_envelope_summary_invalid"]);
  assert.deepEqual(built.calls, []);
});

test("merge CI Vercel deployment and extra approval implications cannot authorize", () => {
  for (const field of ["mergeCompleted", "ciPassed", "vercelDeploymentSucceeded",
    "externalExecutionApproved"]) expectBlocked((packet) => {
    packet[field] = true;
  }, "step_v_packet_fields_invalid");
});

test("output is deterministic canonical recursively frozen and sanitized", () => {
  const built = fixture.buildFixture();
  const first = subject.evaluateExternalExecutionApproval(built.packet);
  const second = subject.evaluateExternalExecutionApproval(built.packet);
  assert.equal(subject.canonicalJson(first), subject.canonicalJson(second));
  assertDeepFrozen(first); assertNoBinaryMaterial(first); assertFixedFalse(first);
  const serialized = JSON.stringify(first).toLowerCase();
  for (const forbidden of ["privatekey", "signaturebase64", "publickeypem",
    "credential=", "endpoint=", "hostname=", "database=", "rawobservation",
    "sourcepath", "stacktrace", "commandoutput", "select *"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.deepEqual(built.calls, []);
});

test("CLI rejects arguments without accepting approval material", () => {
  const cli = spawnSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-live-observation-external-execution-approval.cjs"),
  "forbidden"], { encoding: "utf8" });
  assert.equal(cli.status, 2);
  const output = JSON.parse(cli.stdout);
  assert.equal(output.status, "blocked");
  assert.deepEqual(output.blockingIssues, ["cli_arguments_forbidden"]);
  assertFixedFalse(output);
});

test("production core has no ambient filesystem network DB process or runner invocation", () => {
  const core = readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-live-observation-external-execution-approval.cjs"), "utf8");
  const cli = readFileSync(path.join(__dirname,
    "check-metrics-cutover-live-observation-external-execution-approval.cjs"), "utf8");
  for (const forbidden of ["node:fs", "node:child_process", "node:http", "node:https",
    "node:net", "node:tls", "node:dns", "process.env", "process.stdin",
    "runControlledLiveObservation(", "require(\"pg\"", "require('pg'", "fetch(",
    "XMLHttpRequest", "WebSocket", "exec(", "spawn("]) {
    assert.equal(core.includes(forbidden), false, forbidden);
  }
  for (const forbidden of ["node:fs", "process.env", "process.stdin",
    "runControlledLiveObservation("]) assert.equal(cli.includes(forbidden), false, forbidden);
  assert.match(core, /require\("node:crypto"\)/);
});
