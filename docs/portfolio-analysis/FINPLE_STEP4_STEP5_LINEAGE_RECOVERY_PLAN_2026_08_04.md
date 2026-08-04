# FINPLE Step 4·5 Direct-Lineage Recovery and Monthly Inheritance Plan

Date: 2026-08-04  
Parent program: #429  
Execution issue: #432  
Accepted inventory: #430 / PR #439  
Planning baseline: `a193c13790b54bf265a4cc51f72d1adbcec3cadb`  
Production baseline: `3b901468857fc3a659a0272061644ac25936c409`

## 1. Decision summary

The highest-priority task is **not an immediate six-ticker repair**. The first priority is to explain why the current pinned `legacy_v1` release classifies 1,338 assets as `ready` while 2,323 additional assets appear to be direct single-fix recovery candidates, and to define a durable lineage-inheritance contract before any Production-facing remediation.

The approved execution order is:

1. **Forensic comparison and contract discovery** — compare the 1,338 current-ready assets with the 2,323 direct single-fix candidates and identify the exact evidence and policy-state differences.
2. **Monthly inheritance contract** — define how verified direct lineage survives future monthly releases when source, identity, collection, normalization, row contract, and validation policy remain unchanged.
3. **Core-six evidence audit** — audit `US:VNQ`, `US:BLOK`, `KR:069500`, `KR:273130`, `KR:329200`, and `KR:305720` as the first product-impact pilot.
4. **Core-six recovery pilot** — restore only evidence-backed candidates through the new contract and prove official/MBTI coverage improvement without bypasses.
5. **2,323-candidate cohort expansion** — group candidates by common source and normalization evidence, remediate cohort by cohort, and keep exceptions blocked.
6. **Monthly regression gate** — prove that subsequent candidate releases inherit valid approvals automatically and route only new, changed, or failed identities to review.

This plan supersedes any interpretation that #432 should begin by manually approving six tickers or all 2,323 candidates.

## 2. Accepted current state

The merged inventory reports:

- runtime identities: 6,029;
- Step 3 ready: 4,712;
- Step 4 numeric ready: 1,338 (`22.1927%`);
- Step 5 numeric ready: 1,338 (`22.1927%`);
- `review_required`: 4,009;
- `missing_monthly_identity`: 682;
- direct single-fix lineage/review candidates: 2,323;
- official portfolios ready: 8/10;
- US Investment MBTI ready: 4/16;
- KR Investment MBTI ready: 0/16.

The product-impact ranking identifies six direct single-fix candidates:

1. `US:VNQ` — official 1, US MBTI 8;
2. `US:BLOK` — official 1, US MBTI 6;
3. `KR:069500` — KR MBTI 16;
4. `KR:273130` — KR MBTI 9;
5. `KR:329200` — KR MBTI 8;
6. `KR:305720` — KR MBTI 6.

If these six become validly `ready`, the expected product outcome is official 10/10, US MBTI 16/16, and KR MBTI 16/16. This is a target to verify, not permission to bypass policy.

`Direct single-fix lineage/review candidate` is an eligibility-graph classification, not a provenance approval. It means that monthly identity, Step 3, Beta, contiguous-history, ordinary-distribution, and pinned-binding checks pass while the catalog review gate is the effective blocker. The current 1,338 ready identities also retain a `legacy_v1` evidence gap: they have no explicit row-level `isProxy=false` or repository-preserved per-identity collector/run receipt and are allowed by the exact pinned legacy binding plus frozen `ready / ready / none` catalog fields.

## 3. Phase 432-A forensic finding

The completed read-only investigation is recorded in `docs/portfolio-analysis/FINPLE_STEP4_STEP5_LINEAGE_FORENSICS_FINDINGS_2026_08_04.md`.

It proves that both groups share the same pinned candidate package, normalization version, metrics calculation, exporter, monthly index/shards, and release. The exact eligibility discriminator is the frozen `dataStatus`, `metricsStatus`, and `reviewFlag` tuple. It does **not** prove that every identity came from one identical raw Colab collection execution because the repository does not preserve the raw source audit, external candidate receipt, or per-identity collector/run receipt.

