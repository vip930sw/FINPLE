import express from "express";

import { requireAdminAccess } from "../middleware/adminGuard.js";
import { buildAdminKisReadOnlyProviderCallInventoryPreflightStatus } from "../services/tradingKisReadOnlyProviderCallInventoryPreflight.js";
import { buildAdminManualApprovalClearanceReviewResultGateStatus } from "../services/tradingManualApprovalClearanceReviewResultGate.js";
import { buildAdminManualApprovalOrderDraftClearancePreflightStatus } from "../services/tradingManualApprovalOrderDraftClearancePreflightGate.js";
import { buildAdminManualApprovalOrderDraftReviewResultGateStatus } from "../services/tradingManualApprovalOrderDraftReviewResultGate.js";
import { buildAdminManualApprovalOrderDraftPreflightStatus } from "../services/tradingManualApprovalOrderDraftPreflight.js";
import { buildAdminProviderResponseEnvelopeValidationStatus } from "../services/tradingProviderResponseEnvelopeValidationReceipt.js";
import { buildAdminProviderResponseValidationReviewResultStatus } from "../services/tradingProviderResponseValidationReviewResultGate.js";
import { buildTradingReadinessSnapshot } from "../services/tradingImplementationShell.js";
import { buildAdminRiskKillSwitchReviewStatus } from "../services/tradingRiskKillSwitchReviewCore.js";
import { buildAdminRiskKillSwitchReviewResultGateStatus } from "../services/tradingRiskKillSwitchReviewResultGate.js";
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

router.get("/risk-kill-switch-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminRiskKillSwitchReviewResultGateStatus());
  });
});

router.get("/manual-approval-order-draft-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminManualApprovalOrderDraftPreflightStatus());
  });
});

router.get("/manual-approval-order-draft-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminManualApprovalOrderDraftReviewResultGateStatus());
  });
});

router.get("/manual-approval-order-draft-clearance-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminManualApprovalOrderDraftClearancePreflightStatus());
  });
});

router.get("/manual-approval-clearance-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminManualApprovalClearanceReviewResultGateStatus());
  });
});

router.get("/kis-read-only-provider-call-inventory-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminKisReadOnlyProviderCallInventoryPreflightStatus());
  });
});

router.get("/provider-response-envelope-validation", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminProviderResponseEnvelopeValidationStatus());
  });
});

router.get("/provider-response-validation-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminProviderResponseValidationReviewResultStatus());
  });
});

export default router;
