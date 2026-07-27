import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("Screener cards render dividend and analysis readiness as separate facts", async () => {
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
        expectedAnalysis: "분석 가능",
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
        expectedAnalysis: "분석 가능",
        item: {
          dividendYield: 3.30,
          dividendStatus: "confirmed_value",
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
      assert.match(html, new RegExp(fixture.expectedDividend), fixture.ticker);
      assert.match(
        html,
        new RegExp(fixture.expectedAnalysis || "분석 지표 검토 필요"),
        fixture.ticker,
      );
    }
  } finally {
    await vite.close();
  }
});
