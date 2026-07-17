# Step 114-2X-D real-adapter implementation preflight audit

Date: 2026-07-17
Baseline: `5c37b155c7baca468125023f69ac822c08242169`
Branch: `codex/step114-2x-d-real-adapter-preflight`

## Scope and contracts

This change adds validation-only, provider-neutral contracts:

- `metrics-cutover-production-persistence-decision-v1-step114-2x-d`
- `metrics-cutover-postgresql-schema-plan-v1-step114-2x-d`
- `metrics-cutover-transaction-semantics-plan-v1-step114-2x-d`
- `metrics-cutover-credential-boundary-plan-v1-step114-2x-d`
- `metrics-cutover-migration-runbook-v1-step114-2x-d`
- `metrics-cutover-real-adapter-implementation-preflight-summary-v1-step114-2x-d`

Every contract uses exact-key validation, deterministic canonical JSON, domain-separated identity/hash derivation, and exact cross-plan ID/hash binding. The packet includes a validated sanitized Step 114-2X-B preparation summary, and its summary hash is bound into every supporting plan and the final summary. Blocked and idle results suppress the summary.

## Step 114-2X-C compatibility

- Claim methods remain exactly `acquireClaim`, `readClaim`, and `transitionClaimTerminal`.
- Lock methods remain exactly `acquireLock`, `readLock`, and `releaseLock`.
- The sealed claim-store and repository-lock protocol objects are included in the packet and validated with the merged Step 114-2X-C validators.
- Transaction and final-summary contracts bind both protocol hashes; the transaction also binds the exact methods and lock release-input fields.
- Claim and lock identities are immutable; state/version changes produce new record hashes.
- Receipt and repository bindings remain immutable.
- Lock release requires the exact durably observed terminal claim evidence.
- Operation order remains lock, claim, terminal claim, then lock release.
- Synthetic conformance is explicitly not real-provider validation.
- A future real adapter must pass the same semantics plus independently authorized database-specific tests.

## Safety boundary

The core module imports no filesystem, child-process, network, provider, or database client. The check CLI accepts no arguments, stdin, environment fallback, connection material, or input files. It constructs only a sanitized provider-neutral fixture and validates it in memory. Ready, blocked, idle, forbidden-argument, and runtime-exception results all use the core fixed-false result boundary; blocked results suppress the summary and raw error or argument material.

No database/provider connection, SQL, DDL, migration, schema/table creation, credential use, real claim, real lock, receipt consumption, cutover executor, target/selector write, Git mutation, deployment, or activation occurred.

All public authority fields remain false, including provider connection, schema mutation, migration, credential use, production claim eligibility, file write, commit, push, merge, deployment, publication, pointer mutation, rollback, and loader activation.

## Validation results

- Step 114-2X-D focused: 38 passed, 0 failed.
- Step 114-2X-C standalone: 49 passed, 0 failed.
- Step 114-2X-B standalone: 31 passed, 0 failed.
- Step 114-2X-A standalone: 24 passed, 0 failed.
- Step 114-2W standalone: 68 passed, 0 failed.
- Combined Step 114-2W + 2X-A + 2X-B + 2X-C + 2X-D: 210 passed, 0 failed.
- Combined Step 114-2Q through 2X-D: 589 passed, 0 failed.
- Combined Step 114-2N through 2X-D: 793 passed, 0 failed.
- Python Step 114-2M candidate-package tests: 16 passed, 0 failed.
- Python metrics discovery: 48 passed, 0 failed.
- `npm.cmd run check:scenario-metrics`: 80 passed, 0 failed.
- `npm.cmd run build`: passed (only the existing bundle-size advisory was emitted).
- `npm.cmd run check:ai-production`: passed.
- Diff checks: passed before commit; staged checks will be repeated immediately before commit.
- Original implementation clean-head repository-wide `node --test --test-reporter=dot`: timed out at the 120-second bound after 86 dot-reporter progress markers; 0 actual failures were emitted before timeout.
- Corrective-review clean-head repository-wide `node --test --test-reporter=dot`: timed out at the 120-second bound after emitting one failure marker. A bounded spec-reporter diagnostic reproduced 2,143 pass markers and one actual failure before timeout: the unrelated existing `Step228 checker passes and leaves working tree unchanged` test reported `snapshot format is not canonical`. The historical Step228 checker was not modified.
