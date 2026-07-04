import { useEffect, useMemo, useState } from "react";

import {
  fetchAdminTradingProviderCallPolicyStatus,
  fetchAdminTradingKisReadOnlyQuoteAdapterOptInPreflightStatus,
  fetchAdminTradingKisReadOnlyProviderCallInventoryPreflightStatus,
  fetchAdminTradingLabDashboardStatus,
  fetchAdminTradingLabMockExecutionPreflightStatus,
  fetchAdminTradingLabMockExecutionReviewResultStatus,
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
