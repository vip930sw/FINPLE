import express from "express";

import { requireAdminAccess } from "../middleware/adminGuard.js";
import { buildTradingReadinessSnapshot } from "../services/tradingImplementationShell.js";
import { buildReadOnlyShadowStatusHistory } from "../services/tradingShadowLedger.js";

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

export default router;
