# Step 114-2X-T controlled live-observation runner

## Boundary

Step 114-2X-T supplies an explicit dependency-injected orchestration core for one guarded, sanitized, read-only observation against a disposable-environment capability. The repository implementation cannot discover or construct a provider, network, database, credential, certificate, endpoint, runtime route, worker, or deployment dependency. Zero input and the CLI default remain `awaiting_external_controlled_live_observation_execution`.

The only public states are:

- `awaiting_external_controlled_live_observation_execution`
- `controlled_live_observation_execution_completed`
- `blocked`

## Direct Step S validation

Before any injected capability is called, the runner calls every exposed Step S validator directly: Step R package, confirmation context, confirmation policy, confirmation shape, signed confirmation, runner manifest, launch package, and summary validation. It normalizes the allowlist, reruns `evaluateRunnerLaunchPackage`, and requires canonical equality for both the supplied launch package and summary.

The runtime clock is canonical UTC, must equal the explicitly supplied execution instant, and must be strictly earlier than the Step S effective launch expiry. Equality is expired and blocked. The injected clock is read again immediately before lease acquisition, claim acquisition, observation, receipt persistence, and evidence persistence. A mid-run expiry blocks the next capability before it is invoked.

## Capability interfaces

The exact capability bundle contains `runtimeArtifactSource`, `runnerArtifactLoader`, `adapterArtifactLoader`, `singleUseExecutionLeaseStore`, `atomicClaimStore`, `readOnlyObservationTransport`, `executionReceiptStore`, `evidenceFinalizer`, `environmentDisposalCoordinator`, and `executionClock`. Each capability has an exact method set and a domain-separated descriptor hash. Its descriptor fixes automatic retry, fallback, external discovery, provider mutation, and production mutation to false and declares a hard 5,000 ms timeout that the common invocation wrapper enforces. It also binds cooperative cancellation, deadline enforcement, read-only post-timeout outcome reconciliation, the exact `aborted`, `not_committed`, `committed`, and `ambiguous` terminal outcomes, and the operation context fields `operationId`, `idempotencyKey`, `deadline`, and `abortSignal`.

Mutability is capability-specific. The transport is external-target read-only; lease and claim stores permit only their exact atomic namespaces; receipt and evidence capabilities permit only sanitized named-namespace persistence; disposal permits only mutation of the bound disposable environment. Artifact readers/loaders and the injected clock have immutable/no-mutation modes. A global `readOnlyOnly` assertion is not used for mutation-bearing safety capabilities.

Every external exception and timeout is converted at the wrapper boundary to a fixed stage-specific issue code. External error messages and stacks are discarded and cannot enter the public result, receipt, evidence, or closure receipt. The per-call deadline is no later than the minimum of the descriptor hard timeout and the remaining Step S effective lifetime. A timeout aborts the cooperative signal, never retries, and performs one read-only lookup by operation ID/idempotency key. A late committed lease is treated as acquired for mandatory terminalization even though the primary call timed out.

Runner and adapter bytes are returned only by the injected artifact source. The core computes SHA-256 in memory and checks exact equality with the signed Step S runner manifest and signed Step Q adapter manifest before either loader can run.

## Atomic use and failure semantics

The execution lease and claim must each return one unambiguous `acquired` result. Confirmation, operator authorization, and invocation are then consumed exactly once, in that order. Any other lease, claim, or consumption outcome blocks before the adapter. No operation retries or falls back.

Failures are classified as `blocked_before_runtime_binding`, `blocked_before_lease`, `blocked_before_observation`, `blocked_after_observation`, or `disposal_uncertain`. Once runtime dependencies have been bound, a finally-equivalent disposal call is attempted even when a later step fails. For an observation timeout, disposal is forbidden until reconciliation returns an `aborted` or `settled` acknowledgment. Missing acknowledgment, failed or ambiguous disposal, and an abort-ignoring transport are always manual-review `disposal_uncertain` outcomes.

The transport contract is exactly `disposable_environment_read_only_observer`, one destination, one observation, and the signed Step Q operation/category order. Output may contain only required sanitized SHA-256 placeholders and canonical timestamps. Raw material, writes, SQL, DDL, DML, migration, scenario execution, production access, shared-environment access, retries, or a second invocation are not represented or allowed.

## Runtime sequence

1. `step_s_package_revalidated`
2. `runtime_capabilities_validated`
3. `runner_artifact_bytes_read`
4. `runner_artifact_digest_verified`
5. `adapter_artifact_bytes_read`
6. `adapter_artifact_digest_verified`
7. `runtime_dependencies_bound`
8. `single_use_execution_lease_acquired`
9. `single_use_claim_acquired`
10. `execution_confirmation_consumed`
11. `operator_authorization_consumed`
12. `invocation_consumed`
13. `runner_loaded`
14. `adapter_loaded`
15. `read_only_observation_invoked_once`
16. `sanitized_observation_validated`
17. `sanitized_execution_receipt_persisted`
18. `sanitized_evidence_finalized`
19. `environment_disposal_completed`
20. `controlled_live_observation_execution_completed`

The sequence is emitted only when those exact transitions occur; a skip, reorder, duplicate, extension, second adapter invocation, or incomplete disposal cannot produce the completed state.
