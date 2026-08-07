import express from "express";

import { getDatabasePoolStats, isDatabaseConfigured } from "../db/database.js";
import { requireAdminAccess, requireAdminStartAccess } from "../middleware/adminGuard.js";
import { getDeploymentInfo } from "../services/deploymentInfo.js";
import { readKisConnectionLease } from "../services/tradingKisConnectionLease.js";
import {
  readKisHistoricalCaptureRuntimeStatus,
  sealKisHistoricalCaptureSession,
  startKisHistoricalCaptureRuntime,
  stopKisHistoricalCaptureRuntime,
} from "../services/tradingKisHistoricalCaptureRuntimeService.js";
import {
  readKisShadowFeedRuntimeStatus,
  startKisShadowFeedRuntime,
  stopKisShadowFeedRuntime,
} from "../services/tradingKisShadowFeedRuntimeService.js";
import {
  readKisProviderSmokeRuntimeStatus,
  startKisProviderSmokeRuntime,
  stopKisProviderSmokeRuntime,
} from "../services/tradingKisProviderSmokeRuntimeService.js";
import {
  acknowledgeScalpingModelSignalCircuitBreaker,
  readScalpingModelSignalRuntimeStatus,
} from "../services/tradingScalpingModelSignalRuntimeService.js";
import {
  approveScalpingStrategyAdminDraft,
  readScalpingStrategyAdminDashboard,
  requestScalpingStrategyAdminReview,
  retireScalpingStrategyAdminVersion,
  saveScalpingStrategyAdminDraft,
} from "../services/tradingScalpingStrategyRegistryService.js";
import {
  readScalpingShadowRuntimeStatus,
  startScalpingShadowRuntime,
  stopScalpingShadowRuntime,
} from "../services/tradingScalpingShadowRuntimeService.js";

const router = express.Router();
const CAPTURE_STATUS_ROUTE = "GET /api/admin/trading-readiness/scalping-kis-capture";

function safeIdentifier(value, fallback = null) {
  const normalized = String(value || "").replace(/[^A-Za-z0-9_.:-]/g, "_").slice(0, 80);
  return normalized || fallback;
}

function createCaptureStatusLifecycle(request, response, dependencies = {}) {
  const monotonicNow = dependencies.monotonicNow ?? (() => performance.now());
  const startedAt = monotonicNow();
  const deploymentSha = (dependencies.getDeploymentInfo ?? getDeploymentInfo)().commitSha || null;
  const poolStats = dependencies.getPoolStats ?? getDatabasePoolStats;
  const writer = dependencies.log ?? ((payload) => console.info(JSON.stringify(payload)));
  let lastEventAt = startedAt;
  let requestFailureLogged = false;
  const state = {
    clientDisconnected: false,
    databaseConfigured: (dependencies.isDatabaseConfigured ?? isDatabaseConfigured)(),
    schemaReady: null,
    persistenceMode: null,
  };

  function emit(event, details = {}) {
    if (details.databaseConfigured !== undefined) state.databaseConfigured = details.databaseConfigured === true;
    if (details.schemaReady !== undefined) state.schemaReady = details.schemaReady;
    if (details.persistenceMode !== undefined) state.persistenceMode = details.persistenceMode;
    const current = monotonicNow();
    const stageMs = Number.isFinite(Number(details.stageMs)) ? Number(details.stageMs) : current - lastEventAt;
    lastEventAt = current;
    const pool = details.pool ?? poolStats();
    const error = details.error;
    try {
      writer({
        type: "capture_status_lifecycle",
        event,
        requestId: request.requestId || null,
        route: CAPTURE_STATUS_ROUTE,
        elapsedMs: Math.round(current - startedAt),
        stageMs: Math.round(stageMs),
        httpStatus: Number(details.httpStatus ?? response.statusCode) || null,
        deploymentSha,
        databaseConfigured: state.databaseConfigured,
        schemaReady: state.schemaReady,
        persistenceMode: state.persistenceMode,
        poolTotalCount: Number(pool?.totalCount || 0),
        poolIdleCount: Number(pool?.idleCount || 0),
        poolWaitingCount: Number(pool?.waitingCount || 0),
        clientDisconnected: state.clientDisconnected,
        errorCode: error ? safeIdentifier(error.code, "CAPTURE_STATUS_REQUEST_FAILED") : null,
        errorClass: error ? safeIdentifier(error.name || error.constructor?.name, "Error") : null,
      });
    } catch {
      // Logging must not change the request outcome.
    }
  }

  function fail(error) {
    if (requestFailureLogged) return;
    requestFailureLogged = true;
    emit("request_failed", { error, httpStatus: Number(error?.statusCode || 500) });
  }

  request.once?.("aborted", () => {
    state.clientDisconnected = true;
    emit("client_aborted");
  });
  response.once?.("finish", () => emit("response_finished"));
  response.once?.("close", () => {
    if (response.writableFinished !== true) state.clientDisconnected = true;
    emit("response_closed");
  });
  response.once?.("error", (error) => {
    state.clientDisconnected = true;
    fail(error);
  });

  emit("request_started", { stageMs: 0 });
  return {
    disconnected: () => state.clientDisconnected,
    emit,
    fail,
    now: monotonicNow,
  };
}

