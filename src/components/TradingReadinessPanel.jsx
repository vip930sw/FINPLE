import { useEffect, useMemo, useState } from "react";

import {
  fetchAdminTradingProviderCallPolicyStatus,
  fetchAdminTradingKisReadOnlyQuoteAdapterOptInPreflightStatus,
  fetchAdminTradingKisReadOnlyProviderCallInventoryPreflightStatus,
  fetchAdminTradingLabDashboardStatus,
  fetchAdminTradingLabMockExecutionPreflightStatus,
  fetchAdminTradingLabMockExecutionReviewResultStatus,
  fetchAdminTradingLabMockFillSimulationCorePreflightStatus,
  fetchAdminTradingLabMockFillSimulationCoreReviewResultStatus,
  fetchAdminTradingLabMockFillSimulationCoreStatus,
  fetchAdminTradingLabMockDashboardCleanupPreflightStatus,
  fetchAdminTradingLabMockTradingRunSummaryPreflightStatus,
  fetchAdminTradingLabMockTradingRunSummaryCoreStatus,
  fetchAdminTradingLabMockTradingRunSummaryReviewResultStatus,
  fetchAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus,
  fetchAdminTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus,
  fetchAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus,
  fetchAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus,
  fetchAdminTradingLabMockPortfolioPerformanceRecalculationPreflightStatus,
  fetchAdminTradingLabMockPortfolioLedgerUpdateCoreStatus,
  fetchAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus,
  fetchAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus,
  fetchAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus,
  fetchAdminTradingLabMockPortfolioLedgerUpdateReviewResultStatus,
  fetchAdminTradingLabMockFillSimulationPreflightStatus,
  fetchAdminTradingLabMockFillSimulationReviewResultStatus,
  fetchAdminTradingLabMockOrderGenerationPreflightStatus,
  fetchAdminTradingLabMockOrderGenerationReviewResultStatus,
  fetchAdminTradingLabMockRunCandidatePreflightStatus,
  fetchAdminTradingLabStrategyDraftClearancePreflightStatus,
  fetchAdminTradingLabStrategyDraftClearanceReviewResultStatus,
  fetchAdminTradingLabStrategyDraftReviewResultStatus,
  fetchAdminTradingLabStrategyDraftReviewStatus,
  fetchAdminTradingLabStrategyDraftStatus,
  fetchAdminTradingManualApprovalClearanceReviewResultStatus,
  fetchAdminTradingManualApprovalOrderDraftClearancePreflightStatus,
  fetchAdminTradingManualApprovalOrderDraftReviewResultStatus,
  fetchAdminTradingManualApprovalOrderDraftPreflightStatus,
  fetchAdminTradingProviderResponseEnvelopeValidationStatus,
  fetchAdminTradingProviderResponseValidationReviewResultStatus,
  fetchAdminTradingRiskKillSwitchReviewResultStatus,
  fetchAdminTradingRiskKillSwitchStatus,
  fetchAdminTradingShadowReviewStatus,
  fetchAdminTradingShadowStatus,
  fetchTradingReadinessStatus,
} from "./portfolio/services/serverPortfolioService";

const FALLBACK_READINESS = Object.freeze({
  ok: true,
  status: "fail_closed_local_fallback",
  tradingMode: "mock",
  flags: {
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
  },
  killSwitch: {
    status: "blocked",
    enabled: true,
    reasons: ["api_unavailable_fail_closed"],
  },
  allowedSymbols: {
    status: "blocked_unknown",
    count: 0,
    wildcard: false,
    symbols: [],
  },
  lastAuditEvent: {
    status: "placeholder_only",
    message: "실제 거래 감사 이벤트는 아직 발생하지 않았습니다.",
  },
});

const FLAG_LABELS = [
  ["providerCallsAllowed", "내부 증권 API 호출", "Provider calls"],
  ["orderSubmissionAllowed", "실제 주문 제출", "Order submission"],
  ["runtimeRouteAllowed", "거래 실행 API", "Runtime route"],
  ["publicUiAllowed", "일반 사용자 화면", "Public UI"],
  ["dbMigrationAllowed", "거래 DB 변경", "DB migration"],
  ["readyForReadOnlyProviderCalls", "읽기 전용 시세 조회", "Read-only provider readiness"],
  ["readyForOrderSubmission", "주문 준비 상태", "Order readiness"],
  ["readyForLiveGuardedTrading", "제한적 실거래 상태", "Live guarded readiness"],
];

const LEGACY_SAFETY_PANEL_LABELS = [
  "Read-only trading shell",
  "Last audit event",
  "Shadow status/history",
  "Review gate",
  "Risk and kill-switch",
  "Review result recording",
  "Manual approval draft",
  "Manual approval draft review",
  "Manual approval clearance preflight",
  "Manual approval clearance review",
  "KIS provider-call inventory",
  "Provider response validation",
  "Provider response validation review",
  "Provider-call policy",
  "KIS quote adapter opt-in",
];

const LEGACY_TRADING_LAB_LABELS = [
  "관리자 Trading Lab",
  "Mock, dry-run, shadow placeholder data only. Provider calls and orders stay blocked.",
  "Mock equity",
  "Cumulative return",
  "Latest daily return",
  "Max drawdown",
  "Position weight",
  "Order candidates",
  "Audit logs",
  "Daily returns",
  "Current allocation",
  "Return path",
  "Daily asset value",
  "Strategy",
  "Performance",
];

const TRADING_PANEL_TABS = [
  {
    key: "lab",
    label: "모의 운용 대시보드",
    description: "KPI·차트·모의 전략",
  },
  {
    key: "safety",
    label: "거래 안전평가",
    description: "차단 상태·게이트 점검",
  },
];

const KPI_LABELS = {
  mock_total_equity: "모의 평가금액",
  mock_cumulative_return: "누적 수익률",
  mock_daily_return: "최근 일별 수익률",
  mock_mdd: "최대 낙폭",
  mock_position_weight: "투자 비중",
  mock_order_candidates: "주문 후보",
};

const DEFAULT_STRATEGY_DRAFT_FORM = Object.freeze({
  strategyName: "Admin mock strategy draft",
  mode: "mock",
  allowedSymbols: "SYMBOL_A_PLACEHOLDER, SYMBOL_B_PLACEHOLDER, SYMBOL_C_PLACEHOLDER",
  targetWeights: "40 / 35 / 25",
  rebalanceRule: "manual_review",
  maxOrderAmount: "placeholder",
  maxDailyLoss: "placeholder",
  maxPositionWeight: "placeholder",
});

const STATUS_LABELS = {
  OPEN: "열림",
  BLOCKED: "차단됨",
  READY: "준비됨",
  PENDING: "확인 필요",
  NOT_READY: "준비 전",
  blocked: "차단됨",
  active_blocking: "차단됨",
  blocked_unknown: "차단됨",
  fail_closed: "오류 시 자동 차단",
  fail_closed_local_fallback: "오류 시 자동 차단",
  pending: "확인 필요",
  validation_pending: "확인 필요",
  not_ready: "준비 전",
  mock: "모의",
  mock_only: "모의 전용",
  dry_run_only: "드라이런 전용",
  shadow_only: "섀도우 전용",
  admin_only: "관리자 전용",
  redacted: "민감정보 제거됨",
  placeholder_only: "자리표시자 전용",
  adapter_blocked: "어댑터 차단됨",
  adapter_boundary_ready: "경계 준비됨",
  opt_in_required: "승인 필요",
  policy_pending: "정책 확인 필요",
  policy_ready: "정책 준비됨",
  review_recorded: "검토 기록됨",
  clearance_not_granted: "최종 승인 전",
  envelope_only: "응답 형식만 확인",
};

function boolStatus(value) {
  return value === true ? "열림" : "차단됨";
}

function statusClass(value) {
  return value === true ? "open" : "blocked";
}

function formatStatus(value) {
  if (typeof value === "boolean") return boolStatus(value);
  const rawValue = String(value || "not_ready");
  return STATUS_LABELS[rawValue] || rawValue.replaceAll("_", " ");
}

function buildSparklinePoints(points, valueKey, width = 320, height = 120) {
  const values = points.map((point) => Number(point?.[valueKey] || 0));
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = Number((index * step).toFixed(2));
      const y = Number((height - ((value - min) / span) * (height - 24) - 12).toFixed(2));
      return `${x},${y}`;
    })
    .join(" ");
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function formatKpiValue(card) {
  const value = Number(card?.value || 0);
  if (card?.valueType === "placeholder_currency") return value.toLocaleString("ko-KR");
  return `${value.toFixed(Number.isInteger(value) ? 0 : 2)}${card?.suffix || ""}`;
}

