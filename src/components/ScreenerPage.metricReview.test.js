import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("Screener cards render dividend and metric review status as separate facts", async () => {
  const vite = await createServer({
    root: fileURLToPath(new URL("../..", import.meta.url)),
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true },
  });

  try {
    const { ScreenerCandidateCard } = await vite.ssrLoadModule(
      "/src/components/ScreenerPage.jsx",
    );
    const { default: PortfolioAddDecisionDialog } = await vite.ssrLoadModule(
      "/src/components/portfolio/components/PortfolioAddDecisionDialog.jsx",
    );
    const { TickerResultCard } = await vite.ssrLoadModule(
      "/src/components/portfolio/components/AssetFinderPanel.jsx",
    );
    const { default: ComparePanel } = await vite.ssrLoadModule(
      "/src/components/portfolio/components/ComparePanel.jsx",
    );
    const fixtures = [
      {
        ticker: "TQQQ",
        expectedDividend: "배당 0.47%",
        item: {
          dividendYield: 0.47,
          dividendStatus: "confirmed_value",
          dataStatus: "ready",
          metricsStatus: "ready",
          reviewFlag: "review_required",
        },
      },
      {
        ticker: "SOXL",
        expectedDividend: "배당 확인 중",
        item: {
          dividendYield: 0,
          dividendStatus: "confirmed_value",
          dataStatus: "ready",
          metricsStatus: "ready",
          reviewFlag: "review_required",
        },
      },
      {
        ticker: "069500",
        expectedDividend: "배당 0.46%",
        item: {
          market: "KR",
          dividendYield: 0.46,
          dividendStatus: "confirmed_value",
          dataStatus: "review_required",
          metricsStatus: "review_required",
          reviewFlag: "review_required",
        },
      },
      {
        ticker: "GLD",
        expectedDividend: "배당 0.00%",
        expectedMetricReview: "지표 검토 완료",
        item: {
          dividendYield: 0,
          dividendStatus: "confirmed_zero",
          dataStatus: "ready",
          metricsStatus: "ready",
          reviewFlag: "none",
        },
      },
      {
        ticker: "SCHD",
        expectedDividend: "배당 3.30%",
        expectedMetricReview: "지표 검토 완료",
        item: {
          dividendYield: 3.30,
          dividendStatus: "confirmed_value",
          dataStatus: "ready",
          metricsStatus: "ready",
          reviewFlag: "none",
        },
      },
      {
        ticker: "AIPI",
        expectedDistribution: "최근 12개월 분배율 34.98%",
        expectedMetricReview: "지표 검토 완료",
        item: {
          exposureType: "single_stock_option_income",
          distributionType: "mixed_distribution",
          distributionFrequency: "weekly",
          dividendYield: null,
          dividendStatus: "missing",
          trailingDistributionYield: 34.98,
          dataStatus: "ready",
          metricsStatus: "ready",
          reviewFlag: "none",
        },
      },
      {
        ticker: "QYLG",
        expectedDistribution: "최근 12개월 분배율 16.26%",
        expectedMetricReview: "지표 검토 완료",
        item: {
          exposureType: "index_covered_call_growth",
          distributionType: "mixed_distribution",
          distributionFrequency: "monthly",
          dividendYield: null,
          dividendStatus: "missing",
          trailingDistributionYield: 16.26,
          dataStatus: "ready",
          metricsStatus: "ready",
          reviewFlag: "none",
        },
      },
    ];

    for (const fixture of fixtures) {
      const html = renderToStaticMarkup(
        React.createElement(ScreenerCandidateCard, {
          item: {
            ticker: fixture.ticker,
            koreanName: fixture.ticker,
            market: "US",
            type: "ETF",
            distributionType: "ordinary_cash_dividend",
            exposureType: "ordinary_etf",
            strategy: "growth",
            riskLevel: "high",
            goals: [],
            tags: [],
            active: true,
            listingStatus: "active",
            expectedCagr: 10,
            mdd: -20,
            ...fixture.item,
          },
          isAdded: false,
          onAdd: () => {},
        }),
      );
      if (fixture.expectedDividend) {
        assert.match(html, new RegExp(fixture.expectedDividend), fixture.ticker);
      } else {
        assert.match(html, new RegExp(fixture.expectedDistribution), fixture.ticker);
        assert.doesNotMatch(html, /<span>배당 /, fixture.ticker);
      }
      assert.doesNotMatch(html, /분석 가능/, fixture.ticker);
      assert.match(
        html,
        new RegExp(fixture.expectedMetricReview || "분석 지표 검토 필요"),
        fixture.ticker,
      );
    }

    const shortHistoryHtml = renderToStaticMarkup(
      React.createElement(ScreenerCandidateCard, {
        item: {
          ticker: "PLUS200TR",
          koreanName: "PLUS 200 TR",
          market: "KR",
          type: "ETF",
          exposureType: "ordinary_etf",
          distributionType: "ordinary_cash_dividend",
          active: true,
          listingStatus: "active",
          usablePriceHistoryYears: 1.9,
          rollingCagrWindowYears: 1,
          portfolioEligible: false,
          portfolioAddPolicy: "deny",
          portfolioEligibilityStatus: "insufficient_long_horizon_history",
          portfolioEligibleAfterDate: "2027-09-01",
          goals: [],
          tags: [],
        },
        isAdded: false,
        onAdd: () => {},
      }),
    );
    assert.match(shortHistoryHtml, /disabled=""/);
    assert.match(shortHistoryHtml, /aria-disabled="true"/);
    assert.match(shortHistoryHtml, /가격 이력 1\.9년/);
    assert.match(shortHistoryHtml, /포트폴리오 이용 불가/);
    assert.match(shortHistoryHtml, /2027-09-01 이후/);

    const leveragedHtml = renderToStaticMarkup(
      React.createElement(ScreenerCandidateCard, {
        item: {
          ticker: "SQQQ",
          koreanName: "SQQQ",
          market: "US",
          type: "ETF",
          exposureType: "leveraged_inverse",
          leverageMultiple: -3,
          direction: "inverse",
          resetFrequency: "daily",
          active: true,
          listingStatus: "active",
          usablePriceHistoryYears: 10,
          rollingCagrWindowYears: 3,
          portfolioEligible: true,
          portfolioAddPolicy: "confirm",
          goals: [],
          tags: [],
        },
        isAdded: false,
        onAdd: () => {},
      }),
    );
    assert.doesNotMatch(leveragedHtml, /disabled=""/);
    assert.match(leveragedHtml, /확인 후 추가/);
    assert.match(leveragedHtml, /레버리지·인버스 위험 확인/);
    assert.match(leveragedHtml, /일일 -3X/);
    assert.match(leveragedHtml, /인버스/);
    assert.match(leveragedHtml, /장기보유 주의/);
    assert.match(leveragedHtml, /극단 변동성/);
    assert.match(leveragedHtml, /leverageRiskNotice--high/);
    assert.match(leveragedHtml, /위험강도 높음/);

    const finderTierHtml = renderToStaticMarkup(
      React.createElement(TickerResultCard, {
        item: {
          ticker: "SOXL",
          market: "US",
          type: "ETF",
          metadataVerificationStatus: "verified",
          leverageRiskTier: "2",
          exposureScope: "sector_index",
          leverageWarningLabelKo: "높은 주의 필요",
          leverageMultiple: 3,
          direction: "long",
          resetFrequency: "daily",
          portfolioEligible: true,
          portfolioAddPolicy: "confirm",
          usablePriceHistoryYears: 10,
          rollingCagrWindowYears: 3,
          tags: [],
        },
        isAdded: false,
        onAdd: () => {},
      }),
    );
    assert.match(finderTierHtml, /높은 주의 필요/);
    assert.match(finderTierHtml, /섹터·테마 집중/);
    assert.match(finderTierHtml, /일일 \+3X/);
    assert.match(finderTierHtml, /leverageRiskNotice--high/);
    assert.match(finderTierHtml, /data-warning-severity="high"/);

    const compareTierHtml = renderToStaticMarkup(
      React.createElement(ComparePanel, {
        insightComparisonPortfolios: [{
          id: "tier-portfolio",
          name: "Tier portfolio",
          realValueRank: 4,
          growthRank: 4,
          stabilityRank: 4,
          cashFlowRank: 4,
          result: {},
          insight: { type: "위험", text: "확인 필요" },
          assets: [{
            ticker: "SH",
            market: "US",
            metadataVerificationStatus: "verified",
            leverageRiskTier: "4",
            exposureScope: "broad_market_index",
            leverageWarningLabelKo: "장기투자에 적절하지 않음",
            leverageMultiple: -1,
            direction: "inverse",
            resetFrequency: "daily",
            confirmationMode: "strong",
          }],
        }],
        chartComparisonPortfolios: [],
      }),
    );
    assert.match(compareTierHtml, /SH: 장기투자에 적절하지 않음/);
    assert.match(compareTierHtml, /장기보유 부적합/);
    assert.match(compareTierHtml, /leverageRiskNotice--critical/);

    const specialDistributionHtml = renderToStaticMarkup(
      React.createElement(ScreenerCandidateCard, {
        item: {
          ticker: "AIV",
          koreanName: "AIV",
          market: "US",
          type: "ETF",
          exposureType: "ordinary_etf",
          distributionType: "special_or_liquidating_distribution",
          distributionSimulationPolicy: "exclude_non_recurring_distribution",
          active: true,
          listingStatus: "active",
          portfolioEligible: true,
          portfolioAddPolicy: "allow",
          goals: [],
          tags: [],
        },
        isAdded: false,
        onAdd: () => {},
      }),
    );
    assert.match(
      specialDistributionHtml,
      /특별·청산 분배금 · 재투자 제외/,
    );

    const denialDialogHtml = renderToStaticMarkup(
      React.createElement(PortfolioAddDecisionDialog, {
        dialog: {
          decision: {
            policy: "deny",
            title: "포트폴리오에 추가할 수 없습니다",
            message: "가격 이력이 부족합니다.",
          },
        },
        onClose: () => {},
        onConfirm: () => {},
        onViewAsset: () => {},
      }),
    );
    assert.match(denialDialogHtml, /role="dialog"/);
    assert.match(denialDialogHtml, />확인</);
    assert.match(denialDialogHtml, />자산 상세 보기</);

    const confirmationDialogHtml = renderToStaticMarkup(
      React.createElement(PortfolioAddDecisionDialog, {
        dialog: {
          decision: {
            policy: "confirm",
            title: "레버리지·인버스 상품 위험 확인",
            message: "장기보유 위험을 확인하세요.",
          },
        },
        onClose: () => {},
        onConfirm: () => {},
        onViewAsset: () => {},
      }),
    );
    assert.match(confirmationDialogHtml, />위험을 확인하고 추가</);
    assert.match(confirmationDialogHtml, />취소</);

    const strongConfirmationHtml = renderToStaticMarkup(
      React.createElement(PortfolioAddDecisionDialog, {
        dialog: {
          decision: {
            policy: "confirm",
            title: "장기투자에 적절하지 않음",
            message: "인버스 위험을 확인하세요.",
            riskProfile: {
              kind: "verified",
              tier: "4",
              confirmationMode: "strong",
              severity: "critical",
              badges: ["인버스", "일일 -3X", "위험강도 매우 높음", "장기보유 부적합"],
            },
          },
        },
        onClose: () => {},
        onConfirm: () => {},
        onViewAsset: () => {},
      }),
    );
    assert.match(strongConfirmationHtml, /장기투자 부적합성을 확인하고 추가/);
    assert.match(strongConfirmationHtml, /leverageRiskNotice--critical/);
    assert.match(strongConfirmationHtml, /data-warning-severity="critical"/);
    assert.match(strongConfirmationHtml, /aria-describedby="portfolioAddDecisionMessage"/);
    assert.match(strongConfirmationHtml, /aria-label="장기투자에 적절하지 않음: 인버스, 일일 -3X, 위험강도 매우 높음, 장기보유 부적합"/);

    for (const [riskProfile, expected] of [
      [{ kind: "verified", tier: "3", severity: "high" }, "집중위험을 확인하고 추가"],
      [{ kind: "pending", tier: "pending", severity: "high" }, "미검증 상품 위험을 확인하고 추가"],
    ]) {
      const html = renderToStaticMarkup(
        React.createElement(PortfolioAddDecisionDialog, {
          dialog: {
            decision: {
              policy: "confirm",
              title: "위험 확인",
              message: "위험 내용을 확인하세요.",
              riskProfile,
            },
          },
          onClose: () => {},
          onConfirm: () => {},
          onViewAsset: () => {},
        }),
      );
      assert.match(html, new RegExp(expected));
    }
    assert.doesNotMatch(strongConfirmationHtml, /강한 위험을 확인하고 추가/);
  } finally {
    await vite.close();
  }
});
