function PerformanceChart({ rows }) {
    if (!rows || rows.length === 0) return null;
  
    const width = 1000;
    const height = 360;
    const padding = 76;
    const barGap = 8;
  
    const visibleRows = rows;
  
    const maxValue = Math.max(
      ...visibleRows.map(
        (row) =>
          row.cumulativeContribution +
          row.cumulativeProfit +
          row.cumulativeDividend
      )
    );
  
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

    function getY(value) {
      return (
        height -
        padding -
        (value / (maxValue || 1)) * (height - padding * 2)
      );
    }
  
    const chartWidth = width - padding * 2;
  
    const barWidth =
      visibleRows.length > 0
        ? Math.max(10, chartWidth / visibleRows.length - barGap)
        : 24;
    
    const realValuePoints = visibleRows
      .map((row, index) => {
        const x =
          padding +
          index * (chartWidth / visibleRows.length) +
          barGap / 2 +
          barWidth / 2;
    
        const y = getY(row.inflationAdjustedValue);
    
        return `${x},${y}`;
      })
      .join(" ");
    
    const lastRow = rows[rows.length - 1];
    const totalExpectedWealth =
    Number(lastRow.cumulativeContribution || 0) +
    Number(lastRow.cumulativeProfit || 0) +
    Number(lastRow.cumulativeDividend || 0);
  
    const inflationAdjustedTotal = Number(lastRow.inflationAdjustedValue || 0);
  
    return (
      <div className="performanceChartSection">
        <div className="performanceHeader">
          <div>
            <p className="sectionLabel">Growth Chart</p>
            <h3>누적 납입금·수익금·배당금 구성</h3>
          </div>
  
          <p>
            누적 납입금, 누적 수익금, 누적 배당금이 장기적으로 어떻게 쌓이는지
            확인합니다.
          </p>
        </div>
  
        <div className="chartCard">
                <div className="chartStatement">
            <div className="chartStatementHeader">
              <p>누적 구성 요약</p>
            </div>
  
            <div className="statementRows">
              <div className="statementRow">
                <span>
                  <i className="legendDot contribution" />
                  최종 누적 납입금
                </span>
                <strong>
                  {Math.floor(lastRow.cumulativeContribution).toLocaleString()}원
                </strong>
              </div>
  
              <div className="statementRow">
                <span>
                  <i className="legendDot profit" />
                  최종 누적 수익금
                </span>
                <strong>
                  {Math.floor(lastRow.cumulativeProfit).toLocaleString()}원
                </strong>
              </div>
  
              <div className="statementRow">
                <span>
                  <i className="legendDot dividend" />
                  최종 누적 배당금
                </span>
                <strong>
                  {Math.floor(lastRow.cumulativeDividend).toLocaleString()}원
                </strong>
              </div>
  
              <div className="statementDivider" />
  
              <div className="statementTotalBlock">
                <div className="statementRow total">
                  <span>예상 총액</span>
                  <strong className="nominalTotalAmount">
                    {Math.floor(totalExpectedWealth).toLocaleString()}원
                  </strong>
                </div>
  
                <div className="statementRow total">
                  <span className="realTotalLabel">물가 반영</span>
                  <strong className="realTotalAmount">
                    {Math.floor(inflationAdjustedTotal).toLocaleString()}원
                  </strong>
                </div>
              </div>
            </div>
          </div>
  
          <div className="svgChartWrap">
            <svg
              className="svgChart"
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label="누적 납입금, 누적 수익금, 누적 배당금 구성 차트"
            >
              {yTicks.map((ratio) => {
                const value = maxValue * ratio;
                const y = height - padding - ratio * (height - padding * 2);

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
  
              {visibleRows.map((row, index) => {
                const x =
                  padding +
                  index * (chartWidth / visibleRows.length) +
                  barGap / 2;
  
                const contributionHeight =
                  height - padding - getY(row.cumulativeContribution);
  
                const profitHeight =
                  height - padding - getY(row.cumulativeProfit);
  
                const dividendHeight =
                  height - padding - getY(row.cumulativeDividend);
  
                const contributionY = height - padding - contributionHeight;
                const profitY = contributionY - profitHeight;
                const dividendY = profitY - dividendHeight;
  
                return (
                  <g key={row.year}>
                    <rect
                      x={x}
                      y={contributionY}
                      width={barWidth}
                      height={contributionHeight}
                      className="barContribution"
                      rx="2"
                    />
  
                    <rect
                      x={x}
                      y={profitY}
                      width={barWidth}
                      height={profitHeight}
                      className="barProfit"
                      rx="2"
                    />
  
                    <rect
                      x={x}
                      y={dividendY}
                      width={barWidth}
                      height={dividendHeight}
                      className="barDividend"
                      rx="2"
                    />
  
                      {(row.year === 1 || row.year % 5 === 0 || row.year === rows.length) && (
                        <text
                          x={x + barWidth / 2}
                          y={height - 18}
                          textAnchor="middle"
                          className="chartYearLabel"
                        >
                          {row.year}
                        </text>
                      )}
                  </g>
                );
              })}
              <polyline
                points={realValuePoints}
                className="realValueLine"
              />
            </svg>
          </div>
  
          <div className="chartLegend">
            <span>
              <i className="legendDot contribution" />
              누적 납입금
            </span>
  
            <span>
              <i className="legendDot profit" />
              누적 수익금
            </span>
  
            <span>
              <i className="legendDot dividend" />
              누적 배당금
            </span>
  
            <span>
              <i className="legendLine real" />
              물가 반영 평가금액
            </span>
          </div>
        </div>
      </div>
    );
  }

  export default PerformanceChart;