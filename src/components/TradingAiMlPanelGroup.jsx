import { useEffect, useMemo, useState } from "react";

import TradingScalpingAdminPanel from "./TradingScalpingAdminPanel.jsx";
import TradingScalpingShadowPanel from "./TradingScalpingShadowPanel.jsx";
import TradingScalpingModelSignalPanel from "./TradingScalpingModelSignalPanel.jsx";
import TradingScalpingKisOpsPanel from "./TradingScalpingKisOpsPanel.jsx";
import TradingScalpingKisCapturePanel from "./TradingScalpingKisCapturePanel.jsx";
import { fetchTradingScalpingKisCaptureStatus } from "./tradingScalpingAdminApi.js";
import "./TradingScalpingRegistryPanel.css";
import "./TradingScalpingKisFeedPanel.css";

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
});

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

function dateTime(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("ko-KR");
}

function CaptureOperationalPreflight() {
  const [status, setStatus] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const next = await fetchTradingScalpingKisCaptureStatus();
        if (!disposed) {
          setStatus(next);
          setError("");
          setLoadState("ready");
        }
      } catch (nextError) {
        if (!disposed) {
          setError(nextError.message || "Capture 상태 API 오류");
          setLoadState("error");
        }
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 5_000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

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
    ["읽기 전용 승인", approvalReasons.length === 0 && Boolean(receipt.approvalId)],
    ["KIS credential", credentials.appKeyConfigured === true && credentials.appSecretConfigured === true],
    ["Pilot 시작 준비", status ? status.startEligible === true : null],
  ];
  const blockingReasons = Array.isArray(status?.blockingReasons) ? status.blockingReasons : [];
  const ready = loadState === "ready" && status?.startEligible === true;

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
          <span style={{ color: "#2563eb", fontSize: 11, fontWeight: 900, letterSpacing: ".06em" }}>TSC-4H3 PREFLIGHT</span>
          <strong style={{ display: "block", marginTop: 4, color: "#172033", fontSize: 15 }}>
            {ready ? "30분 Pilot 시작 가능" : loadState === "error" ? "상태 API 확인 필요" : "차단 조건 확인 필요"}
          </strong>
        </div>
        <em style={{ color: ready ? "#166534" : "#9a3412", fontSize: 11, fontStyle: "normal", fontWeight: 900 }}>
          {loadState === "loading" ? "확인 중" : ready ? "READY" : "BLOCKED"}
        </em>
      </header>

      {error ? (
        <p style={{ margin: "10px 0 0", color: "#991b1b", fontSize: 12 }}>{error}</p>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
          gap: 8,
          marginTop: 12,
        }}
      >
        {preflightItems.map(([itemLabel, value]) => (
          <article key={itemLabel} style={{ padding: 10, border: "1px solid #dbeafe", borderRadius: 10, background: "#fff" }}>
            <span style={{ display: "block", color: "#64748b", fontSize: 10 }}>{itemLabel}</span>
            <strong style={{ display: "block", marginTop: 4, color: value === true ? "#166534" : value === false ? "#b91c1c" : "#92400e", fontSize: 12 }}>
              {boolLabel(value)}
            </strong>
          </article>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          저장 <strong style={{ color: "#334155" }}>{persistence.mode || "미확인"}</strong>
        </span>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          승인 <strong style={{ color: "#334155" }}>{receipt.approvalId || "—"}</strong>
        </span>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          만료 <strong style={{ color: "#334155" }}>{dateTime(receipt.expiresAt)}</strong>
        </span>
        <span style={{ padding: "5px 7px", borderRadius: 8, background: "#fff", color: "#64748b", fontSize: 10 }}>
          연결 소유권 <strong style={{ color: "#334155" }}>{status?.lease?.owner || "비어 있음"}</strong>
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
  const drawerStyle = useMemo(() => ({
    position: "fixed",
    top: 76,
    right: 16,
    bottom: 16,
    width: "min(1080px, calc(100vw - 32px))",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: 16,
    border: "1px solid #cbd5e1",
    borderRadius: 18,
    background: "#f8fafc",
    boxShadow: "0 24px 64px rgba(15, 23, 42, .3)",
  }), []);

  return (
    <aside className="scalpingAdminQuickNav" aria-label="실시간 운영 바로가기">
      <details>
        <summary>실시간 운영 바로가기</summary>
        <div style={drawerStyle}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
            <div>
              <span style={{ color: "#2563eb", fontSize: 11, fontWeight: 900 }}>대표자 전용</span>
              <strong style={{ display: "block", marginTop: 3, color: "#172033", fontSize: 18 }}>Trading Lab 실시간 운영</strong>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 11 }}>Capture·운영감시·모델·Shadow·전략 상태를 한 곳에서 확인합니다.</p>
            </div>
            <em style={{ padding: "6px 9px", borderRadius: 999, background: "#fee2e2", color: "#991b1b", fontSize: 10, fontStyle: "normal", fontWeight: 900 }}>계좌·주문 차단</em>
          </header>

          <CaptureOperationalPreflight />

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
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </nav>

          <div className="scalpingAdminOperationsStack" data-admin-panel-key="scalping-operations-stack">
            <section id="trading-scalping-kis-capture" className="scalpingAdminOperationAnchor" aria-label="KIS 완료 1분봉 호가 축적">
              <TradingScalpingKisCapturePanel />
            </section>
            <section id="trading-scalping-kis-operations" className="scalpingAdminOperationAnchor" aria-label="KIS Feed 운영 감시 복구">
              <TradingScalpingKisOpsPanel />
            </section>
            <section id="trading-scalping-model-signal" className="scalpingAdminOperationAnchor" aria-label="모델 신호 상태 진입 차단">
              <TradingScalpingModelSignalPanel />
            </section>
            <section id="trading-scalping-shadow" className="scalpingAdminOperationAnchor" aria-label="스캘핑 Shadow 운용">
              <TradingScalpingShadowPanel />
            </section>
            <section id="trading-scalping-strategy" className="scalpingAdminOperationAnchor" aria-label="스캘핑 전략 관리">
              <TradingScalpingAdminPanel />
            </section>
          </div>
        </div>
      </details>
    </aside>
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
