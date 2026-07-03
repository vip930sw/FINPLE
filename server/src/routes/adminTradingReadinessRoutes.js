import express from "express";

import { requireAdminAccess } from "../middleware/adminGuard.js";
import { buildTradingReadinessSnapshot } from "../services/tradingImplementationShell.js";
import { buildAdminRiskKillSwitchReviewStatus } from "../services/tradingRiskKillSwitchReviewCore.js";
import { buildReadOnlyShadowStatusHistory } from "../services/tradingShadowLedger.js";
import { buildAdminShadowReviewGateStatus } from "../services/tradingShadowReviewGate.js";

const router = express.Router();

router.get("/readiness", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json({
      ...buildTradingReadinessSnapshot(),
      adminOnly: true,
      publicDashboardExposed: false,
    });
  });
});

router.get("/shadow-status", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildReadOnlyShadowStatusHistory());
  });
});

router.get("/shadow-review", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminShadowReviewGateStatus());
  });
});

router.get("/risk-kill-switch", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminRiskKillSwitchReviewStatus());
  });
});

export default router;
