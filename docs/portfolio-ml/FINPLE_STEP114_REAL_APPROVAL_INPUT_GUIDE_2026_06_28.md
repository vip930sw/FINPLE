# FINPLE Step 114 Real Approval Input Guide

Date: 2026-06-28

This guide explains how a real FINPLE owner/legal/source reviewer should approve the Step 114 P0 scenario-data source policy. It does not approve anything by itself. It records the minimum evidence required before provider adapters, provider calls, monthly cache writes, Bootstrap, or runtime scenario implementation can be unlocked.

## Current Status

The current committed state is intentionally blocked:

```text
providerGroups=5
sourcePolicyRows=17
approvalIntakeReadyRows=0
ownerLegalApproved=0
externalTermsApproved=0
providerCallsAllowed=false
safeToImplementProviderAdapter=false
safeToWriteMonthlyData=false
scenario_monthly_returns.csv absent
bootstrapStillBlocked=true
```

Do not create `data/processed/scenario_monthly_returns.csv` until the approval import and post-import gates are green.

## Who Must Approve

At least these roles must be represented with real identities:

- Source reviewer: confirms selected provider, endpoint, source scope, and data refresh policy.
- Owner decision maker: confirms FINPLE product/business approval for production use.
- Legal reviewer: confirms commercial use, raw payload handling, redistribution, cache retention, attribution, and display-label policy.

Reviewer identity fields must be real email addresses. Generic placeholders such as `approved`, `ok`, `TBD`, or `owner@example.com` are not approval evidence.

## Approval Input File

Use this template as the reviewer-facing approval input:

```text
data/processed/scenario_p0_approval_intake_template.csv
```

It has one row per P0 provider group:

```text
KOSPI200_TR_primary_or_kospi200_etf_proxy
KR_price_total_return_dividend_provider
SP500_TR_primary_or_SPY_adjusted_close_proxy
US_price_total_return_dividend_provider
USD_KRW_fx_provider
```

The template is generated with blank approval fields. Real approval must be entered deliberately in a review branch or controlled approval commit, not silently inferred by scripts.

## Required Fields

For each of the five provider-group rows, fill all of these fields:

```text
approvalStatusDraft
selectedProvider
selectedEndpoint
licenseDecision
rawPayloadPolicy
redistributionDecision
reviewOwner
decisionOwner
legalReviewer
reviewedAt
evidenceUrl
approvalEvidence
```

The current validator requires:

```text
approvalStatusDraft=ready_for_source_policy_review
licenseDecision=approved_internal_monthly_derived_return_cache
rawPayloadPolicy=approved_hash_or_raw_retention_policy
redistributionDecision=approved_no_raw_redistribution_monthly_derived_only
selectedEndpoint=https://...
reviewOwner=<real email>
decisionOwner=<real email>
legalReviewer=<real email>
reviewedAt=YYYY-MM-DDTHH:mm:ssZ
evidenceUrl=https://...
```

`approvalEvidence` should summarize the concrete reviewed evidence, such as provider docs, terms page, internal approval ticket, cache-retention decision, attribution decision, and proxy-label policy if applicable.

## Evidence Requirements

Each row should have evidence that answers the row's review questions:

- Commercial use: whether FINPLE may use the provider/source in production analytics.
- Redistribution: whether FINPLE may store and serve derived monthly returns without redistributing raw data.
- Raw payload: whether raw responses are discarded, hash-only, or retained under a reviewed policy.
- Cache policy: what retention period is allowed for derived monthly return cache.
- Attribution: what provider/source citation is required.
- Display label: whether proxy or adjusted-close derived series need explicit labeling.

For benchmark/proxy rows, evidence must also cover proxy limitations and benchmark calendar/currency alignment.

## Safe Approval Sequence

1. Create a review branch from current `main`.
2. Fill all five rows in `data/processed/scenario_p0_approval_intake_template.csv` with real reviewer inputs.
3. Run:

```text
npm.cmd run check:scenario-p0-approval-validation
npm.cmd run check:scenario-p0-source-policy-sync
npm.cmd run check:scenario-p0-source-policy-sync-preflight
npm.cmd run check:scenario-p0-real-approval-import-preflight
```

4. If `scenario_p0_real_approval_import_preflight.json` reports `readyForRealApprovalImport=true`, manually import approved source-policy decisions in a separate, reviewed commit.
5. Regenerate and check the post-import gates:

```text
npm.cmd run check:scenario-p0-source-policy-post-import-preflight
npm.cmd run check:scenario-p0-approval-readiness
npm.cmd run check:scenario-monthly-write-preflight
```

6. Only after those gates are green may provider adapter review and monthly-cache writer review begin. Provider calls and `scenario_monthly_returns.csv` are still not allowed before those later gates explicitly open.

## Stop Conditions

Stop and do not import approval rows if any of these are true:

- Any row is still `pending_review` or `rejected`.
- Any required reviewer field is blank.
- Any reviewer identity is not a real email address.
- `selectedEndpoint` or `evidenceUrl` is not HTTPS.
- Any decision value differs from the approved tokens above.
- Evidence does not cover legal/commercial use, redistribution, raw payload, cache retention, attribution, and display labeling.
- `scenario_monthly_returns.csv` exists before approval import and post-import gates complete.

## What Approval Does Not Do

Approval does not automatically:

- implement a provider adapter,
- call a provider,
- write `scenario_monthly_returns.csv`,
- unlock Bootstrap,
- unlock Scenario API, Compare chart, or `calculatePortfolioResult()`.

Those remain blocked until their own preflight gates pass after real approval import.
