# Step 114-2X-S runner manifest and launch package

## Runner implementation manifest

The runner manifest is an immutable, sanitized contract. It binds the complete Step R package plus runner artifact identity, artifact SHA-256, source-tree SHA-256, capability-manifest SHA-256, interface version, runner class, the exact seven-step launch sequence, and maximum counts of one. It declares no runtime activity and contains no endpoint, provider, credential, certificate, account, project, service, database, schema, table, raw material, or executable capability.

The signed execution confirmation binds the manifest ID, manifest hash, and its artifact/source/capability digests. A valid old signature cannot authorize a substituted, normally resealed manifest. A changed manifest must be included in a newly signed synthetic fixture and still satisfy every policy and continuity rule.

## One-run launch package

The one-run launch package is a sealed, non-executing handoff. It requires, but does not perform:

- runtime artifact digest verification
- exact single-use atomic claim acquisition before adapter invocation
- one bound read-only observation sequence
- sanitized receipt and evidence preparation
- bounded disposal handling
- fail-closed manual review for ambiguous outcomes

The launch package explicitly binds the execution confirmation's `issuedAt` and `expiresAt`. Its `earliestExpiry` is the effective launch expiry: the earlier of the signed execution-confirmation expiry and the Step R runtime-precondition earliest expiry. The summary seals the launch package ID/hash, so this effective expiry cannot drift independently.

The package preserves separate artifact, claim, transport, receipt, evidence, and disposal namespaces. Every launch, load, claim, invocation, observation, connection, persistence, disposal, production, Git, and deployment authority remains false.

## Capability boundary

The Step S module may parse public keys, verify Ed25519 signatures, and calculate SHA-256 values for synthetic validation. It does not resolve or load a runner module, read artifact bytes, bind runtime dependencies, create a claim, invoke an adapter, connect to a provider or database, handle credentials or certificates, execute SQL/migrations/scenarios, collect evidence, persist receipts, dispose of an environment, or deploy anything.
