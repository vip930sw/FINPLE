# FINPLE Step 4·5 Lineage Recovery — Codex and Colab Handoff

Date: 2026-08-04  
Parent program: #429  
Execution issue: #432  
Planning document: `docs/portfolio-analysis/FINPLE_STEP4_STEP5_LINEAGE_RECOVERY_PLAN_2026_08_04.md`  
Forensics findings: `docs/portfolio-analysis/FINPLE_STEP4_STEP5_LINEAGE_FORENSICS_FINDINGS_2026_08_04.md`
Expected main at handoff creation: `a193c13790b54bf265a4cc51f72d1adbcec3cadb`  
Expected production: `3b901468857fc3a659a0272061644ac25936c409`

## 1. Operating decision

Begin with Codex read-only provenance forensics. Do not begin by repairing six tickers, changing review flags, regenerating Production artifacts, or running Colab.

The initial task is to determine:

- why 1,338 assets satisfy the current pinned `legacy_v1` eligibility path;
- why 2,323 additional identities are classified as direct single-fix candidates;
- whether the two groups actually share the same collection and normalization path;
- which evidence is missing or differs;
- how approved lineage should be inherited by future monthly releases.

Colab is conditional. Use it only when Codex proves that repository and preserved artifact evidence is insufficient and identifies a bounded reproduction scope.

### Approved Phase 432-A findings

- The 1,338 ready identities and 2,323 direct candidates share one pinned candidate package and the same downstream normalization, calculation, exporter, monthly index/shards, and release.
- The repository does not prove that all identities came from one raw Colab collection execution.
- The direct-candidate discriminator is the frozen `dataStatus / metricsStatus / reviewFlag` tuple: 1,329 are `ready / ready / review_required`, 986 are `short_history / short_history / short_history`, and 8 are `review_required / review_required / review_required`.
- `Direct single-fix candidate` is not provenance approval. It means the catalog review gate is the effective blocker in the current eligibility graph.
- The 1,338 ready identities also use `legacy_v1` rows without explicit row-level `isProxy=false` or repository-preserved per-identity collector/run receipts. They are allowed by the exact pinned legacy binding and frozen `ready / ready / none` catalog fields.
- The existing 6,000 cohort contributes 1,338 ready and 2,321 direct candidates. The separate 29-US-delta cohort contributes no ready identities and two direct candidates, `US:QYLG` and `US:XYLG`; the other 27 lack 60 contiguous months.
- Core-six review groups are initial gap (`KR:069500`), MDD threshold (`US:VNQ`), and 5Y/short history (`US:BLOK`, `KR:273130`, `KR:329200`, `KR:305720`). They cannot use one approval rule.
- Future design must separate a monthly lineage-inheritance contract from a generic review-policy decision contract.
- The next step remains repository-only. Colab requires a separate bounded approval after preserved external evidence is exhausted.

## 2. Codex prompt — Phase 432-A read-only provenance forensics

Paste the following into a new Codex thread.

