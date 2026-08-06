import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import TradingScalpingAdminPanel from "./TradingScalpingAdminPanel.jsx";
import TradingScalpingShadowPanel from "./TradingScalpingShadowPanel.jsx";
import TradingScalpingModelSignalPanel from "./TradingScalpingModelSignalPanel.jsx";
import TradingScalpingKisOpsPanel from "./TradingScalpingKisOpsPanel.jsx";
import TradingScalpingKisCapturePanel from "./TradingScalpingKisCapturePanel.jsx";
import { fetchTradingScalpingKisCaptureStatus } from "./tradingScalpingAdminApi.js";
import "./TradingScalpingRegistryPanel.css";
import "./TradingScalpingKisFeedPanel.css";

const CAPTURE_STATUS_SCHEMA_VERSION = "1.0.0";
const CAPTURE_POLL_INTERVAL_MS = 5_000;

const PREFLIGHT_DIAGNOSTIC_LABELS = Object.freeze({
  READY: "운영 계약 확인 완료",
  BLOCKED: "차단 조건 확인 필요",
  FEATURE_FLAG_DISABLED: "Capture 기능 플래그 비활성",
  ADMIN_AUTH_MISSING: "관리자 인증 토큰 없음",
  ADMIN_AUTH_INVALID: "관리자 인증 토큰 거부",
  ADMIN_FORBIDDEN: "관리자 접근 권한 없음",
  ADMIN_ROUTE_NOT_FOUND: "Capture 상태 route 없음",
  BACKEND_VERSION_MISMATCH: "백엔드 응답 버전 불일치",
  DEPLOYMENT_SHA_MISMATCH: "프런트·백엔드 배포 SHA 불일치",
  TRANSPORT_FAILURE: "백엔드 연결 실패",
  REQUEST_TIMEOUT: "백엔드 응답 시간 초과",
  RESPONSE_JSON_PARSE_FAILED: "응답 JSON 해석 실패",
  RESPONSE_CONTRACT_MISMATCH: "응답 계약 불일치",
  DATABASE_URL_MISSING: "DATABASE_URL 미설정",
  DATABASE_UNAVAILABLE: "데이터베이스 연결 불가",
  CAPTURE_SCHEMA_MISSING: "Capture DB schema 없음",
  READ_ONLY_APPROVAL_MISSING: "읽기 전용 승인 누락",
  READ_ONLY_APPROVAL_EXPIRED: "읽기 전용 승인 만료",
  KIS_CREDENTIAL_MISSING: "KIS credential 누락",
});

const SCALPING_OPERATION_LINKS = Object.freeze([
  { href: "#trading-scalping-kis-capture", label: "KIS 1분봉 축적" },
  { href: "#trading-scalping-kis-operations", label: "KIS 운영감시" },
  { href: "#trading-scalping-model-signal", label: "모델 신호" },
  { href: "#trading-scalping-shadow", label: "Shadow 운용" },
  { href: "#trading-scalping-strategy", label: "전략 관리" },
]);

const BLOCKING_REASON_LABELS = Object.freeze({
  kis_historical_capture_feature_flag_disabled: "Historical Capture 기능 플래그 비활성",
  kis_shadow_feed_feature_flag_disabled: "공통 KIS 읽기 전용 플래그 비활성",
  approval_expired: "읽기 전용 승인 만료",
  approval_id_required: "승인 ID 누락",
  approved_by_required: "승인자 누락",
  approved_at_invalid: "승인 시각 오류",
  expires_at_invalid: "승인 만료 시각 오류",
  approval_scope_must_be_market_data_read_only: "읽기 전용 승인 범위 불일치",
  approval_environment_must_be_virtual_shadow: "승인 환경 불일치",
  approval_base_url_mismatch: "승인 KIS URL 불일치",
  account_id_hash_marker_required: "계좌 식별자 해시 마커 누락",
  evidence_ticket_required: "승인 증적 티켓 누락",
  revocation_plan_required: "승인 철회 계획 누락",
  redaction_version_required: "마스킹 버전 누락",
  kis_trading_app_key_missing: "KIS App Key 누락",
  kis_trading_app_secret_missing: "KIS App Secret 누락",
  apply_20260805_trading_kis_historical_capture_migration: "KIS Capture migration 미적용",
  capture_feature_flag_disabled: "DB Capture 기능 플래그 비활성",
  database_not_configured: "DATABASE_URL 미설정",
  database_unavailable: "데이터베이스 연결 불가",
});