function adminActor(request) {
  return request.get("x-finple-admin-actor") || "admin_console";
}

function safety() {
  return {
    appliesToTradingRuntime: false,
    providerCallsAllowed: false,
    providerConnectionStarted: false,
    brokerOrderAdapterPresent: false,
    orderSubmissionAllowed: false,
    liveActivationAllowed: false,
  };
}

function feedStartInput(body = {}) {
  return {
    maximumCycleLagMs: body.maximumCycleLagMs,
    maximumQuoteAgeMs: body.maximumQuoteAgeMs,
    flushIntervalMs: body.flushIntervalMs,
    maxReconnectAttempts: body.maxReconnectAttempts,
    reconnectPolicy: body.reconnectPolicy,
  };
}

function captureStartInput(body = {}) {
  return {
    selectedSymbols: body.selectedSymbols,
    maximumCycleLagMs: body.maximumCycleLagMs,
    maximumQuoteAgeMs: body.maximumQuoteAgeMs,
    flushIntervalMs: body.flushIntervalMs,
    maxReconnectAttempts: body.maxReconnectAttempts,
    reconnectPolicy: body.reconnectPolicy,
  };
}

router.get("/scalping-dashboard", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    readScalpingStrategyAdminDashboard()
      .then((dashboard) => {
        response.setHeader("Cache-Control", "no-store, max-age=0");
        response.json(dashboard);
      })
      .catch(next);
  });
});

router.put("/scalping-strategy-draft", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    saveScalpingStrategyAdminDraft(request.body ?? {}, { actor: adminActor(request) })
      .then((result) => {
        response.status(result.statusCode || 200).json({
          ...result,
          safety: safety(),
        });
      })
      .catch(next);
  });
});

router.post("/scalping-strategy-draft/review-request", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    requestScalpingStrategyAdminReview(request.body ?? {}, { actor: adminActor(request) })
      .then((result) => response.json({ ...result, safety: safety() }))
      .catch(next);
  });
});

router.post("/scalping-strategy-draft/approve", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    approveScalpingStrategyAdminDraft(request.body ?? {}, { actor: adminActor(request) })
      .then((result) => response.status(201).json({ ...result, safety: safety() }))
      .catch(next);
  });
});

router.post("/scalping-strategy-versions/:versionId/retire", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    retireScalpingStrategyAdminVersion(
      request.params.versionId,
      request.body ?? {},
      { actor: adminActor(request) },
    )
      .then((result) => response.json({ ...result, safety: safety() }))
      .catch(next);
  });
});

router.get("/scalping-shadow", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    readScalpingShadowRuntimeStatus()
      .then((result) => {
        response.setHeader("Cache-Control", "no-store, max-age=0");
        response.json(result);
      })
      .catch(next);
  });
});

router.post("/scalping-shadow/start", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    startScalpingShadowRuntime(
      request.body ?? {},
      { actor: adminActor(request) },
    )
      .then((result) => response.status(201).json({ ...result, safety: safety() }))
      .catch(next);
  });
});

router.post("/scalping-shadow/stop", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    readKisShadowFeedRuntimeStatus()
      .then((feedStatus) => {
        if (feedStatus.active) {
          response.status(409).json({
            ok: false,
            code: "KIS_SHADOW_FEED_ACTIVE",
            message: "KIS Shadow feed를 먼저 정지해야 합니다.",
            details: ["stop_scalping_shadow_feed_first"],
            safety: safety(),
          });
          return null;
        }
        return stopScalpingShadowRuntime(
          request.body ?? {},
          { actor: adminActor(request) },
        );
      })
      .then((result) => {
        if (result) response.json({ ...result, safety: safety() });
      })
      .catch(next);
  });
});

router.get("/scalping-shadow-feed", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    readKisShadowFeedRuntimeStatus()
      .then((result) => {
        response.setHeader("Cache-Control", "no-store, max-age=0");
        response.json(result);
      })
      .catch(next);
  });
});

