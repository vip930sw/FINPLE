import { randomUUID } from "node:crypto";

import {
  createTradingShadowRun,
  getLatestTradingShadowSnapshot,
  getTradingShadowRuntimeStatus,
  saveTradingShadowSnapshot,
  stopTradingShadowRun,
} from "../db/tradingShadowSnapshotRepository.js";
import {
  getTradingStrategyRegistrySnapshot,
  SCALPING_STRATEGY_REGISTRY_KEY,
} from "../db/tradingStrategyRegistryRepository.js";
import { createLeveragedEtfShadowWorker } from "./tradingLeveragedEtfShadowWorker.js";

let activeRuntime = null;

function clean(value) {
  return String(value ?? "").trim();
}

function positive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function runtimeError(code, message, statusCode = 400, details = []) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function latestApprovedVersion(snapshot) {
  return (snapshot.versions || [])
    .filter((version) => version.status === "approved")
    .sort((left, right) => Number(right.versionNumber) - Number(left.versionNumber))[0] || null;
}

function statusEnvelope(snapshot, persistence, active = false) {
  return {
    ok: true,
    active,
    mode: "private_shadow_completed_bar_cycle",
    snapshot,
    persistence,
    safety: {
      adminOnly: true,
      virtualOnly: true,
      providerCallsAllowed: false,
      providerConnectionStarted: false,
      brokerOrderAdapterPresent: false,
      orderSubmissionAllowed: false,
      liveActivationAllowed: false,
      rawProviderPayloadStored: false,
      accountIdentifierStored: false,
    },
  };
}

export function resetScalpingShadowRuntimeForTest() {
  activeRuntime = null;
}

export async function readScalpingShadowRuntimeStatus(options = {}, dependencies = {}) {
  const runtimeStatus = await (dependencies.getRuntimeStatus ?? getTradingShadowRuntimeStatus)(dependencies);
  if (activeRuntime) {
    return statusEnvelope(activeRuntime.worker.getSnapshot(), runtimeStatus, true);
  }
  const latest = await (dependencies.getLatestSnapshot ?? getLatestTradingShadowSnapshot)(options, dependencies);
  return statusEnvelope(latest.snapshot, latest.persistence || runtimeStatus, false);
}

export async function startScalpingShadowRuntime(input = {}, options = {}, dependencies = {}) {
  if (activeRuntime) {
    throw runtimeError("SHADOW_RUNTIME_ALREADY_ACTIVE", "이미 실행 중인 Shadow runtime이 있습니다.", 409);
  }
  const initialCash = positive(input.initialCash);
  if (initialCash === null) {
    throw runtimeError("INVALID_SHADOW_INITIAL_CASH", "양수의 가상 초기자산이 필요합니다.");
  }
  const registry = await (dependencies.getRegistrySnapshot ?? getTradingStrategyRegistrySnapshot)(
    { strategyKey: SCALPING_STRATEGY_REGISTRY_KEY },
    dependencies,
  );
  const approvedVersion = input.strategyVersionId
    ? (registry.versions || []).find((version) => version.id === input.strategyVersionId && version.status === "approved")
    : latestApprovedVersion(registry);
  if (!approvedVersion) {
    throw runtimeError(
      "APPROVED_SCALPING_VERSION_REQUIRED",
      "Shadow runtime을 시작할 승인 전략 버전이 없습니다.",
      409,
      ["request_review_and_create_approved_snapshot_first"],
    );
  }

  const runId = clean(input.runId) || randomUUID();
  const startedAt = options.startedAt || new Date().toISOString();
  const runResult = await (dependencies.createRun ?? createTradingShadowRun)(
    {
      id: runId,
      strategyKey: SCALPING_STRATEGY_REGISTRY_KEY,
      strategyVersionId: approvedVersion.id,
      strategyVersionNumber: approvedVersion.versionNumber,
      strategyChecksum: approvedVersion.checksum,
      initialCash,
      startedAt,
      createdBy: clean(options.actor) || "admin_console",
    },
    dependencies,
  );

  const saveSnapshot = dependencies.saveSnapshot ?? saveTradingShadowSnapshot;
  const workerFactory = dependencies.workerFactory ?? createLeveragedEtfShadowWorker;
  const worker = workerFactory(
    {
      approvedVersion,
      initialCash,
      executionConfig: input.executionConfig,
      promotionPolicy: input.promotionPolicy,
    },
    {
      ...(dependencies.workerDependencies || {}),
      idFactory: () => runId,
      now: dependencies.now ?? (() => new Date().toISOString()),
      snapshotSink: async (snapshot) => saveSnapshot(snapshot, dependencies),
    },
  );
  const snapshot = worker.start();
  await saveSnapshot(snapshot, dependencies);
  activeRuntime = {
    runId,
    worker,
    run: runResult.run,
    approvedVersion,
    persistence: runResult.persistence,
  };
  return statusEnvelope(snapshot, runResult.persistence, true);
}

export async function ingestScalpingShadowCycle(input = {}, dependencies = {}) {
  if (!activeRuntime) {
    throw runtimeError("SHADOW_RUNTIME_NOT_ACTIVE", "실행 중인 Shadow runtime이 없습니다.", 409);
  }
  const snapshot = await activeRuntime.worker.ingestCycle({ bars: input.bars || [] });
  return statusEnvelope(snapshot, activeRuntime.persistence, true);
}

export async function stopScalpingShadowRuntime(input = {}, options = {}, dependencies = {}) {
  if (!activeRuntime) {
    throw runtimeError("SHADOW_RUNTIME_NOT_ACTIVE", "실행 중인 Shadow runtime이 없습니다.", 409);
  }
  const current = activeRuntime;
  const reason = clean(input.reason) || "operator_stop";
  const snapshot = await current.worker.stop(reason);
  await (dependencies.stopRun ?? stopTradingShadowRun)(
    current.runId,
    {
      reason,
      stoppedAt: options.stoppedAt || new Date().toISOString(),
      actor: clean(options.actor) || "admin_console",
    },
    dependencies,
  );
  activeRuntime = null;
  return statusEnvelope(snapshot, current.persistence, false);
}
