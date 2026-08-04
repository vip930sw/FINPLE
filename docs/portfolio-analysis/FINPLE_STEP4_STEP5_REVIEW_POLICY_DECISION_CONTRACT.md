# FINPLE Step 4/5 Generic Review-Policy Decision Contract

Status: proposal only
Issue: #432
Scope: deterministic review design; no approval or runtime mutation

## 1. Decision boundary

A threshold is a review trigger, not proof of an error. This contract decides whether a numerically available series may complete a generic review. It does not establish source lineage, inherit monthly lineage, or correct an underlying metric.

Lineage and review decisions must remain separate. Passing this contract cannot compensate for missing direct-source evidence, and passing lineage inheritance cannot bypass a required numeric review.

## 2. Review dimensions

The policy must support versioned, generic decisions for:

- CAGR threshold;
- MDD threshold;
- Beta threshold;
- dividend threshold;
- 5Y metric review;
- initial calendar gap;
- split evidence;
- multiple simultaneous thresholds;
- asset-type interpretation differences supported by generic policy.

Ticker-specific exceptions are prohibited. Asset type may select a documented generic rule only when the rule and evidence apply to every asset in that class.

## 3. Deterministic evidence

A completed review must record:

- canonical identity and asset type;
- review trigger codes and observed values;
- calculation, normalization, benchmark, and review-policy version;
- evidence inputs used by the generic rule;
- decision: `approved_without_data_change`, `data_correction_required`, or `held`;
- deterministic reason codes;
- whether multiple triggers were evaluated together;
- prior review result and compatibility decision for later releases.

Approval and data correction are different operations. `approved_without_data_change` requires evidence that the observed value is valid under the policy. `data_correction_required` must enter the established normalization and calculation pipeline, regenerate candidate outputs, and rerun binding and reconciliation gates. A review flag must never conceal a metric correction.

## 4. Generic policy requirements

### CAGR, MDD, Beta, and dividend thresholds

Each threshold defines a review range, evidence requirements, and allowed decision outcomes. A value outside the automatic range may be valid. The review must distinguish a valid extreme observation from an identity, benchmark, adjustment, normalization, or calculation error.

### 5Y metric review

`short_history` used by the metrics catalog means a 10-year metric window is unavailable or a shorter metric policy was selected. It is not identical to the Step 4/5 60-month monthly-history floor. An asset may have at least 60 contiguous months and still require a 5Y metric review.

The generic policy must define minimum observations, valid rolling-window count, benchmark availability, asset-type applicability, and the evidence needed to accept a 5Y result without changing data.

### Initial calendar gap

A generic initial-gap policy may accept preserved observed rows only when it proves that no forward fill was used, no monthly return crosses the gap, the contiguous post-gap segment satisfies downstream requirements, and the gap is represented deterministically. It must not be written for one ticker.

### Split evidence and multiple triggers

When evidence is split across sources or more than one threshold fires, the result remains `held` unless one versioned policy evaluates the complete evidence set. Independent approvals must not be combined implicitly.

## 5. Monthly inheritance of review results

A prior review result may carry forward only when:

- review-policy version is unchanged or explicitly compatible;
- identity, asset type, benchmark, normalization, and calculation contracts remain compatible;
- the trigger category and relevant evidence have not materially changed;
- no data correction or unexplained historical revision occurred;
- the monthly lineage-inheritance contract passes independently.

A new trigger, changed threshold, changed material value, incompatible policy version, or correction invalidates inheritance and queues review. A release timestamp change alone does not.

## 6. Current cohort interpretation

The 2,323 direct candidates are not automatically approved by this proposal. Their current catalog review fields are the effective eligibility blocker, but they span at least initial-gap, MDD, 5Y/short-history, and other review classes. The core six therefore require three policy groups rather than one exception list.

The 1,338 current-ready identities have no separate approval status or review-policy version and retain `legacy_v1` lineage evidence gaps. Their current state is a characterization baseline, not a reusable modern review receipt.

## 7. Fail-closed rules

Unknown trigger, unknown evidence, missing policy version, ticker-specific bypass, conflicting decisions, unreviewed data correction, missing lineage result, or unsupported asset-type interpretation produces `held`. The implementation must not auto-exclude assets, renormalize weights, substitute proxies, or change review flags from this proposal alone.
