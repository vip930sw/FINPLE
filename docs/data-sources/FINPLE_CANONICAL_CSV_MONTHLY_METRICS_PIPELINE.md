# FINPLE canonical CSV monthly metrics pipeline

## Boundary

`tools/canonical_csv` produces a validated, full-schema candidate that can be
reviewed as a later direct replacement for
`src/data/tickers/finple_app_candidates_v2.csv`. This workflow never replaces
that runtime file itself. The Colab notebook is a thin runner and contains no
duplicated calculation formulas.

`AS_OF_DATE` is mandatory. `None` is intentionally unsupported because the
pipeline must not infer that an intraday bar is complete. Asset prices,
benchmark prices, dividends, and cash distributions are all cut off at the
explicit date.

## Provider price-basis contract

Every `MarketDataBundle` declares one of two bases:

- `raw_unadjusted_close`: split events are applied exactly once by the shared
  price-series normalizer.
- `split_adjusted_close_ex_dividends`: values are used unchanged and split
  events remain audit evidence only.

The YFinance adapter calls `history(auto_adjust=False, actions=True)`, ignores
`Adj Close`, and treats Yahoo `Close` as
`split_adjusted_close_ex_dividends`. This prevents a second split adjustment
while still excluding cash-dividend reinvestment. Asset and benchmark histories
pass through the same basis-aware normalizer. CSV fixtures must include an
explicit `priceBasis`; blank, mixed, or unknown values fail.

Yahoo action-only rows can contain a cash distribution without a finite
`Close`. The adapter keeps that dated cash event for trailing-yield calculation
while excluding the missing close from the price-return series. Persistent
cache round-trips preserve the cash event separately from price observations.

## Metrics and cash distributions

- `rawPriceCagr`: first-to-last price CAGR using actual elapsed days.
- `rollingCagrMedian`: median of rolling month-end price CAGRs.
- `rollingCagrWindowYears`: longest configured window with at least the
  configured sample minimum. Defaults are 10, 7, 5, 3, and 1 years, with six
  samples required.
- `expectedCagr`: exactly `rollingCagrMedian`; raw CAGR is not a fallback.
- `mdd`: full-period price maximum drawdown.
- `beta`: sample covariance divided by sample benchmark variance using aligned
  daily simple price returns.
- `annualizedVolatility`: sample daily-return standard deviation multiplied by
  `sqrt(252)`.

For ordinary-dividend assets, trailing cash events populate `dividendYield`.
Confirmed zero is numeric zero; unavailable data remains unavailable. For
option-income, covered-call, and premium-income assets, the provider cash events
are not decomposed or relabeled:

- `cashDistributionYieldTtm` stores the complete trailing cash-distribution
  yield.
- `trailingDistributionYield` is the same value for compatibility.
- `dividendYield` remains blank unless a separately reliable ordinary-dividend
  component exists.
- `reinvestmentCashYield` equals `dividendYield` for ordinary assets and
  `cashDistributionYieldTtm` for non-ordinary assets. The two source values are
  never added together.

Price metrics are calculated even for non-ordinary distribution products.
`priceMetricsStatus` and `distributionCalculationStatus` remain separate, and
the failed/ineligible report retains any price metrics that succeeded before a
cash-distribution lookup failure.

## Full-schema merge

`SOURCE_CANONICAL_PATH` is loaded before calculation. The candidate retains:

- every source column in its original order;
- every source identity in its original row order;
- every existing non-calculated display and classification value.

Calculated and operational fields are updated by normalized `market+ticker`.
New universe assets are appended in universe order using an explicit blank-base
row populated from universe metadata. Source rows absent from the editable
universe are preserved and explicitly excluded instead of deleted. New
calculation fields are appended after the source schema in deterministic order.

## Structural validity and publishability

The validation JSON reports:

- `structuralValid`: schema, source preservation, identity, row order,
  reconciliation, numeric parsing, price basis, date cutoff, and Total
  Return/TR-field checks passed.
