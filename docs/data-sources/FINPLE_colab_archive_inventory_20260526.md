# FINPLE Colab Archive Inventory - 2026-05-26

## Source upload

User supplied archive:

```text
csv-20260526T181908Z-3-001.zip
```

This repository entry summarizes the usable files found in the archive and records where they should be stored for future CSV/data work.

## Key findings

The archive contains many historical Colab versions. The most useful package for current FINPLE data work is:

```text
old/finple_colab_metrics_pack_v2_2_3_price_rolling/finple_colab_metrics_pack_v2_2_3_price_rolling/
```

The most important file in that package is:

```text
kr_dividend_yield_override_v2_2_3.csv
```

This is not ETF-only. It contains integrated Korean dividend overrides:

```text
Total rows: 2,168
KR ETF rows: 922
KR stock rows: 1,246
Dividend yield range: 0.00% to 26.28%
```

Therefore future KR dividend work should use this integrated override before calling external APIs.

## Archived files

| Repository path | Purpose | Rows / status | SHA256 |
|---|---|---:|---|
| `data/processed/kr_dividend_yield_override_v2_2_3.csv` | Integrated KR ETF + KR stock dividend override | 2,168 rows | `9fa78c0c5a9a35ecbd69f66e3a6c07ad86eee16e48b1a847ec3d66fd2dac489f` |
| `data/processed/finple_specific_ticker_seed_v2_2_3.csv` | 417-candidate seed used for metrics experiments | 417 rows | `5f20863073b2537040a3bae42e6883062e871a5d2ccdd78e9a3e8b6f80cc6762` |
| `scripts/finple_metrics_colab_v2_2_3.py` | Colab-compatible Python metrics runner | script | `8f56634eb4eefd6299ac144fa80e515e05b39443621319252f920ba0df60a70d` |
| `notebooks/FINPLE_metrics_colab_v2_2_3_price_rolling.ipynb` | Notebook wrapper for v2.2.3 price/rolling workflow | notebook | `1f357497b6e4d47a88494dbd651486392f945128241a5b0479d2aa026637db87` |
| `data/raw/2026-05-25/source_k-etf_rank_dividend_yield.csv` | Raw K-ETF dividend ranking source | 922 rows | `aa7576f550eef5890874eaef79132fcda5635d9522ee7203314256be0998c591` |
| `data/raw/2026-05-25/source_data_5456_20260525.xlsx` | Raw Excel source found in archive | not uploaded in this PR | `eb948f909534889f6fa55d6ecf3e339307307d98b4b24a299d4a2d556b9eff2a` |

## Why `source_data_5456_20260525.xlsx` is not committed here

The GitHub text-file connector is safe for UTF-8 text files such as CSV, Markdown, Python and notebooks. It is not ideal for binary XLSX upload through this workflow.

The XLSX file is recorded by filename, size and SHA256. If it must be preserved in GitHub, upload it manually through GitHub web UI or git CLI to:

```text
data/raw/2026-05-25/source_data_5456_20260525.xlsx
```

## Version interpretation

### v2.2.3 price/rolling workflow

Use this workflow as the current reference for price metrics policy.

Key rules:

```text
1. expectedCagr uses price-close CAGR or normalized price CAGR.
2. totalReturnCagr is reference-only and should not be the default expectedCagr.
3. Short-history assets are not automatically discarded.
4. Korean representative index ETFs can use rolling median CAGR to reduce overheated end-point distortion.
5. Korean dividend yield uses override CSV rather than fragile automatic scraping.
```

### Previous v2.2 and v2.2.2 packages

Older packages are retained as history only. They are useful for debugging, especially the yfinance MultiIndex fix, but new work should start from v2.2.3.

## Operating decision from this archive

The previous plan was:

```text
KR ETF dividend overlay 922 rows
-> Korean Investment API test
-> KR stock dividend collection
```

The improved plan is:

```text
KR integrated dividend override v2.2.3 first
-> 922 KR ETF + 1,246 KR stock = 2,168 rows
-> Korean Investment API only for missing values and verification
```

## Follow-up tasks

```text
1. Supersede the ETF-only KR dividend overlay with integrated KR dividend override v2.2.3.
2. Add a KR dividend matching diagnostic against the 6,000-candidate universe.
3. Add US dividend overlay using v2.2.2+ yfinance handling.
4. Expand v2.2.3 price/rolling metrics workflow from 417 candidates to the current priority candidate set.
5. Create final price_metrics_overlay_v1 after audit.
```
