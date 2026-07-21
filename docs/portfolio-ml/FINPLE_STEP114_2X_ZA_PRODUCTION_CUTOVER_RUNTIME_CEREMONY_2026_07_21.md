# FINPLE Step 114-2X-ZA production cutover runtime ceremony

## Purpose

Step ZA prepares and validates a non-executing runtime ceremony for one later,
separately authorized invocation of the merged Step Z executor. The contract is
bound to main `6fee85ba9e676336b4fa458880b15d9c8918795a` and directly reconstructs the
complete Step Z/Y/X/W/V/U/T/S chain before accepting any runtime material.

This ceremony is readiness evidence only. It does not approve execution, acquire
or terminalize a claim, call the executor, invoke a capability, read production
files, write a CSV, mutate a selector, activate a loader, or deploy anything.

## Public states

- `awaiting_external_production_cutover_runtime_material`
- `ready_for_explicit_production_cutover_execution`
- `blocked`

Zero input and the zero-argument CLI return the awaiting state. CLI arguments are
rejected; the CLI has no execution mode.

## Direct validation

The evaluator validates, without invoking supplied methods:

- the merged ZA main identity and the exact merged Step Z contract;
- Step Z public states, operation trace, operation identities, capability method
  sets, hard timeout, cooperative cancellation, read-only reconciliation, exact
  idempotency namespace, sanitization, and fixed-false policies;
- canonical Step Y approval and unconsumed single-use envelope;
- Step X reconciliation evidence, readiness package, and readiness summary;
- the bound Step W/V/U/T/S closeout, approval, envelope, handoff, evidence,
  receipt, closure, and launch identities;
- US then KR candidate content, schema, dataset, package, row, and byte identities;
- selector preimage and expected postimage identities;
- repository head, tree, preimage, tracked-path, target-absence, and no-drift
  attestations;
- authority, invocation, nonce, chronology, and effective expiry bindings;
- the exact Step Y ten-operation future order and Step Z execution/rollback plan;
- all no-retry, no-second-attempt, no-loader, no-deployment, no-provider, no-DB,
  no-network, and no-raw-material constraints.

## Runtime-material inventory

Exactly seven dependency-injected capabilities are required:

1. `singleUseCutoverEnvelopeStore`
2. `cutoverClock`
3. `cutoverPreimageReader`
4. `atomicProductionCsvReplacer`
5. `selectorMutationCoordinator`
6. `cutoverReceiptStore`
7. `rollbackCoordinator`

Each entry binds the exact descriptor and method-set identities, runtime artifact,
source tree, capability manifest, namespace, idempotency, timeout, cancellation,
reconciliation, and sanitization policies. Validation checks only descriptor
shape, function presence, policies, and external material-presence attestations.
No method is called.

Target and selector paths are never emitted. The sealed output represents them
only as domain-separated sanitized identities. Raw bytes, credentials, endpoints,
commands, filesystem discovery, private keys, provider/account/database identities,
and raw material are forbidden.

## Operator checklist

The ready state requires explicit confirmation that:

- the merged main and Step Z/Y identities are current;
- the Step Y envelope remains unconsumed and unexpired;
- both production targets match the bound absent/preimage state;
- the selector matches its bound preimage;
- US and KR candidates match every sealed identity;
- rollback material and restoration verification are available;
- CSV replacement and selector mutation are isolated to the exact bound targets;
- automatic retry, a second attempt, loader activation, and deployment are disabled;
- receipt persistence and claim terminalization are available;
- readiness did not imply or perform a separate explicit operator invocation.

An incomplete or contradictory checklist returns `blocked` and emits no handoff.

## Failure classifications

- `blocked_before_runtime_material_validation`: main, Step Z contract, capability
  shape, or the directly reconstructed Z-to-S chain failed validation.
- `blocked_during_runtime_material_validation`: external material, preimage,
  candidate, operation, nonce, chronology, expiry, availability, or authority
  evidence failed validation.
- `blocked_during_operator_checklist_validation`: runtime material was valid but
  an operator confirmation was absent or contradictory.

All blocked results remain non-executing, require no manual mutation, retain zero
capability invocation counts, and contain no completed handoff.

## Safety invariants

The implementation imports no filesystem, HTTP, network, child-process, provider,
database, credential, SQL, migration, scenario, loader, route, cron, worker,
trigger, or deployment capability. Tests use deterministic synthetic in-memory
descriptors and the existing isolated synthetic Step Z fixture only.