The investigation also separates the existing 6,000 cohort from the 29-US-delta cohort and confirms that the current-ready legacy set itself needs evidence modernization. No remediation may treat package binding, numeric review approval, and direct-source lineage as the same decision.

## 4. Priority rationale

### Priority 1 — forensic comparison and inheritance design

This has the highest priority because it determines whether the next steps are:

- a safe metadata/review normalization;
- a cohort-level lineage migration;
- a partial raw-data recollection;
- or a broader artifact-contract redesign.

Repairing the six tickers first with temporary metadata would create three risks:

- the same assets may become blocked again at the next monthly release;
- the repair may not generalize to 2,323 candidates;
- the system may retain two inconsistent definitions of direct lineage.

### Priority 2 — core-six vertical slice

After the difference and inheritance contract are understood, the six high-impact identities are the best pilot because they provide maximum product-coverage evidence with a small review surface.

### Priority 3 — 2,323-candidate expansion

Expansion is third because a broad approval before the pilot contract is proven would amplify any mistake across thousands of assets.

## 5. Target-state lineage model

An approval must not belong only to one monthly CSV file. It should be anchored to a stable data-generation contract and inherited by a new release only when all material invariants remain compatible.

Two contracts are required and must remain independent:

1. **Monthly lineage-inheritance contract** — source, identity, collector, normalization, row contract, proxy state, previous-release delta, automatic inheritance, and exception routing.
2. **Review-policy decision contract** — generic CAGR, MDD, Beta, dividend, 5Y-history, initial-gap, and split-evidence decisions with versioned audit results.

Passing one contract must not bypass a failure in the other.

The exact schema is an implementation decision, but the contract must represent at least:

- normalized identity: `MARKET:TICKER`;
- source/provider identity or approved source class;
- collector code reference or immutable collector version;
- normalization code reference or immutable normalization version;
- row contract version;
- market and ticker mapping rules;
- direct/non-proxy evidence;
- asset/product-type policy where relevant;
- validation-policy version;
- source observation period and data-through month;
- prior approved lineage evidence reference;
- release-to-release change classification;
- review result and exception reason when inheritance is denied.

A monthly candidate release may inherit lineage only if the checker proves:

1. identity is unchanged and exact;
2. source class is unchanged and approved;
3. collector and normalization contract are unchanged or explicitly compatible;
4. rows remain direct and non-proxy;
5. schema and row contract remain compatible;
6. no duplicate, missing, reordered, or invalid month violates policy;
7. historical revisions remain within approved rules or receive explicit review;
8. current Step 3, history, and Step 5 Beta requirements remain satisfied;
9. release manifest, index, shard, and file inventory reconcile;
10. the coverage report does not silently regress.

A failure in any material invariant must remain fail-closed and enter an exception queue.

## 6. Phase plan

## Phase 432-A — read-only provenance forensics

### Goal

Explain the 1,338-versus-2,323 difference without changing runtime data, catalog policy, monthly artifacts, or Production.

### Required comparison

Create a deterministic per-identity comparison for:

- all 1,338 current-ready assets;
- all 2,323 direct single-fix candidates;
- the six product-impact identities;
- representative exceptions from each discovered cohort.

Compare, where evidence exists:

- market and asset type;
- original catalog row and current runtime row;
- data/metrics/review state;
- review approval and policy fields;
- monthly identity and row contract;
- raw collection evidence and file references;
- collector commit/ref;
- normalization script and version;
- source/provider class;
- first/last observation and contiguous history;
- proxy-related evidence;
- Step 3 metric validity;
- Beta validity;
- distribution-policy classification;
- pinned release and artifact binding;
- exact reason the runtime policy accepts or rejects legacy rows.

### Deliverables

- machine-readable provenance comparison report;
- human-readable cohort summary;
- explicit list of fields that distinguish `ready` from `review_required`;
- evidence-availability matrix;
- cohort proposal for the 2,323 candidates;
- recommendation stating whether Colab re-collection is required for any cohort;
- no mutation of current artifacts.

### Gate 432-A

Do not proceed to recovery until the report can answer:

