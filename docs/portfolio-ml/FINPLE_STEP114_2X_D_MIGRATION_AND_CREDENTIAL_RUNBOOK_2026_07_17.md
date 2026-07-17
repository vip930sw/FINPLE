# Step 114-2X-D migration and credential runbook

This is a non-executing procedural plan. It contains no SQL, deployed object name, provider identity, endpoint, credential name/value, secret reference value, command, or production authority.

## Credential boundary

- A future runtime adapter receives a dedicated least-privilege credential category through a later separately authorized secret-injection boundary.
- A migration operator uses a separate credential category. Runtime and migration credentials cannot be aliases or fallbacks for each other.
- Runtime access is limited to the logical `claim_record` and `repository_lock_record` resources.
- Runtime access to application user, auth, payment, subscription, portfolio, trading, provider, and unrelated resources is denied.
- Runtime `ALTER`, `DELETE`, `DROP`, and `TRUNCATE` are denied. The runtime role is neither schema owner nor superuser.
- Existing application, deployment, Supabase service-role, trading, provider, or KIS credentials cannot be reused or used as fallback.
- Credentials cannot enter through CLI arguments, stdin, environment fallback, committed files, logs, or public results in this stage.
- Rotation, revocation, and operator-access review are mandatory in a later authorized stage.

## Ordered migration procedure

1. A human approves the provider class and isolation topology.
2. An independent reviewer approves the logical schema and constraints.
3. A separately authorized operator creates the dedicated role and schema.
4. The migration is applied first to a non-production test database.
5. Read-only introspection verifies every required constraint and index.
6. The exact Step 114-2X-C semantics are tested concurrently on a test-owned database.
7. Backup and restoration are rehearsed and reviewed.
8. Production migration requires a separate explicit approval.
9. A separately authorized migration boundary performs the production migration.
10. Post-migration verification is read-only.
11. Runtime credential handoff and migration-credential revocation are verified.
12. No production cutover execution occurs during migration.

## Manual-review conditions

Stop without automatic continuation for ambiguous completion, partial schema creation, missing constraints or indexes, unexpected pre-existing objects, privilege drift, UTC/clock mismatch, backup/restore failure, failover or replication lag, transaction commit ambiguity, or schema version drift.

There is no automatic rollback, destructive cleanup, drop, truncate, delete, reset, forced continuation, lock stealing, claim deletion, or retry after an ambiguous commit. A later operator must establish the actual durable state before any new authorization decision.
