# FINPLE Step 114-2X-ZB-P current-main provenance bridge

## Purpose

The provenance bridge binds a later, explicitly supplied execution-main
snapshot to the reviewed Step Z, ZA, ZB, adapter, and bridge sources. It is a
pure non-executing validator. It does not update the historical baseline
constants and does not grant production cutover authority.

## Historical contracts

The bridge imports and preserves the exact historical main bindings and contract
versions exported by Step Z, Step ZA, and Step ZB. A packet that replaces any
historical baseline with the current main SHA is blocked.

The later execution-main SHA is never hardcoded. Runtime material must supply:

- execution main, repository head, tree, and snapshot identity;
- reviewed and observed source path/blob/content identities for Step Z, ZA, ZB,
  production adapters, and the provenance bridge;
- exact historical contract baselines and versions;
- ordered US/KR approved path identities and one selector path identity;
- the adapter manifest and sanitized current-preimage manifest;
- optional later operator allowlist/authorization identity hashes;
- a fresh provenance nonce context;
- issued, evaluation, and effective-expiry instants;
- fixed-false merge, CI, Vercel, health, and ownership authority signals.

Reviewed and observed source identities must be canonically identical. The
repository head must equal the supplied execution main, and the current
preimage manifest must bind the same head/tree and approved path identities.
Any source, tree, path, selector, adapter, or preimage drift fails closed.

## Public states

```text
awaiting_production_adapter_and_provenance_material
production_adapter_and_current_main_binding_verified
blocked
```

Zero input and the zero-argument CLI return the awaiting state.

Failure classifications are:

```text
blocked_before_adapter_manifest_validation
blocked_during_current_main_provenance_validation
blocked_during_preimage_and_path_binding_validation
blocked_during_nonce_or_chronology_validation
```

## Chronology and authority

Prior and upstream nonce arrays must be sorted, unique SHA-256 identities. The
fresh nonce must not collide with either context. The evaluation instant must
satisfy `issuedAt <= evaluation < effectiveExpiresAt`, with a maximum provenance
lifetime of 300 seconds.

Merge, CI, Vercel, health checks, and repository ownership must all be explicitly
false as execution-authority signals. A successful provenance result still
requires a separate Step ZA/ZB operator authorization and explicit invocation.

## Successful non-executing result

```text
currentMainBound=true
historicalContractsPreserved=true
productionAdaptersValidated=true
productionConfigured=false
explicitInvocationStillRequired=true
cutoverExecutorInvoked=false
capabilityMethodInvoked=false
productionWritePerformed=false
selectorMutationPerformed=false
rollbackInvoked=false
loaderActivationPerformed=false
deploymentPerformed=false
rawMaterialPresent=false
```

All claim, terminalization, CSV replacement, selector mutation, receipt,
rollback, command construction, and capability invocation counts remain zero.
Only sanitized identity manifests are returned; raw source, CSV, selector,
signature, credential, endpoint, and absolute local path material is excluded.
