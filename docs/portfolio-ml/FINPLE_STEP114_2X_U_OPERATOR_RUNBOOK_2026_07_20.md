# Step 114-2X-U operator runbook

## Purpose

This runbook prepares a sanitized ceremony packet for review. It must not be used to invoke the Step T runner. Merge, CI success, a ready ceremony result, or a complete checklist never supplies approval for the later external execution.

## Required operator confirmations

The operator checklist is complete only when all of the following are explicitly confirmed true:

- the target is disposable, isolated, and non-production;
- the observation is read-only;
- destination count is exactly one;
- observation count is exactly one;
- the Step S effective expiry has not passed;
- the execution confirmation is unused;
- the operator authorization is unused;
- the invocation is unused;
- the execution lease request is unused;
- the claim request is unused;
- runner artifact bytes are available for later in-memory digest verification;
- adapter artifact bytes are available for later in-memory digest verification;
- automatic retry is disabled;
- fallback is disabled;
- the kill switch is available;
- the kill switch is initially safe;
- the sanitized receipt store is available;
- the sanitized evidence store is available;
- disposal coordination is available;
- lease terminalization is available;
- provider mutation authority is absent;
- production mutation authority is absent;
- external approval has not been inferred from merge or CI.

These two fields must remain false:

- `externalExecutionApproved`
- `mergeOrCiImpliesExternalApproval`

Any missing, false-required, true-forbidden, extra, or malformed checklist field blocks the ceremony.

## Runtime-material review order

1. Confirm the packet binds merged main `beb440556d4946008bf33e91f1dc3621c7d599e6`.
2. Revalidate the complete Step S package through the exposed Step T validator.
3. Revalidate the exact Step T contract and all ten capability descriptors.
4. Confirm the evaluation clock is canonical and strictly before the Step S effective expiry.
5. Confirm the ceremony nonce is new against a canonical sorted replay context.
6. Confirm destination and observation counts are each one.
7. Confirm the Step S/T-bound confirmation, authorization, invocation, and claim identities match exactly.
8. Confirm lease and claim request IDs are distinct and unused.
9. Confirm every operation ID and idempotency key is present, valid, and unique.
10. Confirm artifact, kill-switch, store, disposal, and terminalization availability booleans.
11. Confirm every mutation, retry, fallback, trigger, route, cron, worker, deployment, and execution authority field remains false.
12. Review the sanitized evidence-handoff manifest and verify no raw runtime material is present.

## Fail-closed handoff

A ready result means only that a later operator-controlled external execution request may be considered. Before that separate step, the operator must independently recheck expiry, single-use state, kill switch, cancellation/deadline support, and disposal readiness. Step U does not reserve, consume, persist, call, connect, observe, or dispose anything.

Do not put credentials, endpoints, hostnames, ports, provider/account/project/service identities, database/schema/table identities, certificate material, artifact bytes, raw observations, SQL, source paths, stack traces, or command output in the ceremony packet, checklist, manifest, issue, PR, or logs.

## Prohibited actions

During Step U, do not invoke the Step T runner or any capability method; contact a provider, database, DNS, TLS, HTTP, socket, or PostgreSQL service; read credentials or environment variables; execute SQL/DDL/DML/migration/scenario work; write production CSVs; modify loader selectors/pointers or Step 4/5/6 behavior; or add runtime routes, cron jobs, workers, deployment workflows, or automatic triggers.
