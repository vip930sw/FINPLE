# FINPLE Historical Rolling Baseline

Created: 2026-06-27
Repository: `vip930sw/FINPLE`
Base branch: `main`
Step: 114-2A

## Scope

Step 114-2A adds a pure historical rolling-window baseline on top of the Step 114-1B risk metric utilities. It still does not add Bootstrap, API routes, UI, AI integration, DB persistence, benchmark auto-selection, FX conversion, or provider refetch.

Because Step 114-1A found no committed monthly time-series input, this baseline accepts explicit monthly return arrays or future persisted monthly inputs. It never derives rolling scenarios from `expectedCagr`, `mdd`, `beta`, or other summary fields.

## Added Utilities

| Function | File | Purpose |
| --- | --- | --- |
| `buildHistoricalRollingWindows` | `server/src/services/scenario/portfolioHistoricalBaseline.js` | Slice explicit monthly portfolio returns into rolling horizon windows and calculate terminal return, NAV, MDD, and recovery fields |
| `buildHistoricalRollingBaseline` | `server/src/services/scenario/portfolioHistoricalBaseline.js` | Build 1y/3y/5y/10y historical rolling summaries from asset monthly returns and target weights |

## Outputs

The baseline returns:

- `analysisVersion: historical-rolling-baseline-v0.1`
- `method: historical_rolling_windows`
- input observation range and count
- horizon summaries keyed by `12m`, `36m`, `60m`, and `120m` by default
- terminal return P10/median/P90
- terminal loss probability and configured threshold probabilities
- median/worst MDD and MDD threshold probabilities
- recovered/unrecovered window counts
- median recovery months for recovered windows
- metadata confirming `betaApplied: false`, `cashflowIncludedInMdd: false`, and common-month-only alignment

## Guardrails

- Missing monthly returns are not zero-filled; the Step 114-1B common-month intersection policy remains in force.
- The baseline uses realized portfolio return windows, so BETA is not applied again.
- Cashflow is excluded from NAV/MDD.
- Asset-level MDD is not weighted into portfolio MDD.
- Windows shorter than the requested horizon return no observations instead of fabricated values.
- Bootstrap and random sampling remain Step 114-2B, not part of this baseline.

## Validation

Run:

```powershell
npm.cmd run check:scenario-data
npm.cmd run check:scenario-metrics
node --test server/src/services/*.test.js server/src/services/scenario/*.test.js
npm.cmd run build
```

The Step 114-2A tests cover 1y/3y/5y/10y horizon counts, insufficient observations, common-month alignment without zero fill, terminal loss probabilities, MDD threshold probabilities, unrecovered windows, invalid horizons, and invalid loss thresholds.

## Next Boundary

Step 114-2B can add joint block bootstrap only after persisted monthly return inputs or controlled fixtures are available. It should reuse the same monthly return alignment and NAV/MDD functions instead of applying BETA or summary metrics a second time.