function normalizeCaptureStatusPayload(payload) {
  const candidates = [
    payload,
    payload?.data,
    payload?.status,
    payload?.result,
    payload?.capture,
  ];
  const status = candidates.find((candidate) => (
    candidate
    && typeof candidate === "object"
    && candidate.persistence
    && typeof candidate.persistence === "object"
    && candidate.approval
    && typeof candidate.approval === "object"
    && Array.isArray(candidate.blockingReasons)
    && typeof candidate.startEligible === "boolean"
  ));

  if (status && status.schemaVersion !== CAPTURE_STATUS_SCHEMA_VERSION) {
    const error = new Error(
      `지원하지 않는 Capture 상태 버전입니다. expected=${CAPTURE_STATUS_SCHEMA_VERSION}, actual=${status?.schemaVersion || "missing"}`,
    );
    error.code = "BACKEND_VERSION_MISMATCH";
    throw error;
  }

  if (status) return status;

  const error = new Error(
    "KIS Capture 상태 API 계약이 일치하지 않습니다. Render 백엔드 배포와 API Base URL을 확인해 주세요.",
  );
  error.code = "RESPONSE_CONTRACT_MISMATCH";
  throw error;
}

function boolLabel(value) {
  if (value === true) return "정상";
  if (value === false) return "차단";
  return "확인 중";
}

function reasonLabel(reason) {
  if (BLOCKING_REASON_LABELS[reason]) return BLOCKING_REASON_LABELS[reason];
  if (String(reason).startsWith("kis_connection_owned_by:")) {
    return `다른 KIS 연결 사용 중 · ${String(reason).split(":").slice(1).join(":")}`;
  }
  if (String(reason).startsWith("missing_read_scope_")) {
    return `읽기 범위 누락 · ${String(reason).replace("missing_read_scope_", "")}`;
  }
  if (String(reason).startsWith("missing_forbidden_action_")) {
    return `금지 작업 선언 누락 · ${String(reason).replace("missing_forbidden_action_", "")}`;
  }
  return reason;
}

function frontendDeploymentSha() {
  return String(globalThis.__FINPLE_DEPLOYMENT_SHA__ || "").trim();
}

function shortSha(value) {
  return value ? String(value).slice(0, 7) : "미확인";
}

function captureDiagnosticCode(status, error) {
  if (error?.code) return error.code;
  if (!status) return "BLOCKED";

  const frontendSha = frontendDeploymentSha();
  if (frontendSha && status.deploymentSha && frontendSha !== status.deploymentSha) {
    return "DEPLOYMENT_SHA_MISMATCH";
  }

  const reasons = new Set(status.blockingReasons || []);
  if (reasons.has("kis_historical_capture_feature_flag_disabled") || reasons.has("capture_feature_flag_disabled")) {
    return "FEATURE_FLAG_DISABLED";
  }
  if (reasons.has("database_not_configured")) return "DATABASE_URL_MISSING";
  if (reasons.has("database_unavailable")) return "DATABASE_UNAVAILABLE";
  if (reasons.has("apply_20260805_trading_kis_historical_capture_migration")) return "CAPTURE_SCHEMA_MISSING";
  if (reasons.has("approval_expired")) return "READ_ONLY_APPROVAL_EXPIRED";
  if ([...reasons].some((reason) => String(reason).startsWith("approval_") || [
    "approval_id_required",
    "approved_by_required",
    "approved_at_invalid",
    "expires_at_invalid",
    "account_id_hash_marker_required",
    "evidence_ticket_required",
    "revocation_plan_required",
    "redaction_version_required",
  ].includes(reason))) return "READ_ONLY_APPROVAL_MISSING";
  if (reasons.has("kis_trading_app_key_missing") || reasons.has("kis_trading_app_secret_missing")) {
    return "KIS_CREDENTIAL_MISSING";
  }
  return status.startEligible ? "READY" : "BLOCKED";
}

