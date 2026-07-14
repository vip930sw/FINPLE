# FINPLE Step 114-2B Time-Series Normalization Audit

Date: 2026-07-14
Scope: fixture/offline-only raw daily row normalization and price-adjustment audit

## Contracts

Step 114-2B adds a raw daily row contract with explicit price bases:

```text
close
splitAdjustedClose
totalReturnAdjustedClose
splitFactor
cashDividend
priceAdjustmentBasis
publicationEligibility
```

The normalization layer selects the last valid observation in each calendar month and records the exact source date in `sourceDate`. It does not forward-fill missing months.

## Price Basis Policy

The audit classifies each price series as one of:

```text
raw_close
split_adjusted
split_and_dividend_adjusted
total_return_adjusted
ambiguous
```

Ambiguous adjusted-price evidence is review-required and blocks publication. Total-return semantics are not inferred merely because an adjusted-price column is present.

## Fixture Coverage

`data/fixtures/monthly-metrics/raw_daily_prices.csv` is synthetic and offline-only. It covers:

```text
US ETF/stock examples
KR leading-zero tickers: 005930, 069500
continuous daily rows crossing month ends
duplicate dates
non-positive prices
reverse date order
malformed dates
missing price basis
missing calendar month
valid split
cash dividend
split plus cash dividend near the same period
ambiguous adjusted-price basis
invalid split factor
duplicate corporate-action entry
invalid provenance/publication policy
currency mismatch
```

## Outputs

Derived outputs are stored separately from raw fixtures:

```text
finple_normalized_month_end_YYYY_MM.csv
finple_timeseries_audit_YYYY_MM.csv
finple_metrics_manifest_YYYY_MM.json
```

The manifest records source SHA256, source file name, source policy, schema version, calculation policy version, and normalization version.

## Readiness

For this fixture-only step:

```text
fixturePackageReady=true
productionPublishReady=false
appExportApproved=false
```

Unknown or false publication licensing forces production publish and app export to remain false.

## Tests

Targeted coverage is in `scripts/metrics_pipeline/tests/` for:

```text
month-end selection
missing-month detection
duplicate/non-positive/reverse/malformed-date blocking
adjustment-basis classification
split/dividend audit
provenance hash determinism
immutable raw fixture behavior
KR leading-zero preservation
readiness flags
Fresh Colab notebook smoke
```

## Rollback

This PR is isolated to fixture, notebook, docs, and `scripts/metrics_pipeline/` files. To roll back after merge:

```bash
git revert <merge_commit_sha>
```

Do not reset `main`, do not modify `savepoint/pre-step114-2-scenario-colab-2026-07-14`, and do not create or restore `data/processed/scenario_monthly_returns.csv`.

## Out of Scope

No external provider calls, KIS token/quote/order calls, operating overlay or loader changes, simulator UI or STEP navigation changes, AI/auth/payment/DB/trading changes, readiness/order authority/kill switch changes, or public app export approval are included.
