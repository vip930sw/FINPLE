import express from "express";

import { requireAdminAccess } from "../middleware/adminGuard.js";
import {
  buildTradingScalpingAdminDashboard,
  updateScalpingAdminDraft,
} from "../services/tradingScalpingAdminDashboard.js";

const router = express.Router();

router.get("/scalping-dashboard", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    response.json(buildTradingScalpingAdminDashboard());
  });
});

router.put("/scalping-strategy-draft", (request, response) => {
  requireAdminAccess(request, response, () => {
    const result = updateScalpingAdminDraft(request.body ?? {}, {
      updatedBy: request.get("x-finple-admin-actor") || "admin_console",
    });
    response.status(result.statusCode).json({
      ok: result.ok,
      code: result.code,
      reasons: result.reasons,
      draft: result.draft,
      dashboard: buildTradingScalpingAdminDashboard({ draft: result.draft }),
      safety: {
        appliesToTradingRuntime: false,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        liveActivationAllowed: false,
      },
    });
  });
});

export default router;
