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
  fetchAdminTradingLabMockDashboardCleanupReviewResultStatus,
  fetchAdminTradingLabMockDashboardCleanupCoreStatus,
  fetchAdminTradingLabMockDashboardCleanupCoreReviewResultStatus,
  fetchAdminTradingLabDashboardUxPolishPreflightStatus,
  fetchAdminTradingLabDashboardUxPolishReviewResultStatus,
  fetchAdminTradingLabDashboardUxPolishCoreStatus,
  fetchAdminTradingLabDbBackedMockTradingHistoryPreflightStatus,
  fetchAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus,
  fetchAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus,
  fetchAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus,
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

const TRADING_LAB_DETAIL_GROUPS = [
  { groupId: "strategy_draft_review", title: "전략 초안 및 검토", stepRange: "Step134~Step138" },
  { groupId: "mock_order_execution_fill", title: "모의 실행 후보 및 주문·체결 흐름", stepRange: "Step139~Step148" },
  { groupId: "mock_ledger_update", title: "모의 장부 업데이트", stepRange: "Step149~Step153" },
  { groupId: "mock_performance_recalculation", title: "모의 성과 재계산", stepRange: "Step154~Step158" },
  { groupId: "mock_trading_run_summary", title: "모의 거래 실행 요약", stepRange: "Step159~Step161" },
  { groupId: "dashboard_cleanup_ux_polish", title: "대시보드 정리 및 UX polish", stepRange: "Step162~Step169" },
];

const TRADING_LAB_EMPTY_CHART_NOTICE =
  "표시할 mock run 데이터가 아직 없습니다. 현재 화면은 안전 검증과 mock-only 상태 점검용입니다.";

const TRADING_LAB_SMOKE_PREFLIGHT_ITEMS = [
  { key: "admin_route", label: "관리자 route 접근", status: "표시 가능" },
  { key: "mock_dashboard", label: "모의 운용 대시보드 표시", status: "표시 가능" },
  { key: "safety_summary", label: "summary-first 안전 안내", status: "표시 가능" },
  { key: "blocked_badges", label: "차단 badge 구분 표시", status: "표시 가능" },
  { key: "empty_chart_placeholder", label: "빈 chart placeholder", status: "표시 가능" },
  { key: "detail_chain", label: "상세 검증 로그 기본 접힘", status: "유지" },
  { key: "step_groups", label: "Step134~Step169 detail group", status: "유지" },
  { key: "step169_endpoint", label: "Step169 admin-only endpoint", status: "유지" },
  { key: "no_step171_endpoint", label: "Step171 신규 endpoint 없음", status: "유지" },
  { key: "public_ui_blocked", label: "My Page·homepage trading UI 미노출", status: "유지" },
  { key: "readiness_flags", label: "readiness/provider/order/live flags", status: "false 유지" },
  { key: "header_artifact", label: "header artifact regression", status: "정상" },
];

const TRADING_LAB_SMOKE_REVIEW_RESULT_ITEMS = [
  { key: "admin_trading_route", label: "관리자 거래 실험실 route 정상", result: "정상 표시" },
  { key: "mock_dashboard_visible", label: "모의 운용 대시보드 정상 표시", result: "정상 표시" },
  { key: "safety_panel_visible", label: "거래 안전평가 정상 표시", result: "정상 표시" },
  { key: "summary_first_visible", label: "summary-first 영역 표시", result: "정상 표시" },
  { key: "safety_notice_visible", label: "안전 안내 표시됨", result: "정상 표시" },
  { key: "badge_display_ok", label: "상태 badge 정상 표시", result: "구분 표시" },
  { key: "empty_chart_placeholder_ok", label: "빈 chart placeholder 표시", result: "정상 표시" },
  { key: "detail_log_collapsed", label: "상세 검증 로그 접힘 유지", result: "유지" },
  { key: "detail_groups_present", label: "Step134~Step169 detail group 존재", result: "유지" },
  { key: "provider_gate_blocked", label: "내부 provider 호출 없음", result: "차단 유지" },
  { key: "order_submission_blocked", label: "주문 제출 없음", result: "차단 유지" },
  { key: "db_write_blocked", label: "DB 저장 없음", result: "차단 유지" },
  { key: "live_readiness_blocked", label: "실거래 준비 상태", result: "차단 유지" },
  { key: "public_surfaces_blocked", label: "My Page·homepage 미노출", result: "유지" },
  { key: "step166_preserved", label: "Step166 계정·구독·결제 sync", result: "보존" },
];

const TRADING_LAB_FINAL_STABILIZATION_ITEMS = [
  { key: "admin_route_stable", label: "/admin/trading route", result: "정상 표시" },
  { key: "mock_dashboard_stable", label: "모의 운용 대시보드", result: "정상 표시" },
  { key: "safety_panel_stable", label: "거래 안전평가", result: "정상 표시" },
  { key: "safety_notice_stable", label: "안전 안내", result: "정상 표시" },
  { key: "badge_separation_stable", label: "상태 badge 분리", result: "정상 표시" },
  { key: "empty_chart_placeholder_stable", label: "빈 chart placeholder", result: "정상 표시" },
  { key: "detail_log_collapsed_stable", label: "상세 검증 로그", result: "접힘 유지" },
  { key: "step170_consolidation_stable", label: "Step170 section consolidation", result: "반영 유지" },
  { key: "step171_badge_polish_stable", label: "Step171 badge polish", result: "반영 유지" },
  { key: "step172_smoke_review_stable", label: "Step172 smoke review", result: "반영 유지" },
  { key: "step166_account_plan_billing_stable", label: "Step166 account/plan/billing sync", result: "보존" },
  { key: "public_surfaces_stable", label: "My Page·homepage", result: "미노출 유지" },
  { key: "provider_order_live_blocked", label: "provider/order/live gate", result: "차단 유지" },
];

const TRADING_LAB_DEPLOYMENT_METADATA_NOTICE_ITEMS = [
  { key: "render_api_health", label: "Render API health", result: "정상" },
  { key: "render_db_health", label: "Render DB health", result: "정상" },
  { key: "render_commit_metadata", label: "Render health commit metadata", result: "최신 GitHub main과 불일치 가능" },
  { key: "github_vercel_reference", label: "GitHub/Vercel 기준", result: "별도 확인 필요" },
  { key: "readiness_impact", label: "실거래 readiness 영향", result: "없음" },
  { key: "provider_order_impact", label: "provider/order 권한 영향", result: "없음" },
];

const TRADING_LAB_SMOKE_REVIEW_HISTORY_ITEMS = [
  { key: "step169_admin_readiness_data", label: "Step169 admin readiness data", result: "재사용" },
  { key: "step171_smoke_preflight", label: "Step171 smoke preflight", result: "통과 기준 유지" },
  { key: "step172_smoke_review_result", label: "Step172 smoke review result", result: "반영 유지" },
  { key: "step173_final_stabilization", label: "Step173 final stabilization", result: "read-only notice" },
];

const TRADING_LAB_MVP_HANDOFF_IMPLEMENTED_AREAS = [
  { key: "admin_shell", label: "admin-only /admin/trading shell", result: "구현 완료" },
  { key: "safety_panel", label: "거래 안전평가 탭", result: "구현 완료" },
  { key: "mock_dashboard", label: "모의 운용 대시보드 탭", result: "구현 완료" },
  { key: "fail_closed_flags", label: "fail-closed readiness flags", result: "false 유지" },
  { key: "provider_order_live_gate", label: "provider/order/live gate", result: "차단 유지" },
  { key: "strategy_review_chain", label: "strategy draft/review/clearance chain", result: "구현 완료" },
  { key: "mock_run_candidate", label: "mock run candidate", result: "구현 완료" },
  { key: "mock_order_execution_fill_chain", label: "mock order/execution/fill simulation chain", result: "구현 완료" },
  { key: "mock_ledger_performance_chain", label: "mock ledger/performance chain", result: "구현 완료" },
  { key: "mock_trading_run_summary", label: "mock trading run summary", result: "구현 완료" },
  { key: "dashboard_polish_smoke_review", label: "dashboard polish/smoke review", result: "구현 완료" },
  { key: "render_metadata_notice", label: "Render metadata stale notice", result: "반영 완료" },
  { key: "public_surface_absence", label: "My Page·homepage exposure", result: "미노출 유지" },
];

const TRADING_LAB_MVP_HANDOFF_EXCLUDED_AREAS = [
  { key: "kis_provider_call", label: "actual KIS/provider network call", result: "미구현/차단" },
  { key: "kis_token_issuance", label: "KIS token issuance", result: "미구현/차단" },
  { key: "kis_quote_query", label: "KIS quote query", result: "미구현/차단" },
  { key: "kis_order_submission", label: "KIS mock/real order submission", result: "미구현/차단" },
  { key: "actual_balance_query", label: "actual account balance query", result: "미구현/차단" },
  { key: "persistent_trading_history", label: "DB-backed trading history", result: "미구현/차단" },
  { key: "persistent_strategy_storage", label: "strategy persistent storage", result: "미구현/차단" },
  { key: "user_trading_dashboard", label: "user-facing trading dashboard", result: "미구현/차단" },
  { key: "mypage_trading_connection", label: "My Page trading integration", result: "미구현/차단" },
  { key: "automated_ordering", label: "auto trading or discretionary order action", result: "미구현/차단" },
];

const TRADING_LAB_MVP_HANDOFF_REMAINING_TRACKS = [
  { key: "persistent_mock_history", label: "A. DB 저장형 전략/모의거래 이력", result: "별도 승인 필요" },
  { key: "kis_read_only_quote", label: "B. KIS read-only 현재가 조회", result: "credential/token boundary 필요" },
  { key: "ai_strategy_console", label: "C. ML/AI 전략 분석 콘솔", result: "model/admin approval workflow 필요" },
  { key: "user_feature_connection", label: "D. 사용자 기능 연결", result: "plan/access/public UI 검토 필요" },
];

const TRADING_LAB_MVP_HANDOFF_READINESS_FLAGS = [
  { key: "providerCallsAllowed", label: "providerCallsAllowed", result: "false" },
  { key: "orderSubmissionAllowed", label: "orderSubmissionAllowed", result: "false" },
  { key: "readyForReadOnlyProviderCalls", label: "readyForReadOnlyProviderCalls", result: "false" },
  { key: "readyForOrderSubmission", label: "readyForOrderSubmission", result: "false" },
  { key: "readyForLiveGuardedTrading", label: "readyForLiveGuardedTrading", result: "false" },
  { key: "actualLiveTradingReadiness", label: "actual live trading readiness", result: "false" },
  { key: "orderAuthorityExternalBlocker", label: "order authority external blocker", result: "외부 승인/증빙 필요" },
];

const TRADING_LAB_MVP_HANDOFF_NOTICE_ITEMS = [
  { key: "scope", label: "scope", result: "admin_mock_trading_lab" },
  { key: "mvpStatus", label: "mvpStatus", result: "internal_mock_mvp_ready_for_final_review" },
  { key: "safetyBoundary", label: "safetyBoundary", result: "admin-only, mock-only, fail-closed" },
  { key: "deploymentMetadataNotice", label: "deploymentMetadataNotice", result: "Render commit metadata stale 가능" },
  { key: "legacyCheckNotice", label: "legacyCheckNotice", result: "일부 legacy check shell timeout 가능" },
  { key: "nextRecommendedStep", label: "nextRecommendedStep", result: "mock trading lab MVP final review" },
  { key: "redacted", label: "redacted", result: "true" },
];

const TRADING_LAB_MVP_FINAL_REVIEW_STATUS_ITEMS = [
  { key: "finalReviewStatus", label: "finalReviewStatus", result: "internal_mock_mvp_final_review_ready" },
  { key: "scope", label: "scope", result: "admin_only_mock_trading_lab" },
  { key: "reviewSurface", label: "reviewSurface", result: "/admin/trading only" },
  { key: "safetyBoundary", label: "safetyBoundary", result: "fail_closed" },
  { key: "providerCallsAllowed", label: "providerCallsAllowed", result: "false" },
  { key: "orderSubmissionAllowed", label: "orderSubmissionAllowed", result: "false" },
  { key: "persistentDbWrite", label: "persistentDbWrite", result: "blocked" },
  { key: "actualLiveTradingReadiness", label: "actual live trading readiness", result: "false" },
  { key: "orderAuthorityExternalBlocker", label: "order authority external blocker", result: "external approval/evidence needed" },
  { key: "redacted", label: "redacted", result: "true" },
];

const TRADING_LAB_MVP_FINAL_REVIEW_COMPLETED_SCOPE = [
  { key: "admin_only_trading_shell", label: "admin-only trading lab shell", result: "reviewed" },
  { key: "mock_dashboard_sections", label: "mock dashboard sections", result: "reviewed" },
  { key: "safety_tab_split", label: "safety tab separation", result: "preserved" },
  { key: "strategy_draft_review", label: "strategy draft/review/clearance", result: "reviewed" },
  { key: "mock_run_candidate_chain", label: "mock run candidate chain", result: "reviewed" },
  { key: "mock_order_generation_chain", label: "mock order generation chain", result: "reviewed" },
  { key: "mock_execution_chain", label: "mock execution chain", result: "reviewed" },
  { key: "mock_fill_simulation_chain", label: "mock fill simulation chain", result: "reviewed" },
  { key: "mock_ledger_performance_chain", label: "mock ledger/performance chain", result: "reviewed" },
  { key: "mock_trading_run_summary", label: "mock trading run summary", result: "reviewed" },
  { key: "dashboard_consolidation_polish", label: "dashboard consolidation and badge polish", result: "reviewed" },
  { key: "mvp_completion_handoff", label: "MVP completion handoff", result: "reviewed" },
  { key: "public_surface_absence", label: "My Page and homepage exposure", result: "not exposed" },
  { key: "readiness_flags", label: "readiness/provider/order/live flags", result: "false preserved" },
];

const TRADING_LAB_MVP_FINAL_REVIEW_EXCLUDED_SCOPE = [
  { key: "kis_provider_call", label: "actual KIS/provider call", result: "excluded" },
  { key: "kis_token_issuance", label: "KIS token issuance", result: "excluded" },
  { key: "kis_quote_query", label: "KIS quote query", result: "excluded" },
  { key: "kis_order_payload", label: "KIS order payload", result: "excluded" },
  { key: "actual_order_submission", label: "actual order submission", result: "excluded" },
  { key: "actual_execution_fill", label: "actual execution/fill record", result: "excluded" },
  { key: "actual_balance_cash_position", label: "actual balance/cash/position query", result: "excluded" },
  { key: "db_trading_history", label: "DB-backed trading history", result: "excluded" },
  { key: "persistent_strategy", label: "persistent live strategy storage", result: "excluded" },
  { key: "user_trading_dashboard", label: "user-facing trading dashboard", result: "excluded" },
  { key: "automated_order_action", label: "automated or discretionary order action", result: "excluded" },
];

const TRADING_LAB_MVP_FINAL_REVIEW_KNOWN_ISSUES = [
  { key: "render_commit_metadata_stale", label: "Render health commit metadata", result: "stale metadata possible" },
  { key: "legacy_check_runner_timeout", label: "legacy trading check runner", result: "command-level timeout possible" },
  { key: "node_test_reference", label: "full node --test result", result: "source-of-truth regression check" },
  { key: "temp_cleanup_backlog", label: "local TEMP finple cleanup", result: "separate hygiene task recommended" },
];

const TRADING_LAB_MVP_FINAL_REVIEW_NEXT_SPRINT_OPTIONS = [
  { key: "legacy_runner_cleanup", label: "1. Legacy trading check runner cleanup", result: "recommended first" },
  { key: "db_mock_history", label: "2. DB-backed mock trading history", result: "requires DB-write design gate" },
  { key: "ai_ml_strategy_console", label: "3. AI/ML strategy console", result: "requires admin/model approval gate" },
  { key: "kis_read_only_quote", label: "4. KIS read-only quote boundary", result: "requires credential/token boundary review" },
];

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

const MOCK_HISTORY_REFERENCE_NOW = Date.parse("2026-07-11T00:00:00.000Z");
const MOCK_HISTORY_MS_PER_DAY = 24 * 60 * 60 * 1000;
const MOCK_HISTORY_COMPARE_STATUSES = new Set(["completed", "archived"]);

const MOCK_HISTORY_FILTER_DEFAULTS = Object.freeze({
  dateRange: "all",
  strategyPreset: "all",
  runStatus: "all",
  archivedMode: "exclude_archived",
  returnRange: "all",
  mddRange: "all",
  riskScoreRange: "all",
});

const MOCK_HISTORY_SORT_LABELS = Object.freeze({
  completed_desc: "최근 실행일",
  completed_asc: "오래된 실행일",
  return_desc: "수익률 높은 순",
  return_asc: "수익률 낮은 순",
  mdd_asc: "MDD 낮은 순",
  risk_asc: "위험점수 낮은 순",
  final_equity_desc: "최종 모의 평가금액 높은 순",
});

const MOCK_HISTORY_COMPARE_METRICS = Object.freeze([
  { key: "finalMockEquity", label: "최종 모의 평가금액", direction: "higher_better" },
  { key: "cumulativeReturn", label: "누적 모의 수익률", direction: "higher_better", percent: true },
  { key: "mdd", label: "MDD 방어력", direction: "lower_abs_better", percent: true },
  { key: "volatility", label: "변동성 안정성", direction: "lower_better", percent: true },
  { key: "sharpe", label: "Sharpe", direction: "higher_better" },
  { key: "riskScore", label: "위험점수", direction: "lower_better" },
]);

function getMockHistoryRecordTime(record) {
  return Date.parse(record?.completedAt || record?.createdAt || "1970-01-01T00:00:00.000Z");
}

function matchesMockHistoryDateRange(record, range) {
  if (!range || range === "all") return true;
  const days = { last_7_days: 7, last_30_days: 30, last_90_days: 90 }[range];
  if (!days) return true;
  return MOCK_HISTORY_REFERENCE_NOW - getMockHistoryRecordTime(record) <= days * MOCK_HISTORY_MS_PER_DAY;
}

function filterMockHistoryRecords(records, filters) {
  return records.filter((record) => {
    const drawdown = Math.abs(Number(record.mdd || 0));
    const returnValue = Number(record.cumulativeReturn || 0);
    const riskScore = Number(record.riskScore || 0);

    if (!matchesMockHistoryDateRange(record, filters.dateRange)) return false;
    if (filters.strategyPreset !== "all" && record.strategyPresetId !== filters.strategyPreset) return false;
    if (filters.runStatus !== "all" && record.runStatus !== filters.runStatus) return false;
    if (filters.archivedMode === "exclude_archived" && record.archived) return false;
    if (filters.archivedMode === "archived_only" && !record.archived) return false;
    if (filters.returnRange === "negative" && returnValue >= 0) return false;
    if (filters.returnRange === "zero_to_three" && (returnValue < 0 || returnValue > 3)) return false;
    if (filters.returnRange === "above_three" && returnValue <= 3) return false;
    if (filters.mddRange === "mdd_under_two" && drawdown >= 2) return false;
    if (filters.mddRange === "mdd_two_to_four" && (drawdown < 2 || drawdown > 4)) return false;
    if (filters.mddRange === "mdd_above_four" && drawdown <= 4) return false;
    if (filters.riskScoreRange === "low" && riskScore > 30) return false;
    if (filters.riskScoreRange === "medium" && (riskScore <= 30 || riskScore > 60)) return false;
    if (filters.riskScoreRange === "high" && riskScore <= 60) return false;
    return true;
  });
}

function sortMockHistoryRecords(records, sortKey) {
  const compare = {
    completed_desc: (a, b) => getMockHistoryRecordTime(b) - getMockHistoryRecordTime(a),
    completed_asc: (a, b) => getMockHistoryRecordTime(a) - getMockHistoryRecordTime(b),
    return_desc: (a, b) => Number(b.cumulativeReturn || 0) - Number(a.cumulativeReturn || 0),
    return_asc: (a, b) => Number(a.cumulativeReturn || 0) - Number(b.cumulativeReturn || 0),
    mdd_asc: (a, b) => Math.abs(Number(a.mdd || 0)) - Math.abs(Number(b.mdd || 0)),
    risk_asc: (a, b) => Number(a.riskScore || 0) - Number(b.riskScore || 0),
    final_equity_desc: (a, b) => Number(b.finalMockEquity || 0) - Number(a.finalMockEquity || 0),
  }[sortKey] || ((a, b) => getMockHistoryRecordTime(b) - getMockHistoryRecordTime(a));

  return [...records].sort((a, b) => compare(a, b) || String(a.runId).localeCompare(String(b.runId)));
}

function paginateMockHistoryRecords(records, page, pageSize) {
  const normalizedPageSize = Math.min(Math.max(Number(pageSize || 5), 1), 20);
  const pageCount = Math.max(1, Math.ceil(records.length / normalizedPageSize));
  const normalizedPage = Math.min(Math.max(Number(page || 1), 1), pageCount);
  const start = (normalizedPage - 1) * normalizedPageSize;
  return {
    records: records.slice(start, start + normalizedPageSize),
    page: normalizedPage,
    pageCount,
    pageSize: normalizedPageSize,
    totalRecords: records.length,
  };
}

function getMockHistoryCompareMetricValue(record, metricKey) {
  if (metricKey === "mdd") return Math.abs(Number(record?.mdd || 0));
  return Number(record?.[metricKey] || 0);
}

function deriveMockHistoryAllocation(record) {
  const text = `${record?.strategyName || ""} ${record?.allocationSummary || ""}`.toLowerCase();
  if (text.includes("cash defense")) return { equity: 30, income: 35, cash: 35, other: 0 };
  if (text.includes("income") || text.includes("dividend")) return { equity: 25, income: 55, cash: 15, other: 5 };
  if (text.includes("low volatility")) return { equity: 45, income: 30, cash: 20, other: 5 };
  if (text.includes("tech")) return { equity: 75, income: 10, cash: 10, other: 5 };
  if (text.includes("balanced")) return { equity: 60, income: 25, cash: 10, other: 5 };
  return { equity: 50, income: 25, cash: 15, other: 10 };
}

function rankMockHistoryCompareMetric(records, metric) {
  if (metric.direction === "neutral") return [];
  const factor = metric.direction === "higher_better" ? -1 : 1;
  return [...records].sort((a, b) => {
    const left = getMockHistoryCompareMetricValue(a, metric.key);
    const right = getMockHistoryCompareMetricValue(b, metric.key);
    return (left - right) * factor || String(a.runId).localeCompare(String(b.runId));
  });
}

function buildMockHistoryCompareUiModel(records, serverCompare = {}) {
  const selectedRecords = Array.isArray(records) ? records : [];
  const unsupportedCount = selectedRecords.filter((record) => !MOCK_HISTORY_COMPARE_STATUSES.has(record.runStatus) || record.compareSupported !== true).length;
  const calculationVersions = [...new Set(selectedRecords.map((record) => record.calculationVersion).filter(Boolean))];
  const compareReady = selectedRecords.length >= 2 && selectedRecords.length <= 3 && unsupportedCount === 0;
  const compatibilityStatus = calculationVersions.length <= 1
    ? "compatible"
    : calculationVersions.some((version) => version !== "mock_calc_v3")
      ? "incompatible"
      : "compatible_with_warning";
  const baseline = selectedRecords[0] || null;
  const metricComparisons = compareReady ? MOCK_HISTORY_COMPARE_METRICS.map((metric) => ({
    ...metric,
    baselineRunId: baseline?.runId || null,
    values: selectedRecords.map((record) => {
      const value = getMockHistoryCompareMetricValue(record, metric.key);
      const baselineValue = baseline ? getMockHistoryCompareMetricValue(baseline, metric.key) : value;
      return {
        runId: record.runId,
        value,
        differenceFromBaseline: Number((value - baselineValue).toFixed(2)),
      };
    }),
  })) : [];
  const rankings = compareReady && compatibilityStatus !== "incompatible"
    ? MOCK_HISTORY_COMPARE_METRICS.map((metric) => ({
        metricKey: metric.key,
        label: metric.label,
        rows: rankMockHistoryCompareMetric(selectedRecords, metric).map((record, index) => ({
          rank: index + 1,
          runId: record.runId,
          value: getMockHistoryCompareMetricValue(record, metric.key),
        })),
      }))
    : [];
  const allocationComparisons = compareReady ? selectedRecords.map((record) => ({
    runId: record.runId,
    allocation: deriveMockHistoryAllocation(record),
  })) : [];
  const riskComparisons = compareReady ? selectedRecords.map((record) => ({
    runId: record.runId,
    riskScore: record.riskScore,
    warningCount: record.warningCount,
    blockerCount: record.blockerCount,
    riskLevel: Number(record.riskScore || 0) <= 30 ? "낮음" : Number(record.riskScore || 0) <= 60 ? "중간" : "높음",
  })) : [];
  const restoreCandidateEligibility = compareReady ? selectedRecords.map((record) => ({
    restoreEligible: record.redacted === true && Boolean(record.strategyVersion) && Boolean(record.inputSummary),
    restoreSourceRunId: record.runId,
    sourceStrategyVersion: record.strategyVersion,
    dbWriteStatus: "blocked",
    reason: "Step190 restore candidate contract",
  })) : [];

  return {
    compareId: serverCompare.compareId || "step189_mock_trading_history_compare_ui",
    compareReady,
    selectedRunIds: selectedRecords.map((record) => record.runId),
    selectedRuns: selectedRecords,
    compatibilityStatus,
    unsupportedCount,
    metricComparisons,
    allocationComparisons,
    riskComparisons,
    rankings,
    highlightedDifferences: metricComparisons.map((metric) => {
      const values = metric.values || [];
      if (values.length === 0) return null;
      const highest = values.reduce((best, current) => (current.value > best.value ? current : best), values[0]);
      const lowest = values.reduce((best, current) => (current.value < best.value ? current : best), values[0]);
      return {
        metricKey: metric.key,
        label: metric.label,
        highestRunId: highest.runId,
        lowestRunId: lowest.runId,
        spread: Number((highest.value - lowest.value).toFixed(2)),
      };
    }).filter(Boolean),
    restoreCandidateEligibility,
    dbReadStatus: serverCompare.dbReadStatus || "blocked",
    dbWriteStatus: serverCompare.dbWriteStatus || "blocked",
    nextStep: serverCompare.nextStep || "mock_strategy_restore_candidate",
  };
}

function deriveMockRestoreAllocation(record) {
  const allocation = deriveMockHistoryAllocation(record);
  return [
    ["equity", allocation.equity],
    ["income", allocation.income],
    ["cash", allocation.cash],
    ["other", allocation.other],
  ].map(([symbol, targetWeight]) => ({
    symbol,
    targetWeight,
    status: "draft_candidate",
  }));
}

