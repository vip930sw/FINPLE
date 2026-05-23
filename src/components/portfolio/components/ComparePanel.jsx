import PortfolioCompareLineChart from "./PortfolioCompareLineChart";

function getCompactPortfolioName(name) {
  return String(name || "포트폴리오")
    .replace(/\s*예시\s*포트폴리오\s*$/u, "")
    .trim() || "포트폴리오";
}

export default function ComparePanel({ insightComparisonPortfolios, chartComparisonPortfolios }) {
  return (
    <div className="simulatorTabPanel comparePanel">
      <div className="tabSectionHeader">
        <p className="sectionLabel">Step 3. Portfolio</p>
        <h3>포트폴리오 비교</h3>
        <p>
          저장된 포트폴리오의 실질가치, 성장성, 안정성, 배당 매력을 비교합니다.
        </p>
      </div>

      <div className="portfolioComparePanel" id="portfolio-data">
        <div className="portfolioCompareHeader">
          <div>
            <p className="sectionLabel">Portfolio Compare</p>
            <h3>포트폴리오 비교</h3>
          </div>

          <p>
            저장된 포트폴리오의 실질가치, 성장성, 안정성, 배당 매력을 비교합니다.
          </p>
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
                    실질가치 {portfolio.realValueRank}위
                  </span>
                )}
              </div>

              <div className="compareRankGrid">
                <div>
                  <p>실질가치</p>
                  <strong>{portfolio.realValueRank}위</strong>
                </div>

                <div>
                  <p>성장성</p>
                  <strong>{portfolio.growthRank}위</strong>
                </div>

                <div>
                  <p>안정성</p>
                  <strong>{portfolio.stabilityRank}위</strong>
                </div>

                <div>
                  <p>배당</p>
                  <strong>{portfolio.dividendRank}위</strong>
                </div>
              </div>

              <dl>
                <div>
                  <dt>물가 반영 평가금액</dt>
                  <dd className="realValue">
                    {portfolio.result.inflationAdjustedFutureValue.toLocaleString()}원
                  </dd>
                </div>

                <div>
                  <dt>예상 CAGR</dt>
                  <dd>{portfolio.result.expectedCagr.toFixed(2)}%</dd>
                </div>

                <div>
                  <dt>예상 MDD</dt>
                  <dd>{portfolio.result.simpleMdd.toFixed(2)}%</dd>
                </div>

                <div>
                  <dt>예상 배당률</dt>
                  <dd>{portfolio.result.expectedDividendYield.toFixed(2)}%</dd>
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