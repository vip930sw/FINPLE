# FINPLE Step 114-2ZB Universe v2 Delta Runbook

## Boundary

This runbook prepares operator-only, review-only artifacts. It does not change
the production selector, public CSV, Render, Vercel production, database, or the
immutable `2026-07-22` source package. It does not use KIS or any credential.

- Source snapshot: `2026-07-22`
- Target universe: `finple-universe-v2-2026-07-24`
- Drive root: `/content/drive/MyDrive/FINPLE/monthly-metrics`
- Delta root:
  `/content/drive/MyDrive/FINPLE/monthly-metrics/universe-deltas/finple-universe-v2-2026-07-24`

Each phase must use a new attempt ID. Never reuse a target-version folder.
Run every Python operator CLI from the repository root with `python -m`.
Direct `python scripts/...` execution is not a supported operator mode.

## Phase A — official-product review

1. Review `candidate-additions.csv` and `source-evidence.json`.
2. Treat the deterministic `validate_official_source` build check as URL syntax
   and required-field validation only. It performs no HTTP request and does not
   prove that a listing is active.
3. Separately open each issuer's official product page and perform a real manual
   listing review. Record `verificationMethod=manual_official_page_review`,
   verified ticker, verified page title or official product name, official URL,
   check date, listing status, active state, issuer, and inception date in
   `source-evidence.json`.
4. Confirm every addition is `listingStatus=active`, `active=true`, and has an
   HTTPS issuer source checked on `2026-07-24`.
5. Move failed reviews to `rejected-or-inactive-assets.csv`; do not synthesize
   prices and do not replace missing history with zero.
6. Regenerate the canonical v2 files locally and run the Step check.

```bash
python -m scripts.finple_universe_v2 \
  --source src/data/tickers/finple_app_candidates_6000_balanced_v1.csv \
  --output src/data/tickers/finple_app_candidates_v2.csv \
  --manifest src/data/tickers/finple_universe_v2_manifest.json \
  --reconciliation src/data/tickers/finple_universe_v2_reconciliation.json \
  --check
```

## Phase B — new-ticker delta collection

In Colab, mount Drive, clone this Draft PR branch, install `yfinance`, and run:

```bash
python -m scripts.collect_finple_universe_delta \
  --canonical src/data/tickers/finple_app_candidates_v2.csv \
  --reconciliation src/data/tickers/finple_universe_v2_reconciliation.json \
  --drive-root /content/drive/MyDrive/FINPLE/monthly-metrics \
  --target-version finple-universe-v2-2026-07-24
```

Only the 29 new US identities are requested. Existing v1 identities are never
sent to the provider. If an asset has no public data, it stays
`priceUnavailable`/`pending_review`.

Planning estimate only: with issuer inception dates from 2020–2024, expect
roughly 20,000–30,000 new daily rows (about 4–8 MB as CSV), up to 29
price-covered assets, and roughly 1,000–1,500 monthly-return rows. The operator
must replace these estimates with actual manifest counts; unavailable data must
not be synthesized.

`--resume` is accepted only after a fail-closed integrity preflight verifies the
exact file set, strict `checksums.sha256` syntax and coverage, every covered
file's SHA-256, no unexpected file or directory, the full canonical candidate
header and exact 29-row canonical reconciliation, unique identities, raw row
count and canonical raw header, collection-summary counts, source-evidence
asset count, manifest addition count, target version, canonical SHA, and
reconciliation SHA. A missing, malformed, tampered, extra, or count-mismatched
artifact blocks resume. There is no overwrite or force mode.

Expected output:

```text
universe-deltas/finple-universe-v2-2026-07-24/
  universe-delta-manifest.json
  candidate-additions.csv
  benchmark-additions.csv
  us-new-assets-raw-daily.csv
  collection-summary.json
  source-evidence.json
  rejected-or-inactive-assets.csv
  checksums.sha256
```

## Phase C — bounded temporary merge

The canonical `2026-07-22/combined` source contract is:

```text
us_raw_daily_prices.csv
kr_raw_daily_prices.csv
kr_price_metrics_overlay.csv
```

Preflight all three files for existence, non-zero size, and SHA-256. The new
delta contains US assets only, so merge only the existing US raw file. Retain
the KR raw and KR overlay as read-only inputs and prove their size and SHA-256
are unchanged after candidate preparation and package execution. Do not modify,
move, delete, combine, or replace any existing `2026-07-22/combined` file.

