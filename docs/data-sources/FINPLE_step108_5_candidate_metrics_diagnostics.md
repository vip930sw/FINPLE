# FINPLE Step 108-5 Candidate Metrics Diagnostics

## Purpose

Before switching FINPLE from the current 2,000-candidate runtime CSV to the 6,000-candidate runtime CSV, audit whether the larger CSV is safe for screener and simulator use.

The 6,000-candidate CSV can be used as a searchable universe, but CAGR/BETA/MDD/dividend fields should be treated carefully. A candidate with missing metrics can remain searchable, but it should not be presented as a fully validated simulation candidate.

## Current repository status

PR #78 prepared the repository structure and upload rules. It did not upload the large raw CSV/XLSX files and did not switch the runtime loader.

Expected raw file paths are:

```text
data/raw/2026-05-24/us_nasdaq_stock_screener_20260524.csv
data/raw/2026-05-24/us_nasdaq_etf_screener_20260524.csv
data/raw/2026-05-24/kr_etf_market_snapshot_20260524.xlsx
data/raw/2026-05-24/kr_stock_market_snapshot_20260524.xlsx
```

Expected processed/runtime paths are:

```text
data/processed/finple_app_candidates_6000_balanced_v1.csv
src/data/tickers/finple_app_candidates_6000_balanced_v1.csv
```

## Uploaded four-source file interpretation

The four uploaded source files were already reviewed as a good source set for ticker master construction:

```text
상장법인목록.csv
한국 listed-company master source

한국 ETF/ETN market snapshot
KR ETF/ETN candidate source

nasdaq_screener_1779598386546.csv
US stock master source

nasdaq_etf_screener_1779598693262.csv
US ETF master source
```

However, those files are not sufficient by themselves for final simulation metrics. They are source/master files, not full CAGR/BETA/MDD/dividend datasets.

## Metrics needed

The runtime screener CSV should keep these fields:

```text
expectedCagr
beta
mdd
dividendYield
displayDividendYield
dataStatus
reviewTag
reviewReason
```

Recommended policy:

```text
expectedCagr = price-close CAGR
beta = benchmark-based beta
mdd = price-close maximum drawdown
dividendYield = separately stored dividend/distribution yield
totalReturnCagr = reference only, not default app expectedCagr
```

This avoids double counting dividends. If total-return CAGR is used as expectedCagr and dividendYield is also displayed/calculated, dividend effects can be counted twice.

## Diagnostic script

Run this after the 6,000 CSV is uploaded:

```bash
python scripts/diagnose_finple_candidate_metrics.py \
  --csv src/data/tickers/finple_app_candidates_6000_balanced_v1.csv \
  --out data/processed/finple_step108_5_metrics_diagnostic_summary.json
```

The script checks:

```text
row count
missing required columns
market counts
asset type counts
tier counts
dataStatus counts
reviewTag counts
expectedCagr/beta/mdd/dividendYield blanks
invalid numeric values
duplicate market:ticker keys
category counts by market
```

## Category counts to verify

The previous Step 108-3 generated category count target was:

```text
US 가상화폐/블록체인: 112개
US 레버리지/인버스: 147개
US 채권: 213개
US 원자재: 152개
US 부동산/리츠: 421개
US 배당/인컴: 223개
US 공격/성장: 670개

KR 레버리지/인버스: 41개
KR 채권: 87개
KR 원자재: 318개
KR 부동산/리츠: 10개
KR 배당/인컴: 1,808개
KR 공격/성장: 392개
```

These counts were generated from the prior workspace output, but the corresponding CSV files are not yet present in the repository. After upload, compare the script output with the saved category-count CSV.

## Important caveat

The category counts are based on strategy/tags/name keyword classification. The KR dividend/income and commodity buckets may be broad and should later be refined. They should be treated as classification-audit counts, not final financial facts.

## Recommended next operating decision

Use a staged data quality policy:

| Tier | Usage | Data requirement |
|---|---|---|
| core | Default/recommended candidates | CAGR/BETA/MDD/dividend should be mostly filled |
| standard | Normal search candidates | CAGR/BETA/MDD prioritized; dividend pending allowed |
| extended | Search universe expansion | Missing metrics allowed with review_required |

Do not block the 6,000-candidate universe solely because every row lacks complete metrics. Instead, block or label simulation use for rows that remain review_required.
