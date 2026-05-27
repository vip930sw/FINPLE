# Step 108-11 KR Integrated Dividend Overlay Plan

## Purpose

Extend the current Korean dividend overlay from ETF-only to integrated Korean ETF + Korean stock dividend coverage.

## Current state on main

The current loader applies:

```text
1. finple_app_candidates_2000_final_v1.csv
2. kr_etf_dividend_overlay_20260525.csv
```

The ETF overlay has 922 rows.

## Improved source from Colab archive

The uploaded Colab archive contains:

```text
kr_dividend_yield_override_v2_2_3.csv
```

Confirmed structure:

```text
Total rows: 2,168
KR ETF: 922
KR stock: 1,246
Dividend yield range: 0.00% ~ 26.28%
```

Because the ETF overlay already exists in runtime, Step 108-11 should add only the missing Korean stock overlay file while keeping the existing ETF overlay.

## Recommended runtime files

```text
src/data/tickers/kr_etf_dividend_overlay_20260525.csv
  - already exists
  - 922 KR ETF rows

src/data/tickers/kr_stock_dividend_overlay_20260525.csv
  - to be added
  - 1,246 KR stock rows
```

Together these provide 2,168 Korean dividend overlay rows.

## Required compact CSV format

```csv
market,ticker,dividendYield
KR,005930,1.5
KR,000660,0.3
KR,035420,1.0
```

Only these three columns are needed for runtime.

## Loader behavior

The loader should apply overlays in this order:

```text
1. base 6,000 candidate CSV
2. final 2,000 metrics overlay
3. KR ETF dividend overlay
4. KR stock dividend overlay
```

Dividend overlays must update only:

```text
dividendYield
displayDividendYield
dividendPolicy
dividendSource
dataSource
```

They must preserve:

```text
expectedCagr
beta
mdd
strategy
riskLevel
goals
tags
notes
```

## Source mapping

Use the original integrated source:

```text
kr_dividend_yield_override_v2_2_3.csv
```

Filter:

```text
assetType == stock
market == KR
```

Then export:

```text
market,ticker,dividendYield
```

Ensure Korean stock tickers are six characters:

```python
df["ticker"] = df["ticker"].astype(str).str.strip().str.zfill(6)
```

## Audit command

After creating `kr_stock_dividend_overlay_20260525.csv`, run:

```bash
python scripts/finple_csv_audit.py \
  --csv src/data/tickers/kr_stock_dividend_overlay_20260525.csv \
  --key market,ticker \
  --required market,ticker,dividendYield \
  --numeric dividendYield \
  --out data/processed/audit_kr_stock_dividend_overlay_20260525.json
```

Expected result:

```text
row_count: 1246
market count: KR 1246
duplicate_count: 0
invalid dividendYield: 0
```

## Manual upload note

The full stock overlay CSV has 1,246 rows. If connector upload is unstable, upload it manually through GitHub web UI or git CLI at:

```text
src/data/tickers/kr_stock_dividend_overlay_20260525.csv
```

## Acceptance checks

After runtime CSV and loader are both updated:

```text
1. Samsung Electronics 005930 dividendYield = 1.5
2. SK Hynix 000660 dividendYield = 0.3
3. NAVER 035420 dividendYield = 1.0
4. KODEX 200 069500 still uses ETF overlay dividendYield = 0.67
5. Existing expectedCagr / beta / mdd values are preserved
6. Vercel Preview build succeeds
```

## Next step

After this step, proceed to:

```text
Step 108-12 US ETF/stock dividend overlay
Step 108-13 v2.2.3 price/rolling metrics expansion
```
