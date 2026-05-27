# Step 108-12B US Dividend Chunked Runbook

## Why this runbook exists

The first full US dividend run queried every US candidate in one Colab cell. It can run for more than 20 minutes without progress output and can be interrupted by problematic Yahoo/yfinance symbols such as `$FXED`.

Use the chunked script instead:

```text
scripts/build_us_dividend_overlay_chunked.py
```

## Recommended Colab files to upload

```text
finple_app_candidates_6000_balanced_v1.csv
build_us_dividend_overlay_chunked.py
```

## First test run

Run only the first 20 rows to confirm the script works.

```bash
python build_us_dividend_overlay_chunked.py \
  --input finple_app_candidates_6000_balanced_v1.csv \
  --out-runtime us_dividend_overlay_20260527_part0000_0020.csv \
  --out-audit us_dividend_overlay_20260527_part0000_0020_audit.csv \
  --out-summary us_dividend_overlay_20260527_part0000_0020_summary.json \
  --as-of 2026-05-27 \
  --start 0 \
  --limit 20 \
  --checkpoint-every 5
```

Expected behavior:

```text
Total US candidates: 3000
Processing chunk: start=0, limit=20, selected=20
[1/20 | global 0] SPY -> SPY
...
Checkpoint saved: 5 rows
```

## Production chunk runs

Run 100 candidates per chunk.

```bash
python build_us_dividend_overlay_chunked.py \
  --input finple_app_candidates_6000_balanced_v1.csv \
  --out-runtime us_dividend_overlay_20260527_part0000_0100.csv \
  --out-audit us_dividend_overlay_20260527_part0000_0100_audit.csv \
  --out-summary us_dividend_overlay_20260527_part0000_0100_summary.json \
  --as-of 2026-05-27 \
  --start 0 \
  --limit 100 \
  --checkpoint-every 25
```

Next chunks:

```bash
--start 100 --limit 100 -> part0100_0200
--start 200 --limit 100 -> part0200_0300
--start 300 --limit 100 -> part0300_0400
...
```

## If a chunk is slow

If a chunk exceeds 10 to 15 minutes, stop it and rerun smaller:

```bash
--start 300 --limit 25
--start 325 --limit 25
--start 350 --limit 25
--start 375 --limit 25
```

## What to download

For each successful chunk, download:

```text
us_dividend_overlay_20260527_partXXXX_YYYY.csv
us_dividend_overlay_20260527_partXXXX_YYYY_audit.csv
us_dividend_overlay_20260527_partXXXX_YYYY_summary.json
```

## Combining chunks

After multiple chunks are downloaded, combine runtime CSV files with pandas:

```python
import glob
import pandas as pd

files = sorted(glob.glob('us_dividend_overlay_20260527_part*.csv'))
df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)
df = df.drop_duplicates(['market', 'ticker'], keep='last')
df.to_csv('us_dividend_overlay_20260527.csv', index=False, encoding='utf-8-sig')
print(df.shape)
```

## Upload target

After review, upload the combined runtime CSV to:

```text
src/data/tickers/us_dividend_overlay_20260527.csv
```

Keep audit/summary files in:

```text
data/processed/
```

## Important notes

- The script strips leading `$` from symbols like `$FXED` before calling yfinance.
- Invalid yfinance symbols are not fatal; they are marked `review_required`.
- Blank dividendYield still means not confirmed.
- `0.00` means no-dividend confirmed only for manually confirmed tickers.
- High dividend yield values above 15% are marked review-required.
