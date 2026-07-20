"use strict";

const stepTFixture = require("./metrics-cutover-live-observation-controlled-runner-fixture.cjs");
const stepVFixture = require("./metrics-cutover-live-observation-external-execution-approval-fixture.cjs");
const stepV = require("../lib/metrics-cutover-live-observation-external-execution-approval.cjs");
const subject = require("../lib/metrics-cutover-live-observation-signed-envelope-executor.cjs");

const CLOCK = "2026-07-18T00:03:25.000Z";
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function deepFreeze(value) {
  if (value && (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}

function buildEnvelopeStore(options = {}) {
  const calls = [];
  let consumed = false;
  const select = async (name, fallback, ...args) => {
    const value = Object.prototype.hasOwnProperty.call(options, name)
      ? options[name] : fallback;
    return typeof value === "function" ? value(...args) : value;
  };
  const wrap = (name, fn) => async (...args) => {
    calls.push(name);
    if (Array.isArray(options.operationContexts)) {
      const context = args.at(-1);
      options.operationContexts.push({ name, operationId: context.operationId,
        idempotencyKey: context.idempotencyKey, deadline: context.deadline,
        hasAbortSignal: context.abortSignal instanceof AbortSignal,
        abortSignal: context.abortSignal });
    }
    return fn(...args);
  };
  const store = {
    descriptor: subject.buildExecutionEnvelopeStoreDescriptor(
      options.descriptorOverrides || {}),
    acquireExecutionEnvelopeClaim: wrap("acquireExecutionEnvelopeClaim",
      async (claim, context) => {
        if (options.acquireHang) return new Promise(() => {});
        if (options.acquireError) throw new Error(options.acquireError);
        if (Object.prototype.hasOwnProperty.call(options, "acquire")) {
          return select("acquire", null, claim, context);
        }
        if (consumed) return { outcome: "already_consumed", claimHash: null };
        consumed = true;
        return { outcome: "acquired", claimHash: "6".repeat(64) };
      }),
    reconcileOperationOutcome: wrap("reconcileOperationOutcome",
      (...args) => options.reconciliationHang ? new Promise(() => {}) :
        select("reconciliation", { outcome: "aborted", resourceHash: null }, ...args)),
    finalizeExecutionEnvelopeClaim: wrap("finalizeExecutionEnvelopeClaim",
      async (input, context) => {
        if (options.finalizeHang) return new Promise(() => {});
        if (options.finalizeError) throw new Error(options.finalizeError);
        return select("finalize", { outcome: "finalized",
          terminalState: input.terminalState,
          terminalizationHash: "7".repeat(64) }, input, context);
      }),
  };
  return { store, calls, get consumed() { return consumed; } };
}

function buildFixture(options = {}) {
  const runner = stepTFixture.buildFixture({
    clock: options.executionClockInstant || CLOCK,
    ...(options.runnerOptions || {}),
  });
  const v = stepVFixture.buildFixture({
    stepUOptions: { runtimeCapabilities: runner.packet.runtimeCapabilities,
      ...(options.stepUOptions || {}) },
    ...(options.stepVOptions || {}),
  });
  const stepVResult = options.stepVResult || stepV.evaluateExternalExecutionApproval(v.packet);
  if (!stepVResult.ok) throw new Error(JSON.stringify(stepVResult.blockingIssues));
  const envelopeStore = options.envelopeStore || buildEnvelopeStore(options.storeOptions || {});
  const packet = {
    mergedMainSha: options.mergedMainSha || subject.MERGED_MAIN_SHA,
    stepVPacket: options.stepVPacket || v.packet,
    stepVResult,
    singleUseExternalExecutionEnvelopeStore: envelopeStore.store,
    executionClockInstant: options.executionClockInstant || CLOCK,
  };
  deepFreeze(packet.stepVPacket);
  deepFreeze(packet.stepVResult);
  return { packet, envelopeStore, runnerCalls: runner.calls,
    stepVFixture: v, stepVResult };
}

module.exports = { CLOCK, buildEnvelopeStore, buildFixture, clone };