```text
FINPLE Step 4/5 Phase 0C의 첫 작업으로 read-only provenance forensics를 수행합니다.

Repository:
vip930sw/FINPLE

Parent program:
#429 Step 4/5 trust and availability program

Execution issue:
#432 P0C: Normalize direct monthly-data lineage for high-impact assets

Completed dependency:
- Issue #430 completed
- PR #439 merged
- Expected main: a193c13790b54bf265a4cc51f72d1adbcec3cadb
- Expected production: 3b901468857fc3a659a0272061644ac25936c409

Required reading:
- docs/portfolio-analysis/FINPLE_STEP4_STEP5_TRUST_AVAILABILITY_ROADMAP_2026_08_04.md
- docs/portfolio-analysis/FINPLE_STEP4_STEP5_ELIGIBILITY_COVERAGE_SPEC_2026_08_04.md
- docs/portfolio-analysis/FINPLE_STEP4_STEP5_LINEAGE_RECOVERY_PLAN_2026_08_04.md
- docs/handoffs/FINPLE_STEP4_STEP5_LINEAGE_RECOVERY_CODEX_COLAB_HANDOFF_2026_08_04.md
- reports/portfolio-analysis/step4-step5-eligibility-summary.md
- reports/portfolio-analysis/step4-step5-eligibility-inventory.json

This response is investigation only.
Do not create a branch, edit files, change catalog/review/lineage state, run provider collection, regenerate artifacts, deploy, or move main/production.

Primary question:
Explain why 1,338 identities are currently Step 4/5 numeric-ready while 2,323 additional identities are classified as direct single-fix lineage/review candidates.
Do not assume they used the same Colab/source/normalization path. Prove or disprove that hypothesis from repository and preserved artifact evidence.

Before analysis, report:
1. local main SHA
2. origin/main SHA
3. GitHub main SHA
4. GitHub production SHA
5. working tree state
6. repo-local AGENTS.md and policy files
7. duplicate open issue/PR/branch for this scope
8. exact pinned release, source manifest, metrics overlay, monthly index, shards, and inventory paths
9. exact current lineage-policy and catalog-policy functions
10. relevant Colab notebooks, collector scripts, combine/export scripts, manifests, receipts, audit outputs, and runbooks

Investigate the full path:
provider/raw collection
→ raw daily outputs
→ metrics and monthly-return normalization
→ candidate package
→ app export
→ metrics overlay/monthly index/shards
→ source review manifest
→ Production release manifest
→ catalog policy by identity
→ monthly lineage policy
→ Step 4/5 eligibility inventory

For the 1,338 ready group and 2,323 direct single-fix group, compare where evidence exists:
- market
- asset/product type
- source/provider class
- collector code ref/SHA
- collection date or run identity
- raw evidence path
- normalization script/ref/version
- candidate source row
- runtime catalog row
- dataStatus
- metricsStatus
- reviewFlag/reviewTag
- reviewApprovalStatus
- review policy/version fields
- monthly row contract
- monthly identity presence
- row-level proxy fields or legacy-unproven state
- contiguous history
- Step 3 validity
- Beta validity
- distribution classification
- pinned binding and release evidence
- exact policy branch that accepts or rejects the identity

Required special audits:
- US:VNQ
- US:BLOK
- KR:069500
- KR:273130
- KR:329200
- KR:305720

Also select representative samples from:
- current-ready KR assets
- current-ready US assets
- direct single-fix KR candidates
- direct single-fix US candidates
- candidates with the same apparent source/normalization cohort but different policy result

Required conclusions:
1. Are the 1,338 and 2,323 groups generated through the same source and normalization path?
2. If partly, identify exact cohorts and exceptions.
3. Which exact fields or evidence distinguish ready from review_required?
4. Is the current 2,323 count still valid after provenance inspection?
5. Do any of the 1,338 ready assets have the same unresolved evidence gap?
6. Which candidates can be repaired without Colab recollection?
7. Which candidates require bounded Colab evidence reproduction?
8. What stable contract should monthly lineage approval attach to?
9. What invariants should allow automatic inheritance on the next monthly release?
10. What changes must fail closed and enter manual review?

Propose, but do not create, deterministic outputs for a later approved implementation:
- machine-readable 1,338-versus-2,323 provenance comparison
- human-readable cohort summary
- evidence-availability matrix
- core-six audit report
- monthly lineage-inheritance contract/spec
- previous-release delta checker
- exception queue report

Use repository facts and identify uncertainty explicitly.
Do not infer source lineage from ticker names, asset ordering, or the mere existence of monthly rows.
Do not expose secrets, raw local paths, credentials, user data, or approval identities beyond what is already safe and committed.

At the end, recommend exactly one next action:
A. repository-only audit implementation;
B. bounded Colab evidence reproduction for named identities/cohort;
C. contract design first because current evidence is insufficient;
D. stop because the current ready set itself is not adequately supported.

Return the read-only investigation report only. Do not edit yet.
```

