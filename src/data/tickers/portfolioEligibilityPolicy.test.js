import assert from "node:assert/strict";
import test from "node:test";

import {
  getAssetFinderCardActionState,
  getPortfolioAddDecision,
  isLeveragedOrInverse,
  resolveLeverageRiskProfile,
} from "./portfolioEligibilityPolicy.js";
import { buildMonthlyBaselineProjection } from "../../components/portfolio/utils/monthlyBaselineEngine.js";
import { normalizePersistedMetricFields } from "../../components/portfolio/utils/portfolioAssetPersistence.js";
import { createPortfolioReportText } from "../../components/portfolio/utils/portfolioReports.js";

const readyAsset = {
  ticker: "SPY",
  market: "US",
  targetWeight: 100,
  cagr: 8,
  beta: 1,
  mdd: -20,
  dividendYield: 1,
  simulationCashYield: 1,
  dataStatus: "ready",
  metricsStatus: "ready",
  reviewFlag: "none",
  overlayStatus: "ready",
};

test("Asset Finder card actions prioritize removal, then deny, then add", () => {
  assert.deepEqual(
    getAssetFinderCardActionState({ isAdded: true, policy: "deny", canAdd: false }),
    { label: "제외", disabled: false },
  );
  assert.deepEqual(
    getAssetFinderCardActionState({ policy: "deny" }),
    { label: "추가 불가", disabled: true },
  );
  assert.deepEqual(
    getAssetFinderCardActionState({ policy: "confirm" }),
    { label: "추가", disabled: false },
  );
  assert.deepEqual(
    getAssetFinderCardActionState(),
    { label: "추가", disabled: false },
  );
});