function buildMockStrategyRestoreCandidateUiModel(sourceRecord, serverCandidate = {}) {
  if (!sourceRecord) {
    return {
      restoreCandidateId: "step190_restore_candidate_unselected",
      sourceRunId: null,
      restoreEligibility: "blocked",
      restorationStatus: "blocked",
      targetDraftLabel: "복원 후보로 사용할 완료된 모의 실행을 선택해주세요.",
      copiedFields: [],
      excludedFields: [],
      transformedFields: [],
      validationWarnings: [],
      validationBlockers: ["source_run_not_selected"],
      targetDraftPreview: null,
      dbReadStatus: "blocked",
      dbWriteStatus: "blocked",
      nextStep: "strategy_draft_editor_candidate",
    };
  }

  const eligibleStatus = MOCK_HISTORY_COMPARE_STATUSES.has(sourceRecord.runStatus) && sourceRecord.compareSupported === true;
  const warnings = [];
  const blockers = [];
  if (!eligibleStatus) blockers.push("완료된 모의 실행만 전략 복원 후보로 사용할 수 있습니다.");
  if (!sourceRecord.strategyVersion) blockers.push("전략 버전 정보가 없습니다.");
  if (!sourceRecord.inputSummary) blockers.push("입력 snapshot이 누락되었습니다.");
  if (sourceRecord.redacted !== true) blockers.push("민감정보 제거 조건을 충족하지 못했습니다.");
  if (sourceRecord.calculationVersion !== "mock_calc_v3") warnings.push("calculationVersion outdated");
  if (sourceRecord.archived) warnings.push("archived source");
  if (sourceRecord.warningCount > 0) warnings.push("warning history excluded");

  const targetAllocations = deriveMockRestoreAllocation(sourceRecord);
  const restoreEligibility = blockers.length > 0 ? "blocked" : warnings.length > 0 ? "eligible_with_warning" : "eligible";
  return {
    restoreCandidateId: serverCandidate.restoreCandidateId || `step190_restore_candidate_${sourceRecord.runId}`,
    sourceRunId: sourceRecord.runId,
    sourceStrategyPresetId: sourceRecord.strategyPresetId,
    sourceStrategyVersionId: `${sourceRecord.strategyPresetId}:${sourceRecord.strategyVersion}`,
    sourceStrategyName: sourceRecord.strategyName,
    sourceStrategyVersion: sourceRecord.strategyVersion,
    restoreEligibility,
    restorationStatus: blockers.length > 0 ? "blocked" : warnings.length > 0 ? "validation_required" : "candidate_only",
    targetDraftId: `restore-draft-${sourceRecord.runId}`,
    targetDraftLabel: `${sourceRecord.strategyName} restore draft`,
    copiedFields: [
      "strategy name",
      "description",
      "strategy type",
      "asset universe",
      "target allocations",
      "rebalance rule",
      "risk limits",
      "calculation version reference",
      "tags",
      "mock-only scope",
    ],
    excludedFields: [
      "order/fill summaries",
      "ledger/performance/risk result snapshots",
      "original timestamps",
      "live account data",
      "provider/KIS fields",
      "credential/token values",
    ],
    transformedFields: [
      `strategy name -> ${sourceRecord.strategyName} restore draft`,
      "status -> draft_candidate",
      "version -> next_version_candidate",
      "archived -> false",
      "source -> restored_from_mock_run",
    ],
    validationWarnings: warnings,
    validationBlockers: blockers,
    sourceCalculationVersion: sourceRecord.calculationVersion,
    targetDraftPreview: {
      draftLabel: `${sourceRecord.strategyName} restore draft`,
      strategyName: `${sourceRecord.strategyName} restore draft`,
      strategyType: "admin_mock_lab_strategy",
      assetUniverse: targetAllocations.map((allocation) => allocation.symbol),
      targetAllocations,
      rebalanceRule: "manual_review / 5% placeholder",
      riskLimits: "conservative mock risk placeholders",
      sourceRun: sourceRecord.runId,
      sourceStrategyVersion: `${sourceRecord.strategyPresetId}:${sourceRecord.strategyVersion}`,
      copiedFieldCount: 10,
      excludedFieldCount: 6,
      warningCount: warnings.length,
      blockerCount: blockers.length,
      status: blockers.length > 0 ? "blocked" : "draft_candidate",
      persistence: "blocked",
    },
    lineage: {
      restoredFromRunId: sourceRecord.runId,
      restoredFromStrategyVersionId: `${sourceRecord.strategyPresetId}:${sourceRecord.strategyVersion}`,
      restorationReason: "admin_mock_lab_restore_preview",
      transformationVersion: "step190_restore_transform_v1",
      createdByAdminPlaceholder: "admin_placeholder",
      redacted: true,
    },
    immutableSourceConfirmed: true,
    dbReadStatus: "blocked",
    dbWriteStatus: "blocked",
    supabaseMutationStatus: "blocked",
    providerCallStatus: "blocked",
    orderSubmissionStatus: "blocked",
    nextStep: "strategy_draft_editor_candidate",
  };
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
  const [tradingLabMockDashboardCleanupReviewResultStatus, setTradingLabMockDashboardCleanupReviewResultStatus] = useState(null);
  const [tradingLabMockDashboardCleanupCoreStatus, setTradingLabMockDashboardCleanupCoreStatus] = useState(null);
  const [tradingLabMockDashboardCleanupCoreReviewResultStatus, setTradingLabMockDashboardCleanupCoreReviewResultStatus] = useState(null);
  const [tradingLabDashboardUxPolishPreflightStatus, setTradingLabDashboardUxPolishPreflightStatus] = useState(null);
  const [tradingLabDashboardUxPolishReviewResultStatus, setTradingLabDashboardUxPolishReviewResultStatus] = useState(null);
  const [tradingLabDashboardUxPolishCoreStatus, setTradingLabDashboardUxPolishCoreStatus] = useState(null);
  const [tradingLabDbBackedMockTradingHistoryPreflightStatus, setTradingLabDbBackedMockTradingHistoryPreflightStatus] = useState(null);
  const [tradingLabDbBackedMockTradingHistoryReviewResultStatus, setTradingLabDbBackedMockTradingHistoryReviewResultStatus] = useState(null);
  const [tradingLabDbBackedMockTradingHistoryMigrationPreflightStatus, setTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus] = useState(null);
  const [tradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus, setTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus] = useState(null);
  const [mockHistoryFilters, setMockHistoryFilters] = useState(MOCK_HISTORY_FILTER_DEFAULTS);
  const [mockHistorySort, setMockHistorySort] = useState("completed_desc");
  const [mockHistoryPage, setMockHistoryPage] = useState(1);
  const [mockHistoryPageSize, setMockHistoryPageSize] = useState(5);
  const [mockHistorySelectedRunIds, setMockHistorySelectedRunIds] = useState([]);
  const [mockHistoryFocusedRunId, setMockHistoryFocusedRunId] = useState(null);
  const [mockStrategyRestoreSourceRunId, setMockStrategyRestoreSourceRunId] = useState("");
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
      fetchAdminTradingLabMockDashboardCleanupReviewResultStatus().catch(() => null),
      fetchAdminTradingLabMockDashboardCleanupCoreStatus().catch(() => null),
      fetchAdminTradingLabMockDashboardCleanupCoreReviewResultStatus().catch(() => null),
      fetchAdminTradingLabDashboardUxPolishPreflightStatus().catch(() => null),
      fetchAdminTradingLabDashboardUxPolishReviewResultStatus().catch(() => null),
      fetchAdminTradingLabDashboardUxPolishCoreStatus().catch(() => null),
      fetchAdminTradingLabDbBackedMockTradingHistoryPreflightStatus().catch(() => null),
      fetchAdminTradingLabDbBackedMockTradingHistoryReviewResultStatus().catch(() => null),
      fetchAdminTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus().catch(() => null),
      fetchAdminTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus().catch(() => null),
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
        setTradingLabMockDashboardCleanupReviewResultStatus(payload?.[44] || null);
        setTradingLabMockDashboardCleanupCoreStatus(payload?.[45] || null);
        setTradingLabMockDashboardCleanupCoreReviewResultStatus(payload?.[46] || null);
        setTradingLabDashboardUxPolishPreflightStatus(payload?.[47] || null);
        setTradingLabDashboardUxPolishReviewResultStatus(payload?.[48] || null);
        setTradingLabDashboardUxPolishCoreStatus(payload?.[49] || null);
        setTradingLabDbBackedMockTradingHistoryPreflightStatus(payload?.[50] || null);
        setTradingLabDbBackedMockTradingHistoryReviewResultStatus(payload?.[51] || null);
        setTradingLabDbBackedMockTradingHistoryMigrationPreflightStatus(payload?.[52] || null);
        setTradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus(payload?.[53] || null);
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
  const labMockDashboardCleanupReviewResultStatus = tradingLabMockDashboardCleanupReviewResultStatus || tradingLabDashboardStatus?.mockDashboardCleanupReviewResultStatus || {};
  const labMockDashboardCleanupReviewResult = labMockDashboardCleanupReviewResultStatus?.reviewResult || {};
  const labMockDashboardCleanupReviewReceipt = labMockDashboardCleanupReviewResultStatus?.receipt || {};
  const labMockDashboardCleanupReviewValidation = labMockDashboardCleanupReviewResultStatus?.validation || {};
  const labMockDashboardCleanupReviewSectionSummary = labMockDashboardCleanupReviewResultStatus?.sectionReviewSummary || {};
  const labMockDashboardCleanupReviewDecisionSummary = labMockDashboardCleanupReviewResultStatus?.decisionSummary || {};
  const labMockDashboardCleanupReviewHistory = Array.isArray(labMockDashboardCleanupReviewResultStatus?.mockHistory)
    ? labMockDashboardCleanupReviewResultStatus.mockHistory
    : [];
  const labMockDashboardCleanupCoreStatus = tradingLabMockDashboardCleanupCoreStatus || tradingLabDashboardStatus?.mockDashboardCleanupCoreStatus || {};
  const labMockDashboardCleanupCoreResult = labMockDashboardCleanupCoreStatus?.result || {};
  const labMockDashboardSummaryFirstLayout = labMockDashboardCleanupCoreStatus?.summaryFirstLayout || labMockDashboardCleanupCoreResult?.summaryFirstLayout || {};
  const labMockDashboardCollapsibleDetailGroupResult = labMockDashboardCleanupCoreStatus?.collapsibleDetailGroupResult || {};
  const labMockDashboardCleanupCoreValidation = labMockDashboardCleanupCoreStatus?.validation || {};
  const labMockDashboardCleanupCoreHistory = Array.isArray(labMockDashboardCleanupCoreStatus?.mockHistory)
    ? labMockDashboardCleanupCoreStatus.mockHistory
    : [];
  const labMockDashboardCleanupCoreGroups = Array.isArray(labMockDashboardCollapsibleDetailGroupResult?.groups)
    ? labMockDashboardCollapsibleDetailGroupResult.groups
    : [];
  const labMockDashboardCleanupCoreVisibleSections = Array.isArray(labMockDashboardCleanupCoreResult?.visiblePrimarySections)
    ? labMockDashboardCleanupCoreResult.visiblePrimarySections
    : [];
  const labMockDashboardCleanupCoreReviewResultStatus = tradingLabMockDashboardCleanupCoreReviewResultStatus || tradingLabDashboardStatus?.mockDashboardCleanupCoreReviewResultStatus || {};
  const labMockDashboardCleanupCoreReviewResult = labMockDashboardCleanupCoreReviewResultStatus?.reviewResult || {};
  const labMockDashboardCleanupCoreReviewReceipt = labMockDashboardCleanupCoreReviewResultStatus?.receipt || {};
  const labMockDashboardCleanupCoreReviewValidation = labMockDashboardCleanupCoreReviewResultStatus?.validation || {};
  const labMockDashboardCleanupCoreReviewSummary = labMockDashboardCleanupCoreReviewResultStatus?.reviewSummary || {};
  const labMockDashboardCleanupCoreReviewDecisionSummary = labMockDashboardCleanupCoreReviewResultStatus?.decisionSummary || {};
  const labMockDashboardCleanupCoreReviewHistory = Array.isArray(labMockDashboardCleanupCoreReviewResultStatus?.mockHistory)
    ? labMockDashboardCleanupCoreReviewResultStatus.mockHistory
    : [];
  const labDashboardUxPolishPreflightStatus = tradingLabDashboardUxPolishPreflightStatus || tradingLabDashboardStatus?.dashboardUxPolishPreflightStatus || {};
  const labDashboardUxPolishResult = labDashboardUxPolishPreflightStatus?.result || {};
  const labDashboardUxPolishValidation = labDashboardUxPolishPreflightStatus?.validation || {};
  const labDashboardUxPolishTargets = Array.isArray(labDashboardUxPolishPreflightStatus?.targetInventory)
    ? labDashboardUxPolishPreflightStatus.targetInventory
    : [];
  const labDashboardUxPolishDuplicateVerboseDetection = labDashboardUxPolishPreflightStatus?.duplicateVerboseDetection || {};
  const labDashboardUxPolishKoreanLabels = Array.isArray(labDashboardUxPolishPreflightStatus?.koreanLabelInventory?.mappings)
    ? labDashboardUxPolishPreflightStatus.koreanLabelInventory.mappings
    : [];
  const labDashboardUxPolishSummaryFirst = labDashboardUxPolishPreflightStatus?.summaryFirstReadability || {};
  const labDashboardUxPolishSafetyNotice = labDashboardUxPolishPreflightStatus?.safetyNoticeVisibility || {};
  const labDashboardUxPolishReviewResultStatus = tradingLabDashboardUxPolishReviewResultStatus || tradingLabDashboardStatus?.dashboardUxPolishReviewResultStatus || {};
  const labDashboardUxPolishReviewResult = labDashboardUxPolishReviewResultStatus?.reviewResult || {};
  const labDashboardUxPolishReviewReceipt = labDashboardUxPolishReviewResultStatus?.receipt || {};
  const labDashboardUxPolishReviewValidation = labDashboardUxPolishReviewResultStatus?.validation || {};
  const labDashboardUxPolishReviewDecisionSummary = labDashboardUxPolishReviewResultStatus?.decisionSummary || {};
  const labDashboardUxPolishTargetReviewSummary = labDashboardUxPolishReviewResultStatus?.targetInventoryReviewSummary || {};
  const labDashboardUxPolishDuplicateVerboseReviewSummary = labDashboardUxPolishReviewResultStatus?.duplicateVerboseReviewSummary || {};
  const labDashboardUxPolishKoreanLabelReviewSummary = labDashboardUxPolishReviewResultStatus?.koreanLabelReviewSummary || {};
  const labDashboardUxPolishReadabilityReviewSummary = labDashboardUxPolishReviewResultStatus?.readabilityReviewSummary || {};
  const labDashboardUxPolishSafetyReviewSummary = labDashboardUxPolishReviewResultStatus?.safetyReviewSummary || {};
  const labDashboardUxPolishReviewBlockers = Array.isArray(labDashboardUxPolishReviewValidation.blockerSummary)
    ? labDashboardUxPolishReviewValidation.blockerSummary
    : Array.isArray(labDashboardUxPolishReviewValidation.blockers)
      ? labDashboardUxPolishReviewValidation.blockers
      : [];
  const labDashboardUxPolishReviewWarnings = Array.isArray(labDashboardUxPolishReviewValidation.warningSummary)
    ? labDashboardUxPolishReviewValidation.warningSummary
    : Array.isArray(labDashboardUxPolishReviewValidation.warnings)
      ? labDashboardUxPolishReviewValidation.warnings
      : [];
  const labDashboardUxPolishDecisionMessages = Array.isArray(labDashboardUxPolishReviewDecisionSummary.summary)
    ? labDashboardUxPolishReviewDecisionSummary.summary
    : [];
  const labDashboardUxPolishCoreStatus = tradingLabDashboardUxPolishCoreStatus || tradingLabDashboardStatus?.dashboardUxPolishCoreStatus || {};
  const labDashboardUxPolishCoreResult = labDashboardUxPolishCoreStatus?.coreResult || {};
  const labDashboardUxPolishCoreValidation = labDashboardUxPolishCoreStatus?.validation || {};
  const labDashboardUxPolishSummaryFirstLayout = labDashboardUxPolishCoreStatus?.summaryFirstLayout || {};
  const labDashboardUxPolishDetailChain = labDashboardUxPolishCoreStatus?.collapsibleDetailChain || {};
  const labDashboardUxPolishKoreanLabelPolish = labDashboardUxPolishCoreStatus?.koreanLabelPolish || {};
  const labDashboardUxPolishSafetyNoticePolish = labDashboardUxPolishCoreStatus?.safetyNoticePolish || {};
  const labDashboardUxPolishReadabilityPolish = labDashboardUxPolishCoreStatus?.readabilityPolish || {};
  const labDashboardUxPolishDuplicateVerboseCleanup = labDashboardUxPolishCoreStatus?.duplicateVerboseCleanup || {};
  const labDashboardUxPolishCoreGroups = Array.isArray(labDashboardUxPolishDetailChain.groups)
    ? labDashboardUxPolishDetailChain.groups
    : [];
  const labDashboardUxPolishCoreLabels = Array.isArray(labDashboardUxPolishKoreanLabelPolish.labels)
    ? labDashboardUxPolishKoreanLabelPolish.labels
    : [];
  const labDashboardUxPolishCoreTopOrder = Array.isArray(labDashboardUxPolishSummaryFirstLayout.topOrder)
    ? labDashboardUxPolishSummaryFirstLayout.topOrder
    : [];
  const labDashboardUxPolishCoreBlockers = Array.isArray(labDashboardUxPolishCoreValidation.blockerSummary)
    ? labDashboardUxPolishCoreValidation.blockerSummary
    : Array.isArray(labDashboardUxPolishCoreValidation.blockers)
      ? labDashboardUxPolishCoreValidation.blockers
      : [];
  const labDashboardUxPolishCoreWarnings = Array.isArray(labDashboardUxPolishCoreValidation.warningSummary)
    ? labDashboardUxPolishCoreValidation.warningSummary
    : Array.isArray(labDashboardUxPolishCoreValidation.warnings)
      ? labDashboardUxPolishCoreValidation.warnings
      : [];
  const labDbBackedMockTradingHistoryPreflightStatus = tradingLabDbBackedMockTradingHistoryPreflightStatus || tradingLabDashboardStatus?.dbBackedMockTradingHistoryPreflightStatus || {};
  const labDbBackedMockTradingHistoryPreflight = labDbBackedMockTradingHistoryPreflightStatus?.preflight || {};
  const labDbBackedMockTradingHistorySchemaDraft = labDbBackedMockTradingHistoryPreflightStatus?.candidateTableSchemaDraft || labDbBackedMockTradingHistoryPreflight?.schemaDraft || {};
  const labDbBackedMockTradingHistoryTables = Array.isArray(labDbBackedMockTradingHistorySchemaDraft.tables)
    ? labDbBackedMockTradingHistorySchemaDraft.tables
    : [];
  const labDbBackedMockTradingHistoryChecklist = labDbBackedMockTradingHistoryPreflightStatus?.migrationReadinessChecklist || labDbBackedMockTradingHistoryPreflight?.migrationReadinessChecklist || {};
  const labDbBackedMockTradingHistoryChecklistItems = Array.isArray(labDbBackedMockTradingHistoryChecklist.items)
    ? labDbBackedMockTradingHistoryChecklist.items
    : [];
  const labDbBackedMockTradingHistoryRedaction = labDbBackedMockTradingHistoryPreflightStatus?.redactionPolicySummary || labDbBackedMockTradingHistoryPreflight?.redactionPolicySummary || {};
  const labDbBackedMockTradingHistoryForbidden = Array.isArray(labDbBackedMockTradingHistoryRedaction.prohibitedValueTypes)
    ? labDbBackedMockTradingHistoryRedaction.prohibitedValueTypes
    : [];
  const labDbBackedMockTradingHistoryDbWrite = labDbBackedMockTradingHistoryPreflightStatus?.dbWriteBlockedConfirmation || labDbBackedMockTradingHistoryPreflight?.dbWriteBlockedConfirmation || {};
  const labDbBackedMockTradingHistoryReviewResultStatus = tradingLabDbBackedMockTradingHistoryReviewResultStatus || tradingLabDashboardStatus?.dbBackedMockTradingHistoryReviewResultStatus || {};
  const labDbBackedMockTradingHistoryReviewResult = labDbBackedMockTradingHistoryReviewResultStatus?.reviewResult || {};
  const labDbBackedMockTradingHistoryReviewReceipt = labDbBackedMockTradingHistoryReviewResultStatus?.receipt || {};
  const labDbBackedMockTradingHistoryReviewValidation = labDbBackedMockTradingHistoryReviewResultStatus?.reviewValidationCore || {};
  const labDbBackedMockTradingHistoryCandidateReview = labDbBackedMockTradingHistoryReviewResultStatus?.candidateSchemaReviewSummary || {};
  const labDbBackedMockTradingHistoryRedactionReview = labDbBackedMockTradingHistoryReviewResultStatus?.redactionPolicyReviewSummary || {};
  const labDbBackedMockTradingHistoryMigrationReview = labDbBackedMockTradingHistoryReviewResultStatus?.migrationReadinessReviewSummary || {};
  const labDbBackedMockTradingHistoryReviewForbidden = Array.isArray(labDbBackedMockTradingHistoryRedactionReview.forbiddenValueTypes)
    ? labDbBackedMockTradingHistoryRedactionReview.forbiddenValueTypes
    : [];
  const labDbBackedMockTradingHistoryReviewSummary = Array.isArray(labDbBackedMockTradingHistoryReviewResult.summary)
    ? labDbBackedMockTradingHistoryReviewResult.summary
    : [];
  const labDbBackedMockTradingHistoryReviewWarnings = Array.isArray(labDbBackedMockTradingHistoryReviewResult.warnings)
    ? labDbBackedMockTradingHistoryReviewResult.warnings
    : [];
  const labDbBackedMockTradingHistoryReviewBlockers = Array.isArray(labDbBackedMockTradingHistoryReviewResult.blockers)
    ? labDbBackedMockTradingHistoryReviewResult.blockers
    : [];
  const labDbBackedMockTradingHistoryMigrationPreflightStatus = tradingLabDbBackedMockTradingHistoryMigrationPreflightStatus || tradingLabDashboardStatus?.dbBackedMockTradingHistoryMigrationPreflightStatus || {};
  const labDbBackedMockTradingHistoryMigrationPreflight = labDbBackedMockTradingHistoryMigrationPreflightStatus?.migrationPreflight || {};
  const labDbBackedMockTradingHistoryMigrationValidation = labDbBackedMockTradingHistoryMigrationPreflightStatus?.validation || {};
  const labDbBackedMockTradingHistoryMigrationTableSummary = labDbBackedMockTradingHistoryMigrationPreflightStatus?.candidateTableDraftSummary || {};
  const labDbBackedMockTradingHistoryMigrationPolicySummary = labDbBackedMockTradingHistoryMigrationPreflightStatus?.candidateIndexConstraintRlsPolicyDraftSummary || {};
  const labDbBackedMockTradingHistoryMigrationChecklist = labDbBackedMockTradingHistoryMigrationPreflightStatus?.migrationReadinessChecklist || {};
  const labDbBackedMockTradingHistoryMigrationChecklistItems = Array.isArray(labDbBackedMockTradingHistoryMigrationChecklist.items)
    ? labDbBackedMockTradingHistoryMigrationChecklist.items
    : [];
  const labDbBackedMockTradingHistoryMigrationTables = Array.isArray(labDbBackedMockTradingHistoryMigrationPreflight.candidateTables)
    ? labDbBackedMockTradingHistoryMigrationPreflight.candidateTables
    : [];
  const labDbBackedMockTradingHistoryMigrationBlockers = Array.isArray(labDbBackedMockTradingHistoryMigrationPreflight.blockers)
    ? labDbBackedMockTradingHistoryMigrationPreflight.blockers
    : [];
  const labDbBackedMockTradingHistoryMigrationWarnings = Array.isArray(labDbBackedMockTradingHistoryMigrationPreflight.warnings)
    ? labDbBackedMockTradingHistoryMigrationPreflight.warnings
    : [];
  const labDbBackedMockTradingHistoryMigrationReviewResultStatus = tradingLabDbBackedMockTradingHistoryMigrationReviewResultStatus || tradingLabDashboardStatus?.dbBackedMockTradingHistoryMigrationReviewResultStatus || {};
  const labDbBackedMockTradingHistoryMigrationReviewResult = labDbBackedMockTradingHistoryMigrationReviewResultStatus?.reviewResult || {};
  const labDbBackedMockTradingHistoryMigrationReviewReceipt = labDbBackedMockTradingHistoryMigrationReviewResultStatus?.receipt || {};
  const labDbBackedMockTradingHistoryMigrationReviewSummary = labDbBackedMockTradingHistoryMigrationReviewResultStatus?.tableIndexConstraintRlsReviewSummary || {};
  const labDbBackedMockTradingHistoryMigrationReviewTables = Array.isArray(labDbBackedMockTradingHistoryMigrationReviewResult.tableReviewSummary)
    ? labDbBackedMockTradingHistoryMigrationReviewResult.tableReviewSummary
    : [];
  const labDbBackedMockTradingHistoryMigrationReviewBlockers = Array.isArray(labDbBackedMockTradingHistoryMigrationReviewResult.blockers)
    ? labDbBackedMockTradingHistoryMigrationReviewResult.blockers
    : [];
  const labDbBackedMockTradingHistoryMigrationReviewWarnings = Array.isArray(labDbBackedMockTradingHistoryMigrationReviewResult.warnings)
    ? labDbBackedMockTradingHistoryMigrationReviewResult.warnings
    : [];
  const labMockTradingHistoryPersistenceArchitectureStatus = tradingLabDashboardStatus?.mockTradingHistoryPersistenceArchitectureStatus || {};
  const labMockTradingHistoryPersistenceArchitecture = labMockTradingHistoryPersistenceArchitectureStatus?.architecture || {};
  const labMockTradingHistoryPersistenceDomains = Array.isArray(labMockTradingHistoryPersistenceArchitecture.storageDomains)
    ? labMockTradingHistoryPersistenceArchitecture.storageDomains
    : [];
  const labMockTradingHistoryPersistenceRelationshipTree = Array.isArray(labMockTradingHistoryPersistenceArchitecture.entityRelationshipGraph?.tree)
    ? labMockTradingHistoryPersistenceArchitecture.entityRelationshipGraph.tree
    : [];
  const labMockTradingHistoryPersistenceContracts = Array.isArray(labMockTradingHistoryPersistenceArchitecture.implementationContracts)
    ? labMockTradingHistoryPersistenceArchitecture.implementationContracts
    : [];
  const labMockTradingHistoryPersistenceValidation = labMockTradingHistoryPersistenceArchitectureStatus?.validation || {};
  const labMockTradingHistoryPersistenceBlocked = labMockTradingHistoryPersistenceArchitectureStatus?.blockedConfirmation || {};
  const labMockTradingHistorySupabaseSchemaDraftStatus = tradingLabDashboardStatus?.mockTradingHistorySupabaseSchemaDraftStatus || {};
  const labMockTradingHistorySupabaseSchemaDraft = labMockTradingHistorySupabaseSchemaDraftStatus?.schemaDraft || {};
  const labMockTradingHistorySupabaseTables = Array.isArray(labMockTradingHistorySupabaseSchemaDraftStatus?.tableSummary)
    ? labMockTradingHistorySupabaseSchemaDraftStatus.tableSummary
    : [];
  const labMockTradingHistorySupabaseRelationships = labMockTradingHistorySupabaseSchemaDraftStatus?.relationshipSummary || {};
  const labMockTradingHistorySupabaseQueries = labMockTradingHistorySupabaseSchemaDraftStatus?.queryContractSummary || {};
  const labMockTradingHistorySupabaseValidation = labMockTradingHistorySupabaseSchemaDraftStatus?.validation || {};
  const labMockTradingHistorySupabaseBlocked = labMockTradingHistorySupabaseSchemaDraftStatus?.blockedConfirmation || {};
  const labMockTradingHistoryBrowserStatus = tradingLabDashboardStatus?.mockTradingHistoryBrowserStatus || {};
  const labMockTradingHistoryBrowser = labMockTradingHistoryBrowserStatus?.browser || {};
  const labMockHistoryRecords = Array.isArray(labMockTradingHistoryBrowser.records)
    ? labMockTradingHistoryBrowser.records
    : [];
  const labMockHistoryFilteredRecords = useMemo(
    () => sortMockHistoryRecords(filterMockHistoryRecords(labMockHistoryRecords, mockHistoryFilters), mockHistorySort),
    [labMockHistoryRecords, mockHistoryFilters, mockHistorySort],
  );
  const labMockHistoryPagination = useMemo(
    () => paginateMockHistoryRecords(labMockHistoryFilteredRecords, mockHistoryPage, mockHistoryPageSize),
    [labMockHistoryFilteredRecords, mockHistoryPage, mockHistoryPageSize],
  );
  const labMockHistoryVisibleRecords = labMockHistoryPagination.records;
  const labMockHistoryStrategyOptions = useMemo(() => {
    const pairs = labMockHistoryRecords.map((record) => [record.strategyPresetId, record.strategyName]);
    return [["all", "전체"], ...Array.from(new Map(pairs).entries())];
  }, [labMockHistoryRecords]);
  const labMockHistoryFocusedRecord = labMockHistoryRecords.find((record) => record.runId === mockHistoryFocusedRunId)
    || labMockHistoryVisibleRecords[0]
    || null;
  const labMockHistorySelectedRecords = mockHistorySelectedRunIds
    .map((runId) => labMockHistoryRecords.find((record) => record.runId === runId))
    .filter(Boolean);
  const labMockHistoryUnsupportedSelectionCount = labMockHistorySelectedRecords.filter((record) => !MOCK_HISTORY_COMPARE_STATUSES.has(record.runStatus) || record.compareSupported !== true).length;
  const labMockHistoryCalculationVersions = [...new Set(labMockHistorySelectedRecords.map((record) => record.calculationVersion))];
  const labMockHistoryCompareReady = labMockHistorySelectedRecords.length >= 2 && labMockHistorySelectedRecords.length <= 3 && labMockHistoryUnsupportedSelectionCount === 0;
  const labMockHistoryCompareWarning = labMockHistoryCalculationVersions.length > 1 ? "calculation_version_mismatch_warning" : "compatible";
  const labMockTradingHistoryCompareStatus = tradingLabDashboardStatus?.mockTradingHistoryCompareStatus || {};
  const labMockTradingHistoryCompare = useMemo(
    () => buildMockHistoryCompareUiModel(labMockHistorySelectedRecords, labMockTradingHistoryCompareStatus?.compare || {}),
    [labMockHistorySelectedRecords, labMockTradingHistoryCompareStatus],
  );
  const labMockStrategyRestoreCandidateStatus = tradingLabDashboardStatus?.mockStrategyRestoreCandidateStatus || {};
  const labMockStrategyRestoreSourceOptions = labMockHistorySelectedRecords.length > 0
    ? labMockHistorySelectedRecords
    : labMockHistoryFocusedRecord
      ? [labMockHistoryFocusedRecord]
      : [];
  const labMockStrategyRestoreSourceRecord = labMockStrategyRestoreSourceOptions.find((record) => record.runId === mockStrategyRestoreSourceRunId)
    || labMockStrategyRestoreSourceOptions.find((record) => MOCK_HISTORY_COMPARE_STATUSES.has(record.runStatus) && record.compareSupported === true)
    || null;
  const labMockStrategyRestoreCandidate = useMemo(
    () => buildMockStrategyRestoreCandidateUiModel(labMockStrategyRestoreSourceRecord, labMockStrategyRestoreCandidateStatus?.restoreCandidate || {}),
    [labMockStrategyRestoreSourceRecord, labMockStrategyRestoreCandidateStatus],
  );
  const labAiMlStrategyManagementStatus = tradingLabDashboardStatus?.aiMlStrategyManagementStatus || {};
  const labAiMlStrategyRegistry = labAiMlStrategyManagementStatus?.registry || {};
  const labAiMlModels = Array.isArray(labAiMlStrategyRegistry.models) ? labAiMlStrategyRegistry.models : [];
  const labAiMlDatasets = Array.isArray(labAiMlStrategyRegistry.datasets) ? labAiMlStrategyRegistry.datasets : [];
  const labAiMlFeatureSets = Array.isArray(labAiMlStrategyRegistry.featureSets) ? labAiMlStrategyRegistry.featureSets : [];
  const labAiMlEvaluationProfiles = Array.isArray(labAiMlStrategyRegistry.evaluationProfiles) ? labAiMlStrategyRegistry.evaluationProfiles : [];
  const labAiMlLifecycleSummary = Array.isArray(labAiMlStrategyRegistry.lifecycleSummary) ? labAiMlStrategyRegistry.lifecycleSummary : [];
  const labAiMlImplementationContracts = Array.isArray(labAiMlStrategyRegistry.implementationContracts) ? labAiMlStrategyRegistry.implementationContracts : [];
  const labAiMlBlockedOperations = Array.isArray(labAiMlStrategyRegistry.blockedOperations) ? labAiMlStrategyRegistry.blockedOperations : [];
  const labAiMlDatasetArchitectureStatus = tradingLabDashboardStatus?.aiMlDatasetArchitectureStatus || {};
  const labAiMlDatasetArchitecture = labAiMlDatasetArchitectureStatus?.datasetArchitecture || {};
  const labAiMlDatasetFamilies = Array.isArray(labAiMlDatasetArchitecture.datasetFamilies) ? labAiMlDatasetArchitecture.datasetFamilies : [];
  const labAiMlLabelDefinitions = Array.isArray(labAiMlDatasetArchitecture.labelDefinitions) ? labAiMlDatasetArchitecture.labelDefinitions : [];
  const labAiMlFeatureTimestampRules = Array.isArray(labAiMlDatasetArchitecture.featureTimestampRules) ? labAiMlDatasetArchitecture.featureTimestampRules : [];
  const labAiMlSplitPolicies = Array.isArray(labAiMlDatasetArchitecture.splitPolicies) ? labAiMlDatasetArchitecture.splitPolicies : [];
  const labAiMlWalkForwardPolicies = Array.isArray(labAiMlDatasetArchitecture.walkForwardPolicies) ? labAiMlDatasetArchitecture.walkForwardPolicies : [];
  const labAiMlLeakageControls = Array.isArray(labAiMlDatasetArchitecture.leakageControls) ? labAiMlDatasetArchitecture.leakageControls : [];
  const labAiMlDatasetContracts = Array.isArray(labAiMlDatasetArchitecture.implementationContracts) ? labAiMlDatasetArchitecture.implementationContracts : [];
  const labAiMlFeaturePipelineStatus = tradingLabDashboardStatus?.aiMlFeaturePipelineStatus || {};
  const labAiMlFeaturePipeline = labAiMlFeaturePipelineStatus?.featurePipelineArchitecture || {};
  const labAiMlFeatureSources = Array.isArray(labAiMlFeaturePipeline.featureSourceMappings) ? labAiMlFeaturePipeline.featureSourceMappings : [];
  const labAiMlRollingFeatureContracts = Array.isArray(labAiMlFeaturePipeline.rollingFeatureContracts) ? labAiMlFeaturePipeline.rollingFeatureContracts : [];
  const labAiMlFeatureLeakageGuards = Array.isArray(labAiMlFeaturePipeline.leakageGuards) ? labAiMlFeaturePipeline.leakageGuards : [];
  const labAiMlFeatureQualityRules = Array.isArray(labAiMlFeaturePipeline.featureQualityValidation?.rules) ? labAiMlFeaturePipeline.featureQualityValidation.rules : [];
  const labAiMlFeatureStoreConcepts = Array.isArray(labAiMlFeaturePipeline.futureFeatureStoreContract?.concepts) ? labAiMlFeaturePipeline.futureFeatureStoreContract.concepts : [];
  const labAiMlFeatureSafety = labAiMlFeaturePipelineStatus?.blockedConfirmation || {};
  const labAiMlFeaturePreflightStatus = tradingLabDashboardStatus?.aiMlFeaturePipelinePreflightStatus || {};
  const labAiMlFeaturePreflight = labAiMlFeaturePreflightStatus?.preflight || {};
  const labAiMlFeaturePreflightChecks = Array.isArray(labAiMlFeaturePreflight.checkResults) ? labAiMlFeaturePreflight.checkResults : [];
  const labAiMlFeaturePreflightScenarios = Array.isArray(labAiMlFeaturePreflight.scenarioCatalog) ? labAiMlFeaturePreflight.scenarioCatalog : [];
  const labAiMlFeaturePreflightSafety = labAiMlFeaturePreflightStatus?.blockedConfirmation || {};
  const labAiMlReadinessGateSummaryStatus = tradingLabDashboardStatus?.aiMlReadinessGateSummaryStatus || {};
  const labAiMlReadinessGateSummary = labAiMlReadinessGateSummaryStatus?.summary || {};
  const labAiMlReadinessSourceRegistry = labAiMlReadinessGateSummary.sourceRegistry || {};
  const labAiMlReadinessSources = Array.isArray(labAiMlReadinessSourceRegistry.sources) ? labAiMlReadinessSourceRegistry.sources : [];
  const labAiMlReadinessGateResults = Array.isArray(labAiMlReadinessGateSummary.gateResults) ? labAiMlReadinessGateSummary.gateResults : [];
  const labAiMlReadinessCriticalBlockers = Array.isArray(labAiMlReadinessGateSummary.criticalBlockers) ? labAiMlReadinessGateSummary.criticalBlockers : [];
  const labAiMlReadinessSafety = labAiMlReadinessGateSummaryStatus?.blockedConfirmation || {};
  const labAiMlBatchContractReviewStatus = tradingLabDashboardStatus?.aiMlBatchContractReviewStatus || {};
  const labAiMlBatchContractReview = labAiMlBatchContractReviewStatus?.review || {};
  const labAiMlBatchReviewChecks = Array.isArray(labAiMlBatchContractReview.reviewChecks) ? labAiMlBatchContractReview.reviewChecks : [];
  const labAiMlBatchApprovalChecklist = Array.isArray(labAiMlBatchContractReview.approvalChecklist) ? labAiMlBatchContractReview.approvalChecklist : [];
  const labAiMlBatchReviewScenarios = Array.isArray(labAiMlBatchContractReview.scenarioCatalog) ? labAiMlBatchContractReview.scenarioCatalog : [];
  const labAiMlBatchReviewSafety = labAiMlBatchContractReviewStatus?.blockedConfirmation || {};
  const labAiMlDatasetBuildDryRunManifestStatus = tradingLabDashboardStatus?.aiMlDatasetBuildDryRunManifestStatus || {};
  const labAiMlDatasetBuildDryRunManifest = labAiMlDatasetBuildDryRunManifestStatus?.manifest || {};
  const labAiMlDatasetBuildManifestChecks = Array.isArray(labAiMlDatasetBuildDryRunManifest.validationChecks) ? labAiMlDatasetBuildDryRunManifest.validationChecks : [];
  const labAiMlDatasetBuildManifestSections = Array.isArray(labAiMlDatasetBuildDryRunManifest.manifestSections) ? labAiMlDatasetBuildDryRunManifest.manifestSections : [];
  const labAiMlDatasetBuildManifestScenarios = Array.isArray(labAiMlDatasetBuildDryRunManifest.scenarioCatalog) ? labAiMlDatasetBuildDryRunManifest.scenarioCatalog : [];
  const labAiMlDatasetBuildManifestSafety = labAiMlDatasetBuildDryRunManifestStatus?.blockedConfirmation || {};
  const labMockHistoryBlocked = labMockTradingHistoryBrowserStatus?.blockedConfirmation || {};
  useEffect(() => {
    const optionIds = labMockStrategyRestoreSourceOptions.map((record) => record.runId);
    if (mockStrategyRestoreSourceRunId && optionIds.includes(mockStrategyRestoreSourceRunId)) return;
    const nextSource = labMockStrategyRestoreSourceOptions.find((record) => MOCK_HISTORY_COMPARE_STATUSES.has(record.runStatus) && record.compareSupported === true)
      || labMockStrategyRestoreSourceOptions[0]
      || null;
    setMockStrategyRestoreSourceRunId(nextSource?.runId || "");
  }, [labMockStrategyRestoreSourceOptions, mockStrategyRestoreSourceRunId]);
  const updateMockHistoryFilter = (key, value) => {
    setMockHistoryFilters((current) => ({ ...current, [key]: value }));
    setMockHistoryPage(1);
  };
  const toggleMockHistorySelection = (runId) => {
    setMockHistorySelectedRunIds((current) => {
      if (current.includes(runId)) return current.filter((item) => item !== runId);
      if (current.length >= 3) return current;
      return [...current, runId];
    });
  };
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
  const hasMockEquityChartData = labEquityPoints.length > 1 && equitySparklinePoints.length > 0;
  const hasMockReturnChartData = labReturnPoints.length > 1 && cumulativeReturnSparklinePoints.length > 0;
  const hasMockAllocationData = labAllocations.length > 0;
  const detailGroupCount = TRADING_LAB_DETAIL_GROUPS.length;

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
      <div className="tradingSafetyAssessmentShell" data-admin-panel-key="trading-safety-assessment-layout-polish">
        <div className="tradingSafetyAssessmentHeader">
          <div>
            <span>거래 안전상태 요약</span>
            <h2>거래 안전평가</h2>
            <p>
              이 화면은 관리자 전용 안전상태 평가입니다. 실제 거래는 차단되어 있으며 KIS 호출, 주문 제출, DB 변경, 일반 사용자 화면 노출은 모두 막혀 있습니다.
            </p>
          </div>
          <strong className={`tradingReadinessBadge ${loadState}`}>{formatStatus(readiness?.status || loadState)}</strong>
        </div>

        <div className="tradingSafetyNoticeChips" aria-label="거래 안전평가 차단 상태 요약">
          <span>실제 거래 차단</span>
          <span>KIS 호출 차단</span>
          <span>주문 제출 차단</span>
          <span>DB 변경 차단</span>
          <span>일반 사용자 화면 미노출</span>
          <span>오류 시 자동 차단</span>
        </div>

        <div className="tradingSafetyStatusCards" aria-label="거래 안전평가 핵심 상태 카드">
          <article>
            <span>모드</span>
            <strong>{formatStatus(readiness?.tradingMode || "mock")}</strong>
            <p>모의·dry-run·shadow 상태만 표시합니다.</p>
          </article>
          <article>
            <span>비상 차단</span>
            <strong>{formatStatus(readiness?.killSwitch?.status || "blocked")}</strong>
            <p>{readiness?.killSwitch?.enabled === false ? "해제 여부 검토 필요" : "차단 상태 유지"}</p>
          </article>
          <article>
            <span>허용 종목</span>
            <strong>{Number(readiness?.allowedSymbols?.count || 0)}개</strong>
            <p>{formatStatus(readiness?.allowedSymbols?.status || "blocked")} 상태입니다.</p>
          </article>
          <article>
            <span>차단 사유</span>
            <strong>{blockerCount}</strong>
            <p>오류 시 자동 차단 평가 활성</p>
          </article>
        </div>

        <div className="tradingSafetyFlagBadgeGrid" aria-label="거래 안전평가 차단 항목">
          {FLAG_LABELS.map(([key, label]) => (
            <div key={key} className="tradingSafetyFlagBadge">
              <span>{label}</span>
              <strong className={statusClass(flags[key])}>{boolStatus(flags[key])}</strong>
            </div>
          ))}
        </div>

        <div className="tradingSafetyAuditEmptyState" role="note">
          <span>최근 감사 이벤트</span>
          <strong>{formatStatus(readiness?.lastAuditEvent?.status || "placeholder_only")}</strong>
          <p>실제 거래 감사 이벤트는 아직 발생하지 않았습니다.</p>
          <p>현재 화면은 관리자 전용 안전상태 평가입니다.</p>
        </div>
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

        <div className="tradingLabConsolidatedSafetyNotice" data-admin-panel-key="trading-lab-dashboard-section-consolidation">
          <p>
            이 화면은 FINPLE 내부 mock trading lab입니다. 실제 KIS 호출, 주문 제출, 실계좌 잔고 조회, DB write를 수행하지 않습니다.
          </p>
          <div className="tradingLabSafetyBadges tradingLabConsolidatedBadges" aria-label="모의 운용 대시보드 안전 배지">
            <span>모의 전용</span>
            <span>관리자 전용</span>
            <span>차단 유지</span>
            <span>KIS 호출 없음</span>
            <span>주문 제출 없음</span>
            <span>DB 저장 없음</span>
          </div>
        </div>

        <div className="tradingLabSmokePreflightSummary" data-admin-panel-key="trading-lab-smoke-test-preflight">
          <div>
            <span>smoke test preflight</span>
            <strong>관리자 화면 표시 안정성 점검</strong>
            <p>
              이 점검은 `/admin/trading` 화면 표시와 기존 Step169 admin-only 상태 재사용만 확인합니다. KIS/provider 호출, 주문 제출, DB write, 실제 계좌 조회는 수행하지 않습니다.
            </p>
          </div>
          <ul aria-label="관리자 trading lab smoke test preflight 결과">
            {TRADING_LAB_SMOKE_PREFLIGHT_ITEMS.map((item) => (
              <li key={item.key}>
                <span>{item.label}</span>
                <strong>{item.status}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="tradingLabSmokeReviewResult" data-admin-panel-key="trading-lab-smoke-preflight-review-result">
          <div>
            <span>smoke preflight review result</span>
            <strong>관리자 거래 실험실 smoke 검토 결과</strong>
            <p>
              Step171 smoke preflight를 read-only 검토 결과로 요약합니다. 새 endpoint 없이 기존 Step169/admin readiness data와 Step171 화면 점검 결과를 재사용하며, KIS/provider 호출·주문 제출·DB write는 계속 차단됩니다.
            </p>
          </div>
          <div className="tradingLabSmokeReviewCards" aria-label="관리자 거래 실험실 smoke 검토 결과 요약">
            <article>
              <span>표시 상태</span>
              <strong>정상 표시</strong>
              <small>모의 운용 대시보드 · 거래 안전평가</small>
            </article>
            <article>
              <span>badge regression</span>
              <strong>정상</strong>
              <small>각 badge 구분 표시</small>
            </article>
            <article>
              <span>provider/order/live gate</span>
              <strong>차단 유지</strong>
              <small>실거래 준비 상태: 차단 유지</small>
            </article>
            <article>
              <span>next cleanup</span>
              <strong>추가 정리 필요 없음</strong>
              <small>상세 이력은 접힘 유지</small>
            </article>
          </div>
          <ul aria-label="관리자 거래 실험실 smoke 검토 세부 결과">
            {TRADING_LAB_SMOKE_REVIEW_RESULT_ITEMS.map((item) => (
              <li key={item.key}>
                <span>{item.label}</span>
                <strong>{item.result}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="tradingLabFinalStabilizationSummary" data-admin-panel-key="trading-lab-final-stabilization-deployment-metadata-notice">
          <div>
            <span>final stabilization</span>
            <strong>관리자 거래 실험실 최종 안정화 상태</strong>
            <p>
              Step169/admin readiness data와 Step171~172 smoke review 결과를 재사용해 내부 mock trading lab 1차 안정화 상태를 read-only로 정리합니다. 새 endpoint는 추가하지 않으며, KIS/provider 호출·주문 제출·DB write·live readiness는 계속 차단됩니다.
            </p>
          </div>
          <div className="tradingLabDeploymentMetadataNotice" aria-label="배포 metadata 점검">
            <article>
              <span>배포 metadata 점검</span>
              <strong>Render health commit metadata stale 가능</strong>
              <p>
                Render API/DB health 자체가 정상이어도 health endpoint의 commit metadata가 최신 GitHub main과 다를 수 있습니다. 이 상태는 단순 notice이며 실거래 준비, provider 호출, 주문 권한, DB 권한을 여는 근거가 아닙니다.
              </p>
            </article>
            <article>
              <span>운영 상태 분리</span>
              <strong>GitHub/Vercel/Render health 별도 확인</strong>
              <p>
                실제 배포 판단은 GitHub commit status, Vercel production response, Render API health, Render DB health를 분리해서 확인합니다. metadata stale은 health 실패와 구분해서 표시합니다.
              </p>
            </article>
          </div>
          <div className="tradingLabFinalStabilizationCards" aria-label="관리자 거래 실험실 최종 안정화 요약">
            <article>
              <span>Smoke review history</span>
              <strong>Step169~Step173 흐름 유지</strong>
              <small>기존 admin readiness data와 smoke review UI/check 재사용</small>
            </article>
            <article>
              <span>badge/header/detail log</span>
              <strong>regression 방지</strong>
              <small>badge 분리, header artifact fix, 상세 로그 접힘 유지</small>
            </article>
            <article>
              <span>public surface</span>
              <strong>미노출 유지</strong>
              <small>My Page·homepage trading UI 없음</small>
            </article>
            <article>
              <span>provider/order/live</span>
              <strong>차단 유지</strong>
              <small>readiness/provider/order/live flags false 유지</small>
            </article>
          </div>
          <div className="tradingLabFinalStabilizationLists">
            <section aria-label="최종 안정화 세부 상태">
              <span>내부 mock trading lab 1차 완료 전 점검</span>
              <ul>
                {TRADING_LAB_FINAL_STABILIZATION_ITEMS.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="배포 metadata notice 세부 상태">
              <span>배포 metadata notice</span>
              <ul>
                {TRADING_LAB_DEPLOYMENT_METADATA_NOTICE_ITEMS.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="smoke review history 세부 상태">
              <span>Smoke review history</span>
              <ul>
                {TRADING_LAB_SMOKE_REVIEW_HISTORY_ITEMS.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="tradingLabMvpHandoffSummary" data-admin-panel-key="trading-lab-mvp-completion-handoff-summary">
          <div>
            <span>MVP completion handoff</span>
            <strong>내부 mock trading lab 1차 완료 요약</strong>
            <p>
              Step116~Step173까지의 관리자 전용 mock trading lab 범위를 handoff summary로 정리합니다. 이 요약은 read-only이며 새 endpoint, provider 호출, 주문 제출, DB write, 사용자 공개 trading UI를 만들지 않습니다.
            </p>
          </div>
          <div className="tradingLabMvpHandoffCards" aria-label="관리자 거래 실험실 handoff summary">
            <article>
              <span>handoffSummaryId</span>
              <strong>admin-mock-trading-lab-step174</strong>
              <small>redacted deterministic UI summary</small>
            </article>
            <article>
              <span>mvpStatus</span>
              <strong>internal_mock_mvp_ready_for_final_review</strong>
              <small>실거래 준비 완료가 아님</small>
            </article>
            <article>
              <span>safety boundary</span>
              <strong>admin-only · mock-only · fail-closed</strong>
              <small>provider/order/live gate 차단 유지</small>
            </article>
            <article>
              <span>legacy check notice</span>
              <strong>check runner 정리 필요</strong>
              <small>전체 node --test 통과와 개별 shell timeout 가능성을 분리 기록</small>
            </article>
          </div>
          <div className="tradingLabMvpHandoffNotice" aria-label="MVP handoff 운영 이슈">
            <article>
              <span>Render metadata stale notice</span>
              <strong>운영 점검 항목으로 분리</strong>
              <p>
                Render API/DB health는 정상이어도 health endpoint commit metadata가 최신 GitHub main과 다를 수 있습니다. 이는 provider/order/live readiness를 여는 근거가 아니며 운영 metadata 점검 항목입니다.
              </p>
            </article>
            <article>
              <span>Legacy check timeout notice</span>
              <strong>pass log와 command timeout을 분리 기록</strong>
              <p>
                일부 legacy trading check script는 개별 shell에서 pass log를 출력한 뒤 무거운 service test runner 종료 문제로 timeout 가능성이 있습니다. 전체 node --test 통과 상태와 별도로, 향후 check runner 정리 또는 smoke bundle 단순화가 필요합니다.
              </p>
            </article>
          </div>
          <div className="tradingLabMvpHandoffLists">
            <section aria-label="구현 완료 범위">
              <span>구현 완료 범위</span>
              <ul>
                {TRADING_LAB_MVP_HANDOFF_IMPLEMENTED_AREAS.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="아직 구현하지 않은 범위">
              <span>아직 구현하지 않은 범위</span>
              <ul>
                {TRADING_LAB_MVP_HANDOFF_EXCLUDED_AREAS.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="다음 개발 갈림길">
              <span>다음 개발 갈림길</span>
              <ul>
                {TRADING_LAB_MVP_HANDOFF_REMAINING_TRACKS.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="현재 readiness 상태">
              <span>현재 readiness 상태</span>
              <ul>
                {TRADING_LAB_MVP_HANDOFF_READINESS_FLAGS.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="handoff status model">
              <span>handoff status model</span>
              <ul>
                {TRADING_LAB_MVP_HANDOFF_NOTICE_ITEMS.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="tradingLabMvpFinalReviewSummary" data-admin-panel-key="trading-lab-mvp-final-review">
          <div>
            <span>MVP final review</span>
            <strong>내부 mock trading lab 1차 MVP 최종 검토</strong>
            <p>
              Step116~Step174 범위의 관리자 전용 mock trading lab을 최종 검토용 read-only 요약으로 정리합니다. 이 영역은 새 endpoint, provider 호출, 주문 제출, 체결 생성, DB write, 사용자 공개 trading UI를 만들지 않습니다.
            </p>
          </div>
          <div className="tradingLabMvpFinalReviewCards" aria-label="MVP final review status">
            {TRADING_LAB_MVP_FINAL_REVIEW_STATUS_ITEMS.map((item) => (
              <article key={item.key}>
                <span>{item.label}</span>
                <strong>{item.result}</strong>
              </article>
            ))}
          </div>
          <div className="tradingLabMvpFinalReviewNotice" aria-label="MVP final review safety notice">
            <article>
              <span>Final review decision</span>
              <strong>internal_mock_mvp_final_review_ready</strong>
              <p>
                이 결과는 FINPLE 내부 mock trading lab MVP 검토 상태만 표시하며, 실제 주문 권한·KIS 호출·실거래 준비 상태에는 영향을 주지 않습니다.
              </p>
            </article>
            <article>
              <span>Operational blocker separation</span>
              <strong>order authority external blocker 유지</strong>
              <p>
                내부 mock UI와 검증 흐름은 정리되었지만, 외부 주문 권한 승인/증빙과 provider/order/live 운영 gate는 별도이며 계속 차단 상태입니다.
              </p>
            </article>
          </div>
          <div className="tradingLabMvpFinalReviewLists">
            <section aria-label="MVP final review completed scope">
              <span>completed scope</span>
              <ul>
                {TRADING_LAB_MVP_FINAL_REVIEW_COMPLETED_SCOPE.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="MVP final review excluded scope">
              <span>excluded scope</span>
              <ul>
                {TRADING_LAB_MVP_FINAL_REVIEW_EXCLUDED_SCOPE.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="MVP final review known issues">
              <span>known issues</span>
              <ul>
                {TRADING_LAB_MVP_FINAL_REVIEW_KNOWN_ISSUES.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="MVP final review next sprint options">
              <span>next sprint options</span>
              <ul>
                {TRADING_LAB_MVP_FINAL_REVIEW_NEXT_SPRINT_OPTIONS.map((item) => (
                  <li key={item.key}>
                    <span>{item.label}</span>
                    <strong>{item.result}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="tradingLabDbHistoryPreflightSummary" data-admin-panel-key="trading-lab-db-backed-mock-trading-history-preflight">
          <div>
            <span>DB-backed mock trading history preflight</span>
            <strong>DB-backed mock trading history 사전검토</strong>
            <p>
              /admin/trading 내부 mock trading lab 결과를 향후 DB에 저장하기 위한 후보 schema draft만 확인합니다. 이번 단계는 DB migration, DB schema 변경, Supabase insert/update/delete, persistent DB write를 수행하지 않습니다.
            </p>
          </div>
          <div className="tradingLabDbHistoryStatusGrid" aria-label="DB-backed mock trading history preflight status">
            <article>
              <span>preflight status</span>
              <strong>{formatStatus(labDbBackedMockTradingHistoryPreflight.status || "blocked")}</strong>
            </article>
            <article>
              <span>candidate tables</span>
              <strong>{labDbBackedMockTradingHistoryPreflight.candidateCount ?? labDbBackedMockTradingHistoryTables.length}</strong>
            </article>
            <article>
              <span>DB write</span>
              <strong>{formatStatus(labDbBackedMockTradingHistoryPreflight.dbWriteStatus || "blocked")}</strong>
            </article>
            <article>
              <span>next allowed step</span>
              <strong>{formatStatus(labDbBackedMockTradingHistoryPreflight.nextAllowedStep || "db_backed_mock_trading_history_review")}</strong>
            </article>
          </div>
          <div className="tradingLabDbHistoryLists">
            <section aria-label="mock trading history candidate schema draft">
              <span>저장 후보 schema draft</span>
              <ul>
                {labDbBackedMockTradingHistoryTables.map((table) => (
                  <li key={table.tableName}>
                    <span>{table.candidate}</span>
                    <strong>{table.tableName}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="mock trading history forbidden values">
              <span>저장 금지 항목</span>
              <ul>
                {labDbBackedMockTradingHistoryForbidden.map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <strong>blocked</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="mock trading history migration readiness checklist">
              <span>migration readiness checklist</span>
              <ul>
                {labDbBackedMockTradingHistoryChecklistItems.map((item) => (
                  <li key={item.key}>
                    <span>{item.key}</span>
                    <strong>{formatStatus(item.status || "blocked")}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="tradingLabDbHistoryNotice" aria-label="DB write blocked confirmation">
            <article>
              <span>DB write blocked confirmation</span>
              <strong>{labDbBackedMockTradingHistoryDbWrite.dbWriteAttempted === false ? "db_write_attempted_false" : "blocked"}</strong>
              <p>provider/order/live readiness 영향 없음 · DB migration 없음 · persistent DB write 없음 · 실제 계좌/체결/주문 식별자 저장 없음</p>
            </article>
          </div>
        </div>

        <div className="tradingLabDbHistoryReviewSummary" data-admin-panel-key="trading-lab-db-backed-mock-trading-history-review-result">
          <div>
            <span>DB-backed mock trading history review result</span>
            <strong>DB 저장형 mock trading history 검토 결과</strong>
            <p>
              이 검토 결과는 DB migration 전 사전검토이며 실제 DB 저장을 수행하지 않습니다. 현재 mock trading history 저장 후보만 검토되고, Supabase insert/update/delete는 차단되어 있습니다.
            </p>
          </div>
          <div className="tradingLabDbHistoryReviewStatusGrid" aria-label="DB-backed mock trading history review result status">
            <article>
              <span>review status</span>
              <strong>{formatStatus(labDbBackedMockTradingHistoryReviewResult.reviewStatus || "blocked")}</strong>
            </article>
            <article>
              <span>candidate schema review</span>
              <strong>{labDbBackedMockTradingHistoryCandidateReview.approvedCandidateSchemaCount ?? 0}/{labDbBackedMockTradingHistoryCandidateReview.candidateSchemaCount ?? 0}</strong>
            </article>
            <article>
              <span>DB write</span>
              <strong>{formatStatus(labDbBackedMockTradingHistoryReviewReceipt.dbWriteStatus || "blocked")}</strong>
            </article>
            <article>
              <span>next allowed step</span>
              <strong>{formatStatus(labDbBackedMockTradingHistoryReviewReceipt.nextAllowedStep || "db_backed_mock_trading_history_migration_preflight")}</strong>
            </article>
          </div>
          <div className="tradingLabDbHistoryReviewLists">
            <section aria-label="DB-backed mock trading history review receipt summary">
              <span>redacted review receipt</span>
              <ul>
                <li>
                  <span>decision</span>
                  <strong>{formatStatus(labDbBackedMockTradingHistoryReviewReceipt.decision || "blocked")}</strong>
                </li>
                <li>
                  <span>redacted</span>
                  <strong>{labDbBackedMockTradingHistoryReviewReceipt.redacted === true ? "true" : "blocked"}</strong>
                </li>
                <li>
                  <span>migration readiness</span>
                  <strong>{formatStatus(labDbBackedMockTradingHistoryReviewReceipt.migrationReadinessStatus || "not_ready_for_migration")}</strong>
                </li>
              </ul>
            </section>
            <section aria-label="DB-backed mock trading history candidate schema review">
              <span>저장 후보 schema 검토</span>
              <ul>
                {labDbBackedMockTradingHistoryReviewSummary.map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <strong>reviewed</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="DB-backed mock trading history redaction policy review">
              <span>저장 금지 항목 검토</span>
              <ul>
                {labDbBackedMockTradingHistoryReviewForbidden.slice(0, 8).map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <strong>blocked</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="tradingLabDbHistoryReviewLists">
            <section aria-label="DB-backed mock trading history migration readiness review">
              <span>migration readiness review</span>
              <ul>
                <li>
                  <span>dbMigrationAllowed</span>
                  <strong>{labDbBackedMockTradingHistoryMigrationReview.dbMigrationAllowed === false ? "false" : "blocked"}</strong>
                </li>
                <li>
                  <span>dbSchemaChanged</span>
                  <strong>{labDbBackedMockTradingHistoryMigrationReview.dbSchemaChanged === false ? "false" : "blocked"}</strong>
                </li>
                <li>
                  <span>migrationFileCreated</span>
                  <strong>{labDbBackedMockTradingHistoryMigrationReview.migrationFileCreated === false ? "false" : "blocked"}</strong>
                </li>
              </ul>
            </section>
            <section aria-label="DB-backed mock trading history blocker summary">
              <span>blocker summary</span>
              <ul>
                {(labDbBackedMockTradingHistoryReviewBlockers.length > 0 ? labDbBackedMockTradingHistoryReviewBlockers : ["no_review_blocker_detected"]).map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <strong>{labDbBackedMockTradingHistoryReviewBlockers.length > 0 ? "blocked" : "clear"}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="DB-backed mock trading history warning summary">
              <span>warning summary</span>
              <ul>
                {labDbBackedMockTradingHistoryReviewWarnings.map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <strong>warning</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="tradingLabDbHistoryReviewNotice" aria-label="DB-backed mock trading history review blocked confirmation">
            <article>
              <span>DB write blocked confirmation</span>
              <strong>{labDbBackedMockTradingHistoryReviewValidation.dbWriteStatus || "blocked"}</strong>
              <p>DB schema 변경 없음 · DB migration 없음 · persistent DB write 없음 · Supabase mutation 없음 · provider/order/live readiness 영향 없음</p>
            </article>
          </div>
        </div>

        <div className="tradingLabDbHistoryMigrationPreflightSummary" data-admin-panel-key="trading-lab-db-backed-mock-trading-history-migration-preflight">
          <div>
            <span>DB-backed mock trading history migration preflight</span>
            <strong>DB 저장형 mock trading history migration 사전검토</strong>
            <p>
              이 단계는 migration 후보 검토이며 실제 DB schema를 변경하지 않습니다. SQL migration 파일은 아직 생성하지 않았고, Supabase insert/update/delete는 계속 차단되어 있습니다.
            </p>
          </div>
          <div className="tradingLabDbHistoryMigrationStatusGrid" aria-label="DB-backed mock trading history migration preflight status">
            <article>
              <span>migration status</span>
              <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationPreflight.migrationStatus || "blocked")}</strong>
            </article>
            <article>
              <span>candidate tables</span>
              <strong>{labDbBackedMockTradingHistoryMigrationTableSummary.tableCount ?? labDbBackedMockTradingHistoryMigrationTables.length}</strong>
            </article>
            <article>
              <span>index / constraint / RLS</span>
              <strong>{labDbBackedMockTradingHistoryMigrationPolicySummary.indexCount ?? 0}/{labDbBackedMockTradingHistoryMigrationPolicySummary.constraintCount ?? 0}/{labDbBackedMockTradingHistoryMigrationPolicySummary.rlsPolicyCount ?? 0}</strong>
            </article>
            <article>
              <span>next allowed step</span>
              <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationPreflight.nextAllowedStep || "db_backed_mock_trading_history_migration_review_result")}</strong>
            </article>
          </div>
          <div className="tradingLabDbHistoryMigrationLists">
            <section aria-label="DB-backed mock trading history migration candidate table draft">
              <span>Migration 후보 table 검토</span>
              <ul>
                {labDbBackedMockTradingHistoryMigrationTables.map((table) => (
                  <li key={table.tableName}>
                    <span>{table.tableName}</span>
                    <strong>{formatStatus(table.purpose || "draft_only")}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="DB-backed mock trading history migration checklist">
              <span>migration readiness checklist</span>
              <ul>
                {labDbBackedMockTradingHistoryMigrationChecklistItems.slice(0, 7).map((item) => (
                  <li key={item.key}>
                    <span>{item.key}</span>
                    <strong>{formatStatus(item.status || "blocked")}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="DB-backed mock trading history migration policy draft">
              <span>DDL draft 검토</span>
              <ul>
                <li>
                  <span>DB schema 변경 허용</span>
                  <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationPreflight.schemaChangeStatus || "blocked")}</strong>
                </li>
                <li>
                  <span>admin-only access policy 후보</span>
                  <strong>{labDbBackedMockTradingHistoryMigrationPolicySummary.adminOnlyAccessPolicyDrafted === true ? "draft_only" : "blocked"}</strong>
                </li>
                <li>
                  <span>public/user-facing access</span>
                  <strong>{labDbBackedMockTradingHistoryMigrationPolicySummary.publicAccessBlocked === true ? "blocked" : "blocked"}</strong>
                </li>
              </ul>
            </section>
          </div>
          <div className="tradingLabDbHistoryMigrationLists">
            <section aria-label="DB-backed mock trading history migration blocker summary">
              <span>blocker summary</span>
              <ul>
                {(labDbBackedMockTradingHistoryMigrationBlockers.length > 0 ? labDbBackedMockTradingHistoryMigrationBlockers : ["no_migration_preflight_blocker_detected"]).map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <strong>{labDbBackedMockTradingHistoryMigrationBlockers.length > 0 ? "blocked" : "clear"}</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="DB-backed mock trading history migration warning summary">
              <span>warning summary</span>
              <ul>
                {labDbBackedMockTradingHistoryMigrationWarnings.map((item) => (
                  <li key={item}>
                    <span>{item}</span>
                    <strong>warning</strong>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="DB-backed mock trading history migration blocked confirmation">
              <span>DB schema 변경 여부</span>
              <ul>
                <li>
                  <span>migrationFileCreated</span>
                  <strong>{labDbBackedMockTradingHistoryMigrationPreflight.migrationFileCreated === false ? "false" : "blocked"}</strong>
                </li>
                <li>
                  <span>sqlFileCreated</span>
                  <strong>{labDbBackedMockTradingHistoryMigrationPreflight.sqlFileCreated === false ? "false" : "blocked"}</strong>
                </li>
                <li>
                  <span>persistentDbWriteAttempted</span>
                  <strong>{labDbBackedMockTradingHistoryMigrationPreflight.persistentDbWriteAttempted === false ? "false" : "blocked"}</strong>
                </li>
              </ul>
            </section>
          </div>
          <div className="tradingLabDbHistoryMigrationNotice" aria-label="DB-backed mock trading history migration preflight blocked confirmation">
            <article>
              <span>DB migration blocked confirmation</span>
              <strong>{labDbBackedMockTradingHistoryMigrationValidation.schemaChangeStatus || "blocked"}</strong>
              <p>SQL 파일 생성 없음 · Supabase migration 생성 없음 · DB migration 실행 없음 · DB schema 변경 없음 · persistent DB write 없음 · 다음 허용 단계: migration review result</p>
            </article>
          </div>
        </div>

        <details className="tradingLabDbHistoryMigrationReviewDetails" data-admin-panel-key="trading-lab-db-backed-mock-trading-history-migration-review-result">
          <summary>
            <span>Migration 후보 검토 결과</span>
            <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewResult.reviewStatus || "blocked")}</strong>
            <em>{labDbBackedMockTradingHistoryMigrationReviewReceipt.candidateTableCount ?? 0} tables · DB write blocked</em>
          </summary>
          <div className="tradingLabDbHistoryMigrationReviewBody">
            <div className="tradingLabDbHistoryMigrationReviewStatusGrid" aria-label="DB schema change preflight review receipt">
              <article>
                <span>decision</span>
                <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewResult.decision || "blocked")}</strong>
              </article>
              <article>
                <span>DDL draft</span>
                <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewReceipt.ddlDraftStatus || "reviewed_not_created")}</strong>
              </article>
              <article>
                <span>migration file</span>
                <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewReceipt.migrationFileStatus || "not_created")}</strong>
              </article>
              <article>
                <span>SQL file</span>
                <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewReceipt.sqlFileStatus || "not_created")}</strong>
              </article>
              <article>
                <span>DB migration</span>
                <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewReceipt.dbMigrationStatus || "blocked")}</strong>
              </article>
              <article>
                <span>Supabase mutation</span>
                <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewReceipt.supabaseMutationStatus || "blocked")}</strong>
              </article>
            </div>
            <p className="tradingLabDbHistoryMigrationReviewNotice">
              이 검토 결과는 migration 후보 draft에 대한 검토이며 실제 SQL 또는 DB 변경을 수행하지 않습니다. Migration 파일과 SQL 파일은 아직 생성되지 않았습니다. DB migration, schema 변경, Supabase mutation은 계속 차단되어 있습니다. 다음 허용 단계: SQL draft 사전검토
            </p>
            <div className="tradingLabDbHistoryMigrationReviewLists">
              <section aria-label="DB-backed mock trading history migration table review result">
                <span>DB schema 변경 전 검토 receipt</span>
                <ul>
                  {labDbBackedMockTradingHistoryMigrationReviewTables.map((table) => (
                    <li key={table.tableName}>
                      <span>{table.tableName}</span>
                      <strong>{formatStatus(table.reviewDecision || "blocked")}</strong>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label="DB-backed mock trading history migration policy review result">
                <span>DDL draft 검토 결과</span>
                <ul>
                  <li>
                    <span>index review</span>
                    <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewSummary.indexReviewSummary?.status || "reviewed_not_created")}</strong>
                  </li>
                  <li>
                    <span>constraint review</span>
                    <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewSummary.constraintReviewSummary?.status || "reviewed_not_created")}</strong>
                  </li>
                  <li>
                    <span>admin-only RLS review</span>
                    <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewSummary.rlsReviewSummary?.status || "admin_only_draft_not_applied")}</strong>
                  </li>
                  <li>
                    <span>redaction policy review</span>
                    <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewSummary.redactionReviewSummary?.status || "reviewed_redacted")}</strong>
                  </li>
                </ul>
              </section>
              <section aria-label="DB-backed mock trading history migration review blockers and warnings">
                <span>review guard summary</span>
                <ul>
                  <li>
                    <span>blockers</span>
                    <strong>{labDbBackedMockTradingHistoryMigrationReviewBlockers.length}</strong>
                  </li>
                  <li>
                    <span>warnings</span>
                    <strong>{labDbBackedMockTradingHistoryMigrationReviewWarnings.length}</strong>
                  </li>
                  <li>
                    <span>readiness impact</span>
                    <strong>{formatStatus(labDbBackedMockTradingHistoryMigrationReviewReceipt.readinessImpact || "none")}</strong>
                  </li>
                  <li>
                    <span>provider/order/live impact</span>
                    <strong>{formatStatus(`${labDbBackedMockTradingHistoryMigrationReviewReceipt.providerCallImpact || "blocked"}_${labDbBackedMockTradingHistoryMigrationReviewReceipt.orderSubmissionImpact || "blocked"}_${labDbBackedMockTradingHistoryMigrationReviewReceipt.liveTradingImpact || "blocked"}`)}</strong>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </details>

        <details className="tradingLabPersistenceArchitectureDetails" data-admin-panel-key="mock-trading-history-persistence-architecture">
          <summary>
            <span>Mock trading history persistence architecture</span>
            <strong>{formatStatus(labMockTradingHistoryPersistenceArchitecture.status || "blocked")}</strong>
            <em>{labMockTradingHistoryPersistenceDomains.length} domains · architecture only</em>
          </summary>
          <div className="tradingLabPersistenceArchitectureBody">
            <div className="tradingLabPersistenceArchitectureStatusGrid" aria-label="mock trading history persistence architecture status">
              <article>
                <span>architecture mode</span>
                <strong>{formatStatus(labMockTradingHistoryPersistenceArchitecture.architectureMode || "architecture_only")}</strong>
              </article>
              <article>
                <span>storage intent</span>
                <strong>{formatStatus(labMockTradingHistoryPersistenceArchitecture.persistenceIntent || "future_supabase_postgres_storage")}</strong>
              </article>
              <article>
                <span>DB migration</span>
                <strong>{formatStatus(labMockTradingHistoryPersistenceArchitecture.dbMigrationDecision?.status || "not_ready_for_migration")}</strong>
              </article>
              <article>
                <span>DB write</span>
                <strong>{labMockTradingHistoryPersistenceBlocked.persistentDbWriteAttempted === false ? "blocked" : "blocked"}</strong>
              </article>
              <article>
                <span>public UI</span>
                <strong>{labMockTradingHistoryPersistenceBlocked.publicUiExposed === false ? "blocked" : "blocked"}</strong>
              </article>
              <article>
                <span>next contract</span>
                <strong>{formatStatus(labMockTradingHistoryPersistenceArchitecture.dbMigrationDecision?.nextAllowedStep || "db_backed_mock_trading_history_sql_draft_preflight")}</strong>
              </article>
            </div>
            <p className="tradingLabPersistenceArchitectureNotice">
              이 섹션은 FINPLE 내부 mock trading lab history를 향후 저장, 조회, 비교, 복원하기 위한 architecture decision입니다. SQL 파일, migration 파일, DB schema 변경, Supabase mutation, persistent DB write는 수행하지 않습니다.
            </p>
            <div className="tradingLabPersistenceArchitectureLists">
              <section aria-label="mock trading history persistence storage domains">
                <span>저장 도메인 구조</span>
                <ul>
                  {labMockTradingHistoryPersistenceDomains.map((domain) => (
                    <li key={domain.domainId}>
                      <span>{domain.domainId}</span>
                      <strong>{domain.entityNames?.join(" / ")}</strong>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label="mock trading history persistence entity relationship">
                <span>entity relationship</span>
                <ul>
                  {labMockTradingHistoryPersistenceRelationshipTree.map((item) => (
                    <li key={item}>
                      <span>{item}</span>
                      <strong>mock_only</strong>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label="mock trading history persistence step contracts">
                <span>Step187-190 구현 계약</span>
                <ul>
                  {labMockTradingHistoryPersistenceContracts.map((contract) => (
                    <li key={contract.contractId}>
                      <span>{contract.step}</span>
                      <strong>{formatStatus(contract.contractId)}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <div className="tradingLabPersistenceArchitectureLists">
              <section aria-label="mock trading history snapshot and lifecycle architecture">
                <span>snapshot / lifecycle</span>
                <ul>
                  <li>
                    <span>strategy draft vs immutable version</span>
                    <strong>{labMockTradingHistoryPersistenceArchitecture.snapshotVersioningStrategy?.strategyVersioning?.mutableDraftEntity || "StrategyPreset"} / {labMockTradingHistoryPersistenceArchitecture.snapshotVersioningStrategy?.strategyVersioning?.immutableExecutionEntity || "StrategyVersion"}</strong>
                  </li>
                  <li>
                    <span>history writes enabled now</span>
                    <strong>{labMockTradingHistoryPersistenceArchitecture.historyLifecycle?.writesEnabledNow === false ? "false" : "blocked"}</strong>
                  </li>
                  <li>
                    <span>checksum / fingerprint</span>
                    <strong>placeholder only</strong>
                  </li>
                </ul>
              </section>
              <section aria-label="mock trading history browser compare restore contract">
                <span>browser / compare / restore</span>
                <ul>
                  <li>
                    <span>history browser primary row</span>
                    <strong>{labMockTradingHistoryPersistenceArchitecture.browserCompareRestoreContract?.browser?.primaryRowEntity || "MockTradingRun"}</strong>
                  </li>
                  <li>
                    <span>restore behavior</span>
                    <strong>{labMockTradingHistoryPersistenceArchitecture.browserCompareRestoreContract?.restore?.restoreCreatesNewMockDraftOnly === true ? "new_mock_draft_only" : "blocked"}</strong>
                  </li>
                  <li>
                    <span>actual trading restore</span>
                    <strong>{labMockTradingHistoryPersistenceArchitecture.browserCompareRestoreContract?.restore?.actualTradingRunRestoreBlocked === true ? "blocked" : "blocked"}</strong>
                  </li>
                </ul>
              </section>
              <section aria-label="mock trading history retention redaction architecture">
                <span>retention / redaction</span>
                <ul>
                  <li>
                    <span>credential / token / account identifier</span>
                    <strong>excluded</strong>
                  </li>
                  <li>
                    <span>provider raw response / order payload</span>
                    <strong>excluded</strong>
                  </li>
                  <li>
                    <span>blockers / warnings</span>
                    <strong>{labMockTradingHistoryPersistenceValidation.blockerCount ?? 0} / {labMockTradingHistoryPersistenceValidation.warningCount ?? 0}</strong>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </details>

        <details className="tradingLabPersistenceArchitectureDetails" data-admin-panel-key="mock-trading-history-supabase-schema-draft">
          <summary>
            <span>Mock trading history Supabase schema draft</span>
            <strong>{formatStatus(labMockTradingHistorySupabaseSchemaDraft.status || "blocked")}</strong>
            <em>{labMockTradingHistorySupabaseTables.length} tables - draft only</em>
          </summary>
          <div className="tradingLabPersistenceArchitectureBody">
            <div className="tradingLabPersistenceArchitectureStatusGrid" aria-label="mock trading history Supabase schema draft status">
              <article>
                <span>database / platform</span>
                <strong>{formatStatus(`${labMockTradingHistorySupabaseSchemaDraft.database || "postgres"}_${labMockTradingHistorySupabaseSchemaDraft.platform || "supabase"}`)}</strong>
              </article>
              <article>
                <span>schema version</span>
                <strong>{formatStatus(labMockTradingHistorySupabaseSchemaDraft.schemaVersion || "draft_v1")}</strong>
              </article>
              <article>
                <span>SQL file</span>
                <strong>{labMockTradingHistorySupabaseBlocked.sqlFileCreated === false ? "none" : "blocked"}</strong>
              </article>
              <article>
                <span>migration</span>
                <strong>{labMockTradingHistorySupabaseBlocked.migrationFileCreated === false ? "blocked" : "blocked"}</strong>
              </article>
              <article>
                <span>DB write</span>
                <strong>{labMockTradingHistorySupabaseBlocked.persistentDbWriteAttempted === false ? "blocked" : "blocked"}</strong>
              </article>
              <article>
                <span>next step</span>
                <strong>{formatStatus(labMockTradingHistorySupabaseSchemaDraft.nextImplementationStep || "mock_trading_history_browser_ui")}</strong>
              </article>
            </div>
            <p className="tradingLabPersistenceArchitectureNotice">
              This schema draft describes table, column, relationship, index, constraint, RLS, retention, and query-contract candidates only. It does not create SQL files, migration files, DB schema changes, Supabase mutations, or persistent DB writes.
            </p>
            <div className="tradingLabPersistenceArchitectureLists">
              <section aria-label="mock trading history Supabase schema table draft">
                <span>table drafts</span>
                <ul>
                  {labMockTradingHistorySupabaseTables.slice(0, 9).map((table) => (
                    <li key={table.tableName}>
                      <span>{table.tableName}</span>
                      <strong>{table.columnCount} columns</strong>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label="mock trading history Supabase relationship and index draft">
                <span>relationships / indexes</span>
                <ul>
                  <li>
                    <span>relationships</span>
                    <strong>{labMockTradingHistorySupabaseRelationships.relationshipCount ?? 0}</strong>
                  </li>
                  <li>
                    <span>self reference</span>
                    <strong>{labMockTradingHistorySupabaseRelationships.selfReferenceIncluded === true ? "parent_restore" : "blocked"}</strong>
                  </li>
                  <li>
                    <span>delete policy</span>
                    <strong>{formatStatus(labMockTradingHistorySupabaseRelationships.deletePolicy || "archive_or_invalidate_first")}</strong>
                  </li>
                </ul>
              </section>
              <section aria-label="mock trading history Supabase query contracts">
                <span>browser / compare / restore contract</span>
                <ul>
                  <li>
                    <span>browser fields</span>
                    <strong>{labMockTradingHistorySupabaseQueries.browserFieldCount ?? 0}</strong>
                  </li>
                  <li>
                    <span>compare runs</span>
                    <strong>{labMockTradingHistorySupabaseQueries.compareRunLimit?.min || 2}-{labMockTradingHistorySupabaseQueries.compareRunLimit?.max || 3}</strong>
                  </li>
                  <li>
                    <span>restore write now</span>
                    <strong>{labMockTradingHistorySupabaseQueries.restoreWriteImplementedNow === false ? "blocked" : "blocked"}</strong>
                  </li>
                </ul>
              </section>
            </div>
            <div className="tradingLabPersistenceArchitectureLists">
              <section aria-label="mock trading history Supabase migration sequencing">
                <span>migration sequencing draft</span>
                <ul>
                  {(labMockTradingHistorySupabaseSchemaDraft.migrationOrder || []).slice(0, 14).map((step) => (
                    <li key={step}>
                      <span>{step}</span>
                      <strong>draft</strong>
                    </li>
                  ))}
                </ul>
              </section>
              <section aria-label="mock trading history Supabase RLS retention and blockers">
                <span>RLS / retention / blockers</span>
                <ul>
                  <li>
                    <span>RLS public and mypage</span>
                    <strong>denied</strong>
                  </li>
                  <li>
                    <span>retention</span>
                    <strong>archive first</strong>
                  </li>
                  <li>
                    <span>blockers / warnings</span>
                    <strong>{labMockTradingHistorySupabaseValidation.blockerCount ?? 0} / {labMockTradingHistorySupabaseValidation.warningCount ?? 0}</strong>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </details>

        <details className="tradingLabHistoryBrowserDetails" data-admin-panel-key="mock-trading-history-browser-ui">
          <summary>
            <span>Mock trading history browser</span>
            <strong>{formatStatus(labMockTradingHistoryBrowser.status || "mock_only")}</strong>
            <em>{labMockHistoryFilteredRecords.length}/{labMockHistoryRecords.length} records - DB blocked</em>
          </summary>
          <div className="tradingLabHistoryBrowserBody">
            <p className="tradingLabHistoryBrowserNotice">
              This list uses deterministic mock data before DB connection. It is not live trading history, account performance, or stored Supabase data. DB read/write, Supabase mutation, provider calls, and order submission remain blocked.
            </p>
            <div className="tradingLabHistoryBrowserStatusGrid" aria-label="mock trading history browser blocked status">
              <article>
                <span>source</span>
                <strong>{formatStatus(labMockTradingHistoryBrowser.source || "deterministic_mock_history")}</strong>
              </article>
              <article>
                <span>DB read</span>
                <strong>{labMockHistoryBlocked.dbReadAttempted === false ? "blocked" : "blocked"}</strong>
              </article>
              <article>
                <span>DB write</span>
                <strong>{labMockHistoryBlocked.dbWriteAttempted === false ? "blocked" : "blocked"}</strong>
              </article>
              <article>
                <span>compare candidate</span>
                <strong>{labMockHistorySelectedRecords.length}/3</strong>
              </article>
              <article>
                <span>compare ready</span>
                <strong>{labMockHistoryCompareReady ? "ready placeholder" : "select 2-3 supported"}</strong>
              </article>
              <article>
                <span>next step</span>
                <strong>{formatStatus(labMockTradingHistoryBrowser.nextStep || "mock_history_compare")}</strong>
              </article>
            </div>
            <div className="tradingLabHistoryBrowserControls" aria-label="mock trading history browser filters">
              <label>
                <span>기간</span>
                <select value={mockHistoryFilters.dateRange} onChange={(event) => updateMockHistoryFilter("dateRange", event.target.value)}>
                  <option value="all">전체</option>
                  <option value="last_7_days">최근 7일</option>
                  <option value="last_30_days">최근 30일</option>
                  <option value="last_90_days">최근 90일</option>
                </select>
              </label>
              <label>
                <span>전략 preset</span>
                <select value={mockHistoryFilters.strategyPreset} onChange={(event) => updateMockHistoryFilter("strategyPreset", event.target.value)}>
                  {labMockHistoryStrategyOptions.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>상태</span>
                <select value={mockHistoryFilters.runStatus} onChange={(event) => updateMockHistoryFilter("runStatus", event.target.value)}>
                  <option value="all">전체</option>
                  <option value="completed">completed</option>
                  <option value="blocked">blocked</option>
                  <option value="failed">failed</option>
                  <option value="archived">archived</option>
                  <option value="in_review">in review</option>
                </select>
              </label>
              <label>
                <span>archive</span>
                <select value={mockHistoryFilters.archivedMode} onChange={(event) => updateMockHistoryFilter("archivedMode", event.target.value)}>
                  <option value="exclude_archived">archive 제외</option>
                  <option value="include_archived">archive 포함</option>
                  <option value="archived_only">archive만</option>
                </select>
              </label>
              <label>
                <span>수익률</span>
                <select value={mockHistoryFilters.returnRange} onChange={(event) => updateMockHistoryFilter("returnRange", event.target.value)}>
                  <option value="all">전체</option>
                  <option value="negative">0% 미만</option>
                  <option value="zero_to_three">0-3%</option>
                  <option value="above_three">3% 초과</option>
                </select>
              </label>
              <label>
                <span>MDD</span>
                <select value={mockHistoryFilters.mddRange} onChange={(event) => updateMockHistoryFilter("mddRange", event.target.value)}>
                  <option value="all">전체</option>
                  <option value="mdd_under_two">2% 미만</option>
                  <option value="mdd_two_to_four">2-4%</option>
                  <option value="mdd_above_four">4% 초과</option>
                </select>
              </label>
              <label>
                <span>위험점수</span>
                <select value={mockHistoryFilters.riskScoreRange} onChange={(event) => updateMockHistoryFilter("riskScoreRange", event.target.value)}>
                  <option value="all">전체</option>
                  <option value="low">낮음</option>
                  <option value="medium">중간</option>
                  <option value="high">높음</option>
                </select>
              </label>
              <label>
                <span>정렬</span>
                <select value={mockHistorySort} onChange={(event) => { setMockHistorySort(event.target.value); setMockHistoryPage(1); }}>
                  {Object.entries(MOCK_HISTORY_SORT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
            {labMockHistoryRecords.length === 0 ? (
              <p className="tradingLabHistoryBrowserEmpty">현재 이력 목록은 deterministic mock data 기반이며 DB 연결은 아직 차단되어 있습니다.</p>
            ) : labMockHistoryVisibleRecords.length === 0 ? (
              <p className="tradingLabHistoryBrowserEmpty">조건에 맞는 모의 거래 이력이 없습니다.</p>
            ) : (
              <div className="tradingLabHistoryBrowserTableWrap">
                <table className="tradingLabHistoryBrowserTable">
                  <thead>
                    <tr>
                      <th>선택</th>
                      <th>실행명</th>
                      <th>전략</th>
                      <th>상태</th>
                      <th>완료일</th>
                      <th>주문/체결</th>
                      <th>최종 모의 평가</th>
                      <th>누적 모의 수익률</th>
                      <th>MDD</th>
                      <th>위험</th>
                      <th>경고/차단</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labMockHistoryVisibleRecords.map((record) => {
                      const selected = mockHistorySelectedRunIds.includes(record.runId);
                      const supported = MOCK_HISTORY_COMPARE_STATUSES.has(record.runStatus) && record.compareSupported === true;
                      return (
                        <tr key={record.runId} className={mockHistoryFocusedRunId === record.runId ? "focused" : ""}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={!selected && mockHistorySelectedRunIds.length >= 3}
                              onChange={() => toggleMockHistorySelection(record.runId)}
                              aria-label={`${record.runLabel} mock compare candidate`}
                            />
                          </td>
                          <td>
                            <button type="button" onClick={() => setMockHistoryFocusedRunId(record.runId)}>
                              {record.runLabel}
                            </button>
                            <small>{supported ? "compare candidate" : "detail only"}</small>
                          </td>
                          <td>{record.strategyName} / {record.strategyVersion}</td>
                          <td>{formatStatus(record.runStatus)}</td>
                          <td>{record.completedAt ? record.completedAt.slice(0, 10) : record.createdAt?.slice(0, 10)}</td>
                          <td>{record.orderCount}/{record.fillCount}</td>
                          <td>{formatLabNumber(record.finalMockEquity)}</td>
                          <td>{formatLabNumber(record.cumulativeReturn, { percent: true })}</td>
                          <td>{formatLabNumber(record.mdd, { percent: true })}</td>
                          <td>{record.riskScore}</td>
                          <td>{record.warningCount}/{record.blockerCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="tradingLabHistoryBrowserPagination" aria-label="mock trading history browser pagination">
              <span>page {labMockHistoryPagination.page} / {labMockHistoryPagination.pageCount} · total {labMockHistoryPagination.totalRecords}</span>
              <label>
                <span>page size</span>
                <select value={mockHistoryPageSize} onChange={(event) => { setMockHistoryPageSize(Number(event.target.value)); setMockHistoryPage(1); }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </label>
              <button type="button" onClick={() => setMockHistoryPage((page) => Math.max(1, page - 1))} disabled={labMockHistoryPagination.page <= 1}>이전</button>
              <button type="button" onClick={() => setMockHistoryPage((page) => Math.min(labMockHistoryPagination.pageCount, page + 1))} disabled={labMockHistoryPagination.page >= labMockHistoryPagination.pageCount}>다음</button>
            </div>
            <div className="tradingLabHistoryBrowserDetailGrid">
              <section aria-label="mock trading history detail summary">
                <span>history detail summary</span>
                {labMockHistoryFocusedRecord ? (
                  <dl>
                    <dt>strategy</dt>
                    <dd>{labMockHistoryFocusedRecord.strategyName} / {labMockHistoryFocusedRecord.strategyVersion}</dd>
                    <dt>run status</dt>
                    <dd>{formatStatus(labMockHistoryFocusedRecord.runStatus)}</dd>
                    <dt>input / output</dt>
                    <dd>{labMockHistoryFocusedRecord.inputSummary} / {labMockHistoryFocusedRecord.outputSummary}</dd>
                    <dt>allocation</dt>
                    <dd>{labMockHistoryFocusedRecord.allocationSummary}</dd>
                    <dt>return / MDD / volatility / Sharpe</dt>
                    <dd>{formatLabNumber(labMockHistoryFocusedRecord.cumulativeReturn, { percent: true })} / {formatLabNumber(labMockHistoryFocusedRecord.mdd, { percent: true })} / {formatLabNumber(labMockHistoryFocusedRecord.volatility, { percent: true })} / {formatLabNumber(labMockHistoryFocusedRecord.sharpe)}</dd>
                    <dt>restored from</dt>
                    <dd>{labMockHistoryFocusedRecord.restoredFromRunId || "none"}</dd>
                    <dt>calculation version</dt>
                    <dd>{labMockHistoryFocusedRecord.calculationVersion}</dd>
                  </dl>
                ) : (
                  <p>조건에 맞는 모의 거래 이력이 없습니다.</p>
                )}
              </section>
              <section aria-label="mock trading history compare candidate summary">
                <span>Mock run 비교 준비</span>
                <ul>
                  <li>선택: {labMockHistorySelectedRecords.length}/3</li>
                  <li>상태: {labMockHistoryCompareReady ? "2개 이상 선택되어 비교 준비 가능" : "2개 이상의 supported mock run을 선택하세요"}</li>
                  <li>지원되지 않는 선택: {labMockHistoryUnsupportedSelectionCount}</li>
                  <li>calculationVersion: {formatStatus(labMockHistoryCompareWarning)}</li>
                  <li>DB read/write: blocked / blocked</li>
                </ul>
              </section>
            </div>
            <details className="tradingLabHistoryCompareDetails" data-admin-panel-key="mock-trading-history-compare-ui">
              <summary>
                <span>Mock trading history compare</span>
                <strong>{labMockTradingHistoryCompare.compareReady ? "compare-ready" : "select 2-3 supported"}</strong>
                <em>{labMockTradingHistoryCompare.selectedRunIds.length}/3 selected - DB blocked</em>
              </summary>
              <div className="tradingLabHistoryCompareBody">
                <p className="tradingLabHistoryBrowserNotice">
                  이 비교는 deterministic mock history 기반입니다. 실제 거래 성과나 실계좌 수익률이 아니며 DB read/write, Supabase mutation, provider calls, order submission은 계속 차단되어 있습니다. 비교 결과는 내부 mock 검토용 참고 자료입니다.
                </p>
                <div className="tradingLabHistoryCompareStatusGrid" aria-label="mock trading history compare status">
                  <article>
                    <span>선택 상태</span>
                    <strong>{labMockTradingHistoryCompare.selectedRunIds.length}/3</strong>
                  </article>
                  <article>
                    <span>compatibility</span>
                    <strong>{formatStatus(labMockTradingHistoryCompare.compatibilityStatus)}</strong>
                  </article>
                  <article>
                    <span>unsupported</span>
                    <strong>{labMockTradingHistoryCompare.unsupportedCount}</strong>
                  </article>
                  <article>
                    <span>DB read/write</span>
                    <strong>{labMockTradingHistoryCompare.dbReadStatus} / {labMockTradingHistoryCompare.dbWriteStatus}</strong>
                  </article>
                  <article>
                    <span>next step</span>
                    <strong>{formatStatus(labMockTradingHistoryCompare.nextStep)}</strong>
                  </article>
                </div>
                {!labMockTradingHistoryCompare.compareReady ? (
                  <p className="tradingLabHistoryBrowserEmpty">
                    비교할 모의 실행을 2개 이상 선택해주세요. 실패, 차단, 검토중 상태의 실행은 성과 비교 대상이 아니며 실제 거래 성과가 아닌 mock-only 결과입니다.
                  </p>
                ) : (
                  <>
                    {labMockTradingHistoryCompare.compatibilityStatus !== "compatible" ? (
                      <p className="tradingLabHistoryBrowserEmpty">
                        계산 버전이 달라 직접 우열 비교를 제한합니다. raw summary는 표시하지만 지표별 순위 해석에 주의가 필요합니다.
                      </p>
                    ) : null}
                    <div className="tradingLabHistoryCompareCards" aria-label="selected mock trading history compare cards">
                      {labMockTradingHistoryCompare.selectedRuns.map((record) => (
                        <article key={record.runId}>
                          <span>{record.runLabel}</span>
                          <strong>{record.strategyName} / {record.strategyVersion}</strong>
                          <ul>
                            <li>status: {formatStatus(record.runStatus)}</li>
                            <li>completed: {record.completedAt ? record.completedAt.slice(0, 10) : record.createdAt?.slice(0, 10)}</li>
                            <li>assets/orders/fills: {record.assetCount}/{record.orderCount}/{record.fillCount}</li>
                            <li>calc: {record.calculationVersion}</li>
                          </ul>
                        </article>
                      ))}
                    </div>
                    <div className="tradingLabHistoryCompareTableWrap">
                      <table className="tradingLabHistoryCompareTable" aria-label="mock history metric comparison table">
                        <thead>
                          <tr>
                            <th>metric</th>
                            {labMockTradingHistoryCompare.selectedRuns.map((record) => (
                              <th key={record.runId}>{record.runLabel}</th>
                            ))}
                            <th>difference note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labMockTradingHistoryCompare.metricComparisons.map((metric) => (
                            <tr key={metric.key}>
                              <td>{metric.label}</td>
                              {metric.values.map((value) => (
                                <td key={value.runId}>
                                  {formatLabNumber(value.value, { percent: metric.percent })} <small>({value.differenceFromBaseline >= 0 ? "+" : ""}{formatLabNumber(value.differenceFromBaseline, { percent: metric.percent })})</small>
                                </td>
                              ))}
                              <td>{metric.direction === "lower_abs_better" ? "MDD는 절댓값이 낮을수록 방어적 후보입니다." : metric.direction === "lower_better" ? "낮을수록 안정적 후보입니다." : "높을수록 우수 후보지만 내부 mock 검토용입니다."}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="tradingLabHistoryCompareGrid">
                      <section aria-label="mock history allocation comparison">
                        <span>allocation comparison</span>
                        <ul>
                          {labMockTradingHistoryCompare.allocationComparisons.map((entry) => (
                            <li key={entry.runId}>
                              {entry.runId}: 주식 {entry.allocation.equity}% / 인컴 {entry.allocation.income}% / 현금 {entry.allocation.cash}% / 기타 {entry.allocation.other}%
                            </li>
                          ))}
                        </ul>
                      </section>
                      <section aria-label="mock history risk comparison">
                        <span>risk comparison</span>
                        <ul>
                          {labMockTradingHistoryCompare.riskComparisons.map((entry) => (
                            <li key={entry.runId}>
                              {entry.runId}: 위험 {entry.riskLevel}, score {entry.riskScore}, warning/blocker {entry.warningCount}/{entry.blockerCount}
                            </li>
                          ))}
                        </ul>
                      </section>
                      <section aria-label="mock history metric rankings">
                        <span>지표별 상대 순위</span>
                        {labMockTradingHistoryCompare.rankings.length > 0 ? (
                          <ul>
                            {labMockTradingHistoryCompare.rankings.map((ranking) => (
                              <li key={ranking.metricKey}>
                                {ranking.label}: {ranking.rows.map((row) => `${row.rank}. ${row.runId}`).join(" / ")}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>계산 기준이 달라 순위 비교를 제한합니다.</p>
                        )}
                      </section>
                      <section aria-label="mock strategy restore candidate eligibility">
                        <span>restore candidate eligibility</span>
                        <ul>
                          {labMockTradingHistoryCompare.restoreCandidateEligibility.map((entry) => (
                            <li key={entry.restoreSourceRunId}>
                              {entry.restoreSourceRunId}: {entry.restoreEligible ? "Step190 후보 가능" : "후보 차단"} / DB write {entry.dbWriteStatus}
                            </li>
                          ))}
                        </ul>
                        <button type="button" disabled>전략 복원 후보 확인 - Step190에서 제공 예정</button>
                      </section>
                    </div>
                  </>
                )}
              </div>
            </details>
            <details className="tradingLabStrategyRestoreDetails" data-admin-panel-key="mock-strategy-restore-candidate">
              <summary>
                <span>Mock strategy restore candidate</span>
                <strong>{formatStatus(labMockStrategyRestoreCandidate.restorationStatus || "blocked")}</strong>
                <em>{labMockStrategyRestoreCandidate.sourceRunId || "source not selected"} - DB blocked</em>
              </summary>
              <div className="tradingLabStrategyRestoreBody">
                <p className="tradingLabHistoryBrowserNotice">
                  복원은 과거 실행 기록을 수정하지 않습니다. 전략 입력값만 새 초안 후보로 복사하고, 주문·체결·성과 결과는 복원하지 않습니다. DB 저장과 Supabase mutation은 아직 차단되어 있습니다.
                </p>
                <div className="tradingLabStrategyRestoreStatusGrid" aria-label="mock strategy restore candidate status">
                  <article>
                    <span>restore eligibility</span>
                    <strong>{formatStatus(labMockStrategyRestoreCandidate.restoreEligibility)}</strong>
                  </article>
                  <article>
                    <span>source immutable</span>
                    <strong>{labMockStrategyRestoreCandidate.immutableSourceConfirmed ? "confirmed" : "select source"}</strong>
                  </article>
                  <article>
                    <span>DB read/write</span>
                    <strong>{labMockStrategyRestoreCandidate.dbReadStatus} / {labMockStrategyRestoreCandidate.dbWriteStatus}</strong>
                  </article>
                  <article>
                    <span>next step</span>
                    <strong>{formatStatus(labMockStrategyRestoreCandidate.nextStep)}</strong>
                  </article>
                </div>
                <label className="tradingLabStrategyRestoreSourcePicker">
                  <span>복원 원본 선택</span>
                  <select
                    value={labMockStrategyRestoreCandidate.sourceRunId || ""}
                    onChange={(event) => setMockStrategyRestoreSourceRunId(event.target.value)}
                  >
                    {labMockStrategyRestoreSourceOptions.length === 0 ? (
                      <option value="">완료된 모의 실행을 먼저 선택해주세요</option>
                    ) : (
                      labMockStrategyRestoreSourceOptions.map((record) => {
                        const supported = MOCK_HISTORY_COMPARE_STATUSES.has(record.runStatus) && record.compareSupported === true;
                        return (
                          <option key={record.runId} value={record.runId} disabled={!supported}>
                            {record.runLabel} - {supported ? "복원 후보 가능" : "복원 불가"}
                          </option>
                        );
                      })
                    )}
                  </select>
                </label>
                {!labMockStrategyRestoreCandidate.targetDraftPreview ? (
                  <p className="tradingLabHistoryBrowserEmpty">
                    복원 후보로 사용할 완료된 모의 실행을 선택해주세요. 이 기능은 mock-only read-only preview이며 DB write는 차단되어 있습니다.
                  </p>
                ) : (
                  <>
                    <div className="tradingLabStrategyRestorePreviewGrid" aria-label="mock strategy restore target draft preview">
                      <section>
                        <span>source run 요약</span>
                        <dl>
                          <dt>source run</dt>
                          <dd>{labMockStrategyRestoreCandidate.sourceRunId}</dd>
                          <dt>source strategy</dt>
                          <dd>{labMockStrategyRestoreCandidate.sourceStrategyName} / {labMockStrategyRestoreCandidate.sourceStrategyVersion}</dd>
                          <dt>calculation version</dt>
                          <dd>{labMockStrategyRestoreCandidate.sourceCalculationVersion}</dd>
                          <dt>lineage</dt>
                          <dd>{labMockStrategyRestoreCandidate.lineage?.restoredFromStrategyVersionId}</dd>
                        </dl>
                      </section>
                      <section>
                        <span>target draft preview</span>
                        <dl>
                          <dt>draft label</dt>
                          <dd>{labMockStrategyRestoreCandidate.targetDraftPreview.draftLabel}</dd>
                          <dt>status</dt>
                          <dd>{formatStatus(labMockStrategyRestoreCandidate.targetDraftPreview.status)}</dd>
                          <dt>strategy type</dt>
                          <dd>{labMockStrategyRestoreCandidate.targetDraftPreview.strategyType}</dd>
                          <dt>persistence</dt>
                          <dd>{labMockStrategyRestoreCandidate.targetDraftPreview.persistence}</dd>
                        </dl>
                      </section>
                    </div>
                    <div className="tradingLabStrategyRestoreLists">
                      <section aria-label="mock strategy restore copied fields">
                        <span>copied fields</span>
                        <ul>
                          {labMockStrategyRestoreCandidate.copiedFields.map((field) => (
                            <li key={typeof field === "string" ? field : field.fieldName}>{typeof field === "string" ? field : field.fieldName}</li>
                          ))}
                        </ul>
                      </section>
                      <section aria-label="mock strategy restore excluded fields">
                        <span>excluded fields</span>
                        <ul>
                          {labMockStrategyRestoreCandidate.excludedFields.map((field) => (
                            <li key={typeof field === "string" ? field : field.fieldName}>{typeof field === "string" ? field : field.fieldName}</li>
                          ))}
                        </ul>
                      </section>
                      <section aria-label="mock strategy restore transformed fields">
                        <span>transformed fields</span>
                        <ul>
                          {labMockStrategyRestoreCandidate.transformedFields.map((field) => (
                            <li key={typeof field === "string" ? field : field.fieldName}>{typeof field === "string" ? field : `${field.fieldName}: ${field.targetValuePreview}`}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                    <div className="tradingLabStrategyRestoreLists">
                      <section aria-label="mock strategy restore target allocation preview">
                        <span>target allocation</span>
                        <ul>
                          {labMockStrategyRestoreCandidate.targetDraftPreview.targetAllocations.map((allocation) => (
                            <li key={allocation.symbol}>{allocation.symbol}: {allocation.targetWeight}%</li>
                          ))}
                        </ul>
                      </section>
                      <section aria-label="mock strategy restore validation warnings">
                        <span>validation warnings</span>
                        <ul>
                          {(labMockStrategyRestoreCandidate.validationWarnings.length > 0 ? labMockStrategyRestoreCandidate.validationWarnings : ["none"]).map((warning) => (
                            <li key={warning}>{formatStatus(warning)}</li>
                          ))}
                        </ul>
                      </section>
                      <section aria-label="mock strategy restore validation blockers">
                        <span>validation blockers</span>
                        <ul>
                          {(labMockStrategyRestoreCandidate.validationBlockers.length > 0 ? labMockStrategyRestoreCandidate.validationBlockers : ["none"]).map((blocker) => (
                            <li key={blocker}>{formatStatus(blocker)}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                    <div className="tradingLabStrategyRestoreNotice" aria-label="mock strategy restore write blocked notice">
                      <article>
                        <span>write blocked</span>
                        <strong>restore action 없음</strong>
                        <p>새 전략 초안 후보는 read-only preview입니다. DB 저장, Supabase mutation, provider/order/live gate는 계속 차단되어 있습니다.</p>
                        <button type="button" disabled>복원 초안 미리보기 - DB 저장은 다음 단계에서 검토</button>
                      </article>
                    </div>
                  </>
                )}
              </div>
            </details>
            <details className="tradingLabAiMlReadinessGateSummary" data-admin-panel-key="ai-ml-readiness-gate-summary" open>
              <summary>
                <span>AI/ML readiness gate summary</span>
                <strong>{formatStatus(labAiMlReadinessGateSummary.overallStatus || "internal_contracts_incomplete")}</strong>
                <em>contract and metadata preflight only</em>
              </summary>
              <div className="tradingLabAiMlReadinessGateSummaryBody">
                <p className="tradingLabHistoryBrowserNotice">
                  This admin-only summary composes Step 191 through Step 194 contracts into a deterministic gate view. It is not operational readiness: feature generation blocked, dataset build blocked, training and deployment blocked, provider/KIS access blocked, order authority externally blocked, live trading blocked, admin-only visibility.
                </p>
                <div className="tradingLabAiMlReadinessStatusGrid" aria-label="AI ML readiness gate status">
                  {[
                    ["capability stage", labAiMlReadinessGateSummary.capabilityStage || "contract_preflight_only"],
                    ["overall status", labAiMlReadinessGateSummary.overallStatus || "internal_contracts_incomplete"],
                    ["internal contract status", labAiMlReadinessGateSummary.internalContractStatus || "incomplete"],
                    ["metadata preflight status", labAiMlReadinessGateSummary.metadataPreflightStatus || "invalid"],
                    ["execution permission status", labAiMlReadinessGateSummary.executionPermissionStatus || "blocked"],
                    ["data access status", labAiMlReadinessGateSummary.dataAccessStatus || "blocked"],
                    ["feature generation status", labAiMlReadinessGateSummary.featureGenerationStatus || "blocked"],
                    ["dataset build status", labAiMlReadinessGateSummary.datasetBuildStatus || "blocked"],
                    ["model training status", labAiMlReadinessGateSummary.modelTrainingStatus || "blocked"],
                    ["model deployment status", labAiMlReadinessGateSummary.modelDeploymentStatus || "blocked"],
                    ["provider/KIS status", labAiMlReadinessGateSummary.providerConnectivityStatus || "blocked"],
                    ["order authority status", labAiMlReadinessGateSummary.orderAuthorityStatus || "external_blocker"],
                    ["live trading status", labAiMlReadinessGateSummary.liveTradingStatus || "blocked"],
                    ["next safe implementation step", labAiMlReadinessGateSummary.nextSafeImplementationStep || "admin_only_ai_ml_batch_contract_review"],
                  ].map(([label, value]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{formatStatus(value)}</strong>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlReadinessStatusGrid" aria-label="AI ML readiness gate counts">
                  <article>
                    <span>source Step coverage</span>
                    <strong>{Number(labAiMlReadinessSourceRegistry.sourceCount || 0)} / {Number(labAiMlReadinessSourceRegistry.requiredSourceCount || 4)}</strong>
                  </article>
                  <article>
                    <span>pass / fail / blocked</span>
                    <strong>{Number(labAiMlReadinessGateSummary.passCount || 0)} / {Number(labAiMlReadinessGateSummary.failCount || 0)} / {Number(labAiMlReadinessGateSummary.blockedCount || 0)}</strong>
                  </article>
                  <article>
                    <span>external blocker count</span>
                    <strong>{Number(labAiMlReadinessGateSummary.externalBlockerCount || 0)}</strong>
                  </article>
                  <article>
                    <span>critical blockers</span>
                    <strong>{Number(labAiMlReadinessGateSummary.criticalBlockerCount || 0)}</strong>
                  </article>
                  <article>
                    <span>admin-only aggregation</span>
                    <strong>{labAiMlReadinessGateSummaryStatus.adminReadOnlyReadinessAggregationAllowed ? "true" : "blocked"}</strong>
                  </article>
                  <article>
                    <span>deterministic composition</span>
                    <strong>{labAiMlReadinessGateSummaryStatus.deterministicStatusCompositionAllowed ? "true" : "blocked"}</strong>
                  </article>
                </div>
                <div className="tradingLabAiMlReadinessSourceGrid" aria-label="AI ML readiness source registry">
                  {labAiMlReadinessSources.map((source) => (
                    <article key={source.sourceStepId}>
                      <span>{formatStatus(source.sourceStepId)}</span>
                      <strong>{formatStatus(source.sourceStatus)}</strong>
                      <p>{source.sourceName}</p>
                      <p>{formatStatus(source.sourceContractType)} / {source.sourceVersion}</p>
                      <p>admin-only {source.adminOnly ? "true" : "review"} / execution {source.executionAllowed ? "conflict" : "blocked"}</p>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlReadinessGateGrid" aria-label="AI ML readiness gate results">
                  {labAiMlReadinessGateResults.map((gate) => (
                    <article key={gate.gateId}>
                      <span>{formatStatus(gate.category)}</span>
                      <strong>{formatStatus(gate.status)} / {formatStatus(gate.severity)}</strong>
                      <p>{gate.message}</p>
                      <p>{gate.remediation}</p>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlReadinessSafetyGrid" aria-label="AI ML readiness gate safety restrictions">
                  {[
                    ["feature generation blocked", labAiMlReadinessSafety.featureGenerationAttempted],
                    ["dataset build blocked", labAiMlReadinessSafety.datasetBuildAttempted],
                    ["training and deployment blocked", labAiMlReadinessSafety.modelTrainingAttempted || labAiMlReadinessSafety.modelDeploymentAttempted],
                    ["file and artifact creation blocked", labAiMlReadinessSafety.featureFileCreated || labAiMlReadinessSafety.datasetFileCreated || labAiMlReadinessSafety.modelArtifactCreated],
                    ["DB read/write blocked", labAiMlReadinessSafety.dbReadAttempted || labAiMlReadinessSafety.dbWriteAttempted || labAiMlReadinessSafety.dbMigrationAttempted],
                    ["provider/KIS access blocked", labAiMlReadinessSafety.providerCallAttempted || labAiMlReadinessSafety.kisCallAttempted],
                    ["order/live blocked", labAiMlReadinessSafety.orderSubmissionAttempted || labAiMlReadinessSafety.liveTradingAttempted],
                    ["public/My Page exposure blocked", labAiMlReadinessSafety.publicUiExposed || labAiMlReadinessSafety.myPageUiExposed],
                  ].map(([label, attempted]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{attempted ? "review required" : "blocked"}</strong>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlReadinessContractGrid">
                  <section aria-label="AI ML readiness critical blockers">
                    <span>critical blockers</span>
                    <ul>
                      {(labAiMlReadinessCriticalBlockers.length > 0 ? labAiMlReadinessCriticalBlockers : ["none"]).map((blocker) => (
                        <li key={blocker}>{formatStatus(blocker)}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML readiness deterministic scenarios">
                    <span>deterministic scenarios</span>
                    <ul>
                      {(labAiMlReadinessGateSummary.scenarioCatalog || []).map((scenario) => (
                        <li key={scenario}>{formatStatus(scenario)}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </details>
            <details className="tradingLabAiMlBatchContractReview" data-admin-panel-key="ai-ml-batch-contract-review" open>
              <summary>
                <span>AI/ML batch contract review</span>
                <strong>{formatStatus(labAiMlBatchContractReview.overallStatus || "contract_needs_revision")}</strong>
                <em>metadata-only contract review</em>
              </summary>
              <div className="tradingLabAiMlBatchContractReviewBody">
                <p className="tradingLabHistoryBrowserNotice">
                  metadata-only contract review: manual approval not granted, approval scope is manifest design only, batch execution blocked, output creation blocked, DB/provider/KIS access blocked, training and deployment blocked, order and live trading blocked, admin-only visibility.
                </p>
                <div className="tradingLabAiMlBatchReviewStatusGrid" aria-label="AI ML batch contract review status">
                  {[
                    ["upstream readiness status", labAiMlBatchContractReview.upstreamReadinessStatus || "missing"],
                    ["review eligibility status", labAiMlBatchContractReview.reviewEligibilityStatus || "not_eligible"],
                    ["approval status", labAiMlBatchContractReview.approvalStatus || "not_granted"],
                    ["approval scope", labAiMlBatchContractReview.approvalScope || "dry_run_manifest_design_only"],
                    ["manual review required", labAiMlBatchContractReview.manualReviewRequired ? "true" : "review required"],
                    ["execution authorization status", labAiMlBatchContractReview.executionAuthorizationStatus || "denied"],
                    ["batch execution status", labAiMlBatchContractReview.batchExecutionStatus || "blocked"],
                    ["output creation status", labAiMlBatchContractReview.outputCreationStatus || "blocked"],
                    ["external order authority", labAiMlBatchContractReview.externalAuthorityStatus || "external_blocker"],
                    ["live trading status", labAiMlBatchContractReview.liveTradingStatus || "blocked"],
                    ["overall status", labAiMlBatchContractReview.overallStatus || "contract_needs_revision"],
                    ["next safe implementation step", labAiMlBatchContractReview.nextSafeImplementationStep || "dry_run_manifest_contract_design"],
                  ].map(([label, value]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{formatStatus(value)}</strong>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlBatchReviewStatusGrid" aria-label="AI ML batch contract coverage">
                  <article>
                    <span>contract/version coverage</span>
                    <strong>{labAiMlBatchContractReview.requestContractSummary?.batchContractVersion || "missing"} / {labAiMlBatchContractReview.requestContractSummary?.featureSetVersion || "missing"} / {labAiMlBatchContractReview.requestContractSummary?.labelSpecVersion || "missing"}</strong>
                  </article>
                  <article>
                    <span>batch purpose</span>
                    <strong>{formatStatus(labAiMlBatchContractReview.requestContractSummary?.batchPurpose || "missing")}</strong>
                  </article>
                  <article>
                    <span>target universe declaration</span>
                    <strong>{(labAiMlBatchContractReview.targetUniverseSummary?.markets || []).join(" / ") || "missing"} · {(labAiMlBatchContractReview.targetUniverseSummary?.assetClasses || []).join(" / ") || "missing"}</strong>
                  </article>
                  <article>
                    <span>temporal/PIT review</span>
                    <strong>{formatStatus(labAiMlBatchReviewChecks.find((check) => check.category === "point_in_time_and_leakage")?.status || "not_evaluated")}</strong>
                  </article>
                  <article>
                    <span>partition plan review</span>
                    <strong>{formatStatus(labAiMlBatchReviewChecks.find((check) => check.category === "partition_plan")?.status || "not_evaluated")}</strong>
                  </article>
                  <article>
                    <span>prohibited intent status</span>
                    <strong>{formatStatus(labAiMlBatchReviewChecks.find((check) => check.category === "prohibited_execution_intent")?.status || "not_evaluated")}</strong>
                  </article>
                </div>
                <div className="tradingLabAiMlBatchReviewContractGrid">
                  <section aria-label="AI ML batch output restrictions">
                    <span>output restriction</span>
                    <ul>
                      <li>format: {formatStatus(labAiMlBatchContractReview.outputRestrictionSummary?.proposedOutputFormat || "missing")}</li>
                      <li>output creation: {formatStatus(labAiMlBatchContractReview.outputRestrictionSummary?.outputCreationStatus || "blocked")}</li>
                      <li>output path: {formatStatus(labAiMlBatchContractReview.outputRestrictionSummary?.outputPathStatus || "not_assigned")}</li>
                      <li>file authorization: {formatStatus(labAiMlBatchContractReview.outputRestrictionSummary?.fileCreationAuthorization || "denied")}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML batch governance declaration">
                    <span>governance/retention declaration</span>
                    <ul>
                      <li>PII: {formatStatus(labAiMlBatchContractReview.governanceSummary?.pii || "none_declared")}</li>
                      <li>credentials: {formatStatus(labAiMlBatchContractReview.governanceSummary?.credentials || "excluded")}</li>
                      <li>raw account data: {formatStatus(labAiMlBatchContractReview.governanceSummary?.rawAccountData || "excluded")}</li>
                      <li>persistence: {formatStatus(labAiMlBatchContractReview.governanceSummary?.persistenceStatus || "blocked")}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML batch deterministic scenarios">
                    <span>deterministic scenarios</span>
                    <ul>
                      {labAiMlBatchReviewScenarios.map((scenario) => (
                        <li key={scenario}>{formatStatus(scenario)}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlBatchReviewCheckGrid" aria-label="AI ML batch contract review checks">
                  {labAiMlBatchReviewChecks.map((check) => (
                    <article key={check.checkId}>
                      <span>{formatStatus(check.category)}</span>
                      <strong>{formatStatus(check.status)} / {formatStatus(check.severity)}</strong>
                      <p>{check.message}</p>
                      <p>{check.remediation}</p>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlBatchReviewChecklistGrid" aria-label="AI ML batch ownership reviewer checklist">
                  {labAiMlBatchApprovalChecklist.map((item) => (
                    <article key={item.checklistItemId}>
                      <span>{formatStatus(item.role)}</span>
                      <strong>{formatStatus(item.status)}</strong>
                      <p>{item.message}</p>
                      <p>{formatStatus(item.scope)}</p>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlBatchReviewSafetyGrid" aria-label="AI ML batch contract review safety restrictions">
                  {[
                    ["batch execution blocked", labAiMlBatchReviewSafety.batchExecutionAttempted || labAiMlBatchReviewSafety.dryRunExecutionAttempted],
                    ["output creation blocked", labAiMlBatchReviewSafety.featureFileCreated || labAiMlBatchReviewSafety.datasetFileCreated || labAiMlBatchReviewSafety.modelArtifactCreated],
                    ["DB access blocked", labAiMlBatchReviewSafety.dbReadAttempted || labAiMlBatchReviewSafety.dbWriteAttempted || labAiMlBatchReviewSafety.dbMigrationAttempted],
                    ["provider/KIS access blocked", labAiMlBatchReviewSafety.providerCallAttempted || labAiMlBatchReviewSafety.kisCallAttempted],
                    ["training and deployment blocked", labAiMlBatchReviewSafety.modelTrainingAttempted || labAiMlBatchReviewSafety.modelDeploymentAttempted],
                    ["order and live trading blocked", labAiMlBatchReviewSafety.orderSubmissionAttempted || labAiMlBatchReviewSafety.liveTradingAttempted],
                    ["approval persistence blocked", labAiMlBatchReviewSafety.approvalPersistenceAttempted || labAiMlBatchReviewSafety.executionAuthorizationGranted],
                    ["public/My Page exposure blocked", labAiMlBatchReviewSafety.publicUiExposed || labAiMlBatchReviewSafety.myPageUiExposed],
                  ].map(([label, attempted]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{attempted ? "review required" : "blocked"}</strong>
                    </article>
                  ))}
                </div>
              </div>
            </details>
            <details className="tradingLabAiMlDatasetBuildDryRunManifest" data-admin-panel-key="ai-ml-dataset-build-dry-run-manifest" open>
              <summary>
                <span>AI/ML dataset build dry-run manifest</span>
                <strong>{formatStatus(labAiMlDatasetBuildDryRunManifest.overallStatus || "manifest_needs_revision")}</strong>
                <em>metadata-only non-executable manifest</em>
              </summary>
              <div className="tradingLabAiMlDatasetBuildDryRunManifestBody">
                <p className="tradingLabHistoryBrowserNotice">
                  metadata-only non-executable manifest: review receipt is not an approval, manifest is not persisted or downloadable, dry-run execution blocked, schema and partition materialization blocked, output path not assigned, dataset and file creation blocked, DB/provider/KIS access blocked, training and deployment blocked, order and live trading blocked, admin-only visibility.
                </p>
                <div className="tradingLabAiMlDatasetBuildManifestStatusGrid" aria-label="AI ML dataset build dry-run manifest status">
                  {[
                    ["manifest mode", labAiMlDatasetBuildDryRunManifest.manifestMode || "metadata_only_non_executable"],
                    ["manifest design status", labAiMlDatasetBuildDryRunManifest.manifestDesignStatus || "needs_revision"],
                    ["review receipt status", labAiMlDatasetBuildDryRunManifest.reviewReceiptStatus || "generated_not_persisted"],
                    ["review decision", labAiMlDatasetBuildDryRunManifest.reviewDecision || "design_contract_record_only"],
                    ["approval status", labAiMlDatasetBuildDryRunManifest.approvalStatus || "not_granted"],
                    ["approval scope", labAiMlDatasetBuildDryRunManifest.approvalScope || "dry_run_manifest_design_only"],
                    ["execution authorization", labAiMlDatasetBuildDryRunManifest.executionAuthorizationStatus || "denied"],
                    ["dry-run execution", labAiMlDatasetBuildDryRunManifest.dryRunExecutionStatus || "blocked"],
                    ["materialization", labAiMlDatasetBuildDryRunManifest.materializationStatus || "blocked"],
                    ["output creation", labAiMlDatasetBuildDryRunManifest.outputCreationStatus || "blocked"],
                    ["output path", labAiMlDatasetBuildDryRunManifest.outputPathStatus || "not_assigned"],
                    ["overall status", labAiMlDatasetBuildDryRunManifest.overallStatus || "manifest_needs_revision"],
                  ].map(([label, value]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{formatStatus(value)}</strong>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlDatasetBuildManifestStatusGrid" aria-label="AI ML dataset build dry-run manifest contract coverage">
                  <article>
                    <span>manifest identity</span>
                    <strong>{labAiMlDatasetBuildDryRunManifest.manifestId || "missing"} / {labAiMlDatasetBuildDryRunManifest.manifestVersion || "missing"}</strong>
                  </article>
                  <article>
                    <span>contract versions</span>
                    <strong>{labAiMlDatasetBuildDryRunManifest.contractVersionCoverage?.datasetSpecVersion || "missing"} / {labAiMlDatasetBuildDryRunManifest.contractVersionCoverage?.featureSetVersion || "missing"} / {labAiMlDatasetBuildDryRunManifest.contractVersionCoverage?.labelSpecVersion || "missing"}</strong>
                  </article>
                  <article>
                    <span>logical inputs</span>
                    <strong>{labAiMlDatasetBuildDryRunManifest.logicalInputSummary?.logicalInputCount || 0} / {formatStatus(labAiMlDatasetBuildDryRunManifest.logicalInputSummary?.accessStatus || "blocked")}</strong>
                  </article>
                  <article>
                    <span>logical schema</span>
                    <strong>{labAiMlDatasetBuildDryRunManifest.logicalSchemaSummary?.fieldCount || 0} fields / {labAiMlDatasetBuildDryRunManifest.logicalSchemaSummary?.logicalSchemaVersion || "missing"}</strong>
                  </article>
                  <article>
                    <span>logical partition plan</span>
                    <strong>{(labAiMlDatasetBuildDryRunManifest.logicalPartitionSummary?.logicalPartitionKeys || []).join(" / ") || "missing"} / {formatStatus(labAiMlDatasetBuildDryRunManifest.logicalPartitionSummary?.partitionMaterializationStatus || "blocked")}</strong>
                  </article>
                  <article>
                    <span>logical output plan</span>
                    <strong>{formatStatus(labAiMlDatasetBuildDryRunManifest.logicalOutputSummary?.outputCreationStatus || "blocked")} / {formatStatus(labAiMlDatasetBuildDryRunManifest.logicalOutputSummary?.outputPathStatus || "not_assigned")}</strong>
                  </article>
                </div>
                <div className="tradingLabAiMlDatasetBuildManifestContractGrid">
                  <section aria-label="AI ML dataset build manifest sections">
                    <span>manifest request contract sections</span>
                    <ul>
                      {labAiMlDatasetBuildManifestSections.map((section) => (
                        <li key={section.sectionId}>
                          {formatStatus(section.sectionId)}: {section.present ? "present" : "missing"} / {formatStatus(section.mode)}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML dataset build manifest governance">
                    <span>governance and receipt boundary</span>
                    <ul>
                      <li>PII: {formatStatus(labAiMlDatasetBuildDryRunManifest.governanceSummary?.piiPresenceDeclaration || "none_declared")}</li>
                      <li>credentials: {formatStatus(labAiMlDatasetBuildDryRunManifest.governanceSummary?.credentialExclusionDeclaration || "excluded")}</li>
                      <li>raw account data: {formatStatus(labAiMlDatasetBuildDryRunManifest.governanceSummary?.rawAccountDataDeclaration || "excluded")}</li>
                      <li>persistence: {formatStatus(labAiMlDatasetBuildDryRunManifest.governanceSummary?.persistenceStatus || "blocked")}</li>
                      <li>receipt: {formatStatus(labAiMlDatasetBuildDryRunManifest.reviewReceipt?.reviewDecision || "design_contract_record_only")}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML dataset build manifest deterministic scenarios">
                    <span>deterministic scenarios</span>
                    <ul>
                      {labAiMlDatasetBuildManifestScenarios.map((scenario) => (
                        <li key={scenario}>{formatStatus(scenario)}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlDatasetBuildManifestCheckGrid" aria-label="AI ML dataset build manifest validation checks">
                  {labAiMlDatasetBuildManifestChecks.map((check) => (
                    <article key={check.checkId}>
                      <span>{formatStatus(check.category)}</span>
                      <strong>{formatStatus(check.status)} / {formatStatus(check.severity)}</strong>
                      <p>{check.message}</p>
                      <p>{check.remediation}</p>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlDatasetBuildManifestSafetyGrid" aria-label="AI ML dataset build manifest safety restrictions">
                  {[
                    ["dry-run execution blocked", labAiMlDatasetBuildManifestSafety.dryRunExecutionAttempted],
                    ["schema and partition materialization blocked", labAiMlDatasetBuildManifestSafety.schemaMaterializationAttempted || labAiMlDatasetBuildManifestSafety.partitionMaterializationAttempted],
                    ["output path not assigned", labAiMlDatasetBuildManifestSafety.outputPathAssigned],
                    ["dataset and file creation blocked", labAiMlDatasetBuildManifestSafety.datasetBuildAttempted || labAiMlDatasetBuildManifestSafety.datasetFileCreated || labAiMlDatasetBuildManifestSafety.manifestFileCreated],
                    ["DB/provider/KIS access blocked", labAiMlDatasetBuildManifestSafety.dbReadAttempted || labAiMlDatasetBuildManifestSafety.dbWriteAttempted || labAiMlDatasetBuildManifestSafety.providerCallAttempted || labAiMlDatasetBuildManifestSafety.kisCallAttempted],
                    ["training and deployment blocked", labAiMlDatasetBuildManifestSafety.modelTrainingAttempted || labAiMlDatasetBuildManifestSafety.modelDeploymentAttempted],
                    ["review receipt persistence blocked", labAiMlDatasetBuildManifestSafety.reviewReceiptPersisted || labAiMlDatasetBuildManifestSafety.approvalPersistenceAttempted],
                    ["order and live trading blocked", labAiMlDatasetBuildManifestSafety.orderSubmissionAttempted || labAiMlDatasetBuildManifestSafety.liveTradingAttempted],
                    ["public/My Page exposure blocked", labAiMlDatasetBuildManifestSafety.publicUiExposed || labAiMlDatasetBuildManifestSafety.myPageUiExposed],
                  ].map(([label, attempted]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{attempted ? "review required" : "blocked"}</strong>
                    </article>
                  ))}
                </div>
              </div>
            </details>
            <details className="tradingLabAiMlStrategyConsole" data-admin-panel-key="ai-ml-strategy-management-console">
              <summary>
                <span>AI/ML strategy management console</span>
                <strong>{formatStatus(labAiMlStrategyRegistry.status || "design_only")}</strong>
                <em>training/deploy/write blocked</em>
              </summary>
              <div className="tradingLabAiMlStrategyConsoleBody">
                <p className="tradingLabHistoryBrowserNotice">
                  This admin-only console is a deterministic architecture prototype for model registry governance. It does not run training jobs, create model files, write a registry, call providers, submit orders, or expose model output to public screens.
                </p>
                <div className="tradingLabAiMlStatusGrid" aria-label="AI ML strategy management status">
                  <article>
                    <span>registry scope</span>
                    <strong>{labAiMlStrategyRegistry.scope || "admin_ai_ml_strategy_lab"}</strong>
                  </article>
                  <article>
                    <span>models</span>
                    <strong>{labAiMlStrategyRegistry.modelCount || labAiMlModels.length}</strong>
                  </article>
                  <article>
                    <span>dataset / feature / eval</span>
                    <strong>{labAiMlDatasets.length} / {labAiMlFeatureSets.length} / {labAiMlEvaluationProfiles.length}</strong>
                  </article>
                  <article>
                    <span>next contract</span>
                    <strong>{formatStatus(labAiMlStrategyRegistry.nextImplementationStep || "ai_ml_training_pipeline_preflight_contract")}</strong>
                  </article>
                  <article>
                    <span>training / deployment</span>
                    <strong>{labAiMlStrategyManagementStatus.modelTrainingAllowed ? "open" : "blocked"} / {labAiMlStrategyManagementStatus.modelDeploymentAllowed ? "open" : "blocked"}</strong>
                  </article>
                  <article>
                    <span>auto approval / DB write</span>
                    <strong>{labAiMlStrategyManagementStatus.modelAutoApprovalAllowed ? "open" : "blocked"} / {labAiMlStrategyManagementStatus.dbWriteAllowed ? "open" : "blocked"}</strong>
                  </article>
                </div>
                <div className="tradingLabAiMlModelGrid" aria-label="AI ML model registry cards">
                  {labAiMlModels.map((model) => (
                    <article key={model.modelId}>
                      <span>{model.modelType}</span>
                      <strong>{model.modelName}</strong>
                      <dl>
                        <dt>version</dt>
                        <dd>{model.modelVersion}</dd>
                        <dt>algorithm family</dt>
                        <dd>{model.algorithmFamily}</dd>
                        <dt>lifecycle</dt>
                        <dd>{formatStatus(model.lifecycleStatus)}</dd>
                        <dt>deployment</dt>
                        <dd>{model.deploymentStatus}</dd>
                      </dl>
                      <p>{(model.outputContract || []).join(" / ")}</p>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlContractGrid">
                  <section aria-label="AI ML dataset contracts">
                    <span>dataset contracts</span>
                    <ul>
                      {labAiMlDatasets.map((dataset) => (
                        <li key={dataset.datasetId}>
                          {dataset.datasetName}: {dataset.coverage} / storage {dataset.storageStatus}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML feature contracts">
                    <span>feature contracts</span>
                    <ul>
                      {labAiMlFeatureSets.map((featureSet) => (
                        <li key={featureSet.featureSetId}>
                          {featureSet.featureSetId}: {(featureSet.featureFamilies || []).join(", ")}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML evaluation contracts">
                    <span>evaluation contracts</span>
                    <ul>
                      {labAiMlEvaluationProfiles.map((profile) => (
                        <li key={profile.evaluationProfileId}>
                          {profile.evaluationProfileId}: {(profile.metricContract || []).join(", ")} / {profile.approvalThresholdStatus}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlContractGrid">
                  <section aria-label="AI ML lifecycle summary">
                    <span>model lifecycle</span>
                    <ul>
                      {labAiMlLifecycleSummary.map((entry) => (
                        <li key={entry.lifecycleStatus}>{formatStatus(entry.lifecycleStatus)}: {entry.count}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML approval workflow">
                    <span>approval and retirement workflow</span>
                    <ul>
                      {(labAiMlStrategyRegistry.approvalWorkflow?.approvalStages || []).map((stage) => (
                        <li key={stage}>{formatStatus(stage)}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML future implementation contracts">
                    <span>future implementation contracts</span>
                    <ul>
                      {labAiMlImplementationContracts.map((contract) => (
                        <li key={contract.step}>{contract.step}: {contract.name} - {contract.allowedScope}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlBlockedNotice" aria-label="AI ML blocked operations">
                  <article>
                    <span>blocked operations</span>
                    <strong>training, deployment, DB write, provider, order, live gates remain blocked</strong>
                    <ul>
                      {labAiMlBlockedOperations.map((operation) => (
                        <li key={operation}>{formatStatus(operation)}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </div>
            </details>
            <details className="tradingLabAiMlDatasetArchitecture" data-admin-panel-key="ai-ml-dataset-labeling-architecture">
              <summary>
                <span>AI/ML dataset and labeling architecture</span>
                <strong>{formatStatus(labAiMlDatasetArchitecture.status || "design_only")}</strong>
                <em>dataset build / feature generation blocked</em>
              </summary>
              <div className="tradingLabAiMlDatasetArchitectureBody">
                <p className="tradingLabHistoryBrowserNotice">
                  This admin-only dataset section defines point-in-time, label, split, leakage, versioning, and retention contracts. It does not download data, generate files, run Python training, write Supabase/Postgres state, call providers, or expose model output to public screens.
                </p>
                <div className="tradingLabAiMlDatasetStatusGrid" aria-label="AI ML dataset architecture status">
                  <article>
                    <span>dataset families</span>
                    <strong>{labAiMlDatasetArchitecture.datasetFamilyCount || labAiMlDatasetFamilies.length}</strong>
                  </article>
                  <article>
                    <span>labels / features</span>
                    <strong>{labAiMlLabelDefinitions.length} / {labAiMlFeatureTimestampRules.length}</strong>
                  </article>
                  <article>
                    <span>split / walk-forward</span>
                    <strong>{labAiMlSplitPolicies.length} / {labAiMlWalkForwardPolicies.length}</strong>
                  </article>
                  <article>
                    <span>validation</span>
                    <strong>{formatStatus(labAiMlDatasetArchitecture.validation?.validationStatus || "design_only")}</strong>
                  </article>
                  <article>
                    <span>dataset / feature build</span>
                    <strong>{labAiMlDatasetArchitectureStatus.datasetBuildAllowed ? "open" : "blocked"} / {labAiMlDatasetArchitectureStatus.featureGenerationAllowed ? "open" : "blocked"}</strong>
                  </article>
                  <article>
                    <span>DB / training</span>
                    <strong>{labAiMlDatasetArchitectureStatus.dbWriteAllowed ? "open" : "blocked"} / {labAiMlDatasetArchitectureStatus.modelTrainingAllowed ? "open" : "blocked"}</strong>
                  </article>
                </div>
                <div className="tradingLabAiMlDatasetFamilyGrid" aria-label="AI ML dataset family definitions">
                  {labAiMlDatasetFamilies.map((family) => (
                    <article key={family.datasetFamilyId}>
                      <span>{family.modelType}</span>
                      <strong>{family.purpose}</strong>
                      <p>inputs: {(family.inputFamilies || []).join(" / ")}</p>
                      <p>labels: {(family.labelFamilies || []).join(" / ")}</p>
                      <p>leakage: {family.leakageReviewStatus}</p>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlDatasetContractGrid">
                  <section aria-label="AI ML label definitions">
                    <span>label definitions</span>
                    <ul>
                      {labAiMlLabelDefinitions.map((label) => (
                        <li key={label.labelId}>{label.labelId}: {label.horizon} / {label.formula} / embargo {label.embargoPeriod}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML feature timestamp rules">
                    <span>feature timestamp rules</span>
                    <ul>
                      {labAiMlFeatureTimestampRules.map((feature) => (
                        <li key={feature.featureId}>{feature.featureId}: {feature.lookbackWindow} / availableAt {feature.availableAtRule}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML point in time correctness">
                    <span>point-in-time correctness</span>
                    <ul>
                      {(labAiMlDatasetArchitecture.pointInTimeRules?.requiredFields || []).map((fieldName) => (
                        <li key={fieldName}>{fieldName}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlDatasetContractGrid">
                  <section aria-label="AI ML split policy">
                    <span>train validation test split</span>
                    <ul>
                      {labAiMlSplitPolicies.map((policy) => (
                        <li key={policy.splitPolicyId}>
                          {policy.trainWindow} / {policy.validationWindow} / {policy.testWindow} - random split {policy.randomSplitAllowed ? "open" : "blocked"}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML walk forward policy">
                    <span>walk-forward dataset contract</span>
                    <ul>
                      {labAiMlWalkForwardPolicies.map((policy) => (
                        <li key={policy.walkForwardPolicyId}>{policy.windowType}: train {policy.trainWindowMinimum}, validation {policy.validationWindow}, test {policy.testWindow}, step {policy.stepSize}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML leakage prevention controls">
                    <span>leakage prevention</span>
                    <ul>
                      {labAiMlLeakageControls.map((control) => (
                        <li key={control}>{control}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlDatasetContractGrid">
                  <section aria-label="AI ML dataset versioning policy">
                    <span>versioning and lineage</span>
                    <ul>
                      <li>{labAiMlDatasetArchitecture.versioningPolicy?.datasetVersionFormat}</li>
                      <li>label change creates new version: {String(Boolean(labAiMlDatasetArchitecture.versioningPolicy?.labelChangeCreatesNewDatasetVersion))}</li>
                      <li>raw value storage: {labAiMlDatasetArchitecture.lineagePolicy?.rawValueStorageAllowed ? "open" : "blocked"}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML retention and redaction policy">
                    <span>retention and redaction</span>
                    <ul>
                      <li>{labAiMlDatasetArchitecture.retentionPolicy?.retentionScope}</li>
                      <li>{labAiMlDatasetArchitecture.retentionPolicy?.datasetFileRetention}</li>
                      <li>public exposure: {labAiMlDatasetArchitecture.retentionPolicy?.publicExposureAllowed ? "open" : "blocked"}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML dataset future implementation contracts">
                    <span>future pipeline contracts</span>
                    <ul>
                      {labAiMlDatasetContracts.map((contract) => (
                        <li key={contract.step}>{contract.step}: {contract.name} - {contract.allowedScope}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </details>
            <details className="tradingLabAiMlFeaturePipelineArchitecture" data-admin-panel-key="ai-ml-feature-pipeline-architecture">
              <summary>
                <span>AI/ML feature pipeline architecture</span>
                <strong>{formatStatus(labAiMlFeaturePipeline.status || "design_only")}</strong>
                <em>feature generation / training blocked</em>
              </summary>
              <div className="tradingLabAiMlFeaturePipelineArchitectureBody">
                <p className="tradingLabHistoryBrowserNotice">
                  This admin-only feature pipeline section defines deterministic architecture contracts only. It does not generate features, create CSV or Parquet files, run Python jobs, build datasets, train models, read or write DB state, call KIS/providers, submit orders, or expose public/My Page trading UI.
                </p>
                <div className="tradingLabAiMlFeatureStatusGrid" aria-label="AI ML feature pipeline safety status">
                  <article>
                    <span>source mappings</span>
                    <strong>{labAiMlFeaturePipeline.featureSourceMappingCount || labAiMlFeatureSources.length}</strong>
                  </article>
                  <article>
                    <span>rolling contracts</span>
                    <strong>{labAiMlFeaturePipeline.rollingFeatureContractCount || labAiMlRollingFeatureContracts.length}</strong>
                  </article>
                  <article>
                    <span>leakage / quality</span>
                    <strong>{labAiMlFeatureLeakageGuards.length} / {labAiMlFeatureQualityRules.length}</strong>
                  </article>
                  <article>
                    <span>validation</span>
                    <strong>{formatStatus(labAiMlFeaturePipeline.validation?.validationStatus || "design_only")}</strong>
                  </article>
                  <article>
                    <span>feature / dataset build</span>
                    <strong>{labAiMlFeaturePipelineStatus.featureGenerationAllowed ? "open" : "blocked"} / {labAiMlFeaturePipelineStatus.datasetBuildAllowed ? "open" : "blocked"}</strong>
                  </article>
                  <article>
                    <span>DB / provider / order</span>
                    <strong>{labAiMlFeaturePipelineStatus.dbWriteAllowed ? "open" : "blocked"} / {labAiMlFeaturePipelineStatus.providerCallsAllowed ? "open" : "blocked"} / {labAiMlFeaturePipelineStatus.orderSubmissionAllowed ? "open" : "blocked"}</strong>
                  </article>
                </div>
                <div className="tradingLabAiMlFeatureSourceGrid" aria-label="AI ML feature source mapping">
                  <article>
                    <span>Feature source mapping</span>
                    <strong>{labAiMlFeatureSources.length} contracts</strong>
                    <p>asset master, daily price, monthly return, dividend, benchmark, foreign exchange, market regime, portfolio snapshot, and dataset label registry are represented as mock architecture contracts.</p>
                  </article>
                  {labAiMlFeatureSources.map((source) => (
                    <article key={source.featureKey}>
                      <span>{source.sourceType}</span>
                      <strong>{source.featureKey}</strong>
                      <p>{source.featureGroup} / {source.sourceField}</p>
                      <p>time: {source.eventTimeField} / available: {source.availableAtField}</p>
                      <p>uses: {(source.allowedUses || []).join(" / ")}</p>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlFeatureContractGrid">
                  <section aria-label="AI ML point in time joins">
                    <span>Point-in-time joins</span>
                    <ul>
                      {(labAiMlFeaturePipeline.pointInTimeJoinPolicy?.requiredRules || []).map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                      <li>latest-known record selection: {labAiMlFeaturePipeline.pointInTimeJoinPolicy?.latestKnownRecordSelection}</li>
                      <li>future record rejection: {String(Boolean(labAiMlFeaturePipeline.pointInTimeJoinPolicy?.futureRecordRejection))}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML rolling feature contracts">
                    <span>Rolling feature contracts</span>
                    <ul>
                      {labAiMlRollingFeatureContracts.map((contract) => (
                        <li key={contract.featureKey}>{contract.featureKey}: {contract.windowSize} / min {contract.minimumPeriods} / {contract.insufficientHistoryPolicy}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML missing value policy">
                    <span>Missing-value policy</span>
                    <ul>
                      {(labAiMlFeaturePipeline.missingValuePolicy?.statuses || []).map((status) => (
                        <li key={status}>{status}</li>
                      ))}
                      <li>zero fill: {labAiMlFeaturePipeline.missingValuePolicy?.noUnconditionalZeroFill ? "forbidden" : "review required"}</li>
                      <li>imputation fit: {labAiMlFeaturePipeline.missingValuePolicy?.imputationFitScope}</li>
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlFeatureContractGrid">
                  <section aria-label="AI ML train only normalization">
                    <span>Train-only normalization</span>
                    <ul>
                      <li>fit scope: {labAiMlFeaturePipeline.trainOnlyNormalizationPolicy?.rules?.normalizerFitScope}</li>
                      <li>validation/test/inference: {labAiMlFeaturePipeline.trainOnlyNormalizationPolicy?.rules?.validationTestInferenceScope}</li>
                      <li>full dataset normalization: {labAiMlFeaturePipeline.trainOnlyNormalizationPolicy?.rules?.fullDatasetNormalization}</li>
                      <li>normalizers: {(labAiMlFeaturePipeline.trainOnlyNormalizationPolicy?.normalizerContracts || []).join(" / ")}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML feature versioning and lineage">
                    <span>Feature versioning and lineage</span>
                    <ul>
                      {(labAiMlFeaturePipeline.featureVersioningLineage?.lineageFields || []).map((fieldName) => (
                        <li key={fieldName}>{fieldName}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML leakage guards">
                    <span>Leakage guards</span>
                    <ul>
                      {labAiMlFeatureLeakageGuards.map((guard) => (
                        <li key={guard.guardKey}>{guard.guardKey}: {guard.severity} / {guard.failureCode}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlFeatureContractGrid">
                  <section aria-label="AI ML feature quality validation">
                    <span>Feature quality validation</span>
                    <ul>
                      {labAiMlFeatureQualityRules.map((rule) => (
                        <li key={rule}>{rule}</li>
                      ))}
                      <li>execution now: {labAiMlFeaturePipeline.featureQualityValidation?.validationExecutedNow ? "open" : "blocked"}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML dataset and training interfaces">
                    <span>Dataset/training interfaces</span>
                    <ul>
                      {Object.keys(labAiMlFeaturePipeline.datasetTrainingInterfaces?.requestContracts || {}).map((contractName) => (
                        <li key={contractName}>{contractName}</li>
                      ))}
                      <li>dataset builder: {labAiMlFeaturePipeline.datasetTrainingInterfaces?.datasetBuilderImplementedNow ? "implemented" : "blocked"}</li>
                      <li>training: {labAiMlFeaturePipeline.datasetTrainingInterfaces?.trainingProcessImplementedNow ? "implemented" : "blocked"}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML future feature store contract">
                    <span>Future feature store contract</span>
                    <ul>
                      {labAiMlFeatureStoreConcepts.map((concept) => (
                        <li key={concept}>{concept}</li>
                      ))}
                      <li>Supabase connection: {labAiMlFeaturePipeline.futureFeatureStoreContract?.supabaseConnectedNow ? "open" : "blocked"}</li>
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlFeatureSafetyGrid" aria-label="AI ML feature execution and persistence safety status">
                  <article>
                    <span>Execution and persistence safety status</span>
                    <strong>fail-closed</strong>
                  </article>
                  {[
                    ["feature generation blocked", labAiMlFeatureSafety.featureGenerationAttempted],
                    ["dataset build blocked", labAiMlFeatureSafety.datasetBuildAttempted],
                    ["training blocked", labAiMlFeatureSafety.modelTrainingAttempted],
                    ["file creation blocked", labAiMlFeatureSafety.featureFileCreated || labAiMlFeatureSafety.csvCreated || labAiMlFeatureSafety.parquetCreated],
                    ["DB read/write blocked", labAiMlFeatureSafety.supabaseSelectAttempted || labAiMlFeatureSafety.persistentDbWriteAttempted],
                    ["provider/KIS/order blocked", labAiMlFeatureSafety.providerCallAttempted || labAiMlFeatureSafety.kisCallAttempted || labAiMlFeatureSafety.orderSubmissionAttempted],
                    ["public UI exposure blocked", labAiMlFeaturePipelineStatus.publicUiExposureAllowed || labAiMlFeaturePipelineStatus.myPageExposureAllowed],
                  ].map(([label, attempted]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{attempted ? "review required" : "blocked"}</strong>
                    </article>
                  ))}
                </div>
              </div>
            </details>
            <details className="tradingLabAiMlFeaturePipelinePreflight" data-admin-panel-key="ai-ml-feature-pipeline-preflight">
              <summary>
                <span>AI/ML feature pipeline preflight</span>
                <strong>{formatStatus(labAiMlFeaturePreflight.overallStatus || "metadata_only_preflight")}</strong>
                <em>metadata validation only</em>
              </summary>
              <div className="tradingLabAiMlFeaturePipelinePreflightBody">
                <p className="tradingLabHistoryBrowserNotice">
                  This admin-only preflight validates metadata contracts, version pins, temporal boundaries, rolling-history requirements, missing-value policy, train-only normalization, leakage guards, quality gate configuration, and lineage references. It never runs feature generation, dataset build, training, file creation, DB read/write, provider/KIS/order calls, or public/My Page exposure.
                </p>
                <div className="tradingLabAiMlFeaturePreflightStatusGrid" aria-label="AI ML feature pipeline preflight status">
                  <article>
                    <span>contract status</span>
                    <strong>{formatStatus(labAiMlFeaturePreflight.contractStatus || "invalid")}</strong>
                  </article>
                  <article>
                    <span>execution status</span>
                    <strong>{formatStatus(labAiMlFeaturePreflight.executionStatus || "blocked")}</strong>
                  </article>
                  <article>
                    <span>overall status</span>
                    <strong>{formatStatus(labAiMlFeaturePreflight.overallStatus || "blocked_by_safety_policy")}</strong>
                  </article>
                  <article>
                    <span>metadata-only preflight</span>
                    <strong>{labAiMlFeaturePreflight.metadataOnlyPreflight === false ? "review required" : "true"}</strong>
                  </article>
                  <article>
                    <span>pass / fail / blocked</span>
                    <strong>{Number(labAiMlFeaturePreflight.passCount || 0)} / {Number(labAiMlFeaturePreflight.failCount || 0)} / {Number(labAiMlFeaturePreflight.blockedCount || 0)}</strong>
                  </article>
                  <article>
                    <span>version pinning</span>
                    <strong>{formatStatus(labAiMlFeaturePreflight.versionPinningStatus || "fail")}</strong>
                  </article>
                </div>
                <div className="tradingLabAiMlFeaturePreflightStatusGrid" aria-label="AI ML feature preflight validation category status">
                  {[
                    ["PIT validation", labAiMlFeaturePreflight.pointInTimeValidationStatus],
                    ["rolling history contract", labAiMlFeaturePreflight.rollingHistoryContractStatus],
                    ["missing-value policy", labAiMlFeaturePreflight.missingValuePolicyStatus],
                    ["train-only normalization", labAiMlFeaturePreflight.trainOnlyNormalizationStatus],
                    ["leakage guard", labAiMlFeaturePreflight.leakageGuardStatus],
                    ["quality gate configuration", labAiMlFeaturePreflight.qualityGateConfigurationStatus],
                    ["lineage/reproducibility", labAiMlFeaturePreflight.lineageReproducibilityStatus],
                  ].map(([label, status]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{formatStatus(status || "not_applicable")}</strong>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlFeaturePreflightContractGrid">
                  <section aria-label="AI ML feature preflight request contract summary">
                    <span>preflight request contract</span>
                    <ul>
                      <li>request: {labAiMlFeaturePreflight.requestContractSummary?.preflightRequestId || "missing"}</li>
                      <li>dataset: {labAiMlFeaturePreflight.requestContractSummary?.datasetSpecId || "missing"} / {labAiMlFeaturePreflight.requestContractSummary?.datasetSpecVersion || "missing"}</li>
                      <li>feature set: {labAiMlFeaturePreflight.requestContractSummary?.featureSetId || "missing"} / {labAiMlFeaturePreflight.requestContractSummary?.featureSetVersion || "missing"}</li>
                      <li>label: {labAiMlFeaturePreflight.requestContractSummary?.labelSpecId || "missing"} / {labAiMlFeaturePreflight.requestContractSummary?.labelSpecVersion || "missing"}</li>
                      <li>features: {Number(labAiMlFeaturePreflight.requestContractSummary?.requestedFeatureCount || 0)}</li>
                    </ul>
                  </section>
                  <section aria-label="AI ML feature preflight validation categories">
                    <span>validation categories</span>
                    <ul>
                      {(labAiMlFeaturePreflight.validationCategories || []).map((category) => (
                        <li key={category}>{formatStatus(category)}</li>
                      ))}
                    </ul>
                  </section>
                  <section aria-label="AI ML feature preflight deterministic scenarios">
                    <span>deterministic scenarios</span>
                    <ul>
                      {labAiMlFeaturePreflightScenarios.map((scenario) => (
                        <li key={scenario.scenarioId}>{formatStatus(scenario.scenarioId)}: {formatStatus(scenario.expectedOverallStatus)}</li>
                      ))}
                    </ul>
                  </section>
                </div>
                <div className="tradingLabAiMlFeaturePreflightCheckGrid" aria-label="AI ML feature preflight checks">
                  {labAiMlFeaturePreflightChecks.map((check) => (
                    <article key={check.checkId}>
                      <span>{formatStatus(check.category)}</span>
                      <strong>{formatStatus(check.status)} / {formatStatus(check.severity)}</strong>
                      <p>{check.message}</p>
                      <p>{check.remediation}</p>
                    </article>
                  ))}
                </div>
                <div className="tradingLabAiMlFeaturePreflightSafetyGrid" aria-label="AI ML feature preflight safety restrictions">
                  {[
                    ["metadata validation only", labAiMlFeaturePreflightStatus.metadataOnlyPreflightEvaluationAllowed],
                    ["feature generation blocked", labAiMlFeaturePreflightSafety.featureGenerationAttempted],
                    ["dataset build blocked", labAiMlFeaturePreflightSafety.datasetBuildAttempted],
                    ["training blocked", labAiMlFeaturePreflightSafety.modelTrainingAttempted],
                    ["file creation blocked", labAiMlFeaturePreflightSafety.featureFileCreated || labAiMlFeaturePreflightSafety.datasetFileCreated || labAiMlFeaturePreflightSafety.csvCreated || labAiMlFeaturePreflightSafety.parquetCreated],
                    ["DB read/write blocked", labAiMlFeaturePreflightSafety.dbReadAttempted || labAiMlFeaturePreflightSafety.dbWriteAttempted],
                    ["provider/KIS/order blocked", labAiMlFeaturePreflightSafety.providerCallAttempted || labAiMlFeaturePreflightSafety.kisCallAttempted || labAiMlFeaturePreflightSafety.orderSubmissionAttempted],
                    ["public UI exposure blocked", labAiMlFeaturePreflightSafety.publicUiExposed || labAiMlFeaturePreflightSafety.myPageUiExposed],
                  ].map(([label, value]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{label === "metadata validation only" ? (value ? "true" : "review required") : (value ? "review required" : "blocked")}</strong>
                    </article>
                  ))}
                </div>
              </div>
            </details>
          </div>
        </details>

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
            {hasMockEquityChartData ? (
              <>
                <svg className="tradingLabLineChart" viewBox="0 0 320 120" role="img" aria-label="모의 일별 자산 변화">
                  <polyline points={equitySparklinePoints} fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
                <div className="tradingLabChartLegend">
                  {labEquityPoints.map((point) => (
                    <span key={point.date}>{point.date}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className="tradingLabEmptyChartPlaceholder" role="note">
                <strong>mock run 데이터 대기</strong>
                <p>{TRADING_LAB_EMPTY_CHART_NOTICE}</p>
              </div>
            )}
          </article>

          <article className="tradingLabChartCard">
            <span>수익률 경로</span>
            {hasMockReturnChartData ? (
              <>
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
              </>
            ) : (
              <div className="tradingLabEmptyChartPlaceholder" role="note">
                <strong>수익률 경로 대기</strong>
                <p>모의 운용 결과가 준비되면 이 영역에 수익률 경로와 drawdown 정보를 표시합니다.</p>
              </div>
            )}
          </article>

          <article className="tradingLabChartCard tradingLabAllocationCard">
            <span>현재 자산분포</span>
            {hasMockAllocationData ? (
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
            ) : (
              <div className="tradingLabEmptyChartPlaceholder" role="note">
                <strong>자산분포 대기</strong>
                <p>모의 포지션 데이터가 준비되면 현재 자산분포가 표시됩니다.</p>
              </div>
            )}
          </article>
        </div>

        <details className="tradingLabDetailChainShell" data-admin-panel-key="trading-lab-detail-chain" data-default-collapsed="true">
          <summary>
            <span>상세 검증 로그</span>
            <strong>{detailGroupCount}개 그룹</strong>
            <em>최근 핵심 상태만 표시 · 상세 검증 이력 펼쳐보기</em>
          </summary>
          <div className="tradingLabDetailChainGroups" aria-label="상세 검증 로그 그룹 요약">
            {TRADING_LAB_DETAIL_GROUPS.map((group) => (
              <article key={group.groupId} data-trading-lab-detail-group={group.groupId}>
                <span>{group.stepRange}</span>
                <strong>{group.title}</strong>
                <small>접힌 상세 로그에서 확인</small>
              </article>
            ))}
          </div>
          <div className="tradingLabDetailChainBody">
        <div className="tradingLabGrid tradingLabDetailChainGrid">
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

          <article className="tradingLabSection tradingLabMockDashboardCleanupCore" data-admin-panel-key="trading-lab-mock-dashboard-cleanup-core">
            <span>Mock dashboard cleanup core</span>
            <h4>{formatStatus(labMockDashboardCleanupCoreResult.cleanupStatus || labMockDashboardCleanupCoreStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This is a FINPLE internal mock dashboard cleanup core result. It reorganizes the admin mock dashboard into summary-first read-only groups using the Step161 mock trading run summary result, does not delete existing sections, does not write DB state, and keeps KIS/provider/order/live gates blocked.
            </p>
            <div className="tradingLabReviewCards tradingLabMockDashboardCleanupCoreCards">
              <div>
                <span>Cleanup result</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreResult.cleanupStatus || "validation_required")}</strong>
                <small>{labMockDashboardCleanupCoreResult.dashboardCleanupResultId || "step164_mock_dashboard_cleanup_result"}</small>
              </div>
              <div>
                <span>Summary source</span>
                <strong>{labMockDashboardCleanupCoreResult.tradingRunSummaryResultId || "step161_mock_trading_run_summary_result"}</strong>
                <small>Step161 mock summary</small>
              </div>
              <div>
                <span>Summary-first layout</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreValidation.summaryFirstLayoutStatus || labMockDashboardSummaryFirstLayout.status || "validation_required")}</strong>
                <small>{labMockDashboardSummaryFirstLayout.summaryFirst ? "summary first" : "validation required"}</small>
              </div>
              <div>
                <span>KPI source alignment</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreResult.kpiSourceAlignment || "validation_required")}</strong>
                <small>{formatStatus(labMockDashboardSummaryFirstLayout.kpi?.sourceAlignment || "step161_summary_result")}</small>
              </div>
              <div>
                <span>Chart source alignment</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreResult.chartSourceAlignment || "validation_required")}</strong>
                <small>{formatStatus(labMockDashboardSummaryFirstLayout.charts?.sourceAlignment || "step161_chart_aggregation")}</small>
              </div>
              <div>
                <span>Allocation source alignment</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreResult.allocationSourceAlignment || "validation_required")}</strong>
                <small>Step161 mock aggregation</small>
              </div>
              <div>
                <span>Collapsible detail groups</span>
                <strong>{labMockDashboardCollapsibleDetailGroupResult.groupCount ?? labMockDashboardCleanupCoreGroups.length}</strong>
                <small>{formatStatus(labMockDashboardCleanupCoreValidation.collapsibleDetailGroupStatus || labMockDashboardCollapsibleDetailGroupResult.status || "validation_required")}</small>
              </div>
              <div>
                <span>Safety separation</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreResult.safetyPanelSeparationStatus || "blocked")}</strong>
                <small>Lab and safety stay separated</small>
              </div>
              <div>
                <span>Dangerous action labels</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreResult.dangerousActionLabelStatus || "absent")}</strong>
                <small>No live action labels</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockDashboardCleanupCoreResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockDashboardCleanupCoreResult.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Next step</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreResult.nextAllowedStep || "mock_dashboard_cleanup_core_review")}</strong>
                <small>Admin mock-only</small>
              </div>
            </div>
            <div className="tradingLabDashboardSummaryFirstGrid" aria-label="Mock dashboard cleanup core summary-first layout">
              <section>
                <span>Overview</span>
                <strong>{formatStatus(labMockDashboardSummaryFirstLayout.overview?.summaryStatus || labMockTradingRunSummaryCoreResult.summaryStatus || "validation_required")}</strong>
                <small>Not real trading / no KIS call / no order submission / no DB write</small>
              </section>
              <section>
                <span>KPI</span>
                <strong>{Number(labMockDashboardSummaryFirstLayout.kpi?.totalEquity || labMockTradingRunSummaryPerformanceSummary.totalEquity || 0).toLocaleString("ko-KR")}</strong>
                <small>Return {Number(labMockDashboardSummaryFirstLayout.kpi?.cumulativeReturn || labMockTradingRunSummaryPerformanceSummary.cumulativeReturn || 0).toFixed(4)}% / MDD {Number(labMockDashboardSummaryFirstLayout.kpi?.mdd || labMockTradingRunSummaryPerformanceSummary.mdd || 0).toFixed(4)}%</small>
              </section>
              <section>
                <span>Strategy</span>
                <strong>{labMockDashboardSummaryFirstLayout.strategy?.strategyName || labMockTradingRunSummaryStrategySummary.strategyName || "Admin mock strategy draft"}</strong>
                <small>{formatStatus(labMockDashboardSummaryFirstLayout.strategy?.mode || "mock")}</small>
              </section>
              <section>
                <span>Mock run summary</span>
                <strong>{formatStatus(labMockDashboardSummaryFirstLayout.mockRunSummary?.performanceStatus || "mock_only")}</strong>
                <small>{formatStatus(labMockDashboardSummaryFirstLayout.mockRunSummary?.safetyStatus || "blocked")}</small>
              </section>
            </div>
            <ul className="tradingLabReviewList tradingLabMockDashboardCleanupCoreList" aria-label="Mock dashboard cleanup core guardrails">
              <li>{labMockDashboardCleanupCoreResult.dashboardCleanupReviewResultId || "step163_mock_dashboard_cleanup_review_result"} / Step163 dependency required / Step164 mock dashboard cleanup core only</li>
              <li>No KIS/provider call, no KIS token, no quote query, no order submission, no DB write, and no account balance query.</li>
              <li>No actual trading run id, order id, execution id, fill id, performance record, cash update, position update, portfolio ledger update, or trading run summary update is created.</li>
              <li>Existing Step132B through Step163 sections remain available; this core only adds a summary-first grouping result.</li>
              <li>Admin mock cleanup core is visible only in the trading lab; My Page, homepage, and public routes do not expose this UI.</li>
              <li>Next allowed step: {formatStatus(labMockDashboardCleanupCoreResult.nextAllowedStep || "mock_dashboard_cleanup_core_review")}</li>
              {(labMockDashboardCleanupCoreValidation.blockerSummary || labMockDashboardCleanupCoreValidation.blockers || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-core-blocker-${index}`}>{message}</li>
              ))}
              {(labMockDashboardCleanupCoreValidation.warningSummary || labMockDashboardCleanupCoreValidation.warnings || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-core-warning-${index}`}>{message}</li>
              ))}
              {labMockDashboardCleanupCoreHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-dashboard-cleanup-core-history-${index}`}>{item.historyId || `mock_dashboard_cleanup_core_history_${index + 1}`} / {formatStatus(item.cleanupStatus || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_dashboard_cleanup_core_review")}</li>
              ))}
            </ul>
            <details className="tradingLabCleanupDetails">
              <summary>Primary summary sections</summary>
              <ul className="tradingLabReviewList tradingLabMockDashboardCleanupCoreList">
                {labMockDashboardCleanupCoreVisibleSections.map((sectionId) => (
                  <li key={`mock-dashboard-cleanup-core-primary-${sectionId}`}>{sectionId} / summary-first primary surface</li>
                ))}
                {labMockDashboardCleanupCoreVisibleSections.length === 0 ? (
                  <li>Summary-first primary sections remain validation-required; no existing admin mock section is removed.</li>
                ) : null}
              </ul>
            </details>
            <details className="tradingLabCleanupDetails">
              <summary>Collapsible detail chain groups</summary>
              <ul className="tradingLabReviewList tradingLabMockDashboardCleanupCoreList">
                {labMockDashboardCleanupCoreGroups.map((group) => (
                  <li key={`mock-dashboard-cleanup-core-group-${group.groupId}`}>{group.groupId} / {group.title} / {group.defaultCollapsed ? "default collapsed" : "validation required"} / preserved</li>
                ))}
                {labMockDashboardCleanupCoreGroups.length === 0 ? (
                  <li>Detail grouping remains validation-required; no existing admin mock section is removed.</li>
                ) : null}
              </ul>
            </details>
          </article>

          <article className="tradingLabSection tradingLabMockDashboardCleanupCoreReview" data-admin-panel-key="trading-lab-mock-dashboard-cleanup-core-review-result">
            <span>Mock dashboard cleanup core review result</span>
            <h4>{formatStatus(labMockDashboardCleanupCoreReviewResult.reviewStatus || labMockDashboardCleanupCoreReviewResultStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This is a FINPLE internal mock dashboard cleanup core review receipt only. It reviews the Step164 summary-first dashboard cleanup result, does not run additional cleanup, does not delete sections, does not write DB state, and keeps KIS/provider/order/live gates blocked.
            </p>
            <div className="tradingLabReviewCards tradingLabMockDashboardCleanupCoreReviewCards">
              <div>
                <span>Review receipt</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewReceipt.reviewStatus || "validation_required")}</strong>
                <small>{labMockDashboardCleanupCoreReviewReceipt.receiptId || "step165_mock_dashboard_cleanup_core_review_receipt"}</small>
              </div>
              <div>
                <span>Decision</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewResult.decision || "blocked")}</strong>
                <small>Mock review only</small>
              </div>
              <div>
                <span>Summary-first review</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewSummary.summaryFirstLayoutReviewStatus || "validation_required")}</strong>
                <small>{labMockDashboardCleanupCoreReviewReceipt.dashboardCleanupResultId || "step164_mock_dashboard_cleanup_result"}</small>
              </div>
              <div>
                <span>KPI source review</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewSummary.kpiSourceAlignmentReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockDashboardCleanupCoreReviewSummary.kpiSourceAlignment || "aligned")}</small>
              </div>
              <div>
                <span>Chart source review</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewSummary.chartSourceAlignmentReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockDashboardCleanupCoreReviewSummary.chartSourceAlignment || "aligned")}</small>
              </div>
              <div>
                <span>Allocation source review</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewSummary.allocationSourceAlignmentReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labMockDashboardCleanupCoreReviewSummary.allocationSourceAlignment || "aligned")}</small>
              </div>
              <div>
                <span>Collapsible groups</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewSummary.collapsibleGroupReviewStatus || "validation_required")}</strong>
                <small>{labMockDashboardCleanupCoreReviewSummary.collapsibleGroupCount ?? 0} reviewed groups</small>
              </div>
              <div>
                <span>Safety separation</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewSummary.safetyPanelSeparationReviewStatus || "validation_required")}</strong>
                <small>Lab and safety stay separated</small>
              </div>
              <div>
                <span>Action labels</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewSummary.dangerousActionLabelReviewStatus || "validation_required")}</strong>
                <small>No live action labels</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewReceipt.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockDashboardCleanupCoreReviewReceipt.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewReceipt.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockDashboardCleanupCoreReviewReceipt.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Next step</span>
                <strong>{formatStatus(labMockDashboardCleanupCoreReviewReceipt.nextAllowedStep || "mock_trading_lab_dashboard_ux_polish_preflight")}</strong>
                <small>Admin mock-only</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockDashboardCleanupCoreReviewList" aria-label="Mock dashboard cleanup core review result guardrails">
              <li>{labMockDashboardCleanupCoreReviewResult.dashboardCleanupCoreReviewResultId || "step165_mock_dashboard_cleanup_core_review_result"} / Step165 redacted receipt / FINPLE internal mock dashboard cleanup core review only</li>
              <li>{labMockDashboardCleanupCoreReviewReceipt.dashboardCleanupResultId || "step164_mock_dashboard_cleanup_result"} / Step164 dependency required / no additional cleanup execution.</li>
              <li>No KIS/provider call, no KIS token, no quote query, no order submission, no DB write, and no account balance query.</li>
              <li>No real trading run identifier, order identifier, execution identifier, fill identifier, performance record, cash update, position update, portfolio ledger update, or trading run summary update is created.</li>
              <li>Safety panel and mock trading lab stay separated; dangerous live action labels remain absent.</li>
              <li>My Page, homepage, and public routes do not expose this mock dashboard cleanup core review UI.</li>
              <li>Next allowed step: {formatStatus(labMockDashboardCleanupCoreReviewReceipt.nextAllowedStep || "mock_trading_lab_dashboard_ux_polish_preflight")}</li>
              {(labMockDashboardCleanupCoreReviewValidation.blockerSummary || labMockDashboardCleanupCoreReviewValidation.blockers || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-core-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockDashboardCleanupCoreReviewValidation.warningSummary || labMockDashboardCleanupCoreReviewValidation.warnings || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-core-review-warning-${index}`}>{message}</li>
              ))}
              {(labMockDashboardCleanupCoreReviewDecisionSummary.summary || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-core-review-decision-${index}`}>{message}</li>
              ))}
              {labMockDashboardCleanupCoreReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-dashboard-cleanup-core-review-history-${index}`}>{item.historyId || `mock_dashboard_cleanup_core_review_history_${index + 1}`} / {formatStatus(item.reviewStatus || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_trading_lab_dashboard_ux_polish_preflight")}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabDashboardUxPolishPreflight" data-admin-panel-key="trading-lab-dashboard-ux-polish-preflight">
            <span>모의 대시보드 UX 정리 사전검토</span>
            <h4>{formatStatus(labDashboardUxPolishResult.status || labDashboardUxPolishPreflightStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              이 사전검토는 FINPLE 내부 mock trading lab 화면 정리 준비 상태만 확인합니다. 실제 거래 결과, 외부 provider 호출, 주문 제출, DB 저장, 계좌 잔고 조회 없이 read-only로 유지됩니다.
            </p>
            <div className="tradingLabReviewCards tradingLabDashboardUxPolishCards">
              <div>
                <span>Summary-first</span>
                <strong>{formatStatus(labDashboardUxPolishResult.summaryReadabilityStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishSummaryFirst.mockRunSummaryProminent ? "mock run summary first" : "validation required"}</small>
              </div>
              <div>
                <span>Top KPI</span>
                <strong>{formatStatus(labDashboardUxPolishResult.kpiReadabilityStatus || "validation_required")}</strong>
                <small>KPI before detail chain</small>
              </div>
              <div>
                <span>Chart / allocation</span>
                <strong>{formatStatus(labDashboardUxPolishResult.chartReadabilityStatus || "validation_required")}</strong>
                <small>{formatStatus(labDashboardUxPolishResult.allocationReadabilityStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Detail chain</span>
                <strong>{formatStatus(labDashboardUxPolishResult.collapsibleDefaultStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishDuplicateVerboseDetection.detailChainDefaultCollapsed ? "default collapsed" : "check required"}</small>
              </div>
              <div>
                <span>Duplicate / verbose</span>
                <strong>{formatStatus(labDashboardUxPolishResult.duplicateSectionStatus || "validation_required")}</strong>
                <small>{formatStatus(labDashboardUxPolishResult.verboseSectionStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Korean labels</span>
                <strong>{formatStatus(labDashboardUxPolishResult.koreanLabelStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishKoreanLabels.length} label mappings</small>
              </div>
              <div>
                <span>Safety notice</span>
                <strong>{formatStatus(labDashboardUxPolishResult.safetyNoticeStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishSafetyNotice.noDbWriteNoticeVisible ? "DB write notice visible" : "validation required"}</small>
              </div>
              <div>
                <span>Action labels</span>
                <strong>{formatStatus(labDashboardUxPolishResult.dangerousActionLabelStatus || "validation_required")}</strong>
                <small>No public action label</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labDashboardUxPolishResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labDashboardUxPolishResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labDashboardUxPolishResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labDashboardUxPolishResult.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Next step</span>
                <strong>{formatStatus(labDashboardUxPolishResult.nextAllowedStep || "mock_dashboard_ux_polish_review_result")}</strong>
                <small>Admin mock-only</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabDashboardUxPolishList" aria-label="Dashboard UX polish preflight guardrails">
              <li>{labDashboardUxPolishResult.uxPolishPreflightId || "step167_dashboard_ux_polish_preflight"} / Step167 redacted preflight / FINPLE internal mock dashboard UX polish readiness only</li>
              <li>{labDashboardUxPolishResult.dashboardCleanupCoreReviewResultId || "step165_mock_dashboard_cleanup_core_review_result"} / Step165 dependency required / no cleanup execution.</li>
              <li>실제 거래 결과 아님 / 외부 provider 호출 없음 / 주문 제출 없음 / DB 저장 없음 / 계좌 잔고 조회 없음.</li>
              <li>실제 현금, 포지션, portfolio ledger, performance record, trading run summary를 변경하지 않습니다.</li>
              <li>Safety panel and mock trading lab stay separated; My Page, homepage, and public routes do not expose this UX polish UI.</li>
              <li>다음 허용 단계: {formatStatus(labDashboardUxPolishResult.nextAllowedStep || "mock_dashboard_ux_polish_review_result")}</li>
              {(labDashboardUxPolishValidation.blockerSummary || labDashboardUxPolishValidation.blockers || []).map((message, index) => (
                <li key={`dashboard-ux-polish-blocker-${index}`}>{message}</li>
              ))}
              {(labDashboardUxPolishValidation.warningSummary || labDashboardUxPolishValidation.warnings || []).map((message, index) => (
                <li key={`dashboard-ux-polish-warning-${index}`}>{message}</li>
              ))}
            </ul>
            <details className="tradingLabCleanupDetails">
              <summary>UX polish target inventory</summary>
              <ul className="tradingLabReviewList tradingLabDashboardUxPolishTargetList">
                {labDashboardUxPolishTargets.map((target) => (
                  <li key={target.targetId}>{target.targetLabel} / {target.targetGroup} / {target.priority} / {target.defaultCollapsed ? "default collapsed" : "visible"}</li>
                ))}
              </ul>
            </details>
          </article>

          <article className="tradingLabSection tradingLabDashboardUxPolishReviewResult" data-admin-panel-key="trading-lab-dashboard-ux-polish-review-result">
            <span>모의 대시보드 UX 정리 검토 결과</span>
            <h4>{formatStatus(labDashboardUxPolishReviewResult.reviewStatus || labDashboardUxPolishReviewResultStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              이 검토 결과는 FINPLE 내부 mock trading lab 화면 정리 검토용입니다. 실제 거래 실행 결과, 실제 계좌 성과, DB write, KIS 호출, 주문 제출 없이 read-only로 유지됩니다.
            </p>
            <div className="tradingLabReviewCards tradingLabDashboardUxPolishReviewCards">
              <div>
                <span>Decision</span>
                <strong>{formatStatus(labDashboardUxPolishReviewResult.decision || "blocked")}</strong>
                <small>{labDashboardUxPolishReviewResult.reviewedBy || "admin_placeholder"}</small>
              </div>
              <div>
                <span>Receipt</span>
                <strong>{formatStatus(labDashboardUxPolishReviewReceipt.reviewStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishReviewReceipt.receiptId || "step168_dashboard_ux_polish_review_receipt"}</small>
              </div>
              <div>
                <span>UX target inventory</span>
                <strong>{formatStatus(labDashboardUxPolishTargetReviewSummary.status || "validation_required")}</strong>
                <small>{labDashboardUxPolishTargetReviewSummary.targetCount ?? 0} targets reviewed</small>
              </div>
              <div>
                <span>Duplicate / verbose</span>
                <strong>{formatStatus(labDashboardUxPolishDuplicateVerboseReviewSummary.status || "validation_required")}</strong>
                <small>{formatStatus(labDashboardUxPolishDuplicateVerboseReviewSummary.verboseSectionStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Korean label polish</span>
                <strong>{formatStatus(labDashboardUxPolishKoreanLabelReviewSummary.status || "validation_required")}</strong>
                <small>{labDashboardUxPolishKoreanLabelReviewSummary.labelMappingCount ?? 0} mappings</small>
              </div>
              <div>
                <span>Summary-first</span>
                <strong>{formatStatus(labDashboardUxPolishReadabilityReviewSummary.summaryFirstReadabilityReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labDashboardUxPolishReadabilityReviewSummary.mockRunSummaryProminenceReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>KPI / chart / allocation</span>
                <strong>{formatStatus(labDashboardUxPolishReadabilityReviewSummary.kpiReadabilityReviewStatus || "validation_required")}</strong>
                <small>{formatStatus(labDashboardUxPolishReadabilityReviewSummary.chartReadabilityReviewStatus || "validation_required")} / {formatStatus(labDashboardUxPolishReadabilityReviewSummary.allocationReadabilityReviewStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Safety notice</span>
                <strong>{formatStatus(labDashboardUxPolishSafetyReviewSummary.safetyNoticeReviewStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishSafetyReviewSummary.noDbWriteNoticeVisible ? "DB write notice visible" : "validation required"}</small>
              </div>
              <div>
                <span>Action labels</span>
                <strong>{formatStatus(labDashboardUxPolishSafetyReviewSummary.dangerousActionLabelReviewStatus || "validation_required")}</strong>
                <small>No dangerous action label</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labDashboardUxPolishReviewReceipt.readinessImpact || "none")}</strong>
                <small>{formatStatus(labDashboardUxPolishReviewReceipt.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labDashboardUxPolishReviewReceipt.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labDashboardUxPolishReviewReceipt.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Next step</span>
                <strong>{formatStatus(labDashboardUxPolishReviewReceipt.nextAllowedStep || "mock_dashboard_ux_polish_core")}</strong>
                <small>Admin mock-only</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabDashboardUxPolishReviewList" aria-label="Dashboard UX polish review result guardrails">
              <li>{labDashboardUxPolishReviewResult.uxPolishReviewResultId || "step168_dashboard_ux_polish_review_result"} / Step168 redacted receipt / FINPLE internal mock dashboard UX polish review only</li>
              <li>{labDashboardUxPolishReviewResult.uxPolishPreflightId || "step167_dashboard_ux_polish_preflight"} / Step167 dependency required / no UX polish core execution.</li>
              <li>실제 거래 실행 결과 아님 / 실제 사용자 성과 확정 아님 / 실제 계좌 성과 아님 / 실제 DB write 없음.</li>
              <li>실제 현금, 포지션, portfolio ledger, performance record, trading run summary를 변경하지 않습니다.</li>
              <li>KIS 호출 영향 없음 / 실제 주문 권한 영향 없음 / 실거래 준비 상태: 차단 유지.</li>
              <li>Safety panel and mock trading lab stay separated; My Page, homepage, and public routes do not expose this UX polish review UI.</li>
              <li>다음 허용 단계: {formatStatus(labDashboardUxPolishReviewReceipt.nextAllowedStep || "mock_dashboard_ux_polish_core")}</li>
              {labDashboardUxPolishDecisionMessages.map((message, index) => (
                <li key={`dashboard-ux-polish-review-decision-${index}`}>{message}</li>
              ))}
              {labDashboardUxPolishReviewBlockers.map((message, index) => (
                <li key={`dashboard-ux-polish-review-blocker-${index}`}>{message}</li>
              ))}
              {labDashboardUxPolishReviewWarnings.map((message, index) => (
                <li key={`dashboard-ux-polish-review-warning-${index}`}>{message}</li>
              ))}
            </ul>
          </article>

          <article className="tradingLabSection tradingLabDashboardUxPolishCore" data-admin-panel-key="trading-lab-dashboard-ux-polish-core">
            <span>대시보드 UX 정리 core</span>
            <h4>{formatStatus(labDashboardUxPolishCoreResult.polishStatus || labDashboardUxPolishCoreStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              이 화면은 FINPLE 내부 mock trading lab입니다. KIS/provider 호출, 주문 제출, 실계좌 조회, DB 저장 없이 관리자 전용 모의 계산 결과만 summary-first로 정리합니다.
            </p>
            <div className="tradingLabSafetyBadges tradingLabDashboardUxPolishCoreBadges" aria-label="Dashboard UX polish core safety badges">
              <span>실거래 아님</span>
              <span>KIS 호출 없음</span>
              <span>주문 제출 없음</span>
              <span>DB 저장 없음</span>
              <span>거래 권한 차단 유지</span>
            </div>
            <div className="tradingLabReviewCards tradingLabDashboardUxPolishCoreCards">
              <div>
                <span>모의 거래 실행 요약</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.polishStatus || "blocked")}</strong>
                <small>{labDashboardUxPolishCoreResult.uxPolishCoreResultId || "step169_dashboard_ux_polish_core_result"}</small>
              </div>
              <div>
                <span>주요 KPI cards</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.kpiReadabilityStatus || "validation_required")}</strong>
                <small>summary-first</small>
              </div>
              <div>
                <span>수익률 경로</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.chartReadabilityStatus || "validation_required")}</strong>
                <small>chart before detail chain</small>
              </div>
              <div>
                <span>현재 자산분포</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.allocationReadabilityStatus || "validation_required")}</strong>
                <small>allocation snapshot</small>
              </div>
              <div>
                <span>상세 검토 체인</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.collapsibleDetailStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishCoreGroups.length} collapsed groups</small>
              </div>
              <div>
                <span>한글 라벨</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.koreanLabelStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishCoreLabels.length} labels</small>
              </div>
              <div>
                <span>안전 안내</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.safetyNoticeStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishSafetyNoticePolish.noDbWriteNoticeVisible ? "DB 저장 없음 표시" : "validation required"}</small>
              </div>
              <div>
                <span>위험한 action label</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.dangerousActionLabelStatus || "validation_required")}</strong>
                <small>{labDashboardUxPolishSafetyNoticePolish.dangerousActionLabelsPresent ? "review required" : "미노출"}</small>
              </div>
              <div>
                <span>중복/장문 정리</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.duplicateVerboseStatus || "validation_required")}</strong>
                <small>{formatStatus(labDashboardUxPolishDuplicateVerboseCleanup.verboseSectionStatus || "validation_required")}</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.readinessImpact || "none")}</strong>
                <small>{formatStatus(labDashboardUxPolishCoreResult.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labDashboardUxPolishCoreResult.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Next step</span>
                <strong>{formatStatus(labDashboardUxPolishCoreResult.nextAllowedStep || "mock_dashboard_ux_polish_review")}</strong>
                <small>Admin mock-only</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabDashboardUxPolishCoreList" aria-label="Dashboard UX polish core guardrails">
              <li>{labDashboardUxPolishCoreResult.uxPolishReviewResultId || "step168_dashboard_ux_polish_review_result"} / Step168 dependency required / redacted review result only.</li>
              <li>요약, KPI, 차트, 자산분포를 먼저 보여주고 세부 검토 체인은 접힌 그룹으로 아래에 둡니다.</li>
              <li>{labDashboardUxPolishSafetyNoticePolish.noticeText || "KIS/provider 호출, 주문 제출, 실계좌 조회, DB 저장 없음."}</li>
              <li>{labDashboardUxPolishSafetyNoticePolish.orderAuthorityNoticeText || "거래 권한은 차단 상태이며 관리자 전용 모의 계산 결과만 표시합니다."}</li>
              <li>Safety panel and mock trading lab stay separated; My Page, homepage, and public routes do not expose this UX polish core UI.</li>
              <li>다음 허용 단계: {formatStatus(labDashboardUxPolishCoreResult.nextAllowedStep || "mock_dashboard_ux_polish_review")}</li>
              {labDashboardUxPolishCoreTopOrder.map((item, index) => (
                <li key={`dashboard-ux-polish-core-order-${item}`}>{index + 1}. {formatStatus(item)}</li>
              ))}
              {labDashboardUxPolishCoreBlockers.map((message, index) => (
                <li key={`dashboard-ux-polish-core-blocker-${index}`}>{message}</li>
              ))}
              {labDashboardUxPolishCoreWarnings.map((message, index) => (
                <li key={`dashboard-ux-polish-core-warning-${index}`}>{message}</li>
              ))}
            </ul>
            <details className="tradingLabCleanupDetails tradingLabDashboardUxPolishCoreDetails">
              <summary>상세 검토 체인 그룹</summary>
              <ul className="tradingLabReviewList tradingLabDashboardUxPolishCoreList">
                {labDashboardUxPolishCoreGroups.map((group) => (
                  <li key={group.groupId}>{group.label} / {group.stepRange} / {group.defaultCollapsed ? "기본 접힘" : "펼침 검토 필요"}</li>
                ))}
              </ul>
            </details>
            <details className="tradingLabCleanupDetails tradingLabDashboardUxPolishCoreDetails">
              <summary>한글 라벨 정리</summary>
              <ul className="tradingLabReviewList tradingLabDashboardUxPolishCoreList">
                {labDashboardUxPolishCoreLabels.map((label) => (
                  <li key={label.sourceLabel}>{label.sourceLabel} / {label.displayLabel}</li>
                ))}
              </ul>
            </details>
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

          <article className="tradingLabSection tradingLabMockDashboardCleanupReviewResult" data-admin-panel-key="trading-lab-mock-dashboard-cleanup-review-result">
            <span>모의 대시보드 정리 검토 결과</span>
            <h4>{formatStatus(labMockDashboardCleanupReviewResult.reviewStatus || labMockDashboardCleanupReviewResultStatus.status || "validation_required")}</h4>
            <p className="tradingLabMutedText">
              This is a FINPLE internal mock dashboard cleanup review receipt only. It confirms the Step162 summary-first cleanup plan as redacted admin review data, does not mutate accounts or DB state, and keeps KIS/provider/order/live gates blocked.
            </p>
            <div className="tradingLabReviewCards tradingLabMockDashboardCleanupReviewCards">
              <div>
                <span>Review receipt</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewReceipt.reviewStatus || "validation_required")}</strong>
                <small>{labMockDashboardCleanupReviewReceipt.receiptId || "step163_mock_dashboard_cleanup_review_receipt"}</small>
              </div>
              <div>
                <span>Decision</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewResult.decision || "blocked")}</strong>
                <small>{labMockDashboardCleanupReviewResult.reviewedBy || "admin_placeholder"}</small>
              </div>
              <div>
                <span>Section inventory review</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewSectionSummary.sectionInventoryReviewStatus || "validation_required")}</strong>
                <small>Deterministic mock inventory</small>
              </div>
              <div>
                <span>Priority layout review</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewSectionSummary.priorityLayoutReviewStatus || "validation_required")}</strong>
                <small>Summary-first admin mock layout</small>
              </div>
              <div>
                <span>Collapsible plan review</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewSectionSummary.collapsibleSectionPlanReviewStatus || "validation_required")}</strong>
                <small>No existing section deletion</small>
              </div>
              <div>
                <span>Safety separation</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewSectionSummary.safetyPanelSeparationReviewStatus || "blocked")}</strong>
                <small>Lab and safety panels remain separated</small>
              </div>
              <div>
                <span>Source alignment</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewSectionSummary.sourceAlignmentReviewStatus || "validation_required")}</strong>
                <small>KPI, chart, allocation mock sources</small>
              </div>
              <div>
                <span>Readiness impact</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewReceipt.readinessImpact || "none")}</strong>
                <small>{formatStatus(labMockDashboardCleanupReviewReceipt.liveTradingImpact || "blocked")}</small>
              </div>
              <div>
                <span>Provider / order impact</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewReceipt.providerCallImpact || "blocked")}</strong>
                <small>{formatStatus(labMockDashboardCleanupReviewReceipt.orderSubmissionImpact || "blocked")}</small>
              </div>
              <div>
                <span>Next step</span>
                <strong>{formatStatus(labMockDashboardCleanupReviewReceipt.nextAllowedStep || "mock_dashboard_cleanup_core")}</strong>
                <small>Admin mock-only</small>
              </div>
            </div>
            <ul className="tradingLabReviewList tradingLabMockDashboardCleanupReviewList" aria-label="Mock dashboard cleanup review result guardrails">
              <li>{labMockDashboardCleanupReviewResult.dashboardCleanupReviewResultId || "step163_mock_dashboard_cleanup_review_result"} / {formatStatus(labMockDashboardCleanupReviewResult.reviewStatus || "validation_required")} / FINPLE internal mock dashboard cleanup review only</li>
              <li>{labMockDashboardCleanupReviewResult.dashboardCleanupPreflightId || "step162_mock_dashboard_cleanup_preflight"} / Step162 dependency required</li>
              <li>Not an actual trading execution result, not an actual account result, and not an investment recommendation.</li>
              <li>No DB write, no KIS/provider call, no KIS token, no quote query, no order submission, and no account balance query.</li>
              <li>No actual trading run id, order id, execution id, fill id, performance record, cash update, position update, portfolio ledger update, or trading run summary update is created.</li>
              <li>KIS calls and order submission remain blocked; live trading readiness remains blocked.</li>
              <li>Admin mock cleanup review is visible only in the trading lab; My Page, homepage, and public routes do not expose this review UI.</li>
              <li>Next allowed step: {formatStatus(labMockDashboardCleanupReviewReceipt.nextAllowedStep || "mock_dashboard_cleanup_core")}</li>
              {(labMockDashboardCleanupReviewValidation.blockerSummary || labMockDashboardCleanupReviewValidation.blockers || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-review-blocker-${index}`}>{message}</li>
              ))}
              {(labMockDashboardCleanupReviewValidation.warningSummary || labMockDashboardCleanupReviewValidation.warnings || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-review-warning-${index}`}>{message}</li>
              ))}
              {(labMockDashboardCleanupReviewDecisionSummary.messages || []).map((message, index) => (
                <li key={`mock-dashboard-cleanup-review-decision-${index}`}>{message}</li>
              ))}
              {labMockDashboardCleanupReviewHistory.slice(0, 2).map((item, index) => (
                <li key={`mock-dashboard-cleanup-review-history-${index}`}>{item.historyId || `mock_dashboard_cleanup_review_history_${index + 1}`} / {formatStatus(item.reviewStatus || "blocked")} / {formatStatus(item.nextAllowedStep || "mock_dashboard_cleanup_core")}</li>
              ))}
            </ul>
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
        </details>
      </div>

    </section>
      ) : null}

      {activeTradingPanelTab === "safety" ? (
    <section className="accountCard tradingReadinessPanel tradingSafetyPanel tradingSafetyPanelDetails" data-admin-panel-key="trading-safety-details">
      <details className="tradingSafetyDetailChainShell" data-admin-panel-key="trading-safety-detail-chain" data-default-collapsed="true">
        <summary>
          <span>상세 검증 이력 펼쳐보기</span>
          <strong>최근 운영 상태만 기본 표시</strong>
          <em>read-only</em>
        </summary>
        <div className="tradingSafetyDetailChainBody">
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
        </div>
      </details>
    </section>
      ) : null}
    </div>
  );
}