- whether ready and blocked assets share the same collection and normalization path;
- which evidence is inherited versus independently proven;
- whether any current-ready assets have the same evidence gap as blocked candidates;
- what exact contract change would allow safe monthly inheritance.

## Phase 432-B — lineage-inheritance contract and checker

### Goal

Create a repository contract that makes direct-lineage approval durable across monthly releases and prevents mass re-review when nothing material changed.

### Required behaviors

- full-universe automated validation every release;
- no full-universe manual reapproval;
- automatic inheritance for unchanged approved contracts;
- fail-closed handling for new, changed, or failed identities;
- explicit exception inventory;
- previous-release delta report;
- coverage regression report;
- deterministic output and stale-result detection;
- no ticker-specific allowlist.

### Required tests

At minimum characterize:

- unchanged identity and contract inherits approval;
- one additional valid month inherits approval;
- a 59-month asset becoming 60 months is reevaluated deterministically;
- source change denies inheritance;
- collector or normalization incompatibility denies inheritance;
- identity change denies inheritance;
- proxy evidence denies inheritance;
- duplicate or missing normalized month denies inheritance;
- invalid Step 3 metrics or Beta remains blocked;
- review metadata alone cannot override missing source evidence;
- coverage decrease is visible and gated.

### Gate 432-B

The core-six recovery may not be accepted as durable unless the same contract can classify a later or simulated subsequent release without manual ticker edits.

## Phase 432-C — core-six evidence audit

### Goal

Audit the six high-impact identities as a vertical slice through the new evidence and inheritance model.

### Order

1. `KR:069500` — affects all 16 KR MBTI portfolios;
2. `US:VNQ` — affects one official portfolio and eight US MBTI portfolios;
3. `US:BLOK` — affects one official portfolio and six US MBTI portfolios;
4. `KR:273130`;
5. `KR:329200`;
6. `KR:305720`.

The audit order starts with `KR:069500` because #432 explicitly requires it, while implementation priority may consider the combined official/MBTI effect of `VNQ` and `BLOK`.

The six identities form three review-policy groups, not one approval cohort:

- initial calendar gap: `KR:069500`;
- MDD threshold: `US:VNQ`;
- 5Y/short history: `US:BLOK`, `KR:273130`, `KR:329200`, `KR:305720`.

They must be evaluated through generic policy contracts rather than a core-six allowlist.

### Audit result per identity

- `recoverable_without_recollection`;
- `requires_colab_evidence_reproduction`;
- `requires_identity_or_normalization_correction`;
- `requires_multiple_fixes`;
- `not_recoverable_under_current_direct-data policy`.

No identity becomes ready in this phase.

## Phase 432-D — core-six recovery pilot

### Goal

Apply the approved contract only to core-six identities that have complete direct evidence.

### Acceptance

- no hard-coded ticker bypass;
- no proxy substitution;
- no silent exclusion or weight renormalization;
- affected identities become ready through the same generic policy path used by future cohorts;
- unrelated blocked identities remain blocked;
- inventory and official/MBTI matrices regenerate deterministically;
- expected product coverage is verified rather than assumed;
- monthly inheritance test passes;
- Production remains a separate explicit approval.

## Phase 432-E — 2,323-candidate cohort expansion

### Goal

Expand from the validated pilot to all direct single-fix candidates without performing 2,323 unrelated manual approvals.

### Cohort dimensions

Candidates should be grouped by evidence, not ticker order. Candidate dimensions include:

- market;
- source/provider class;
- collector version;
- normalization version;
- row contract;
- asset/product type;
- distribution policy;
- review failure reason;
- evidence completeness;
- historical revision pattern;
- contiguous-history range.

### Expansion method

For each cohort:

1. prove common contract evidence;
2. run full identity-level reconciliation;
3. sample representative raw-to-monthly transformations;
4. separate exceptions before approval;
5. regenerate inventory and coverage;
6. document ready gain and residual blockers;
7. merge through a dedicated Draft PR and explicit approval gate.

The theoretical ready count after all 2,323 valid single-fix candidates is 3,661 of 6,029 (`60.72%`). This is a planning ceiling, not a guaranteed result; the forensic audit may reduce the valid candidate count.

