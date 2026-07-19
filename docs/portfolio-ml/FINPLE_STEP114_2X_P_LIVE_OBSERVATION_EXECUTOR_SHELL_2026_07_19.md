# Step 114-2X-P guarded live-observation executor shell

## Boundary

This package validates only explicit sanitized synthetic objects and in-memory interface descriptors. It does not acquire or persist a claim, consume an invocation, call an adapter, observe an environment, connect to a provider or database, use credentials, execute SQL, migration, or scenarios, persist evidence or a receipt, dispose of an environment, or mutate production/runtime state.

Public state is restricted to:

1. `awaiting_external_live_observation_execution_dependencies`
2. `live_observation_executor_shell_validated`
3. `blocked`

Zero input and zero-argument CLI execution return the awaiting state with every authority false.

## Direct upstream revalidation

The shell directly invokes the Step O upstream, context, executor-input, consumption-policy, adapter-descriptor, adapter-policy, evidence-manifest, and summary validators. It additionally invokes the relevant Step N invocation, Step M approval-response, Step L intake, and Step H approval-request validators. ID/hash pairs, the NUL-terminated claim-key domain, ordered claim-key input fields, namespaces, nonce bindings, expiry bounds, observation order, and one-destination/one-observation limits remain bound to the merged Step O package.

## Pure synthetic orchestration

The production core accepts explicit dependency descriptors, deterministic outcome classifications, a sanitized synthetic adapter-output envelope, an exact execution plan, and an explicit evaluation clock. It does not accept functions, endpoints, credentials, provider material, paths, commands, or raw evidence. Hash-keyed validation caching is process-local and only reuses the result for byte-identical canonical upstream packages; changed material receives a different key and is independently revalidated.

The successful synthetic state trace is exactly:

1. `preflight_revalidated`
2. `claim_acquisition_requested`
3. `claim_acquired`
4. `adapter_invocation_requested`
5. `adapter_completed`
6. `receipt_candidate_prepared`
7. `completed`

This trace models contract order only. It does not assert that a real claim or adapter invocation occurred.