The US source and delta inputs must both be sorted by `market,ticker,date`.
Both headers must exactly equal `RAW_DAILY_PRICE_COLUMNS`:

```text
market,ticker,date,currency,close,splitAdjustedClose,totalReturnAdjustedClose,volume,splitFactor,cashDividend,sourceId,retrievedAt,priceAdjustmentBasis,publicationEligibility,providerOrInstitution,licenseStatus,internalUseAllowed,publicationAllowed,redistributionAllowed
```

The yfinance adapter maps `Close` to both `close` and
`splitAdjustedClose` because `auto_adjust=False` returns the split-adjusted
close. It uses `Adj Close` as `totalReturnAdjustedClose` only when the complete
valid series is present. Missing optional volume/dividend values stay blank
while real zeros stay `0`; a zero or absent provider no-split event maps to the
canonical neutral `splitFactor=1`. Raw provider payloads and non-contract
fields are not written.

```bash
python -m scripts.merge_finple_universe_delta \
  --source /content/drive/MyDrive/FINPLE/monthly-metrics/2026-07-22/combined/us_raw_daily_prices.csv \
  --delta /content/drive/MyDrive/FINPLE/monthly-metrics/universe-deltas/finple-universe-v2-2026-07-24/us-new-assets-raw-daily.csv \
  --output /content/finple-universe-v2-us-merged-raw.csv \
  --reconciliation /content/merge-reconciliation.json
```

The command preflights free disk, streams one row from each input, blocks
duplicate `market+ticker+date`, writes an atomic temporary file, and renames it
only after success. Never copy the merged US file or a full US+KR merged raw
copy to Drive.

## Phase D — candidate input preparation

Use exactly the canonical v2, local temporary merged US raw, existing read-only
KR raw, existing read-only KR overlay, and delta benchmark additions:

```bash
python -m scripts.prepare_monthly_metrics_candidate_inputs \
  --universe src/data/tickers/finple_app_candidates_v2.csv \
  --us-raw /content/finple-universe-v2-us-merged-raw.csv \
  --kr-raw /content/drive/MyDrive/FINPLE/monthly-metrics/2026-07-22/combined/kr_raw_daily_prices.csv \
  --kr-metrics /content/drive/MyDrive/FINPLE/monthly-metrics/2026-07-22/combined/kr_price_metrics_overlay.csv \
  --benchmark-additions /content/drive/MyDrive/FINPLE/monthly-metrics/universe-deltas/finple-universe-v2-2026-07-24/benchmark-additions.csv \
  --output-dir "/content/finple-universe-v2-candidate-inputs/${ATTEMPT_ID}" \
  --report "/content/finple-universe-v2-candidate-input-reconciliation-${ATTEMPT_ID}.json" \
  --metric-base-date 2026-07-22 \
  --as-of-included 2026-07-22 \
  --submission-id "${ATTEMPT_ID}" \
  --operator-id colab-operator
```

This produces the existing five-file One-Click candidate input contract and an
extended `benchmark_map.csv` containing `US_SPY`, `KR_KOSPI`, and `KR_KOSDAQ`.
Run `run_finple_production_candidate_package` only from the confirmed notebook
cell and only into an attempt-specific local `/content` directory.

After the candidate package succeeds and the KR size/SHA checks still match,
delete only `/content/finple-universe-v2-us-merged-raw.csv`. Do not delete any
Drive source or delta artifact.

## Phase E — protected Preview

1. Export with `python -m scripts.export_finple_app_preview`. Omit
   `--shard-count` to
   select 64/128/256 from row and byte thresholds; an explicit compatibility
   override may be 64, 128, or 256.
3. Inspect manifest count reconciliation, `shardDecision`,
   `shardInventory`, row sums, file sizes, and SHA-256 values.
4. Stage only the generated app-preview export outside Git.
5. Deploy a protected same-origin Vercel Preview with `/preview-api`.
6. Verify desktop and 375 px mobile, saved-portfolio reload, Step 1/2/3/4/7,
   PDF/print, and representative metrics.
7. Do not promote, alias, switch production data, mark the PR Ready, or merge.

## Upload back to the review

Upload only redacted summaries: the delta manifest, collection summary,
source-evidence list, rejected list, merge reconciliation, checksum list,
app-preview manifest, and QA summary. Do not commit or upload raw daily data,
temporary merged raw, ZIPs, provider caches, credentials, private paths, raw
provider responses, or generated staging directories.
