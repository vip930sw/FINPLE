# Step 114-2X-J Operator Environment-Class Decision

## Purpose

This package validates a future, explicit, sanitized human decision against the exact merged Step 114-2X-I selection package. It does not select, store, infer, or provision an environment. The default and zero-input state is `awaiting_operator_environment_class_decision`.

## Public states

- `awaiting_operator_environment_class_decision`
- `operator_environment_class_decision_validated`
- `blocked`

Only a caller-supplied synthetic test fixture can reach the validated state in committed tests. The production CLI accepts no arguments and cannot accept or emit a decision receipt.

## Direct upstream validation

The validator directly calls the merged Step I validators for the criteria, candidate matrix, decision policy, provisioning runbook, selection summary, and complete upstream package. It compares the rebuilt Step I summary canonically and binds every relevant ID/hash pair. It also verifies:

- the exact three abstract candidate classes;
- the ordered 14 criteria and weight total of 100;
- the exact candidate totals and deterministic, tie-free ranking;
- the exact 11-step provisioning sequence;
- the transitive Step H/G bindings, including the 12-step execution plan and 15-scenario scope.

Version-only, weakened-and-resealed, reordered, substituted, missing, or extra upstream material fails closed.

## Decision receipt contract

Contract version:

`metrics-cutover-operator-environment-class-decision-receipt-v1-step114-2x-j`

The receipt uses exact keys, canonical JSON, domain-separated ID/hash sealing, an explicit evaluation clock, and sorted unique SHA-256 prior-nonce context. It requires one explicit abstract class matching the highest-ranked Step I candidate, plus SHA-256-only rationale, attestation, and nonce fields. Canonical UTC timestamps, maximum lifetime, clock skew, expiry, and replay are validated.

Committed fixtures are always marked `syntheticValidationOnly=true`, `rawMaterialPresent=false`, and `providerSpecificMaterialPresent=false`. Ambiguity requires manual review and blocks validation. No real operator decision or selected environment is committed.

## Prohibited material and actions

Provider or product identity, pricing, account/project/service identifiers, endpoints, ports, database identifiers, credentials, certificates, operator identity, paths, screenshots, commands, SQL, and raw decision material are forbidden. The module has no filesystem, environment-variable, stdin, current-clock, network, DNS, TLS, database, container, child-process, provider SDK, or deployment capability.