function formatLabNumber(value, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  if (options.percent) return `${number.toFixed(2)}%`;
  if (options.quantity) return number.toLocaleString("ko-KR", { maximumFractionDigits: 6 });
  return number.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function formatPositionField(position, valueKey, placeholderKey, options = {}) {
  return formatLabNumber(position?.[valueKey], options) || formatStatus(position?.[placeholderKey] || "mock_only");
}

function getInitialTradingPanelTab() {
  if (typeof window === "undefined") return "lab";
  const params = new URLSearchParams(window.location.search);
  return params.get("tab") === "safety" ? "safety" : "lab";
}

function updateTradingPanelTabQuery(nextTab) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (nextTab === "lab") {
    url.searchParams.delete("tab");
  } else {
    url.searchParams.set("tab", "safety");
  }
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function TradingReadinessPanel() {
  const [activeTradingPanelTab, setActiveTradingPanelTab] = useState(getInitialTradingPanelTab);
  const [readiness, setReadiness] = useState(FALLBACK_READINESS);
  const [shadowStatus, setShadowStatus] = useState(null);
  const [shadowReviewStatus, setShadowReviewStatus] = useState(null);
  const [riskKillSwitchStatus, setRiskKillSwitchStatus] = useState(null);
  const [riskKillSwitchReviewResultStatus, setRiskKillSwitchReviewResultStatus] = useState(null);
  const [manualApprovalOrderDraftStatus, setManualApprovalOrderDraftStatus] = useState(null);
  const [manualApprovalOrderDraftReviewResultStatus, setManualApprovalOrderDraftReviewResultStatus] = useState(null);
  const [manualApprovalOrderDraftClearanceStatus, setManualApprovalOrderDraftClearanceStatus] = useState(null);
  const [manualApprovalClearanceReviewResultStatus, setManualApprovalClearanceReviewResultStatus] = useState(null);
  const [kisProviderCallInventoryStatus, setKisProviderCallInventoryStatus] = useState(null);
  const [providerResponseEnvelopeValidationStatus, setProviderResponseEnvelopeValidationStatus] = useState(null);
  const [providerResponseValidationReviewResultStatus, setProviderResponseValidationReviewResultStatus] = useState(null);
  const [providerCallPolicyStatus, setProviderCallPolicyStatus] = useState(null);
  const [kisQuoteAdapterOptInPreflightStatus, setKisQuoteAdapterOptInPreflightStatus] = useState(null);
  const [tradingLabDashboardStatus, setTradingLabDashboardStatus] = useState(null);
  const [tradingLabStrategyDraftStatus, setTradingLabStrategyDraftStatus] = useState(null);
  const [tradingLabStrategyDraftReviewStatus, setTradingLabStrategyDraftReviewStatus] = useState(null);
  const [tradingLabStrategyDraftReviewResultStatus, setTradingLabStrategyDraftReviewResultStatus] = useState(null);
  const [tradingLabStrategyDraftClearancePreflightStatus, setTradingLabStrategyDraftClearancePreflightStatus] = useState(null);
  const [tradingLabStrategyDraftClearanceReviewResultStatus, setTradingLabStrategyDraftClearanceReviewResultStatus] = useState(null);
  const [tradingLabMockRunCandidatePreflightStatus, setTradingLabMockRunCandidatePreflightStatus] = useState(null);
  const [tradingLabMockOrderGenerationPreflightStatus, setTradingLabMockOrderGenerationPreflightStatus] = useState(null);
  const [tradingLabMockOrderGenerationReviewResultStatus, setTradingLabMockOrderGenerationReviewResultStatus] = useState(null);
  const [tradingLabMockExecutionPreflightStatus, setTradingLabMockExecutionPreflightStatus] = useState(null);
  const [tradingLabMockExecutionReviewResultStatus, setTradingLabMockExecutionReviewResultStatus] = useState(null);
  const [tradingLabMockFillSimulationPreflightStatus, setTradingLabMockFillSimulationPreflightStatus] = useState(null);
  const [tradingLabMockFillSimulationReviewResultStatus, setTradingLabMockFillSimulationReviewResultStatus] = useState(null);
  const [tradingLabMockFillSimulationCorePreflightStatus, setTradingLabMockFillSimulationCorePreflightStatus] = useState(null);
  const [tradingLabMockFillSimulationCoreReviewResultStatus, setTradingLabMockFillSimulationCoreReviewResultStatus] = useState(null);
  const [tradingLabMockFillSimulationCoreStatus, setTradingLabMockFillSimulationCoreStatus] = useState(null);
  const [tradingLabMockPortfolioLedgerUpdatePreflightStatus, setTradingLabMockPortfolioLedgerUpdatePreflightStatus] = useState(null);
  const [tradingLabMockPortfolioLedgerUpdateReviewResultStatus, setTradingLabMockPortfolioLedgerUpdateReviewResultStatus] = useState(null);
  const [tradingLabMockPortfolioLedgerUpdateCorePreflightStatus, setTradingLabMockPortfolioLedgerUpdateCorePreflightStatus] = useState(null);
  const [tradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus, setTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus] = useState(null);
  const [tradingLabMockPortfolioLedgerUpdateCoreStatus, setTradingLabMockPortfolioLedgerUpdateCoreStatus] = useState(null);
  const [tradingLabMockPortfolioPerformanceRecalculationPreflightStatus, setTradingLabMockPortfolioPerformanceRecalculationPreflightStatus] = useState(null);
  const [tradingLabMockPortfolioPerformanceRecalculationReviewResultStatus, setTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus] = useState(null);
  const [tradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus, setTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus] = useState(null);
  const [tradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus, setTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus] = useState(null);
  const [tradingLabMockPortfolioPerformanceRecalculationCoreStatus, setTradingLabMockPortfolioPerformanceRecalculationCoreStatus] = useState(null);
  const [tradingLabMockTradingRunSummaryPreflightStatus, setTradingLabMockTradingRunSummaryPreflightStatus] = useState(null);
  const [tradingLabMockTradingRunSummaryReviewResultStatus, setTradingLabMockTradingRunSummaryReviewResultStatus] = useState(null);
  const [tradingLabMockTradingRunSummaryCoreStatus, setTradingLabMockTradingRunSummaryCoreStatus] = useState(null);
  const [tradingLabMockDashboardCleanupPreflightStatus, setTradingLabMockDashboardCleanupPreflightStatus] = useState(null);
  const [strategyDraftForm, setStrategyDraftForm] = useState(DEFAULT_STRATEGY_DRAFT_FORM);
  const [strategyDraftPreview, setStrategyDraftPreview] = useState(null);
  const [loadState, setLoadState] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchTradingReadinessStatus(),
      fetchAdminTradingShadowStatus().catch(() => null),
      fetchAdminTradingShadowReviewStatus().catch(() => null),
      fetchAdminTradingRiskKillSwitchStatus().catch(() => null),
      fetchAdminTradingRiskKillSwitchReviewResultStatus().catch(() => null),
      fetchAdminTradingManualApprovalOrderDraftPreflightStatus().catch(() => null),
      fetchAdminTradingManualApprovalOrderDraftReviewResultStatus().catch(() => null),
      fetchAdminTradingManualApprovalOrderDraftClearancePreflightStatus().catch(() => null),
      fetchAdminTradingManualApprovalClearanceReviewResultStatus().catch(() => null),
      fetchAdminTradingKisReadOnlyProviderCallInventoryPreflightStatus().catch(() => null),
      fetchAdminTradingProviderResponseEnvelopeValidationStatus().catch(() => null),
      fetchAdminTradingProviderResponseValidationReviewResultStatus().catch(() => null),
      fetchAdminTradingProviderCallPolicyStatus().catch(() => null),
      fetchAdminTradingKisReadOnlyQuoteAdapterOptInPreflightStatus().catch(() => null),
      fetchAdminTradingLabDashboardStatus().catch(() => null),
      fetchAdminTradingLabStrategyDraftStatus().catch(() => null),
      fetchAdminTradingLabStrategyDraftReviewStatus().catch(() => null),
      fetchAdminTradingLabStrategyDraftReviewResultStatus().catch(() => null),
      fetchAdminTradingLabStrategyDraftClearancePreflightStatus().catch(() => null),
      fetchAdminTradingLabStrategyDraftClearanceReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockRunCandidatePreflightStatus().catch(() => null),
      fetchAdminTradingLabMockOrderGenerationPreflightStatus().catch(() => null),
      fetchAdminTradingLabMockOrderGenerationReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockExecutionPreflightStatus().catch(() => null),
      fetchAdminTradingLabMockExecutionReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockFillSimulationPreflightStatus().catch(() => null),
      fetchAdminTradingLabMockFillSimulationReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockFillSimulationCorePreflightStatus().catch(() => null),
      fetchAdminTradingLabMockFillSimulationCoreReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockFillSimulationCoreStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioLedgerUpdatePreflightStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioLedgerUpdateReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioLedgerUpdateCorePreflightStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioLedgerUpdateCoreStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioPerformanceRecalculationPreflightStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockPortfolioPerformanceRecalculationCoreStatus().catch(() => null),
      fetchAdminTradingLabMockTradingRunSummaryPreflightStatus().catch(() => null),
      fetchAdminTradingLabMockTradingRunSummaryReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockTradingRunSummaryCoreStatus().catch(() => null),
      fetchAdminTradingLabMockDashboardCleanupPreflightStatus().catch(() => null),
    ])
      .then((payload) => {
        if (cancelled) return;
        setReadiness(payload?.[0] || FALLBACK_READINESS);
        setShadowStatus(payload?.[1] || null);
        setShadowReviewStatus(payload?.[2] || null);
        setRiskKillSwitchStatus(payload?.[3] || null);
        setRiskKillSwitchReviewResultStatus(payload?.[4] || null);
        setManualApprovalOrderDraftStatus(payload?.[5] || null);
        setManualApprovalOrderDraftReviewResultStatus(payload?.[6] || null);
        setManualApprovalOrderDraftClearanceStatus(payload?.[7] || null);
        setManualApprovalClearanceReviewResultStatus(payload?.[8] || null);
        setKisProviderCallInventoryStatus(payload?.[9] || null);
        setProviderResponseEnvelopeValidationStatus(payload?.[10] || null);
        setProviderResponseValidationReviewResultStatus(payload?.[11] || null);
        setProviderCallPolicyStatus(payload?.[12] || null);
        setKisQuoteAdapterOptInPreflightStatus(payload?.[13] || null);
        setTradingLabDashboardStatus(payload?.[14] || null);
        setTradingLabStrategyDraftStatus(payload?.[15] || null);
        setTradingLabStrategyDraftReviewStatus(payload?.[16] || null);
        setTradingLabStrategyDraftReviewResultStatus(payload?.[17] || null);
        setTradingLabStrategyDraftClearancePreflightStatus(payload?.[18] || null);
        setTradingLabStrategyDraftClearanceReviewResultStatus(payload?.[19] || null);
        setTradingLabMockRunCandidatePreflightStatus(payload?.[20] || null);
        setTradingLabMockOrderGenerationPreflightStatus(payload?.[21] || null);
        setTradingLabMockOrderGenerationReviewResultStatus(payload?.[22] || null);
        setTradingLabMockExecutionPreflightStatus(payload?.[23] || null);
        setTradingLabMockExecutionReviewResultStatus(payload?.[24] || null);
        setTradingLabMockFillSimulationPreflightStatus(payload?.[25] || null);
        setTradingLabMockFillSimulationReviewResultStatus(payload?.[26] || null);
        setTradingLabMockFillSimulationCorePreflightStatus(payload?.[27] || null);
        setTradingLabMockFillSimulationCoreReviewResultStatus(payload?.[28] || null);
        setTradingLabMockFillSimulationCoreStatus(payload?.[29] || null);
        setTradingLabMockPortfolioLedgerUpdatePreflightStatus(payload?.[30] || null);
        setTradingLabMockPortfolioLedgerUpdateReviewResultStatus(payload?.[31] || null);
        setTradingLabMockPortfolioLedgerUpdateCorePreflightStatus(payload?.[32] || null);
        setTradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus(payload?.[33] || null);
        setTradingLabMockPortfolioLedgerUpdateCoreStatus(payload?.[34] || null);
        setTradingLabMockPortfolioPerformanceRecalculationPreflightStatus(payload?.[35] || null);
        setTradingLabMockPortfolioPerformanceRecalculationReviewResultStatus(payload?.[36] || null);
        setTradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus(payload?.[37] || null);
        setTradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus(payload?.[38] || null);
        setTradingLabMockPortfolioPerformanceRecalculationCoreStatus(payload?.[39] || null);
        setTradingLabMockTradingRunSummaryPreflightStatus(payload?.[40] || null);
        setTradingLabMockTradingRunSummaryReviewResultStatus(payload?.[41] || null);
        setTradingLabMockTradingRunSummaryCoreStatus(payload?.[42] || null);
        setTradingLabMockDashboardCleanupPreflightStatus(payload?.[43] || null);
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setReadiness(FALLBACK_READINESS);
        setLoadState("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const flags = readiness?.flags || FALLBACK_READINESS.flags;
  const blockerCount = useMemo(() => {
    const envBlockers = Array.isArray(readiness?.environment?.blockers) ? readiness.environment.blockers.length : 0;
    const killSwitchReasons = Array.isArray(readiness?.killSwitch?.reasons) ? readiness.killSwitch.reasons.length : 0;
    return envBlockers + killSwitchReasons;
  }, [readiness]);
  const labStrategy = tradingLabDashboardStatus?.strategy || {};
  const labStrategyDraftStatus = tradingLabStrategyDraftStatus || tradingLabDashboardStatus?.strategyDraftStatus || {};
  const labStrategyDraft = labStrategyDraftStatus?.strategyDraft || {};
  const labStrategyDraftValidation = labStrategyDraftStatus?.validation || {};
  const labStrategyDraftPreview = strategyDraftPreview || labStrategyDraft;
  const labStrategyDraftReviewStatus = tradingLabStrategyDraftReviewStatus || tradingLabDashboardStatus?.strategyDraftReviewStatus || {};
  const labStrategyDraftComparison = labStrategyDraftReviewStatus?.comparison || {};
  const labStrategyDraftChangeRows = Array.isArray(labStrategyDraftReviewStatus?.changeHistory?.changes)
    ? labStrategyDraftReviewStatus.changeHistory.changes
    : [];
  const labStrategyDraftDiffRows = Array.isArray(labStrategyDraftComparison?.diffRows)
    ? labStrategyDraftComparison.diffRows
    : [];
  const labStrategyRiskImpactPreview = labStrategyDraftReviewStatus?.riskImpactPreview || {};
  const labStrategyDraftReviewGate = labStrategyDraftReviewStatus?.reviewGate || {};
  const labStrategyDraftReviewResultStatus = tradingLabStrategyDraftReviewResultStatus || tradingLabDashboardStatus?.strategyDraftReviewResultStatus || {};
  const labStrategyDraftReviewResult = labStrategyDraftReviewResultStatus?.reviewResult || labStrategyDraftReviewResultStatus?.recordingGate?.reviewResult || {};
  const labStrategyDraftReviewReceipt = labStrategyDraftReviewResultStatus?.receipt || labStrategyDraftReviewResultStatus?.recordingGate?.receipt || {};
  const labStrategyDraftReviewBlockerSummary = labStrategyDraftReviewResultStatus?.blockerSummary || labStrategyDraftReviewResultStatus?.recordingGate?.blockerSummary || {};
  const labStrategyDraftReviewDecisionSummary = labStrategyDraftReviewResultStatus?.decisionSummary || labStrategyDraftReviewResultStatus?.recordingGate?.decisionSummary || {};
  const labStrategyDraftReviewResultHistory = Array.isArray(labStrategyDraftReviewResultStatus?.mockHistory)
    ? labStrategyDraftReviewResultStatus.mockHistory
    : [];
  const labStrategyDraftClearancePreflightStatus = tradingLabStrategyDraftClearancePreflightStatus || tradingLabDashboardStatus?.strategyDraftClearancePreflightStatus || {};
  const labStrategyDraftClearancePreflight = labStrategyDraftClearancePreflightStatus?.clearancePreflight || {};
  const labStrategyDraftClearanceCandidate = labStrategyDraftClearancePreflightStatus?.candidate || labStrategyDraftClearancePreflight?.candidate || {};
  const labStrategyDraftClearanceResult = labStrategyDraftClearancePreflightStatus?.result || labStrategyDraftClearancePreflight?.result || {};
  const labStrategyDraftClearanceBlockerSummary = labStrategyDraftClearancePreflightStatus?.blockerSummary || labStrategyDraftClearancePreflight?.blockerSummary || {};
  const labStrategyDraftClearanceReviewResultStatus = tradingLabStrategyDraftClearanceReviewResultStatus || tradingLabDashboardStatus?.strategyDraftClearanceReviewResultStatus || {};
  const labStrategyDraftClearanceReviewResult = labStrategyDraftClearanceReviewResultStatus?.reviewResult || labStrategyDraftClearanceReviewResultStatus?.recordingGate?.reviewResult || {};
  const labStrategyDraftClearanceReviewReceipt = labStrategyDraftClearanceReviewResultStatus?.receipt || labStrategyDraftClearanceReviewResultStatus?.recordingGate?.receipt || {};
  const labStrategyDraftClearanceReviewBlockerSummary = labStrategyDraftClearanceReviewResultStatus?.blockerSummary || labStrategyDraftClearanceReviewResultStatus?.recordingGate?.blockerSummary || {};
  const labStrategyDraftClearanceReviewDecisionSummary = labStrategyDraftClearanceReviewResultStatus?.decisionSummary || labStrategyDraftClearanceReviewResultStatus?.recordingGate?.decisionSummary || {};
  const labStrategyDraftClearanceReviewHistory = Array.isArray(labStrategyDraftClearanceReviewResultStatus?.mockHistory)
    ? labStrategyDraftClearanceReviewResultStatus.mockHistory
    : [];
  const labMockRunCandidatePreflightStatus = tradingLabMockRunCandidatePreflightStatus || tradingLabDashboardStatus?.mockRunCandidatePreflightStatus || {};
  const labMockRunCandidatePreflight = labMockRunCandidatePreflightStatus?.preflight || {};
  const labMockRunCandidateReadiness = labMockRunCandidatePreflightStatus?.readiness || labMockRunCandidatePreflight?.readiness || {};
  const labMockRunCandidate = labMockRunCandidatePreflightStatus?.candidate || labMockRunCandidatePreflight?.candidate || {};
  const labMockRunInputBundle = labMockRunCandidatePreflightStatus?.inputBundle || labMockRunCandidatePreflight?.inputBundle || {};
  const labMockRunUniverse = labMockRunCandidatePreflightStatus?.universeSnapshot || labMockRunCandidatePreflight?.universeSnapshot || {};
  const labMockRunInitialCapital = labMockRunCandidatePreflightStatus?.initialCapital || labMockRunCandidatePreflight?.initialCapital || {};
  const labMockRunPreflightResult = labMockRunCandidatePreflightStatus?.result || labMockRunCandidatePreflight?.result || {};
  const labMockRunBlockerSummary = labMockRunCandidatePreflightStatus?.blockerSummary || labMockRunCandidatePreflight?.blockerSummary || {};
  const labMockOrderGenerationPreflightStatus = tradingLabMockOrderGenerationPreflightStatus || tradingLabDashboardStatus?.mockOrderGenerationPreflightStatus || {};
  const labMockOrderGenerationPreflight = labMockOrderGenerationPreflightStatus?.preflight || {};
  const labMockOrderGenerationResult = labMockOrderGenerationPreflightStatus?.result || labMockOrderGenerationPreflight?.result || {};
  const labMockOrderGenerationValidation = labMockOrderGenerationPreflightStatus?.validation || labMockOrderGenerationPreflight?.validation || {};
  const labMockOrderGenerationGapSummary = labMockOrderGenerationPreflightStatus?.allocationGapSummary || labMockOrderGenerationPreflight?.allocationGapSummary || {};
  const labMockOrderGenerationRiskGuard = labMockOrderGenerationPreflightStatus?.riskGuard || labMockOrderGenerationPreflight?.riskGuard || {};
  const labMockOrderGenerationBlockerSummary = labMockOrderGenerationPreflightStatus?.blockerSummary || labMockOrderGenerationPreflight?.blockerSummary || {};
  const labMockOrderIntents = Array.isArray(labMockOrderGenerationPreflightStatus?.mockOrderIntents)
    ? labMockOrderGenerationPreflightStatus.mockOrderIntents
    : Array.isArray(labMockOrderGenerationPreflight?.mockOrderIntents)
      ? labMockOrderGenerationPreflight.mockOrderIntents
      : [];
  const labMockOrderGenerationReviewResultStatus = tradingLabMockOrderGenerationReviewResultStatus || tradingLabDashboardStatus?.mockOrderGenerationReviewResultStatus || {};
  const labMockOrderGenerationReviewGate = labMockOrderGenerationReviewResultStatus?.recordingGate || {};
  const labMockOrderGenerationReviewResult = labMockOrderGenerationReviewResultStatus?.reviewResult || labMockOrderGenerationReviewGate?.reviewResult || {};
  const labMockOrderGenerationReviewReceipt = labMockOrderGenerationReviewResultStatus?.receipt || labMockOrderGenerationReviewGate?.receipt || {};
  const labMockOrderGenerationIntentReviewSummary = labMockOrderGenerationReviewResultStatus?.intentReviewSummary || labMockOrderGenerationReviewGate?.intentReviewSummary || {};
  const labMockOrderGenerationReviewDecisionSummary = labMockOrderGenerationReviewResultStatus?.decisionSummary || labMockOrderGenerationReviewGate?.decisionSummary || {};
  const labMockOrderGenerationReviewBlockerSummary = labMockOrderGenerationReviewResultStatus?.blockerSummary || labMockOrderGenerationReviewGate?.blockerSummary || {};
  const labMockOrderGenerationReviewHistory = Array.isArray(labMockOrderGenerationReviewResultStatus?.mockHistory)
    ? labMockOrderGenerationReviewResultStatus.mockHistory
    : Array.isArray(labMockOrderGenerationReviewGate?.mockHistory)
      ? labMockOrderGenerationReviewGate.mockHistory
      : [];
  const labMockOrderGenerationIntentReviewRows = Array.isArray(labMockOrderGenerationIntentReviewSummary?.rows)
    ? labMockOrderGenerationIntentReviewSummary.rows
    : [];
  const labMockExecutionPreflightStatus = tradingLabMockExecutionPreflightStatus || tradingLabDashboardStatus?.mockExecutionPreflightStatus || {};
  const labMockExecutionPreflight = labMockExecutionPreflightStatus?.preflight || {};
  const labMockExecutionResult = labMockExecutionPreflightStatus?.result || labMockExecutionPreflight?.result || {};
  const labMockExecutionRiskGuard = labMockExecutionPreflightStatus?.riskGuard || labMockExecutionPreflight?.riskGuard || {};
  const labMockExecutionCashImpact = labMockExecutionPreflightStatus?.cashImpactPreview || labMockExecutionPreflight?.cashImpactPreview || {};
  const labMockExecutionPositionImpact = labMockExecutionPreflightStatus?.positionImpactPreview || labMockExecutionPreflight?.positionImpactPreview || {};
  const labMockExecutionBlockerSummary = labMockExecutionPreflightStatus?.blockerSummary || labMockExecutionPreflight?.blockerSummary || {};
  const labMockExecutionIntents = Array.isArray(labMockExecutionPreflightStatus?.mockExecutionIntents)
    ? labMockExecutionPreflightStatus.mockExecutionIntents
    : Array.isArray(labMockExecutionPreflight?.mockExecutionIntents)
      ? labMockExecutionPreflight.mockExecutionIntents
      : [];
  const labMockFillPlans = Array.isArray(labMockExecutionPreflightStatus?.fillPlans)
    ? labMockExecutionPreflightStatus.fillPlans
    : Array.isArray(labMockExecutionPreflight?.fillPlans)
      ? labMockExecutionPreflight.fillPlans
      : [];
  const labMockPositionImpactRows = Array.isArray(labMockExecutionPositionImpact?.rows)
    ? labMockExecutionPositionImpact.rows
    : [];
  const labMockExecutionReviewResultStatus = tradingLabMockExecutionReviewResultStatus || tradingLabDashboardStatus?.mockExecutionReviewResultStatus || {};
  const labMockExecutionReviewGate = labMockExecutionReviewResultStatus?.recordingGate || {};
  const labMockExecutionReviewResult = labMockExecutionReviewResultStatus?.reviewResult || labMockExecutionReviewGate?.reviewResult || {};
  const labMockExecutionReviewReceipt = labMockExecutionReviewResultStatus?.receipt || labMockExecutionReviewGate?.receipt || {};
  const labMockExecutionIntentReviewSummary = labMockExecutionReviewResultStatus?.intentReviewSummary || labMockExecutionReviewGate?.intentReviewSummary || {};
  const labMockFillPlanReviewSummary = labMockExecutionReviewResultStatus?.fillPlanReviewSummary || labMockExecutionReviewGate?.fillPlanReviewSummary || {};
  const labMockCashImpactReviewSummary = labMockExecutionReviewResultStatus?.cashImpactReviewSummary || labMockExecutionReviewGate?.cashImpactReviewSummary || {};
  const labMockPositionImpactReviewSummary = labMockExecutionReviewResultStatus?.positionImpactReviewSummary || labMockExecutionReviewGate?.positionImpactReviewSummary || {};
  const labMockExecutionReviewDecisionSummary = labMockExecutionReviewResultStatus?.decisionSummary || labMockExecutionReviewGate?.decisionSummary || {};
  const labMockExecutionReviewBlockerSummary = labMockExecutionReviewResultStatus?.blockerSummary || labMockExecutionReviewGate?.blockerSummary || {};
  const labMockExecutionReviewHistory = Array.isArray(labMockExecutionReviewResultStatus?.mockHistory)
    ? labMockExecutionReviewResultStatus.mockHistory
    : Array.isArray(labMockExecutionReviewGate?.mockHistory)
      ? labMockExecutionReviewGate.mockHistory
      : [];
  const labMockExecutionIntentReviewRows = Array.isArray(labMockExecutionIntentReviewSummary?.rows)
    ? labMockExecutionIntentReviewSummary.rows
    : [];
  const labMockFillPlanReviewRows = Array.isArray(labMockFillPlanReviewSummary?.rows)
    ? labMockFillPlanReviewSummary.rows
    : [];
  const labMockPositionImpactReviewRows = Array.isArray(labMockPositionImpactReviewSummary?.rows)
    ? labMockPositionImpactReviewSummary.rows
    : [];
  const labMockFillSimulationPreflightStatus = tradingLabMockFillSimulationPreflightStatus || tradingLabDashboardStatus?.mockFillSimulationPreflightStatus || {};
  const labMockFillSimulationPreflight = labMockFillSimulationPreflightStatus?.preflight || {};
  const labMockFillSimulationResult = labMockFillSimulationPreflightStatus?.result || labMockFillSimulationPreflight?.result || {};
  const labMockFillSimulationPolicyValidation = labMockFillSimulationPreflightStatus?.policyValidation || labMockFillSimulationPreflight?.policyValidation || {};
  const labMockFillSimulationSlippageFee = labMockFillSimulationPreflightStatus?.slippageFeePreview || labMockFillSimulationPreflight?.slippageFeePreview || {};
  const labMockFillSimulationCashImpact = labMockFillSimulationPreflightStatus?.cashImpactValidation || labMockFillSimulationPreflight?.cashImpactValidation || {};
  const labMockFillSimulationPositionImpact = labMockFillSimulationPreflightStatus?.positionImpactValidation || labMockFillSimulationPreflight?.positionImpactValidation || {};
  const labMockFillSimulationBlockerSummary = labMockFillSimulationPreflightStatus?.blockerSummary || labMockFillSimulationPreflight?.blockerSummary || {};
  const labMockFillSimulationCandidates = Array.isArray(labMockFillSimulationPreflightStatus?.fillCandidates)
    ? labMockFillSimulationPreflightStatus.fillCandidates
    : Array.isArray(labMockFillSimulationPreflight?.fillCandidates)
      ? labMockFillSimulationPreflight.fillCandidates
      : [];
  const labMockFillSimulationPositionRows = Array.isArray(labMockFillSimulationPositionImpact?.rows)
    ? labMockFillSimulationPositionImpact.rows
    : [];
  const labMockFillSimulationReviewResultStatus = tradingLabMockFillSimulationReviewResultStatus || tradingLabDashboardStatus?.mockFillSimulationReviewResultStatus || {};
  const labMockFillSimulationReviewGate = labMockFillSimulationReviewResultStatus?.recordingGate || {};
  const labMockFillSimulationReviewResult = labMockFillSimulationReviewResultStatus?.reviewResult || labMockFillSimulationReviewGate?.reviewResult || {};
  const labMockFillSimulationReviewReceipt = labMockFillSimulationReviewResultStatus?.receipt || labMockFillSimulationReviewGate?.receipt || {};
  const labMockFillSimulationReviewImpactSummary = labMockFillSimulationReviewResultStatus?.impactSummary || labMockFillSimulationReviewGate?.impactSummary || {};
  const labMockFillSimulationReviewDecisionSummary = labMockFillSimulationReviewResultStatus?.decisionSummary || labMockFillSimulationReviewGate?.decisionSummary || {};
  const labMockFillSimulationReviewBlockerSummary = labMockFillSimulationReviewResultStatus?.blockerSummary || labMockFillSimulationReviewGate?.blockerSummary || {};
  const labMockFillSimulationReviewHistory = Array.isArray(labMockFillSimulationReviewResultStatus?.mockHistory)
    ? labMockFillSimulationReviewResultStatus.mockHistory
    : Array.isArray(labMockFillSimulationReviewGate?.mockHistory)
      ? labMockFillSimulationReviewGate.mockHistory
      : [];
  const labMockFillSimulationReviewImpactRows = Array.isArray(labMockFillSimulationReviewImpactSummary?.rows)
    ? labMockFillSimulationReviewImpactSummary.rows
    : [];
  const labMockFillSimulationCorePreflightStatus = tradingLabMockFillSimulationCorePreflightStatus || tradingLabDashboardStatus?.mockFillSimulationCorePreflightStatus || {};
  const labMockFillSimulationCorePreflight = labMockFillSimulationCorePreflightStatus?.preflight || {};
  const labMockFillSimulationCoreResult = labMockFillSimulationCorePreflightStatus?.result || labMockFillSimulationCorePreflight?.result || {};
  const labMockFillCoreInputBundle = labMockFillSimulationCorePreflightStatus?.inputBundle || labMockFillSimulationCorePreflight?.inputBundle || {};
  const labMockFillScenario = labMockFillSimulationCorePreflightStatus?.scenario || labMockFillSimulationCorePreflight?.scenario || {};
  const labMockFillCorePolicyValidation = labMockFillSimulationCorePreflightStatus?.policyValidation || labMockFillSimulationCorePreflight?.policyValidation || {};
  const labMockFillCoreCashAvailability = labMockFillSimulationCorePreflightStatus?.cashAvailability || labMockFillSimulationCorePreflight?.cashAvailability || {};
  const labMockFillCorePositionImpact = labMockFillSimulationCorePreflightStatus?.positionImpact || labMockFillSimulationCorePreflight?.positionImpact || {};
  const labMockFillCoreDeterministicReadiness = labMockFillSimulationCorePreflightStatus?.deterministicReadiness || labMockFillSimulationCorePreflight?.deterministicReadiness || {};
  const labMockFillCoreBlockerSummary = labMockFillSimulationCorePreflightStatus?.blockerSummary || labMockFillSimulationCorePreflight?.blockerSummary || {};
  const labMockFillCorePositionRows = Array.isArray(labMockFillCorePositionImpact?.rows)
    ? labMockFillCorePositionImpact.rows
    : [];
  const labMockFillSimulationCoreReviewResultStatus = tradingLabMockFillSimulationCoreReviewResultStatus || tradingLabDashboardStatus?.mockFillSimulationCoreReviewResultStatus || {};
  const labMockFillSimulationCoreReviewGate = labMockFillSimulationCoreReviewResultStatus?.recordingGate || {};
  const labMockFillSimulationCoreReviewResult = labMockFillSimulationCoreReviewResultStatus?.reviewResult || labMockFillSimulationCoreReviewGate?.reviewResult || {};
  const labMockFillCoreReviewReceipt = labMockFillSimulationCoreReviewResultStatus?.receipt || labMockFillSimulationCoreReviewGate?.receipt || {};
  const labMockFillCorePolicyReviewSummary = labMockFillSimulationCoreReviewResultStatus?.policyReviewSummary || labMockFillSimulationCoreReviewGate?.policyReviewSummary || {};
  const labMockFillCoreReviewDecisionSummary = labMockFillSimulationCoreReviewResultStatus?.decisionSummary || labMockFillSimulationCoreReviewGate?.decisionSummary || {};
  const labMockFillCoreReviewBlockerSummary = labMockFillSimulationCoreReviewResultStatus?.blockerSummary || labMockFillSimulationCoreReviewGate?.blockerSummary || {};
  const labMockFillCoreReviewHistory = Array.isArray(labMockFillSimulationCoreReviewResultStatus?.mockHistory)
    ? labMockFillSimulationCoreReviewResultStatus.mockHistory
    : Array.isArray(labMockFillSimulationCoreReviewGate?.mockHistory)
      ? labMockFillSimulationCoreReviewGate.mockHistory
      : [];
  const labMockFillSimulationCoreStatus = tradingLabMockFillSimulationCoreStatus || tradingLabDashboardStatus?.mockFillSimulationCoreStatus || {};
  const labMockFillResultSummary = labMockFillSimulationCoreStatus?.summary || {};
  const labMockFillResults = Array.isArray(labMockFillSimulationCoreStatus?.fillResults)
    ? labMockFillSimulationCoreStatus.fillResults
    : [];
  const labMockFillCalculationInputs = Array.isArray(labMockFillSimulationCoreStatus?.calculationInputs)
    ? labMockFillSimulationCoreStatus.calculationInputs
    : [];
  const labMockFillCoreValidation = labMockFillSimulationCoreStatus?.validation || {};
  const labMockFillCoreHistory = Array.isArray(labMockFillSimulationCoreStatus?.mockHistory)
    ? labMockFillSimulationCoreStatus.mockHistory
    : [];
  const labMockPortfolioLedgerUpdatePreflightStatus = tradingLabMockPortfolioLedgerUpdatePreflightStatus || tradingLabDashboardStatus?.mockPortfolioLedgerUpdatePreflightStatus || {};
  const labMockLedgerUpdateResult = labMockPortfolioLedgerUpdatePreflightStatus?.result || {};
  const labMockLedgerUpdateSummary = labMockPortfolioLedgerUpdatePreflightStatus?.summary || {};
  const labMockLedgerUpdateValidation = labMockPortfolioLedgerUpdatePreflightStatus?.validation || {};
  const labMockLedgerUpdateCandidates = Array.isArray(labMockPortfolioLedgerUpdatePreflightStatus?.ledgerUpdateCandidates)
    ? labMockPortfolioLedgerUpdatePreflightStatus.ledgerUpdateCandidates
    : [];
  const labMockLedgerUpdateHistory = Array.isArray(labMockPortfolioLedgerUpdatePreflightStatus?.mockHistory)
    ? labMockPortfolioLedgerUpdatePreflightStatus.mockHistory
    : [];
  const labMockPortfolioLedgerUpdateReviewResultStatus = tradingLabMockPortfolioLedgerUpdateReviewResultStatus || tradingLabDashboardStatus?.mockPortfolioLedgerUpdateReviewResultStatus || {};
  const labMockLedgerUpdateReviewResult = labMockPortfolioLedgerUpdateReviewResultStatus?.reviewResult || {};
  const labMockLedgerUpdateReviewReceipt = labMockPortfolioLedgerUpdateReviewResultStatus?.receipt || {};
  const labMockLedgerUpdateImpactReviewSummary = labMockPortfolioLedgerUpdateReviewResultStatus?.impactReviewSummary || {};
  const labMockLedgerUpdateReviewDecisionSummary = labMockPortfolioLedgerUpdateReviewResultStatus?.decisionSummary || {};
  const labMockLedgerUpdateReviewValidation = labMockPortfolioLedgerUpdateReviewResultStatus?.validation || {};
  const labMockLedgerUpdateReviewHistory = Array.isArray(labMockPortfolioLedgerUpdateReviewResultStatus?.mockHistory)
    ? labMockPortfolioLedgerUpdateReviewResultStatus.mockHistory
    : [];
  const labMockPortfolioLedgerUpdateCorePreflightStatus = tradingLabMockPortfolioLedgerUpdateCorePreflightStatus || tradingLabDashboardStatus?.mockPortfolioLedgerUpdateCorePreflightStatus || {};
  const labMockLedgerUpdateCoreResult = labMockPortfolioLedgerUpdateCorePreflightStatus?.result || {};
  const labMockLedgerCoreInputBundle = labMockPortfolioLedgerUpdateCorePreflightStatus?.ledgerCoreInputBundle || {};
  const labMockLedgerUpdateScenario = labMockPortfolioLedgerUpdateCorePreflightStatus?.ledgerUpdateScenario || {};
  const labMockLedgerUpdateCoreSummary = labMockPortfolioLedgerUpdateCorePreflightStatus?.summary || {};
  const labMockLedgerUpdateCoreValidation = labMockPortfolioLedgerUpdateCorePreflightStatus?.validation || {};
  const labMockLedgerUpdateCoreHistory = Array.isArray(labMockPortfolioLedgerUpdateCorePreflightStatus?.mockHistory)
    ? labMockPortfolioLedgerUpdateCorePreflightStatus.mockHistory
    : [];
  const labMockPortfolioLedgerUpdateCoreReviewResultStatus = tradingLabMockPortfolioLedgerUpdateCoreReviewResultStatus || tradingLabDashboardStatus?.mockPortfolioLedgerUpdateCoreReviewResultStatus || {};
  const labMockLedgerUpdateCoreReviewResult = labMockPortfolioLedgerUpdateCoreReviewResultStatus?.reviewResult || {};
  const labMockLedgerUpdateCoreReviewReceipt = labMockPortfolioLedgerUpdateCoreReviewResultStatus?.receipt || {};
  const labMockLedgerUpdateCorePolicyReviewSummary = labMockPortfolioLedgerUpdateCoreReviewResultStatus?.policyReviewSummary || {};
  const labMockLedgerUpdateCoreReviewDecisionSummary = labMockPortfolioLedgerUpdateCoreReviewResultStatus?.decisionSummary || {};
  const labMockLedgerUpdateCoreReviewValidation = labMockPortfolioLedgerUpdateCoreReviewResultStatus?.validation || {};
  const labMockLedgerUpdateCoreReviewHistory = Array.isArray(labMockPortfolioLedgerUpdateCoreReviewResultStatus?.mockHistory)
    ? labMockPortfolioLedgerUpdateCoreReviewResultStatus.mockHistory
    : [];
  const labMockPortfolioLedgerUpdateCoreStatus = tradingLabMockPortfolioLedgerUpdateCoreStatus || tradingLabDashboardStatus?.mockPortfolioLedgerUpdateCoreStatus || {};
  const labMockLedgerUpdateCoreFinalResult = labMockPortfolioLedgerUpdateCoreStatus?.ledgerUpdateResult || {};
  const labMockCashLedgerUpdateCoreResult = labMockPortfolioLedgerUpdateCoreStatus?.cashLedgerUpdateResult || {};
  const labMockPositionLedgerUpdateCoreResult = labMockPortfolioLedgerUpdateCoreStatus?.positionLedgerUpdateResult || {};
  const labMockPortfolioValueUpdateCoreResult = labMockPortfolioLedgerUpdateCoreStatus?.portfolioValueUpdateResult || {};
  const labMockPnlPlaceholderCoreResult = labMockPortfolioLedgerUpdateCoreStatus?.pnlPlaceholderResult || {};
  const labMockLedgerUpdateCoreFinalSummary = labMockPortfolioLedgerUpdateCoreStatus?.summary || {};
  const labMockLedgerUpdateCoreFinalValidation = labMockPortfolioLedgerUpdateCoreStatus?.validation || {};
  const labMockLedgerUpdateCoreFinalHistory = Array.isArray(labMockPortfolioLedgerUpdateCoreStatus?.mockHistory)
    ? labMockPortfolioLedgerUpdateCoreStatus.mockHistory
    : [];
  const labMockPortfolioPerformanceRecalculationPreflightStatus = tradingLabMockPortfolioPerformanceRecalculationPreflightStatus || tradingLabDashboardStatus?.mockPortfolioPerformanceRecalculationPreflightStatus || {};
  const labMockPerformanceRecalculationResult = labMockPortfolioPerformanceRecalculationPreflightStatus?.result || {};
  const labMockPerformanceInputBundle = labMockPortfolioPerformanceRecalculationPreflightStatus?.performanceInputBundle || {};
  const labMockPerformanceScenario = labMockPortfolioPerformanceRecalculationPreflightStatus?.performanceScenario || {};
  const labMockPerformanceValidation = labMockPortfolioPerformanceRecalculationPreflightStatus?.validation || {};
  const labMockPerformanceSummary = labMockPortfolioPerformanceRecalculationPreflightStatus?.summary || {};
  const labMockPerformanceHistory = Array.isArray(labMockPortfolioPerformanceRecalculationPreflightStatus?.mockHistory)
    ? labMockPortfolioPerformanceRecalculationPreflightStatus.mockHistory
    : [];
  const labMockPortfolioPerformanceRecalculationReviewResultStatus = tradingLabMockPortfolioPerformanceRecalculationReviewResultStatus || tradingLabDashboardStatus?.mockPortfolioPerformanceRecalculationReviewResultStatus || {};
  const labMockPerformanceReviewResult = labMockPortfolioPerformanceRecalculationReviewResultStatus?.reviewResult || {};
  const labMockPerformanceReviewReceipt = labMockPortfolioPerformanceRecalculationReviewResultStatus?.receipt || {};
  const labMockPerformanceReviewSummary = labMockPortfolioPerformanceRecalculationReviewResultStatus?.reviewSummary || {};
  const labMockPerformanceReviewDecisionSummary = labMockPortfolioPerformanceRecalculationReviewResultStatus?.decisionSummary || {};
  const labMockPerformanceReviewValidation = labMockPortfolioPerformanceRecalculationReviewResultStatus?.validation || {};
  const labMockPerformanceReviewHistory = Array.isArray(labMockPortfolioPerformanceRecalculationReviewResultStatus?.mockHistory)
    ? labMockPortfolioPerformanceRecalculationReviewResultStatus.mockHistory
    : [];
  const labMockPortfolioPerformanceRecalculationCorePreflightStatus = tradingLabMockPortfolioPerformanceRecalculationCorePreflightStatus || tradingLabDashboardStatus?.mockPortfolioPerformanceRecalculationCorePreflightStatus || {};
  const labMockPerformanceCoreResult = labMockPortfolioPerformanceRecalculationCorePreflightStatus?.result || {};
  const labMockPerformanceCoreInputBundle = labMockPortfolioPerformanceRecalculationCorePreflightStatus?.performanceCoreInputBundle || {};
  const labMockPerformanceCoreScenario = labMockPortfolioPerformanceRecalculationCorePreflightStatus?.performanceCoreScenario || {};
  const labMockPerformanceCoreValidation = labMockPortfolioPerformanceRecalculationCorePreflightStatus?.validation || {};
  const labMockPerformanceCoreSummary = labMockPortfolioPerformanceRecalculationCorePreflightStatus?.summary || {};
  const labMockPerformanceCoreHistory = Array.isArray(labMockPortfolioPerformanceRecalculationCorePreflightStatus?.mockHistory)
    ? labMockPortfolioPerformanceRecalculationCorePreflightStatus.mockHistory
    : [];
  const labMockPortfolioPerformanceRecalculationCoreReviewResultStatus = tradingLabMockPortfolioPerformanceRecalculationCoreReviewResultStatus || tradingLabDashboardStatus?.mockPortfolioPerformanceRecalculationCoreReviewResultStatus || {};
  const labMockPerformanceCoreReviewResult = labMockPortfolioPerformanceRecalculationCoreReviewResultStatus?.reviewResult || {};
  const labMockPerformanceCoreReviewReceipt = labMockPortfolioPerformanceRecalculationCoreReviewResultStatus?.receipt || {};
  const labMockPerformanceCoreReviewValidation = labMockPortfolioPerformanceRecalculationCoreReviewResultStatus?.validation || {};
  const labMockPerformanceCorePolicyReviewSummary = labMockPortfolioPerformanceRecalculationCoreReviewResultStatus?.policyReviewSummary || {};
  const labMockPerformanceCoreDecisionSummary = labMockPortfolioPerformanceRecalculationCoreReviewResultStatus?.decisionSummary || {};
  const labMockPerformanceCoreReviewHistory = Array.isArray(labMockPortfolioPerformanceRecalculationCoreReviewResultStatus?.mockHistory)
    ? labMockPortfolioPerformanceRecalculationCoreReviewResultStatus.mockHistory
    : [];
  const labMockPortfolioPerformanceRecalculationCoreStatus = tradingLabMockPortfolioPerformanceRecalculationCoreStatus || tradingLabDashboardStatus?.mockPortfolioPerformanceRecalculationCoreStatus || {};
  const labMockPerformanceResult = labMockPortfolioPerformanceRecalculationCoreStatus?.performanceResult || {};
  const labMockPerformanceCoreCalculationValidation = labMockPortfolioPerformanceRecalculationCoreStatus?.validation || {};
  const labMockPerformanceEquitySeriesResult = labMockPortfolioPerformanceRecalculationCoreStatus?.equitySeriesResult || labMockPerformanceResult?.equitySeriesResult || {};
  const labMockPerformanceDailyReturnResult = labMockPortfolioPerformanceRecalculationCoreStatus?.dailyReturnResult || labMockPerformanceResult?.dailyReturnResult || {};
  const labMockPerformanceCumulativeReturnResult = labMockPortfolioPerformanceRecalculationCoreStatus?.cumulativeReturnResult || labMockPerformanceResult?.cumulativeReturnResult || {};
  const labMockPerformanceDrawdownMddResult = labMockPortfolioPerformanceRecalculationCoreStatus?.drawdownMddResult || labMockPerformanceResult?.drawdownMddResult || {};
  const labMockPerformanceAllocationResult = labMockPortfolioPerformanceRecalculationCoreStatus?.allocationResult || labMockPerformanceResult?.allocationResult || {};
  const labMockPerformanceKpiSummaryResult = labMockPortfolioPerformanceRecalculationCoreStatus?.kpiSummaryResult || labMockPerformanceResult?.kpiSummary || {};
  const labMockPerformanceChartDataResult = labMockPortfolioPerformanceRecalculationCoreStatus?.chartDataResult || labMockPerformanceResult?.chartData || {};
  const labMockPerformanceCoreCalculationHistory = Array.isArray(labMockPortfolioPerformanceRecalculationCoreStatus?.mockHistory)
    ? labMockPortfolioPerformanceRecalculationCoreStatus.mockHistory
    : [];
  const labMockTradingRunSummaryPreflightStatus = tradingLabMockTradingRunSummaryPreflightStatus || tradingLabDashboardStatus?.mockTradingRunSummaryPreflightStatus || {};
  const labMockTradingRunSummaryPreflightResult = labMockTradingRunSummaryPreflightStatus?.result || {};
  const labMockTradingRunSummaryInputBundle = labMockTradingRunSummaryPreflightStatus?.summaryInputBundle || {};
  const labMockTradingRunSummaryValidation = labMockTradingRunSummaryPreflightStatus?.validation || {};
  const labMockTradingRunSummaryDependencyMap = labMockTradingRunSummaryPreflightStatus?.dependencyMap || {};
  const labMockTradingRunSummaryHistory = Array.isArray(labMockTradingRunSummaryPreflightStatus?.mockHistory)
    ? labMockTradingRunSummaryPreflightStatus.mockHistory
    : [];
  const labMockTradingRunSummaryReviewResultStatus = tradingLabMockTradingRunSummaryReviewResultStatus || tradingLabDashboardStatus?.mockTradingRunSummaryReviewResultStatus || {};
  const labMockTradingRunSummaryReviewResult = labMockTradingRunSummaryReviewResultStatus?.reviewResult || {};
  const labMockTradingRunSummaryReviewReceipt = labMockTradingRunSummaryReviewResultStatus?.receipt || {};
  const labMockTradingRunSummaryReviewValidation = labMockTradingRunSummaryReviewResultStatus?.validation || {};
  const labMockTradingRunSummaryReviewSectionSummary = labMockTradingRunSummaryReviewResultStatus?.sectionReviewSummary || {};
  const labMockTradingRunSummaryReviewDecisionSummary = labMockTradingRunSummaryReviewResultStatus?.decisionSummary || {};
  const labMockTradingRunSummaryReviewHistory = Array.isArray(labMockTradingRunSummaryReviewResultStatus?.mockHistory)
    ? labMockTradingRunSummaryReviewResultStatus.mockHistory
    : [];
  const labMockTradingRunSummaryCoreStatus = tradingLabMockTradingRunSummaryCoreStatus || tradingLabDashboardStatus?.mockTradingRunSummaryCoreStatus || {};
  const labMockTradingRunSummaryCoreResult = labMockTradingRunSummaryCoreStatus?.result || {};
  const labMockTradingRunSummaryCoreValidation = labMockTradingRunSummaryCoreStatus?.validation || {};
  const labMockTradingRunSummaryDashboardAggregation = labMockTradingRunSummaryCoreStatus?.dashboardAggregation || labMockTradingRunSummaryCoreResult?.dashboardAggregation || {};
  const labMockTradingRunSummaryChartAggregation = labMockTradingRunSummaryCoreStatus?.chartAggregation || labMockTradingRunSummaryCoreResult?.chartAggregation || {};
  const labMockTradingRunSummaryStrategySummary = labMockTradingRunSummaryCoreStatus?.strategySummary || labMockTradingRunSummaryCoreResult?.strategySummary || {};
  const labMockTradingRunSummaryOrderExecutionFillSummary = labMockTradingRunSummaryCoreStatus?.orderExecutionFillSummary || {};
  const labMockTradingRunSummaryLedgerSummary = labMockTradingRunSummaryCoreStatus?.ledgerSummary || labMockTradingRunSummaryCoreResult?.ledgerSummary || {};
  const labMockTradingRunSummaryPerformanceSummary = labMockTradingRunSummaryCoreStatus?.performanceSummary || labMockTradingRunSummaryCoreResult?.performanceSummary || {};
  const labMockTradingRunSummaryRiskSafetySummary = labMockTradingRunSummaryCoreStatus?.riskSafetySummary || labMockTradingRunSummaryCoreResult?.riskSummary || {};
  const labMockTradingRunSummaryCoreHistory = Array.isArray(labMockTradingRunSummaryCoreStatus?.mockHistory)
    ? labMockTradingRunSummaryCoreStatus.mockHistory
    : [];
  const labMockDashboardCleanupPreflightStatus = tradingLabMockDashboardCleanupPreflightStatus || tradingLabDashboardStatus?.mockDashboardCleanupPreflightStatus || {};
  const labMockDashboardCleanupPreflightResult = labMockDashboardCleanupPreflightStatus?.result || {};
  const labMockDashboardCleanupValidation = labMockDashboardCleanupPreflightStatus?.validation || {};
  const labMockDashboardSectionInventory = labMockDashboardCleanupPreflightStatus?.sectionInventory || {};
  const labMockDashboardPriorityLayout = labMockDashboardCleanupPreflightStatus?.priorityLayout || {};
  const labMockDashboardCollapsibleSectionPlan = labMockDashboardCleanupPreflightStatus?.collapsibleSectionPlan || {};
  const labMockDashboardSections = Array.isArray(labMockDashboardSectionInventory?.sections)
    ? labMockDashboardSectionInventory.sections
    : [];
  const labMockDashboardPrimarySections = labMockDashboardSections.filter((section) => section.priority === "primary");
  const labMockDashboardCollapsibleGroups = Array.isArray(labMockDashboardCollapsibleSectionPlan?.groups)
    ? labMockDashboardCollapsibleSectionPlan.groups
    : [];
  const labMockDashboardCleanupHistory = Array.isArray(labMockDashboardCleanupPreflightStatus?.mockHistory)
    ? labMockDashboardCleanupPreflightStatus.mockHistory
    : [];
  const labPerformance = tradingLabDashboardStatus?.performance || {};
  const labDailyRows = Array.isArray(tradingLabDashboardStatus?.dailyReturns?.rows)
    ? tradingLabDashboardStatus.dailyReturns.rows
    : [];
  const labPositions = Array.isArray(tradingLabDashboardStatus?.positions?.positions)
    ? tradingLabDashboardStatus.positions.positions
    : [];
  const labOrderCandidates = Array.isArray(tradingLabDashboardStatus?.orderCandidates?.candidates)
    ? tradingLabDashboardStatus.orderCandidates.candidates
    : [];
  const labAuditEvents = Array.isArray(tradingLabDashboardStatus?.auditLogs?.events)
    ? tradingLabDashboardStatus.auditLogs.events
    : [];
  const labKpiCards = Array.isArray(tradingLabDashboardStatus?.kpiCards?.cards)
    ? tradingLabDashboardStatus.kpiCards.cards
    : [];
  const labEquityPoints = Array.isArray(tradingLabDashboardStatus?.equityVisualization?.points)
    ? tradingLabDashboardStatus.equityVisualization.points
    : labDailyRows;
  const labReturnPoints = Array.isArray(tradingLabDashboardStatus?.returnVisualization?.points)
    ? tradingLabDashboardStatus.returnVisualization.points
    : labDailyRows;
  const labAllocations = Array.isArray(tradingLabDashboardStatus?.allocationVisualization?.allocations)
    ? tradingLabDashboardStatus.allocationVisualization.allocations
    : labPositions;
  const equitySparklinePoints = buildSparklinePoints(labEquityPoints, "equityPlaceholder");
  const cumulativeReturnSparklinePoints = buildSparklinePoints(labReturnPoints, "cumulativeReturnPct");

  function handleTradingPanelTabChange(nextTab) {
    setActiveTradingPanelTab(nextTab);
    updateTradingPanelTabQuery(nextTab);
  }

  function handleStrategyDraftInputChange(event) {
    const { name, value } = event.target;
    setStrategyDraftForm((current) => ({ ...current, [name]: value }));
  }

  function handleStrategyDraftPreview(event) {
    event.preventDefault();
    setStrategyDraftPreview({
      ...strategyDraftForm,
      strategyDraftId: "local_admin_mock_strategy_draft_preview",
      sourceStep: "step134",
      status: "local_mock_preview_only",
      storageMode: "local_state_only_no_db_write",
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      readyForReadOnlyProviderCalls: false,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
    });
  }

  return (
    <div className="tradingAdminDashboardStack" data-admin-panel-key="admin-trading-dashboard">
      <div className="tradingAdminTabHeader">
        <div>
          <p className="accountMiniLabel">거래 관리</p>
          <h2>모의운용·안전평가 관리</h2>
          <p>실제 거래 기능은 비활성화되어 있으며, 이 화면은 관리자 전용 읽기 상태만 보여줍니다.</p>
        </div>
        <div className="tradingAdminSegmentControl" role="tablist" aria-label="거래 관리 화면 전환">
          {TRADING_PANEL_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTradingPanelTab === tab.key}
              className={activeTradingPanelTab === tab.key ? "active" : ""}
              onClick={() => handleTradingPanelTabChange(tab.key)}
            >
              <span>{tab.label}</span>
              <em>{tab.description}</em>
            </button>
          ))}
        </div>
      </div>

      {activeTradingPanelTab === "safety" ? (
    <section className="accountCard tradingReadinessPanel tradingSafetyPanel" data-admin-panel-key="trading-readiness">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">거래 안전상태</p>
          <h2>거래 안전상태</h2>
          <p>
            이 화면은 개인계좌 기반 거래 기능을 실제로 실행하기 전, 관리자가 안전상태를 점검하기 위한 읽기 전용 화면입니다.
            현재 실제 KIS 호출과 주문 제출은 모두 차단되어 있습니다.
          </p>
        </div>
        <span className={`tradingReadinessBadge ${loadState}`}>{formatStatus(readiness?.status || loadState)}</span>
      </div>

      <div className="accountStatusGrid tradingReadinessMetrics">
        <article>
          <span>모드</span>
          <strong>{formatStatus(readiness?.tradingMode || "mock")}</strong>
          <p>모의 / 드라이런 / 섀도우 상태만 표시합니다.</p>
        </article>
        <article>
          <span>비상 차단</span>
          <strong>{formatStatus(readiness?.killSwitch?.status || "blocked")}</strong>
          <p>{readiness?.killSwitch?.enabled === false ? "해제 확인 전" : "활성 또는 강제 차단"}</p>
        </article>
        <article>
          <span>허용 종목</span>
          <strong>{formatStatus(readiness?.allowedSymbols?.status || "blocked")}</strong>
          <p>{Number(readiness?.allowedSymbols?.count || 0)}개 설정됨</p>
        </article>
        <article>
          <span>차단 사유</span>
          <strong>{blockerCount}</strong>
          <p>오류 시 자동 차단 점검 활성</p>
        </article>
      </div>

      <div className="tradingReadinessFlagGrid" aria-label="거래 안전상태 플래그">
        {FLAG_LABELS.map(([key, label]) => (
          <div key={key} className="tradingReadinessFlag">
            <span>{label}</span>
            <strong className={statusClass(flags[key])}>{boolStatus(flags[key])}</strong>
          </div>
        ))}
      </div>

      <div className="tradingReadinessAudit">
        <span>최근 감사 이벤트</span>
        <strong>{formatStatus(readiness?.lastAuditEvent?.status || "placeholder_only")}</strong>
        <p>{readiness?.lastAuditEvent?.message || FALLBACK_READINESS.lastAuditEvent.message}</p>
      </div>

    </section>
      ) : null}

      {activeTradingPanelTab === "lab" ? (
    <section className="accountCard tradingLabDashboardPanel" data-admin-panel-key="trading-lab-dashboard">
      <div className="tradingLabDashboard">
        <div className="tradingLabHeader">
          <div>
            <span>모의 운용 대시보드</span>
            <h3>모의 운용 대시보드</h3>
            <p>모의·드라이런·섀도우 자리표시자 데이터만 표시하며, provider 호출과 주문 제출은 계속 차단됩니다.</p>
          </div>
          <strong>{formatStatus(tradingLabDashboardStatus?.status || "admin_only")}</strong>
        </div>

        <div className="tradingLabKpiGrid" aria-label="모의 운용 KPI 요약">
          {labKpiCards.map((card) => (
            <article className="tradingLabKpiCard" key={card.cardId}>
              <span>{KPI_LABELS[card.cardId] || card.label}</span>
              <strong>{formatKpiValue(card)}</strong>
              <p>{formatStatus(card.status || "mock_only")}</p>
            </article>
          ))}
        </div>

        <div className="tradingLabChartGrid">
          <article className="tradingLabChartCard">
            <span>일별 자산 변화</span>
            <svg className="tradingLabLineChart" viewBox="0 0 320 120" role="img" aria-label="모의 일별 자산 변화">
              <polyline points={equitySparklinePoints} fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <div className="tradingLabChartLegend">
              {labEquityPoints.map((point) => (
                <span key={point.date}>{point.date}</span>
              ))}
            </div>
          </article>

          <article className="tradingLabChartCard">
            <span>수익률 경로</span>
            <svg className="tradingLabLineChart return" viewBox="0 0 320 120" role="img" aria-label="모의 누적 수익률 경로">
              <polyline points={cumulativeReturnSparklinePoints} fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <div className="tradingLabReturnBars" aria-label="일별 수익률 막대">
              {labReturnPoints.map((point) => (
                <span
                  key={point.date}
                  className={Number(point.dailyReturnPct || 0) >= 0 ? "positive" : "negative"}
                  style={{ height: `${24 + clampPercent(Math.abs(point.dailyReturnPct || 0) * 120)}px` }}
                  title={`${point.date} ${Number(point.dailyReturnPct || 0).toFixed(2)}%`}
                />
              ))}
            </div>
          </article>

          <article className="tradingLabChartCard tradingLabAllocationCard">
            <span>현재 자산분포</span>
            <div className="tradingLabAllocationBars" aria-label="모의 자산분포 막대">
              {labAllocations.map((allocation) => (
                <div className="tradingLabAllocationRow" key={allocation.symbol}>
                  <div>
                    <strong>{allocation.symbol}</strong>
                    <small>{Number(allocation.weightPct || 0).toFixed(2)}%</small>
                  </div>
                  <span>
                    <i style={{ width: `${clampPercent(allocation.weightPct)}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="tradingLabGrid">
          <article className="tradingLabSection tradingLabStrategyDraftControls" data-admin-panel-key="trading-lab-strategy-draft-controls">
            <span>Strategy draft</span>
            <h4>{labStrategyDraftPreview.strategyName || "Admin mock strategy draft"}</h4>
            <form onSubmit={handleStrategyDraftPreview}>
              <label>
                <span>Strategy name</span>
                <input
                  name="strategyName"
                  value={strategyDraftForm.strategyName}
                  onChange={handleStrategyDraftInputChange}
                  aria-label="Strategy draft name"
                />
              </label>
              <label>
                <span>Mode</span>
                <select name="mode" value={strategyDraftForm.mode} onChange={handleStrategyDraftInputChange} aria-label="Strategy draft mode">
                  <option value="mock">mock</option>
                  <option value="dry_run">dry-run</option>
                  <option value="shadow">shadow</option>
                </select>
              </label>
              <label>
                <span>Allowed symbols</span>
                <input
                  name="allowedSymbols"
                  value={strategyDraftForm.allowedSymbols}
                  onChange={handleStrategyDraftInputChange}
                  aria-label="Strategy draft allowed symbols"
                />
              </label>
              <label>
                <span>Target weights</span>
                <input
                  name="targetWeights"
                  value={strategyDraftForm.targetWeights}
                  onChange={handleStrategyDraftInputChange}
                  aria-label="Strategy draft target weights"
                />
              </label>
              <label>
                <span>Rebalance rule</span>
                <select
                  name="rebalanceRule"
                  value={strategyDraftForm.rebalanceRule}
                  onChange={handleStrategyDraftInputChange}
                  aria-label="Strategy draft rebalance rule"
                >
                  <option value="manual_review">manual review</option>
                  <option value="weekly_mock">weekly mock</option>
                  <option value="monthly_mock">monthly mock</option>
                </select>
              </label>
              <label>
                <span>Max amount</span>
                <input
                  name="maxOrderAmount"
                  value={strategyDraftForm.maxOrderAmount}
                  onChange={handleStrategyDraftInputChange}
                  aria-label="Strategy draft max amount placeholder"
                />
              </label>
              <label>
                <span>Max daily loss</span>
                <input
                  name="maxDailyLoss"
                  value={strategyDraftForm.maxDailyLoss}
                  onChange={handleStrategyDraftInputChange}
                  aria-label="Strategy draft max daily loss placeholder"
                />
              </label>
              <label>
                <span>Max position</span>
                <input
                  name="maxPositionWeight"
                  value={strategyDraftForm.maxPositionWeight}
                  onChange={handleStrategyDraftInputChange}
                  aria-label="Strategy draft max position placeholder"
                />
              </label>
              <button type="submit">Apply mock draft</button>
            </form>
            <dl>
              <div>
                <dt>Draft status</dt>
                <dd>{formatStatus(labStrategyDraftPreview.status || labStrategyDraftStatus.status || "mock_only")}</dd>
              </div>
              <div>
                <dt>Validation</dt>
                <dd>{formatStatus(labStrategyDraftValidation.status || "validation_required")}</dd>
              </div>
              <div>
                <dt>Residual</dt>
                <dd>{Number(labStrategyDraftValidation.residualWeightPct || labStrategyDraft.residualWeightPct || 0).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>Boundary</dt>
                <dd>{formatStatus(labStrategyDraftStatus?.mockRecalculationBoundary?.status || "mock_only")}</dd>
              </div>
            </dl>
          </article>

          <article className="tradingLabSection tradingLabStrategyDraftReview" data-admin-panel-key="trading-lab-strategy-draft-review">
            <span>Strategy review</span>
            <h4>{formatStatus(labStrategyDraftReviewGate.status || labStrategyDraftReviewStatus.status || "review_pending")}</h4>
            <div className="tradingLabReviewCards">
              <div>
                <span>Before</span>
                <strong>{labStrategyDraftComparison.baseStrategyName || "Admin mock strategy baseline"}</strong>
                <small>{formatStatus(labStrategyDraftComparison.modeBefore || "mock")}</small>
              </div>
              <div>
                <span>After</span>
                <strong>{labStrategyDraftComparison.draftStrategyName || labStrategyDraftPreview.strategyName || "Admin mock strategy draft"}</strong>
                <small>{formatStatus(labStrategyDraftComparison.modeAfter || "mock")}</small>
              </div>
              <div>
                <span>Validation</span>
                <strong>{formatStatus(labStrategyDraftComparison.validationStatus || labStrategyDraftValidation.status || "validation_required")}</strong>
                <small>{formatStatus(labStrategyDraftComparison.reviewStatus || "review_pending")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList" aria-label="Strategy draft change summary">
              {labStrategyDraftDiffRows.map((row, index) => (
                <li key={`${row.field || "change"}-${row.symbol || index}`}>{row.summary || "mock strategy draft comparison change"}</li>
              ))}
            </ul>
            <dl>
              <div>
                <dt>Return delta</dt>
                <dd>{Number(labStrategyRiskImpactPreview.cumulativeReturnDeltaPct || 0).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>MDD delta</dt>
                <dd>{Number(labStrategyRiskImpactPreview.mddDeltaPct || 0).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>Cash delta</dt>
                <dd>{Number(labStrategyRiskImpactPreview.cashWeightDeltaPct || 0).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>Max weight delta</dt>
                <dd>{Number(labStrategyRiskImpactPreview.maxPositionWeightDeltaPct || 0).toFixed(2)}%</dd>
              </div>
            </dl>
          </article>

          <article className="tradingLabSection tradingLabStrategyDraftReviewResult" data-admin-panel-key="trading-lab-strategy-draft-review-result">
            <span>Mock review result</span>
            <h4>{formatStatus(labStrategyDraftReviewResult.reviewStatus || labStrategyDraftReviewResultStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This mock review result is read-only and does not grant provider calls, order submission, or live trading readiness.
            </p>
            <div className="tradingLabReviewCards tradingLabReviewResultCards">
              <div>
                <span>Receipt</span>
                <strong>{labStrategyDraftReviewReceipt.receiptId || "step136_strategy_draft_review_receipt"}</strong>
                <small>{labStrategyDraftReviewReceipt.redacted === false ? "not_redacted" : "redacted"}</small>
              </div>
              <div>
                <span>Decision</span>
                <strong>{formatStatus(labStrategyDraftReviewResult.decision || "rejected")}</strong>
                <small>{formatStatus(labStrategyDraftReviewDecisionSummary.readinessImpact || "none")}</small>
              </div>
              <div>
                <span>Provider impact</span>
                <strong>{formatStatus(labStrategyDraftReviewReceipt.providerCallImpact || "blocked")}</strong>
                <small>KIS call impact none</small>
              </div>
              <div>
                <span>Order impact</span>
                <strong>{formatStatus(labStrategyDraftReviewReceipt.orderSubmissionImpact || "blocked")}</strong>
                <small>Live gate stays blocked</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabReviewResultList" aria-label="Strategy draft review result blockers and warnings">
              {(labStrategyDraftReviewBlockerSummary.blockerMessages || labStrategyDraftReviewBlockerSummary.blockers || ["No live/provider/order gate opened."]).map((message, index) => (
                <li key={`review-result-blocker-${index}`}>{message}</li>
              ))}
              {(labStrategyDraftReviewBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`review-result-warning-${index}`}>{message}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabStrategyDraftClearancePreflight" data-admin-panel-key="trading-lab-strategy-draft-clearance-preflight">
            <span>Mock clearance preflight</span>
            <h4>{formatStatus(labStrategyDraftClearanceResult.clearanceStatus || labStrategyDraftClearancePreflight.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This clearance preflight is mock-only, admin-only, and cannot create order candidates, order drafts, provider calls, or live trading readiness.
            </p>
            <div className="tradingLabReviewCards tradingLabClearanceCards">
              <div>
                <span>Candidate</span>
                <strong>{formatStatus(labStrategyDraftClearanceCandidate.status || "validation_required")}</strong>
                <small>{labStrategyDraftClearanceCandidate.orderCandidateCreated ? "order_candidate_created" : "no_order_candidate"}</small>
              </div>
              <div>
                <span>Scope</span>
                <strong>{formatStatus(labStrategyDraftClearanceResult.clearanceScope || "mock_only")}</strong>
                <small>{formatStatus(labStrategyDraftClearanceResult.nextAllowedStep || "mock_review_only")}</small>
              </div>
              <div>
                <span>Provider impact</span>
                <strong>{formatStatus(labStrategyDraftClearanceResult.providerCallImpact || "blocked")}</strong>
                <small>KIS calls remain blocked</small>
              </div>
              <div>
                <span>Order impact</span>
                <strong>{formatStatus(labStrategyDraftClearanceResult.orderSubmissionImpact || "blocked")}</strong>
                <small>{labStrategyDraftClearanceCandidate.orderDraftCreated ? "order_draft_created" : "no_order_draft"}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabClearanceList" aria-label="Strategy draft clearance preflight blockers and warnings">
              {(labStrategyDraftClearanceBlockerSummary.blockerMessages || labStrategyDraftClearanceBlockerSummary.blockers || ["No live/provider/order gate opened."]).map((message, index) => (
                <li key={`clearance-preflight-blocker-${index}`}>{message}</li>
              ))}
              {(labStrategyDraftClearanceBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`clearance-preflight-warning-${index}`}>{message}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabStrategyDraftClearanceReviewResult" data-admin-panel-key="trading-lab-strategy-draft-clearance-review-result">
            <span>Mock clearance review result</span>
            <h4>{formatStatus(labStrategyDraftClearanceReviewResult.reviewStatus || labStrategyDraftClearanceReviewResultStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This recorded result is only for mock/dry-run strategy review and does not execute orders, grant provider access, or change live readiness.
            </p>
            <div className="tradingLabReviewCards tradingLabClearanceReviewCards">
              <div>
                <span>Receipt</span>
                <strong>{labStrategyDraftClearanceReviewReceipt.receiptId || "step138_strategy_draft_clearance_review_receipt"}</strong>
                <small>{labStrategyDraftClearanceReviewReceipt.redacted === false ? "not_redacted" : "redacted"}</small>
              </div>
              <div>
                <span>Decision</span>
                <strong>{formatStatus(labStrategyDraftClearanceReviewResult.decision || "rejected")}</strong>
                <small>{formatStatus(labStrategyDraftClearanceReviewDecisionSummary.nextAllowedStep || "mock_review_only")}</small>
              </div>
              <div>
                <span>Provider impact</span>
                <strong>{formatStatus(labStrategyDraftClearanceReviewReceipt.providerCallImpact || "blocked")}</strong>
                <small>KIS calls remain blocked</small>
              </div>
              <div>
                <span>Order impact</span>
                <strong>{formatStatus(labStrategyDraftClearanceReviewReceipt.orderSubmissionImpact || "blocked")}</strong>
                <small>{labStrategyDraftClearanceReviewResult.orderDraftCreated ? "order_draft_created" : "no_order_draft"}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabClearanceReviewList" aria-label="Strategy draft clearance review result blockers and warnings">
              {(labStrategyDraftClearanceReviewBlockerSummary.blockerMessages || labStrategyDraftClearanceReviewBlockerSummary.blockers || ["No live/provider/order gate opened."]).map((message, index) => (
                <li key={`clearance-review-result-blocker-${index}`}>{message}</li>
              ))}
              {(labStrategyDraftClearanceReviewBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`clearance-review-result-warning-${index}`}>{message}</li>
              ))}
              {labStrategyDraftClearanceReviewHistory.slice(0, 1).map((receipt, index) => (
                <li key={`clearance-review-history-${index}`}>{receipt.receiptId || "mock clearance review receipt"} · {formatStatus(receipt.decision || "rejected")}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockRunCandidatePreflight" data-admin-panel-key="trading-lab-mock-run-candidate-preflight">
            <span>Mock run candidate preflight</span>
            <h4>{formatStatus(labMockRunPreflightResult.status || labMockRunCandidate.status || labMockRunCandidatePreflightStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This candidate is only for FINPLE internal mock trading run preparation and never creates order candidates, order drafts, provider calls, or live readiness.
            </p>
            <div className="tradingLabReviewCards tradingLabMockRunCards">
              <div>
                <span>Input bundle</span>
                <strong>{labMockRunInputBundle.inputBundleId || "step139_mock_run_input_bundle"}</strong>
                <small>{formatStatus(labMockRunInputBundle.scope || "mock_only")}</small>
              </div>
              <div>
                <span>Universe</span>
                <strong>{formatStatus(labMockRunUniverse.priceSeriesStatus || labMockRunCandidateReadiness.priceSeriesDependencyStatus || "validation_required")}</strong>
                <small>{Number(labMockRunUniverse.symbolCount || 0)} symbols</small>
              </div>
              <div>
                <span>Initial capital</span>
                <strong>{Number(labMockRunInitialCapital.initialCapitalPlaceholder || 0).toLocaleString()}</strong>
                <small>{formatStatus(labMockRunInitialCapital.status || "placeholder_only")}</small>
              </div>
              <div>
                <span>Provider impact</span>
                <strong>{formatStatus(labMockRunPreflightResult.providerCallImpact || "blocked")}</strong>
                <small>KIS calls remain blocked</small>
              </div>
              <div>
                <span>Order impact</span>
                <strong>{formatStatus(labMockRunPreflightResult.orderSubmissionImpact || "blocked")}</strong>
                <small>{labMockRunCandidate.orderDraftCreated ? "order_draft_created" : "no_order_draft"}</small>
              </div>
              <div>
                <span>Candidate guard</span>
                <strong>{labMockRunCandidate.orderCandidateCreated ? "order_candidate_created" : "no_order_candidate"}</strong>
                <small>{formatStatus(labMockRunPreflightResult.nextAllowedStep || "mock_order_generation_preflight")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockRunList" aria-label="Mock run candidate preflight blockers and warnings">
              {(labMockRunBlockerSummary.blockerMessages || labMockRunBlockerSummary.blockers || ["No live/provider/order gate opened."]).map((message, index) => (
                <li key={`mock-run-candidate-blocker-${index}`}>{message}</li>
              ))}
              {(labMockRunBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`mock-run-candidate-warning-${index}`}>{message}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockOrderGenerationPreflight" data-admin-panel-key="trading-lab-mock-order-generation-preflight">
            <span>Mock order generation preflight</span>
            <h4>{formatStatus(labMockOrderGenerationResult.status || labMockOrderGenerationPreflightStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This result is a FINPLE internal mock order preview only. It does not execute orders, build KIS payloads, query balances, or change live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockOrderCards">
              <div>
                <span>Mock intents</span>
                <strong>{Number(labMockOrderGenerationResult.intentCount || labMockOrderIntents.length || 0)}</strong>
                <small>{formatStatus(labMockOrderGenerationResult.nextAllowedStep || "mock_order_generation_review")}</small>
              </div>
              <div>
                <span>Allocation gap</span>
                <strong>{formatStatus(labMockOrderGenerationResult.allocationGapStatus || labMockOrderGenerationGapSummary.status || "validation_required")}</strong>
                <small>{Number(labMockOrderGenerationGapSummary.maxAbsoluteGap || 0).toFixed(2)}pp max</small>
              </div>
              <div>
                <span>Risk guard</span>
                <strong>{formatStatus(labMockOrderGenerationResult.riskGuardStatus || labMockOrderGenerationRiskGuard.status || "blocked")}</strong>
                <small>{Number(labMockOrderGenerationRiskGuard.blockedIntentCount || labMockOrderGenerationResult.blockedIntentCount || 0)} blocked</small>
              </div>
              <div>
                <span>KIS impact</span>
                <strong>{formatStatus(labMockOrderGenerationResult.providerCallImpact || "blocked")}</strong>
                <small>payload none</small>
              </div>
              <div>
                <span>Actual artifact</span>
                <strong>{labMockOrderGenerationResult.actualOrderCandidateCreated ? "created" : "none"}</strong>
                <small>{labMockOrderGenerationResult.actualOrderDraftCreated ? "draft_created" : "draft_none"}</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockOrderGenerationResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockOrderGenerationValidation.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockOrderList" aria-label="Mock order generation preflight blockers and warnings">
              {(labMockOrderGenerationBlockerSummary.blockerMessages || labMockOrderGenerationBlockerSummary.blockers || ["No live/provider/order gate opened."]).map((message, index) => (
                <li key={`mock-order-generation-blocker-${index}`}>{message}</li>
              ))}
              {(labMockOrderGenerationBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`mock-order-generation-warning-${index}`}>{message}</li>
              ))}
              {labMockOrderIntents.slice(0, 3).map((intent, index) => (
                <li key={`mock-order-intent-${index}`}>{intent.symbol || "SYMBOL_PLACEHOLDER"} · {formatStatus(intent.side || "mock_hold")} · {Number(intent.weightGap || 0).toFixed(2)}pp</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockOrderGenerationReviewResult" data-admin-panel-key="trading-lab-mock-order-generation-review-result">
            <span>Mock order generation review result</span>
            <h4>{formatStatus(labMockOrderGenerationReviewResult.reviewStatus || labMockOrderGenerationReviewResultStatus.status || "blocked")}</h4>
            <p className="tradingLabMutedText">
              This result is for FINPLE internal mock order preview review only. It does not execute orders, create order drafts, build KIS payloads, or change live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockOrderReviewCards">
              <div>
                <span>Redacted receipt</span>
                <strong>{formatStatus(labMockOrderGenerationReviewReceipt.reviewStatus || "blocked")}</strong>
                <small>{formatStatus(labMockOrderGenerationReviewReceipt.nextAllowedStep || "mock_execution_preflight")}</small>
              </div>
              <div>
                <span>Mock intent review</span>
                <strong>{Number(labMockOrderGenerationIntentReviewSummary.intentCount || labMockOrderGenerationReviewReceipt.intentCount || 0)}</strong>
                <small>{Number(labMockOrderGenerationIntentReviewSummary.blockedIntentCount || 0)} blocked / {Number(labMockOrderGenerationIntentReviewSummary.warningIntentCount || 0)} warning</small>
              </div>
              <div>
                <span>Decision</span>
                <strong>{formatStatus(labMockOrderGenerationReviewResult.decision || labMockOrderGenerationReviewDecisionSummary.decision || "blocked")}</strong>
                <small>mock review only</small>
              </div>
              <div>
                <span>KIS impact</span>
                <strong>{formatStatus(labMockOrderGenerationReviewResult.providerCallImpact || "blocked")}</strong>
                <small>payload none</small>
              </div>
              <div>
                <span>Actual artifact</span>
                <strong>{labMockOrderGenerationReviewResult.actualOrderCandidateCreated ? "created" : "none"}</strong>
                <small>{labMockOrderGenerationReviewResult.actualOrderDraftCreated ? "draft_created" : "draft_none"}</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockOrderGenerationReviewResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockOrderGenerationReviewResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockOrderReviewList" aria-label="Mock order generation review result blockers warnings and decisions">
              {(labMockOrderGenerationReviewDecisionSummary.decisionMessages || ["KIS calls and order submission remain blocked."]).map((message, index) => (
                <li key={`mock-order-generation-review-decision-${index}`}>{message}</li>
              ))}
              {(labMockOrderGenerationReviewBlockerSummary.blockerMessages || []).map((message, index) => (
                <li key={`mock-order-generation-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockOrderGenerationReviewBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`mock-order-generation-review-warning-${index}`}>{message}</li>
              ))}
              {labMockOrderGenerationIntentReviewRows.slice(0, 3).map((row, index) => (
                <li key={`mock-order-generation-review-row-${index}`}>{row.symbol || "SYMBOL_PLACEHOLDER"} / {formatStatus(row.displaySide || row.side || "mock_hold")} / {Number(row.weightGap || 0).toFixed(2)}pp</li>
              ))}
              {labMockOrderGenerationReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-order-generation-review-history-${index}`}>{item.historyId || `review_history_${index + 1}`} / {formatStatus(item.reviewStatus || "blocked")} / {formatStatus(item.decision || "blocked")}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockExecutionPreflight" data-admin-panel-key="trading-lab-mock-execution-preflight">
            <span>Mock execution preflight</span>
            <h4>{formatStatus(labMockExecutionResult.status || labMockExecutionPreflightStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This result is a FINPLE internal mock execution preview only. It does not execute orders, create live fills, query balances, call KIS, or change live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockExecutionCards">
              <div>
                <span>Mock execution intents</span>
                <strong>{Number(labMockExecutionResult.executionIntentCount || labMockExecutionIntents.length || 0)}</strong>
                <small>{formatStatus(labMockExecutionResult.nextAllowedStep || "mock_execution_review")}</small>
              </div>
              <div>
                <span>Fill plan</span>
                <strong>{formatStatus(labMockExecutionResult.fillPlanStatus || "validation_required")}</strong>
                <small>{Number(labMockFillPlans.length || 0)} mock plans</small>
              </div>
              <div>
                <span>Cash preview</span>
                <strong>{formatStatus(labMockExecutionResult.cashImpactStatus || labMockExecutionCashImpact.status || "validation_required")}</strong>
                <small>{Number(labMockExecutionCashImpact.endingCashPlaceholder || 0).toLocaleString("ko-KR")} ending cash</small>
              </div>
              <div>
                <span>Position preview</span>
                <strong>{formatStatus(labMockExecutionResult.positionImpactStatus || labMockExecutionPositionImpact.status || "validation_required")}</strong>
                <small>{Number(labMockPositionImpactRows.length || 0)} rows</small>
              </div>
              <div>
                <span>Risk guard</span>
                <strong>{formatStatus(labMockExecutionResult.riskGuardStatus || labMockExecutionRiskGuard.status || "blocked")}</strong>
                <small>{Number(labMockExecutionRiskGuard.blockedExecutionIntentCount || labMockExecutionResult.blockedExecutionIntentCount || 0)} blocked</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockExecutionResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockExecutionResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockExecutionList" aria-label="Mock execution preflight blockers warnings and previews">
              {(labMockExecutionBlockerSummary.blockerMessages || labMockExecutionBlockerSummary.blockers || ["No live/provider/order gate opened."]).map((message, index) => (
                <li key={`mock-execution-preflight-blocker-${index}`}>{message}</li>
              ))}
              {(labMockExecutionBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`mock-execution-preflight-warning-${index}`}>{message}</li>
              ))}
              {labMockExecutionIntents.slice(0, 3).map((intent, index) => (
                <li key={`mock-execution-intent-${index}`}>{intent.symbol || "SYMBOL_PLACEHOLDER"} / {formatStatus(intent.side || "mock_hold")} / {Number(intent.mockEstimatedAmount || 0).toLocaleString("ko-KR")} mock amount</li>
              ))}
              {labMockPositionImpactRows.slice(0, 2).map((row, index) => (
                <li key={`mock-position-impact-${index}`}>{row.symbol || "SYMBOL_PLACEHOLDER"} / projected {Number(row.projectedMockQuantity || 0).toLocaleString("ko-KR")} / gap {Number(row.projectedWeightGap || 0).toFixed(2)}pp</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockExecutionReviewResult" data-admin-panel-key="trading-lab-mock-execution-review-result">
            <span>Mock execution review result</span>
            <h4>{formatStatus(labMockExecutionReviewResult.reviewStatus || labMockExecutionReviewResultStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This result is for FINPLE internal mock execution preview review only. It does not execute orders, create live fills, query balances, call KIS, or change live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockExecutionReviewCards">
              <div>
                <span>Redacted receipt</span>
                <strong>{formatStatus(labMockExecutionReviewReceipt.reviewStatus || "blocked")}</strong>
                <small>{formatStatus(labMockExecutionReviewReceipt.nextAllowedStep || "mock_fill_simulation_preflight")}</small>
              </div>
              <div>
                <span>Intent review</span>
                <strong>{Number(labMockExecutionIntentReviewSummary.executionIntentCount || labMockExecutionReviewReceipt.executionIntentCount || 0)}</strong>
                <small>{Number(labMockExecutionIntentReviewSummary.blockedExecutionIntentCount || 0)} blocked / {Number(labMockExecutionIntentReviewSummary.warningExecutionIntentCount || 0)} warning</small>
              </div>
              <div>
                <span>Fill plan review</span>
                <strong>{formatStatus(labMockFillPlanReviewSummary.status || labMockExecutionReviewResult.fillPlanStatus || "validation_required")}</strong>
                <small>{Number(labMockFillPlanReviewSummary.fillPlanCount || labMockFillPlanReviewRows.length || 0)} mock plans</small>
              </div>
              <div>
                <span>Cash review</span>
                <strong>{formatStatus(labMockCashImpactReviewSummary.status || labMockExecutionReviewResult.cashImpactStatus || "validation_required")}</strong>
                <small>no actual balance query</small>
              </div>
              <div>
                <span>Position review</span>
                <strong>{formatStatus(labMockPositionImpactReviewSummary.status || labMockExecutionReviewResult.positionImpactStatus || "validation_required")}</strong>
                <small>{Number(labMockPositionImpactReviewSummary.rowCount || labMockPositionImpactReviewRows.length || 0)} mock rows</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockExecutionReviewResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockExecutionReviewResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockExecutionReviewList" aria-label="Mock execution review result blockers warnings and decisions">
              {(labMockExecutionReviewDecisionSummary.messages || ["KIS calls and order submission remain blocked."]).map((message, index) => (
                <li key={`mock-execution-review-decision-${index}`}>{message}</li>
              ))}
              {(labMockExecutionReviewBlockerSummary.blockerMessages || []).map((message, index) => (
                <li key={`mock-execution-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockExecutionReviewBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`mock-execution-review-warning-${index}`}>{message}</li>
              ))}
              {labMockExecutionIntentReviewRows.slice(0, 3).map((row, index) => (
                <li key={`mock-execution-review-intent-${index}`}>{row.symbol || "SYMBOL_PLACEHOLDER"} / {formatStatus(row.sideLabel || "mock hold intent")} / {row.fillPlanBasis || "static mock price series only"}</li>
              ))}
              {labMockFillPlanReviewRows.slice(0, 2).map((row, index) => (
                <li key={`mock-execution-review-fill-plan-${index}`}>{row.symbol || "SYMBOL_PLACEHOLDER"} / {formatStatus(row.fillPolicy || "mock_close_price")} / {formatStatus(row.mockPriceSource || "static_mock_series")}</li>
              ))}
              {labMockPositionImpactReviewRows.slice(0, 2).map((row, index) => (
                <li key={`mock-execution-review-position-${index}`}>{row.symbol || "SYMBOL_PLACEHOLDER"} / projected weight {Number(row.projectedWeight || 0).toFixed(2)} / gap {Number(row.projectedWeightGap || 0).toFixed(2)}pp</li>
              ))}
              {labMockExecutionReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-execution-review-history-${index}`}>{item.historyId || `mock_execution_review_history_${index + 1}`} / {formatStatus(item.reviewStatus || "blocked")} / {formatStatus(item.decision || "blocked")}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockFillSimulationPreflight" data-admin-panel-key="trading-lab-mock-fill-simulation-preflight">
            <span>Mock fill simulation preflight</span>
            <h4>{formatStatus(labMockFillSimulationResult.status || labMockFillSimulationPreflightStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This result is a FINPLE internal mock fill simulation preview only. It does not execute orders, create live fills, query prices or balances, call KIS, or change live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockFillSimulationCards">
              <div>
                <span>Mock fill candidates</span>
                <strong>{Number(labMockFillSimulationResult.fillCandidateCount || labMockFillSimulationCandidates.length || 0)}</strong>
                <small>{formatStatus(labMockFillSimulationResult.nextAllowedStep || "mock_fill_simulation_review")}</small>
              </div>
              <div>
                <span>Fill policy</span>
                <strong>{formatStatus(labMockFillSimulationResult.fillPolicyStatus || labMockFillSimulationPolicyValidation.fillPolicyStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockFillSimulationResult.fillPriceSourceStatus || labMockFillSimulationPolicyValidation.fillPriceSourceStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Slippage / fee</span>
                <strong>{formatStatus(labMockFillSimulationResult.slippageStatus || labMockFillSimulationSlippageFee.status || "validation_required")}</strong>
                <small>{Number(labMockFillSimulationSlippageFee.mockFeeAmount || 0).toLocaleString("ko-KR")} mock fee</small>
              </div>
              <div>
                <span>Cash validation</span>
                <strong>{formatStatus(labMockFillSimulationResult.cashImpactStatus || labMockFillSimulationCashImpact.status || "validation_required")}</strong>
                <small>{Number(labMockFillSimulationCashImpact.projectedCashPlaceholder || 0).toLocaleString("ko-KR")} projected cash</small>
              </div>
              <div>
                <span>Position validation</span>
                <strong>{formatStatus(labMockFillSimulationResult.positionImpactStatus || labMockFillSimulationPositionImpact.status || "validation_required")}</strong>
                <small>{Number(labMockFillSimulationPositionRows.length || 0)} mock rows</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockFillSimulationResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockFillSimulationResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockFillSimulationList" aria-label="Mock fill simulation preflight blockers warnings and previews">
              {(labMockFillSimulationBlockerSummary.blockerMessages || labMockFillSimulationBlockerSummary.blockers || ["KIS calls and order submission remain blocked."]).map((message, index) => (
                <li key={`mock-fill-simulation-preflight-blocker-${index}`}>{message}</li>
              ))}
              {(labMockFillSimulationBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`mock-fill-simulation-preflight-warning-${index}`}>{message}</li>
              ))}
              {labMockFillSimulationCandidates.slice(0, 3).map((candidate, index) => (
                <li key={`mock-fill-simulation-candidate-${index}`}>{candidate.symbol || "SYMBOL_PLACEHOLDER"} / {formatStatus(candidate.side || "mock_hold")} / {formatStatus(candidate.fillPolicy || "mock_close_price")} / {Number(candidate.mockNetAmount || 0).toLocaleString("ko-KR")} mock net</li>
              ))}
              {labMockFillSimulationPositionRows.slice(0, 2).map((row, index) => (
                <li key={`mock-fill-position-impact-${index}`}>{row.symbol || "SYMBOL_PLACEHOLDER"} / projected {Number(row.projectedMockQuantity || 0).toLocaleString("ko-KR")} / gap {Number(row.projectedWeightGap || 0).toFixed(2)}pp</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockFillSimulationReview" data-admin-panel-key="trading-lab-mock-fill-simulation-review-result">
            <span>Mock fill simulation review result</span>
            <h4>{formatStatus(labMockFillSimulationReviewResult.reviewStatus || labMockFillSimulationReviewGate.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This receipt is a FINPLE internal mock fill simulation review only. It does not create live fills, execution records, KIS fill payloads, DB writes, or live/provider/order gate changes.
            </p>
            <div className="tradingLabReviewCards tradingLabMockFillSimulationReviewCards">
              <div>
                <span>Review receipt</span>
                <strong>{formatStatus(labMockFillSimulationReviewReceipt.reviewStatus || labMockFillSimulationReviewResult.reviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockFillSimulationReviewReceipt.nextAllowedStep || "mock_fill_simulation_core_preflight")}</small>
              </div>
              <div>
                <span>Decision</span>
                <strong>{formatStatus(labMockFillSimulationReviewResult.decision || labMockFillSimulationReviewDecisionSummary.decision || "blocked")}</strong>
                <small>{Number(labMockFillSimulationReviewReceipt.blockerCount || 0)} blockers / {Number(labMockFillSimulationReviewReceipt.warningCount || 0)} warnings</small>
              </div>
              <div>
                <span>Slippage / fee review</span>
                <strong>{formatStatus(labMockFillSimulationReviewImpactSummary.slippageReviewStatus || labMockFillSimulationReviewResult.slippageReviewStatus || "validation_required")}</strong>
                <small>{Number(labMockFillSimulationReviewImpactSummary.estimatedMockFee || 0).toLocaleString("ko-KR")} mock fee</small>
              </div>
              <div>
                <span>Cash review</span>
                <strong>{formatStatus(labMockFillSimulationReviewImpactSummary.cashImpactReviewStatus || labMockFillSimulationReviewResult.cashImpactReviewStatus || "validation_required")}</strong>
                <small>{Number(labMockFillSimulationReviewImpactSummary.cashAfterMockFillPlaceholder || 0).toLocaleString("ko-KR")} mock cash</small>
              </div>
              <div>
                <span>Position review</span>
                <strong>{formatStatus(labMockFillSimulationReviewImpactSummary.positionImpactReviewStatus || labMockFillSimulationReviewResult.positionImpactReviewStatus || "validation_required")}</strong>
                <small>{Number(labMockFillSimulationReviewImpactRows.length || 0)} mock rows</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockFillSimulationReviewResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockFillSimulationReviewResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockFillSimulationReviewList" aria-label="Mock fill simulation review result blockers warnings and decisions">
              {(labMockFillSimulationReviewDecisionSummary.messages || ["KIS calls and order submission remain blocked."]).map((message, index) => (
                <li key={`mock-fill-simulation-review-decision-${index}`}>{message}</li>
              ))}
              {(labMockFillSimulationReviewBlockerSummary.blockerMessages || []).map((message, index) => (
                <li key={`mock-fill-simulation-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockFillSimulationReviewBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`mock-fill-simulation-review-warning-${index}`}>{message}</li>
              ))}
              {labMockFillSimulationReviewImpactRows.slice(0, 3).map((row, index) => (
                <li key={`mock-fill-simulation-review-impact-${index}`}>{row.symbol || "SYMBOL_PLACEHOLDER"} / projected {Number(row.projectedMockQuantity || 0).toLocaleString("ko-KR")} / gap {Number(row.projectedWeightGap || 0).toFixed(2)}pp</li>
              ))}
              {labMockFillSimulationReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-fill-simulation-review-history-${index}`}>{item.historyId || `mock_fill_simulation_review_history_${index + 1}`} / {formatStatus(item.reviewStatus || "blocked")} / {formatStatus(item.decision || "blocked")}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockFillSimulationCorePreflight" data-admin-panel-key="trading-lab-mock-fill-simulation-core-preflight">
            <span>Mock fill simulation core preflight</span>
            <h4>{formatStatus(labMockFillSimulationCoreResult.status || labMockFillSimulationCorePreflight.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This preflight prepares FINPLE internal mock fill simulation core inputs only. It does not execute orders, create fills, update cash or positions, call KIS, write DB state, or open live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockFillCoreCards">
              <div>
                <span>Input bundle</span>
                <strong>{formatStatus(labMockFillSimulationCoreResult.inputBundleStatus || labMockFillCoreInputBundle.cashPlaceholderStatus || "validation_required")}</strong>
                <small>{Number(labMockFillCoreInputBundle.candidateCount || 0)} mock candidates</small>
              </div>
              <div>
                <span>Fill scenario</span>
                <strong>{formatStatus(labMockFillSimulationCoreResult.fillScenarioStatus || labMockFillScenario.priceSource || "static_mock_series")}</strong>
                <small>{formatStatus(labMockFillScenario.fillPolicy || "mock_close_price")} / {formatStatus(labMockFillScenario.fillTiming || "mock_same_day")}</small>
              </div>
              <div>
                <span>Pricing / slippage / fee</span>
                <strong>{formatStatus(labMockFillSimulationCoreResult.pricingPolicyStatus || labMockFillCorePolicyValidation.status || "validation_required")}</strong>
                <small>{Number(labMockFillCorePolicyValidation.mockFeeRate || 0).toFixed(4)} mock fee rate</small>
              </div>
              <div>
                <span>Cash availability</span>
                <strong>{formatStatus(labMockFillSimulationCoreResult.cashAvailabilityStatus || labMockFillCoreCashAvailability.status || "validation_required")}</strong>
                <small>{Number(labMockFillCoreCashAvailability.projectedCashPlaceholder || 0).toLocaleString("ko-KR")} mock cash</small>
              </div>
              <div>
                <span>Position impact</span>
                <strong>{formatStatus(labMockFillSimulationCoreResult.positionImpactStatus || labMockFillCorePositionImpact.status || "validation_required")}</strong>
                <small>{Number(labMockFillCorePositionRows.length || 0)} mock rows</small>
              </div>
              <div>
                <span>Deterministic readiness</span>
                <strong>{formatStatus(labMockFillSimulationCoreResult.deterministicCalculationStatus || labMockFillCoreDeterministicReadiness.status || "validation_required")}</strong>
                <small>{formatStatus(labMockFillSimulationCoreResult.nextAllowedStep || "mock_fill_simulation_core")}</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockFillSimulationCoreResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockFillSimulationCoreResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockFillCoreList" aria-label="Mock fill simulation core preflight blockers warnings and readiness">
              {(labMockFillCoreBlockerSummary.blockerMessages || labMockFillCoreBlockerSummary.blockers || ["KIS calls, order submission, fill records, cash updates, and position updates remain blocked."]).map((message, index) => (
                <li key={`mock-fill-core-preflight-blocker-${index}`}>{message}</li>
              ))}
              {(labMockFillCoreBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`mock-fill-core-preflight-warning-${index}`}>{message}</li>
              ))}
              {labMockFillCorePositionRows.slice(0, 3).map((row, index) => (
                <li key={`mock-fill-core-position-${index}`}>{row.symbol || "SYMBOL_PLACEHOLDER"} / projected {Number(row.projectedMockQuantity || 0).toLocaleString("ko-KR")} / gap {Number(row.projectedWeightGap || 0).toFixed(2)}pp</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockFillCoreReview" data-admin-panel-key="trading-lab-mock-fill-simulation-core-review-result">
            <span>Mock fill simulation core review result</span>
            <h4>{formatStatus(labMockFillSimulationCoreReviewResult.reviewStatus || labMockFillCoreReviewReceipt.reviewStatus || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This review records FINPLE internal mock fill simulation core preparation only. It does not execute orders, create fill records, update cash or positions, call KIS, write DB state, or open live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockFillCoreReviewCards">
              <div>
                <span>Review receipt</span>
                <strong>{formatStatus(labMockFillCoreReviewReceipt.reviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockFillCoreReviewReceipt.decision || "blocked")}</small>
              </div>
              <div>
                <span>Decision</span>
                <strong>{formatStatus(labMockFillSimulationCoreReviewResult.decision || "blocked")}</strong>
                <small>{formatStatus(labMockFillCoreReviewReceipt.nextAllowedStep || "mock_fill_simulation_core")}</small>
              </div>
              <div>
                <span>Pricing / slippage / fee</span>
                <strong>{formatStatus(labMockFillCorePolicyReviewSummary.pricingPolicyReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockFillCorePolicyReviewSummary.slippagePolicyReviewStatus || "validation_required")} / {formatStatus(labMockFillCorePolicyReviewSummary.feePolicyReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Cash / position</span>
                <strong>{formatStatus(labMockFillCorePolicyReviewSummary.cashAvailabilityReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockFillCorePolicyReviewSummary.positionImpactReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Deterministic readiness</span>
                <strong>{formatStatus(labMockFillCorePolicyReviewSummary.deterministicCalculationReviewStatus || "validation_required")}</strong>
                <small>{Number(labMockFillCorePolicyReviewSummary.positionRowCount || 0)} mock rows</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockFillSimulationCoreReviewResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockFillSimulationCoreReviewResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockFillCoreReviewList" aria-label="Mock fill simulation core review result blockers warnings and decisions">
              {(labMockFillCoreReviewDecisionSummary.messages || ["KIS calls, order submission, fill records, cash updates, and position updates remain blocked."]).map((message, index) => (
                <li key={`mock-fill-core-review-decision-${index}`}>{message}</li>
              ))}
              {(labMockFillCoreReviewBlockerSummary.blockerMessages || []).map((message, index) => (
                <li key={`mock-fill-core-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockFillCoreReviewBlockerSummary.warningMessages || []).map((message, index) => (
                <li key={`mock-fill-core-review-warning-${index}`}>{message}</li>
              ))}
              {labMockFillCoreReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-fill-core-review-history-${index}`}>{item.historyId || `mock_fill_core_review_history_${index + 1}`} / {formatStatus(item.reviewStatus || "blocked")} / {formatStatus(item.decision || "blocked")}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockFillCoreResult" data-admin-panel-key="trading-lab-mock-fill-simulation-core">
            <span>Mock fill simulation core</span>
            <h4>{formatStatus(labMockFillSimulationCoreStatus.status || labMockFillCoreValidation.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This result is a FINPLE internal mock fill simulation calculation only. It does not execute orders, create actual fills, update real cash or positions, call KIS, write DB state, or open live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockFillCoreResultCards">
              <div>
                <span>Mock fill result</span>
                <strong>{Number(labMockFillResultSummary.fillResultCount || labMockFillResults.length || 0)}</strong>
                <small>{formatStatus(labMockFillResultSummary.nextAllowedStep || "mock_portfolio_ledger_update_preflight")}</small>
              </div>
              <div>
                <span>Fill status</span>
                <strong>{formatStatus(labMockFillCoreValidation.calculationStatus || "validation_required")}</strong>
                <small>{Number(labMockFillResultSummary.partialCount || 0)} partial / {Number(labMockFillResultSummary.rejectedCount || 0)} rejected</small>
              </div>
              <div>
                <span>Price / slippage / fee</span>
                <strong>{Number(labMockFillResultSummary.totalMockFee || 0).toLocaleString("ko-KR")}</strong>
                <small>{Number(labMockFillResultSummary.totalMockSlippage || 0).toLocaleString("ko-KR")} mock slippage</small>
              </div>
              <div>
                <span>Gross / net amount</span>
                <strong>{Number(labMockFillResultSummary.totalGrossAmount || 0).toLocaleString("ko-KR")}</strong>
                <small>{Number(labMockFillResultSummary.totalNetAmount || 0).toLocaleString("ko-KR")} mock net</small>
              </div>
              <div>
                <span>Cash / position delta</span>
                <strong>{Number(labMockFillResultSummary.cashDelta || 0).toLocaleString("ko-KR")}</strong>
                <small>{Number(labMockFillResultSummary.positionDeltaCount || 0)} mock position deltas</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockFillResultSummary.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockFillResultSummary.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockFillCoreResultList" aria-label="Mock fill simulation core result rows and guardrails">
              {labMockFillResults.slice(0, 4).map((result, index) => (
                <li key={`mock-fill-core-result-${index}`}>{result.symbol || "SYMBOL_PLACEHOLDER"} / {formatStatus(result.fillStatus || "validation_required")} / qty {Number(result.filledQuantity || 0).toLocaleString("ko-KR")} / cash {Number(result.cashDelta || 0).toLocaleString("ko-KR")}</li>
              ))}
              {(labMockFillCoreValidation.blockerSummary || labMockFillCoreValidation.blockers || []).map((message, index) => (
                <li key={`mock-fill-core-result-blocker-${index}`}>{message}</li>
              ))}
              {(labMockFillCoreValidation.warningSummary || []).map((message, index) => (
                <li key={`mock-fill-core-result-warning-${index}`}>{message}</li>
              ))}
              {labMockFillCoreHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-fill-core-result-history-${index}`}>{item.historyId || `mock_fill_result_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {Number(item.fillResultCount || 0)} mock rows</li>
              ))}
              {labMockFillCalculationInputs.length === 0 ? (
                <li>Mock calculation input remains validation-required; KIS calls and order submission stay blocked.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockLedgerUpdatePreflight" data-admin-panel-key="trading-lab-mock-portfolio-ledger-update-preflight">
            <span>Mock portfolio ledger update preflight</span>
            <h4>{formatStatus(labMockPortfolioLedgerUpdatePreflightStatus.status || labMockLedgerUpdateValidation.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This preflight only checks whether FINPLE internal mock ledger update candidates can be previewed from redacted mock fill results. It does not update real account ledgers, DB state, cash, positions, fills, executions, orders, or live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockLedgerUpdatePreflightCards">
              <div>
                <span>Mock ledger candidates</span>
                <strong>{Number(labMockLedgerUpdateSummary.candidateCount || labMockLedgerUpdateCandidates.length || 0)}</strong>
                <small>{formatStatus(labMockLedgerUpdateSummary.nextAllowedStep || labMockLedgerUpdateResult.nextAllowedStep || "mock_portfolio_ledger_update_review_result")}</small>
              </div>
              <div>
                <span>Cash delta preview</span>
                <strong>{Number(labMockLedgerUpdateSummary.totalCashDelta || 0).toLocaleString("ko-KR")}</strong>
                <small>{formatStatus(labMockLedgerUpdateValidation.cashDeltaStatus || labMockLedgerUpdateResult.cashDeltaStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Position delta preview</span>
                <strong>{Number(labMockLedgerUpdateSummary.totalPositionDeltaCount || 0)}</strong>
                <small>{formatStatus(labMockLedgerUpdateValidation.positionDeltaStatus || labMockLedgerUpdateResult.positionDeltaStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Portfolio value preview</span>
                <strong>{Number(labMockLedgerUpdateResult.portfolioValueAfterPreview || 0).toLocaleString("ko-KR")}</strong>
                <small>{formatStatus(labMockLedgerUpdateValidation.portfolioValueImpactStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Ledger consistency</span>
                <strong>{formatStatus(labMockLedgerUpdateValidation.ledgerConsistencyStatus || labMockLedgerUpdateResult.ledgerConsistencyStatus || "validation_required")}</strong>
                <small>{Number(labMockLedgerUpdateValidation.blockerCount || 0)} blockers / {Number(labMockLedgerUpdateValidation.warningCount || 0)} warnings</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockLedgerUpdateResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockLedgerUpdateResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockLedgerUpdatePreflightList" aria-label="Mock portfolio ledger update preflight candidates and guardrails">
              {labMockLedgerUpdateCandidates.slice(0, 4).map((candidate, index) => (
                <li key={`mock-ledger-update-candidate-${index}`}>{candidate.symbol || "SYMBOL_PLACEHOLDER"} / {formatStatus(candidate.status || "validation_required")} / cash after {Number(candidate.cashAfterPreview || 0).toLocaleString("ko-KR")} / position after {Number(candidate.positionAfterPreview || 0).toLocaleString("ko-KR")}</li>
              ))}
              {(labMockLedgerUpdateValidation.blockerSummary || labMockLedgerUpdateValidation.blockers || []).map((message, index) => (
                <li key={`mock-ledger-update-blocker-${index}`}>{message}</li>
              ))}
              {(labMockLedgerUpdateValidation.warningSummary || []).map((message, index) => (
                <li key={`mock-ledger-update-warning-${index}`}>{message}</li>
              ))}
              {labMockLedgerUpdateHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-ledger-update-history-${index}`}>{item.historyId || `mock_ledger_update_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {Number(item.candidateCount || 0)} mock rows</li>
              ))}
              {labMockLedgerUpdateCandidates.length === 0 ? (
                <li>Mock ledger update candidates remain validation-required; no DB, account cash, or position update is performed.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockLedgerUpdateReviewResult" data-admin-panel-key="trading-lab-mock-portfolio-ledger-update-review-result">
            <span>Mock portfolio ledger update review result</span>
            <h4>{formatStatus(labMockPortfolioLedgerUpdateReviewResultStatus.status || labMockLedgerUpdateReviewResult.reviewStatus || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This result is a redacted FINPLE internal mock ledger update review receipt. It does not change real account ledgers, DB state, cash, positions, fills, executions, orders, KIS payloads, or live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockLedgerUpdateReviewCards">
              <div>
                <span>Redacted receipt</span>
                <strong>{formatStatus(labMockLedgerUpdateReviewReceipt.reviewStatus || labMockLedgerUpdateReviewResult.reviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockLedgerUpdateReviewReceipt.nextAllowedStep || "mock_portfolio_ledger_update_core_preflight")}</small>
              </div>
              <div>
                <span>Decision summary</span>
                <strong>{formatStatus(labMockLedgerUpdateReviewResult.decision || labMockLedgerUpdateReviewDecisionSummary.decision || "blocked")}</strong>
                <small>{Number(labMockLedgerUpdateReviewReceipt.blockerCount || labMockLedgerUpdateReviewValidation.blockerCount || 0)} blockers / {Number(labMockLedgerUpdateReviewReceipt.warningCount || labMockLedgerUpdateReviewValidation.warningCount || 0)} warnings</small>
              </div>
              <div>
                <span>Cash delta review</span>
                <strong>{formatStatus(labMockLedgerUpdateReviewReceipt.cashDeltaReviewStatus || labMockLedgerUpdateImpactReviewSummary.cashDeltaReviewStatus || "validation_required")}</strong>
                <small>No real account cash update</small>
              </div>
              <div>
                <span>Position delta review</span>
                <strong>{formatStatus(labMockLedgerUpdateReviewReceipt.positionDeltaReviewStatus || labMockLedgerUpdateImpactReviewSummary.positionDeltaReviewStatus || "validation_required")}</strong>
                <small>No real position update</small>
              </div>
              <div>
                <span>Value / consistency review</span>
                <strong>{formatStatus(labMockLedgerUpdateReviewReceipt.ledgerConsistencyReviewStatus || labMockLedgerUpdateImpactReviewSummary.ledgerConsistencyReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockLedgerUpdateReviewReceipt.portfolioValueImpactReviewStatus || labMockLedgerUpdateImpactReviewSummary.portfolioValueImpactReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockLedgerUpdateReviewReceipt.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockLedgerUpdateReviewReceipt.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockLedgerUpdateReviewList" aria-label="Mock portfolio ledger update review receipt and guardrails">
              {(labMockLedgerUpdateReviewResult.summary || []).slice(0, 6).map((message, index) => (
                <li key={`mock-ledger-update-review-summary-${index}`}>{message}</li>
              ))}
              {(labMockLedgerUpdateReviewDecisionSummary.decisionSummary || []).slice(0, 6).map((message, index) => (
                <li key={`mock-ledger-update-review-decision-${index}`}>{message}</li>
              ))}
              {(labMockLedgerUpdateReviewValidation.blockerSummary || labMockLedgerUpdateReviewValidation.blockers || []).map((message, index) => (
                <li key={`mock-ledger-update-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockLedgerUpdateReviewValidation.warningSummary || []).map((message, index) => (
                <li key={`mock-ledger-update-review-warning-${index}`}>{message}</li>
              ))}
              {labMockLedgerUpdateReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-ledger-update-review-history-${index}`}>{item.historyId || `mock_ledger_update_review_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_portfolio_ledger_update_core_preflight")}</li>
              ))}
              {!labMockLedgerUpdateReviewResult.reviewStatus ? (
                <li>Mock ledger update review remains validation-required; no DB, account cash, position, fill, execution, order, or KIS payload is created.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockLedgerUpdateCorePreflight" data-admin-panel-key="trading-lab-mock-portfolio-ledger-update-core-preflight">
            <span>Mock portfolio ledger update core preflight</span>
            <h4>{formatStatus(labMockPortfolioLedgerUpdateCorePreflightStatus.status || labMockLedgerUpdateCoreResult.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This preflight checks only whether a redacted FINPLE internal mock ledger core input bundle is ready for deterministic mock cash, position, valuation, and P/L preview. It does not update real account ledgers, DB state, cash, positions, fills, executions, orders, KIS payloads, or live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockLedgerUpdateCorePreflightCards">
              <div>
                <span>Core input bundle</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreSummary.inputBundleStatus || labMockLedgerUpdateCoreResult.scope || "mock_only")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreResult.nextAllowedStep || "mock_portfolio_ledger_update_core")}</small>
              </div>
              <div>
                <span>Cash ledger policy</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreResult.cashLedgerPolicyStatus || labMockLedgerUpdateCoreValidation.cashLedgerPolicyStatus || "validation_required")}</strong>
                <small>No real account cash update</small>
              </div>
              <div>
                <span>Position ledger policy</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreResult.positionLedgerPolicyStatus || labMockLedgerUpdateCoreValidation.positionLedgerPolicyStatus || "validation_required")}</strong>
                <small>No real position update</small>
              </div>
              <div>
                <span>Valuation policy</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreResult.valuationPolicyStatus || labMockLedgerUpdateCoreValidation.valuationPolicyStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockLedgerUpdateScenario.valuationPolicy || labMockLedgerCoreInputBundle.mockValuationPolicy || "static_mock_series_only")}</small>
              </div>
              <div>
                <span>P/L placeholders</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreResult.pnlPlaceholderStatus || labMockLedgerUpdateCoreValidation.pnlPlaceholderStatus || "placeholder_only")}</strong>
                <small>Realized / unrealized preview only</small>
              </div>
              <div>
                <span>Deterministic readiness</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreResult.deterministicUpdateStatus || labMockLedgerUpdateCoreValidation.deterministicUpdateStatus || "validation_required")}</strong>
                <small>{Number(labMockLedgerUpdateCoreValidation.blockerCount || 0)} blockers / {Number(labMockLedgerUpdateCoreValidation.warningCount || 0)} warnings</small>
              </div>
              <div>
                <span>Ledger consistency</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreResult.ledgerConsistencyStatus || labMockLedgerUpdateCoreValidation.ledgerConsistencyStatus || "validation_required")}</strong>
                <small>No persistent DB write</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockLedgerUpdateCorePreflightList" aria-label="Mock portfolio ledger update core preflight guardrails">
              <li>{labMockLedgerCoreInputBundle.ledgerCoreInputBundleId || "step151_mock_ledger_core_input_bundle"} / {formatStatus(labMockLedgerCoreInputBundle.scope || "mock_only")} / actual account ledger update blocked</li>
              <li>{labMockLedgerUpdateScenario.ledgerUpdateScenarioId || "step151_mock_ledger_update_scenario"} / {formatStatus(labMockLedgerUpdateScenario.updateMode || "mock_cash_position_delta_preview")} / DB write blocked</li>
              <li>Cash after preview {Number(labMockLedgerCoreInputBundle.cashAfterPreview || labMockLedgerUpdateCoreResult.cashAfterPreview || 0).toLocaleString("ko-KR")} / position after preview {Number(labMockLedgerCoreInputBundle.positionAfterPreview || labMockLedgerUpdateCoreResult.positionAfterPreview || 0).toLocaleString("ko-KR")}</li>
              <li>Portfolio value preview {Number(labMockLedgerCoreInputBundle.portfolioValueAfterPreview || labMockLedgerUpdateCoreResult.portfolioValueAfterPreview || 0).toLocaleString("ko-KR")} / KIS calls blocked</li>
              {(labMockLedgerUpdateCoreValidation.blockerSummary || labMockLedgerUpdateCoreValidation.blockers || []).map((message, index) => (
                <li key={`mock-ledger-update-core-blocker-${index}`}>{message}</li>
              ))}
              {(labMockLedgerUpdateCoreValidation.warningSummary || []).map((message, index) => (
                <li key={`mock-ledger-update-core-warning-${index}`}>{message}</li>
              ))}
              {labMockLedgerUpdateCoreHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-ledger-update-core-history-${index}`}>{item.historyId || `mock_ledger_update_core_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_portfolio_ledger_update_core")}</li>
              ))}
              {!labMockLedgerUpdateCoreResult.status ? (
                <li>Mock ledger update core preflight remains validation-required; no actual cash, position, portfolio ledger, fill, execution, order, provider, or DB update is performed.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockLedgerUpdateCoreReviewResult" data-admin-panel-key="trading-lab-mock-portfolio-ledger-update-core-review-result">
            <span>Mock portfolio ledger update core review result</span>
            <h4>{formatStatus(labMockPortfolioLedgerUpdateCoreReviewResultStatus.status || labMockLedgerUpdateCoreReviewResult.reviewStatus || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This result is a redacted FINPLE internal mock portfolio ledger update core review receipt. It does not update real account ledgers, DB state, cash, positions, fills, executions, orders, KIS payloads, or live/provider/order gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockLedgerUpdateCoreReviewCards">
              <div>
                <span>Redacted receipt</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.reviewStatus || labMockLedgerUpdateCoreReviewResult.reviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.nextAllowedStep || "mock_portfolio_ledger_update_core")}</small>
              </div>
              <div>
                <span>Decision summary</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreReviewResult.decision || labMockLedgerUpdateCoreReviewDecisionSummary.decision || "blocked")}</strong>
                <small>{Number(labMockLedgerUpdateCoreReviewReceipt.blockerCount || labMockLedgerUpdateCoreReviewValidation.blockerCount || 0)} blockers / {Number(labMockLedgerUpdateCoreReviewReceipt.warningCount || labMockLedgerUpdateCoreReviewValidation.warningCount || 0)} warnings</small>
              </div>
              <div>
                <span>Cash ledger review</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.cashLedgerPolicyReviewStatus || labMockLedgerUpdateCorePolicyReviewSummary.cashLedgerPolicyReviewStatus || "validation_required")}</strong>
                <small>No real account cash update</small>
              </div>
              <div>
                <span>Position ledger review</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.positionLedgerPolicyReviewStatus || labMockLedgerUpdateCorePolicyReviewSummary.positionLedgerPolicyReviewStatus || "validation_required")}</strong>
                <small>No real position update</small>
              </div>
              <div>
                <span>Valuation / P&amp;L review</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.portfolioValuationPolicyReviewStatus || labMockLedgerUpdateCorePolicyReviewSummary.portfolioValuationPolicyReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.realizedPnlPolicyReviewStatus || labMockLedgerUpdateCorePolicyReviewSummary.realizedPnlPolicyReviewStatus || "validation_required")} / {formatStatus(labMockLedgerUpdateCoreReviewReceipt.unrealizedPnlPolicyReviewStatus || labMockLedgerUpdateCorePolicyReviewSummary.unrealizedPnlPolicyReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Consistency review</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.ledgerConsistencyReviewStatus || labMockLedgerUpdateCorePolicyReviewSummary.ledgerConsistencyReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.deterministicUpdateReviewStatus || labMockLedgerUpdateCorePolicyReviewSummary.deterministicUpdateReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreReviewReceipt.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockLedgerUpdateCoreReviewList" aria-label="Mock portfolio ledger update core review receipt and guardrails">
              {(labMockLedgerUpdateCoreReviewResult.summary || []).slice(0, 7).map((message, index) => (
                <li key={`mock-ledger-update-core-review-summary-${index}`}>{message}</li>
              ))}
              {(labMockLedgerUpdateCoreReviewDecisionSummary.decisionSummary || []).slice(0, 7).map((message, index) => (
                <li key={`mock-ledger-update-core-review-decision-${index}`}>{message}</li>
              ))}
              {(labMockLedgerUpdateCoreReviewValidation.blockerSummary || labMockLedgerUpdateCoreReviewValidation.blockers || []).map((message, index) => (
                <li key={`mock-ledger-update-core-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockLedgerUpdateCoreReviewValidation.warningSummary || []).map((message, index) => (
                <li key={`mock-ledger-update-core-review-warning-${index}`}>{message}</li>
              ))}
              {labMockLedgerUpdateCoreReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-ledger-update-core-review-history-${index}`}>{item.historyId || `mock_ledger_update_core_review_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_portfolio_ledger_update_core")}</li>
              ))}
              {!labMockLedgerUpdateCoreReviewResult.reviewStatus ? (
                <li>Mock ledger update core review remains validation-required; no real portfolio ledger update, account balance query, cash or position update, DB write, provider call, or order submission is performed.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockLedgerUpdateCoreResult" data-admin-panel-key="trading-lab-mock-portfolio-ledger-update-core">
            <span>Mock portfolio ledger update result</span>
            <h4>{formatStatus(labMockPortfolioLedgerUpdateCoreStatus.status || labMockLedgerUpdateCoreFinalResult.updateStatus || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This is a FINPLE internal mock ledger update result. It does not update a real account ledger, write DB state, update actual cash or positions, create fills or executions, submit orders, or open KIS/provider/live gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockLedgerUpdateCoreResultCards">
              <div>
                <span>Mock update status</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreFinalResult.updateStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreFinalSummary.nextAllowedStep || "mock_portfolio_performance_recalculation_preflight")}</small>
              </div>
              <div>
                <span>Mock cash ledger</span>
                <strong>{formatStatus(labMockCashLedgerUpdateCoreResult.cashUpdateStatus || labMockLedgerUpdateCoreFinalValidation.cashUpdateStatus || "validation_required")}</strong>
                <small>{Number(labMockCashLedgerUpdateCoreResult.cashBefore || labMockLedgerUpdateCoreFinalResult.cashBefore || 0).toLocaleString("ko-KR")}{" -> "}{Number(labMockCashLedgerUpdateCoreResult.cashAfter || labMockLedgerUpdateCoreFinalResult.cashAfter || 0).toLocaleString("ko-KR")}</small>
              </div>
              <div>
                <span>Mock position ledger</span>
                <strong>{formatStatus(labMockPositionLedgerUpdateCoreResult.positionUpdateStatus || labMockLedgerUpdateCoreFinalValidation.positionUpdateStatus || "validation_required")}</strong>
                <small>{Number(labMockPositionLedgerUpdateCoreResult.positionBefore || labMockLedgerUpdateCoreFinalResult.positionBefore || 0).toLocaleString("ko-KR")}{" -> "}{Number(labMockPositionLedgerUpdateCoreResult.positionAfter || labMockLedgerUpdateCoreFinalResult.positionAfter || 0).toLocaleString("ko-KR")}</small>
              </div>
              <div>
                <span>Mock portfolio value</span>
                <strong>{formatStatus(labMockPortfolioValueUpdateCoreResult.valuationStatus || labMockLedgerUpdateCoreFinalValidation.valuationStatus || "validation_required")}</strong>
                <small>{Number(labMockPortfolioValueUpdateCoreResult.portfolioValueBefore || labMockLedgerUpdateCoreFinalResult.portfolioValueBefore || 0).toLocaleString("ko-KR")}{" -> "}{Number(labMockPortfolioValueUpdateCoreResult.portfolioValueAfter || labMockLedgerUpdateCoreFinalResult.portfolioValueAfter || 0).toLocaleString("ko-KR")}</small>
              </div>
              <div>
                <span>P/L placeholders</span>
                <strong>{formatStatus(labMockPnlPlaceholderCoreResult.pnlStatus || labMockLedgerUpdateCoreFinalValidation.pnlStatus || "placeholder_only")}</strong>
                <small>{Number(labMockPnlPlaceholderCoreResult.realizedPnlPlaceholder || labMockLedgerUpdateCoreFinalResult.realizedPnlPlaceholder || 0).toLocaleString("ko-KR")} / {Number(labMockPnlPlaceholderCoreResult.unrealizedPnlPlaceholder || labMockLedgerUpdateCoreFinalResult.unrealizedPnlPlaceholder || 0).toLocaleString("ko-KR")}</small>
              </div>
              <div>
                <span>Ledger consistency</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreFinalResult.ledgerConsistencyStatus || labMockLedgerUpdateCoreFinalValidation.ledgerConsistencyStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreFinalValidation.deterministicCalculationStatus || "deterministic")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreFinalResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreFinalResult.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Live readiness</span>
                <strong>{formatStatus(labMockLedgerUpdateCoreFinalResult.liveTradingImpact || "blocked")}</strong>
                <small>{formatStatus(labMockLedgerUpdateCoreFinalResult.readinessImpact || "none")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockLedgerUpdateCoreResultList" aria-label="Mock portfolio ledger update core result guardrails">
              <li>{labMockLedgerUpdateCoreFinalResult.ledgerUpdateResultId || "step153_mock_portfolio_ledger_update_result"} / {formatStatus(labMockLedgerUpdateCoreFinalResult.scope || "mock_only")} / real DB ledger update blocked</li>
              <li>Cash delta {Number(labMockLedgerUpdateCoreFinalResult.cashDelta || 0).toLocaleString("ko-KR")} / position delta {Number(labMockLedgerUpdateCoreFinalResult.positionDelta || 0).toLocaleString("ko-KR")} / deterministic calculation only</li>
              <li>Portfolio value delta {Number(labMockLedgerUpdateCoreFinalResult.portfolioValueDelta || 0).toLocaleString("ko-KR")} / no actual account balance query</li>
              <li>Not a real fill result, not a real order candidate, and not a KIS order/execution/fill payload.</li>
              {(labMockLedgerUpdateCoreFinalValidation.blockerSummary || labMockLedgerUpdateCoreFinalValidation.blockers || []).map((message, index) => (
                <li key={`mock-ledger-update-core-result-blocker-${index}`}>{message}</li>
              ))}
              {(labMockLedgerUpdateCoreFinalValidation.warningSummary || []).map((message, index) => (
                <li key={`mock-ledger-update-core-result-warning-${index}`}>{message}</li>
              ))}
              {labMockLedgerUpdateCoreFinalHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-ledger-update-core-result-history-${index}`}>{item.historyId || `mock_ledger_update_core_result_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_portfolio_performance_recalculation_preflight")}</li>
              ))}
              {!labMockLedgerUpdateCoreFinalResult.updateStatus ? (
                <li>Mock ledger update result remains validation-required; no actual cash, position, portfolio ledger, fill, execution, order, provider, or DB update is performed.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockPerformanceRecalculationPreflight" data-admin-panel-key="trading-lab-mock-portfolio-performance-recalculation-preflight">
            <span>Mock portfolio performance recalculation preflight</span>
            <h4>{formatStatus(labMockPortfolioPerformanceRecalculationPreflightStatus.status || labMockPerformanceRecalculationResult.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This preflight only checks whether FINPLE internal mock performance recalculation inputs are ready. It does not write DB state, update a real portfolio ledger, update actual cash or positions, query an account balance, submit orders, or open KIS/provider/live gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockPerformanceRecalculationPreflightCards">
              <div>
                <span>Input bundle</span>
                <strong>{formatStatus(labMockPerformanceInputBundle.scope || "mock_only")}</strong>
                <small>{labMockPerformanceInputBundle.performanceInputBundleId || "step154_mock_performance_recalculation_input_bundle"}</small>
              </div>
              <div>
                <span>Equity series</span>
                <strong>{formatStatus(labMockPerformanceRecalculationResult.equitySeriesStatus || labMockPerformanceValidation.equitySeriesStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceInputBundle.equityAfterPreview || labMockPerformanceRecalculationResult.equityAfterPreview || 0).toLocaleString("ko-KR")}</small>
              </div>
              <div>
                <span>Daily return</span>
                <strong>{formatStatus(labMockPerformanceRecalculationResult.dailyReturnStatus || labMockPerformanceValidation.dailyReturnStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceRecalculationResult.dailyReturnPreview || labMockPerformanceValidation.dailyReturnPreview || 0).toFixed(4)}%</small>
              </div>
              <div>
                <span>Cumulative return</span>
                <strong>{formatStatus(labMockPerformanceRecalculationResult.cumulativeReturnStatus || labMockPerformanceValidation.cumulativeReturnStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceRecalculationResult.cumulativeReturnPreview || labMockPerformanceValidation.cumulativeReturnPreview || 0).toFixed(4)}%</small>
              </div>
              <div>
                <span>Drawdown / MDD</span>
                <strong>{formatStatus(labMockPerformanceRecalculationResult.drawdownStatus || labMockPerformanceValidation.drawdownStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceRecalculationResult.mddStatus || labMockPerformanceValidation.mddStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Allocation</span>
                <strong>{formatStatus(labMockPerformanceRecalculationResult.allocationStatus || labMockPerformanceValidation.allocationStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceInputBundle.portfolioValueAfterPreview || 0).toLocaleString("ko-KR")}</small>
              </div>
              <div>
                <span>KPI / chart data</span>
                <strong>{formatStatus(labMockPerformanceRecalculationResult.kpiSummaryStatus || labMockPerformanceValidation.kpiSummaryStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceRecalculationResult.chartDataStatus || labMockPerformanceValidation.chartDataStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockPerformanceRecalculationResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockPerformanceRecalculationResult.orderSubmissionImpact || "blocked")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockPerformanceRecalculationPreflightList" aria-label="Mock portfolio performance recalculation preflight guardrails">
              <li>{labMockPerformanceRecalculationResult.performanceRecalculationPreflightId || "step154_mock_portfolio_performance_recalculation_preflight"} / {formatStatus(labMockPerformanceRecalculationResult.scope || "mock_only")} / real DB performance update blocked</li>
              <li>{labMockPerformanceScenario.scenarioName || "Mock portfolio performance recalculation readiness"} / {formatStatus(labMockPerformanceScenario.recalculationMode || "equity_return_allocation_preview")}</li>
              <li>Actual performance record update, actual cash update, actual position update, and real portfolio ledger update remain blocked.</li>
              <li>KIS calls, provider calls, quote queries, token issuance, order submission, and live readiness remain blocked.</li>
              <li>Next allowed step: {formatStatus(labMockPerformanceSummary.nextAllowedStep || labMockPerformanceRecalculationResult.nextAllowedStep || "mock_portfolio_performance_recalculation_review_result")}</li>
              {(labMockPerformanceValidation.blockerSummary || labMockPerformanceValidation.blockers || []).map((message, index) => (
                <li key={`mock-performance-recalculation-preflight-blocker-${index}`}>{message}</li>
              ))}
              {(labMockPerformanceValidation.warningSummary || []).map((message, index) => (
                <li key={`mock-performance-recalculation-preflight-warning-${index}`}>{message}</li>
              ))}
              {labMockPerformanceHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-performance-recalculation-preflight-history-${index}`}>{item.historyId || `mock_performance_recalculation_preflight_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_portfolio_performance_recalculation_review_result")}</li>
              ))}
              {!labMockPerformanceRecalculationResult.status ? (
                <li>Mock performance recalculation preflight remains validation-required; no real account, DB, provider, order, fill, execution, cash, position, ledger, or performance mutation is performed.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockPerformanceRecalculationReviewResult" data-admin-panel-key="trading-lab-mock-portfolio-performance-recalculation-review-result">
            <span>Mock portfolio performance recalculation review result</span>
            <h4>{formatStatus(labMockPerformanceReviewResult.reviewStatus || labMockPortfolioPerformanceRecalculationReviewResultStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This is a FINPLE internal mock performance recalculation review receipt. It does not confirm real investment performance, update DB state, update actual cash or positions, mutate a real portfolio ledger, query account balances, submit orders, or open KIS/provider/live gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockPerformanceRecalculationReviewCards">
              <div>
                <span>Review status</span>
                <strong>{formatStatus(labMockPerformanceReviewResult.reviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceReviewResult.decision || "blocked")}</small>
              </div>
              <div>
                <span>Redacted receipt</span>
                <strong>{labMockPerformanceReviewReceipt.redacted === true ? "redacted" : "blocked"}</strong>
                <small>{labMockPerformanceReviewReceipt.receiptId || "step155_mock_performance_recalculation_review_receipt"}</small>
              </div>
              <div>
                <span>Equity review</span>
                <strong>{formatStatus(labMockPerformanceReviewSummary.equitySeriesReviewStatus || labMockPerformanceReviewResult.equitySeriesReviewStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceReviewResult.equityAfterPreview || labMockPerformanceRecalculationResult.equityAfterPreview || 0).toLocaleString("ko-KR")}</small>
              </div>
              <div>
                <span>Return review</span>
                <strong>{formatStatus(labMockPerformanceReviewSummary.dailyReturnReviewStatus || labMockPerformanceReviewResult.dailyReturnReviewStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceReviewResult.dailyReturnPreview || labMockPerformanceRecalculationResult.dailyReturnPreview || 0).toFixed(4)}% / {Number(labMockPerformanceReviewResult.cumulativeReturnPreview || labMockPerformanceRecalculationResult.cumulativeReturnPreview || 0).toFixed(4)}%</small>
              </div>
              <div>
                <span>Drawdown / MDD review</span>
                <strong>{formatStatus(labMockPerformanceReviewSummary.drawdownReviewStatus || labMockPerformanceReviewResult.drawdownReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceReviewSummary.mddReviewStatus || labMockPerformanceReviewResult.mddReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Allocation / KPI review</span>
                <strong>{formatStatus(labMockPerformanceReviewSummary.allocationReviewStatus || labMockPerformanceReviewResult.allocationReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceReviewSummary.kpiReviewStatus || labMockPerformanceReviewResult.kpiReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockPerformanceReviewResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockPerformanceReviewResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockPerformanceReviewResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockPerformanceReviewResult.orderSubmissionImpact || "blocked")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockPerformanceRecalculationReviewList" aria-label="Mock portfolio performance recalculation review result guardrails">
              <li>{labMockPerformanceReviewResult.mockPerformanceRecalculationReviewResultId || "step155_mock_portfolio_performance_recalculation_review_result"} / {formatStatus(labMockPerformanceReviewResult.scope || "mock_only")} / real performance update blocked</li>
              <li>Actual performance record update, actual cash update, actual position update, and real portfolio ledger update remain blocked.</li>
              <li>Not actual investment performance confirmation, not investment advice, and not real return guarantee.</li>
              <li>No DB write, no provider call, no KIS token, no quote query, no order submission, and no account balance query.</li>
              <li>Next allowed step: {formatStatus(labMockPerformanceReviewReceipt.nextAllowedStep || labMockPerformanceReviewResult.nextAllowedStep || "mock_portfolio_performance_recalculation_core")}</li>
              {(labMockPerformanceReviewDecisionSummary.decisionSummary || labMockPerformanceReviewResult.summary || []).map((message, index) => (
                <li key={`mock-performance-recalculation-review-decision-${index}`}>{message}</li>
              ))}
              {(labMockPerformanceReviewValidation.blockerSummary || labMockPerformanceReviewValidation.blockers || []).map((message, index) => (
                <li key={`mock-performance-recalculation-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockPerformanceReviewValidation.warningSummary || labMockPerformanceReviewValidation.warnings || []).map((message, index) => (
                <li key={`mock-performance-recalculation-review-warning-${index}`}>{message}</li>
              ))}
              {labMockPerformanceReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-performance-recalculation-review-history-${index}`}>{item.historyId || `mock_performance_recalculation_review_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_portfolio_performance_recalculation_core")}</li>
              ))}
              {!labMockPerformanceReviewResult.reviewStatus ? (
                <li>Mock performance recalculation review result remains validation-required; no real account, DB, provider, order, fill, execution, cash, position, ledger, or performance mutation is performed.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockPerformanceCorePreflight" data-admin-panel-key="trading-lab-mock-portfolio-performance-recalculation-core-preflight">
            <span>Mock portfolio performance recalculation core preflight</span>
            <h4>{formatStatus(labMockPortfolioPerformanceRecalculationCorePreflightStatus.status || labMockPerformanceCoreResult.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This preflight checks whether FINPLE internal mock performance recalculation core inputs are deterministic and redacted. It is not actual investment performance confirmation, does not write DB state, does not update actual cash, positions, portfolio ledger, or performance records, and does not open KIS/provider/order/live gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockPerformanceCorePreflightCards">
              <div>
                <span>Core input bundle</span>
                <strong>{formatStatus(labMockPerformanceCoreInputBundle.coreInputBundleStatus || labMockPerformanceCoreResult.coreInputBundleStatus || "validation_required")}</strong>
                <small>{labMockPerformanceCoreInputBundle.performanceCoreInputBundleId || "step156_mock_performance_core_input_bundle"}</small>
              </div>
              <div>
                <span>Equity series policy</span>
                <strong>{formatStatus(labMockPerformanceCoreResult.equitySeriesPolicyStatus || labMockPerformanceCoreValidation.equitySeriesPolicyStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceCoreResult.equityAfterPreview || labMockPerformanceCoreInputBundle.equityAfterPreview || 0).toLocaleString("ko-KR")}</small>
              </div>
              <div>
                <span>Daily return policy</span>
                <strong>{formatStatus(labMockPerformanceCoreResult.dailyReturnPolicyStatus || labMockPerformanceCoreValidation.dailyReturnPolicyStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceCoreResult.dailyReturnPreview || labMockPerformanceCoreValidation.dailyReturnPreview || 0).toFixed(4)}%</small>
              </div>
              <div>
                <span>Cumulative return policy</span>
                <strong>{formatStatus(labMockPerformanceCoreResult.cumulativeReturnPolicyStatus || labMockPerformanceCoreValidation.cumulativeReturnPolicyStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceCoreResult.cumulativeReturnPreview || labMockPerformanceCoreValidation.cumulativeReturnPreview || 0).toFixed(4)}%</small>
              </div>
              <div>
                <span>Drawdown / MDD policy</span>
                <strong>{formatStatus(labMockPerformanceCoreResult.drawdownPolicyStatus || labMockPerformanceCoreValidation.drawdownPolicyStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceCoreResult.mddPreview || labMockPerformanceCoreValidation.mddPreview || 0).toFixed(4)}%</small>
              </div>
              <div>
                <span>Allocation policy</span>
                <strong>{formatStatus(labMockPerformanceCoreResult.allocationPolicyStatus || labMockPerformanceCoreValidation.allocationPolicyStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceCoreScenario.allocationPolicy || "mock_allocation_preview_only")}</small>
              </div>
              <div>
                <span>KPI / chart data policy</span>
                <strong>{formatStatus(labMockPerformanceCoreResult.kpiSummaryPolicyStatus || labMockPerformanceCoreValidation.kpiSummaryPolicyStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceCoreResult.chartDataPolicyStatus || labMockPerformanceCoreValidation.chartDataPolicyStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Deterministic readiness</span>
                <strong>{formatStatus(labMockPerformanceCoreResult.deterministicCalculationStatus || labMockPerformanceCoreValidation.deterministicCalculationStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceCoreResult.dependencyStatus || labMockPerformanceCoreValidation.dependencyStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockPerformanceCoreResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockPerformanceCoreResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockPerformanceCoreResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockPerformanceCoreResult.orderSubmissionImpact || "blocked")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockPerformanceCorePreflightList" aria-label="Mock portfolio performance recalculation core preflight guardrails">
              <li>{labMockPerformanceCoreResult.performanceCorePreflightId || "step156_mock_portfolio_performance_recalculation_core_preflight"} / {formatStatus(labMockPerformanceCoreResult.scope || "mock_only")} / real DB performance update blocked</li>
              <li>{labMockPerformanceCoreScenario.scenarioName || "Mock portfolio performance recalculation core readiness"} / {formatStatus(labMockPerformanceCoreScenario.recalculationMode || "equity_return_drawdown_allocation_kpi_chart_preview")}</li>
              <li>Actual performance record creation or update, actual cash update, actual position update, and real portfolio ledger update remain blocked.</li>
              <li>No actual investment performance confirmation, no return guarantee, no investment advice, and no buy or sell recommendation.</li>
              <li>No DB write, no KIS/provider call, no KIS token, no quote query, no order submission, and no account balance query.</li>
              <li>Next allowed step: {formatStatus(labMockPerformanceCoreSummary.nextAllowedStep || labMockPerformanceCoreResult.nextAllowedStep || "mock_portfolio_performance_recalculation_core")}</li>
              {(labMockPerformanceCoreValidation.blockerSummary || labMockPerformanceCoreValidation.blockers || []).map((message, index) => (
                <li key={`mock-performance-core-preflight-blocker-${index}`}>{message}</li>
              ))}
              {(labMockPerformanceCoreValidation.warningSummary || labMockPerformanceCoreValidation.warnings || []).map((message, index) => (
                <li key={`mock-performance-core-preflight-warning-${index}`}>{message}</li>
              ))}
              {labMockPerformanceCoreHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-performance-core-preflight-history-${index}`}>{item.historyId || `mock_performance_core_preflight_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_portfolio_performance_recalculation_core")}</li>
              ))}
              {!labMockPerformanceCoreResult.status ? (
                <li>Mock performance core preflight remains validation-required; no real account, DB, provider, order, fill, execution, cash, position, ledger, or performance mutation is performed.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockPerformanceCoreReviewResult" data-admin-panel-key="trading-lab-mock-portfolio-performance-recalculation-core-review-result">
            <span>Mock portfolio performance recalculation core review result</span>
            <h4>{formatStatus(labMockPerformanceCoreReviewResult.reviewStatus || labMockPortfolioPerformanceRecalculationCoreReviewResultStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This result records a redacted review receipt for FINPLE internal mock performance recalculation core readiness only. It is not actual investment performance confirmation, does not write DB state, does not update actual cash, positions, portfolio ledger, or performance records, and does not open KIS/provider/order/live gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockPerformanceCoreReviewCards">
              <div>
                <span>Redacted receipt</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewReceipt.reviewStatus || labMockPerformanceCoreReviewResult.reviewStatus || "validation_required")}</strong>
                <small>{labMockPerformanceCoreReviewReceipt.receiptId || "step157_mock_performance_core_review_receipt"}</small>
              </div>
              <div>
                <span>Decision summary</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewResult.decision || labMockPerformanceCoreDecisionSummary.decision || "blocked")}</strong>
                <small>{formatStatus(labMockPerformanceCoreReviewReceipt.nextAllowedStep || "mock_portfolio_performance_recalculation_core")}</small>
              </div>
              <div>
                <span>Equity / return review</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewReceipt.equitySeriesPolicyReviewStatus || labMockPerformanceCoreReviewValidation.equitySeriesPolicyReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceCoreReviewReceipt.dailyReturnPolicyReviewStatus || labMockPerformanceCoreReviewValidation.dailyReturnPolicyReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Cumulative return review</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewReceipt.cumulativeReturnPolicyReviewStatus || labMockPerformanceCoreReviewValidation.cumulativeReturnPolicyReviewStatus || "validation_required")}</strong>
                <small>{Number(labMockPerformanceCoreReviewValidation.cumulativeReturnPreview || 0).toFixed(4)}%</small>
              </div>
              <div>
                <span>Drawdown / MDD review</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewReceipt.drawdownPolicyReviewStatus || labMockPerformanceCoreReviewValidation.drawdownPolicyReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceCoreReviewReceipt.mddPolicyReviewStatus || labMockPerformanceCoreReviewValidation.mddPolicyReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Allocation review</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewReceipt.allocationPolicyReviewStatus || labMockPerformanceCoreReviewValidation.allocationPolicyReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceCorePolicyReviewSummary.dependencyReviewStatus || labMockPerformanceCoreReviewValidation.dependencyReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>KPI / chart review</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewReceipt.kpiSummaryPolicyReviewStatus || labMockPerformanceCoreReviewValidation.kpiSummaryPolicyReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceCoreReviewReceipt.chartDataPolicyReviewStatus || labMockPerformanceCoreReviewValidation.chartDataPolicyReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Deterministic review</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewReceipt.deterministicCalculationReviewStatus || labMockPerformanceCoreReviewValidation.deterministicCalculationReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceCoreReviewValidation.deterministic ? "reviewed" : "validation_required")}</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockPerformanceCoreReviewResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockPerformanceCoreReviewResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockPerformanceCoreReviewResult.orderSubmissionImpact || "blocked")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockPerformanceCoreReviewList" aria-label="Mock portfolio performance recalculation core review guardrails">
              <li>{labMockPerformanceCoreReviewResult.performanceCoreReviewResultId || "step157_mock_portfolio_performance_recalculation_core_review_result"} / {formatStatus(labMockPerformanceCoreReviewResult.reviewStatus || "validation_required")} / real DB performance update blocked</li>
              <li>{labMockPerformanceCoreReviewReceipt.performanceCorePreflightId || labMockPerformanceCoreReviewResult.performanceCorePreflightId || "step156_mock_portfolio_performance_recalculation_core_preflight"} / redacted receipt only</li>
              <li>Actual performance record creation or update, actual cash update, actual position update, and real portfolio ledger update remain blocked.</li>
              <li>No actual investment performance confirmation, no return guarantee, no investment advice, and no buy or sell recommendation.</li>
              <li>No DB write, no KIS/provider call, no KIS token, no quote query, no order submission, and no account balance query.</li>
              <li>Next allowed step: {formatStatus(labMockPerformanceCoreReviewReceipt.nextAllowedStep || "mock_portfolio_performance_recalculation_core")}</li>
              {(labMockPerformanceCoreDecisionSummary.decisionSummary || labMockPerformanceCoreReviewResult.summary || []).map((message, index) => (
                <li key={`mock-performance-core-review-decision-${index}`}>{message}</li>
              ))}
              {(labMockPerformanceCoreReviewValidation.blockerSummary || labMockPerformanceCoreReviewValidation.blockers || []).map((message, index) => (
                <li key={`mock-performance-core-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockPerformanceCoreReviewValidation.warningSummary || labMockPerformanceCoreReviewValidation.warnings || []).map((message, index) => (
                <li key={`mock-performance-core-review-warning-${index}`}>{message}</li>
              ))}
              {labMockPerformanceCoreReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-performance-core-review-history-${index}`}>{item.historyId || `mock_performance_core_review_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_portfolio_performance_recalculation_core")}</li>
              ))}
              {!labMockPerformanceCoreReviewResult.reviewStatus ? (
                <li>Mock performance core review result remains validation-required; no real account, DB, provider, order, fill, execution, cash, position, ledger, or performance mutation is performed.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockPerformanceCoreResult" data-admin-panel-key="trading-lab-mock-portfolio-performance-recalculation-core">
            <span>Mock portfolio performance recalculation core</span>
            <h4>{formatStatus(labMockPerformanceResult.calculationStatus || labMockPortfolioPerformanceRecalculationCoreStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This result is FINPLE internal mock performance recalculation only. It is not actual investment performance, does not write DB state, does not update actual cash, positions, portfolio ledger, or performance records, and does not open KIS/provider/order/live gates.
            </p>
            <div className="tradingLabReviewCards tradingLabMockPerformanceCoreResultCards">
              <div>
                <span>Equity series</span>
                <strong>{formatStatus(labMockPerformanceCoreCalculationValidation.equitySeriesStatus || labMockPerformanceEquitySeriesResult.status || "validation_required")}</strong>
                <small>{formatLabNumber(labMockPerformanceEquitySeriesResult.currentEquity) || "mock only"}</small>
              </div>
              <div>
                <span>Daily return</span>
                <strong>{formatStatus(labMockPerformanceCoreCalculationValidation.dailyReturnStatus || labMockPerformanceDailyReturnResult.status || "validation_required")}</strong>
                <small>{formatLabNumber(labMockPerformanceDailyReturnResult.dailyReturn, { percent: true }) || "0.00%"}</small>
              </div>
              <div>
                <span>Cumulative return</span>
                <strong>{formatStatus(labMockPerformanceCoreCalculationValidation.cumulativeReturnStatus || labMockPerformanceCumulativeReturnResult.status || "validation_required")}</strong>
                <small>{formatLabNumber(labMockPerformanceCumulativeReturnResult.cumulativeReturn, { percent: true }) || "0.00%"}</small>
              </div>
              <div>
                <span>Drawdown / MDD</span>
                <strong>{formatStatus(labMockPerformanceCoreCalculationValidation.drawdownStatus || labMockPerformanceDrawdownMddResult.status || "validation_required")}</strong>
                <small>{formatLabNumber(labMockPerformanceDrawdownMddResult.mdd, { percent: true }) || "0.00%"}</small>
              </div>
              <div>
                <span>Allocation snapshot</span>
                <strong>{formatStatus(labMockPerformanceCoreCalculationValidation.allocationStatus || labMockPerformanceAllocationResult.allocationStatus || "validation_required")}</strong>
                <small>Residual {formatLabNumber(labMockPerformanceAllocationResult.residualWeight, { percent: true }) || "0.00%"}</small>
              </div>
              <div>
                <span>KPI summary</span>
                <strong>{formatStatus(labMockPerformanceCoreCalculationValidation.kpiSummaryStatus || labMockPerformanceKpiSummaryResult.status || "validation_required")}</strong>
                <small>{formatLabNumber(labMockPerformanceKpiSummaryResult.totalEquity) || "mock only"}</small>
              </div>
              <div>
                <span>Chart data</span>
                <strong>{formatStatus(labMockPerformanceCoreCalculationValidation.chartDataStatus || labMockPerformanceChartDataResult.status || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceResult.nextAllowedStep || "mock_trading_run_summary_preflight")}</small>
              </div>
              <div>
                <span>Deterministic</span>
                <strong>{formatStatus(labMockPerformanceCoreCalculationValidation.deterministicCalculationStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockPerformanceResult.deterministic ? "ready" : "validation_required")}</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockPerformanceResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockPerformanceResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockPerformanceResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockPerformanceResult.orderSubmissionImpact || "blocked")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockPerformanceCoreResultList" aria-label="Mock portfolio performance recalculation core guardrails">
              <li>{labMockPerformanceResult.performanceResultId || "step158_mock_portfolio_performance_recalculation_core_result"} / {formatStatus(labMockPerformanceResult.calculationStatus || "validation_required")} / FINPLE internal mock performance result only</li>
              <li>{labMockPerformanceResult.performanceCoreReviewResultId || "step157_mock_portfolio_performance_recalculation_core_review_result"} / Step157 dependency required</li>
              <li>Actual performance record creation or update, actual cash update, actual position update, and real portfolio ledger update remain blocked.</li>
              <li>No actual investment performance confirmation, no return guarantee, no investment advice, and no buy or sell recommendation.</li>
              <li>No DB write, no KIS/provider call, no KIS token, no quote query, no order submission, and no account balance query.</li>
              <li>Next allowed step: {formatStatus(labMockPerformanceResult.nextAllowedStep || "mock_trading_run_summary_preflight")}</li>
              {(labMockPerformanceCoreCalculationValidation.blockerSummary || labMockPerformanceCoreCalculationValidation.blockers || []).map((message, index) => (
                <li key={`mock-performance-core-result-blocker-${index}`}>{message}</li>
              ))}
              {(labMockPerformanceCoreCalculationValidation.warningSummary || labMockPerformanceCoreCalculationValidation.warnings || []).map((message, index) => (
                <li key={`mock-performance-core-result-warning-${index}`}>{message}</li>
              ))}
              {labMockPerformanceCoreCalculationHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-performance-core-result-history-${index}`}>{item.historyId || `mock_performance_core_result_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_trading_run_summary_preflight")}</li>
              ))}
              {!labMockPerformanceResult.calculationStatus ? (
                <li>Mock performance recalculation core remains validation-required; no real account, DB, provider, order, fill, execution, cash, position, ledger, or performance mutation is performed.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockTradingRunSummaryPreflight" data-admin-panel-key="trading-lab-mock-trading-run-summary-preflight">
            <span>Mock trading run summary preflight</span>
            <h4>{formatStatus(labMockTradingRunSummaryPreflightResult.status || labMockTradingRunSummaryPreflightStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This is a FINPLE internal mock trading run summary preflight only. It is not a stored trading run summary, does not write DB state, does not update actual cash, positions, ledger, or performance records, and keeps KIS/provider/order/live gates blocked.
            </p>
            <div className="tradingLabReviewCards tradingLabMockTradingRunSummaryPreflightCards">
              <div>
                <span>Strategy summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryValidation.strategySummaryStatus || "validation_required")}</strong>
                <small>{labMockTradingRunSummaryInputBundle.strategyDraftId || "mock strategy only"}</small>
              </div>
              <div>
                <span>Order summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryValidation.orderSummaryStatus || "validation_required")}</strong>
                <small>Not an order candidate</small>
              </div>
              <div>
                <span>Execution summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryValidation.executionSummaryStatus || "validation_required")}</strong>
                <small>No execution record</small>
              </div>
              <div>
                <span>Fill summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryValidation.fillSummaryStatus || "validation_required")}</strong>
                <small>No fill record</small>
              </div>
              <div>
                <span>Ledger summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryValidation.ledgerSummaryStatus || "validation_required")}</strong>
                <small>{labMockTradingRunSummaryInputBundle.ledgerUpdateResultId || "mock ledger only"}</small>
              </div>
              <div>
                <span>Performance summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryValidation.performanceSummaryStatus || "validation_required")}</strong>
                <small>{labMockTradingRunSummaryInputBundle.performanceResultId || "mock performance only"}</small>
              </div>
              <div>
                <span>Risk summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryValidation.riskSummaryStatus || "validation_required")}</strong>
                <small>External authority still required</small>
              </div>
              <div>
                <span>Dashboard aggregation</span>
                <strong>{formatStatus(labMockTradingRunSummaryValidation.dashboardAggregationStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryDependencyMap.dashboardAggregationStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Chart aggregation</span>
                <strong>{formatStatus(labMockTradingRunSummaryValidation.chartAggregationStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryDependencyMap.chartAggregationStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockTradingRunSummaryPreflightResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryPreflightResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockTradingRunSummaryPreflightResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryPreflightResult.orderSubmissionImpact || "blocked")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockTradingRunSummaryPreflightList" aria-label="Mock trading run summary preflight guardrails">
              <li>{labMockTradingRunSummaryPreflightResult.tradingRunSummaryPreflightId || "step159_mock_trading_run_summary_preflight"} / {formatStatus(labMockTradingRunSummaryPreflightResult.status || "validation_required")} / FINPLE internal mock summary readiness only</li>
              <li>{labMockTradingRunSummaryPreflightResult.performanceResultId || "step158_mock_portfolio_performance_recalculation_core_result"} / Step158 dependency required</li>
              <li>Not a stored trading run summary, not actual investment performance, and not a return guarantee or investment advice.</li>
              <li>No DB write, no KIS/provider call, no KIS token, no quote query, no order submission, and no account balance query.</li>
              <li>No order candidate, order draft, execution record, fill record, ledger persistence, or performance record is created.</li>
              <li>Next allowed step: {formatStatus(labMockTradingRunSummaryPreflightResult.nextAllowedStep || "mock_trading_run_summary_review_result")}</li>
              {(labMockTradingRunSummaryValidation.blockerSummary || labMockTradingRunSummaryValidation.blockers || []).map((message, index) => (
                <li key={`mock-trading-run-summary-preflight-blocker-${index}`}>{message}</li>
              ))}
              {(labMockTradingRunSummaryValidation.warningSummary || labMockTradingRunSummaryValidation.warnings || []).map((message, index) => (
                <li key={`mock-trading-run-summary-preflight-warning-${index}`}>{message}</li>
              ))}
              {labMockTradingRunSummaryHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-trading-run-summary-preflight-history-${index}`}>{item.historyId || `mock_trading_run_summary_preflight_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_trading_run_summary_review_result")}</li>
              ))}
              {!labMockTradingRunSummaryPreflightResult.status ? (
                <li>Mock trading run summary preflight remains validation-required; live/provider/order gates stay blocked and all readiness flags remain false.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockTradingRunSummaryReviewResult" data-admin-panel-key="trading-lab-mock-trading-run-summary-review-result">
            <span>Mock trading run summary review result</span>
            <h4>{formatStatus(labMockTradingRunSummaryReviewResult.reviewStatus || labMockTradingRunSummaryReviewResultStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This is a FINPLE internal mock trading run summary review receipt only. It is not a stored trading run summary, does not write DB state, does not update actual cash, positions, ledger, or performance records, and keeps KIS/provider/order/live gates blocked.
            </p>
            <div className="tradingLabReviewCards tradingLabMockTradingRunSummaryReviewCards">
              <div>
                <span>Receipt</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewReceipt.reviewStatus || "validation_required")}</strong>
                <small>{labMockTradingRunSummaryReviewReceipt.receiptId || "step160_mock_trading_run_summary_review_receipt"}</small>
              </div>
              <div>
                <span>Decision</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewDecisionSummary.decision || labMockTradingRunSummaryReviewResult.decision || "blocked")}</strong>
                <small>Mock review only</small>
              </div>
              <div>
                <span>Strategy review</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewSectionSummary.strategySummaryReviewStatus || "validation_required")}</strong>
                <small>{labMockTradingRunSummaryReviewResult.strategyDraftId || "mock strategy only"}</small>
              </div>
              <div>
                <span>Order review</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewSectionSummary.orderSummaryReviewStatus || "validation_required")}</strong>
                <small>Not an order candidate</small>
              </div>
              <div>
                <span>Execution review</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewSectionSummary.executionSummaryReviewStatus || "validation_required")}</strong>
                <small>No execution record</small>
              </div>
              <div>
                <span>Fill review</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewSectionSummary.fillSummaryReviewStatus || "validation_required")}</strong>
                <small>No fill record</small>
              </div>
              <div>
                <span>Ledger review</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewSectionSummary.ledgerSummaryReviewStatus || "validation_required")}</strong>
                <small>No ledger persistence</small>
              </div>
              <div>
                <span>Performance review</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewSectionSummary.performanceSummaryReviewStatus || "validation_required")}</strong>
                <small>No performance record storage</small>
              </div>
              <div>
                <span>Dashboard / chart review</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewSectionSummary.dashboardAggregationReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryReviewSectionSummary.chartAggregationReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Risk / safety review</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewSectionSummary.riskSummaryReviewStatus || "validation_required")}</strong>
                <small>External authority still required</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewReceipt.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryReviewReceipt.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockTradingRunSummaryReviewReceipt.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryReviewReceipt.orderSubmissionImpact || "blocked")}</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockTradingRunSummaryReviewList" aria-label="Mock trading run summary review result guardrails">
              <li>{labMockTradingRunSummaryReviewResult.tradingRunSummaryReviewResultId || "step160_mock_trading_run_summary_review_result"} / {formatStatus(labMockTradingRunSummaryReviewResult.reviewStatus || "validation_required")} / FINPLE internal mock summary review only</li>
              <li>{labMockTradingRunSummaryReviewReceipt.tradingRunSummaryPreflightId || "step159_mock_trading_run_summary_preflight"} / Step159 dependency required</li>
              <li>Not a stored trading run summary, not actual investment performance, and not a return guarantee or investment advice.</li>
              <li>No DB write, no KIS/provider call, no KIS token, no quote query, no order submission, and no account balance query.</li>
              <li>No actual trading run id, order id, execution id, fill id, ledger persistence, or performance record is created.</li>
              <li>No actual cash update and no actual position update are performed.</li>
              <li>Next allowed step: {formatStatus(labMockTradingRunSummaryReviewReceipt.nextAllowedStep || "mock_trading_run_summary_core")}</li>
              {(labMockTradingRunSummaryReviewValidation.blockerSummary || labMockTradingRunSummaryReviewValidation.blockers || []).map((message, index) => (
                <li key={`mock-trading-run-summary-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockTradingRunSummaryReviewValidation.warningSummary || labMockTradingRunSummaryReviewValidation.warnings || []).map((message, index) => (
                <li key={`mock-trading-run-summary-review-warning-${index}`}>{message}</li>
              ))}
              {labMockTradingRunSummaryReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-trading-run-summary-review-history-${index}`}>{item.historyId || `mock_trading_run_summary_review_history_${index + 1}`} / {formatStatus(item.reviewStatus || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_trading_run_summary_core")}</li>
              ))}
              {!labMockTradingRunSummaryReviewResult.reviewStatus ? (
                <li>Mock trading run summary review remains validation-required; live/provider/order gates stay blocked and all readiness flags remain false.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabMockDashboardCleanupPreflight" data-admin-panel-key="trading-lab-mock-dashboard-cleanup-preflight">
            <span>모의 대시보드 정리 사전검토</span>
            <h4>{formatStatus(labMockDashboardCleanupPreflightResult.status || labMockDashboardCleanupPreflightStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This is a FINPLE internal mock dashboard cleanup preview only. It keeps the existing admin mock run sections, moves summary signals first, groups detail sections for review, and keeps KIS/provider/order/live gates blocked.
            </p>
            <div className="tradingLabReviewCards tradingLabMockDashboardCleanupCards">
              <div>
                <span>Summary source</span>
                <strong>{labMockDashboardCleanupPreflightResult.tradingRunSummaryResultId || "step161_mock_trading_run_summary_result"}</strong>
                <small>Step161 dependency</small>
              </div>
              <div>
                <span>Summary-first layout</span>
                <strong>{formatStatus(labMockDashboardCleanupPreflightResult.summaryFirstLayoutStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockDashboardPriorityLayout.priorityMode || "summary_first")}</small>
              </div>
              <div>
                <span>Section inventory</span>
                <strong>{labMockDashboardCleanupPreflightResult.sectionCount ?? labMockDashboardSectionInventory.sectionCount ?? 0}</strong>
                <small>{formatStatus(labMockDashboardCleanupPreflightResult.sectionInventoryStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Primary summary sections</span>
                <strong>{labMockDashboardCleanupPreflightResult.primarySectionCount ?? labMockDashboardSectionInventory.primarySectionCount ?? 0}</strong>
                <small>KPI, chart, allocation, summary</small>
              </div>
              <div>
                <span>Collapsible groups</span>
                <strong>{labMockDashboardCollapsibleSectionPlan.groupCount ?? labMockDashboardCollapsibleGroups.length}</strong>
                <small>{formatStatus(labMockDashboardCleanupPreflightResult.collapsibleSectionPlanStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Existing sections</span>
                <strong>{labMockDashboardCollapsibleSectionPlan.deletesExistingSections ? "Validation required" : "Preserved"}</strong>
                <small>No admin mock section deletion</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockDashboardCleanupPreflightResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockDashboardCleanupPreflightResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockDashboardCleanupPreflightResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockDashboardCleanupPreflightResult.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Next step</span>
                <strong>{formatStatus(labMockDashboardCleanupPreflightResult.nextAllowedStep || "mock_dashboard_cleanup_review")}</strong>
                <small>Admin mock-only</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockDashboardCleanupList" aria-label="Mock dashboard cleanup preflight guardrails">
              <li>{labMockDashboardCleanupPreflightResult.mockDashboardCleanupPreflightId || "step162_mock_dashboard_cleanup_preflight"} / {formatStatus(labMockDashboardCleanupPreflightResult.status || "validation_required")} / summary-first admin mock dashboard preview only</li>
              <li>No KIS/provider call, no KIS token, no quote query, no order submission, no DB write, and no account balance query.</li>
              <li>No actual trading run id, order id, execution id, fill id, ledger persistence, performance record, cash update, or position update is created.</li>
              <li>Admin mock run sections remain under the trading lab; My Page, homepage, and public routes do not expose this cleanup preview.</li>
              <li>Next allowed step: {formatStatus(labMockDashboardCleanupPreflightResult.nextAllowedStep || "mock_dashboard_cleanup_review")}</li>
              {(labMockDashboardCleanupValidation.blockerSummary || labMockDashboardCleanupValidation.blockers || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-blocker-${index}`}>{message}</li>
              ))}
              {(labMockDashboardCleanupValidation.warningSummary || labMockDashboardCleanupValidation.warnings || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-warning-${index}`}>{message}</li>
              ))}
              {labMockDashboardCleanupHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-dashboard-cleanup-history-${index}`}>{item.historyId || `mock_dashboard_cleanup_history_${index + 1}`} / {formatStatus(item.status || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_dashboard_cleanup_review")}</li>
              ))}
            </ul>
            <details className="tradingLabCleanupDetails">
              <summary>Summary-first priority plan</summary>
              <ul className="tradingLabReviewList tradingLabMockDashboardCleanupList">
                {(labMockDashboardPriorityLayout.primaryOrder || []).map((sectionId) => (
                  <li key={`mock-dashboard-priority-${sectionId}`}>{sectionId} / primary summary surface</li>
                ))}
                {labMockDashboardPrimarySections.length === 0 ? (
                  <li>Primary summary sections require validation before the cleanup preview can be treated as ready.</li>
                ) : null}
              </ul>
            </details>
            <details className="tradingLabCleanupDetails">
              <summary>Collapsible detail grouping plan</summary>
              <ul className="tradingLabReviewList tradingLabMockDashboardCleanupList">
                {labMockDashboardCollapsibleGroups.map((group) => (
                  <li key={`mock-dashboard-collapsible-${group.groupId}`}>{group.groupId} / {group.title} / {group.defaultCollapsed ? "default collapsed" : "default open"} / preserved</li>
                ))}
                {labMockDashboardCollapsibleGroups.length === 0 ? (
                  <li>Collapsible grouping remains validation-required; no existing admin mock section is removed.</li>
                ) : null}
              </ul>
            </details>
          </article>

          <article className="tradingLabSection tradingLabMockTradingRunSummaryCore" data-admin-panel-key="trading-lab-mock-trading-run-summary-core">
            <span>Mock trading run summary result</span>
            <h4>{formatStatus(labMockTradingRunSummaryCoreResult.summaryStatus || labMockTradingRunSummaryCoreStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This is a FINPLE internal mock trading run summary aggregation only. It reuses the admin mock KPI, chart, and allocation surfaces as redacted deterministic preview data, does not store a trading run summary, and keeps KIS/provider/order/live gates blocked.
            </p>
            <div className="tradingLabReviewCards tradingLabMockTradingRunSummaryCoreCards">
              <div>
                <span>Summary result</span>
                <strong>{formatStatus(labMockTradingRunSummaryCoreResult.summaryStatus || "validation_required")}</strong>
                <small>{labMockTradingRunSummaryCoreResult.tradingRunSummaryResultId || "step161_mock_trading_run_summary_result"}</small>
              </div>
              <div>
                <span>Strategy summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryStrategySummary.status || "validation_required")}</strong>
                <small>{labMockTradingRunSummaryStrategySummary.strategyDraftId || "mock strategy only"}</small>
              </div>
              <div>
                <span>Order / execution / fill</span>
                <strong>{formatStatus(labMockTradingRunSummaryOrderExecutionFillSummary.orderSummaryStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryOrderExecutionFillSummary.executionSummaryStatus || "validation_required")} / {formatStatus(labMockTradingRunSummaryOrderExecutionFillSummary.fillSummaryStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Ledger summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryLedgerSummary.status || "validation_required")}</strong>
                <small>No ledger persistence</small>
              </div>
              <div>
                <span>Performance summary</span>
                <strong>{formatStatus(labMockTradingRunSummaryPerformanceSummary.status || "validation_required")}</strong>
                <small>No performance record storage</small>
              </div>
              <div>
                <span>Risk / safety</span>
                <strong>{formatStatus(labMockTradingRunSummaryRiskSafetySummary.riskStatus || "blocked")}</strong>
                <small>External authority still required</small>
              </div>
              <div>
                <span>Dashboard aggregation</span>
                <strong>{formatStatus(labMockTradingRunSummaryDashboardAggregation.status || "validation_required")}</strong>
                <small>{labMockTradingRunSummaryDashboardAggregation.deterministic ? "Deterministic mock aggregation" : "Validation required"}</small>
              </div>
              <div>
                <span>Chart aggregation</span>
                <strong>{formatStatus(labMockTradingRunSummaryChartAggregation.status || "validation_required")}</strong>
                <small>{labMockTradingRunSummaryChartAggregation.redacted ? "Redacted chart preview" : "Validation required"}</small>
              </div>
              <div>
                <span>Deterministic aggregation</span>
                <strong>{formatStatus(labMockTradingRunSummaryCoreValidation.deterministicAggregationStatus || "blocked")}</strong>
                <small>No provider quote source</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockTradingRunSummaryCoreResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryCoreResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockTradingRunSummaryCoreResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockTradingRunSummaryCoreResult.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Next step</span>
                <strong>{formatStatus(labMockTradingRunSummaryCoreResult.nextAllowedStep || "mock_trading_run_dashboard_cleanup_preflight")}</strong>
                <small>Admin mock-only</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockTradingRunSummaryCoreList" aria-label="Mock trading run summary core guardrails">
              <li>{labMockTradingRunSummaryCoreResult.tradingRunSummaryResultId || "step161_mock_trading_run_summary_result"} / {formatStatus(labMockTradingRunSummaryCoreResult.summaryStatus || "validation_required")} / FINPLE internal mock trading run summary only</li>
              <li>{labMockTradingRunSummaryCoreResult.tradingRunSummaryReviewResultId || "step160_mock_trading_run_summary_review_result"} / Step160 dependency required</li>
              <li>Not a stored trading run summary, not actual investment performance, and not a return guarantee or investment advice.</li>
              <li>No DB write, no KIS/provider call, no KIS token, no quote query, no order submission, and no account balance query.</li>
              <li>No actual trading run id, order id, execution id, fill id, ledger persistence, or performance record is created.</li>
              <li>No actual cash update, no actual position update, and no portfolio ledger update are performed.</li>
              <li>Existing KPI, chart, and allocation surfaces remain admin-only mock summaries; My Page, homepage, and public routes do not expose this UI.</li>
              <li>Next allowed step: {formatStatus(labMockTradingRunSummaryCoreResult.nextAllowedStep || "mock_trading_run_dashboard_cleanup_preflight")}</li>
              {(labMockTradingRunSummaryCoreValidation.blockerSummary || labMockTradingRunSummaryCoreValidation.blockers || []).map((message, index) => (
                <li key={`mock-trading-run-summary-core-blocker-${index}`}>{message}</li>
              ))}
              {(labMockTradingRunSummaryCoreValidation.warningSummary || labMockTradingRunSummaryCoreValidation.warnings || []).map((message, index) => (
                <li key={`mock-trading-run-summary-core-warning-${index}`}>{message}</li>
              ))}
              {labMockTradingRunSummaryCoreHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-trading-run-summary-core-history-${index}`}>{item.historyId || `mock_trading_run_summary_core_history_${index + 1}`} / {formatStatus(item.summaryStatus || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_trading_run_dashboard_cleanup_preflight")}</li>
              ))}
              {!labMockTradingRunSummaryCoreResult.summaryStatus ? (
                <li>Mock trading run summary core remains validation-required; live/provider/order gates stay blocked and all readiness flags remain false.</li>
              ) : null}
            </ul>
          </article>

          <article className="tradingLabSection">
            <span>현재 투자전략</span>
            <h4>{labStrategy.name || "관리자 모의 전략"}</h4>
            <dl>
              <div>
                <dt>이용 모드</dt>
                <dd>{formatStatus(labStrategy.activeMode || "mock")}</dd>
              </div>
              <div>
                <dt>허용 종목</dt>
                <dd>{labStrategy.allowedSymbolsStatus || "placeholder_only"}</dd>
              </div>
              <div>
                <dt>리밸런싱 조건</dt>
                <dd>{formatStatus(labStrategy.rebalanceCondition || "mock_only")}</dd>
              </div>
              <div>
                <dt>최대 주문금액</dt>
                <dd>{formatStatus(labStrategy.maxOrderAmountStatus || "not_ready")}</dd>
              </div>
              <div>
                <dt>최대 일일 손실한도</dt>
                <dd>{formatStatus(labStrategy.maxDailyLossStatus || "blocked")}</dd>
              </div>
              <div>
                <dt>비상 차단 필요</dt>
                <dd>{labStrategy.killSwitchRequired === false ? "아니오" : "예"}</dd>
              </div>
              <div>
                <dt>현재 상태</dt>
                <dd>{formatStatus(labStrategy.currentStatus || "blocked")}</dd>
              </div>
            </dl>
          </article>

          <article className="tradingLabSection">
            <span>모의 성과</span>
            <h4>모의 성과</h4>
            <dl>
              <div>
                <dt>누적 수익률</dt>
                <dd>{Number(labPerformance.cumulativeReturnPct || 0).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>기간 수익률</dt>
                <dd>{Number(labPerformance.periodReturnPct || 0).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>MDD</dt>
                <dd>{Number(labPerformance.mddPct || 0).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>변동성</dt>
                <dd>{Number(labPerformance.volatilityPct || 0).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>승률</dt>
                <dd>{Number(labPerformance.winRatePct || 0).toFixed(2)}%</dd>
              </div>
              <div>
                <dt>손익비</dt>
                <dd>{Number(labPerformance.profitLossRatio || 0).toFixed(2)}</dd>
              </div>
              <div>
                <dt>기준값</dt>
                <dd>{formatStatus(labPerformance.benchmarkStatus || "mock_only")}</dd>
              </div>
            </dl>
          </article>
        </div>

        <div className="tradingLabTableSection">
          <span>일별 수익률</span>
          <div className="tradingLabTable">
            <div className="tradingLabTableRow header">
              <span>날짜</span>
              <span>일별 수익률</span>
              <span>누적 수익률</span>
              <span>낙폭</span>
              <span>평가금액</span>
            </div>
            {labDailyRows.map((row) => (
              <div className="tradingLabTableRow" key={row.date}>
                <span>{row.date}</span>
                <span>{Number(row.dailyReturnPct || 0).toFixed(2)}%</span>
                <span>{Number(row.cumulativeReturnPct || 0).toFixed(2)}%</span>
                <span>{Number(row.drawdownPct || 0).toFixed(2)}%</span>
                <span>{Number(row.equityPlaceholder || 0).toLocaleString("ko-KR")}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tradingLabTableSection">
          <span>포지션</span>
          <div className="tradingLabTable">
            <div className="tradingLabTableRow header">
              <span>심볼</span>
              <span>이름</span>
              <span>수량</span>
              <span>평균가</span>
              <span>현재가</span>
              <span>비중</span>
            </div>
            {labPositions.map((position) => (
              <div className="tradingLabTableRow" key={position.symbol}>
                <span>{position.symbol}</span>
                <span>{position.name}</span>
                <span>{formatPositionField(position, "quantity", "quantityPlaceholder", { quantity: true })}</span>
                <span>{formatPositionField(position, "averagePrice", "averagePricePlaceholder")}</span>
                <span>{formatPositionField(position, "mockCurrentPrice", "currentPricePlaceholder")}</span>
                <span>{Number(position.weightPct || 0).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tradingLabTableSection tradingLabStrategyReviewHistory">
          <span>Strategy change history</span>
          <div className="tradingLabTable">
            <div className="tradingLabTableRow header">
              <span>Change ID</span>
              <span>Type</span>
              <span>Status</span>
              <span>Summary</span>
              <span>Redacted</span>
            </div>
            {labStrategyDraftChangeRows.map((change) => (
              <div className="tradingLabTableRow" key={change.changeId}>
                <span>{change.changeId}</span>
                <span>{formatStatus(change.changeType || "target_weight")}</span>
                <span>{formatStatus(change.status || "draft")}</span>
                <span>{change.summary}</span>
                <span>{change.redacted === true ? "true" : "false"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tradingLabTableSection tradingLabStrategyReviewResultHistory">
          <span>Mock review result history</span>
          <div className="tradingLabTable">
            <div className="tradingLabTableRow header">
              <span>Receipt ID</span>
              <span>Status</span>
              <span>Decision</span>
              <span>Readiness impact</span>
              <span>Redacted</span>
            </div>
            {labStrategyDraftReviewResultHistory.map((receipt) => (
              <div className="tradingLabTableRow" key={receipt.receiptId}>
                <span>{receipt.receiptId}</span>
                <span>{formatStatus(receipt.reviewStatus || "validation_required")}</span>
                <span>{formatStatus(receipt.decision || "rejected")}</span>
                <span>{formatStatus(receipt.readinessImpact || "none")}</span>
                <span>{receipt.redacted === false ? "false" : "true"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="tradingLabGrid">
          <article className="tradingLabSection">
            <span>주문 후보</span>
            <h4>수동승인 주문 후보</h4>
            {labOrderCandidates.map((candidate) => (
              <dl key={candidate.draftId}>
                <div>
                  <dt>Draft ID</dt>
                  <dd>{candidate.draftId}</dd>
                </div>
                <div>
                  <dt>모드</dt>
                  <dd>{formatStatus(candidate.mode || "mock")}</dd>
                </div>
                <div>
                  <dt>방향</dt>
                  <dd>{formatStatus(candidate.sidePlaceholder || "mock_only")}</dd>
                </div>
                <div>
                  <dt>수량</dt>
                  <dd>{formatStatus(candidate.quantityPlaceholder || "mock_only")}</dd>
                </div>
                <div>
                  <dt>예상 금액</dt>
                  <dd>{formatStatus(candidate.estimatedAmountPlaceholder || "mock_only")}</dd>
                </div>
                <div>
                  <dt>리스크</dt>
                  <dd>{formatStatus(candidate.riskStatus || "blocked")}</dd>
                </div>
                <div>
                  <dt>비상 차단</dt>
                  <dd>{formatStatus(candidate.killSwitchStatus || "active_blocking")}</dd>
                </div>
                <div>
                  <dt>사전검증</dt>
                  <dd>{formatStatus(candidate.preflightStatus || "not_ready")}</dd>
                </div>
              </dl>
            ))}
          </article>

          <article className="tradingLabSection">
            <span>감사 로그</span>
            <h4>감사 로그 요약</h4>
            {labAuditEvents.map((event) => (
              <dl key={event.eventId}>
                <div>
                  <dt>Event ID</dt>
                  <dd>{event.eventId}</dd>
                </div>
                <div>
                  <dt>이벤트 유형</dt>
                  <dd>{event.eventType}</dd>
                </div>
                <div>
                  <dt>상태</dt>
                  <dd>{formatStatus(event.status || "blocked")}</dd>
                </div>
                <div>
                  <dt>생성시각</dt>
                  <dd>{event.createdAt}</dd>
                </div>
                <div>
                  <dt>마스킹 사유</dt>
                  <dd>{formatStatus(event.redactedReason || "redacted")}</dd>
                </div>
                <div>
                  <dt>차단 사유</dt>
                  <dd>{event.blockedReason || "live_provider_and_order_paths_disabled"}</dd>
                </div>
              </dl>
            ))}
          </article>
        </div>
      </div>

    </section>
      ) : null}

      {activeTradingPanelTab === "safety" ? (
    <section className="accountCard tradingReadinessPanel tradingSafetyPanel tradingSafetyPanelDetails" data-admin-panel-key="trading-safety-details">
      <div className="tradingReadinessAudit tradingShadowHistory">
        <span>섀도우 이용 상태</span>
        <strong>{formatStatus(shadowStatus?.status || "read_only_shadow_history")}</strong>
        <p>
          후보 {Number(shadowStatus?.candidateCount || 0)}건 / 감사 이벤트 {Number(shadowStatus?.auditEventCount || 0)}건.
          관리자 전용 읽기 화면이며 메모리 기반 경계만 표시합니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingShadowReview">
        <span>검토 게이트</span>
        <strong>{formatStatus(shadowReviewStatus?.status || "admin_only_shadow_review_gate_fail_closed")}</strong>
        <p>
          검토 결과 {Number(shadowReviewStatus?.reviewResults?.length || 0)}건 / 차단 사유 {Number(shadowReviewStatus?.blockers?.length || 0)}건.
          민감정보는 제거되며 실거래 준비상태로 승격할 수 없습니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingRiskKillSwitchReview">
        <span>리스크 및 비상 차단</span>
        <strong>{formatStatus(riskKillSwitchStatus?.status || "admin_only_risk_kill_switch_review_fail_closed")}</strong>
        <p>
          리스크 {formatStatus(riskKillSwitchStatus?.riskGate?.status || "blocked")} /
          비상 차단 {formatStatus(riskKillSwitchStatus?.killSwitch?.status || "active_blocking")}.
          관리자 전용 읽기 상태이며 실거래 준비상태는 계속 차단됩니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingRiskKillSwitchReviewResult">
        <span>검토 결과 기록</span>
        <strong>{formatStatus(riskKillSwitchReviewResultStatus?.status || "admin_only_risk_kill_switch_review_result_gate_fail_closed")}</strong>
        <p>
          영수증 {Number(riskKillSwitchReviewResultStatus?.receiptCount || 0)}건.
          민감정보가 제거된 메모리 상태만 표시하며 DB 기록과 준비상태 승격은 없습니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingManualApprovalOrderDraft">
        <span>수동승인 주문 초안</span>
        <strong>{formatStatus(manualApprovalOrderDraftStatus?.status || "admin_only_manual_approval_order_draft_preflight_fail_closed")}</strong>
        <p>
          초안 {manualApprovalOrderDraftStatus?.draft?.draftId || "step122_manual_approval_order_draft_placeholder"} /
          사전검증 {formatStatus(manualApprovalOrderDraftStatus?.preflight?.preflightStatus || "blocked")}.
          민감정보 제거 placeholder만 표시하며 broker payload와 주문 제출은 없습니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingManualApprovalOrderDraftReviewResult">
        <span>수동승인 초안 검토</span>
        <strong>
          {formatStatus(
            manualApprovalOrderDraftReviewResultStatus?.status ||
              "admin_only_manual_approval_order_draft_review_result_gate_fail_closed",
          )}
        </strong>
        <p>
          영수증 {Number(manualApprovalOrderDraftReviewResultStatus?.receiptCount || 0)}건.
          민감정보 제거 검토 결과만 표시하며 DB 기록, provider 호출, 주문 제출은 없습니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingManualApprovalOrderDraftClearance">
        <span>수동승인 최종 사전검증</span>
        <strong>
          {formatStatus(
            manualApprovalOrderDraftClearanceStatus?.status ||
              "admin_only_manual_approval_order_draft_clearance_preflight_fail_closed",
          )}
        </strong>
        <p>
          후보 {formatStatus(manualApprovalOrderDraftClearanceStatus?.candidate?.clearanceStatus || "blocked")} /
          차단 사유 {Number(manualApprovalOrderDraftClearanceStatus?.preflight?.blockerCount || 0)}건.
          최종 승인 후보만 표시하며 readiness flag는 계속 차단됩니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingManualApprovalClearanceReviewResult">
        <span>수동승인 최종 검토</span>
        <strong>
          {formatStatus(
            manualApprovalClearanceReviewResultStatus?.status ||
              "admin_only_manual_approval_clearance_review_result_gate_fail_closed",
          )}
        </strong>
        <p>
          영수증 {Number(manualApprovalClearanceReviewResultStatus?.receiptCount || 0)}건 /
          결정 {formatStatus(manualApprovalClearanceReviewResultStatus?.recording?.review?.decision || "clearance_not_granted")}.
          민감정보 제거 검토 결과만 표시하며 준비상태 승격은 없습니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingKisProviderCallInventory">
        <span>KIS 호출 사전평가</span>
        <strong>
          {formatStatus(
            kisProviderCallInventoryStatus?.status ||
              "admin_only_kis_read_only_provider_call_inventory_preflight_fail_closed",
          )}
        </strong>
        <p>
          사전검증 {formatStatus(kisProviderCallInventoryStatus?.preflight?.status || "opt_in_required")} /
          차단 사유 {Number(kisProviderCallInventoryStatus?.preflight?.blockerCount || 0)}건.
          목록 점검만 표시하며 token 발급, provider 호출, 준비상태 승격은 없습니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingProviderResponseValidation">
        <span>Provider 응답 검증</span>
        <strong>
          {formatStatus(
            providerResponseEnvelopeValidationStatus?.status ||
              "admin_only_provider_response_envelope_validation_receipt_fail_closed",
          )}
        </strong>
        <p>
          응답 형식 {formatStatus(providerResponseEnvelopeValidationStatus?.envelope?.status || "envelope_only")} /
          영수증 {formatStatus(providerResponseEnvelopeValidationStatus?.receipt?.status || "validation_pending")}.
          민감정보 제거 모의 상태만 표시하며 token 발급, 시세 조회, provider 호출, 준비상태 승격은 없습니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingProviderResponseValidationReviewResult">
        <span>Provider 응답 검증 검토</span>
        <strong>
          {formatStatus(
            providerResponseValidationReviewResultStatus?.status ||
              "admin_only_provider_response_validation_review_result_gate_fail_closed",
          )}
        </strong>
        <p>
          결과 {formatStatus(providerResponseValidationReviewResultStatus?.reviewResult?.status || "review_recorded")} /
          결정 {formatStatus(providerResponseValidationReviewResultStatus?.reviewResult?.decision || "validation_pending")}.
          민감정보 제거 관리자 상태만 표시하며 provider 호출, token 발급, 시세 조회, DB 기록, 준비상태 승격은 없습니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingProviderCallPolicy">
        <span>Provider 호출 정책</span>
        <strong>{formatStatus(providerCallPolicyStatus?.status || "admin_only_provider_call_policy_core_fail_closed")}</strong>
        <p>
          캐시 {formatStatus(providerCallPolicyStatus?.cachePolicy?.status || "policy_pending")} /
          호출 제한 {formatStatus(providerCallPolicyStatus?.rateLimitPolicy?.status || "policy_pending")} /
          감사 {formatStatus(providerCallPolicyStatus?.auditPolicy?.status || "audit_policy_only")}.
          드라이런 정책만 표시하며 provider 호출, 시세 조회, 감사 DB 기록, 준비상태 승격은 없습니다.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingKisQuoteAdapterOptInPreflight">
        <span>KIS 시세 어댑터 사전검증</span>
        <strong>
          {formatStatus(
            kisQuoteAdapterOptInPreflightStatus?.status ||
              "admin_only_kis_read_only_quote_adapter_opt_in_preflight_fail_closed",
          )}
        </strong>
        <p>
          경계 {formatStatus(kisQuoteAdapterOptInPreflightStatus?.boundary?.status || "adapter_boundary_ready")} /
          사전검증 {formatStatus(kisQuoteAdapterOptInPreflightStatus?.preflight?.status || "adapter_blocked")} /
          차단 사유 {Number(kisQuoteAdapterOptInPreflightStatus?.preflight?.blockerCount || 0)}건.
          사전검증 경계만 표시하며 KIS token 발급, 시세 조회, provider 호출, 원본 설정 노출, 준비상태 승격은 없습니다.
        </p>
      </div>
    </section>
      ) : null}
    </div>
  );
}