## 3. Codex prompt — approved Phase 432-A implementation

Use only after the read-only response is reviewed and explicitly approved.

```text
The Phase 432-A read-only provenance investigation is approved.
Implement only the approved forensics/report/checker scope on a dedicated branch.

Repository:
vip930sw/FINPLE

Issue:
#432

Expected starting main:
<INSERT VERIFIED MAIN SHA>

Recommended branch:
codex/p0c-lineage-provenance-forensics

Required outputs:
- deterministic machine-readable comparison of the 1,338 current-ready identities and the validated direct single-fix candidate set
- human-readable cohort and evidence summary
- core-six evidence audit
- explicit ready-versus-review_required discriminator report
- proposed monthly lineage-inheritance contract
- proposed generic review-policy decision contract for thresholds, 5Y history, initial gaps, and split evidence
- focused checker that fails on unreconciled counts, duplicate identities, unknown evidence states, or stale report output

Do not describe the 2,323 candidates as provenance-approved. Keep lineage inheritance and review-policy decisions as separate outputs and separate acceptance gates.

This PR is read-only forensics and contract documentation.
Do not change:
- runtime eligibility behavior
- catalog review or approval values
- canonical/public CSV
- pinned release/index/shards/pointer
- monthly returns
- Step 3/4/5 calculations
- official/MBTI definitions
- DB/auth/payment/trading
- Vercel/Render
- main or production

Do not run Colab unless the approved investigation explicitly requires a bounded evidence reproduction. If Colab is required, stop before running it and provide the exact scope and prompt.

Delivery:
- commit and normal push
- Draft PR
- `Refs #432`, not `Closes #432`
- no Ready transition
- no merge
- no deploy
- no Production movement

PR body must include:
- starting/completed SHA
- exact evidence inputs
- group counts and reconciliation
- discovered cohorts
- unresolved evidence gaps
- whether Colab is required
- proposed inheritance invariants
- tests
- protected-scope diff proof
```

## 4. Conditional Colab prompt — bounded evidence reproduction

Do not use this prompt unless Codex has identified exact identities or an evidence-homogeneous cohort whose repository evidence is insufficient.

Replace all placeholders with the approved scope.

```text
FINPLE Step 4/5 lineage evidence reproduction을 위한 제한된 Colab 작업입니다.

Purpose:
Reproduce direct raw-price and normalization evidence for the explicitly approved audit scope only.
This is not a Production collection run and does not approve any asset.

Repository:
https://github.com/vip930sw/FINPLE.git

Pinned repository ref:
<APPROVED IMMUTABLE COMMIT SHA OR TAG>

Approved identities/cohort:
<EXACT MARKET:TICKER LIST OR COHORT MANIFEST>

Approved collector module/notebook:
<EXACT REPOSITORY PATH>

Approved collection parameters:
- data through/as-of: <VALUE>
- history years: <VALUE>
- partial final month policy: <VALUE>
- provider/source class: <VALUE>
- output root: a new empty Google Drive directory outside Git

Before provider calls:
1. clone the repository into a clean Colab path
2. checkout the exact pinned ref in detached HEAD
3. print resolved HEAD
4. prove the worktree is clean
5. verify the exact collector and normalization modules exist
6. print CLI/help and required options
7. stop if any ref, file, option, or scope differs

Run only the approved identities/cohort.
Do not silently broaden to the full universe.
Do not substitute proxy tickers.
Do not change identity mapping manually.
Do not overwrite prior outputs.
Do not write credentials, tokens, or raw local paths into Git or public logs.

Required external outputs:
- raw daily data for each approved identity
- runtime metrics/monthly output
- per-identity audit output
- run summary
- source/provider class
- collector commit SHA
- normalization module/version
- collection timestamps
- exact requested and resolved identities
- direct/non-proxy evidence available from the provider/result
- failures and reason codes
- complete file inventory with size and SHA-256

