# FINPLE Step 114-2G Probability UI Audit

Date: 2026-07-15

Scope: simulator Step 4 probability-analysis UI shell.

## Summary

Step 114-2G adds a fixture-safe UI shell for probability analysis. The public simulator shell starts in `idle` state and does not expose fixture probability numbers by default. A precomputed Step 114-2F-shaped result may be rendered only through an explicit review-only gate and browser-safe validator.

UI version:

```text
probability-ui-shell-v1-step114-2g
```

This is not a live production scenario analysis service. It does not call a scenario API, run the Node bootstrap engine in the browser, use production monthly data, activate review overlays, write a database, or change trading, payment, auth, MY PAGE, Step 5, or Step 6 behavior.

## Fixture Adapter Contract

Public `/simulator` default:

```text
scenarioResult=null
enableFixtureReview=false
status=idle
probability numbers hidden
```

Allowed review-only input path:

```text
explicit review gate
precomputed Step 114-2F view fixture
browser-safe validator
probability view model
Step 4 UI components
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
fixtureContext.reviewOnly=true
fixtureContext.portfolioFingerprint
fixtureContext.expectedInputHash
fixtureContext.expectedOutputHash
fixtureContext.payloadSignature
betaApplied=false
cagrCalibrationApplied=false
historicalMddApplied=false
```

The checked-in fixture was generated offline from the Step 114-2F probabilistic engine using the fixture-only KR leading-zero matrix:

```text
data/fixtures/scenario-probabilistic/kr_leading_zero_matrix.json
```

The browser bundle does not import the Node engine. The fixture stores the actual Step 114-2F `inputHash` and `outputHash`, plus a separate view-payload signature so a changed fixture payload with the previous output hash is blocked.

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

`ready` renders only after the result passes the review gate, fixture identity, output hash, payload signature, and full ready-contract validation. `insufficient_data`, `blocked`, `stale`, and `error` do not render fabricated probability numbers. `stale` marks that the current portfolio/settings/assets fingerprint or expected input/output hash no longer matches the result identity.

## Ready Validator

The ready validator is fail-closed. Invalid or incomplete input blocks the entire probability chart rather than filtering bad points or substituting zero.

Validated fields:

```text
monthIndex integer / unique / strict ascending
nominal P10 <= P25 <= P50 <= P75 <= P90
real P10 <= P25 <= P50 <= P75 <= P90
terminal P10/P25/P50/P75/P90 ordering
shortfall probability null or [0,1]
scenario MDD in [-1,0] with quantile ordering
recovery months nonnegative
unrecovered ratio [0,1]
contribution series finite / nondecreasing / exactly aligned
simulationCount positive integer
blockMonths in {6,12}
randomSeed integer
returnBasis / currencyMode / date / status consistency
```

Null, undefined, or empty-string numeric values are not converted to zero. Unavailable display values use `-` or `미확인`.

## Band-Chart Semantics

The Step 4 chart is dedicated to one analysis identity.

Series:

```text
P10-P90 outer band
P25-P75 inner band
P50 median line
deterministic baseline reference line when identity matches
cumulative contribution line
```

P50 is labeled as a median path, not a prediction or guaranteed expected path.

## Baseline And Contribution Overlay

The deterministic baseline reference line is optional and is displayed only when the baseline result carries the same analysis identity:

```text
baseline.analysisIdentity.portfolioFingerprint === scenario.fixtureContext.portfolioFingerprint
baseline.analysisIdentity.inputHash === scenario.inputHash
```

The public shell never automatically overlays the current user's Step 114-2E baseline onto the fixture probability band. Fixture review uses a precomputed fixture baseline with the same identity.

The contribution line is not used as a probability return path. Missing, decreasing, or misaligned contribution series blocks the ready chart instead of drawing a zero-value line.

## MDD And Recovery Labels

The UI labels Step 114-2F drawdown as:

```text
scenario MDD
```

It is explicitly distinct from historical MDD. For negative MDD quantiles, the UI explains that the lower percentile is the more adverse downside outcome.

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
이 확률분석은 과거 월간 수익률 재표본화 시뮬레이션입니다.
미래 수익을 예측하거나 보장하지 않으며 투자 권유가 아닙니다.
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

- The panel is idle by default and fixture/review-only when explicitly gated.
- It does not create Step 5 stress analysis.
- It does not migrate AI analysis into final Step 6.
- It does not derive probabilities from production loader overlays, CAGR, beta, or historical MDD summaries.
- The checked-in fixture is offline synthetic view data generated by the Step 114-2F engine and must not be interpreted as a real user portfolio probability result.

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
