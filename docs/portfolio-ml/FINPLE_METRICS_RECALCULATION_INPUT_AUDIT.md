# FINPLE Metrics Recalculation Input Audit

Created: 2026-06-27
Repository: `vip930sw/FINPLE`
Base branch: `main`
Issue: #221, Step 114-1A

## Purpose

This document audits whether FINPLE currently has the time-series inputs needed to recalculate Raw CAGR, Rolling CAGR, MDD, Rolling MDD, and BETA for the 6,000-asset candidate universe and the required representative assets.

## Summary

- Raw CAGR: summary values exist for 5757 assets through close-price overlays, but true recalculation requires provider refetch because source price series are not committed.
- Rolling CAGR: no committed rolling window inputs or rolling output columns exist. 24 assets have enough overlay evidence to try provider refetch; 5733 are short-history or below the strict 120-month requirement.
- MDD: summary values exist for the same B-grade price overlay set, but true recalculation requires provider refetch.
- Rolling MDD: no committed rolling MDD inputs or output columns exist.
- BETA: 5686 assets can be recomputed only after provider refetch and benchmark alignment; 6 representative KOSPI 200 ETF rows are blocked by the current `^KS11` benchmark policy until KOSPI 200 policy is explicit.
- Total-return scenario inputs: not available. The repository has TTM dividend-yield overlays, not monthly dividend or total-return series.
- FX inputs: not available. US assets need USD/KRW history for KRW-mode scenario analysis.

## Existing Metric Sources

| Metric | Current committed source | Recalculation status |
| --- | --- | --- |
| `expectedCagr` | `us_price_metrics_overlay_20260528_app_ready.csv`, `kr_price_metrics_overlay_20260528_app_ready.csv`, older final 2,000 CSV | Summary only; provider refetch needed |
| `priceCagr10y` | US/KR price metrics overlays | Summary only; raw daily/monthly series not committed |
| `mdd` | US/KR price metrics overlays | Summary only; provider refetch needed |
| `beta` | US/KR price metrics overlays | Summary only; benchmark policy must be checked |
| `dividendYield` | US/KR dividend overlays and older final 2,000 CSV | TTM/yield only; no dividend time series |
| Rolling CAGR | Policy docs and archived notebook reference only | Not committed as current overlay/input |
| Rolling MDD | No committed calculation output | Not available |
| Total return | Policy docs only | Not available |

## Policy Mismatches Confirmed

1. Existing Korean representative ETF Rolling normalization values are preserved only in the older `finple_app_candidates_2000_final_v1.csv`; the 2026-05-28 KR price overlay overwrites `expectedCagr` with raw 10-year price CAGR.
2. The Raw price overlay stores `expectedCagr == priceCagr10y` for US and KR rows, so `expectedCagr` no longer distinguishes raw vs rolling policy.
3. US representative index ETF rows have around 9.99 years of overlay data and no committed monthly series, so Rolling 120-month median cannot be verified from repository files.
4. Korean representative ETF BETA currently uses `^KS11`, not a KOSPI 200 benchmark, so KOSPI vs KOSPI 200 policy is unresolved.
5. Price return and total return data are mixed only at the policy level; the committed overlays are close-price based plus separate dividend-yield summaries.
6. Short-history ETF proxy use is not recorded in the current overlays. `QQQM` and `278530` need explicit proxy metadata before 10-year rolling treatment.

## Representative Asset Recalculation Table

| Market | Ticker | Grade | dataYears | Benchmark | Raw CAGR | Rolling CAGR | MDD | Rolling MDD | BETA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| US | SPY | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | VOO | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | IVV | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | VTI | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | ITOT | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | SCHB | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | QQQ | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | QQQM | B | 5.62 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| KR | 069500 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 102110 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 148020 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 105190 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 152100 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 278530 | B | 8.51 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |

## Required New Input Schema

A future overlay or cache should include at least:

```csv
market,ticker,month,priceReturn,totalReturn,closePrice,adjustedClose,dividendAmount,benchmarkId,benchmarkReturn,fxReturn,returnBasis,currency,isProxy,proxyTicker,dataSource,sourceVersion
```

For metric summary overlays, preserve both raw and rolling fields:

```csv
market,ticker,rawPriceCagr10y,rollingPriceCagr10yMedian,rollingPriceCagr10yP25,rollingPriceCagr10yP75,totalReturnCagr10y,rollingTotalReturnCagr10yMedian,mddFullPeriod,rollingMdd10yMedian,beta,benchmarkTicker,dataYears,effectiveStartDate,effectiveEndDate,returnBasis,currency,isProxy,proxyTicker,appliedCagrPolicy,metricsSource,metricsStatus,reviewReason
```

## Do Not Use As Recalculation Inputs

- Do not use `expectedCagr` alone as a rolling or total-return metric.
- Do not derive scenario probabilities from `cagr`, `beta`, or `mdd` summaries.
- Do not fill missing benchmark, FX, or total-return series with zero.
- Do not treat dividend-yield overlays as dividend time series.
- Do not use weighted-average asset MDD as portfolio MDD in scenario analysis.

## Recommended Step 114-1B Boundary

Step 114-1B should create pure metric utilities and fixtures around explicit monthly return arrays. It should wait for a committed monthly data input or controlled provider-refetch fixture before any portfolio scenario API/UI work.
