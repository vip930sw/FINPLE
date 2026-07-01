# FINPLE Metrics CSV Schema v3

This document defines the required CSV and JSON schemas for FINPLE monthly long-term metrics.

All CSV files must be UTF-8 encoded. Korean tickers must be preserved as six-character strings.

---

## 1. Candidate universe CSV

Recommended path:

```text
src/data/tickers/finple_app_candidates_6000_balanced_v1.csv
```

Role:

```text
The full universe of FINPLE-managed candidate assets.
```

Required columns:

```csv
ticker,nameKr,nameEn,market,assetType,exchange,sector,industry,strategy,riskLevel,goals,beginnerFit,tags,listingDate,benchmarkKey,proxyTicker,hedged,isActive
```

Column notes:

| Column | Meaning |
|---|---|
| ticker | Asset ticker. KR tickers must be six-character strings. |
| nameKr | Korean display name. |
| nameEn | English display name. |
| market | US or KR. |
| assetType | ETF, stock, bond, cash, commodity, etc. |
| exchange | Exchange or listing market. |
| sector | Sector when available. |
| industry | Industry when available. |
| strategy | FINPLE style grouping. |
| riskLevel | FINPLE risk label. |
| goals | Search/filter use case. |
| beginnerFit | Beginner suitability flag. |
| tags | Display/filter tags. |
| listingDate | Listing date, YYYY-MM-DD. |
| benchmarkKey | Assigned benchmark for BETA. |
| proxyTicker | Proxy ticker for short-history or KR-listed global ETF mapping. |
| hedged | Currency hedge flag. |
| isActive | Whether the asset is active in FINPLE. |

---

## 2. Monthly full metrics output CSV

Recommended path:

```text
data/processed/monthly/YYYY-MM/finple_metrics_output_YYYY_MM.csv
```

Role:

```text
Full internal calculation result. This file is for audit and review.
```

Required columns:

```csv
ticker,nameKr,market,assetType,benchmarkKey,metricBaseDate,dataStartDate,dataEndDate,dataYears,priceCagr10yRaw,rollingCagr10yMedian,rollingCagr10yP25,rollingCagr10yP75,rollingCagr5yMedian,sinceInceptionCagr,selectedCagr,cagrPolicy,mdd10yRaw,rollingMdd10yMedian,selectedMdd,mddPolicy,beta10yRaw,rollingBeta10yMedian,rollingBeta5yMedian,selectedBeta,betaPolicy,volatility10y,dividendYield,dividendPolicy,dataStatus,reviewFlag,reviewReason,sourcePolicy,sourceHash,notes
```

### Required metric fields

| Column | Meaning |
|---|---|
| priceCagr10yRaw | Raw 10Y price CAGR. Audit only. |
| rollingCagr10yMedian | Median of rolling 10Y price CAGRs. Required where possible. |
| rollingCagr10yP25 | 25th percentile of rolling 10Y CAGRs. |
| rollingCagr10yP75 | 75th percentile of rolling 10Y CAGRs. |
| rollingCagr5yMedian | Median of rolling 5Y price CAGRs. Fallback. |
| sinceInceptionCagr | Since-inception price CAGR. Fallback only. |
| selectedCagr | App-approved CAGR. Must use rolling median policy when possible. |
| cagrPolicy | Policy used to select CAGR. |
| mdd10yRaw | Worst drawdown in the 10Y period. |
| rollingMdd10yMedian | Median drawdown statistic for audit. |
| selectedMdd | App-approved MDD. Conservative value preferred. |
| beta10yRaw | Raw 10Y BETA against benchmark. |
| rollingBeta10yMedian | Median rolling 10Y BETA. |
| selectedBeta | App-approved BETA. |
| volatility10y | Long-term volatility. Internal/reference use. |
| dividendYield | Confirmed dividend yield, blank, or 0.00. |

### Data status values

Recommended values:

```text
ready
short_history
limited_history
insufficient_history
review_required
excluded
```

### Review flag values

Recommended values:

```text
none
short_history
adjusted_by_rolling_median
review_required
benchmark_missing
ticker_mapping_failed
source_missing
```

### CAGR policy values

Recommended values:

```text
rolling_10y_median
rolling_5y_median
since_inception
blank_review_required
manual_override
```

---

## 3. App export CSV

Recommended path:

```text
src/data/tickers/finple_metrics_selected_YYYY_MM.csv
```

Role:

```text
The actual monthly metrics file that FINPLE screens and simulators may use.
```

