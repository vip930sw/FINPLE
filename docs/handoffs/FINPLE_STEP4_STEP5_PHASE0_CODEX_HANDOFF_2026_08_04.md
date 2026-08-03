# FINPLE Step 4·5 Phase 0 Codex Handoff

Date: 2026-08-04  
Parent program: #429  
First execution issue: #430  
Later blocked issues: #431, #432  
Phase 1 issue: #433  
Proxy decision: deferred

## 1. Handoff objective

Start with a read-only Step 4·5 eligibility and coverage inventory. Do not begin UI, direct-lineage remediation, shock-timing, simulation-convergence, block-sensitivity, or proxy implementation until the inventory is reviewed.

The inventory must distinguish:

- numeric analysis available (`ready`);
- correct fail-closed behavior (`expected_blocked`);
- remediation class and product impact.

## 2. Repository baseline

Repository:

```text
vip930sw/FINPLE
```

Preparation baseline at document creation:

```text
main = 3b901468857fc3a659a0272061644ac25936c409
production = 3b901468857fc3a659a0272061644ac25936c409
```

These values are informational. Codex must re-fetch local, origin, and GitHub refs immediately before work and stop on drift or an unclean tree.

Suggested implementation branch after the documentation PR is reviewed and merged:

```text
codex/p-1-step4-step5-eligibility-coverage
```

Do not reuse the documentation branch for implementation.

## 3. Required reading

```text
docs/portfolio-analysis/FINPLE_STEP4_STEP5_TRUST_AVAILABILITY_ROADMAP_2026_08_04.md
docs/portfolio-analysis/FINPLE_STEP4_STEP5_ELIGIBILITY_COVERAGE_SPEC_2026_08_04.md
```

Also inspect current implementations and tests for:

```text
src/components/portfolio/utils/appPreviewScenarioService.js
src/components/portfolio/utils/monthlyScenarioLineagePolicy.js
src/components/portfolio/utils/step5ProductionScenarioService.js
src/components/portfolio/utils/probabilityScenarioAdapter.js
src/components/portfolio/utils/externalShockScenarioAdapter.js
src/data/tickers/productionAppExportDataSource.js
src/data/tickers/screenerCandidateLoader.js
src/components/portfolio/constants.js
src/components/InvestmentMbtiPage.jsx
src/components/portfolio/utils/mbtiProfileStorage.js
scripts/check-official-portfolio-step4-step5.test.mjs
scripts/check-p3-step4-monthly-artifact.test.mjs
server/src/services/scenario/probabilisticBootstrapEngine.js
server/src/services/scenario/externalShockEngine.js
```

Search for repository-local policies, AGENTS files, existing generated-report conventions, and duplicate issues/PRs before coding.

## 4. First-response inventory

Before editing, report:

1. local main SHA;
2. origin/main SHA;
3. GitHub main SHA;
4. GitHub production SHA;
5. working-tree state;
6. AGENTS/policy files;
7. duplicate open issue/PR/branch check;
8. exact runtime catalog path and count;
9. exact pinned monthly release/index/shard paths and binding fields;
10. current Step 4/5 lineage and Beta gates;
11. official preset source;
12. US/KR MBTI source and counts;
13. whether a canonical popularity/high-use source exists;
14. whether a privacy-safe saved-portfolio aggregate exists;
15. proposed report and checker paths;
16. proposed primary-state precedence;
17. expected runtime/data diff: zero.

Do not edit before this report is accepted.

## 5. Fixed P-1 implementation scope

### 5.1 Pure classifier

Prefer one pure classifier that consumes already-loaded catalog/monthly policy evidence and returns:

```text
primaryEligibilityState
secondaryFlags
step3State
step4State
step5State
userSafeReasonCategory
recommendedRemediationClass
```

Reuse existing canonical validators where possible. Do not duplicate a divergent lineage policy.

### 5.2 Full catalog inventory

Evaluate each of the 6,029 runtime identities once. Load monthly shards through repository-local artifact paths or established lazy loaders without external network/provider calls.

Keep memory/runtime bounded. If all shards cannot be loaded safely in one process, stream or batch deterministically and prove complete reconciliation.

### 5.3 Product cohorts

Build official preset and US/KR MBTI matrices from the runtime source definitions, not copied lists.

For popularity/high-use coverage:

- use an existing canonical source only;
- otherwise return `unavailable_no_canonical_source`.

For saved portfolios:

- use a pre-existing privacy-safe aggregate only;
- otherwise return `not available`;
- never query or publish individual user holdings.

### 5.4 Reports

Use non-runtime paths. Recommended:

```text
reports/portfolio-analysis/step4-step5-eligibility-inventory.json
reports/portfolio-analysis/step4-step5-eligibility-summary.md
```

If generated reports are too large for normal review, propose a compact machine-readable summary plus a CI artifact. Do not silently omit asset-level reconciliation.

### 5.5 Checker

Add:

```text
check:step4-step5-eligibility-coverage
```

It must verify exact counts, unique identities, taxonomy, deterministic order, cohort completeness, state reconciliation, blocked-weight ranges, and safe report fields.

## 6. Required current-state characterizations

At minimum characterize current pinned behavior for:

```text
KR:069500
US:VNQ
US:BLOK
```

For each, report:

- monthly identity present;
- available/contiguous history;
- proxy/legacy/review evidence;
- Beta validity;
- Step 3/4/5 state;
- user-safe reason;
- remediation class;
- official/MBTI impact.

