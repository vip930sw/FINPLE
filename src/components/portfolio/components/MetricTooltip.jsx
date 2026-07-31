import { METRIC_GUIDE_TEXT } from "./metricGuideConstants";

export default function MetricTooltip({ label, iconOnly = false }) {
  return (
    <span
      className={`detailMetricHelpItem${iconOnly ? " tableMetricHelpItem" : ""}`}
      tabIndex={0}
      aria-label={`${label} 설명`}
    >
      {iconOnly ? null : <span>{label}</span>}
      <em aria-hidden="true">?</em>
      <strong role="tooltip">{METRIC_GUIDE_TEXT[label]}</strong>
    </span>
  );
}
