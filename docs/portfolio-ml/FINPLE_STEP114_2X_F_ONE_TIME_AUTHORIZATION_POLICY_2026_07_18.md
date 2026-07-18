# FINPLE Step 114-2X-F one-time authorization policy

Date: 2026-07-18

## Boundary

This document defines a future authorization envelope policy. Step 114-2X-F does not issue, sign, store, consume, extend, transfer, delete, retry, or reissue an authorization. It does not create a nonce, approver identity, receipt, claim, or lock.

## Exact bindings

Any later sanitized envelope must bind exactly to:

- the merged Step 114-2X-E package-summary ID/hash;
- the merged Step 114-2X-E test-database-gate ID/hash;
- the merged Step 114-2X-E future-evidence-spec ID/hash and exact 15 scenarios;
- the Step 114-2X-F environment-classification ID/hash;
- network, database, and certificate observation-policy ID/hash pairs;
- the credential-injection-policy ID/hash;
- a sanitized approver-identity hash;
- canonical `issuedAt` and `expiresAt` UTC instants;
- a nonce hash.

Every contract uses exact-key validation, canonical JSON, domain-separated IDs and hashes, ordered arrays, and strict cross-contract comparison. Version-only checks do not satisfy the policy.

## Purpose and operations

The exact purpose is `exact_15_scenario_disposable_conformance_run`. Sanitized environment observations are prerequisites completed before authorization issuance. They are not an authorized operation. The future allowed operation set is restricted, in exact order, to one disposable test-database connection, the exact bound migration package, the exact 15-scenario conformance run, and sanitized hash-chained evidence collection.

This is a future policy description, not current authority. No operation in that set is performed or authorized by Step 114-2X-F.

## Single-use rules

`maximumExecutionCount` is exactly 1. Production scope, production cutover scope, reuse, extension, transfer, delete-to-retry, and automatic reissue are fixed false. Ambiguous issue or consume state resolves to `manual_review_fail_closed`.

The policy fixes `maximumAuthorizationLifetimeSeconds=900`, `allowedClockSkewSeconds=30`, `issuedAtBeforeExpiresAtRequired=true`, `nonceUniquenessRequired=true`, and `nonceReplayPolicy=manual_review_fail_closed`.

Duplicate nonce, replay, timestamp inversion, excessive clock skew, expiry, binding mismatch, scope mismatch, or observed/consume ambiguity blocks. No automatic retry or cleanup is allowed.

## Future authorization envelope result

The strict future envelope contract binds the package summary, Step 114-2X-E test gate and future-evidence spec, Step 114-2X-F authorization/environment/credential policies, all four observation ID/hash pairs, the exact 15-scenario count/order, a sanitized approver-identity hash, canonical issue/expiry instants, nonce hash, exact operation order, and maximum execution count 1.

Its pure validator accepts an explicit evaluation-clock instant and validates all four observation results before validating the envelope. It then enforces exact keys/version/domain-separated ID/hash, every upstream and policy binding, scenario and operation order, lifetime/skew/expiry/inversion rules, nonce uniqueness against an explicit prior-hash set, manual-review consistency, and `rawMaterialPresent=false`.

Only sanitized synthetic fixtures instantiate the envelope in tests. Step 114-2X-F does not create, issue, persist, transfer, or consume an authorization.

## Fixed-false state

The policy and public result keep both `oneTimeAuthorizationIssued=false` and `oneTimeAuthorizationConsumed=false`. Database connection, credential use, SQL, schema mutation, migration, claim/lock mutation, receipt consumption, commit, push, merge, deployment, publication, pointer, rollback, and loader authority also remain false in ready, blocked, idle, CLI rejection, and exception results.
