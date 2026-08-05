import TradingScalpingAdminPanel from "./TradingScalpingAdminPanel.jsx";
import TradingScalpingShadowPanel from "./TradingScalpingShadowPanel.jsx";
import TradingScalpingModelSignalPanel from "./TradingScalpingModelSignalPanel.jsx";
import TradingScalpingKisOpsPanel from "./TradingScalpingKisOpsPanel.jsx";
import TradingScalpingKisCapturePanel from "./TradingScalpingKisCapturePanel.jsx";
import "./TradingScalpingRegistryPanel.css";
import "./TradingScalpingKisFeedPanel.css";

const SCALPING_OPERATION_LINKS = Object.freeze([
  { href: "#trading-scalping-kis-capture", label: "KIS 1분봉 축적" },
  { href: "#trading-scalping-kis-operations", label: "KIS 운영감시" },
  { href: "#trading-scalping-model-signal", label: "모델 신호" },
  { href: "#trading-scalping-shadow", label: "Shadow 운용" },
  { href: "#trading-scalping-strategy", label: "전략 관리" },
]);

function ScalpingOperationQuickNav() {
  return (
    <aside className="scalpingAdminQuickNav" aria-label="실시간 운영 바로가기">
      <details>
        <summary>실시간 운영 바로가기</summary>
        <nav aria-label="Trading Lab 실시간 운영 패널">
          {SCALPING_OPERATION_LINKS.map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>
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
      {showScalpingAdminPanel ? (
        <>
          <ScalpingOperationQuickNav />
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
        </>
      ) : null}
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
