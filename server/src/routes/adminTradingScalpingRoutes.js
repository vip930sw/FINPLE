import express from "express";

import { requireAdminAccess } from "../middleware/adminGuard.js";
import {
  readKisShadowFeedRuntimeStatus,
  startKisShadowFeedRuntime,
  stopKisShadowFeedRuntime,
} from "../services/tradingKisShadowFeedRuntimeService.js";
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
  requireAdminAccess(request, response, () => {
    startKisShadowFeedRuntime(
      feedStartInput(request.body),
      { actor: adminActor(request) },
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
