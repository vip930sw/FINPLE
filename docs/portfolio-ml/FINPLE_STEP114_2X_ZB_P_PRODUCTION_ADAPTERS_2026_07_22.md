# FINPLE Step 114-2X-ZB-P production capability adapters

## Purpose and boundary

This step adds production-capable implementations for the seven capabilities
injected by the historical Step Z executor. It does not configure them for a
production checkout and does not invoke Step Z. Construction requires explicit
filesystem, path, root, clock, operation, repository, and restoration inputs.

The module performs no environment, cwd, home-directory, registry, dynamic
module, provider, database, or network discovery. No production target or
selector path is hardcoded. PR and CI tests construct the adapters only against
isolated temporary directories and synthetic files.

## Capability contracts

The factories expose the exact descriptors and method sets exported by Step Z:

| Capability | Methods |
| --- | --- |
| `singleUseCutoverEnvelopeStore` | `acquireEnvelopeClaim`, `reconcileOperationOutcome`, `terminalizeEnvelopeClaim` |
| `cutoverClock` | `readCutoverClock` |
| `cutoverPreimageReader` | `readBoundPreimages`, `readProductionCsvIdentity`, `readPostCutoverState` |
| `atomicProductionCsvReplacer` | `replaceProductionCsvAtomically`, `reconcileOperationOutcome` |
| `selectorMutationCoordinator` | `mutateSelectorExactlyOnce`, `reconcileOperationOutcome` |
| `cutoverReceiptStore` | `persistCutoverReceipt`, `reconcileOperationOutcome` |
| `rollbackCoordinator` | `restoreBoundPreimages`, `reconcileOperationOutcome` |

The Step Z boundary remains fixed at 100ms. Every call requires an exact
operation ID, domain-separated idempotency key, ISO deadline, and AbortSignal.
Primary mutations have no retry. An ambiguous mutation may be reconciled once
by reading the exact operation journal with the same identities.

## Explicit path and filesystem model

Construction supplies:

- an explicit filesystem capability object;
- an explicit path API;
- an absolute approved data root and separate state root;
- exact absolute filesystem locations paired with sanitized repository-relative
  public paths;
- exact US then KR path bindings and one selector binding;
- exact operation bindings;
- explicit platform atomicity attestations;
- an injected clock and repository head/tree identity;
- private restoration bytes used only inside rollback.

Every path is normalized, required to remain under its approved root, walked
with `lstat`, and reconciled with `realpath`. Symlink and junction traversal,
root escape, absolute public paths, `..` aliases, and path collisions fail
closed before an adapter is returned.

## Durability and atomicity

Claims and receipts use exclusive creation, file flush/fsync, and directory
sync when explicitly attested by the platform. Claim records have one immutable
claim identity and one terminal-state transition. A second acquisition or
terminal transition is rejected.

CSV and selector mutations stage bytes in the destination directory under an
operation-bound exclusive name, flush the staged file, re-read and verify its
identity, then perform same-directory rename. No cross-device copy fallback is
implemented. US must exist before the KR operation can proceed. Create-only
targets are rejected when already present.

Operation journals contain sanitized identities, state, and counts only. They
support crash/restart read-only reconciliation without rerunning a mutation.

## Rollback

Rollback receives explicit private restoration material at construction. It can
restore original target absence or content and the selector preimage using the
same atomic staging model. The restored state is re-read and compared with the
bound preimage manifest. Receipt or terminalization ambiguity returns manual
review after restoration and cannot produce a completed closeout.

## Manifest and PR state

The deterministic frozen adapter manifest seals exact Step Z descriptor hashes,
method sets, source identities, approved-root policy identity, filesystem
attestations, and claim/receipt/rollback schema identities. It records:

```text
productionCapable=true
productionConfigured=false
automaticRetryAllowed=false
fallbackAllowed=false
secondAttemptAllowed=false
rawOutputAllowed=false
providerAccessAllowed=false
databaseAccessAllowed=false
networkAccessAllowed=false
loaderActivationAllowed=false
deploymentAllowed=false
```

All capability invocation and mutation counts in the committed manifest remain
zero. No actual production paths, preimages, credentials, endpoints, or keys are
committed.
