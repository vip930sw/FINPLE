# Step 114-2X-P claim, adapter, and receipt interfaces

## Atomic claim-store descriptor

The transport-neutral descriptor binds the exact Step O claim key, NUL-terminated derivation domain, ordered input fields, claim and receipt namespaces, compare-and-set-equivalent atomicity, maximum one successful acquisition, expiry enforcement, duplicate/replay rejection, and the exact outcomes `acquired`, `already_exists`, `expired`, `ambiguous`, and `failed`.

Only `acquired` permits the synthetic state trace to reach `adapter_invocation_requested`. Every other outcome returns `blocked` with a synthetic adapter-invocation count of zero. `ambiguous` and `failed` cannot be retried automatically. The descriptor declares no durable-store access and binds no implementation.

## Read-only observation-adapter descriptor

The adapter descriptor reuses the exact Step O adapter-interface version, ordered observation operations and categories, required sanitized hash/timestamp output fields, one destination, and maximum one synthetic invocation. It permits only the outcomes `completed`, `blocked`, `ambiguous`, and `failed`.

Writes, DDL, DML, mutation, migration, scenarios, provider mutation, production access, credential echo or persistence, raw endpoint/certificate/credential output, automatic retry, and external adapter binding remain false. A completed synthetic output must contain exact SHA-256 field keys and canonical timestamps only. No adapter function is imported or invoked.

## Receipt-store descriptor and receipt candidate

The receipt-store descriptor accepts only a non-persistent candidate and keeps durable persistence, retry, and store access false. The in-memory receipt candidate binds the Step O summary/input/policies/manifest, Step N invocation/receipt, claim key and nonce, adapter descriptor and policy, exact operation/category order, sanitized output hashes, canonical timestamps, observation window, one destination, one observation, and state-trace hash.

The candidate explicitly keeps `realClaimPersisted`, `realInvocationConsumed`, `realAdapterInvoked`, `realObservationCompleted`, and `executionReceiptPersisted` false. Evidence finalization and environment disposal remain separately reviewed requirements.
