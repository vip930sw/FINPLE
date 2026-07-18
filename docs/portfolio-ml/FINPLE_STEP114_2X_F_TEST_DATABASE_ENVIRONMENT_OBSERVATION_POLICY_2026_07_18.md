# FINPLE Step 114-2X-F test-database environment observation policy

Date: 2026-07-18

## Purpose

Step 114-2X-F defines strict future evidence policies for a disposable PostgreSQL conformance environment. It performs no observation, connection, DNS lookup, TLS handshake, certificate retrieval, catalog query, credential read, SQL execution, migration, claim, lock, or receipt action.

The only accepted purpose classification is `disposable_isolated_conformance_only`. Production, staging, shared development, application storage, analytics/reporting storage, an existing FINPLE application database, and any environment containing unrelated data are fixed false. A future run must prove either a new empty disposable namespace or a separately approved disposable namespace.

## Upstream binding

Every policy binds the merged Step 114-2X-E package-summary, test-database-gate, and future-evidence-spec ID/hash pairs plus the exact scenario count. The implementation directly invokes the merged validators for the Step 114-2X-B preparation summary, Step 114-2X-C claim/lock protocols, Step 114-2X-D supporting plans and preflight, and all Step 114-2X-E migration, query, introspection, gate, evidence, and package-summary contracts.

Version-only acceptance is prohibited. Missing, malformed, or tampered upstream objects block preparation.

## Network destination observation

The future sanitized observation contains only an allowlist hash, observation-method category, observer-attestation hash, and bounded UTC observation/expiry instants. The policy fixes a 900-second maximum age, 30-second allowed clock skew, and exactly one destination.

Wildcards, redirects, DNS rebinding, loopback, private-network, metadata-service, production, staging, and unrelated destinations are forbidden. Ambiguity is `manual_review_fail_closed`. Endpoint, hostname, IP address, port, and URL material are forbidden from the public contract.

No network destination is observed in this step.

## Future observation result contracts

Four strict future result contracts are defined for network, database, certificate, and namespace observations. Each result has exact keys and a domain-separated observation ID/hash, binds the Step 114-2X-E package-summary and test-gate ID/hash pairs plus its Step 114-2X-F policy ID/hash, and contains only a sanitized observer-attestation hash, canonical `observedAt`/`expiresAt` instants, sanitized result fields, `manualReviewRequired`, and `rawMaterialPresent=false`.

Pure validators accept an explicit canonical UTC evaluation-clock instant. They do not read the system clock. They enforce `observedAt < expiresAt`, maximum age, permitted clock skew, expiry at evaluation time, non-excessive validity windows, exact bindings, and manual-review consistency. Missing, extra, stale, expired, future-dated, inverted, or tampered results block.

The network result fixes one observed destination and every wildcard, redirect, DNS-rebinding, loopback, private-network, metadata-service, production, staging, and unrelated-destination observation false. The database result requires fingerprint and namespace-evidence hashes, exact purpose/capability/package state, UTC and isolation attestations, no application or unrelated objects, and validated namespace isolation. The certificate result requires a fingerprint hash, TLS, chain, and hostname validation with no rotation ambiguity or expiry. The namespace result requires an allowed disposable category, an empty isolated namespace, and no application or unrelated objects.

Only sanitized synthetic fixtures instantiate these contracts in tests. No runtime builder, observation route, clock read, DNS/TLS/database operation, or evidence persistence is added.

## Database fingerprint observation

The future observation requires a database fingerprint hash, disposable-namespace evidence hash, exact purpose classification, server-capability category, UTC behavior attestation hash, transaction-isolation attestation hash, schema-package state, and bounded UTC observation/expiry instants.

The only schema-package states are expected package absence before migration or exact expected package binding after migration. Application-object and unrelated-object absence are mandatory. Mismatch, ambiguity, stale evidence, timestamp inversion, and unexpected objects require manual review. No raw server banner, database identity, schema/table identity, or catalog output is accepted.

No catalog query is executed in this step.

## Certificate fingerprint observation

The future public observation contains only a certificate fingerprint hash and bounded UTC observation/expiry instants. TLS, full-chain verification, and hostname verification are mandatory. Rotation requires a new observation and manual review. Mismatch and expiry fail closed.

Raw certificate bytes, subject, issuer, SAN, hostname, and endpoint data are forbidden. No TLS connection or certificate retrieval occurs in this step.

## Credential injection policy

Only these abstract categories exist:

- `future_dedicated_test_migration_credential`
- `future_dedicated_test_runtime_credential`

They must be distinct and injected only through a later secret boundary. CLI, stdin, environment fallback, committed files, logs, public output, and application-variable fallback are forbidden. Application, managed-database, trading-provider, payment, authentication, and deployment credentials cannot be reused.

The runtime category cannot `ALTER`, `DELETE`, `DROP`, `TRUNCATE`, own the schema, or act as superuser. The migration category cannot be used for adapter scenarios. Rotation, revocation, and expiry are mandatory. No credential value or real secret name exists in this package.

Any future authorization-envelope context must contain exactly the environment, network, database, certificate, credential, and authorization contracts. The pure context validator directly revalidates all six contracts rather than trusting their sealed IDs/hashes. Weakening a credential privilege rule and resealing the credential, authorization policy, and envelope therefore still blocks.

## Manual review and non-authority

Missing, malformed, stale, expired, tampered, mismatched, ambiguous, replayed, or privilege-drifted evidence blocks. There is no automatic retry, deletion, reset, cleanup, forced continuation, or authorization reissue.

`test_database_execution_gate_prepared` means only that these inert policies are internally complete. Environment observation, destination validation, database/certificate validation, namespace validation, credential validation, database connection, SQL, and migration authority all remain false.
