# Step 108-13D US Price Metrics Loader Note

## Purpose

Connect the app-ready US price metrics overlay to the FINPLE screener candidate overlay loader.

## Runtime file

```text
src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv
```

## Source validation

```text
input price rows: 3,000
excluded serious-missing rows: 27
app-ready runtime rows: 2,973
```

## Loader policy

The US price metrics overlay may update only price/metric fields:

```text
expectedCagr
priceCagr10y
mdd
beta
dataYears
benchmarkTicker
dataStatus
reviewTag
reviewReason
metricsSource
metricMode
dataSource
```

It must not update dividend fields:

```text
dividendYield
displayDividendYield
dividendPolicy
dividendSource
```

This preserves the existing behavior where blank dividend yield remains displayed as:

```text
배당 확인 중
```

## Overlay order

```text
1. final 2,000 metrics overlay
2. KR ETF dividend overlay
3. KR stock dividend overlay
4. US dividend overlay
5. US price metrics overlay
```

US price metrics overlay is applied after dividend overlays, but it does not contain or modify dividend fields.

## Acceptance checks

```text
1. Vercel build succeeds.
2. US_PRICE_METRICS_20260528 count is 2,973.
3. US candidates in the 2,973 overlay show CAGR/MDD/BETA values.
4. Excluded 27 tickers are not force-filled.
5. Blank dividend yields continue to show 배당 확인 중.
6. Existing US dividend values remain unchanged.
```
