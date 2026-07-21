"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const subject = require("./lib/metrics-cutover-production-single-use-executor.cjs");
const fixture = require("./test-support/metrics-cutover-production-single-use-executor-fixture.cjs");

function assertNoMutationCalls(base) {
  assert.deepEqual(base.calls, []);
}
function assertBlocked(result, classification) {
  assert.equal(result.status, subject.PUBLIC_STATES[2]);
  if (classification) assert.equal(result.failureClassification, classification);
  assert.deepEqual(result.executionCloseout, {});
}

test("zero input and zero-argument CLI remain explicitly awaiting", async () => {
  const result = await subject.executeSingleUseProductionCutover();
  assert.equal(result.status, subject.PUBLIC_STATES[0]);
  assert.equal(result.ok, false);
  const cli = spawnSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-production-single-use-executor.cjs")],
  { encoding: "utf8" });
  assert.equal(cli.status, 0);
  assert.equal(JSON.parse(cli.stdout).status, subject.PUBLIC_STATES[0]);
});

test("capability descriptors bind methods timeout cancellation reconciliation and policy", () => {
  for (const name of subject.CAPABILITY_NAMES) {
    const descriptor = subject.buildCapabilityDescriptor(name);
    assert.deepEqual(descriptor.methodNames, subject.CAPABILITY_METHODS[name]);
    assert.equal(descriptor.hardTimeoutMilliseconds, 100);
    assert.equal(descriptor.cooperativeCancellationRequired, true);
    assert.equal(descriptor.deadlineEnforcementRequired, true);
    assert.match(descriptor.idempotencyPolicy, /operation/);
    assert.match(descriptor.namespacePolicy, /step114_2x_z/);
    assert.match(descriptor.sanitizationPolicy, /no_raw_output/);
    assert.equal(descriptor.automaticRetryAllowed, false);
    assert.equal(descriptor.dynamicDiscoveryAllowed, false);
  }
});

test("one exact synthetic envelope performs the exact-once eleven-stage cutover", async () => {
  const base = fixture.buildFixture();
  const result = await subject.executeSingleUseProductionCutover(base.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], result.blockingIssues.join(","));
  assert.deepEqual(result.executionTrace, subject.EXECUTION_TRACE);
  assert.equal(result.envelopeClaimAcquisitionCount, 1);
  assert.equal(result.envelopeClaimTerminalizationCount, 1);
  assert.equal(result.productionCsvReplacementCount, 2);
  assert.equal(result.selectorMutationCount, 1);
  assert.equal(result.cutoverReceiptPersistenceCount, 1);
  assert.equal(result.rollbackInvocationCount, 0);
  assert.equal(result.envelopeClaimTerminalState, "completed");
  assert.deepEqual(base.state.replacements, ["US", "KR"]);
  assert.equal(base.state.selectorMutations, 1);
  assert.ok(result.cutoverReceipt.cutoverReceiptId.startsWith("step114-2x-z-"));
  assert.ok(result.executionCloseout.executionCloseoutId.startsWith("step114-2x-z-"));
});

test("the complete Step Y/X/W/V/U/T/S chain is reconstructed before capabilities", async () => {
  const base = fixture.buildFixture();
  const tampered = fixture.clone(base.packet.stepYPacket);
  tampered.stepXResult.productionCutoverReadinessSummary
    .productionCutoverReadinessSummaryHash = "f".repeat(64);
  const result = await subject.executeSingleUseProductionCutover({
    ...base.packet, stepYPacket: tampered,
  });
  assertBlocked(result, "blocked_before_capability_invocation");
  assertNoMutationCalls(base);
});

test("invalid capability contracts block before any capability invocation", async () => {
  const base = fixture.buildFixture();
  const invalid = { ...base.packet.singleUseCutoverEnvelopeStore,
    descriptor: { ...base.packet.singleUseCutoverEnvelopeStore.descriptor,
      automaticRetryAllowed: true } };
  const result = await subject.executeSingleUseProductionCutover({
    ...base.packet, singleUseCutoverEnvelopeStore: invalid,
  });
  assertBlocked(result, "blocked_before_capability_invocation");
  assertNoMutationCalls(base);
});

