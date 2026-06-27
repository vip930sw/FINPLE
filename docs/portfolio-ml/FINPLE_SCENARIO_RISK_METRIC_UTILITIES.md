# FINPLE Scenario Risk Metric Utilities

Created: 2026-06-27
Repository: `vip930sw/FINPLE`
Base branch: `main`
Step: 114-1B

## Scope

Step 114-1B adds pure portfolio risk metric utilities and tests only. It does not connect an API route, UI component, database table, AI payload, bootstrap engine, stress engine, or the existing `calculatePortfolioResult()` flow.

## Added Utilities

| Function | File | Purpose |
| --- | --- | --- |
| `calculatePortfolioMonthlyReturns` | `server/src/services/scenario/portfolioRiskMetrics.js` | Align common monthly asset returns and calculate portfolio monthly returns from target weights |
| `buildNavSeries` | `server/src/services/scenario/portfolioRiskMetrics.js` | Convert monthly returns into a NAV path without cashflow effects |
| `calculateDrawdownMetrics` | `server/src/services/scenario/portfolioRiskMetrics.js` | Calculate drawdown series, MDD, peak/trough month, and recovery month |
| `calculateRollingLossMetrics` | `server/src/services/scenario/portfolioRiskMetrics.js` | Calculate compounded rolling-window loss probabilities and loss magnitude |
| `normalizeTargetWeights` | `server/src/services/scenario/portfolioRiskMetrics.js` | Validate and normalize decimal or percent weights |

## Invariants

- Missing monthly returns are never filled with `0%`.
- Portfolio returns are calculated only on months common to all target assets.
- Monthly cashflow is not included in NAV or MDD calculation.
- Asset-level MDD is not weighted into portfolio MDD.
- Rolling losses use compounded window returns, not arithmetic sums.
- `annual` rebalancing resets target weights at the first observed month of a new calendar year.
- `none` rebalancing lets weights drift with realized returns.

## Validation

Run:

```powershell
npm.cmd run check:scenario-data
npm.cmd run check:scenario-metrics
npm.cmd run build
```

The metric tests cover zero-return paths, fixed-return NAV, drawdown recovery, unrecovered drawdown, rolling loss metrics, common-month alignment, annual rebalancing, duplicate months, bad weights, and no-common-month failure.

## Next Boundary

Step 114-2A can use these utilities with explicit monthly return fixtures or a persisted monthly data input. It should still avoid Bootstrap, API routes, UI, AI integration, DB persistence, and BETA stress logic until their separate steps.
