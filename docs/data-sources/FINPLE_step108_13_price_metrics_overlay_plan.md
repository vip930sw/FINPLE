# Step 108-13A Price Metrics Overlay Plan

## Purpose

After dividend enrichment, the next FINPLE data task is price metrics enrichment.

Target metrics:

```text
expectedCagr
priceCagr10y
mdd
beta
dataYears
benchmarkTicker
metricsStatus
reviewReason
```

This stage should not overwrite the base 6,000 candidate CSV. It should create a separate overlay CSV.

## Terminology

```text
가격지표 보강 / Price Metrics Enrichment
```

This means filling and validating price-based metrics for each candidate asset.

## Current completed data layers

```text
1. base 6,000 candidate CSV
2. final 2,000 metrics overlay
3. KR ETF dividend overlay
4. KR stock dividend overlay
5. US dividend overlay
```

Next layer:

```text
6. price metrics overlay
```

## Key policy

Do not mix dividend return into expectedCagr.

```text
expectedCagr = price-close CAGR or normalized price CAGR
dividendYield = separately displayed dividend or distribution yield
totalReturnCagr = reference only, not default app expectedCagr
```

Reason: if adjusted-close or total-return CAGR already includes dividend reinvestment and the app also displays/adds dividendYield separately, dividend effects can be double counted.

## First implementation scope

Start with US assets first.

```text
market == US
benchmarkTicker = SPY
```

KR assets should be handled in a later step because Korean representative index ETFs need rolling-median normalization and Korean stock beta needs KOSPI/KOSDAQ benchmark handling.

## Recommended output files

For US first pass:

```text
data/processed/us_price_metrics_overlay_202605xx.csv
data/processed/us_price_metrics_overlay_202605xx_audit.csv
data/processed/us_price_metrics_overlay_202605xx_summary.json
src/data/tickers/us_price_metrics_overlay_202605xx.csv
```

Runtime CSV columns:

```csv
market,ticker,expectedCagr,priceCagr10y,mdd,beta,dataYears,benchmarkTicker,metricsStatus,metricsSource,reviewReason
US,AAPL,20.10,20.10,-31.40,1.22,10.00,SPY,ready,yfinance_close_price_202605xx,
```

## Metrics definitions

### expectedCagr / priceCagr10y

Price-close CAGR using the oldest and latest available close price in the selected period.

```text
CAGR = ((latestClose / firstClose) ** (1 / years) - 1) * 100
```

Use close prices, not adjusted close, to avoid dividend reinvestment effects.

### MDD

Maximum drawdown from close price series.

```text
MDD = min(close / runningMax - 1) * 100
```

This is normally a negative percentage.

### BETA

Initial US implementation:

```text
benchmark = SPY
return interval = daily returns
beta window = latest 5 years when possible
```

Beta is calculated as:

```text
beta = covariance(assetReturn, benchmarkReturn) / variance(benchmarkReturn)
```

## Status rules

```text
ready
  Enough price history and metrics calculated.

short_history
  Price history exists but is shorter than preferred 10-year window. Values can be shown with caution.

review_required
  Missing price data, invalid result, or abnormal metric.
```

Suggested thresholds:

```text
dataYears >= 3.0 -> ready
1.0 <= dataYears < 3.0 -> short_history
< 1.0 -> review_required
abs(expectedCagr) >= 100 -> review_required
mdd > 0 -> review_required
beta missing when dataYears >= 3 -> review_required
```

## Runtime application policy

When connected to the frontend loader, price metrics overlay may update:

```text
expectedCagr
beta
mdd
dataStatus
reviewTag
reviewReason
metricsSource
```

It must not update:

```text
dividendYield
displayDividendYield
dividendPolicy
dividendSource
```

## Recommended workflow

```text
1. Add chunked script for US price metrics.
2. Add Colab notebook for 20-row test and 100-row chunks.
3. Generate and validate US price metrics overlay.
4. Upload runtime CSV and audit files.
5. Connect price metrics overlay safely in loader.
6. Proceed to KR price metrics with separate rules.
```

## Acceptance sample tickers

US test tickers:

```text
SPY
VOO
QQQ
SCHD
JEPI
JEPQ
AAPL
MSFT
KO
JNJ
JPM
XOM
AMZN
TSLA
SNOW
AAT
AGNC
```

Check that:

```text
1. CAGR/MDD/BETA values appear for ready candidates.
2. Existing dividend values remain unchanged.
3. short_history or review_required candidates are not silently treated as fully ready.
4. Existing Korean dividend overlays remain unchanged.
```
