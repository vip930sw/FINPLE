# FINPLE Step 4·5 Trust and Availability Roadmap

Date: 2026-08-04  
Program issue: #429  
Preparation baseline: `3b901468857fc3a659a0272061644ac25936c409`

## 1. Decision summary

FINPLE Step 4 Probability Analysis and Step 5 External Shock Analysis must first establish actual coverage, transparent restrictions, and direct-data trust before adding more controls or any proxy-based estimation.

The approved order is:

1. Measure real Step 4·5 eligibility across the 6,029-asset runtime catalog.
2. Measure product coverage for official presets, US/KR Investment MBTI, and repository-supported high-use cohorts.
3. Show which asset blocks analysis, why it is blocked, and which Steps remain available.
4. Show Step 4·5 support status before an asset is added where practical.
5. Restore direct-data lineage for high-impact blocked assets, beginning with evidence for `KR:069500`.
6. Add accessible interpretation tooltips to Step 4·5.
7. Validate analysis-quality controls: shock timing presets, simulation-count convergence, and block-length sensitivity.
8. Consider user-defined shock timing only after fixed timing presets are validated.
9. Keep proxy analysis on hold until Phase 0 evidence and direct-lineage remediation are complete.

## 2. Product problem

A Personal-plan user may be able to find and add an asset, receive Step 1–3 results, and only discover in Step 4 or Step 5 that advanced analysis is unavailable. That creates three risks:

- **availability risk** — advanced analysis coverage may be lower than the 6,029-asset catalog suggests;
- **trust risk** — `expected_blocked` checks can be mistaken for numeric-analysis success;
- **interpretation risk** — unfamiliar metrics such as P10/P50/P90, scenario MDD, unrecovered ratio, replay, and shock impact can be misread.

Known representative policy blocks include `US:VNQ`, `US:BLOK`, and `KR:069500`. Their presence in tests means the fail-closed policy works; it does not mean numeric Step 4·5 results are available.

`KR:069500` is a high-impact case because it affects the KR Investment MBTI matrix. It must be audited as a direct-lineage remediation candidate, not bypassed or replaced silently.

## 3. Program principles

### 3.1 Direct-data first

Verified direct monthly data is the primary Step 4·5 path. A number must not become eligible merely because monthly rows exist.

### 3.2 Fail closed, explain clearly

If identity, history, proxy state, lineage, review status, or Beta is not adequate, calculation remains blocked. The public UI should identify the blocking asset and a user-safe reason.

### 3.3 Do not silently change the portfolio

The system must not automatically:

- remove a blocked asset;
- renormalize the remaining weights;
- substitute another ETF, index, or broad market;
- mix direct and proxy results without explicit disclosure and consent.

### 3.4 Preserve internal confidentiality

The UI may show `MARKET:TICKER`, display name, affected Steps, and a safe reason category. It must not show source hashes, approval identities, internal policy versions, raw error codes, or secret configuration.

### 3.5 Distinguish state correctness from analysis availability

A test or checker may pass because an asset is correctly `expected_blocked`. Coverage reporting must count that asset as unavailable for numeric Step 4·5 analysis.

## 4. Merged roadmap

## Phase 0 — Trust and availability

### P-1A — 6,029-asset eligibility inventory

Issue: #430

Classify every runtime identity into one primary state with secondary evidence flags. Counts must reconcile exactly to the runtime catalog total.

Minimum primary taxonomy:

- `ready`
- `missing_monthly_identity`
- `short_history_lt_60`
- `proxy_marked`
- `legacy_unproven`
- `review_required`
- `identity_mismatch`
- `missing_or_invalid_beta`
- `missing_or_invalid_metrics`
- `other_policy_block`

### P-1B — Product coverage report

Report coverage using impact rather than raw asset count alone:

- overall and by market;
- official preset assets and portfolios;
- all 16 US and 16 KR Investment MBTI portfolios;
- high-use/popular assets only when a canonical popularity source exists;
- privacy-safe saved-portfolio aggregate only when an existing aggregate source exists;
- blocked target-weight share per official/MBTI portfolio.

### P0A — Blocking asset and reason disclosure

Issue: #431

When Step 4 or Step 5 is blocked, show all blocking identities with:

- asset identity and display name;
- affected Step(s);
- safe reason category;
- Steps still available;
- navigation back to portfolio settings or asset detail.

Do not expose only a generic portfolio-level error when a safe asset-level explanation is available.

### P0B — Pre-add support visibility

Use the approved inventory classifier in Asset Finder and relevant add/detail surfaces. Suggested public states:

- Step 4·5 available;
- Step 4·5 limited — insufficient history;
- Step 4·5 under review — direct lineage/policy review;
- Step 4·5 unavailable — proxy or missing monthly identity.

Do not hard-code ticker lists in the UI.

