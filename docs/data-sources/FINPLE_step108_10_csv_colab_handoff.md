# FINPLE Step 108-10 CSV and Colab Handoff

## Goal

Make future CSV and Colab work repeatable. A different contributor should be able to continue FINPLE data work without reading the entire chat history.

## What changed in this step

This step archives the operating knowledge from the uploaded Colab ZIP and turns it into repository documentation and reusable tooling.

Added:

```text
docs/data-sources/FINPLE_DATA_PIPELINE_PLAYBOOK.md
docs/data-sources/FINPLE_colab_archive_inventory_20260526.md
data/processed/FINPLE_colab_archive_manifest_20260526.json
scripts/finple_csv_audit.py
notebooks/FINPLE_metrics_colab_v2_2_3_archived_reference.ipynb
```

## Most important conclusion

The uploaded Colab archive changes the Korean dividend plan.

Previous plan:

```text
KR ETF dividend overlay only: 922 rows
```

Better plan from archive:

```text
KR integrated dividend override v2.2.3: 2,168 rows
- KR ETF: 922
- KR stock: 1,246
```

Therefore PR #83, which is ETF-only, should be superseded or revised before being treated as the final KR dividend solution.

## Recommended next implementation PR

```text
Step 108-11: Apply integrated KR dividend override v2.2.3
```

Expected changes:

```text
src/data/tickers/kr_dividend_overlay_20260525.csv
src/data/tickers/screenerCandidateOverlay.js
docs/data-sources/FINPLE_step108_11_kr_dividend_override_v2_2_3.md
```

The runtime overlay should update only dividend fields:

```text
dividendYield
displayDividendYield
dividendPolicy
dividendSource
```

It must preserve:

```text
expectedCagr
beta
mdd
strategy
riskLevel
goals
tags
```

## CSV audit command examples

Candidate universe audit:

```bash
python scripts/finple_csv_audit.py \
  --csv src/data/tickers/finple_app_candidates_6000_balanced_v1.csv \
  --key market,ticker \
  --required market,ticker,nameKr,assetType,dataStatus \
  --numeric expectedCagr,beta,mdd,dividendYield \
  --out data/processed/audit_candidate_6000.json
```

KR dividend override audit:

```bash
python scripts/finple_csv_audit.py \
  --csv data/processed/kr_dividend_yield_override_v2_2_3.csv \
  --key market,ticker \
  --required market,ticker,assetType,dividendYield \
  --numeric dividendYield \
  --out data/processed/audit_kr_dividend_override_v2_2_3.json
```

## Files still requiring manual upload or follow-up commit

The uploaded ZIP contained useful source files. The repository now records hashes and paths, but not every large/binary file has been committed through this connector workflow.

Recommended manual uploads:

```text
data/processed/kr_dividend_yield_override_v2_2_3.csv
data/processed/finple_specific_ticker_seed_v2_2_3.csv
data/raw/2026-05-25/source_k-etf_rank_dividend_yield.csv
data/raw/2026-05-25/source_data_5456_20260525.xlsx
scripts/finple_metrics_colab_v2_2_3.py
```

If GitHub web upload is inconvenient, use git CLI.

## git CLI example

```bash
git checkout main
git pull

git checkout -b step108-11-kr-dividend-integrated-override

mkdir -p data/processed data/raw/2026-05-25 scripts
cp kr_dividend_yield_override_v2_2_3.csv data/processed/
cp finple_specific_ticker_seed_v2_2_3.csv data/processed/
cp source_k-etf_rank_dividend_yield.csv data/raw/2026-05-25/
cp source_data_5456_20260525.xlsx data/raw/2026-05-25/
cp finple_metrics_colab_v2_2_3.py scripts/

git add data/processed data/raw/2026-05-25 scripts
git commit -m "Step 108-11: Archive Colab v2.2.3 sources"
git push -u origin step108-11-kr-dividend-integrated-override
```

## Future data order

```text
1. Integrated KR dividend override v2.2.3
2. KR dividend missing/mismatch diagnostics
3. KIS API verification for missing KR stocks, preferred shares, REITs and suspicious values
4. US ETF dividend TTM overlay
5. US stock dividend TTM overlay
6. v2.2.3 price/rolling metrics expansion
7. price metrics overlay
8. final dataStatus cleanup
```

## Notes for future contributors

- Do not change simulation math when only CSV values need to be updated.
- Do not use totalReturnCagr as expectedCagr unless dividend handling is redesigned.
- Do not mark blank dividend yields as 0.00 without confirmed no-dividend status.
- Do not merge runtime CSV changes without Vercel Preview verification.
- Keep raw source files and generated overlay files separate.
