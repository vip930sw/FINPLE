"use strict";

const stepY = require("../lib/metrics-cutover-production-approval-envelope.cjs");
const stepYFixture = require("./metrics-cutover-production-approval-envelope-fixture.cjs");
const subject = require("../lib/metrics-cutover-production-single-use-executor.cjs");

const EXECUTION_CLOCK = "2026-07-18T00:03:28.000Z";

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function frozen(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) frozen(child);
  }
  return value;
}
function never() { return new Promise(() => {}); }

function makeCapabilities(envelope, executionPackage, faults = {}) {
  const calls = [];
  const outcomes = new Map();
  const targets = new Map();
  const expectedTargets = envelope.criticalBindings.productionCsvTargets;
  const preimage = {
    repositoryPreimageSha256: envelope.criticalBindings.repositoryPreimageSha256,
    repositoryHeadSha: envelope.criticalBindings.repositoryHeadSha,
    repositoryTreeSha: envelope.criticalBindings.repositoryTreeSha,
    trackedPathsSha256:
      envelope.criticalBindings.productionCutoverIdentityManifest.repository
        .trackedPathsSha256,
    targetAbsenceAttestationHash:
      envelope.criticalBindings.targetAbsenceAttestationHash,
    noDriftAttestationHash: envelope.criticalBindings.noDriftAttestationHash,
    selectorPath: executionPackage.selectorPreimage.selectorPath,
    selectorPreimageSha256: envelope.criticalBindings.selectorPreimageSha256,
    targets: expectedTargets.map((target) => ({
      market: target.market, targetPath: target.targetPath,
      exists: false, preimageSha256: null,
    })),
  };
  const state = {
    claimed: false, terminalState: null, receipt: null,
    selectorSha256: envelope.criticalBindings.selectorPreimageSha256,
    replacements: [], selectorMutations: 0, rollbackCount: 0,
  };
  function resource(method, context) {
    return subject.hashContract("FINPLE_STEP114_2X_Z_SYNTHETIC_RESOURCE\0", {
      method, operationId: context.operationId, idempotencyKey: context.idempotencyKey,
    });
  }
  async function mutate(method, payload, context, action, success) {
    calls.push({ capability: this.capabilityName, method,
      operationId: context.operationId, idempotencyKey: context.idempotencyKey });
    const fault = faults[method];
    if (fault === "throw_not_committed") {
      outcomes.set(context.operationId, { outcome: "not_committed", resourceHash: null });
      throw new Error("synthetic_failure");
    }
    if (fault === "already_consumed") return { outcome: "already_consumed", claimHash: null };
    if (fault === "bad_result") return { outcome: "invalid" };
    if (fault === "ambiguous") {
      outcomes.set(context.operationId, { outcome: "ambiguous", resourceHash: null });
      return never();
    }
    action();
    const hash = resource(method, context);
    outcomes.set(context.operationId, { outcome: "committed", resourceHash: hash });
    if (fault === "timeout_after_commit") return never();
    if (fault === "throw_after_commit") throw new Error("synthetic_late_failure");
    return success(hash);
  }
  function descriptor(name) { return subject.buildCapabilityDescriptor(name); }
  function reconciliation(name) {
    return async ({ operationId }, context) => {
      calls.push({ capability: name, method: "reconcileOperationOutcome",
        operationId: context.operationId, idempotencyKey: context.idempotencyKey });
      return outcomes.get(operationId) || { outcome: "ambiguous", resourceHash: null };
    };
  }

  const singleUseCutoverEnvelopeStore = {
    descriptor: descriptor("singleUseCutoverEnvelopeStore"),
    async acquireEnvelopeClaim(payload, context) {
      return mutate.call({ capabilityName: "singleUseCutoverEnvelopeStore" },
        "acquireEnvelopeClaim", payload, context, () => {
          if (state.claimed) return;
          state.claimed = true;
        }, (hash) => state.claimed && state.terminalState === null
          ? { outcome: "acquired", claimHash: hash }
          : { outcome: "already_consumed", claimHash: null });
    },
    reconcileOperationOutcome: reconciliation("singleUseCutoverEnvelopeStore"),
    async terminalizeEnvelopeClaim(payload, context) {
      return mutate.call({ capabilityName: "singleUseCutoverEnvelopeStore" },
        "terminalizeEnvelopeClaim", payload, context,
        () => { state.terminalState = payload.terminalState; },
        (hash) => ({ outcome: "terminalized", terminalState: payload.terminalState,
          terminalizationHash: hash }));
    },
  };
  const cutoverClock = {
    descriptor: descriptor("cutoverClock"),
    async readCutoverClock(payload, context) {
      calls.push({ capability: "cutoverClock", method: "readCutoverClock",
        operationId: context.operationId, idempotencyKey: context.idempotencyKey });
      if (faults.readCutoverClock === "throw_not_committed") throw new Error("clock");
      if (faults.readCutoverClock === "timeout") return never();
      return { instant: faults.readCutoverClock === "drift"
        ? "2026-07-18T00:03:29.000Z" : payload.expectedInstant };
    },
  };
  const cutoverPreimageReader = {
    descriptor: descriptor("cutoverPreimageReader"),
    async readBoundPreimages(payload, context) {
      calls.push({ capability: "cutoverPreimageReader", method: "readBoundPreimages",
        operationId: context.operationId, idempotencyKey: context.idempotencyKey });
      if (faults.readBoundPreimages === "throw_not_committed") throw new Error("read");
      const snapshot = clone(preimage);
      if (state.selectorSha256 !== preimage.selectorPreimageSha256 || targets.size > 0) {
        snapshot.selectorPreimageSha256 = state.selectorSha256;
        snapshot.targets = expectedTargets.map((target) => ({
          market: target.market, targetPath: target.targetPath,
          exists: targets.has(target.targetPath),
          preimageSha256: targets.get(target.targetPath)?.contentSha256 || null,
        }));
      }
      if (faults.readBoundPreimages === "drift") snapshot.repositoryTreeSha = "f".repeat(40);
      return frozen(snapshot);
    },
    async readProductionCsvIdentity(payload, context) {
      calls.push({ capability: "cutoverPreimageReader",
        method: "readProductionCsvIdentity", operationId: context.operationId,
        idempotencyKey: context.idempotencyKey });
      const identity = clone(targets.get(payload.targetPath) || {});
      if (faults[`readProductionCsvIdentity:${payload.market}`] === "drift") {
        identity.contentSha256 = "e".repeat(64);
      }
      return frozen(identity);
    },
    async readPostCutoverState(payload, context) {
      calls.push({ capability: "cutoverPreimageReader", method: "readPostCutoverState",
        operationId: context.operationId, idempotencyKey: context.idempotencyKey });
      const result = clone(payload.expectedPostState);
      if (faults.readPostCutoverState === "drift") result.selectorMutationCount = 2;
      return frozen(result);
    },
  };
  const atomicProductionCsvReplacer = {
    descriptor: descriptor("atomicProductionCsvReplacer"),
    async replaceProductionCsvAtomically(payload, context) {
      return mutate.call({ capabilityName: "atomicProductionCsvReplacer" },
        `replaceProductionCsvAtomically:${payload.market}`, payload, context, () => {
          const target = expectedTargets.find((item) => item.market === payload.market);
          targets.set(payload.targetPath, {
            market: target.market, targetPath: target.targetPath,
            contentSha256: target.contentSha256,
            schemaVersion: target.schemaVersion,
            schemaIdentitySha256: target.schemaIdentitySha256,
            datasetIdentityHash: target.datasetIdentityHash,
            rowCount: target.rowCount, byteCount: target.byteCount,
          });
          state.replacements.push(payload.market);
        }, (hash) => ({ outcome: "replaced", replacementHash: hash }));
    },
    reconcileOperationOutcome: reconciliation("atomicProductionCsvReplacer"),
  };
  const selectorMutationCoordinator = {
    descriptor: descriptor("selectorMutationCoordinator"),
    async mutateSelectorExactlyOnce(payload, context) {
      return mutate.call({ capabilityName: "selectorMutationCoordinator" },
        "mutateSelectorExactlyOnce", payload, context, () => {
          state.selectorSha256 = payload.selectorExpectedPostimageSha256;
          state.selectorMutations++;
        }, (hash) => ({ outcome: "mutated", mutationHash: hash }));
    },
    reconcileOperationOutcome: reconciliation("selectorMutationCoordinator"),
  };
  const cutoverReceiptStore = {
    descriptor: descriptor("cutoverReceiptStore"),
    async persistCutoverReceipt(payload, context) {
      return mutate.call({ capabilityName: "cutoverReceiptStore" },
        "persistCutoverReceipt", payload, context,
        () => { state.receipt = clone(payload); },
        (hash) => ({ outcome: "persisted", receiptStoreHash: hash }));
    },
    reconcileOperationOutcome: reconciliation("cutoverReceiptStore"),
  };
  const rollbackCoordinator = {
    descriptor: descriptor("rollbackCoordinator"),
    async restoreBoundPreimages(payload, context) {
      return mutate.call({ capabilityName: "rollbackCoordinator" },
        "restoreBoundPreimages", payload, context, () => {
          targets.clear(); state.replacements = [];
          state.selectorSha256 = preimage.selectorPreimageSha256;
          state.selectorMutations = 0; state.rollbackCount++;
        }, (hash) => ({ outcome: "restored", restorationHash: hash }));
    },
    reconcileOperationOutcome: reconciliation("rollbackCoordinator"),
  };
  return { capabilities: { singleUseCutoverEnvelopeStore, cutoverClock,
    cutoverPreimageReader, atomicProductionCsvReplacer,
    selectorMutationCoordinator, cutoverReceiptStore, rollbackCoordinator },
  calls, state, outcomes, preimage };
}

let cachedStepY;
function baseStepY() {
  if (cachedStepY) return cachedStepY;
  const y = stepYFixture.buildFixture();
  const result = stepY.evaluateProductionCutoverApproval(y.packet);
  if (!result.ok) throw new Error(`step_y_fixture_invalid:${result.blockingIssues.join(",")}`);
  const direct = stepY.directValidateStepX(y.packet.stepXPacket, y.packet.stepXResult);
  cachedStepY = { y, result, direct };
  return cachedStepY;
}

function buildFixture({ faults = {} } = {}) {
  const { y, result, direct } = baseStepY();
  const doubles = makeCapabilities(result.singleUseProductionCutoverEnvelope,
    direct.bound.executionPackage, faults);
  const packet = {
    mergedMainSha: subject.MERGED_MAIN_SHA,
    stepYPacket: y.packet, stepYResult: result,
    executionClockInstant: EXECUTION_CLOCK,
    ...doubles.capabilities,
  };
  return { packet, stepYFixture: y, stepYResult: result,
    direct, envelope: result.singleUseProductionCutoverEnvelope, ...doubles };
}

module.exports = {
  EXECUTION_CLOCK, baseStepY, buildFixture, clone, frozen, makeCapabilities,
};
