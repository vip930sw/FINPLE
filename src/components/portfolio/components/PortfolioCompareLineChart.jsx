export default function PortfolioCompareLineChart({ portfolios }) {
  if (!portfolios || portfolios.length === 0) return null;

  const width = 1000;
  const height = 360;
  const padding = 76;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const colors = ["#2563eb", "#0f4c5c", "#f59e0b", "#7c3aed", "#64748b"];

  const rowsByPortfolio = portfolios.map((portfolio) => ({
    ...portfolio,
    rows: Array.isArray(portfolio?.result?.performanceRows)
      ? portfolio.result.performanceRows
      : [],
  }));

  const maxYear = Math.max(
    ...rowsByPortfolio.flatMap((portfolio) =>
      portfolio.rows.map((row) => Number(row.year || 0))
    ),
    ...rowsByPortfolio.map((portfolio) => Number(portfolio?.settings?.years || 0)),
    1
  );

  const allValues = rowsByPortfolio.flatMap((portfolio) =>
    portfolio.rows.map((row) => Number(row.inflationAdjustedValue || 0))
  );

  const maxValue = Math.max(...allValues, 1);
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  function formatCompactWon(value) {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}억`;
    }

    if (value >= 10000) {
      return `${Math.round(value / 10000).toLocaleString()}만`;
    }

    return `${Math.round(value).toLocaleString()}`;
  }

  function getX(year) {
    return padding + ((Number(year || 1) - 1) / Math.max(maxYear - 1, 1)) * chartWidth;
  }

  function getY(value) {
    return height - padding - (Number(value || 0) / maxValue) * chartHeight;
  }

  function getRankLabel(portfolio) {
    const sameRankCount = rowsByPortfolio.filter(
      (item) => item.realValueRank === portfolio.realValueRank
    ).length;

    return sameRankCount > 1
      ? `공동 ${portfolio.realValueRank}위`
      : `${portfolio.realValueRank}위`;
  }

  const legendGroups = rowsByPortfolio.reduce((groups, portfolio, index) => {
    const existingGroup = groups.find((group) => group.rank === portfolio.realValueRank);
    const item = {
      ...portfolio,
      color: colors[index % colors.length],
    };

    if (existingGroup) {
      existingGroup.items.push(item);
      return groups;
    }

    return [
      ...groups,
      {
        rank: portfolio.realValueRank,
        label: getRankLabel(portfolio),
        items: [item],
      },
    ];
  }, []);

  return (
    <div className="compareLineChart portfolioCompareGrowthChart">
      <div className="performanceHeader compareGrowthHeader">
        <div>
          <p className="sectionLabel">Compare Chart</p>
          <h3>실질 평가금액 비교</h3>

          <p>
            물가 반영 실질가치 기준 상위 포트폴리오의 장기 흐름을 비교합니다.
          </p>
        </div>
      </div>

      <div className="chartCard compareGrowthCard">
        <div className="svgChartWrap compareGrowthSvgWrap">
          <svg
            className="svgChart compareGrowthSvg"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="포트폴리오별 실질 평가금액 비교 차트"
          >
            {yTicks.map((ratio) => {
              const value = maxValue * ratio;
              const y = height - padding - ratio * chartHeight;

              return (
                <g key={ratio}>
                  <line
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    className="chartGridLine"
                  />

                  <text
                    x={padding - 12}
                    y={y + 4}
                    textAnchor="end"
                    className="chartAxisLabel"
                  >
                    {formatCompactWon(value)}
                  </text>
                </g>
              );
            })}

            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              className="chartAxis"
            />

            <line
              x1={padding}
              y1={padding}
              x2={padding}
              y2={height - padding}
              className="chartAxis"
            />

            {rowsByPortfolio.map((portfolio, index) => {
              const points = portfolio.rows
                .map((row) => `${getX(row.year)},${getY(row.inflationAdjustedValue)}`)
                .join(" ");

              return (
                <polyline
                  key={portfolio.id}
                  points={points}
                  fill="none"
                  stroke={colors[index % colors.length]}
                  strokeWidth={portfolio.realValueRank === 1 ? "5" : "3.5"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {Array.from(
              new Set([
                1,
                5,
                10,
                15,
                20,
                25,
                maxYear,
              ].filter((year) => year <= maxYear))
            ).map((year) => (
              <text
                key={year}
                x={getX(year)}
                y={height - 18}
                textAnchor="middle"
                className="chartYearLabel"
              >
                {year}
              </text>
            ))}
          </svg>
        </div>

        <div className="chartLegend compareGrowthLegend">
          {legendGroups.map((group) => (
            <span key={group.rank}>
              <strong>{group.label}</strong>
              {group.items.map((portfolio) => (
                <span key={portfolio.id} className="compareGrowthLegendItem">
                  <i className="legendDot" style={{ background: portfolio.color }} />
                  {portfolio.name}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
