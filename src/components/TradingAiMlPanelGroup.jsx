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

  return (
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
  );
}

export default TradingAiMlPanelGroup;
