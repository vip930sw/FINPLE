# Step 108-13B US Price Metrics Full Runbook

## Current uploaded test result

The first uploaded US price metrics file is a successful 100-row test output.

```text
us_price_metrics_overlay_20260528.csv
row_count: 100
market: US 100
ready: 92
short_history: 6
review_required: 2
blank_cagr_count: 0
blank_beta_count: 0
```

This confirms the calculation script works, but it is not the final output.

## Final target

FINPLE should eventually have price metrics for the full 6,000-candidate universe.

Recommended order:

```text
1. US price metrics: about 3,000 rows
2. KR price metrics: about 3,000 rows
3. Final combined price metrics overlay: about 6,000 rows
```

Do not combine US and KR calculation logic in one first-pass script. KR requires separate benchmark and normalization rules.

## US full run

Run US assets in 100-row chunks from the repository root.

```bash
python -m scripts.build_us_price_metrics_overlay_chunked \
  --input src/data/tickers/finple_app_candidates_6000_balanced_v1.csv \
  --out-runtime us_price_metrics_overlay_20260528_part0000_0100.csv \
  --out-audit us_price_metrics_overlay_20260528_part0000_0100_audit.csv \
  --out-summary us_price_metrics_overlay_20260528_part0000_0100_summary.json \
  --as-of 2026-05-28 \
  --start 0 \
  --limit 100 \
  --checkpoint-every 25
```

Continue:

```text
--start 100 --limit 100 -> part0100_0200
--start 200 --limit 100 -> part0200_0300
--start 300 --limit 100 -> part0300_0400
...
--start 2900 --limit 100 -> part2900_3000
```

## If a chunk is slow

Split into 25-row chunks:

```text
--start 300 --limit 25
--start 325 --limit 25
--start 350 --limit 25
--start 375 --limit 25
```

## Combine US chunks

After all US chunks are generated:

```bash
python -m scripts.combine_us_price_metrics_chunks \
  --pattern 'us_price_metrics_overlay_20260528_part*.csv' \
  --out-runtime us_price_metrics_overlay_20260528.csv \
  --out-summary us_price_metrics_overlay_20260528_summary.json
```

Expected US final output:

```text
row_count: about 3,000
market: US 3,000
```

## Upload targets after US completion

```text
src/data/tickers/us_price_metrics_overlay_20260528.csv
data/processed/us_price_metrics_overlay_20260528_summary.json
data/processed/us_price_metrics_overlay_20260528_audit.csv, optional but recommended
```

## KR price metrics later

KR should be handled separately because:

```text
1. Korean tickers need Yahoo `.KS` / `.KQ` or alternative provider mapping.
2. KOSPI / KOSDAQ benchmark separation is needed for beta.
3. KODEX 200 / TIGER 200 and representative index ETFs require rolling-median CAGR normalization.
4. Short-history and delisted/suspended cases are more common.
```

KR output should be generated in a separate file first:

```text
src/data/tickers/kr_price_metrics_overlay_202605xx.csv
```

Then a combined runtime layer can be created:

```text
src/data/tickers/price_metrics_overlay_202605xx.csv
```

## Runtime policy

The final price metrics overlay may update:

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

## Acceptance checks

For US pass:

```text
1. US row count is about 3,000.
2. Duplicate market:ticker count is 0.
3. CAGR, MDD, BETA blanks are low or explained.
4. ready / short_history / review_required counts are documented.
5. Dividend overlay values remain unchanged in the app.
```

For final 6,000 pass:

```text
1. US + KR row count is about 6,000.
2. US benchmark = SPY.
3. KR benchmark policy is documented.
4. Korean representative ETFs are normalized when needed.
5. Vercel Preview succeeds.
```
