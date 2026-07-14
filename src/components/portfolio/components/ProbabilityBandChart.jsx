function safeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function formatCompactWon(value) {
  const number = safeNumber(value);
  if (number >= 100000000) return `${(number / 100000000).toFixed(1)}억`;
  if (number >= 10000) return `${Math.round(number / 10000).toLocaleString("ko-KR")}만`;
  return Math.round(number).toLocaleString("ko-KR");
}

function formatMonthLabel(monthIndex) {
  const months = Math.max(0, Number(monthIndex || 0));
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years <= 0) return `${rest}개월`;
  return rest > 0 ? `${years}년 ${rest}개월` : `${years}년`;
}

function createLinePath(points, getX, getY) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${getX(point.monthIndex).toFixed(2)} ${getY(point.value).toFixed(2)}`)
    .join(" ");
}

function createBandPath(upperPoints, lowerPoints, getX, getY) {
  const top = upperPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${getX(point.monthIndex).toFixed(2)} ${getY(point.value).toFixed(2)}`)
    .join(" ");
  const bottom = [...lowerPoints]
    .reverse()
    .map((point) => `L ${getX(point.monthIndex).toFixed(2)} ${getY(point.value).toFixed(2)}`)
    .join(" ");
  return `${top} ${bottom} Z`;
}

export default function ProbabilityBandChart({ chart }) {
  const bands = Array.isArray(chart?.bands) ? chart.bands : [];
  if (bands.length === 0) return null;

  const width = 1000;
  const height = 380;
  const padding = 72;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const contributionMap = new Map(
    (chart.contributionSeries || []).map((point) => [point.monthIndex, point.cumulativeContributions]),
  );
  const baselineReference = Array.isArray(chart.baselineReference) ? chart.baselineReference : [];
  const allValues = [
    ...bands.flatMap((band) => [
      band.p10Nominal,
      band.p25Nominal,
      band.p50Nominal,
      band.p75Nominal,
      band.p90Nominal,
      contributionMap.get(band.monthIndex),
    ]),
    ...baselineReference.map((point) => point.value),
  ].map((value) => Number(value)).filter(Number.isFinite);
  const maxMonth = Math.max(...bands.map((band) => safeNumber(band.monthIndex)), 1);
  const maxValue = Math.max(...allValues, 1);
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  function getX(monthIndex) {
    return padding + (safeNumber(monthIndex) / maxMonth) * chartWidth;
  }

  function getY(value) {
    return height - padding - (safeNumber(value) / maxValue) * chartHeight;
  }

  const p10 = bands.map((band) => ({ monthIndex: band.monthIndex, value: band.p10Nominal }));
  const p25 = bands.map((band) => ({ monthIndex: band.monthIndex, value: band.p25Nominal }));
  const p50 = bands.map((band) => ({ monthIndex: band.monthIndex, value: band.p50Nominal }));
  const p75 = bands.map((band) => ({ monthIndex: band.monthIndex, value: band.p75Nominal }));
  const p90 = bands.map((band) => ({ monthIndex: band.monthIndex, value: band.p90Nominal }));
  const contributions = bands.map((band) => ({
    monthIndex: band.monthIndex,
    value: contributionMap.get(band.monthIndex),
  })).filter((point) => Number.isFinite(Number(point.value)));
  const monthTicks = Array.from(new Set([0, 12, 24, 36, 48, 60, maxMonth].filter((tick) => tick <= maxMonth)));

  return (
    <section className="probabilityChartCard" aria-label={chart.ariaLabel || "확률분석 밴드 차트"}>
      <div className="probabilityChartHeader">
        <div>
          <p className="sectionLabel">Probability Band</p>
          <h4>확률 밴드 경로</h4>
        </div>
        <p>P10-P90 외곽 밴드와 P25-P75 중심 밴드를 분리하고, P50은 중앙 경로로만 표시합니다.</p>
      </div>

      <div className="probabilityChartSvgWrap">
        <svg
          className="probabilityBandSvg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={chart.ariaLabel || "확률분석 P10 P25 P50 P75 P90 밴드 차트"}
        >
          <defs>
            <pattern id="probabilityContributionPattern" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M0 8 L8 0" stroke="#334155" strokeWidth="1.5" />
            </pattern>
          </defs>

          {yTicks.map((ratio) => {
            const value = maxValue * ratio;
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

          <path d={createBandPath(p90, p10, getX, getY)} className="probabilityOuterBand" />
          <path d={createBandPath(p75, p25, getX, getY)} className="probabilityInnerBand" />
          <path d={createLinePath(p50, getX, getY)} className="probabilityMedianLine" />

          {baselineReference.length > 0 ? (
            <path d={createLinePath(baselineReference, getX, getY)} className="probabilityBaselineLine" />
          ) : null}

          {contributions.length > 0 ? (
            <path d={createLinePath(contributions, getX, getY)} className="probabilityContributionLine" />
          ) : null}

          {bands.map((band) => (
            <g key={band.monthIndex} className="probabilityChartPoint" tabIndex={0}>
              <circle cx={getX(band.monthIndex)} cy={getY(band.p50Nominal)} r="5" />
              <title>
                {`${formatMonthLabel(band.monthIndex)} 명목 P10 ${formatCompactWon(band.p10Nominal)} 명목 P50 ${formatCompactWon(band.p50Nominal)} 명목 P90 ${formatCompactWon(band.p90Nominal)} 실질 P50 ${formatCompactWon(band.p50Real)} 납입 ${formatCompactWon(contributionMap.get(band.monthIndex))}`}
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

      <div className="probabilityChartLegend" aria-label="확률분석 차트 범례">
        <span><i className="probabilityLegendOuter" /> P10-P90 외곽 밴드</span>
        <span><i className="probabilityLegendInner" /> P25-P75 중심 밴드</span>
        <span><i className="probabilityLegendMedian" /> P50 중앙 경로</span>
        <span><i className="probabilityLegendBaseline" /> 기준전망 참고선</span>
        <span><i className="probabilityLegendContribution" /> 누적 납입금</span>
      </div>

      <table className="probabilityMobileSummary">
        <caption>모바일 확률분석 요약</caption>
        <thead>
          <tr>
            <th>기간</th>
            <th>P10</th>
            <th>P50</th>
            <th>P90</th>
            <th>누적 납입금</th>
          </tr>
        </thead>
        <tbody>
          {bands.filter((band, index) => index === 0 || index === bands.length - 1 || band.monthIndex % 12 === 0).map((band) => (
            <tr key={band.monthIndex}>
              <td>{formatMonthLabel(band.monthIndex)}</td>
              <td>{formatCompactWon(band.p10Nominal)}</td>
              <td>{formatCompactWon(band.p50Nominal)}</td>
              <td>{formatCompactWon(band.p90Nominal)}</td>
              <td>{formatCompactWon(contributionMap.get(band.monthIndex))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
