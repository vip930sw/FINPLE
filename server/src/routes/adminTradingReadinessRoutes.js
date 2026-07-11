import express from "express";

import { requireAdminAccess } from "../middleware/adminGuard.js";
import {
  buildAdminTradingLabDashboardUxPolishCoreStatus,
  buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus,
  buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus,
  buildAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus,
  buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus,
  buildAdminTradingLabDashboardUxPolishReviewResultStatus,
  buildAdminTradingLabDashboardUxPolishPreflightStatus,
  buildAdminTradingLabDashboardStatus,
  buildAdminTradingLabMockFillSimulationCorePreflightStatus,
  buildAdminTradingLabMockFillSimulationCoreReviewResultStatus,
  buildAdminTradingLabMockFillSimulationCoreStatus,
  buildAdminTradingLabMockTradingRunSummaryPreflightStatus,
  buildAdminTradingLabMockDashboardCleanupCoreStatus,
  buildAdminTradingLabMockDashboardCleanupCoreReviewResultStatus,
  buildAdminTradingLabMockDashboardCleanupPreflightStatus,
  buildAdminTradingLabMockDashboardCleanupReviewResultStatus,
  buildAdminTradingLabMockTradingRunSummaryCoreStatus,
  buildAdminTradingLabMockTradingRunSummaryReviewResultStatus,
  buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus,
  buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus,
  buildAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus,
  buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus,
  buildAdminTradingLabMockPortfolioPerformanceRecalculationPreflightStatus,
  buildAdminTradingLabMockPortfolioLedgerUpdateCoreStatus,
  buildAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus,
  buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus,
  buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus,
  buildAdminTradingLabMockPortfolioLedgerUpdateReviewResultStatus,
  buildAdminTradingLabMockFillSimulationReviewResultStatus,
  buildAdminTradingLabMockFillSimulationPreflightStatus,
  buildAdminTradingLabMockExecutionPreflightStatus,
  buildAdminTradingLabMockExecutionReviewResultStatus,
  buildAdminTradingLabMockOrderGenerationPreflightStatus,
  buildAdminTradingLabMockOrderGenerationReviewResultStatus,
  buildAdminTradingLabMockRunCandidatePreflightStatus,
  buildAdminTradingLabStrategyDraftClearancePreflightStatus,
  buildAdminTradingLabStrategyDraftClearanceReviewResultStatus,
  buildAdminTradingLabStrategyDraftReviewResultStatus,
  buildAdminTradingLabStrategyDraftReviewStatus,
  buildAdminTradingLabStrategyDraftStatus,
} from "../services/tradingAdminLabDashboardShell.js";
import { buildAdminProviderCallPolicyStatus } from "../services/tradingProviderCallPolicyCore.js";
import { buildAdminKisReadOnlyQuoteAdapterOptInPreflightStatus } from "../services/tradingKisReadOnlyQuoteAdapterOptInPreflightBoundary.js";
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

router.get("/provider-call-policy", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminProviderCallPolicyStatus());
  });
});

router.get("/kis-read-only-quote-adapter-opt-in-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminKisReadOnlyQuoteAdapterOptInPreflightStatus());
  });
});

router.get("/trading-lab-dashboard", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabDashboardStatus());
  });
});

router.get("/trading-lab-strategy-draft", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabStrategyDraftStatus());
  });
});

router.get("/trading-lab-strategy-draft-review", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabStrategyDraftReviewStatus());
  });
});

router.get("/trading-lab-strategy-draft-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabStrategyDraftReviewResultStatus());
  });
});

router.get("/trading-lab-strategy-draft-clearance-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabStrategyDraftClearancePreflightStatus());
  });
});

router.get("/trading-lab-strategy-draft-clearance-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabStrategyDraftClearanceReviewResultStatus());
  });
});

router.get("/trading-lab-mock-run-candidate-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockRunCandidatePreflightStatus());
  });
});

router.get("/trading-lab-mock-order-generation-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockOrderGenerationPreflightStatus());
  });
});

router.get("/trading-lab-mock-order-generation-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockOrderGenerationReviewResultStatus());
  });
});

router.get("/trading-lab-mock-execution-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockExecutionPreflightStatus());
  });
});

router.get("/trading-lab-mock-execution-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockExecutionReviewResultStatus());
  });
});

router.get("/trading-lab-mock-fill-simulation-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockFillSimulationPreflightStatus());
  });
});

router.get("/trading-lab-mock-fill-simulation-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockFillSimulationReviewResultStatus());
  });
});

router.get("/trading-lab-mock-fill-simulation-core-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockFillSimulationCorePreflightStatus());
  });
});

router.get("/trading-lab-mock-fill-simulation-core-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockFillSimulationCoreReviewResultStatus());
  });
});

router.get("/trading-lab-mock-fill-simulation-core", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockFillSimulationCoreStatus());
  });
});

router.get("/trading-lab-mock-portfolio-ledger-update-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus());
  });
});

router.get("/trading-lab-mock-portfolio-ledger-update-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioLedgerUpdateReviewResultStatus());
  });
});

router.get("/trading-lab-mock-portfolio-ledger-update-core-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus());
  });
});

router.get("/trading-lab-mock-portfolio-ledger-update-core-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus());
  });
});

router.get("/trading-lab-mock-portfolio-ledger-update-core", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioLedgerUpdateCoreStatus());
  });
});

router.get("/trading-lab-mock-portfolio-performance-recalculation-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioPerformanceRecalculationPreflightStatus());
  });
});

router.get("/trading-lab-mock-portfolio-performance-recalculation-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus());
  });
});

router.get("/trading-lab-mock-portfolio-performance-recalculation-core-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus());
  });
});

router.get("/trading-lab-mock-portfolio-performance-recalculation-core-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus());
  });
});

router.get("/trading-lab-mock-portfolio-performance-recalculation-core", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus());
  });
});

router.get("/trading-lab-mock-trading-run-summary-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockTradingRunSummaryPreflightStatus());
  });
});

router.get("/trading-lab-mock-trading-run-summary-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockTradingRunSummaryReviewResultStatus());
  });
});

router.get("/trading-lab-mock-trading-run-summary-core", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockTradingRunSummaryCoreStatus());
  });
});

router.get("/trading-lab-mock-dashboard-cleanup-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockDashboardCleanupPreflightStatus());
  });
});

router.get("/trading-lab-mock-dashboard-cleanup-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockDashboardCleanupReviewResultStatus());
  });
});

router.get("/trading-lab-mock-dashboard-cleanup-core", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockDashboardCleanupCoreStatus());
  });
});

router.get("/trading-lab-mock-dashboard-cleanup-core-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabMockDashboardCleanupCoreReviewResultStatus());
  });
});

router.get("/trading-lab-dashboard-ux-polish-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabDashboardUxPolishPreflightStatus());
  });
});

router.get("/trading-lab-dashboard-ux-polish-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabDashboardUxPolishReviewResultStatus());
  });
});

router.get("/trading-lab-dashboard-ux-polish-core", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabDashboardUxPolishCoreStatus());
  });
});

router.get("/trading-lab-db-backed-mock-trading-history-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabDbBackedMockTradingHistoryPreflightStatus());
  });
});

router.get("/trading-lab-db-backed-mock-trading-history-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus());
  });
});

router.get("/trading-lab-db-backed-mock-trading-history-migration-preflight", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus());
  });
});

router.get("/trading-lab-db-backed-mock-trading-history-migration-review-result", (request, response) => {
  requireAdminAccess(request, response, () => {
    response.json(buildAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus());
  });
});

export default router;