test("expiry equality blocks before clock or claim invocation", async () => {
  const base = fixture.buildFixture();
  const result = await subject.executeSingleUseProductionCutover({
    ...base.packet,
    executionClockInstant: base.envelope.effectiveCutoverExpiresAt,
  });
  assertBlocked(result, "blocked_before_capability_invocation");
  assertNoMutationCalls(base);
});

test("cutover clock timeout is cancelled once and blocks before claim", async () => {
  const base = fixture.buildFixture({ faults: { readCutoverClock: "timeout" } });
  const result = await subject.executeSingleUseProductionCutover(base.packet);
  assertBlocked(result, "blocked_before_cutover_mutation");
  assert.equal(result.capabilityInvocationCounts.cutoverClock, 1);
  assert.equal(result.envelopeClaimAcquisitionCount, 0);
  assert.equal(base.calls.filter((call) => call.method === "readCutoverClock").length, 1);
  assert.equal(base.calls.some((call) => call.method === "acquireEnvelopeClaim"), false);
});

test("stale bound preimage blocks after claim and before mutation", async () => {
  const base = fixture.buildFixture({ faults: { readBoundPreimages: "drift" } });
  const result = await subject.executeSingleUseProductionCutover(base.packet);
  assertBlocked(result, "blocked_before_cutover_mutation");
  assert.equal(result.envelopeClaimAcquisitionCount, 1);
  assert.equal(result.envelopeClaimTerminalizationCount, 1);
  assert.equal(result.productionCsvReplacementCount, 0);
  assert.deepEqual(base.state.replacements, []);
});

test("an already-consumed envelope cannot start a second cutover attempt", async () => {
  const base = fixture.buildFixture();
  const first = await subject.executeSingleUseProductionCutover(base.packet);
  assert.equal(first.status, subject.PUBLIC_STATES[1]);
  const callCount = base.calls.length;
  const second = await subject.executeSingleUseProductionCutover(base.packet);
  assertBlocked(second, "blocked_before_cutover_mutation");
  assert.deepEqual(second.blockingIssues, ["envelope_already_consumed"]);
  assert.equal(base.calls.slice(callCount).some((call) =>
    call.method.startsWith("replaceProductionCsvAtomically")), false);
});

test("US then KR order and mutation maxima are enforced", async () => {
  const base = fixture.buildFixture();
  const result = await subject.executeSingleUseProductionCutover(base.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1]);
  const replacements = base.calls.filter((call) =>
    call.method.startsWith("replaceProductionCsvAtomically"));
  assert.deepEqual(replacements.map((call) => call.method),
    ["replaceProductionCsvAtomically:US", "replaceProductionCsvAtomically:KR"]);
  assert.equal(base.calls.filter((call) =>
    call.method === "mutateSelectorExactlyOnce").length, 1);
  assert.equal(base.calls.filter((call) =>
    call.method === "persistCutoverReceipt").length, 1);
});

test("a late committed US replacement is reconciled once without retry", async () => {
  const base = fixture.buildFixture({ faults: {
    "replaceProductionCsvAtomically:US": "timeout_after_commit",
  } });
  const result = await subject.executeSingleUseProductionCutover(base.packet);
  assert.equal(result.status, subject.PUBLIC_STATES[1], result.blockingIssues.join(","));
  assert.equal(base.calls.filter((call) =>
    call.method === "replaceProductionCsvAtomically:US").length, 1);
  assert.equal(base.calls.filter((call) => call.capability ===
    "atomicProductionCsvReplacer" && call.method === "reconcileOperationOutcome").length, 1);
});

for (const [name, fault, expectedReplacements] of [
  ["first CSV replacement", { "replaceProductionCsvAtomically:US":
    "throw_not_committed" }, 0],
  ["second CSV replacement", { "replaceProductionCsvAtomically:KR":
    "throw_not_committed" }, 1],
  ["selector mutation", { mutateSelectorExactlyOnce: "throw_not_committed" }, 2],
  ["receipt persistence", { persistCutoverReceipt: "throw_not_committed" }, 2],
]) {
  test(`${name} failure restores exact preimages and terminalizes once`, async () => {
    const base = fixture.buildFixture({ faults: fault });
    const result = await subject.executeSingleUseProductionCutover(base.packet);
    assertBlocked(result, "rollback_completed");
    assert.equal(result.rollbackCompleted, true);
    assert.equal(result.rollbackInvocationCount, 1);
    assert.equal(result.envelopeClaimTerminalizationCount, 1);
    assert.equal(result.productionCsvReplacementCount, expectedReplacements);
    assert.equal(base.state.rollbackCount, 1);
    assert.deepEqual(base.state.replacements, []);
    assert.equal(base.state.selectorMutations, 0);
    assert.equal(result.manualReviewRequired, false);
  });
}

