# FINPLE Step 114-2F Probabilistic Engine Audit

Date: 2026-07-15

Scope: fixture-only probabilistic scenario calculation engine.

## Summary

Step 114-2F adds a pure offline joint monthly block-bootstrap engine for fixture verification.

Engine version:

```text
probabilistic-scenario-v1-step114-2f
```

Method:

```text
joint_block_bootstrap
```

This step does not activate Step 4 UI, Step 5 stress analysis, Step 6 AI, a scenario API route, cache, usage limits, production loader pointers, external providers, DB writes, auth/payment, MY PAGE, or trading surfaces.

## PRNG

Algorithm:

```text
xorshift32-v1
```

Seed policy:

- `scenario.randomSeed` is required and must be an integer.
- Seed `0` is remapped to a fixed non-zero internal state.
- The engine does not call `Math.random()`.
- Same normalized input, policy, simulation count, block size, and seed produce byte-identical serialized output.
- Different seeds normally change sampled block traces and the output hash.

## Block Sampling

The bootstrap policy is non-circular moving-block sampling with replacement:

```text
valid historical block starts
→ choose one block start with the seeded PRNG
→ take blockMonths consecutive synchronized monthly rows
→ append blocks until investmentMonths is reached
→ truncate only the final block to the exact horizon
```

Supported block lengths:

```text
6 months
12 months
```

Every sampled block start is applied jointly to all assets. Asset-level independent month or block sampling is forbidden.

## History And Coverage Gate

The default minimum common history is:

```text
minimumCommonHistoryMonths = max(60, 36, blockMonths * 3)
```

The matrix must contain one complete synchronized monthly row for every requested asset and month. Duplicate asset identities, duplicate asset-month rows, missing synchronized months, missing returns, mixed return bases, mixed currency mode, missing lineage, or insufficient history fail closed.

Short data returns:

```text
status=insufficient_data
```

and does not emit precise terminal value, probability, MDD, or recovery metrics.

## Input Contract

Minimum input fields:

```text
portfolioId
assets[].market
assets[].ticker
assets[].targetWeight
settings.initialInvestment
settings.monthlyContribution
settings.investmentMonths
settings.inflationRateAnnual
settings.rebalanceFrequency = none | annual
scenario.method = joint_block_bootstrap
scenario.simulationCount
scenario.blockMonths = 6 | 12
scenario.randomSeed
monthlyReturnMatrix[]
metadata.returnBasis = price_return | total_return
metadata.currencyMode
metadata.sourceHashes
metadata.normalizationVersion
metadata.calculationPolicyVersion
metadata.pipelineVersion
```

KR tickers are normalized as strings and leading zeros are preserved, including:

```text
005930
069500
```

## Return Basis

`price_return` and `total_return` are explicit and cannot be mixed within a run.

For `total_return`, dividend reinvestment is already contained in the monthly return series. The engine does not add dividend yield again. Missing dividend evidence is not inferred as zero by this probabilistic engine.

## Contribution Timing

The valuation path uses Step 114-2E month-start contribution timing:

```text
month value = (prior month-end value + monthly contribution) * (1 + sampled monthly portfolio return)
```

Contributions are allocated by target weights.

## Rebalancing Boundary

Supported policies:

```text
none
annual
```

`annual` rebalancing occurs at the start of each simulated year after month 12, before applying that month’s sampled return and after month-start contribution allocation. No tactical, probability-dependent, or stress-dependent rebalancing is implemented.

## Valuation Path And Risk NAV

Two paths are maintained:

```text
valuation path
- starts with initialInvestment
- includes monthlyContribution
- emits nominal and inflation-adjusted values

risk NAV path
- starts at 100
- excludes external contributions
- applies only sampled asset returns and rebalance policy
- is the only path used for scenario MDD and recovery
```

Changing monthly contribution changes the valuation path but must not change scenario MDD when sampled returns and weights are unchanged.

## CAGR, Beta, And Historical MDD

The engine records:

```text
betaApplied=false
cagrCalibrationApplied=false
historicalMddApplied=false
```

Selected CAGR is not used to calibrate sampled paths. BETA is not applied to bootstrap returns. Historical MDD is not used as a shock or return input.

## MDD And Recovery

Scenario MDD is calculated from each contribution-excluded risk NAV path:

```text
runningPeak(t) = max(NAV(0)..NAV(t))
drawdown(t) = NAV(t) / runningPeak(t) - 1
MDD = min(drawdown(t))
```

Recovery months are measured from the peak month associated with the scenario MDD to the first later month whose risk NAV is greater than or equal to that peak. Scenarios that never recover by the horizon count toward:

```text
unrecoveredScenarioRatio = unrecoveredScenarioCount / simulationCount
```

## Percentiles

Percentiles use sorted linear interpolation:

```text
index = (n - 1) * probability
```

The engine emits:

```text
P10 / P25 / P50 / P75 / P90
```

For nominal and real value bands, ordered values satisfy:

```text
P10 <= P25 <= P50 <= P75 <= P90
```

For negative MDD values, lower percentiles are more adverse because the distribution is sorted ascending.

## Probabilities

Principal shortfall probability denominator:

```text
simulationCount
```

A scenario is counted as principal shortfall at month N when:

```text
valuationPath[N] < cumulativeContributions[N]
```

If the requested horizon is shorter than 12, 36, or 60 months, the corresponding probability is `null`, not `0`.

## Precision And Rounding

Output numeric fields are rounded to 10 decimal places for deterministic serialized output. Internal path calculations use JavaScript number arithmetic and are not rounded before aggregation.

## Hashes

The result includes:

```text
inputHash
outputHash
sourceHashes[]
normalizationVersion
calculationPolicyVersion
pipelineVersion
```

`inputHash` is SHA256 over the normalized deterministic input. `outputHash` is SHA256 over the deterministic result object before `outputHash` is attached.

## Fixture Inventory

Fixture path:

```text
data/fixtures/scenario-probabilistic/
```

Included fixtures:

```text
synchronized_two_asset_monthly_matrix.json
joint_relation_asset_b_2x_asset_a.json
drawdown_recovery_matrix.json
missing_month_matrix.json
insufficient_history_matrix.json
kr_leading_zero_matrix.json
```

All fixtures are synthetic and fixture-only. They are not production market data and are not connected to loader pointers.

## Protected Files

The following remain unmodified by this step:

```text
data/processed/scenario_monthly_returns.csv
src/data/tickers/screenerCandidateOverlay.js
src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv
src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv
```

## Known Limitations

- This is a fixture-only calculation engine.
- No scenario API route, cache, plan gate, UI, or production workflow is activated.
- The engine does not estimate future return distributions from fundamentals or AI.
- The engine does not implement factor shocks, stress tests, or FX conversion.
- The bootstrap resamples historical monthly return patterns and can only reflect the limitations of the input matrix.

## User-Facing Disclaimer

The generated distribution is a resampling of historical monthly returns. It is not a prediction, guarantee, investment recommendation, or instruction to buy, sell, or hold any financial product.