Required columns:

```csv
ticker,nameKr,market,assetType,benchmarkKey,metricBaseDate,dataYears,selectedCagr,selectedMdd,selectedBeta,dividendYield,dataStatus,reviewFlag,sourcePolicy,notes
```

Mapping into FINPLE asset fields:

```text
expectedCagr  <- selectedCagr
mdd           <- selectedMdd
beta          <- selectedBeta
dividendYield <- dividendYield
```

The app export must not include current price, previous close, price change, volume, bid, ask, or executable quote fields.

---

## 4. Review-required CSV

Recommended path:

```text
data/processed/monthly/YYYY-MM/finple_metrics_review_required_YYYY_MM.csv
```

Role:

```text
Assets that should not be automatically published to app export.
```

Required columns:

```csv
ticker,nameKr,market,assetType,metricBaseDate,issueType,rawValue,selectedValue,reviewReason,recommendedAction
```

Recommended issue types:

```text
missing_price_data
insufficient_history
missing_benchmark
raw_cagr_extreme
rolling_median_missing
mdd_invalid
beta_extreme
dividend_extreme
ticker_format_error
currency_mismatch
source_hash_missing
```

---

## 5. Dividend override CSV

Recommended path:

```text
src/data/tickers/dividend_overlay_YYYY_MM.csv
```

Role:

```text
Manual or semi-manual dividend yield overlay after separate verification.
```

Required columns:

```csv
market,ticker,dividendYield,dividendPolicy,dividendSource,metricBaseDate,notes
```

Dividend policy values:

```text
confirmed_dividend
confirmed_no_dividend
unconfirmed_blank
manual_override
provider_value
```

Important rule:

```text
blank = unconfirmed
0.00  = confirmed no dividend
```

---

## 6. Manifest JSON

Recommended path:

```text
data/processed/monthly/YYYY-MM/finple_metrics_manifest_YYYY_MM.json
```

Role:

```text
Records source files, pipeline version, policy, output files, and hashes.
```

Required shape:

```json
{
  "metricBaseDate": "2026-06-30",
  "createdAt": "2026-07-01T00:00:00+09:00",
  "createdBy": "FINPLE Colab One Click",
  "pipelineVersion": "metrics-v3.0",
  "sourceFiles": [
    {
      "name": "finple_app_candidates_6000_balanced_v1.csv",
      "path": "data/raw/2026-06/finple_app_candidates_6000_balanced_v1.csv",
      "sha256": "..."
    }
  ],
  "outputs": [
    "finple_metrics_output_2026_06.csv",
    "finple_metrics_selected_2026_06.csv",
    "finple_metrics_review_required_2026_06.csv",
    "finple_metrics_audit_report_2026_06.html"
  ],
  "policy": {
    "selectedCagr": "rolling_median_required_for_all_markets",
    "selectedMdd": "conservative_worst_drawdown",
    "selectedBeta": "rolling_median_beta_when_available",
    "totalReturnCagr": "reference_only",
    "currentPriceDisplay": "disabled"
  }
}
```

---

## 7. Audit report

Recommended path:

```text
data/processed/monthly/YYYY-MM/finple_metrics_audit_report_YYYY_MM.html
```

The report should include:

```text
row count
US / KR count
ETF / stock count
ready count
review_required count
excluded count
missing selectedCagr count
missing selectedMdd count
missing selectedBeta count
missing dividendYield count
extreme CAGR list
extreme MDD list
extreme BETA list
dividend > 10% list
Korean ticker format errors
representative ticker check
source hash list
```

Representative tickers:

```text
US: SPY, QQQ, VOO, SCHD, TLT, GLD
KR: 005930, 000660, 069500, 102110, 133690
```

---

## 8. Minimum sample row

```csv
ticker,nameKr,market,assetType,benchmarkKey,metricBaseDate,dataYears,selectedCagr,selectedMdd,selectedBeta,dividendYield,dataStatus,reviewFlag,sourcePolicy,notes
QQQ,Invesco QQQ Trust,US,ETF,NASDAQ100,2026-06-30,10.0,11.90,-35.20,1.18,0.60,ready,none,monthly_static,selectedCagr uses rolling median policy
069500,KODEX 200,KR,ETF,KOSPI200,2026-06-30,10.0,5.84,-38.09,0.99,0.67,ready,adjusted_by_rolling_median,monthly_static,raw CAGR adjusted by rolling median policy
```
