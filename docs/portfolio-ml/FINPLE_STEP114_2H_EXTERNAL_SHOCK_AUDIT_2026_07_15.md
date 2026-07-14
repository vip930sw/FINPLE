# FINPLE Step 114-2H External Shock Audit

Date: 2026-07-15

Scope: fixture-only deterministic Step 5 external shock engine and UI shell.

## Status

- fixturePackageReady: true
- productionPublishReady: false
- appExportApproved: false
- public default UI state: idle
- fixture review UI state: explicit review-only payload only
- providerCallsAllowed: false
- orderSubmissionAllowed: false

## Engine

Module: `server/src/services/scenario/externalShockEngine.js`

Entry point:

```js
buildExternalShockScenario(input)
```

Supported method:

- `deterministic_external_shock`

Supported shock modes:

- `direct_asset`
- `market_beta`

Required semantic fields:

- `scenarioId`
- `scenarioLabel`
- `bootstrapApplied=false`
- `probabilityApplied=false`
- `betaApplied=false` for `direct_asset`
- `betaApplied=true` for `market_beta`

The engine is pure offline JavaScript. It does not call providers, APIs, databases, KIS, KRX, data.go.kr, or scenario runtime endpoints.

## Calculation Policy

Direct asset shock:

```text
stressedAssetReturn = (1 + baselineReturn) * (1 + directShockReturn) - 1
```

Market beta shock:

```text
assetShockReturn = beta * marketFactorShock
stressedAssetReturn = (1 + baselineReturn) * (1 + assetShockReturn) - 1
```

Every effective beta must include provenance:

- `sourceHash`
- `sourceName`
- `asOfDate`
- `betaWindow`
- `methodVersion`

The beta provenance is included in normalized input, `inputHash`, output events, fixture payload, UI methodology, and chart marker assumptions.

The engine does not:

- apply beta to bootstrap or baseline results
- calibrate to selected CAGR
- apply historical MDD as a return input
- mix price return and total return basis
- replace missing returns, shocks, source hashes, or betas with zero

Inflation:

- `settings.inflationRate` or `settings.inflationRateAnnual` is normalized and included in the hash contract.
- Step 114-2H does not fabricate real-value paths from inflation; it preserves inflation as audited input metadata only.

## Path Definitions

Baseline valuation path:

- contribution-included path
- month-start contribution
- baseline monthly returns only

Stressed valuation path:

- contribution-included path
- month-start contribution
- stressed monthly returns on explicit shock months

Baseline risk NAV:

- contribution-excluded NAV
- starts at 100
- used for baseline MDD comparison

Stressed risk NAV:

- contribution-excluded NAV
- starts at 100
- used for stressed MDD and recovery

Contribution series:

- starts with initial investment at month 0
- increases by monthly contribution at each month start
- must align exactly with path month indexes

Row lineage:

- each selected `(month, market, ticker)` baseline row preserves its own `sourceHash`
- row lineage is exposed through `rowSourceLineage`
- swapping row source hashes while keeping the same source-hash union changes `inputHash` and `outputHash`

Rebalancing:

- `none`
- `annual`
- annual rebalance occurs at the month-start boundary before return application

## Validation Gates

The engine fails closed when any of the following is invalid:

- unsupported method or shock mode
- invalid or duplicate asset identity
- asset weight sum not equal to 1 or 100 percent
- invalid investment months or negative contribution
- missing effective source hash
- missing normalization, calculation policy, or pipeline version
- invalid calendar month
- duplicate asset calendar month
- missing asset month
- missing calendar month
- mixed return basis or currency mode
- baseline return less than or equal to -100 percent
- missing direct shock coverage for any selected asset
- direct shock less than or equal to -100 percent
- missing beta coverage in `market_beta`
- missing beta provenance in `market_beta`
- duplicate direct-asset shock identity in an event
- duplicate beta identity in beta rows
- conflict between beta rows and asset-level beta fallback
- market beta shock less than or equal to -100 percent
- duplicate shock month
- mixed shock payload shape
- insufficient monthly rows for requested horizon

Blocked and insufficient results keep deterministic input/output hashes and do not expose fabricated paths.

## Fixture Package

Fixture directory:

