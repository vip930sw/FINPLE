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
monthlyContributionApplied
monthlyPriceReturnApplied
monthlyPriceReturnRate
monthlyDividendCashFlow
cumulativeDividendCashFlow
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

The baseline engine fails closed for metric sources marked as:

```text
review_only
review_required
blocked
excluded
insufficient_history
short_history
```

Explicit `productionPublishReady=false` or `appExportApproved=false` also blocks baseline readiness. Missing selected CAGR blocks calculation. Missing dividend yield blocks calculation when dividend reinvestment is enabled, and is preserved as `null` rather than inferred as `0.00` when reinvestment is disabled.

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
