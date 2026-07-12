function TradingAiMlPanelGroup({
  groupKey,
  title,
  description,
  statusItems = [],
  defaultOpen = false,
  children,
}) {
  return (
    <details
      className="tradingAiMlPanelGroup"
      data-admin-panel-group-key={groupKey}
      data-default-open={defaultOpen ? "true" : "false"}
      open={defaultOpen ? true : undefined}
    >
      <summary className="tradingAiMlPanelGroupSummary">
        <span>{title}</span>
        <strong>{description}</strong>
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
