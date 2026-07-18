# FINPLE Step 114-2X-G Disposable Test-Database Execution Plan

Date: 2026-07-18
Issue: #287
Baseline: `48920bb7d912f8a2208a57d1047cf25a0a5c5ada`

## Outcome

This step prepares a fail-closed, validation-only plan for a possible future disposable PostgreSQL conformance run. It does not select a target, observe an environment, issue or consume authorization, read credentials, connect to a database, execute SQL, apply a migration, run a scenario, roll back, or collect evidence.

The only successful public state is `disposable_test_database_execution_plan_prepared`. `blocked` and `idle` remain non-authoritative. A prepared result means the static contracts are internally consistent; it is not execution authority.

## Upstream binding

The plan directly revalidates the complete Step 114-2X-F preparation packet:

- exact `environment`, `network`, `database`, `certificate`, `credential`, and `authorization` contracts;
- Step 114-2X-F preparation summary ID/hash binding;
- Step 114-2X-E migration specification, package summary, test-database gate, and future evidence specification ID/hash pairs;
- the four future observation contract versions and future one-time authorization envelope version;
- the exact 15-scenario count and order from the PostgreSQL test package.

Future observations and a future execution manifest must bind the same sanitized `environmentBindingHash`, ordered `observationSetHash`, database/namespace evidence hash, authorization envelope, package summary, and test-database gate. Raw endpoint, host, IP, database identity, certificate material, credentials, and provider material are forbidden.

## Prepared contracts

The implementation defines and seals these exact contract versions:

- `metrics-cutover-disposable-test-database-target-selection-policy-v1-step114-2x-g`
- `metrics-cutover-disposable-test-database-execution-manifest-v1-step114-2x-g`
- `metrics-cutover-disposable-test-database-sequence-policy-v1-step114-2x-g`
- `metrics-cutover-disposable-test-database-rollback-prerequisite-policy-v1-step114-2x-g`
- `metrics-cutover-disposable-test-database-evidence-collection-plan-v1-step114-2x-g`
- `metrics-cutover-disposable-test-database-execution-preflight-summary-v1-step114-2x-g`

Each value uses exact keys, canonical JSON, domain-separated SHA-256 IDs/hashes, and direct field-by-field comparison with its expected static policy.

## Target-selection boundary

The only eligible future target class is one new, empty, isolated, disposable namespace used solely for conformance. Production, staging, shared development, application storage, analytics storage, wildcard destination selection, and target substitution after authorization are forbidden. This step leaves `targetSelected=false`.

## Exact future sequence

If a later separately approved execution step is ever opened, it must preserve this serial order without skips, duplicates, reordering, parallelism, automatic retry, second connection, or delete/reset-to-retry:

1. `validate_bound_observation_package`
2. `validate_bound_one_time_authorization`
3. `validate_credential_injection_boundary`
4. `acquire_single_use_execution_claim`
5. `connect_once_to_disposable_test_database`
6. `verify_pre_migration_namespace_state`
7. `apply_exact_bound_migration_package`
8. `verify_post_migration_schema_state`
9. `execute_exact_15_scenario_conformance_run`
10. `collect_sanitized_hash_chained_evidence`
11. `revoke_and_expire_test_credentials`
12. `finalize_single_use_execution_receipt`

The sequence is descriptive policy only. No step is activated here.

## Future manifest validator

`validateExecutionManifest(value, context, evaluationClockInstant)` is pure and fail-closed. It revalidates all Step F contracts and the one-time authorization envelope before accepting a sanitized synthetic manifest. It enforces:

- exact keys, contract version, canonical ID/hash, package/gate/policy bindings;
- all four observation ID/hash bindings and a single environment/observation set;
- database/namespace evidence cross-binding;
- exact 15-scenario and authorized-operation order;
- single execution scope, nonce uniqueness, canonical sorted prior-nonce context;
- authorization-before-manifest chronology, bounded lifetime, expiry, and evaluation clock;
- sanitized approver hash, `rawMaterialPresent=false`, and consistent manual review.

The validator never generates or consumes an execution manifest. Tests use sanitized synthetic values only.

## Fixed-false authority

All Step 114-2X-F authority fields remain false. Step G additionally fixes these fields false:

- `executionPlanActivated`
- `executionManifestConsumed`
- `rollbackPlanActivated`
- `evidenceCollectionStarted`

The preflight summary also fixes target selection, manifest generation/consumption, rollback preparation/execution, environment disposal, credential use, authorization use, connection, migration, scenarios, claim/lock/receipt, provider calls, production/runtime/deployment, and evidence collection to false.

## Explicit non-actions

No provider, DB, network, DNS, TLS, or certificate observation was made. No credential or authorization was read, injected, issued, or consumed. No claim, lock, receipt, SQL, DDL, migration, scenario, rollback, runtime, production, or deployment action was performed. Step228 newline files remain outside this change.
