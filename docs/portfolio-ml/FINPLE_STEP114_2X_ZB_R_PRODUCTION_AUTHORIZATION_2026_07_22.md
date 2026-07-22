# Step 114-2X-ZB-R production authorization

## Separate production-mode contract

Step ZB-R introduces a production-runtime authorization contract without
changing the historical synthetic-only Step ZB contract.

Required values are exact:

```text
role=metrics_production_cutover_operator
scope=invoke_exactly_one_verified_production_metrics_csv_cutover
signatureAlgorithm=Ed25519
productionAuthorization=true
syntheticValidationOnly=false
```

The signed body binds the explicit execution SHA, current-main provenance,
configuration and adapter manifests, candidate/target/selector identities,
historical Step Z contract, operation plan, claim namespace, environment,
nonce contexts, chronology, effective expiry, signer identity, and the exact Git
tree/blob/content identity of the ZB-R runtime and approved no-op implementation.
The configuration manifest also seals the exact factory-derived adapter
construction binding, so authorization cannot be reused with another root,
state root, target, selector, operation plan, restoration identity, no-op
instance, execution tree, or mixed adapter set.

## Verification rules

Validation requires exactly one active non-wildcard, non-revoked Ed25519
allowlist entry for the exact environment. The signature is verified over the
canonical authorization body; a re-sealed unkeyed hash is not authority.

The signer must be separate from Step M/N/Q/S/V/Y and the historical ZB signer
in all three dimensions: key ID, sanitized identity hash, and public-key
fingerprint. Nonces must be sorted, unique, fresh, absent from prior state, and
separate from upstream nonce material. The authorization must satisfy
`issuedAt <= evaluation < effectiveExpiresAt`, exact upstream effective-expiry
intersection, and a maximum 300-second lifetime.

Malformed, wildcard, duplicate, future-valid, expired, replayed,
cross-environment, non-Ed25519, or synthetic-only material fails closed.

## Non-execution boundary

Committed tests use generated synthetic Ed25519 keys and isolated temporary
directories only. This step does not generate or store a real operator
signature, configure an actual production path or state root, construct a
production-bound adapter set, or invoke the Step Z executor. Factory provenance
tests construct adapters only inside isolated synthetic temporary directories
and invoke no capability method.
