# Step 114-2X-J Non-Authorizing Provisioning Request Runbook

## Boundary

The provisioning request is a sanitized, synthetic validation artifact. It binds a validated test-only decision receipt to the exact Step I runbook but grants no authority to research a provider, select a real target, provision, observe, connect, migrate, execute scenarios, collect live evidence, dispose, publish, or deploy.

## Bound future sequence

The request preserves the exact Step I order:

1. `confirm_selected_environment_class`
2. `create_new_disposable_environment_outside_source_control`
3. `verify_no_finple_application_binding`
4. `configure_exactly_one_observation_destination`
5. `create_new_empty_or_approved_disposable_namespace`
6. `provision_distinct_migration_and_runtime_credentials`
7. `verify_runtime_denied_privileges`
8. `set_expiry_rotation_revocation_and_destruction_controls`
9. `assign_environment_disposal_responsibility_and_deadline`
10. `produce_sanitized_intake_hashes_offline`
11. `request_separate_live_observation_approval`

This is descriptive future ordering only. The sequence is not activated. Skip, reorder, duplication, or extension fails closed.

## One-time request context

The request requires an explicit SHA-256 request nonce, a sorted unique prior-request-nonce array, canonical expiry not exceeding the receipt expiry, and a SHA-256 external-operator-only attestation. No persistence or nonce store is implemented.

## Fixed-false authority

The request enforces false for:

- provider research, provider selection, and provider account access;
- real target selection and environment provisioning;
- credential provisioning or use;
- observation authorization or execution;
- provider, test-database, or production-database connection;
- one-time authorization issue or issuance;
- provisioning-runbook activation;
- SQL, migration, or scenario execution;
- evidence collection;
- environment disposal authorization or execution;
- commit, push, merge, deployment, or production publication.

Default, idle, blocked, CLI-failure, and exception results additionally keep selection-decision recording, human-selection recording, and real-environment-class selection false.
