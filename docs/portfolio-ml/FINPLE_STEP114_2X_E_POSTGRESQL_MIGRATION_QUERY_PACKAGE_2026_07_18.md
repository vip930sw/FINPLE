# Step 114-2X-E inert PostgreSQL migration/query package

Date: 2026-07-18
Scope: structured, non-executable PostgreSQL design package only

## Package contracts

The package is sealed under these versioned contracts:

- `metrics-cutover-postgresql-migration-spec-v1-step114-2x-e`
- `metrics-cutover-postgresql-query-spec-v1-step114-2x-e`
- `metrics-cutover-postgresql-introspection-spec-v1-step114-2x-e`
- `metrics-cutover-postgresql-test-database-gate-v1-step114-2x-e`
- `metrics-cutover-postgresql-test-evidence-spec-v1-step114-2x-e`
- `metrics-cutover-postgresql-package-summary-v1-step114-2x-e`

Each object has exact fields, a domain-separated canonical identity and hash, and exact hash bindings to the validated Step 114-2X-B, 2X-C, and 2X-D artifacts. A ready result exposes only a sanitized summary. Blocked and idle results suppress it.

## Logical migration manifest

The only logical resources are `claim_record` and `repository_lock_record`. The exact ordered operations are:

1. create a logical namespace boundary;
2. define the claim resource;
3. define the repository-lock resource;
4. add exact state constraints;
5. add exact unique constraints;
6. add immutable-field protections;
7. add conditional-transition support indexes;
8. record the schema-package version and hash;
9. verify that no destructive operation is present.

Claim uniqueness is exactly `receipt_identity_hash`. Repository-lock uniqueness is exactly `repository_identity_hash`. Identity and binding fields are immutable. Terminal claim and released-lock states cannot be reset, deleted, reused, overwritten, or automatically recovered.

This is an inert structured manifest. It contains no executable SQL, SQL preview, DDL runner, down migration, extension installation, superuser operation, provider adapter, or database connection method.

## Query-semantics manifest

The operation order is exactly:

1. `acquireClaim`
2. `readClaim`
3. `transitionClaimTerminal`
4. `acquireLock`
5. `readLock`
6. `releaseLock`

Every operation seals its ordered parameters, transaction boundary, affected-row cardinality, result categories, state/version/hash predicates, immutable binding predicates, durable-commit rule, ambiguous-outcome policy, and retry classification. Mutating success requires durable commit acknowledgement. An ambiguous mutation enters manual review, and retry is allowed only when no commit and no mutation have been proven. Lock release remains bound to the exact receipt identity, receipt binding, and durably observed terminal-claim hash.

There is no exported `execute`, `connect`, `query`, `migrate`, `apply`, or `runSql` capability.

## Expected introspection

The introspection contract describes later evidence only. It expects the exact two resources, their columns, states, uniqueness, immutability, schema package version/hash, denied runtime privileges, distinct migration/runtime roles, UTC time, suitable transaction isolation, and backup/restore capability.

It explicitly rejects delete/reset/reuse, TTL or eviction, advisory-lock-only persistence, runtime schema ownership, superuser privilege, and runtime `ALTER`, `DELETE`, `DROP`, or `TRUNCATE`. This stage performs no catalog query.

## Non-authority boundary

`postgresql_test_package_ready` means only that the in-memory design package is internally consistent. It grants no provider, test database, production database, SQL execution, schema mutation, migration, credential, claim, lock, receipt, cutover, file-write, Git, deployment, publication, pointer, rollback, or loader authority.
