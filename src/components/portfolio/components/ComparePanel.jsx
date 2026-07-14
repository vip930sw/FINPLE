import PortfolioCompareLineChart from "./PortfolioCompareLineChart";

function getCompactPortfolioName(name) {
  return String(name || "Portfolio")
    .replace(/\s*sample\s*portfolio\s*$/iu, "")
    .trim() || "Portfolio";
}

function formatMaybeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? `${Math.floor(numberValue).toLocaleString()}원` : "-";
}

function formatMaybeFixed(value, digits = 2) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? `${numberValue.toFixed(digits)}%` : "-";
}

function formatRank(value) {
  return value === "-" || value === null || value === undefined ? "-" : `${value}위`;
}

export default function ComparePanel({ insightComparisonPortfolios, chartComparisonPortfolios }) {
  return (
    <div className="simulatorTabPanel comparePanel">
      <div className="tabSectionHeader">
        <p className="sectionLabel">Step 2. Portfolio</p>
        <h3>포트폴리오 비교</h3>
        <p>저장된 포트폴리오의 월간 baseline 결과를 비교합니다.</p>
      </div>

      <div className="portfolioComparePanel" id="portfolio-data">
        <div className="portfolioCompareHeader">
          <div>
            <p className="sectionLabel">Portfolio Compare</p>
            <h3>포트폴리오 비교</h3>
            <p>차트와 순위는 baseline 계산이 준비된 포트폴리오만 사용합니다.</p>
          </div>
        </div>

        <div className="portfolioCompareGrid">
          {insightComparisonPortfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className={`portfolioCompareCard ${
                portfolio.realValueRank <= 3 ? `rank${portfolio.realValueRank}` : ""
              }`}
            >
              <div className="portfolioCompareCardTop">
                <strong title={portfolio.name}>{getCompactPortfolioName(portfolio.name)}</strong>

                {portfolio.realValueRank <= 3 && (
                  <span className={`rankBadge rank${portfolio.realValueRank}`}>
                    실질가치 {formatRank(portfolio.realValueRank)}
                  </span>
                )}
              </div>

              <div className="compareRankGrid">
                <div>
                  <p>실질가치</p>
                  <strong>{formatRank(portfolio.realValueRank)}</strong>
                </div>

                <div>
                  <p>성장성</p>
                  <strong>{formatRank(portfolio.growthRank)}</strong>
                </div>

                <div>
                  <p>안정성</p>
                  <strong>{formatRank(portfolio.stabilityRank)}</strong>
                </div>

                <div>
                  <p>배당</p>
                  <strong>{formatRank(portfolio.dividendRank)}</strong>
                </div>
              </div>

              <dl>
                <div>
                  <dt>물가 반영 평가금액</dt>
                  <dd className="realValue">
                    {formatMaybeNumber(portfolio.result.inflationAdjustedFutureValue)}
                  </dd>
                </div>

                <div>
                  <dt>예상 CAGR</dt>
                  <dd>{formatMaybeFixed(portfolio.result.expectedCagr)}</dd>
                </div>

                <div>
                  <dt>예상 MDD</dt>
                  <dd>{formatMaybeFixed(portfolio.result.simpleMdd)}</dd>
                </div>

                <div>
                  <dt>예상 배당률</dt>
                  <dd>{formatMaybeFixed(portfolio.result.expectedDividendYield)}</dd>
                </div>
              </dl>

              <div className="portfolioInsightBox">
                <span>{portfolio.insight.type}</span>
                <p>{portfolio.insight.text}</p>
              </div>
            </div>
          ))}
        </div>

        <PortfolioCompareLineChart portfolios={chartComparisonPortfolios} />
      </div>
    </div>
  );
}
