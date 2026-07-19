# Step 114-2X-Q adapter artifact and one-run binding

## Sanitized artifact manifest

The adapter artifact manifest is metadata only. It binds:

- a sanitized artifact ID and SHA-256;
- source-tree and capability-manifest SHA-256 values;
- the exact Step P adapter-interface hash;
- the exact Step O adapter-policy ID/hash;
- the adapter-interface version;
- exact ordered observation operations and categories;
- exact sanitized hash and canonical timestamp output fields;
- transport class `disposable_environment_read_only_observer`;
- one destination and one observation.

The immutable artifact is explicitly not loaded, externally bound, or
invocable. Provider-specific and raw material are absent. Exact-key validation
rejects paths, commands, endpoints, hostnames, addresses, ports, URLs,
database/schema/table identities, credentials, certificates, provider/account
identities, source text, screenshots, SQL, or raw evidence.

## Non-executing one-run package

After the signed authorization, operator allowlist, verification policy, and
artifact manifest pass, Step Q deterministically prepares an in-memory one-run
binding. It binds the complete Step P/O/N material, authorization signature
digest, all sanitized artifact hashes, all nonce hashes, exact role/scope,
ordered operations, counts, state trace, observation window, and expiry.

The package requires later, separately reviewed stages to perform claim
acquisition, adapter artifact loading, evidence finalization, execution-receipt
persistence, and environment disposal. It is `syntheticValidationOnly=true`,
`nonExecuting=true`, and cannot be accepted by a runtime route, adapter loader,
claim store, receipt store, or external transport in Step Q.

Every authority inherited from Step P plus the Step Q authorization, adapter,
dependency, claim, invocation, observation, evidence, receipt, disposal, Git,
deployment, and publication authorities remains fixed false.
