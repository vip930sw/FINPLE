# FINPLE Offline Data-Quality Gate Operational Readiness

## 1. Purpose And Non-Goals

This plan defines the operational readiness conditions for the offline data-quality gate introduced in Step231. It is a read-only planning surface for future standalone dry-run and non-blocking CI report evaluation.

This step does not enable blocking CI, server startup gates, runtime serving, model training, provider access, order submission, live trading, database writes, API routes, or UI exposure.

## 2. Step229 Through Step231 Relationship

Step229 builds a deterministic offline fixture profile from static synthetic Step192-compatible data.

Step230 aggregates multiple Step229 profiles into a batch summary with fixture counts, record counts, issue counts, fixture statuses, and an overall status.

Step231 evaluates a Step230 batch summary into an offline data-quality gate decision. Its only possible positive action is offline dataset promotion for a later offline validation step. It is not a model training, runtime, provider, order, or live trading authorization.

Step232 defines the operational conditions required before the Step231 gate can be considered ready for standalone dry-run or non-blocking CI report evaluation.

## 3. Operating Roles

The operating model uses role labels only. It does not require or store personal names, emails, account identifiers, or credential material.

Allowed owner role:

```text
data_quality_owner
```

Allowed reviewer roles:

```text
data_quality_reviewer
ml_validation_reviewer
release_audit_reviewer
```

Recommended separation of duties:

```text
ownerRole should not be the only reviewer role.
Approvers should be separate from dataset producers and dataset changers.
Blocked data-quality decisions cannot be overridden by any role.
```

## 4. Review Evidence

The required evidence catalog is fixed as:

```text
Step230 batch summary
Step231 gate decision
reason code review table
manual reviewer checklist
approval record template
rollback checklist
incident response checklist
```

The manual reviewer checklist must cover:

```text
why label imbalance is acceptable if present
whether metadata gaps are non-critical
source data period
split overlap absence
temporal leakage absence
sensitive payload absence
threshold type preservation
intended scope of the reviewed result
```

## 5. Pass Review Blocked Handling

`pass` can proceed to a future offline validation step without approval.

`review_required` requires explicit manual approval before offline dataset promotion can be considered for a future offline validation step.

`blocked` cannot be overridden by approval. The dataset must be corrected and reprofiled.

## 6. Approval TTL And Reapproval Triggers

The recommended approval TTL is:

```text
approvalTtlHours: 168
```

This is a seven-day operational review window. Step232 does not calculate current time, expiration, or persistence.

Reapproval is required regardless of TTL when any of the following changes:

```text
dataset content
profile schema
batch summary schema
gate policy version
reason code set
split or window policy
threshold policy
sensitive payload scan result
```

## 7. Blocked Override Prohibition

Blocked gate decisions cannot be overridden by any role, approval record, CI setting, runtime flag, or release process. A blocked result requires data or fixture correction followed by a new Step229 profile, Step230 summary, and Step231 gate decision.

## 8. Rollback And Incident Procedures

Rollback procedure requirements:

```text
identify the last accepted offline dataset revision label
remove the candidate from offline promotion consideration
rerun Step229 through Step231 checks
record the rollback reason code without raw dataset values
```

Incident procedure requirements:

```text
classify the failure as data quality, leakage, sensitive payload, threshold policy, or metadata process
stop further offline promotion of the affected candidate
preserve the redacted gate decision and reason codes
create a follow-up correction plan
```

## 9. Audit Record Minimum Schema

Future operational audit records should contain only redacted metadata:

```text
gateDecision
observedStatus
reasonCodes
approvalScope
approvedByRole
approvedAt
expiresAt
rationaleCode
policyVersion
sourceSummarySchemaVersion
datasetRevisionKey
```

Forbidden audit material:

```text
personal names
personal emails
account information
order information
provider payload
secret token credential material
raw record ID lists
hash digest fingerprint values
```

`datasetRevisionKey` is a non-sensitive internal revision label requirement, not a fingerprint implementation.

## 10. Standalone Dry-Run Readiness

Standalone dry-run readiness requires:

```text
owner role defined
at least one reviewer role defined
evidence policy version defined
blocked override disabled
approval record template available
rollback procedure defined
incident procedure defined
actual live trading readiness remains false
```

Allowed integration target:

```text
standaloneDryRun: true
```

All other targets remain false.

## 11. Non-Blocking CI Evaluation Readiness

Non-blocking CI report readiness requires all standalone dry-run conditions plus:

```text
Step230 batch summary evidence available
Step231 gate decision evidence available
reason code review table available
reviewer checklist available
approval record template available
rollback checklist available
incident response checklist available
immutable audit record required
approval TTL defined
```

Allowed integration targets:

```text
standaloneDryRun: true
nonBlockingCiReport: true
```

This is a reporting-only evaluation. It must not block merges.

## 12. Blocking CI Requires A Later Approval

Blocking CI integration requires a separate future step and explicit approval. This Step232 plan does not add GitHub Actions, CI artifacts, CI blocking conditions, or registry entries.

## 13. Separation From Model Runtime And Live Trading

The offline data-quality gate remains separate from:

```text
model training
runtime serving
provider or KIS access
order submission
live trading
database writes
public routes
admin UI exposure
```

Passing this readiness plan is not permission to perform any of those actions.

## 14. Future Step Entry Conditions

Before a future integration step, the repository must still show:

```text
Step223 through Step231 baselines unchanged
Step192 runtime unchanged
Step225 manifest unchanged
Step228 snapshot unchanged
Step229 profile schema unchanged
Step230 batch summary schema unchanged
Step231 gate schema unchanged
audit and runner counts unchanged
actual live trading readiness blocked
```
