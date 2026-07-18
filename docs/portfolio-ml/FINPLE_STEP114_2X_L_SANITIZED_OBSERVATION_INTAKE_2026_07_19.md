# Step 114-2X-L Sanitized Observation Intake

Date: 2026-07-19
Issue: #299
Baseline: `c85927967ff1c06d9400a580a7bf3a74771b6c2a`

## Purpose

This package validates only the shape and bindings of a caller-supplied synthetic sanitized observation-intake fixture. It does not collect, infer, persist, or attest a real intake or observation.

The strict record contract is:

```text
metrics-cutover-sanitized-environment-observation-intake-record-v1-step114-2x-l
```

It binds the complete Step K summary, evidence, and intake template; the inherited Step J request; and the exact Step H intake, credential, and disposal contracts. The validator directly revalidates the complete Step K package and summary and every required Step H policy and summary.

## Exact state boundary

Only these public states exist:

```text
awaiting_external_sanitized_observation_intake
sanitized_observation_intake_validated
blocked
```

Zero input remains `awaiting_external_sanitized_observation_intake`. A successful synthetic validation means only that the sanitized shape and bindings validate. It does not mean a real environment exists, an intake was recorded, an observation occurred, or authority was granted.

## Pure validation

The core accepts explicit objects, explicit evaluation time, and sorted unique prior nonce hashes. It has no current-clock, filesystem, environment-variable, stdin, network, DNS, TLS, HTTP, database, PostgreSQL, container, child-process, provider SDK, approval/signing service, or deployment capability.

Provider/product/price, account/project/service, endpoint/hostname/IP/port/URL, database/schema/table identity, credential/certificate/secret, operator/path/screenshot/command/SQL, raw evidence, and raw material are outside the exact-key contract and fail closed.