test("price and rolling history produce accurate deny reasons at the configured minimum", () => {
  for (const [asset, reasonCode, message] of [
    [{
      ...readyAsset,
      usablePriceHistoryYears: 2.9,
      rollingCagrWindowYears: 3,
      portfolioEligibleAfterDate: "2027-09-01",
    }, "insufficient_usable_price_history", /가격 이력 2\.9년, 최소 3년 필요/],
    [{
      ...readyAsset,
      usablePriceHistoryYears: 3.1,
      rollingCagrWindowYears: 1,
    }, "insufficient_rolling_window_history", /적용 RM 1년, 최소 3년 필요/],
  ]) {
    const decision = getPortfolioAddDecision(asset);
    assert.equal(decision.policy, "deny");
    assert.equal(decision.reasonCode, reasonCode);
    assert.match(decision.message, message);
    assert.doesNotMatch(decision.message, /3\.1년.*최소 3년/);
    const reloaded = {
      ...asset,
      ...normalizePersistedMetricFields(JSON.parse(JSON.stringify(asset))),
    };
    const result = buildMonthlyBaselineProjection({
      settings: {
        startValue: 1000,
        years: 1,
        monthlyCashFlow: 0,
        inflationRate: 0,
        dividendReinvest: true,
      },
      assets: [reloaded],
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockReasons.join("|"), /portfolio_add_denied:SPY/);
    assert.deepEqual(result.portfolioEligibilityBlocks, [{
      market: "US",
      ticker: "SPY",
      reasonCode,
      usablePriceHistoryYears: asset.usablePriceHistoryYears,
      rollingCagrWindowYears: asset.rollingCagrWindowYears,
      minimumPortfolioHistoryYears: 3,
      portfolioEligibleAfterDate: asset.portfolioEligibleAfterDate || "",
    }]);
  }
});

test("custom minimum history years controls both history checks", () => {
  const decision = getPortfolioAddDecision({
    ...readyAsset,
    usablePriceHistoryYears: 4.9,
    rollingCagrWindowYears: 4,
    minimumPortfolioHistoryYears: 5,
  });
  assert.equal(decision.reasonCode, "insufficient_price_and_rolling_history");
  assert.match(decision.message, /최소 5년 필요/);
});

test("history availability text names the metric that is still insufficient", () => {
  const priceOnly = getPortfolioAddDecision({
    ...readyAsset,
    usablePriceHistoryYears: 2.9,
    rollingCagrWindowYears: 3,
  });
  assert.match(
    priceOnly.message,
    /충분한 가격 이력이 확보된 이후 사용할 수 있습니다\./,
  );

  const rmOnly = getPortfolioAddDecision({
    ...readyAsset,
    usablePriceHistoryYears: 3.1,
    rollingCagrWindowYears: 1,
  });
  assert.match(
    rmOnly.message,
    /충분한 장기 RM 표본이 확보된 이후 사용할 수 있습니다\./,
  );
  assert.doesNotMatch(
    rmOnly.message,
    /충분한 가격 이력이 확보된 이후/,
  );

  const both = getPortfolioAddDecision({
    ...readyAsset,
    usablePriceHistoryYears: 2.9,
    rollingCagrWindowYears: 1,
  });
  assert.match(
    both.message,
    /가격 이력과 장기 RM 표본이 모두 확보된 이후 사용할 수 있습니다\./,
  );
});

test("multiple blocked assets are retained once each after persisted reload", () => {
  const assets = ["AAA", "BBB"].map((ticker) => {
    const source = {
      ...readyAsset,
      ticker,
      targetWeight: 50,
      usablePriceHistoryYears: 3.1,
      rollingCagrWindowYears: 1,
    };
    return { ...source, ...normalizePersistedMetricFields(JSON.parse(JSON.stringify(source))) };
  });
  const result = buildMonthlyBaselineProjection({
    settings: {
      startValue: 1000,
      years: 1,
      monthlyCashFlow: 0,
      inflationRate: 0,
      dividendReinvest: true,
    },
    assets,
  });
  assert.deepEqual(
    result.portfolioEligibilityBlocks.map((block) => `${block.market}:${block.ticker}`),
    ["US:AAA", "US:BBB"],
  );
  const report = createPortfolioReportText({ result, assets });
  assert.equal(report.match(/US:AAA:/g)?.length, 1);
  assert.equal(report.match(/US:BBB:/g)?.length, 1);
  assert.match(report, /제거하거나 이용 가능한 자산으로 교체/);
});

test("inactive and operator exclusion take priority over short history", () => {
  assert.equal(
    getPortfolioAddDecision({
      ...readyAsset,
      active: false,
      portfolioEligible: false,
      portfolioAddPolicy: "deny",
      portfolioEligibilityStatus: "inactive",
      usablePriceHistoryYears: 1,
    }).reasonCode,
    "inactive",
  );
  assert.equal(
    getPortfolioAddDecision({
      ...readyAsset,
      portfolioEligible: false,
      portfolioAddPolicy: "deny",
      portfolioEligibilityStatus: "excluded_by_operator",
      usablePriceHistoryYears: 1,
    }).reasonCode,
    "excluded_by_operator",
  );
});

test("long-history leveraged and inverse assets require one confirmation", () => {
  const asset = {
    ...readyAsset,
    ticker: "SQQQ",
    usablePriceHistoryYears: 10,
    rollingCagrWindowYears: 3,
    exposureType: "leveraged_inverse",
    leverageMultiple: -3,
    direction: "inverse",
    resetFrequency: "daily",
  };
  assert.equal(isLeveragedOrInverse(asset), true);
  const decision = getPortfolioAddDecision(asset);
  assert.equal(decision.policy, "confirm");
  assert.equal(decision.reasonCode, "leveraged_or_inverse_risk");
  assert.equal(
    getPortfolioAddDecision({
      ...asset,
      ...normalizePersistedMetricFields({
        ...asset,
        portfolioRiskConfirmed: true,
      }),
    }).policy,
    "allow",
  );
});

test("explicit short-history deny wins over leveraged confirmation", () => {
  const decision = getPortfolioAddDecision({
    ...readyAsset,
    ticker: "NEW3X",
    usablePriceHistoryYears: 1.5,
    rollingCagrWindowYears: 1,
    exposureType: "leveraged_etf",
    leverageMultiple: 3,
  });
  assert.equal(decision.policy, "deny");
  assert.equal(decision.reasonCode, "insufficient_price_and_rolling_history");
});

test("verified leverage tiers vary by diversification while inverse is always tier 4", () => {
  const cases = [
    ["UPRO", "broad_market_index", 3, "long", "1", "standard", "주의 요함"],
    ["TQQQ", "concentrated_index", 3, "long", "2", "standard", "주의 필요"],
    ["SOXL", "sector_index", 3, "long", "2", "standard", "높은 주의 필요"],
    ["AAPU", "single_stock", 2, "long", "3", "strong", "장기보유를 권장하지 않음"],
    ["SH", "broad_market_index", -1, "inverse", "4", "strong", "장기투자에 적절하지 않음"],
    ["SQQQ", "concentrated_index", -3, "inverse", "4", "strong", "장기투자에 적절하지 않음"],
  ];
  for (const [ticker, exposureScope, leverageMultiple, direction, tier, mode, label] of cases) {
    const asset = {
      ...readyAsset,
      ticker,
      usablePriceHistoryYears: 10,
      rollingCagrWindowYears: 3,
      metadataVerificationStatus: "verified",
      leverageRiskTier: tier,
      exposureScope,
      leverageMultiple,
      direction,
      resetFrequency: "daily",
      confirmationMode: mode,
      leverageWarningLabelKo: label,
    };
    const decision = getPortfolioAddDecision(asset);
    assert.equal(decision.policy, "confirm");
    assert.equal(decision.reasonCode, `leverage_risk_tier_${tier}`);
    assert.equal(decision.riskProfile.confirmationMode, mode);
    assert.equal(decision.title, label);
    assert.match(
      decision.riskProfile.badges.join(" "),
      new RegExp(`일일 ${leverageMultiple > 0 ? "\\+" : ""}${leverageMultiple}X`),
    );
    assert.match(decision.message, /일일/);
  }
});

test("pending metadata is not described as verified and requires strong confirmation", () => {
  const decision = getPortfolioAddDecision({
    ...readyAsset,
    ticker: "PENDING2X",
    usablePriceHistoryYears: 10,
    rollingCagrWindowYears: 3,
    metadataVerificationStatus: "pending_official_source",
    leverageRiskTier: "pending",
  });
  assert.equal(decision.policy, "confirm");
  assert.equal(decision.reasonCode, "leverage_metadata_verification_pending");
  assert.equal(decision.riskProfile.confirmationMode, "strong");
  assert.match(decision.message, /검증이 완료되지 않았습니다/);
  assert.doesNotMatch(decision.message, /Tier [1-4]/);
});

test("tier 2 copy and severity differ by exposure scope", () => {
  const base = {
    ...readyAsset,
    metadataVerificationStatus: "verified",
    leverageRiskTier: "2",
    leverageMultiple: 3,
    direction: "long",
    resetFrequency: "daily",
    portfolioWarningSeverity: "high",
    longTermSuitability: "high_caution",
  };
  const sector = resolveLeverageRiskProfile({
    ...base,
    exposureScope: "sector_index",
  });
  const concentrated = resolveLeverageRiskProfile({
    ...base,
    exposureScope: "concentrated_index",
  });
  assert.equal(sector.label, "높은 주의 필요");
  assert.match(sector.message, /동일 산업·테마 위험요인/);
  assert.match(sector.message, /실질 분산효과가 제한/);
  assert.equal(concentrated.label, "주의 필요");
  assert.match(concentrated.message, /단일종목보다 분산/);
  assert.match(concentrated.message, /특정 산업·대형종목에 집중/);
  assert.notEqual(sector.message, concentrated.message);
  for (const profile of [sector, concentrated]) {
    assert.equal(profile.severity, "high");
    assert.equal(profile.longTermSuitability, "high_caution");
    assert.match(profile.badges.join(" "), /위험강도 높음/);
  }
});

test("non-equity scopes use distinct tier 2 warnings and persist", () => {
  const cases = [
    ["currency_futures", /통화선물/, /환율|롤오버/],
    ["sovereign_bond_futures", /국채선물/, /금리·듀레이션/],
    ["commodity_futures", /원자재선물/, /현물가격/],
    ["commodity_asset", /단일 원자재/, /높은 변동성/],
    ["crypto_asset", /단일 암호자산/, /24시간 시장/],
    ["corporate_bond_index", /회사채 지수/, /신용스프레드·부도·유동성/],
  ];
  for (const [exposureScope, subject, detail] of cases) {
    const asset = JSON.parse(JSON.stringify({
      ...readyAsset,
      metadataVerificationStatus: "verified",
      leverageRiskTier: "2",
      leverageMultiple: 2,
      direction: "long",
      resetFrequency: "daily",
      exposureScope,
      longTermSuitability: "high_caution",
      portfolioWarningSeverity: "high",
      confirmationMode: "standard",
    }));
    const profile = resolveLeverageRiskProfile(asset);
    assert.equal(profile.label, "높은 주의 필요");
    assert.equal(profile.exposureScope, exposureScope);
    assert.equal(profile.severity, "high");
    assert.equal(profile.longTermSuitability, "high_caution");
    assert.match(profile.message, subject);
    assert.match(profile.message, detail);
    assert.match(profile.message, /경로의존성/);
    assert.equal(getPortfolioAddDecision(asset).policy, "confirm");
  }
});

test("non-daily ETNs show their actual reset frequency", () => {
  for (const asset of [
    {
      ...readyAsset,
      ticker: "DZZ",
      metadataVerificationStatus: "verified",
      exposureType: "commodity_futures_inverse_etn",
      leverageRiskTier: "4",
      leverageMultiple: -2,
      direction: "inverse",
      resetFrequency: "monthly",
      exposureScope: "commodity_futures",
      confirmationMode: "strong",
      expectedBadge: "월간 -2X",
      expectedReset: "월간",
    },
    {
      ...readyAsset,
      ticker: "SCDL",
      metadataVerificationStatus: "verified",
      exposureType: "index_leveraged_etn",
      leverageRiskTier: "2",
      leverageMultiple: 2,
      direction: "long",
      resetFrequency: "quarterly",
      exposureScope: "concentrated_index",
      confirmationMode: "standard",
      expectedBadge: "분기 +2X",
      expectedReset: "분기",
    },
  ]) {
    const decision = getPortfolioAddDecision(asset);
    assert.equal(decision.policy, "confirm");
    assert.equal(
      decision.riskProfile.confirmationMode,
      asset.confirmationMode,
    );
    assert.match(
      decision.riskProfile.badges.join(" "),
      new RegExp(asset.expectedBadge.replace("+", "\\+")),
    );
    assert.match(decision.message, new RegExp(asset.expectedReset));
    assert.doesNotMatch(decision.message, /일일/);
    assert.match(decision.message, /ETN은 발행사 신용위험/);
  }
});

test("unknown reset frequency is shown without inventing a daily reset", () => {
  const profile = resolveLeverageRiskProfile({
    ...readyAsset,
    metadataVerificationStatus: "verified",
    leverageRiskTier: "2",
    leverageMultiple: 2,
    direction: "long",
    resetFrequency: "custom_cycle",
    exposureScope: "concentrated_index",
  });
  assert.match(profile.badges.join(" "), /custom_cycle \+2X/);
  assert.match(profile.message, /custom_cycle/);
  assert.doesNotMatch(profile.message, /일일/);
});

test("official rejected metadata restores the general asset policy", () => {
  const rejected = {
    ...readyAsset,
    name: "Example 2X Long Fund",
    exposureType: "single_stock_leveraged",
    leverageMultiple: 2,
    metadataVerificationStatus: "rejected",
    metadataVerificationSource: "official_registry",
    leverageRiskTier: "not_applicable",
    longTermSuitability: "not_applicable",
    portfolioAddPolicy: "allow",
  };
  assert.equal(resolveLeverageRiskProfile(rejected), null);
  assert.equal(getPortfolioAddDecision(rejected).policy, "allow");
  const reloaded = {
    ...rejected,
    ...normalizePersistedMetricFields(
      JSON.parse(JSON.stringify(rejected)),
    ),
  };
  assert.equal(resolveLeverageRiskProfile(reloaded), null);
  assert.equal(getPortfolioAddDecision(reloaded).policy, "allow");
});

test("tier metadata survives persistence and appears in reports", () => {
  const source = {
    ...readyAsset,
    ticker: "UPRO",
    metadataVerificationStatus: "verified",
    leverageRiskTier: "1",
    exposureScope: "broad_market_index",
    leverageMultiple: 3,
    direction: "long",
    resetFrequency: "daily",
    confirmationMode: "standard",
    leverageWarningLabelKo: "주의 요함",
    portfolioWarningSeverity: "caution",
    longTermSuitability: "caution",
    leverageMetadataRegistryActive: "true",
    leverageMetadataRegistryApplied: "true",
    leverageMetadataRegistryValues: "{\"metadataVerificationStatus\":\"verified\"}",
    leverageMetadataRegistryFingerprint: "fixture-fingerprint",
  };
  const reloaded = {
    ...source,
    ...normalizePersistedMetricFields(JSON.parse(JSON.stringify(source))),
  };
  const profile = resolveLeverageRiskProfile(reloaded);
  assert.equal(profile.tier, "1");
  assert.equal(profile.severity, "caution");
  assert.equal(reloaded.leverageMetadataRegistryApplied, "true");
  assert.equal(
    reloaded.leverageMetadataRegistryFingerprint,
    "fixture-fingerprint",
  );
  assert.match(
    createPortfolioReportText({ assets: [reloaded], result: {} }),
    /UPRO.*위험강도 caution.*주의 요함/,
  );
});