function useCaptureStatusSnapshot(enabled) {
  const [snapshot, setSnapshot] = useState({ status: null, loadState: "loading", error: null });
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refresh = useCallback(() => setRefreshVersion((current) => current + 1), []);

  useEffect(() => {
    if (!enabled) return undefined;
    let disposed = false;
    let timer = null;
    let controller = null;
    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      controller = new AbortController();
      try {
        const status = normalizeCaptureStatusPayload(
          await fetchTradingScalpingKisCaptureStatus({ signal: controller.signal }),
        );
        if (!disposed) setSnapshot({ status, loadState: "ready", error: null });
      } catch (error) {
        if (!disposed && error?.code !== "REQUEST_ABORTED") {
          setSnapshot({ status: null, loadState: "error", error });
        }
      } finally {
        polling = false;
        if (!disposed && !document.hidden) timer = window.setTimeout(() => void poll(), CAPTURE_POLL_INTERVAL_MS);
      }
    };
    const handleVisibilityChange = () => {
      window.clearTimeout(timer);
      controller?.abort();
      if (!document.hidden && !disposed && !polling) void poll();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (!document.hidden) void poll();
    return () => {
      disposed = true;
      controller?.abort();
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, refreshVersion]);

  return {
    ...snapshot,
    diagnosticCode: captureDiagnosticCode(snapshot.status, snapshot.error),
    refresh,
  };
}

function CaptureOperationalPreflight({ snapshot }) {
  const { status, loadState, error, diagnosticCode } = snapshot;

  const persistence = status?.persistence || {};
  const approval = status?.approval || {};
  const credentials = approval.credentials || {};
  const receipt = approval.receipt || {};
  const approvalReasons = Array.isArray(approval.reasons)
    ? approval.reasons.filter((reason) => reason !== "explicit_admin_start_required")
    : [];
  const preflightItems = [
    ["Capture flag", persistence.featureEnabled],
    ["Read-only flag", approval.featureEnabled],
    ["DATABASE_URL", persistence.databaseConfigured],
    ["DB schema", persistence.schemaReady],
    ["내구성 저장", persistence.durable],
    ["읽기 전용 승인", approvalReasons.length === 0 && receipt.approvalIdPresent === true],
    ["KIS credential", credentials.appKeyConfigured === true && credentials.appSecretConfigured === true],
    ["Pilot 시작 준비", status ? status.startEligible === true : null],
  ];
  const blockingReasons = Array.isArray(status?.blockingReasons) ? status.blockingReasons : [];
  const ready = loadState === "ready" && diagnosticCode === "READY" && status?.startEligible === true;
  const diagnosticLabel = PREFLIGHT_DIAGNOSTIC_LABELS[diagnosticCode] || "알 수 없는 진단 오류";

  return (
    <section
      aria-label="KIS Capture 운영 Preflight"
      style={{
        marginBottom: 14,
        padding: 14,
        border: "1px solid #bfdbfe",
        borderRadius: 14,
        background: "linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <span style={{ color: "#2563eb", fontSize: 11, fontWeight: 900, letterSpacing: ".06em" }}>TSC-4H4 PREFLIGHT</span>
          <strong style={{ display: "block", marginTop: 4, color: "#172033", fontSize: 15 }}>
            {loadState === "loading" ? "상태 확인 중" : diagnosticLabel}
          </strong>
          {loadState !== "loading" ? (
            <span style={{ display: "block", marginTop: 3, color: "#64748b", fontSize: 10 }}>{diagnosticCode}</span>
          ) : null}
        </div>
        <em style={{ color: ready ? "#166534" : "#9a3412", fontSize: 11, fontStyle: "normal", fontWeight: 900 }}>
          {loadState === "loading" ? "확인 중" : ready ? "READY" : "BLOCKED"}
        </em>
      </header>

      {error ? (
        <p style={{ margin: "10px 0 0", color: "#991b1b", fontSize: 12 }}>{error.message || "Capture 상태 API 오류"}</p>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
          gap: 8,
          marginTop: 12,
        }}
      >
        {preflightItems.map(([itemLabel, value]) => {
          const displayValue = loadState === "error" ? "오류" : boolLabel(value);
          const color = loadState === "error"
            ? "#b91c1c"
            : value === true
              ? "#166534"
              : value === false
                ? "#b91c1c"
                : "#92400e";
          return (
            <article key={itemLabel} style={{ padding: 10, border: "1px solid #dbeafe", borderRadius: 10, background: "#fff" }}>
              <span style={{ display: "block", color: "#64748b", fontSize: 10 }}>{itemLabel}</span>
              <strong style={{ display: "block", marginTop: 4, color, fontSize: 12 }}>
                {displayValue}
              </strong>
            </article>
          );
        })}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          저장 <strong style={{ color: "#334155" }}>{loadState === "error" ? "API 오류" : persistence.mode || "미확인"}</strong>
        </span>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          승인 <strong style={{ color: "#334155" }}>{receipt.approvalIdPresent ? "configured" : "blocked"}</strong>
        </span>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          계약 <strong style={{ color: "#334155" }}>{status ? `${status.schemaVersion} / ${status.runtimeVersion}` : "미확인"}</strong>
        </span>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          연결 소유권 <strong style={{ color: "#334155" }}>{status?.lease?.owner || "비어 있음"}</strong>
        </span>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          배포 <strong style={{ color: diagnosticCode === "DEPLOYMENT_SHA_MISMATCH" ? "#b91c1c" : "#334155" }}>
            {shortSha(frontendDeploymentSha())} / {shortSha(status?.deploymentSha)}
          </strong>
        </span>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          checked <strong style={{ color: "#334155" }}>{status?.checkedAt ? new Date(status.checkedAt).toLocaleString("ko-KR") : "미확인"}</strong>
        </span>
      </div>

      {blockingReasons.length > 0 ? (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#9a3412", fontSize: 11 }}>
          {blockingReasons.map((reason) => <li key={reason}>{reasonLabel(reason)}</li>)}
        </ul>
      ) : null}
    </section>
  );
}

function ScalpingOperationsDock() {
  const [open, setOpen] = useState(false);
  const [activeOperation, setActiveOperation] = useState(SCALPING_OPERATION_LINKS[0].href);
  const launcherRef = useRef(null);
  const closeRef = useRef(null);
  const captureSnapshot = useCaptureStatusSnapshot(open);
  const drawerStyle = useMemo(() => ({
    position: "absolute",
    top: 16,
    right: 16,
    bottom: 16,
    zIndex: 1,
    pointerEvents: "auto",
    width: "min(1080px, calc(100vw - 32px))",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: 16,
    border: "1px solid #cbd5e1",
    borderRadius: 18,
    background: "#f8fafc",
    boxShadow: "0 24px 64px rgba(15, 23, 42, .3)",
  }), []);
  const launcherStyle = useMemo(() => ({
    minHeight: 42,
    padding: "0 16px",
    border: "1px solid #2563eb",
    borderRadius: 999,
    background: "#1d4ed8",
    boxShadow: "0 10px 28px rgba(15, 23, 42, .24)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
  }), []);

  const closeDock = useCallback(() => {
    window.requestAnimationFrame(() => {
      setOpen(false);
      window.requestAnimationFrame(() => launcherRef.current?.focus());
    });
  }, []);

  const handleCloseClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    closeDock();
  }, [closeDock]);

  useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeDock();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDock, open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <aside
      className="scalpingAdminQuickNav"
      aria-label="실시간 운영 바로가기"
      style={{ zIndex: 10000 }}
    >
      {!open ? (
        <button
          ref={launcherRef}
          type="button"
          style={launcherStyle}
          aria-haspopup="dialog"
          aria-expanded="false"
          onClick={() => setOpen(true)}
        >
          실시간 운영 바로가기
        </button>
      ) : (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            pointerEvents: "none",
          }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="실시간 운영 닫기 배경"
            onClick={handleCloseClick}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
              width: "100%",
              height: "100%",
              padding: 0,
              border: 0,
              background: "rgba(15, 23, 42, .38)",
              pointerEvents: "auto",
            }}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Trading Lab 실시간 운영"
            style={drawerStyle}
          >
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 12, paddingRight: 72 }}>
              <div>
                <span style={{ color: "#2563eb", fontSize: 11, fontWeight: 900 }}>대표자 전용</span>
                <strong style={{ display: "block", marginTop: 3, color: "#172033", fontSize: 18 }}>Trading Lab 실시간 운영</strong>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 11 }}>Capture·운영감시·모델·Shadow·전략 상태를 한 곳에서 확인합니다.</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <em style={{ padding: "6px 9px", borderRadius: 999, background: "#fee2e2", color: "#991b1b", fontSize: 10, fontStyle: "normal", fontWeight: 900 }}>계좌·주문 차단</em>
                <button
                  ref={closeRef}
                  type="button"
                  aria-label="실시간 운영 닫기"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={handleCloseClick}
                  style={{
                    position: "fixed",
                    top: "calc(16px + env(safe-area-inset-top, 0px))",
                    right: "calc(16px + env(safe-area-inset-right, 0px))",
                    zIndex: 2,
                    minWidth: 44,
                    minHeight: 44,
                    padding: "0 11px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 9,
                    background: "#fff",
                    color: "#334155",
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  닫기
                </button>
              </div>
            </header>

            <CaptureOperationalPreflight snapshot={captureSnapshot} />

            <nav
              aria-label="Trading Lab 실시간 운영 패널"
              style={{
                position: "sticky",
                top: -16,
                zIndex: 3,
                right: "auto",
                bottom: "auto",
                display: "flex",
                flexWrap: "wrap",
                gap: 7,
                width: "auto",
                marginBottom: 12,
                padding: 9,
                border: "1px solid #dbeafe",
                borderRadius: 12,
                background: "rgba(239, 246, 255, .97)",
                boxShadow: "none",
              }}
            >
              {SCALPING_OPERATION_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={activeOperation === item.href ? "page" : undefined}
                  onClick={() => setActiveOperation(item.href)}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="scalpingAdminOperationsStack" data-admin-panel-key="scalping-operations-stack">
              {activeOperation === "#trading-scalping-kis-capture" ? <section id="trading-scalping-kis-capture" className="scalpingAdminOperationAnchor" aria-label="KIS 완료 1분봉 호가 축적">
                <TradingScalpingKisCapturePanel
                  status={captureSnapshot.status}
                  loadState={captureSnapshot.loadState}
                  statusError={captureSnapshot.error}
                  onRefresh={captureSnapshot.refresh}
                />
              </section> : null}
              {activeOperation === "#trading-scalping-kis-operations" ? <section id="trading-scalping-kis-operations" className="scalpingAdminOperationAnchor" aria-label="KIS Feed 운영 감시 복구">
                <TradingScalpingKisOpsPanel />
              </section> : null}
              {activeOperation === "#trading-scalping-model-signal" ? <section id="trading-scalping-model-signal" className="scalpingAdminOperationAnchor" aria-label="모델 신호 상태 진입 차단">
                <TradingScalpingModelSignalPanel />
              </section> : null}
              {activeOperation === "#trading-scalping-shadow" ? <section id="trading-scalping-shadow" className="scalpingAdminOperationAnchor" aria-label="스캘핑 Shadow 운용">
                <TradingScalpingShadowPanel />
              </section> : null}
              {activeOperation === "#trading-scalping-strategy" ? <section id="trading-scalping-strategy" className="scalpingAdminOperationAnchor" aria-label="스캘핑 전략 관리">
                <TradingScalpingAdminPanel />
              </section> : null}
            </div>
          </section>
        </div>
      )}
    </aside>,
    document.body,
  );
}

