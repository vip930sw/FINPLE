# Step 114-2X-L Live-Observation Approval Request Preparation

Date: 2026-07-19
Issue: #299

## Reused request envelope

Step L does not define a competing request envelope. It reuses and directly validates the exact Step H contract:

```text
metrics-cutover-live-observation-approval-request-envelope-v1-step114-2x-h
```

The builder copies only Step H-permitted sanitized fields. All required sanitized intake hashes and observation-window timestamps remain bound to the validated synthetic intake. The Step K disposal deadline is validated in the intake, while the Step H request uses its existing non-authorizing `within_operator_approved_window` request classification.

The request operation order remains exactly:

1. `observe_one_sanitized_disposable_environment`
2. `validate_observation_package_offline`
3. `prepare_one_time_authorization_request`

The maximum observation count is one. The request nonce must differ from the intake nonce, both replay contexts must be canonical sorted unique SHA-256 arrays, and request expiry cannot outlive the Step K template or Step L intake.

## Non-authorizing boundary

The envelope always keeps:

```text
approvalRequested=false
approvalGranted=false
rawMaterialPresent=false
```

It is built only in sanitized synthetic tests. Nothing sends, signs, persists, approves, or consumes it. No observation, connection, authorization, SQL, migration, scenario, evidence, disposal, Git, production, runtime, or deployment authority is created.
