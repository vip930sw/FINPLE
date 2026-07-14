# FINPLE Step 114-2E Monthly Baseline Audit

Date: 2026-07-14

Scope: simulator Step 2 and Step 3 deterministic monthly baseline calculation.

## Summary

Step 114-2E adds one shared monthly baseline engine for simulator comparison and detail views.

Engine version:

```text
monthly-baseline-v1-step114-2e
```

Readiness flags:

```text
fixturePackageReady=true
productionPublishReady=false
appExportApproved=false
```

The Step 114-2D review overlay remains review-only and is not connected to the production loader.

## Formula Policy

Annual price CAGR is converted to a monthly price rate with monthly compounding:

```text
(1 + annualPriceCagr) ** (1 / 12) - 1
```

Annual inflation is converted with the same monthly compounding formula:

```text
(1 + annualInflation) ** (1 / 12) - 1
```

The baseline engine does not use:

```text
monthly rate = CAGR / 12
monthly inflation = annual inflation / 12
```

Price CAGR is the price-growth input only. Dividend yield is handled as a separate monthly cash-flow field. MDD and beta remain display/reference metrics and are not applied to the monthly return path.

## Cash Flow Policy

Month 0:

```text
portfolioValueNominal = initialInvestment
cumulativeContributions = initialInvestment
contributionExcludedIndex = 100
```

For each later month, contribution timing is month-start:

```text
1. Add monthlyContribution to the portfolio.
2. Allocate the contribution by target weights.
3. Apply monthly price return.
4. Record monthly dividend cash flow.
5. Reinvest dividend only when dividendReinvest=true.
6. Deflate nominal value by compounded monthly inflation for real value.
```

Initial investment and monthly contribution are separate fields. Contribution-included nominal value and contribution-excluded performance index are both emitted.

## Allocation And Rebalancing Policy

Initial investment is allocated by target weight. Each monthly contribution is also allocated by target weight.

The engine does not invent periodic portfolio rebalancing. Asset sleeves drift naturally after monthly returns unless the user changes the portfolio inputs.

## Output Contract

The engine emits monthly points from 0 through `investmentMonths`.

Required point fields:

```text
monthIndex
periodLabel
portfolioValueNominal
portfolioValueReal
cumulativeContributions
investmentGainNominal
contributionExcludedIndex
priceOnlyContributionExcludedIndex
totalReturnContributionExcludedIndex
monthlyContributionApplied
monthlyPriceReturnApplied
monthlyPriceReturnRate
monthlyDividendCashFlow
cumulativeDividendCashFlow
cumulativeExternalDividendCashFlow
```

Compatibility annual rows are still emitted for the existing simulator chart/table surface. They are derived from the same monthly points, not from a separate annual calculation path.

## Step Contracts

Step 2:

```text
Compares multiple portfolios using baseline curves only.
No probability bands, bootstrap, stress engine, or AI analysis is used.
```

Step 3:

```text
Uses the same baseline result object for the selected portfolio.
Detailed metrics are derived from that shared object.
```

The same portfolio input must produce identical Step 2 and Step 3 baseline results.

## Metric Source Gate

The baseline engine uses an allowlist gate. Missing, blank, or unsupported status values fail closed.

Required ready statuses:

```text
dataStatus=ready
metricsStatus=ready
reviewFlag=none
overlayStatus=app_ready or ready
productionPublishReady=true
appExportApproved=true
```

Boolean-like values are normalized before validation, including:

```text
false
"false"
0
"0"
```

The following status families are blocked because they are not in the allowlist:

```text
review_only
review_required
blocked
excluded
insufficient_history
short_history
limited_history
stale
missing
error
```

Required lineage fields:

```text
metricBaseDate
metricsSource
sourceHash or normalizedSeriesHash
calculationPolicyVersion
pipelineVersion
```

`calculationPolicyVersion` and `pipelineVersion` are separate lineage fields. Calculation policy allowlist entries are limited to calculation-policy identifiers. Pipeline or rolling metric versions are kept in `pipelineVersion`, `normalizationVersion`, or `rollingMetricVersion`.