## Phase 432-F — monthly operations gate

### Goal

Turn the initial remediation into a recurring release process.

Every monthly candidate release must produce:

- full catalog reconciliation;
- inherited approval count;
- new identity count;
- materially changed identity count;
- exception count and reasons;
- Step 4 and Step 5 ready ratios;
- official portfolio coverage;
- US/KR MBTI coverage;
- previous-release coverage delta;
- artifact manifest/index/shard/file reconciliation;
- candidate-versus-Production decision report.

Only exceptions require manual review. Existing unchanged approved identities do not.

## 7. Codex and Colab responsibility split

### Codex / repository work

Codex is responsible for:

- repository and artifact archaeology;
- 1,338-versus-2,323 comparison;
- policy-field and evidence mapping;
- deterministic reports and checkers;
- lineage-inheritance contract design and implementation;
- cohort construction;
- tests and release-delta gates;
- candidate artifact generation through established repository scripts;
- Git branch, commit, and Draft PR workflow.

### Colab work

Colab is used only when repository evidence is insufficient to prove direct source lineage or when a controlled raw-data reproduction is required.

Colab may:

- run the pinned collector code/ref;
- collect the specific audit scope or approved cohort;
- preserve raw response-derived data, runtime/audit outputs, and summaries outside Git;
- produce a reproducible evidence bundle and safe metadata receipt.

Colab may not:

- set review approval state;
- declare an asset Production-ready;
- edit Git `main` or `production`;
- bypass lineage policy;
- fabricate unavailable source evidence;
- overwrite the current pinned Production artifact.

The first #432 phase is Codex-only read-only forensics. Colab should not run until the repository audit identifies a concrete evidence gap and a bounded reproduction scope.

## 8. Pull-request decomposition

Use separate review boundaries:

1. **#432-A Draft PR — provenance forensics and contract proposal**  
   Reports, docs, and focused checker only. No runtime or artifact mutation.
2. **#432-B Draft PR — monthly lineage-inheritance contract**  
   Generic contract and tests. No Production promotion.
3. **#432-C Draft PR — core-six evidence audit**  
   Evidence results only; Colab receipts referenced safely when required.
4. **#432-D Draft PR — core-six recovery candidate**  
   Candidate artifact/policy changes through established pipeline; explicit data-release approval boundary.
5. **#432-E Draft PR series — cohort expansion**  
   One or more evidence-homogeneous cohorts per PR.
6. **#432-F Draft PR — monthly regression and inheritance gate**  
   Final recurring-operations enforcement.

Issue #432 should not be closed by the audit or first pilot PR. Close only when the approved scope, including durable inheritance, is complete or explicitly split into child issues.

## 9. Product and release gates

### Product Gate A — core portfolio restoration

Target:

- official portfolios: 10/10 ready;
- US MBTI: 16/16 ready;
- KR MBTI: 16/16 ready.

### Coverage Gate B — broad catalog improvement

Initial target:

- Step 4 ready ratio at least 60% if evidence validates the candidate ceiling;
- Step 5 ready ratio at least 60% if Beta and other requirements remain valid.

### Operations Gate C — no monthly mass regression

A new monthly release must not reset inherited valid assets to `review_required` merely because the file or release timestamp changed.

### Trust Gate D — fail closed on material change

Source, identity, proxy, collection, normalization, schema, or validation drift must block inheritance and enter review.

## 10. Protected scope

This plan does not authorize:

- ticker-specific allowlists;
- lineage bypasses;
- proxy enablement;
- automatic asset exclusion;
- weight renormalization;
- canonical/public CSV mutation outside an approved data-operation PR;
- manual Production artifact edits;
- direct `main` commits;
- Production ref movement;
- Vercel or Render deployment;
- DB, auth, payment, subscription, KIS, trading, or order changes.

Every artifact mutation, Production release, and deployment requires a separate explicit approval.

## 11. Immediate next action

Phase 432-A read-only provenance forensics is complete and documented. The next separately approved step is repository-only deterministic reporting and proposal work for the two contracts. Do not run Colab, change runtime/catalog state, regenerate artifacts, or begin recovery until that scope is explicitly approved.
