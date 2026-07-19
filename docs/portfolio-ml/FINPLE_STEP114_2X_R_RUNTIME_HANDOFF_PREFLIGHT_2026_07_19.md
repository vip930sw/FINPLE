# Step 114-2X-R runtime handoff preflight

## Scope

Step 114-2X-R prepares a transport-neutral, non-executing handoff for a future operator-controlled, single-use live-observation run. It revalidates the complete Step Q package and summary and directly invokes the relevant Step P, O, N, M, L, and H validators before any handoff can be prepared.

The public states are exactly:

- `awaiting_external_live_observation_runtime_handoff_inputs`
- `live_observation_runtime_handoff_prepared`
- `blocked`

Zero input and CLI default to `awaiting_external_live_observation_runtime_handoff_inputs`.

## Versioned contracts

The package seals six exact, versioned contracts with canonical domain-separated identifiers and hashes:

1. runtime-handoff input
2. adapter-loader policy
3. runtime-dependency policy
4. runtime-precondition manifest
5. non-executing one-run handoff
6. runtime-handoff summary

The input binds the Step Q manifest and artifact identity, Step P adapter and claim interfaces, Step O policy and claim expiry, Step N invocation window, and the inherited Step M/L/H request and approval chain. Its synthetic descriptors cover loader, claim, read-only transport, receipt, evidence finalization, and disposal. No raw endpoint, credential, certificate, provider, account, project, service, database, schema, or table identity is accepted.

## Chronology and replay boundary

The evaluation clock must satisfy the half-open interval:

```text
observationWindowStartsAt <= evaluationClockInstant
evaluationClockInstant < min(
  operatorAuthorization.expiresAt,
  claimExpiresAt,
  executorInput.expiresAt,
  invocation.expiresAt,
  observationWindowExpiresAt
)
```

The runtime-handoff nonce must be distinct from the request, intake, approval-response, invocation, claim, and operator-authorization nonces. Prior runtime-handoff nonce hashes must be a canonical sorted, unique SHA-256 array; a current-nonce replay blocks the package.

## Exact handoff sequence

1. `step_q_package_revalidated`
2. `runtime_handoff_input_validated`
3. `adapter_loader_policy_validated`
4. `runtime_dependency_policy_validated`
5. `artifact_identity_attestation_prepared`
6. `single_use_claim_binding_prepared`
7. `read_only_transport_binding_prepared`
8. `receipt_persistence_binding_prepared`
9. `evidence_finalization_binding_prepared`
10. `environment_disposal_binding_prepared`
11. `one_run_runtime_handoff_prepared`

Skipping, reordering, duplicating, or extending this sequence is invalid.

## Authority boundary

This preflight does not record or consume an authorization or invocation, inspect or load artifact bytes, bind runtime dependencies, request or acquire a claim, invoke an adapter, observe an environment, open a connection, handle credentials or certificates, execute SQL/migrations/scenarios, persist evidence or receipts, or dispose of an environment. All such authority remains fixed false and requires a later, separately authorized stage.
