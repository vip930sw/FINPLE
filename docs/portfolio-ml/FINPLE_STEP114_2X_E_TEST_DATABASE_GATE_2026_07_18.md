# Step 114-2X-E disposable test-database gate

Date: 2026-07-18
Scope: future test-database admission requirements only

## Purpose boundary

The sole permitted future purpose is `disposable_isolated_conformance_only`. A qualifying database must not be production, staging, shared development, or application-data storage. It must use a new empty or separately human-approved disposable namespace.

This document and the matching code do not connect to any database. They do not contain a provider identity, endpoint, DSN, credential, certificate, schema name, or real resource identity.

## Credential and observation gates

A later stage must supply independently authorized, future-injected credential categories:

- a dedicated migration credential category;
- a distinct least-privilege runtime credential category.

No environment, stdin, default, shared, or production credential fallback is allowed. Before any later connection, a separate process must verify a destination allowlist, database fingerprint, and certificate fingerprint, then bind them to a sanitized, expiring, one-time human approval. None of that evidence exists or is accepted in Step 114-2X-E.

## Required future evidence scenarios

The future evidence plan contains exactly 15 scenario classes:

1. migration into a new disposable database;
2. deterministic repeat-migration behavior;
3. schema introspection verification;
4. concurrent claim acquisition with one winner;
5. concurrent repository-lock acquisition with one winner;
6. concurrent terminal transition with one winner;
7. lock release racing terminal persistence;
8. duplicate and replay behavior;
9. commit ambiguity requiring manual review;
10. serialization/deadlock retry only before proven mutation;
11. session loss while a lock is held;
12. runtime-role privilege denial;
13. migration/runtime role separation;
14. backup/restore rehearsal;
15. evidence retention after test completion.

The current package produces none of this evidence and executes none of these scenarios. Cleanup remains manual and evidence-preserving when an outcome is ambiguous; automatic deletion or retry is prohibited.

The future-only scenario-evidence schema fixes the scenario sequence, package-summary and test-database-gate ID/hash pairs, sanitized database fingerprint hash, expected and observed result categories, expected and observed affected rows, winner count, mutation observation, prior/resulting state hashes, manual-review state, previous-evidence hash, and canonical evidence hash. The matching run-summary schema fixes scenario order, first/last evidence hashes, complete hash-chain validation, and all fixed-false authority fields.

Pure validators now check a sanitized synthetic scenario fixture, the contiguous 15-item chain, and the final run summary. The first previous-evidence hash must be the zero hash, every later value must bind the immediately preceding evidence hash, and all package, gate, and fingerprint bindings must remain identical across the run. Missing, extra, duplicate, reordered, or tampered scenarios block. `commit_ambiguity_manual_review` alone requires null winner/mutation observations plus mandatory manual review; null is blocked in ordinary single-winner scenarios. No real evidence record or run summary is generated, persisted, or accepted by a database in this step.

## Fixed-false boundary

All 24 public authority fields remain explicitly false in ready, blocked, idle, CLI-argument rejection, and CLI-exception results. In particular, provider connection, test/production database connection, SQL execution, schema mutation, migration, credential use, claim/lock mutation, receipt consumption, file writing, Git operations, deployment, publication, pointer mutation, rollback, and loader activation are unauthorized.
