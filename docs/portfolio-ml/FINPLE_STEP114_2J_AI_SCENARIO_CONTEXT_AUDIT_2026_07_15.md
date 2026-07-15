# FINPLE Step 114-2J AI Scenario Context Audit

Date: 2026-07-15

Scope: fixture/offline validated scenario context for Step 6 AI interpretation. This step does not activate live Step 4/5 loaders, production scenario APIs, provider ingestion, trading, DB, auth, billing, or review overlay publication.

## Contract

Step 6 may receive an optional `scenarioInterpretationContext` with `contextVersion=ai-scenario-context-v1-step114-2j` and `target=simulator-step6`.

The context is interpretation-only:

- AI는 STEP 4·5에서 계산된 검증 결과를 해석하며 직접 확률·MDD·충격 결과를 계산하지 않습니다.
- 외부충격분석은 충격의 발생 확률을 의미하지 않습니다.
- 투자 권유가 아닙니다.

If no eligible context is present, the public AI request remains a normal portfolio-analysis request without Step 4/5 scenario payload.

## Review Valid vs Provider Eligible

Review-valid scenario results may exist in the browser for fixture review, stale inspection, or blocked-state messaging. They are not automatically eligible for AI provider payloads.

`PortfolioSimulator` is the single runtime owner for building `scenarioInterpretationContext`; it passes exactly one `scenarioInterpretationContext` prop to `AiAnalysisPanel`. The public default remains `null` or omitted. Production components must not import browser fixture modules.

Provider payload inclusion is fail-closed and requires all of the following:

- `fixtureOnly=false`
- `productionPublishReady=true`
- `appExportApproved=true`
- current portfolio fingerprint match
- existing Step 4/5 adapter validation has produced a ready view model
- required lineage fields: input hash, output hash, source hashes, normalization version, calculation policy version, and pipeline version
- adapter-level approval evidence that repeats the same flags, fingerprint, hashes, and versions

Fixture and review-only results are excluded from live AI provider payloads even when their chart view is valid.

Runtime status values are exact:

- `omitted`: no scenario context inputs
- `ready`: all included sections are provider eligible
- `partial`: only one section is included, or a non-fingerprint section exclusion exists
- `blocked`: malformed or approval-failed context without an eligible section
- `stale`: current portfolio fingerprint does not match the validated scenario identity

## Compact Payload

Probability context includes only compact summary fields:

- P10/P50/P90 terminal values
- principal shortfall probability
- scenario MDD quantiles
- recovery summary
- simulation count, block months, random seed, method, date range, return basis, currency mode
- source hashes and version lineage

External shock context includes only compact summary fields:

- scenario ID, label, and mode
- visible shock assumptions
- baseline/stressed terminal value, delta value, and delta rate
- baseline/stressed/incremental MDD
- recovery and unrecovered state
- compact asset impact
- beta provenance summary
- `occurrenceProbabilityEstimated=false`

The context must not include full monthly paths, simulation traces, raw return matrices, row-level raw source data, browser fixture payloads, or contribution series.

## Server Validation

The server treats optional scenario context as untrusted input. It validates:

- canonical wrapper only: `status=ready|partial`, `providerEligible=true`, `providerContext`, and integrity metadata
- supported version and target
- interpretation-only and immutable-calculation flags
- required sections and hashes
- section-level approval evidence with `fixtureOnly=false`, `productionPublishReady=true`, and `appExportApproved=true`
- quantile ordering
- probability ranges
- MDD and recovery ranges
- external shock occurrence probability is false
- compact payload only
- maximum serialized byte size
- maximum source-hash, shock-event, asset-impact, and beta-provenance counts
- maximum string length and exact allowed keys
- strict shock month ordering, finite shock/beta values, asset identity consistency, and KR leading-zero ticker preservation

Malformed context fails closed with a 400 request validation error. Omitted context remains allowed for legacy/public requests. `analysisContext=simulator-step4` remains accepted for legacy compatibility; Step 6 client requests use `simulator-step6`.

Because no production Step 4/5 source is connected in this step, the server live-provider scenario-context gate is disabled by default. Tests explicitly enable `FINPLE_AI_SCENARIO_CONTEXT_PROVIDER_ENABLED=true` only to verify the approved wrapper path.

## Cache Signature

The client AI cache signature includes scenario context version plus Step 4/5 method input/output hashes when provider-eligible context is included. Omitted context preserves the prior signature shape. A changed scenario input/output hash therefore marks cached AI interpretation stale.

## Prompt Rules

The live-provider prompt states that supplied scenario calculations are immutable facts, and the model must not recompute probability, MDD, recovery, stress, or shock results. It also distinguishes probabilistic bootstrap output from deterministic external shock output and forbids occurrence-probability inference for external shocks.

The structured output schema includes an optional backward-compatible `scenarioInterpretation` section:

- `contextUsed`
- `probabilityNarrative`
- `externalShockNarrative`
- `combinedLimitations`

The section is rendered only when context was actually used. Validated numbers shown in the UI come directly from the context, not from model-generated narrative text.

UI formatting separates money and ratio formatters. A ratio value of `-0.10` is displayed as `-10.0%`; missing or unavailable context values are displayed as unavailable text, not zero.

## Known Limits

This step does not connect production Step 4/5 results into Step 6. Current checked-in Step 4/5 browser fixtures remain review-only and are blocked from provider payloads. A future production data approval step must provide non-fixture, app-export-approved context before live AI receives scenario summaries.

## Rollback

Rollback is low risk: remove the Step 114-2J context utility, omit `scenarioInterpretationContext` from client payload/signature creation, and remove the optional server schema branch. Existing portfolio-only AI requests continue to operate without scenario context.