router.post("/scalping-shadow-feed/start", (request, response, next) => {
  requireAdminStartAccess(request, response, (adminStartAuthorization) => {
    const lease = readKisConnectionLease();
    if (lease?.owner === "kis_historical_capture") {
      response.status(409).json({
        ok: false,
        code: "KIS_CONNECTION_LEASE_CONFLICT",
        message: "KIS 데이터 축적을 먼저 정지해야 Shadow feed를 시작할 수 있습니다.",
        details: ["active_owner:kis_historical_capture"],
        safety: safety(),
      });
      return;
    }
    startKisShadowFeedRuntime(
      feedStartInput(request.body),
      { actor: adminActor(request), adminStartAuthorization },
    )
      .then((result) => response.status(201).json(result))
      .catch(next);
  });
});

router.post("/scalping-shadow-feed/stop", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    stopKisShadowFeedRuntime(
      { reason: request.body?.reason || "admin_console_operator_stop" },
      { actor: adminActor(request) },
    )
      .then((result) => response.json(result))
      .catch(next);
  });
});

export function handleKisProviderSmokeStartRequest(request, response, next) {
  requireAdminStartAccess(request, response, (adminStartAuthorization) => {
    startKisProviderSmokeRuntime({ adminStartAuthorization })
      .then((result) => response.status(201).json(result))
      .catch(next);
  });
}

export function handleKisProviderSmokeStatusRequest(request, response, next) {
  requireAdminAccess(request, response, () => {
    try {
      response.setHeader("Cache-Control", "no-store, max-age=0");
      response.json(readKisProviderSmokeRuntimeStatus());
    } catch (error) {
      next(error);
    }
  });
}

export function handleKisProviderSmokeStopRequest(request, response, next) {
  requireAdminAccess(request, response, () => {
    try {
      response.json(stopKisProviderSmokeRuntime(request.body?.reason));
    } catch (error) {
      next(error);
    }
  });
}

router.post("/scalping-kis-provider-smoke/start", handleKisProviderSmokeStartRequest);
router.get("/scalping-kis-provider-smoke/status", handleKisProviderSmokeStatusRequest);
router.post("/scalping-kis-provider-smoke/stop", handleKisProviderSmokeStopRequest);

export function handleKisHistoricalCaptureStatusRequest(request, response, next, dependencies = {}) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  const lifecycle = createCaptureStatusLifecycle(request, response, dependencies);
  const authStartedAt = lifecycle.now();
  let operation;
  (dependencies.requireAdminAccess ?? requireAdminAccess)(request, response, () => {
    lifecycle.emit("admin_auth_passed", { stageMs: lifecycle.now() - authStartedAt });
    operation = Promise.resolve()
      .then(() => (dependencies.readStatus ?? readKisHistoricalCaptureRuntimeStatus)({}, {
        ...(dependencies.serviceDependencies || {}),
        onLifecycleEvent: ({ event, ...details }) => lifecycle.emit(event, details),
        isClientDisconnected: lifecycle.disconnected,
      }))
      .then((result) => {
        const serializationStartedAt = lifecycle.now();
        response.json(result);
        lifecycle.emit("response_serialized", { stageMs: lifecycle.now() - serializationStartedAt });
      })
      .catch((error) => {
        lifecycle.fail(error);
        if (!lifecycle.disconnected()) next(error);
      });
  });
  return operation;
}

router.get("/scalping-kis-capture", handleKisHistoricalCaptureStatusRequest);

router.post("/scalping-kis-capture/start", (request, response, next) => {
  requireAdminStartAccess(request, response, (adminStartAuthorization) => {
    startKisHistoricalCaptureRuntime(
      captureStartInput(request.body),
      { actor: adminActor(request), adminStartAuthorization },
    )
      .then((result) => response.status(201).json(result))
      .catch(next);
  });
});

router.post("/scalping-kis-capture/stop", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    stopKisHistoricalCaptureRuntime(
      { reason: request.body?.reason || "admin_console_operator_stop" },
      { actor: adminActor(request) },
    )
      .then((result) => response.json(result))
      .catch(next);
  });
});

router.post("/scalping-kis-capture/seal", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    sealKisHistoricalCaptureSession(
      {
        sessionDate: request.body?.sessionDate,
        expectedMinutes: request.body?.expectedMinutes,
        minimumCoverageRatio: request.body?.minimumCoverageRatio,
        selectedSymbols: request.body?.selectedSymbols,
      },
      { actor: adminActor(request) },
    )
      .then((result) => response.status(result.sealed ? 201 : 409).json(result))
      .catch(next);
  });
});

router.get("/scalping-model-signal", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    readScalpingModelSignalRuntimeStatus()
      .then((result) => {
        response.setHeader("Cache-Control", "no-store, max-age=0");
        response.json(result);
      })
      .catch(next);
  });
});

router.post("/scalping-model-signal/acknowledge", (request, response, next) => {
  requireAdminAccess(request, response, () => {
    acknowledgeScalpingModelSignalCircuitBreaker(
      {},
      { actor: adminActor(request) },
    )
      .then((result) => response.json(result))
      .catch(next);
  });
});

export default router;
