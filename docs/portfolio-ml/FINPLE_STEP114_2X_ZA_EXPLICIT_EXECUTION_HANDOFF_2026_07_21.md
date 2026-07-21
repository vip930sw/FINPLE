# FINPLE Step 114-2X-ZA explicit execution handoff

## Handoff meaning

The ZA handoff is a deterministic, recursively frozen, sanitized package proving
that the exact external runtime material and operator checklist were valid at one
explicit evaluation instant before expiry. It is not an execution receipt, claim,
approval, command, trigger, or proof that production changed.

The ready handoff always seals:

```text
nonExecuting=true
explicitInvocationRequired=true
runtimeMaterialValidated=true
cutoverExecutorInvoked=false
capabilityMethodInvoked=false
productionWritePerformed=false
selectorMutationPerformed=false
loaderActivationPerformed=false
deploymentPerformed=false
rawMaterialPresent=false
```

## Bound identity groups

The handoff binds only sanitized identities for:

- the Step Z contract and Step Y approval/envelope;
- Step X evidence, readiness package, and readiness summary;
- the Step W/V/U/T/S chain;
- the seven-capability inventory and descriptor/method identities;
- US then KR candidate datasets and package metadata;
- selector preimage/postimage and repository/preimage attestations;
- the twelve-stage Step Z operation/rollback plan and eleven-event executor trace;
- the completed operator checklist;
- the fresh ceremony nonce, sorted unique prior context, upstream context,
  evaluation instant, and effective expiry.

The handoff does not include raw file paths, raw bytes, credentials, endpoints,
commands, public keys, account/provider/database identities, or executable
capability methods.

## One-run boundary

A later production cutover requires a separate, explicit operator invocation of
the Step Z executor with the exact bound material. Merge, CI, Vercel status,
repository ownership, this ready state, or possession of the handoff cannot infer
that authority.

Before that separate invocation, the operator must independently re-establish
that the Step Y envelope is unconsumed and unexpired and that current CSV,
selector, and repository preimages still match. Step Z remains responsible for
the atomic claim, re-read, no-drift verification, ordered US/KR replacement,
selector mutation, receipt persistence, terminalization, and fail-closed rollback.

ZA performs none of those operations and supplies no retry, second-attempt,
loader-activation, deployment, provider, database, network, or automatic-trigger
path.

## Determinism and sanitization

Identical canonical inputs produce the same inventory, checklist, and handoff
identities. A fresh nonce or any valid bound identity change produces a distinct
handoff. All output objects are recursively frozen, and every capability invocation
counter remains zero.

Any main/chain drift, descriptor mismatch, missing runtime material, preimage or
candidate mismatch, replayed nonce, invalid chronology/expiry, unavailable
rollback/receipt/terminalization control, or incomplete checklist returns
`blocked` without a handoff.
