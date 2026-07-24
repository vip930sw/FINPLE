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

## Phase A — official-product review

1. Review `candidate-additions.csv` and `source-evidence.json`.
2. Confirm every addition is `listingStatus=active`, `active=true`, and has an
   HTTPS issuer source checked on `2026-07-24`.
3. Move failed reviews to `rejected-or-inactive-assets.csv`; do not synthesize
   prices and do not replace missing history with zero.
4. Regenerate the canonical v2 files locally and run the Step check.

## Phase B — new-ticker delta collection

In Colab, mount Drive, clone this Draft PR branch, install `yfinance`, and run:

```bash
python scripts/collect_finple_universe_delta.py \
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

`--resume` is accepted only when target version, canonical SHA, and
reconciliation SHA match the existing manifest exactly. There is no overwrite
or force mode.

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

The source and delta inputs must both be sorted by `market,ticker,date`.

```bash
python scripts/merge_finple_universe_delta.py \
  --source /content/drive/MyDrive/FINPLE/monthly-metrics/2026-07-22/combined/us-kr-combined-raw.csv \
  --delta /content/drive/MyDrive/FINPLE/monthly-metrics/universe-deltas/finple-universe-v2-2026-07-24/us-new-assets-raw-daily.csv \
  --output /content/finple-universe-v2-merged-raw.csv \
  --reconciliation /content/merge-reconciliation.json
```

The command preflights free disk, streams one row from each input, blocks
duplicate `market+ticker+date`, writes an atomic temporary file, and renames it
only after success. Delete `/content/finple-universe-v2-merged-raw.csv` after
the candidate package and app-preview export succeed. Never copy it to Drive.

## Phase D — candidate package and protected Preview

1. Use the temporary merged raw as read-only One-Click input.
2. Export with `scripts/export_finple_app_preview.py`. Omit `--shard-count` to
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