function TradingAiMlPanelGroup({
  groupKey,
  title,
  description,
  summaryItems = [],
  statusItems = [],
  defaultOpen = false,
  children,
}) {
  const previewItems = summaryItems.slice(0, 5).map((item) => ({
    label: item.label,
    value: item.value,
    tone: ["blocked", "review", "external"].includes(item.tone) ? item.tone : "neutral",
  }));
  const showScalpingAdminPanel = groupKey === "ai-ml-milestone-overview";

  return (
    <>
      {showScalpingAdminPanel ? <ScalpingOperationsDock /> : null}
      <details
        className="tradingAiMlPanelGroup"
        data-admin-panel-group-key={groupKey}
        data-default-open={defaultOpen ? "true" : "false"}
        open={defaultOpen ? true : undefined}
      >
        <summary className="tradingAiMlPanelGroupSummary">
          <div className="tradingAiMlPanelGroupSummaryContent">
            <span>{title}</span>
            <strong>{description}</strong>
          </div>
          {previewItems.length > 0 ? (
            <div className="tradingAiMlPanelGroupSummaryPreview" aria-label={`${title} collapsed summary preview`}>
              {previewItems.map((item) => (
                <span
                  key={item.label}
                  className={`tradingAiMlPanelGroupSummaryPreviewItem tradingAiMlPanelGroupSummaryPreviewItem--${item.tone}`}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </span>
              ))}
            </div>
          ) : null}
        </summary>
        <div className="tradingAiMlPanelGroupBody">
          {statusItems.length > 0 ? (
            <div className="tradingAiMlPanelGroupStatus" aria-label={`${title} status summary`}>
              {statusItems.map((item) => (
                <article key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          ) : null}
          {children}
        </div>
      </details>
    </>
  );
}

export default TradingAiMlPanelGroup;
