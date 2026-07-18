# Step 114-2X-K Provisioning Evidence Validation

## Purpose

This package validates only the shape and bindings of a caller-supplied, sanitized synthetic provisioning-evidence fixture. It does not provision, identify, select, observe, connect to, or infer the existence of an environment. Default and zero-input execution remains `awaiting_external_disposable_environment_provisioning_evidence`.

## Exact public states

- `awaiting_external_disposable_environment_provisioning_evidence`
- `disposable_environment_provisioning_evidence_validated`
- `blocked`

## Direct Step J and Step H validation

The core directly calls the complete merged Step J validators for its decision context, receipt, request context, non-authorizing provisioning request, upstream package, and preparation summary. It also directly calls the merged Step H validators for readiness, sanitized intake, credential, disposal, approval, upstream, and run-package summary.

Canonical comparisons bind the Step J summary, receipt, request, selected abstract class, decision/request nonces, expiry windows, Step I runbook and exact 11-step operation order. Transitive bindings retain the Step H/G 12-step execution sequence and 15-scenario scope.

## Synthetic evidence contract

Contract version:

`metrics-cutover-disposable-environment-provisioning-evidence-v1-step114-2x-k`

The exact-key contract requires one SHA-256 completion attestation per ordered runbook operation, sanitized environment/namespace/destination binding hashes, distinct credential-category attestations, expiry/rotation/revocation/destruction attestations, the exact runtime denied-privilege set, disposal responsibility, one strict deadline category, one destination, canonical timestamps, and a single-use nonce.

Only a test-supplied fixture may set `externalProvisioningAttested=true`. It must simultaneously keep `syntheticValidationOnly=true`, `realProvisioningRecorded=false`, `environmentExistenceInferred=false`, `rawMaterialPresent=false`, and `providerSpecificMaterialPresent=false`. Validation success means only that the synthetic shape and bindings are valid.

## Capability boundary

The core has no current-clock, filesystem, environment-variable, stdin, network, DNS, TLS, HTTP, database, PostgreSQL, container, child-process, provider SDK, or deployment capability. Provider/product/price, account/project/service, endpoint/hostname/IP/port/URL, database/schema/table, credential/certificate/secret, operator/path/screenshot/command/SQL, raw evidence, and raw material fields fail exact-key validation.