Do not assume these are the only blocked identities.

## 7. Coverage report interpretation

The final report must not say “Step 4/5 matrix passed” without separating:

```text
ready
expected_blocked
```

Required headline measures:

- all-catalog Step 4 ready ratio;
- all-catalog Step 5 ready ratio;
- official preset ready ratio;
- US MBTI ready ratio;
- KR MBTI ready ratio;
- blocked target-weight distribution;
- high-use ready ratio, if supported;
- direct-lineage-repairable blocked ratio.

## 8. Protected scope

Do not change:

- runtime canonical/public CSV;
- pinned monthly artifact bytes, release manifest, index, shards, or pointer;
- Step 3 valuation/CAGR/dividend/MDD calculation;
- Step 4 bootstrap semantics, simulation count, block months, seed, percentile set, MDD, recovery, or shortfall calculation;
- Step 5 shock factors, M12 timing, Beta shock math, path replay, valuation, MDD, or recovery;
- MBTI definitions or canonical hydration;
- plan pricing/entitlements;
- DB schema/data;
- auth/payment/subscription/MY PAGE;
- KIS/provider/trading/order controls;
- Vercel/Render configuration;
- `main`, `production`, aliases, domains, or environments.

No proxy, bypass, auto-exclusion, or auto-renormalization.

## 9. Validation

Minimum expected checks, adjusted only to repository reality:

```powershell
npm.cmd run check:official-portfolio-step4-step5
npm.cmd run check:official-portfolio-baseline
npm.cmd run check:p4-investment-mbti-canonical-apply
npm.cmd run check:p3-step4-monthly-artifact
node --test src/components/portfolio/utils/step5ProductionScenarioService.test.js
node --test src/components/portfolio/utils/externalShockScenarioAdapter.test.js
node --test server/src/services/scenario/probabilisticBootstrapEngine.test.js
node --test server/src/services/scenario/externalShockEngine.test.js
npm.cmd run check:ai-production
git diff --check
git diff --cached --check
```

Add and run the new focused coverage checker. A full repository test timeout without failures may be reported but does not replace focused checks.

## 10. Delivery contract

For #430:

1. create the dedicated implementation branch from latest verified main;
2. implement read-only inventory/checker/reports only;
3. commit and normal push;
4. open a Draft PR;
5. include `Closes #430 when merged`;
6. keep Draft;
7. do not merge;
8. do not mark Ready;
9. do not deploy;
10. do not modify Production.

PR body must include:

- starting and ending SHA;
- exact input bindings;
- changed files;
- taxonomy and precedence;
- all 6,029 reconciliation;
- overall/market/official/MBTI coverage;
- popularity/saved aggregate availability;
- `KR:069500`, `US:VNQ`, `US:BLOK` audit;
- remediation ranking;
- tests;
- protected-scope diff proof;
- limitations;
- explicit statement that no UI/data/runtime/Production behavior changed.

## 11. Follow-up boundaries

After #430 is reviewed:

- #431 may implement disclosure, pre-add support visibility, and tooltips using the approved classifier;
- #432 may audit and repair direct-data lineage candidates;
- #433 remains blocked until Phase 0 decisions;
- proxy implementation remains deferred and is not an authorized Codex task.

## 12. Codex chat starter

Paste the following into a new Codex thread after the documentation PR is reviewed and merged:

```text
FINPLE Step 4/5 Phase 0 P-1 eligibility and coverage inventory를 시작합니다.

Repository:
vip930sw/FINPLE

Issue:
#430 P-1: Inventory Step 4/5 eligibility and coverage across 6,029 assets

Parent:
#429 Step 4/5 trust and availability program

Required reading:
- docs/portfolio-analysis/FINPLE_STEP4_STEP5_TRUST_AVAILABILITY_ROADMAP_2026_08_04.md
- docs/portfolio-analysis/FINPLE_STEP4_STEP5_ELIGIBILITY_COVERAGE_SPEC_2026_08_04.md
- docs/handoffs/FINPLE_STEP4_STEP5_PHASE0_CODEX_HANDOFF_2026_08_04.md

This task is read-only inventory/report/checker work. Do not change UI, runtime eligibility, canonical/public CSV, pinned monthly artifacts, plan pricing, DB/auth/payment/trading, Vercel/Render, main, or production.

Before editing, report:
1. local/origin/GitHub main and GitHub production SHA
2. working tree and AGENTS/policy files
3. duplicate issue/PR/branch
4. exact runtime catalog and pinned monthly artifact inputs
5. current Step 4/5 lineage and Beta gates
6. official and MBTI source definitions
7. canonical popularity source availability
8. privacy-safe saved-portfolio aggregate availability
9. proposed taxonomy precedence
10. proposed checker/report paths
11. expected runtime/data diff zero

Do not edit before this inventory response is reviewed.

After approval, create branch:
codex/p-1-step4-step5-eligibility-coverage

Required result:
- all 6,029 identities classified and reconciled
- ready and expected_blocked separated
- overall/by-market/official/US-MBTI/KR-MBTI coverage
- blocked target-weight share
- high-use and saved coverage only if canonical/privacy-safe sources exist
- explicit audit of KR:069500, US:VNQ, US:BLOK
- deterministic machine-readable inventory and Markdown summary
- focused check:step4-step5-eligibility-coverage

Delivery:
commit, normal push, Draft PR, Closes #430 when merged.
Do not mark Ready, merge, deploy, or move Production.
```