The legacy May 2026 app-ready overlays are accepted only through the explicit compatibility adapter and actual loader-match evidence:

```text
legacy-may-app-ready-compat-v1-step114-2e
metricMode=us_price_metrics_overlay_price_close or kr_price_metrics_overlay_price_close
dataSource contains the matched May 2026 app-ready source name
```

The source string alone is not approval evidence. A ticker that only spoofs `metricsSource` without loader evidence fails closed.

Missing selected CAGR blocks calculation. Missing dividend yield blocks calculation when dividend reinvestment is enabled, and is preserved as `null` rather than inferred as `0.00` when reinvestment is disabled.

Blocked result contract:

```text
ready=false
status=blocked
expectedCagr=null
expectedDividendYield=null
expectedBeta=null
simpleMdd=null
futureValue=null
inflationAdjustedFutureValue=null
```

Blocked portfolios are excluded from Step 2 rank, chart, and insight best-value calculations. Step 3 shows a blocked baseline state instead of rendering zero-like metric values.

Public UI display policy:

```text
null metric values display as "미확인" or "-"
missing dividend, MDD, and beta are excluded from ranking
technical blockReasons stay in result metadata for audit/development use only
Step 3 public blocked copy is Korean user-facing guidance
```

## Contribution-Excluded Return Policy

The engine emits both contribution-excluded indices:

```text
priceOnlyContributionExcludedIndex
totalReturnContributionExcludedIndex
```

`contributionExcludedIndex` is an alias for `totalReturnContributionExcludedIndex` so the economic return scope is stable regardless of the dividend reinvestment setting. `priceOnlyContributionExcludedIndex` remains available when the UI or audit needs a dividend-excluded reference.

The total-return index is based on the actual no-rebalance sleeve path:

```text
monthlyContributionExcludedReturn
= (monthlyPriceReturnApplied + monthlyDividendCashFlow)
  / portfolioValueAfterMonthStartContribution
```

The engine does not use fixed target-weight returns for this index after month 0. Sleeves drift naturally when asset returns differ.

## Price Gain And Dividend Reconciliation

The engine tracks:

```text
monthlyPriceReturnApplied
cumulativePriceGain
monthlyDividendCashFlow
cumulativeDividendCashFlow
investmentGainNominal
externalDividendCashFlow
endingValuePlusExternalDividends
```

Annual dividend yield is converted into monthly cash flow with the same monthly compounding policy used for annual rates. `expectedAnnualDividend` is reconciled to the first 12 months of emitted monthly dividend cash flow. If dividend yield is missing, `expectedAnnualDividend` remains `null` and is not inferred as zero.

`annualProfit` and `cumulativeProfit` retain price-gain meaning. Reinvested dividends affect ending value, and non-reinvested dividends are reported as external dividend cash. Ending economic value reconciles as `ending portfolio value + external dividend cash`.

## Stable Ordering

Step 2 portfolios are sorted by `portfolioId`. Normalized assets and Step 2 top-level portfolio assets are sorted by `(market, ticker, id)` before calculation so input array permutations produce the same serialized comparison result.

Duplicate `portfolioId` values fail closed with `duplicate_portfolio_id`. Duplicate asset `(market,ticker)` identities inside one baseline calculation fail closed with `duplicate_asset_identity`.

KR tickers are kept as strings, preserving leading zeros such as:

```text
005930
069500
```

## Protected Files

These production loader inputs remain unchanged and are not pointed at the Step 114-2D review overlay:

```text
src/data/tickers/screenerCandidateOverlay.js
src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv
src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv
```

## Not Included

- No Step 114-2D review overlay production activation.
- No production loader pointer change.
- No Step 4 probabilistic analysis.
- No Step 5 external shock analysis.
- No Step 6 AI analysis.
- No external provider, KRX, data.go.kr, or KIS call.
- No auth, payment, subscription, DB, MY PAGE, trading readiness, order, or kill-switch change.
- No `data/processed/scenario_monthly_returns.csv` creation or modification.
