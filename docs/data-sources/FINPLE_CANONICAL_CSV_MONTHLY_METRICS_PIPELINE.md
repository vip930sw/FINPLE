# FINPLE canonical CSV monthly metrics pipeline

## Purpose and boundary

`tools/canonical_csv` is the reusable monthly builder for a reviewed canonical
CSV candidate. The Colab notebook is only a thin runner over the same module.
This workflow does not overwrite
`src/data/tickers/finple_app_candidates_v2.csv`; publishing that runtime file is
a separate reviewed change.

The live adapter reads raw daily `Close`, split events, and cash-dividend events
separately. It reconstructs a split-adjusted price series and deliberately
excludes cash-dividend reinvestment. Adjusted close, total-return series, and TR
indices are not accepted calculation inputs.

## Inputs

- `tools/canonical_csv/universe.example.csv` is the editable universe template.
- Required columns are `market`, `ticker`, `name`, `benchmark`, `active`, and
  `includeInSimulator`.
- Optional provider symbols let a reviewed universe map canonical identities to
  provider-specific symbols.
- Korean tickers remain six-character strings, including leading zeroes.
- `AS_OF_DATE`, rolling windows, minimum window count, beta observations, and
  volatility observations are configuration values.

## Calculation contract

- `rawPriceCagr`: first-to-last price CAGR using actual elapsed calendar days.
- `rollingCagrMedian`: median of all eligible rolling CAGRs.
- `rollingCagrWindowYears`: the longest configured window with at least the
  configured minimum number of observations. Defaults are 10, 7, 5, 3, and 1
  years with a minimum of 6 windows.
- `expectedCagr`: exactly `rollingCagrMedian`; raw CAGR is never a fallback.
- `mdd`: maximum drawdown over the complete split-adjusted price history.
- `beta`: sample covariance divided by sample benchmark variance, using daily
  simple price returns aligned on common dates.
- `annualizedVolatility`: sample standard deviation (`ddof=1`) of daily simple
  price returns multiplied by the square root of 252.
- `dividendYield`: trailing-twelve-month ordinary cash dividend divided by the
  latest price. Confirmed zero is distinct from unavailable data. Option-income
  and covered-call distributions are not ordinary dividend yield.

## Colab run

1. Open `notebooks/FINPLE_CANONICAL_CSV_MONTHLY_BUILD.ipynb` from a repository
   checkout.
2. Edit only the first configuration cell, including `AS_OF_DATE`, universe
   path, and candidate output path.
3. Run all cells. The notebook installs the optional provider dependency and
   calls the repository module without duplicating formulas.
4. Download the candidate CSV, validation JSON, failed-assets CSV, and summary
   JSON.

For an offline provider fixture:

```powershell
python -m tools.canonical_csv.build `
  --provider csv `
  --market-data-csv path\to\market-data.csv `
  --universe tools\canonical_csv\universe.example.csv `
  --output-candidate outputs\finple_app_candidates_v2.candidate.csv `
  --as-of 2026-07-29
```

The candidate can also be checked independently:

```powershell
python -m tools.canonical_csv.validate `
  --candidate outputs\finple_app_candidates_v2.candidate.csv `
  --universe tools\canonical_csv\universe.example.csv `
  --as-of 2026-07-29
```

## Output and failure handling

The builder writes into a temporary staging directory, validates the staged
candidate, and atomically replaces the requested candidate only after
validation succeeds. It also emits:

- `.validation.json`: row reconciliation, finite-metric, identity, price-basis,
  and as-of-date checks.
- `.failed.csv`: every failed or ineligible active asset identity plus an
  explicit reason code and message.
- `.summary.json`: universe, ready, failed, excluded, market, and selected
  rolling-window counts, plus candidate-relative new and removed asset counts.

If candidate validation fails, the pre-existing candidate remains byte-for-byte
unchanged and the failed validation report is retained. Provider credentials,
live data acquisition, review of the complete production universe, and runtime
CSV replacement remain separate operational steps.

## Deterministic verification

```powershell
python -m unittest discover -s tools\canonical_csv\tests -v
```

These tests use synthetic or local fixture data only and make no provider
network calls.