### P0C — High-impact direct-lineage normalization

Issue: #432

Rank candidates after the inventory. Start with `KR:069500` audit because of KR MBTI impact, but only promote it to `ready` through evidence-backed direct-data policy state.

Allowed work includes identity correction, direct lineage completion, deterministic review completion, and established artifact-pipeline regeneration. Ticker-specific allowlists and lineage bypasses are prohibited.

### P0D — Step 4·5 interpretation help

Issue: #431

Add accessible click/focus popovers for key cards, tables, and methodology labels.

Step 4 minimum coverage:

- P10/P50/P90;
- principal shortfall probability;
- scenario MDD and recovery;
- unrecovered scenario ratio;
- simulation count;
- block months;
- data range and return basis.

Step 5 minimum coverage:

- baseline and stressed paths;
- terminal shock impact rate;
- baseline/stressed/incremental MDD;
- recovery and unrecovered state;
- available common history;
- selected source history;
- calculation path and replay;
- market shock and Beta application.

Each explanation should state meaning, how to read it, and what it does not mean.

## Phase 1 — Analysis quality

Issue: #433

### P1 — Step 5 shock timing presets

Preserve M12 as the standard comparison default, then evaluate:

- initial shock: M12;
- midpoint shock: approximately 50% of the horizon;
- near-goal shock: 12 months before the target date.

Add remaining recovery window and target-date shortfall interpretation before public release.

### P1′ — Simulation-count convergence

Compare at least 500, 1,000, and 2,000 simulations using fixed seeds and representative portfolios. Compare percentiles, shortfall probabilities, MDD, recovery, unrecovered ratio, and runtime. Do not present 500 as statistically sufficient until evidence supports it.

### P2 — Block sensitivity

Compare 6- and 12-month joint blocks. Report material differences in percentile bands, MDD, recovery, and shortfall. A user control is not approved merely because the engine supports both values.

## Phase 2 — Optional extensions

### P2′ — User-defined shock month

Consider only after fixed timing presets are validated. Required safeguards include range validation, stale-state handling, saved-setting policy, mobile UX, and hash/identity contract coverage.

### P3 — Verified Tier A/B proxy reference analysis

Status: **on hold**.

Proxy work may be reconsidered only after Phase 0 answers:

- how large the unresolved coverage gap is;
- which gaps can be repaired through direct lineage;
- whether missing coverage materially impairs the Personal plan;
- whether candidate proxies are same-index or demonstrably equivalent exposure.

If later approved, proxy results must be reference-only, visibly labeled, separately consented, and never represented as direct-data-equivalent.

## Phase 3 — Deferred and not approved

- Tier C same-sector proxy;
- broad-market proxy for dissimilar assets;
- automatic or silent proxy substitution;
- automatic exclusion and weight renormalization;
- Production lineage bypass.

## 5. Coverage decision gates

### Gate A — inventory acceptance

Before P0 implementation, verify:

- total identity count exactly reconciles to 6,029;
- no duplicate identity;
- every asset has one primary state;
- ready and expected-blocked counts are separate;
- official and MBTI matrices are complete;
- high-use claims have a canonical source or are marked unavailable;
- no user-level or sensitive data is included.

### Gate B — P0C remediation order

Rank using:

1. official/MBTI portfolio count affected;
2. blocked target-weight share;
3. high-use cohort impact when supported;
4. direct monthly rows already present;
5. metadata/review-only repair versus missing/short/proxy data;
6. artifact and release risk.

### Gate C — Proxy reconsideration

Do not implement proxy analysis unless:

- material gaps remain after direct remediation;
- direct data is unavailable or structurally insufficient;
- Tier A/B equivalence can be documented;
- overlap-period similarity and error thresholds are calibrated;
- user consent and visible disclosure are designed;
- direct and proxy results remain distinguishable.

## 6. Personal-plan trust criteria

Personal value should be assessed through multiple measures:

- overall ready-asset ratio;
- official preset portfolio ready ratio;
- US/KR MBTI ready ratio;
- high-use asset ready ratio, if supported;
- saved-portfolio aggregate ready ratio, if privacy-safe data exists;
- blocked weight share;
- percentage of blocks recoverable through direct lineage.

Pricing and marketing copy should not imply universal Step 4·5 availability unless these measures support it. A safer current description is: advanced analysis is available for assets with verified monthly data.

## 7. Release governance

Every workstream uses a dedicated Issue, branch, and Draft PR. No task in this roadmap authorizes:

- direct commits to `main`;
- Production ref movement;
- Vercel/Render environment, alias, domain, or CORS changes;
- canonical/public CSV mutation outside approved data operations;
- pinned monthly artifact mutation without complete binding and reconciliation;
- provider, DB, auth, payment, subscription, or trading changes.

Production deployment and data release remain separate explicit approvals.
