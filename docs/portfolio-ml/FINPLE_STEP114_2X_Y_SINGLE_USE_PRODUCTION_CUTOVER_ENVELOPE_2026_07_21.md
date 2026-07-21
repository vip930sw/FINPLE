# Step 114-2X-Y single-use production-cutover envelope

## Envelope meaning

A verified envelope states only that a later, separately reviewed explicit invocation
may perform one exact production metrics CSV cutover against the bound preimage before
the effective expiry. The envelope itself performs and persists nothing.

The deterministic recursively frozen envelope binds:

- the sanitized Step Y approval ID/hash, signature digest, signer fingerprint, and
  exact public allowlist ID/hash;
- Step X evidence/readiness/summary ID/hash pairs;
- the complete Step W/V/U/T/S identity set;
- the canonical production-cutover identity manifest and ordered US/KR target set;
- selector preimage and expected postimage identities;
- repository preimage/tree/head identities;
- authority, invocation, target-absence, and no-drift identities;
- the exact future operation order;
- at most two atomic CSV replacements, one selector mutation, zero loader activations,
  and zero deployments;
- explicit rollback/preimage restoration, separate review, exact-preimage, and
  explicit-invocation requirements;
- fresh approval nonce context and effective expiry.

The successful envelope has `singleUse=true` and `approvalVerified=true`. It records
authorization for a later exact invocation, but keeps all current execution and
mutation counts at zero.

## Fixed safety state

The following stay false:

```text
cutoverExecutorInvoked=false
productionWritePerformed=false
selectorMutationPerformed=false
loaderActivationAuthorized=false
loaderActivationPerformed=false
deploymentAuthorized=false
deploymentPerformed=false
automaticRetryAllowed=false
secondCutoverAttemptAllowed=false
rawMaterialPresent=false
```

The implementation imports only `node:crypto` for SHA-256, Ed25519 public-key
fingerprinting, and signature verification. It has no filesystem, process, network,
provider, database, credential, SQL, scenario, executor, claim, selector, loader,
deployment, or automatic-retry capability.
