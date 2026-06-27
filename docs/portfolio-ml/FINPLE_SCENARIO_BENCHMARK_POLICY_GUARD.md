# FINPLE Scenario Benchmark Policy Guard

Date: 2026-06-27
Issue: #221
Step: 114-1C

## Purpose

Step 114-1C adds a pure benchmark policy guard before any Bootstrap, API, UI, AI, DB, or `calculatePortfolioResult()` integration work.

The goal is to prevent scenario analysis from using summary BETA values or mismatched benchmark proxies as if they were validated monthly benchmark return series.

## Current Data Quality Progress

Data quality work has two separate layers.

| Layer | Scope | Current status |
| --- | --- | --- |
| Step 113 Data Sentinel | 5,641 audited assets | Rules and ML anomaly baseline exist. `asset_quality_summary_latest.json` reports 2,568 valid, 1,339 warning, and 1,734 review rows. |
| Step 114 scenario data coverage | 6,000 candidate rows | Coverage gate exists. `scenario_data_coverage.csv` reports A=0, B=5,757, C=243. |
| Step 114 calculation utilities | Explicit monthly inputs only | Risk metric and historical rolling utilities exist, but they do not refetch provider data and do not infer time series from summary fields. |

This means data quality governance is partially implemented, but scenario-grade input quality is not yet high enough for production probability bands. There is still no committed asset-level monthly price, adjusted-close, total-return, benchmark, dividend, or FX time series.

## Benchmark Policy

| Portfolio composition | Benchmark policy |
| --- | --- |
| US weight >= 80% | `SP500_TR` |
| KR weight >= 80% | `KOSPI200_TR` |
| US/KR mixed below either 80% threshold | `COMPOSITE_US_KR` using the portfolio market weights |

The policy supports fallback IDs only as refetch/proxy inputs, not as proof that total-return benchmark series exists:

| Benchmark | Accepted fallback IDs | Readiness meaning |
| --- | --- | --- |
| `SP500_TR` | `SPY` | Proxy refetch required until monthly benchmark returns are persisted |
| `KOSPI200_TR` | `069500`, `102110`, `148020`, `105190`, `152100`, `278530` | Proxy refetch required until KOSPI 200 monthly benchmark returns are persisted |

## Representative Asset Findings

| Market | Tickers | Current benchmark | Step 114-1C status |
| --- | --- | --- | --- |
| US | SPY / VOO / IVV, VTI / ITOT / SCHB, QQQ / QQQM | `SPY` | Allowed only as `proxy_refetch_required`; not A-grade |
| KR | 069500 / 102110 / 148020, 105190 / 152100 / 278530 | `^KS11` | `blocked_policy_benchmark_should_be_kospi200` |

The KR representative ETF finding is intentionally stricter than the current KR overlay because KOSPI 200 ETF BETA should not be treated as KOSPI BETA.

## Added Files

| File | Role |
| --- | --- |
| `server/src/services/scenario/benchmarkPolicy.js` | Select US/KR/composite portfolio benchmark, classify asset benchmark policy, and block missing benchmark monthly returns |
| `server/src/services/scenario/benchmarkPolicy.test.js` | Regression tests for US, KR, mixed benchmark selection and KR KOSPI 200 ETF blocking |

## Non-Goals

This step does not:

- add Bootstrap or random sampling
- add an API route
- modify Compare chart or portfolio UI
- modify `calculatePortfolioResult()`
- persist benchmark data
- refetch provider data
- recalculate BETA
- replace missing monthly series with zero

## Next Boundary

Step 114 can proceed in one of two safe directions:

1. Add a deterministic monthly-return fixture/cache schema and keep it offline until source licensing and refresh policy are clear. Step 114-1D now provides this header-only schema and validator.
2. Add a provider-refetch cache job that persists monthly asset, benchmark, dividend, and FX returns with data version metadata.

`Step 114-2B` joint block Bootstrap should wait until one of those inputs exists. Running Bootstrap on summary CAGR, MDD, or BETA would violate the Step 114-1A audit conclusion.