- `publishable`: structural validity passed and every active Simulator target
  has complete price metrics plus its product-specific cash-yield field.
- `valid`: an alias for `publishable`.

An active row with `includeInSimulator=true` and `simulatorReady=false` is never
publishable, even when it has a reason code. Ordinary products require finite
`dividendYield`; non-ordinary products require finite
`cashDistributionYieldTtm` but may have blank `dividendYield`.

The candidate is atomically replaced only when both `structuralValid` and
`publishable` are true. On partial failure, the existing candidate is preserved
while validation JSON, failed/ineligible CSV, and summary JSON are retained.

## Persistent cache, chunks, and resume

`PersistentCachedMarketDataProvider` stores one raw-history CSV per provider
symbol under `CACHE_DIR`. For each symbol it:

1. reads the last cached date;
2. requests only the next date through `AS_OF_DATE`;
3. merges and sorts observations while deduplicating dates;
4. shares benchmark cache by provider symbol;
5. retries with configurable exponential backoff.

The builder processes `CHUNK_SIZE` assets and writes an atomic checkpoint after
each chunk. Successful rows are reused after a runtime restart; failed rows are
retried. A failed-identities CSV can select only failed rows when the checkpoint
contains all non-selected completed rows. Checkpoints are invalidated when the
date, metric configuration, provider symbol, benchmark, inclusion state, or
distribution classification changes.

Use a mounted Google Drive directory as `CACHE_DIR` in Colab when persistence
across runtime restarts is required. Mounting belongs in notebook/operator
setup, not calculation code. Cache, checkpoint, candidate, and live-smoke
artifacts are gitignored.

## Universe bootstrap and monthly update

The one-time bootstrap preserves source identity and operating metadata:

```powershell
python -m tools.canonical_csv.bootstrap_universe `
  --source-canonical src\data\tickers\finple_app_candidates_v2.csv `
  --benchmark-policy tools\canonical_csv\benchmark_policy.example.csv `
  --output path\to\editable-universe.csv
```

Benchmark selection is data-driven by the policy CSV. Existing provider symbols
are preserved. Missing US symbols may use the canonical ticker; missing KR
symbols are derived only with explicit KOSPI/KOSDAQ evidence. Unknown KR market
segments remain unresolved.

The monthly updater adds new source assets and marks removed source assets
inactive while preserving manual `providerSymbol`, `benchmark`, and
`benchmarkProviderSymbol` choices:

```powershell
python -m tools.canonical_csv.update_universe `
  --existing-universe path\to\editable-universe.csv `
  --source-canonical src\data\tickers\finple_app_candidates_v2.csv `
  --benchmark-policy tools\canonical_csv\benchmark_policy.example.csv `
  --output path\to\updated-universe.csv `
  --diff-report path\to\universe-diff.json
```

## Build and independent validation

```powershell
python -m tools.canonical_csv.build `
  --provider yfinance `
  --source-canonical src\data\tickers\finple_app_candidates_v2.csv `
  --universe path\to\editable-universe.csv `
  --output-candidate outputs\finple_app_candidates_v2.candidate.csv `
  --cache-dir path\to\persistent-cache `
  --as-of 2026-07-29
```

```powershell
python -m tools.canonical_csv.validate `
  --candidate outputs\finple_app_candidates_v2.candidate.csv `
  --source-canonical src\data\tickers\finple_app_candidates_v2.csv `
  --universe path\to\editable-universe.csv `
  --as-of 2026-07-29
```

Deterministic CI and local verification make no live provider calls:

```powershell
python -m unittest discover -s tools\canonical_csv\tests -v
```

## Current Simulator consumer boundary

Read-only inspection shows `monthlyBaselineEngine.js` currently rejects
non-ordinary distribution assets and derives reinvestment only from
`dividendYield`. It does not consume `cashDistributionYieldTtm` as the
reinvestment field. This PR defines and preserves the data contract only;
changing Simulator Steps 2–6 remains a separate follow-up.
