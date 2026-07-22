# FINPLE Step 114-2X-ZB explicit production cutover invocation package

## Purpose

Step ZB prepares and gates one explicit production cutover invocation against
merged main `07117880d21adee760c145f7ae865703532c210c`. It directly reconstructs
the complete Step ZA/Z/Y/X/W/V/U/T/S chain and verifies a separately signed
operator authorization before sealing a non-executing invocation package.

Step ZB does not execute Step Z, call an injected capability, acquire or
terminalize a claim, inspect production files, mutate a CSV or selector, activate
a loader, deploy, or infer authorization from PR, CI, Vercel, or repository
ownership.

## Public states

- `awaiting_explicit_production_cutover_invocation_authorization`
- `explicit_production_cutover_invocation_package_verified`
- `blocked`

Zero input and the zero-argument CLI return the awaiting state. CLI arguments are
rejected. The CLI accepts no input discovery mode and has no execution option.

## Direct validation

Before constructing an invocation commitment, the evaluator directly validates:

- the ZB merged-main identity and canonical Step ZA packet/result;
- the exact ZA handoff and runtime-material inventory identities;
- the merged Step Z version, seven capability descriptors, fixed 100ms timeout,
  cancellation, reconciliation, idempotency, namespace, and sanitization policy;
- the exact eleven-event Step Z execution trace and twelve-operation execution
  and restoration plan;
- the canonical Step Y approval and single-use envelope;
- complete Step X/W/V/U/T/S chain identities;
- US then KR content, schema, dataset, candidate package, dataset package, row,
  and byte identities;
- selector preimage and expected postimage identities;
- repository preimage, tree, head, tracked-path, target-absence, and no-drift
  identities;
- authority, invocation, nonce, chronology, and effective-expiry context;
- envelope-unconsumed and preimage-readiness attestations;
- every retry, second-attempt, loader, deployment, provider, database, network,
  credential, SQL, scenario, automatic-trigger, and raw-material field fixed false.

Any mismatch blocks before a one-run command descriptor can be prepared. All
capability invocation and mutation counts remain zero.

## Operator authorization contract

The signed authorization uses:

```text
role=metrics_production_cutover_operator
scope=invoke_exactly_one_verified_production_metrics_csv_cutover
signatureAlgorithm=Ed25519
maximumAuthorizationLifetimeSeconds=300
```

The authorization binds the exact merged SHA, ZA handoff ID/hash, invocation
package commitment ID/hash, single-use claim namespace, fresh authorization
nonce, prior and upstream nonce context, issue time, evaluation time, and
effective expiry.

The allowlist must resolve exactly one active signer. Wildcards, revoked keys,
future-valid or expired intervals, duplicate key/identity/fingerprint entries,
malformed material, and non-Ed25519 keys fail closed. The ZB signer must differ
from Step M, N, Q, S, V, and Y signers by key ID, sanitized identity hash, and
public-key fingerprint.

The ready output contains only the authorization ID/hash, a digest of the
signature, sanitized signer identity, role, scope, and time bounds. It never
contains the Base64 signature, public key, or private material.

## Package identity and seal

The authorization-independent package core is sealed first. Its
`invocationPackageId` and `invocationPackageHash` are the exact commitment signed
by the operator authorization. The final package then adds the sanitized
authorization identity and signature digest and seals the complete result with a
separate final-package hash. This ordering avoids a circular package/signature
dependency while preserving exact authorization binding.

The package includes only sanitized identities and policies for:

- complete ZA/Z/Y/X chain bindings;
- the seven-capability inventory and descriptor hashes;
- US/KR candidates and selector/repository/preimages;
- the exact Step Z trace and one-run operation IDs;
- domain-separated idempotency keys and claim namespace;
- timeout, cancellation, reconciliation, rollback, receipt, and terminalization;
- operator authorization identity and one-run command identity;
- the exact sanitized dependency schema.

The following states are fixed:

```text
singleUse=true
explicitInvocationRequired=true
dryValidationCompleted=true
productionCutoverExecuted=false
cutoverExecutorInvoked=false
capabilityMethodInvoked=false
productionWritePerformed=false
selectorMutationPerformed=false
loaderActivationPerformed=false
deploymentPerformed=false
rawMaterialPresent=false
```

All command, claim, replacement, selector, receipt, rollback, and capability
invocation counts are zero.

## Command boundary

`dryValidateOneRunInvocation` and `prepareOneRunInvocationCommand` accept exactly
one invocation package, the original signed operator authorization, the exact
one-entry allowlist, prior authorization nonce hashes, the current evaluation
clock, the exact ZA validation packet, one complete Step Z execution packet, and
the seven named Step Z capabilities through explicit dependency injection.

The command boundary does not trust the package's unkeyed seal as authorization.
It directly re-evaluates ZA, validates the exact Step Z input shape and canonical
Step Y packet/result, verifies the Step Z execution clock and capability object
bindings, reconstructs the package core, and re-runs Ed25519 signature, allowlist,
signer-separation, nonce, chronology, expiry, package, handoff, and claim-namespace
validation. It then reconstructs the expected final package from the verified
authorization and requires canonical equality. A self-resealed forged signer
identity, authorization hash, or signature digest therefore fails closed.

`dryValidateOneRunInvocation` returns a frozen descriptor with
`commandConstructed=false`. `prepareOneRunInvocationCommand` separately returns a
deterministic, recursively frozen, sanitized descriptor with
`commandConstructed=true`; this means only that a data descriptor was built, not
that a function or closure exists. Both record `executionPerformed=false`,
`executorInvoked=false`, and `capabilityMethodInvoked=false`. Their output contains
only sanitized authorization, ZA/Y/claim, Step Z input-shape, execution-clock, and
capability-descriptor identities. It never contains the Step Z packet, raw bytes,
signature text, public keys, functions, or methods.

No function in Step ZB invokes Step Z or any supplied method.

The production module imports no filesystem, process, environment, HTTP, network,
provider, database, deployment, route, worker, cron, or trigger capability.
