# Step 114-2X-D production persistence decision

Date: 2026-07-17
Scope: architecture decision and real-adapter implementation preflight only

## Decision

The preferred provider class is `dedicated_postgresql_transactional_store`, subject to later independent provider, schema, credential, migration, and database-backed conformance approval. This is a provider-neutral design decision. It does not validate or authorize a provider connection.

The selected design is a dedicated, table-backed transactional store for two logical resources only: `claim_record` and `repository_lock_record`. Repository locking must persist as an auditable record across client or session loss. Session-scoped advisory locks alone are insufficient.

## Candidate comparison

| Candidate class | Decision | Reason |
| --- | --- | --- |
| `dedicated_postgresql_transactional_store` | Preferred design | Can satisfy unique insert, transactional compare-and-set, durable commit acknowledgement, strong read-after-write, retention, backup, and least-privilege requirements when independently proven. |
| `distributed_strongly_consistent_kv` | Not selected | No implementation evidence is supplied in this stage. |
| `transactional_object_store` | Rejected for this packet | Atomic conditional cross-resource transaction semantics are not proven. |
| `redis_like_ephemeral_store` | Rejected | TTL, eviction, asynchronous durability, and conditional persistence risk conflict with immutable terminal evidence. |
| `local_filesystem` | Rejected | It is not the required production-durable distributed claim and lock boundary. |

Exactly one candidate is preferred. Selection remains `designDecisionOnly=true`; `realProviderAdapterValidated=false` and `productionClaimEligible=false`.

## Required capability evidence for a later stage

- Atomic create-if-absent with a unique conflict that never overwrites an existing owner.
- Conditional state/version/record-hash transition with exactly one concurrent winner.
- Durable commit acknowledgement before success is returned.
- Strong read-after-write for the exact record.
- Immutable terminal records without TTL, eviction, delete, reset, reuse, or delete-to-retry.
- Table-backed repository lock persistence across session loss.
- Dedicated least-privilege runtime and separate migration roles.
- UTC timestamps, retention, backup/restore, and manual-review controls.

## Non-authority boundary

`real_adapter_implementation_preflight_ready` means only that the sanitized proposal is internally complete and matches the merged Step 114-2X-C protocol. It grants no connection, schema mutation, migration, claim, lock, cutover, write, commit, push, merge, deployment, publication, pointer, rollback, or loader authority.
