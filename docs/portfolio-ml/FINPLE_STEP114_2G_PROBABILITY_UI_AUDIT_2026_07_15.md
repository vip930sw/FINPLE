# FINPLE Step 114-2G Probability UI Audit

Date: 2026-07-15

Scope: simulator Step 4 probability-analysis UI shell.

## Summary

Step 114-2G adds a fixture-safe UI shell for probability analysis. The UI consumes a precomputed Step 114-2F-shaped result object through a browser-safe validator and view-model adapter.

UI version:

```text
probability-ui-shell-v1-step114-2g
```

This is not a live production scenario analysis service. It does not call a scenario API, run the Node bootstrap engine in the browser, use production monthly data, activate review overlays, write a database, or change trading, payment, auth, MY PAGE, Step 5, or Step 6 behavior.

## Fixture Adapter Contract

Allowed input path:

```text
fixture/precomputed Step 114-2F result
→ browser-safe validator
→ probability view model
→ Step 4 UI components
```

The browser adapter preserves and validates:

```text
status
scenarioVersion
method
prngAlgorithm
randomSeed
simulationCount
blockMonths
rebalanceFrequency
returnBasis
currencyMode
dataStartDate
dataEndDate
sourceHashes count for audit only
inputHash
outputHash
dataQuality
monthlyBands
terminalValue
principalShortfallProbability
scenarioMdd
recovery
contributionSeries
betaApplied=false
cagrCalibrationApplied=false
historicalMddApplied=false
```

Malformed version, method, hash, percentile ordering, or applied beta/CAGR/MDD calibration fails closed.

## Status-State Policy

Supported states:

```text
idle
ready
insufficient_data
blocked
stale
error
```

`ready` renders only after the fixture result passes validation. `insufficient_data`, `blocked`, and `error` do not render fabricated probability numbers. `stale` marks that the current portfolio/settings no longer match the result input hash and may show the previous result only with a stale warning.

## Band-Chart Semantics

The Step 4 chart is dedicated to one selected portfolio.

Series:

```text
P10-P90 outer band
P25-P75 inner band
P50 median line
deterministic baseline reference line when supplied
cumulative contribution line
```

The chart validates:

```text
P10 <= P25 <= P50 <= P75 <= P90
```

Invalid or incomplete monthly bands are blocked before chart geometry is rendered. P50 is labeled as a median path, not a prediction or guaranteed expected path.

## MDD And Recovery Labels

The UI labels Step 114-2F drawdown as:

```text
scenario MDD
```

It is explicitly distinct from historical MDD. For negative MDD quantiles, the UI explains that the lower percentile is the more adverse downside outcome.

## Baseline And Contribution Overlay

The Step 114-2E deterministic baseline reference line is optional and is displayed only when supplied by the existing baseline result. It is visually separate from:

```text
P50 median probability line
cumulative contribution line
```

The contribution line is not used as a probability return path.

## Navigation Decision

Current inventory before this step:

```text
settings / compare / detail / ai
STEP 1 / STEP 2 / STEP 3 / STEP 4 AI
```

This PR adds a minimal `probability` tab:

```text
STEP 1 settings
STEP 2 compare
STEP 3 detail
STEP 4 probability
AI preserved as a separate existing tab
```

The full Step 5 stress UI and full Step 6 AI migration remain deferred. Existing AI panel behavior, direct link surface, refresh behavior, and storage behavior are not rewritten in this PR.

## Accessibility And Mobile Policy

The probability chart has an `aria-label`, keyboard-focusable chart points, SVG title tooltips, text/pattern line distinctions in addition to color, and a mobile summary table fallback. Mobile CSS collapses layout grids to avoid horizontal page overflow.

## User-Facing Disclaimer

The Step 4 panel shows:

```text
이 확률분석은 과거 월간 수익률을 재표본화한 시뮬레이션입니다.
미래 수익을 예측하거나 보장하지 않으며, 투자 권유가 아닙니다.
```

## Protected Surfaces

Unchanged by this step:

```text
server/src/index.js
src/components/portfolio/components/AiAnalysisPanel.jsx
src/data/tickers/screenerCandidateOverlay.js
data/processed/scenario_monthly_returns.csv
src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv
src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv
```

No external provider, KRX, KIS, data.go.kr, DB, auth, payment, subscription, MY PAGE, trading readiness, order, authority, kill-switch, global DOM patch, or MutationObserver behavior is added.

## Known Limitations

- The panel is fixture/review-only and not wired to a live scenario runtime.
- It does not create Step 5 stress analysis.
- It does not migrate AI analysis into final Step 6.
- It does not derive probabilities from production loader overlays, CAGR, beta, or historical MDD summaries.
- The displayed fixture is synthetic and must not be interpreted as a real user portfolio probability result.

## Rollback

Rollback can remove:

```text
src/components/portfolio/components/ProbabilityAnalysisPanel.jsx
src/components/portfolio/components/ProbabilityBandChart.jsx
src/components/portfolio/utils/probabilityScenarioAdapter.js
src/components/portfolio/fixtures/probabilityScenarioResultFixture.js
src/components/portfolio/utils/probabilityScenarioAdapter.test.js
```

and revert the minimal `PortfolioSimulator.jsx`, `SimulatorTabNav.jsx`, `App.css`, and `AiAnalysisPanel.css` wiring.

## Step 114-2H And 2I Preparation

Step 114-2H can add the external-shock analysis engine and UI without reusing this probability chart as a stress chart. Step 114-2I can perform the full navigation migration and AI Step 6 placement after direct-link and saved-state compatibility are tested.

