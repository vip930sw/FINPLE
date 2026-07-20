# Step 114-2X-U execution ceremony and evidence handoff

## Boundary

Step 114-2X-U is a non-executing ceremony validator. It does not invoke the Step T runner or any injected capability. It accepts only an explicitly supplied, sanitized contract packet and validates whether all material required for a later, separately approved external execution is present and policy-complete.

The exact public states are:

- `awaiting_external_runtime_material`
- `ready_for_explicit_external_execution`
- `blocked`

Zero input and the zero-argument CLI remain `awaiting_external_runtime_material`. The ready state is preparation readiness only. It does not grant execution authority, infer operator approval, consume a single-use identity, or perform an observation.

## Merged Step S and Step T binding

The contract binds merged main `beb440556d4946008bf33e91f1dc3621c7d599e6`. It calls the exposed Step T direct Step S package validator and the Step T capability-bundle validator without calling a capability method. It also rechecks the exact Step T contract version, public states, capability inventory, method sets, descriptor cancellation/deadline/reconciliation policies, no-retry/no-fallback rules, and production/provider mutation prohibitions.

The output inventory binds the Step S runner implementation manifest ID/hash, runner artifact ID/hash, runner source-tree hash, runner capability-manifest hash, Step S launch package ID/hash, and effective expiry. Any supplied main SHA drift, Step S package drift, Step T descriptor drift, or expiry blocks with fixed issue codes.

## Runtime-material inventory

Exactly these ten capability descriptors must be supplied:

1. `runtimeArtifactSource`
2. `runnerArtifactLoader`
3. `adapterArtifactLoader`
4. `singleUseExecutionLeaseStore`
5. `atomicClaimStore`
6. `readOnlyObservationTransport`
7. `executionReceiptStore`
8. `evidenceFinalizer`
9. `environmentDisposalCoordinator`
10. `executionClock`

Validation is shape- and policy-only. Each inventory entry records the Step T descriptor hash, presence, descriptor-validation status, and `methodInvocationCount=0`. Runtime material must also bind one destination, one observation, the Step S effective expiry, distinct sanitized operation IDs/idempotency keys, and exact unused confirmation, authorization, invocation, lease-request, and claim-request identities.

Artifact-byte availability, kill-switch availability and initial safety, receipt/evidence stores, disposal coordination, and lease terminalization are boolean presence assertions only. No bytes, handles, endpoints, credentials, provider identities, database identities, paths, or command output enter the result.

## Evidence handoff manifest

The deterministic evidence-handoff manifest contains only sanitized Step S/T-approved identity bindings, contract/policy versions, counts, expiry, checklist booleans, and fixed-false authority fields. It binds:

- runner manifest and runner artifact ID/hash pairs;
- runner source-tree and capability-manifest hashes;
- Step S launch package and execution-confirmation ID/hash pairs;
- Step Q operator-authorization ID/hash pair;
- Step N invocation ID/hash pair;
- Step O claim-key hash;
- Step R runtime-precondition manifest ID/hash pair;
- destination count one, observation count one, and capability count ten;
- the complete operator-checklist boolean map;
- `providerMutationAllowed=false` and `productionMutationAllowed=false`;
- `automaticRetryAllowed=false`, `fallbackAllowed=false`, and `automaticTriggerAllowed=false`;
- `externalExecutionApproved=false`, `stepTRunnerInvoked=false`, and `capabilityMethodInvoked=false`;
- `rawMaterialPresent=false`.

The manifest is canonical, domain-separated, deterministic, and recursively frozen. It is a handoff contract, not execution evidence and not proof that an external environment exists.

## Safety result

The production module imports only `node:crypto` and the merged Step T contract module. It has no filesystem, child-process, environment-variable, network, DNS, TLS, socket, PostgreSQL, provider, database, SQL, route, cron, worker, or deployment capability. Tests use only deterministic in-memory synthetic Step S/T fixtures and assert that every capability call log remains empty.