test("claim terminalization ambiguity rolls back and never seals completed closeout", async () => {
  const base = fixture.buildFixture({ faults: { terminalizeEnvelopeClaim: "ambiguous" } });
  const result = await subject.executeSingleUseProductionCutover(base.packet);
  assertBlocked(result, "manual_review_required");
  assert.equal(result.manualReviewRequired, true);
  assert.equal(result.rollbackCompleted, true);
  assert.deepEqual(result.executionCloseout, {});
  assert.deepEqual(base.state.replacements, []);
  assert.equal(base.state.selectorMutations, 0);
  assert.equal(result.envelopeClaimTerminalizationCount, 1);
});

test("ambiguous rollback requires manual review and cannot produce closeout", async () => {
  const base = fixture.buildFixture({ faults: {
    mutateSelectorExactlyOnce: "throw_not_committed",
    restoreBoundPreimages: "ambiguous",
  } });
  const result = await subject.executeSingleUseProductionCutover(base.packet);
  assertBlocked(result, "manual_review_required");
  assert.equal(result.manualReviewRequired, true);
  assert.equal(result.rollbackCompleted, false);
  assert.deepEqual(result.executionCloseout, {});
});

test("post-write content or selector drift is rolled back fail closed", async () => {
  for (const faults of [
    { "readProductionCsvIdentity:US": "drift" },
    { "readProductionCsvIdentity:KR": "drift" },
    { readPostCutoverState: "drift" },
  ]) {
    const base = fixture.buildFixture({ faults });
    const result = await subject.executeSingleUseProductionCutover(base.packet);
    assertBlocked(result, "rollback_completed");
    assert.equal(result.rollbackCompleted, true);
    assert.deepEqual(base.state.replacements, []);
    assert.equal(base.state.selectorMutations, 0);
  }
});

test("completed output is deterministic frozen sanitized and fixed-false", async () => {
  const firstBase = fixture.buildFixture();
  const secondBase = fixture.buildFixture();
  const first = await subject.executeSingleUseProductionCutover(firstBase.packet);
  const second = await subject.executeSingleUseProductionCutover(secondBase.packet);
  assert.equal(subject.canonicalJson(first), subject.canonicalJson(second));
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.cutoverReceipt));
  assert.ok(Object.isFrozen(first.executionCloseout));
  for (const field of subject.FIXED_FALSE_FIELDS) assert.equal(first[field], false);
  const serialized = subject.canonicalJson(first);
  for (const forbidden of ["contentBase64", "selectorContentBase64", "signatureBase64",
    "publicKeyPem", "privateKey", "credential", "accountIdentifier"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("production core has no ambient filesystem provider DB network deployment or trigger", () => {
  const source = fs.readFileSync(path.join(__dirname, "lib",
    "metrics-cutover-production-single-use-executor.cjs"), "utf8");
  for (const forbidden of ["node:fs", "node:http", "node:https", "node:net",
    "node:tls", "node:child_process", "process.env", "process.stdin",
    "fetch(", "postgres", "SELECT ", "INSERT ", "UPDATE ", "DELETE ",
    "deploy(", "loaderActivation(", "setInterval(", "setImmediate("]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("CLI arguments are forbidden and cannot discover or execute an envelope", () => {
  const cli = spawnSync(process.execPath, [path.join(__dirname,
    "check-metrics-cutover-production-single-use-executor.cjs"), "packet.json"],
  { encoding: "utf8" });
  assert.equal(cli.status, 1);
  const result = JSON.parse(cli.stdout);
  assertBlocked(result, "blocked_before_capability_invocation");
  assert.deepEqual(result.blockingIssues, ["cli_arguments_forbidden"]);
});
