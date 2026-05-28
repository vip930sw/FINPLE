# Step 108-13C US Price Metrics App-Ready Filter

## User decision

For US price metrics, upload only the rows that do not have serious combined metric gaps.

Dividend blank values should remain blank, so the app can keep showing:

```text
배당 확인 중
```

Do not fill missing dividend yield with `0.00` unless no-dividend status has been confirmed.

## Source inputs

```text
us_price_metrics_overlay_20260528.csv
us_dividend_overlay_20260527.csv
```

The full US price metrics run summary:

```text
row_count: 3,000
ready: 2,480
short_history: 357
review_required: 163
blank_cagr_count: 3
blank_beta_count: 47
```

## Filter rule

Check four metrics:

```text
CAGR  = expectedCagr
BETA  = beta
MDD   = mdd
YIELD = dividendYield from US dividend overlay
```

Exclude rows where two or more of the four metrics are blank.

```text
missingCount >= 2 -> exclude from app-ready price metrics overlay
missingCount < 2  -> keep
```

## Expected result

```text
input rows: 3,000
excluded serious-missing rows: 27
runtime rows: 2,973
```

## Known excluded groups from the audit

```text
BETA + YIELD: 24 rows
CAGR + BETA + MDD: 2 rows
CAGR + BETA + MDD + YIELD: 1 row
```

All-four-missing ticker:

```text
ICR^A
```

## Script

Use:

```text
scripts/filter_us_price_metrics_app_ready.py
```

Example:

```bash
python filter_us_price_metrics_app_ready.py \
  --price-input us_price_metrics_overlay_20260528.csv \
  --dividend-input us_dividend_overlay_20260527.csv \
  --out-runtime us_price_metrics_overlay_20260528_app_ready.csv \
  --out-excluded us_price_metrics_overlay_20260528_excluded_27.csv \
  --out-summary us_price_metrics_overlay_20260528_app_ready_summary.json
```

## Upload target

After the filtered output is generated and checked, upload:

```text
src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv
data/processed/us_price_metrics_overlay_20260528_excluded_27.csv
data/processed/us_price_metrics_overlay_20260528_app_ready_summary.json
```

Then connect the app-ready overlay in the loader.

## Runtime policy

The price metrics overlay may update:

```text
expectedCagr
beta
mdd
dataStatus
reviewTag
reviewReason
metricsSource
```

It must not update dividend fields:

```text
dividendYield
displayDividendYield
dividendPolicy
dividendSource
```
