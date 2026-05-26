# FINPLE Data Pipeline Playbook

## Purpose

This document is the operating guide for future FINPLE CSV, metrics, dividend, and Colab work.

FINPLE data work changes frequently. The goal is to make the workflow reproducible so that any contributor can understand what to edit, where to save files, and how to avoid losing validated metrics when expanding the candidate universe.

## Core rule

Do not keep replacing one giant runtime CSV as the only source of truth.

Use this layered structure instead:

```text
1. candidate universe CSV
2. validated metrics overlay
3. dividend overlay
4. price metrics overlay
5. review diagnostics
```

This prevents a larger candidate CSV from wiping out existing validated CAGR, BETA, MDD, and dividend data.

## Current runtime architecture

The app should load data in this order:

```text
src/data/tickers/finple_app_candidates_6000_balanced_v1.csv
  -> base 6,000 candidate universe

src/data/tickers/finple_app_candidates_2000_final_v1.csv
  -> validated 2,000-candidate metrics overlay

future KR dividend overlay
  -> Korean ETF + Korean stock dividend yield override

future US dividend overlay
  -> US ETF + US stock TTM dividend yield

future price metrics overlay
  -> priceCagr, expectedCagr, beta, MDD, dataYears, status
```

## Folder policy

```text
data/raw/YYYY-MM-DD/
  Raw source files exactly as received or downloaded.

data/processed/
  Cleaned CSV outputs, diagnostics, summaries, and app-ready overlay files.

src/data/tickers/
  Only CSV files imported by the frontend runtime.

scripts/
  Reusable Python scripts and Colab-compatible modules.

notebooks/
  Colab notebooks or notebook exports.

docs/data-sources/
  Data policy, source register, runbooks, and audit notes.
```

## File naming rules

Use explicit names with date or version.

```text
kr_dividend_yield_override_v2_2_3.csv
finple_specific_ticker_seed_v2_2_3.csv
finple_metrics_colab_v2_2_3.py
FINPLE_metrics_colab_v2_2_3_price_rolling.ipynb
finple_metrics_policy_v2_2_3.md
```

Avoid vague names like:

```text
final.csv
new.csv
copy.csv
data.csv
latest.csv
```

## Metrics policy

FINPLE should avoid double-counting dividends.

```text
expectedCagr = price-close CAGR or normalized price CAGR

dividendYield = separately displayed dividend or distribution yield

totalReturnCagr = reference only, not the default app expectedCagr
```

Adjusted-close or total-return CAGR can already include dividend reinvestment effects. If that value is used as expectedCagr and dividendYield is also added to the simulation, dividend effects can be double counted.

## Korean representative ETF policy

For Korean representative index ETFs such as KODEX 200 and TIGER 200, raw recent 10-year CAGR can be distorted by the current end-point market level. The v2.2.3 Colab workflow therefore keeps multiple values:

```text
raw priceCagr10y
rollingCagr10yMedian
priceCagr10yTo2024End
priceCagr10yTo2025End
normalizedCagrCandidate
```

App expectedCagr should use `rollingCagr10yMedian` when raw Korean representative-index CAGR is abnormally high.

Recommended status label:

```text
adjusted_by_rolling_median
```

This means the value is not an error. It means the app value has been normalized to reduce overheated end-point distortion.

## Dividend policy

Dividend handling must distinguish three states:

```text
blank = not checked yet
0.00 = confirmed no dividend or no recent distribution
greater than 0 = dividend/distribution yield confirmed
```

Never convert blank dividendYield values to 0.00 unless no-dividend status is confirmed.

## Korean dividend priority

The uploaded Colab archive contains a better Korean dividend source than the earlier ETF-only overlay.

```text
kr_dividend_yield_override_v2_2_3.csv
- total rows: 2,168
- KR ETF: 922
- KR stock: 1,246
- dividendYield range: 0.00% to 26.28%
```

Therefore, future KR dividend work should use the integrated override first, then use Korean Investment Open API or other sources only for missing or verification cases.

## Korean Investment Open API role

The KIS dividend API should be used as a validation and missing-data source, not as the first bulk source for all 6,000 candidates.

Recommended use:

```text
1. Check KR candidates missing from the override CSV.
2. Verify zero-dividend or suspicious dividend values.
3. Verify preferred shares, REITs, financial stocks, and high-dividend candidates.
4. Add base date, payment date, dividend amount, and source metadata when available.
```

## US dividend policy

US dividend work should use batch calculation, not frontend real-time calls.

Recommended order:

```text
1. US ETF TTM dividend yield
2. US stock TTM dividend yield
3. confirmed no-dividend policy for growth stocks
4. review_required for errors or irregular special dividends
```

For yfinance-based collection, keep the v2.2.2+ MultiIndex fix because earlier runs had missing US values due to column handling issues.

## Price metrics policy

Recommended output columns for future price overlay:

```text
market
ticker
expectedCagr
priceCagr10y
totalReturnCagr10y
mdd
beta
dataYears
effectiveStartDate
effectiveEndDate
benchmarkTicker
cagrStatus
yieldStatus
reviewReason
metricsSource
```

## Required audit after every CSV change

Before merging CSV changes, run or manually check:

```text
1. Row count
2. Duplicate market:ticker
3. Required columns
4. Missing expectedCagr / beta / mdd / dividendYield counts
5. Invalid numeric values
6. US/KR counts
7. ETF/stock counts
8. Sample known tickers:
   - SPY
   - QQQ
   - VOO
   - JEPI
   - 069500 KODEX 200
   - 102110 TIGER 200
```

## Merge safety rule

If the change affects runtime imported CSV files, create a PR and check Vercel Preview before merging.

If the change only archives data/source files or docs, it may be merged after filename and row-count review.

## Current recommended next steps

```text
1. Do not merge ETF-only KR dividend overlay as the final KR dividend solution.
2. Replace or supersede it with integrated KR dividend override v2.2.3.
3. Archive v2.2.3 Colab script, notebook, seed CSV, and KR dividend override.
4. Then proceed to US dividend overlay and price metrics overlay.
```
