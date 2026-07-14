function strictNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCompactWon(value) {
  const number = strictNumber(value);
  if (number === null) return "-";
  if (Math.abs(number) >= 100000000) return `${(number / 100000000).toFixed(1)}억`;
  if (Math.abs(number) >= 10000) return `${Math.round(number / 10000).toLocaleString("ko-KR")}만`;
  return Math.round(number).toLocaleString("ko-KR");
}

function formatMonthLabel(monthIndex) {
  const months = strictNumber(monthIndex);
  if (months === null) return "-";
  const safeMonths = Math.max(0, months);
  const years = Math.floor(safeMonths / 12);
  const rest = safeMonths % 12;
  if (years <= 0) return `${rest}개월`;
  return rest > 0 ? `${years}년 ${rest}개월` : `${years}년`;
}

function createLinePath(points, getX, getY) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${getX(point.monthIndex).toFixed(2)} ${getY(point.value).toFixed(2)}`)
    .join(" ");
}

function toValuePoints(points, key) {
  return points.map((point) => ({
    monthIndex: point.monthIndex,
    value: point[key],
  }));
}

export default function ExternalShockPathChart({ chart }) {
  const baselinePath = Array.isArray(chart?.baselinePath) ? chart.baselinePath : [];
  const stressedPath = Array.isArray(chart?.stressedPath) ? chart.stressedPath : [];
  if (baselinePath.length === 0 || stressedPath.length === 0) return null;

  const width = 1000;
  const height = 380;
  const padding = 72;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const baselineValues = toValuePoints(baselinePath, "portfolioValue");
  const stressedValues = toValuePoints(stressedPath, "portfolioValue");
  const riskValues = toValuePoints(stressedPath, "riskNav");
  const contributionSeries = Array.isArray(chart.contributionSeries)
    ? chart.contributionSeries.map((point) => ({ monthIndex: point.monthIndex, value: point.cumulativeContributions }))
    : [];
  const baselineReference = Array.isArray(chart.baselineReference) ? chart.baselineReference : [];
  const allValues = [
    ...baselineValues,
    ...stressedValues,
    ...contributionSeries,
    ...baselineReference,
  ].map((point) => strictNumber(point.value)).filter((value) => value !== null);
  const maxMonth = Math.max(...baselineValues.map((point) => point.monthIndex), 1);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const valueRange = Math.max(maxValue - minValue, 1);
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  function getX(monthIndex) {
    return padding + (monthIndex / maxMonth) * chartWidth;
  }

  function getY(value) {
    return height - padding - ((value - minValue) / valueRange) * chartHeight;
  }

  const monthTicks = Array.from(new Set([0, 3, 6, 9, 12, 24, 36, 48, 60, maxMonth].filter((tick) => tick <= maxMonth)));
  const shockMarkers = Array.isArray(chart.shockMarkers) ? chart.shockMarkers : [];

  return (
    <section className="externalShockChartCard" aria-label={chart.ariaLabel || "외부충격분석 경로 차트"}>
      <div className="externalShockChartHeader">
        <div>
          <p className="sectionLabel">External Shock Path</p>
          <h4>기준 경로와 충격 경로</h4>
        </div>
        <p>충격은 지정된 월에만 적용하며, MDD는 납입금이 제외된 risk NAV로 계산합니다.</p>
      </div>

      <div className="externalShockChartSvgWrap">
        <svg
          className="externalShockSvg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={chart.ariaLabel || "외부충격분석 기준 경로와 충격 경로 차트"}
        >
          {yTicks.map((ratio) => {
            const value = minValue + valueRange * ratio;
            const y = height - padding - ratio * chartHeight;
            return (
              <g key={ratio}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} className="chartGridLine" />
                <text x={padding - 12} y={y + 4} textAnchor="end" className="chartAxisLabel">
                  {formatCompactWon(value)}
                </text>
              </g>
            );
          })}

          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} className="chartAxis" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="chartAxis" />

          <path d={createLinePath(baselineValues, getX, getY)} className="externalShockBaselineLine" />
          <path d={createLinePath(stressedValues, getX, getY)} className="externalShockStressedLine" />

          {baselineReference.length > 0 ? (
            <path d={createLinePath(baselineReference, getX, getY)} className="externalShockReferenceLine" />
          ) : null}

          {contributionSeries.length > 0 ? (
            <path d={createLinePath(contributionSeries, getX, getY)} className="externalShockContributionLine" />
          ) : null}

          {shockMarkers.map((marker) => (
            <g key={`${marker.monthIndex}-${marker.label}`} tabIndex={0} className="externalShockMarker">
              <line x1={getX(marker.monthIndex)} y1={padding} x2={getX(marker.monthIndex)} y2={height - padding} />
              <circle cx={getX(marker.monthIndex)} cy={getY(stressedValues.find((point) => point.monthIndex === marker.monthIndex)?.value)} r="6" />
              <title>{`${formatMonthLabel(marker.monthIndex)} ${marker.label} ${marker.shockMode}`}</title>
            </g>
          ))}

          {stressedValues.map((point) => (
            <g key={point.monthIndex} className="externalShockChartPoint" tabIndex={0}>
              <circle cx={getX(point.monthIndex)} cy={getY(point.value)} r="4" />
              <title>
                {`${formatMonthLabel(point.monthIndex)} 기준 ${formatCompactWon(baselineValues.find((item) => item.monthIndex === point.monthIndex)?.value)} 충격 ${formatCompactWon(point.value)} risk NAV ${formatCompactWon(riskValues.find((item) => item.monthIndex === point.monthIndex)?.value)}`}
              </title>
            </g>
          ))}

          {monthTicks.map((monthIndex) => (
            <text key={monthIndex} x={getX(monthIndex)} y={height - 20} textAnchor="middle" className="chartYearLabel">
              {formatMonthLabel(monthIndex)}
            </text>
          ))}
        </svg>
      </div>

      <div className="externalShockChartLegend" aria-label="외부충격분석 차트 범례">
        <span><i className="externalShockLegendBaseline" /> 기준 경로</span>
        <span><i className="externalShockLegendStressed" /> 충격 경로</span>
        <span><i className="externalShockLegendContribution" /> 누적 납입금</span>
        <span><i className="externalShockLegendMarker" /> 충격 월</span>
      </div>

      <table className="externalShockMobileSummary">
        <caption>모바일 외부충격분석 요약</caption>
        <thead>
          <tr>
            <th>기간</th>
            <th>기준</th>
            <th>충격</th>
            <th>누적 납입금</th>
          </tr>
        </thead>
        <tbody>
          {stressedValues.filter((point, index) => index === 0 || index === stressedValues.length - 1 || point.monthIndex % 3 === 0).map((point) => (
            <tr key={point.monthIndex}>
              <td>{formatMonthLabel(point.monthIndex)}</td>
              <td>{formatCompactWon(baselineValues.find((item) => item.monthIndex === point.monthIndex)?.value)}</td>
              <td>{formatCompactWon(point.value)}</td>
              <td>{formatCompactWon(contributionSeries.find((item) => item.monthIndex === point.monthIndex)?.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