```text
data/fixtures/scenario-external-shock/
```

Included fixture files:

- `kr_two_asset_external_shock_base.json`
- `manifest.json`

Fixture coverage:

- KR leading-zero tickers `005930` and `069500`
- direct asset shock
- market beta shock
- drawdown and partial recovery
- source hash lineage
- derived invalid cases in tests for missing beta, missing shock coverage, duplicate shock month, mixed return basis, invalid month, insufficient data, and missing source hash

Browser fixture:

```text
src/components/portfolio/fixtures/externalShockScenarioResultFixture.js
```

The browser fixture is generated offline from the server engine. It contains only precomputed review data and does not import the Node engine.

The checked-in browser fixture includes both direct-asset and market-beta results for the same fixture review identity.

## UI Contract

Step 5 component:

```text
src/components/portfolio/components/ExternalShockAnalysisPanel.jsx
src/components/portfolio/components/ExternalShockPathChart.jsx
src/components/portfolio/utils/externalShockScenarioAdapter.js
```

Public default:

- status: `idle`
- no synthetic shock numbers exposed
- no automatic combination of current portfolio values and fixture results

Fixture review:

- requires explicit `enableFixtureReview=true`
- requires exact portfolio fingerprint match
- requires expected input hash and output hash match
- validates payload signature
- stale result preserves original fixture context
- baseline reference appears only when analysis identity matches
- direct-asset and market-beta scenarios are selected through review-only tabs
- comparison rows are descriptive only: label, mode, terminal delta rate, stressed MDD, incremental MDD, recovery months, and unrecovered status
- shock markers expose actual direct shock assumptions or market factor, beta, and beta provenance

The Step 5 UI does not use probability band labels or semantics. Step 4 probability analysis remains separate.

## Hash and Determinism

The engine uses stable key-sorted JSON serialization and SHA256 hashing.

Hashes include:

- portfolio identity
- normalized assets and weights
- settings
- shock events
- baseline monthly returns
- row-level baseline source hash lineage
- beta provenance
- normalized inflation rate
- effective source hashes
- normalization version
- calculation policy version
- pipeline version

Changing only source hash lineage changes both inputHash and outputHash.

Browser fixture validation uses a deterministic non-cryptographic payload signature to detect checked-in fixture tampering before display.

## Tests

Primary test files:

- `server/src/services/scenario/externalShockEngine.test.js`
- `src/components/portfolio/utils/externalShockScenarioAdapter.test.js`

Test coverage includes:

- byte-deterministic output
- direct asset shock arithmetic
- market beta shock arithmetic
- source hash determinism
- row-level source hash reassignment determinism
- beta provenance required and hash-affecting
- duplicate direct shock and beta identity fail-closed
- month-start contribution
- valuation path and risk NAV separation
- annual rebalance difference
- MDD and recovery from risk NAV
- KR leading-zero preservation
- missing source lineage fail-closed
- invalid month and duplicate calendar month fail-closed
- missing direct shock coverage fail-closed
- missing beta fail-closed
- insufficient data state
- public default idle UI
- fixture stale identity
- direct/beta scenario selector and comparison table
- baseline identity mismatch
- null path/contribution values not rendered as zero
- malformed ready payload blocked
- fixture payload tamper blocked
- no Node engine import in browser UI
- no scenario API/provider/loader import in Step 5 UI

## Disclaimer

The Step 5 UI states that this is a hypothetical deterministic stress test. It does not predict occurrence probability, does not predict future returns, and is not investment advice.

## Protected Areas

No changes were made to:

- production scenario API/cache/plan gate
- external provider, KRX, KIS, data.go.kr ingestion
- `data/processed/scenario_monthly_returns.csv`
- Step 4 probability engine semantics
- Step 6 AI payload or interpretation
- production loader pointer
- Step 114-2D review overlay activation
- auth, payment, subscription, DB, MY PAGE
- trading readiness, quote, order, authority, kill switch

## Known Limits

- This is not a forecast, guarantee, investment recommendation, or production market data path.
- Shock scenarios are deterministic fixture comparisons only.
- No real provider data is fetched or redistributed.
- UI review data is static and must stay stale or blocked when identity no longer matches.
