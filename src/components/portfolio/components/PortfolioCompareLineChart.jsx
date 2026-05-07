export default function PortfolioCompareLineChart({ portfolios }) {
  if (!portfolios || portfolios.length === 0) return null;

  const width = 1000;
  const height = 340;
  const paddingLeft = 86;
  const paddingRight = 150;
  const paddingTop = 42;
  const paddingBottom = 58;

  const colors = ["#2563eb", "#0f4c5c", "#f59e0b", "#7c3aed", "#64748b"];

  const allValues = portfolios.flatMap((portfolio) =>
    portfolio.result.performanceRows.map((row) => row.inflationAdjustedValue)
  );

  const maxValue = Math.max(...allValues, 1);

  const maxYear = Math.max(
    ...portfolios.map((portfolio) => Number(portfolio.settings.years || 0)),
    1
  );

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const xTicks = Array.from(
    new Set([
      1,
      Math.max(1, Math.round(maxYear * 0.25)),
      Math.max(1, Math.round(maxYear * 0.5)),
      Math.max(1, Math.round(maxYear * 0.75)),
      maxYear,
    ])
  ).sort((a, b) => a - b);

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
    return (
      paddingLeft +
      ((year - 1) / Math.max(maxYear - 1, 1)) *
        (width - paddingLeft - paddingRight)
    );
  }

  function getY(value) {
    return (
      height -
      paddingBottom -
      (value / (maxValue || 1)) *
        (height - paddingTop - paddingBottom)
    );
  }

  function getRankLabel(portfolio) {
      const sameRankCount = portfolios.filter(
        (item) => item.realValueRank === portfolio.realValueRank
      ).length;

      return sameRankCount > 1
        ? `공동 ${portfolio.realValueRank}위`
        : `${portfolio.realValueRank}위`;
    }

    const legendGroups = portfolios.reduce((groups, portfolio, index) => {
      const existingGroup = groups.find(
        (group) => group.rank === portfolio.realValueRank
      );

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
    <div className="compareLineChart">
      <div className="compareLineChartHeader">
        <h4>실질 평가금액 비교</h4>
        <p>
        물가 반영 실질가치 기준 3위까지 비교합니다. 공동 순위는 함께 표시합니다.
       </p>
      </div>

      <div className="compareLineChartSvgWrap">
        <svg
          className="compareLineChartSvg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="포트폴리오별 실질 평가금액 비교 차트"
        >
          {yTicks.map((ratio) => {
            const value = maxValue * ratio;
            const y = getY(value);

            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  className="chartGridLine"
                />
                <text
                  x={paddingLeft - 14}
                  y={y + 4}
                  textAnchor="end"
                  className="compareAxisLabel"
                >
                  {formatCompactWon(value)}
                </text>
              </g>
            );
          })}

          {xTicks.map((year) => {
            const x = getX(year);

            return (
              <text
                key={year}
                x={x}
                y={height - paddingBottom + 30}
                textAnchor="middle"
                className="compareAxisLabel"
              >
                {year}년
              </text>
            );
          })}

          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            className="chartAxis"
          />

          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={height - paddingBottom}
            className="chartAxis"
          />

          {portfolios.map((portfolio, index) => {
            const points = portfolio.result.performanceRows
              .map((row) => {
                const x = getX(row.year);
                const y = getY(row.inflationAdjustedValue);

                return `${x},${y}`;
              })
              .join(" ");

            const lastRow =
              portfolio.result.performanceRows[
                portfolio.result.performanceRows.length - 1
              ];

            return (
              <g key={portfolio.id}>
              <polyline
                  points={points}
                  fill="none"
                  stroke={colors[index % colors.length]}
                  strokeWidth={portfolio.realValueRank === 1 ? "5" : "3.5"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
              />

                  {lastRow && (
                  <text
                  x={width - paddingRight + 18}
                  y={getY(lastRow.inflationAdjustedValue) + index * 22 - 10}
                  textAnchor="start"
                  className={
                    portfolio.realValueRank === 1
                      ? "compareLineEndLabel rank1"
                      : "compareLineEndLabel"
                  }
                  fill={colors[index % colors.length]}
                >
                  {`${portfolio.realValueRank}위 · ${portfolio.name}`}
                </text>
                  )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="compareLineLegend grouped">
      {legendGroups.map((group) => (
          <div
          key={group.rank}
          className={
              group.rank === 1
              ? "compareLineLegendGroup rank1"
              : "compareLineLegendGroup"
          }
          >
          <strong>{group.label}</strong>

          <div>
              {group.items.map((portfolio) => (
              <span key={portfolio.id} className="compareLineLegendItem">
                  <i style={{ background: portfolio.color }} />
                  {portfolio.name}
              </span>
              ))}
          </div>
          </div>
      ))}
      </div>
    </div>
  );
}