Determinism:
Where the approved collector supports it, perform isolated Run A and Run B generation from the same preserved raw inputs and compare normalized outputs byte-for-byte or field-for-field.
Provider responses themselves are time-dependent; do not claim two provider calls are byte-identical unless they actually are.

At completion:
- do not edit Git
- do not set review flags
- do not create a Production release manifest
- do not deploy
- report the external evidence-bundle location privately to the operator
- provide only safe summary counts, hashes, and failure reasons for the Codex follow-up
```

## 5. Codex prompt — core-six recovery pilot

Use only after:

- Phase 432-A forensics is merged;
- the lineage-inheritance contract is approved;
- core-six audit evidence is complete;
- any required Colab reproduction is reviewed.

```text
Implement the approved #432 core-six direct-lineage recovery pilot through the generic lineage-inheritance contract.

Approved identities:
- KR:069500
- US:VNQ
- US:BLOK
- KR:273130
- KR:329200
- KR:305720

Repository:
vip930sw/FINPLE

Expected starting main:
<INSERT VERIFIED MAIN SHA>

Required reading:
- docs/portfolio-analysis/FINPLE_STEP4_STEP5_LINEAGE_RECOVERY_PLAN_2026_08_04.md
- merged Phase 432-A provenance report
- approved lineage-inheritance contract
- approved core-six evidence audit

Before editing, report:
- local/origin/GitHub main and GitHub production SHA
- clean worktree and policy files
- exact approved evidence reference for each identity
- exact generic code/artifact paths to change
- expected inventory and portfolio-coverage change
- expected Production diff: zero until separate approval

Implementation rules:
- no ticker-specific condition or allowlist
- no lineage bypass
- no proxy substitution
- no silent exclusion or weight renormalization
- no fabricated source fields
- no manual edit of pinned Production bytes
- use the established artifact pipeline and complete binding/reconciliation gates
- implement monthly approval inheritance and exception handling as approved

Acceptance:
- only identities with complete approved direct evidence become ready
- unrelated expected_blocked identities remain blocked
- official and US/KR MBTI matrices regenerate
- inventory count remains exactly 6,029
- index/shards/manifest/file inventory reconcile
- next-release inheritance tests pass
- source/identity/proxy/normalization drift fails closed

Delivery:
- dedicated branch
- commit and normal push
- Draft PR
- `Refs #432`
- do not close #432 unless the entire approved scope is complete
- no Ready, merge, deploy, or Production movement without separate approval
```

## 6. 2,323-candidate cohort expansion prompt template

Use one evidence-homogeneous cohort per PR or reviewable PR series.

```text
Expand #432 direct-lineage recovery to the approved cohort only.

Cohort manifest:
<PATH OR IMMUTABLE HASH>

Cohort definition:
- market: <VALUE>
- source/provider class: <VALUE>
- collector version: <VALUE>
- normalization version: <VALUE>
- row contract: <VALUE>
- asset/product type: <VALUE>
- review failure reason: <VALUE>
- evidence status: <VALUE>

Expected identities:
<COUNT AND MANIFEST>

Requirements:
- prove every identity belongs to the cohort
- run full identity-level reconciliation
- separate exceptions before approval
- use the same generic inheritance contract as the core-six pilot
- regenerate inventory and coverage reports
- report ready gain and remaining blockers
- keep all out-of-cohort identities unchanged
- no proxy, bypass, auto-exclusion, or renormalization
- Draft PR only; no merge/deploy/Production movement
```

## 7. Approval boundaries

The handoff authorizes only the initial Codex read-only investigation.

Separate explicit approval is required for:

- creating implementation branches;
- running Colab provider collection;
- changing catalog or lineage policy;
- regenerating runtime or pinned artifacts;
- merging any PR;
- moving Production;
- deploying Vercel or Render.
