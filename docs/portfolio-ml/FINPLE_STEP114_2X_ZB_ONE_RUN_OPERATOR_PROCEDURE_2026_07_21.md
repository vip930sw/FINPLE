# FINPLE Step 114-2X-ZB one-run operator procedure

## Status and boundary

This document describes the later, separately authorized operator ceremony. It
is not an executable command, execution approval, cutover receipt, or evidence
that production was changed. Step ZB and its PR must remain non-executing.

The real cutover may be considered only after Step ZB is merged and the user
separately approves one invocation against the exact merged SHA, exact invocation
package identity, exact fresh operator authorization, and then-current production
preimages. Merge, CI success, Vercel success, repository ownership, or package
verification cannot supply that approval.

## Pre-invocation operator checklist

Before a later one-time command is assembled, an authorized operator must
independently confirm all of the following:

1. The checked-out main SHA equals the separately approved execution SHA.
2. The exact Step ZB invocation package ID/hash and final package seal match the
   approval record.
3. The operator authorization signature verifies against exactly one active
   allowlist entry and has not expired.
4. The authorization nonce and invocation package have not been used.
5. The Step Y single-use envelope remains unconsumed and unexpired.
6. The US and KR candidate identities still match every sealed content, schema,
   dataset, package, row, and byte identity.
7. Both target preimages and the selector preimage match the bound absent/current
   state without drift.
8. Repository head, tree, tracked-path, target-absence, and no-drift identities
   remain exact.
9. All seven capabilities are isolated to the bound targets and expose the exact
   descriptor and method sets.
10. Rollback restoration, restoration verification, receipt persistence, and
    claim terminalization remain available.
11. Automatic retry, a second cutover attempt, loader activation, deployment,
    provider/DB access, and automatic triggers remain disabled.
12. A separate explicit one-time execution instruction from the user is present.

Any missing, ambiguous, expired, consumed, or drifted item requires a fail-closed
stop. Do not construct or run the command.

## Programmatic dependency boundary

The later command boundary must receive exactly these explicit dependencies:

```text
invocationPackage
signedOperatorAuthorization
productionCutoverOperatorAllowlist
priorAuthorizationNonceHashes
evaluationClockInstant
stepZAPacket
stepZExecutionPacket
singleUseCutoverEnvelopeStore
cutoverClock
cutoverPreimageReader
atomicProductionCsvReplacer
selectorMutationCoordinator
cutoverReceiptStore
rollbackCoordinator
```

`stepZExecutionPacket` must have the exact Step Z `INPUT_FIELDS` shape and must
contain the exact canonical Step Y packet/result, merged Step Z SHA, execution
clock, and the same seven explicitly supplied capability objects already sealed
through ZA. The current evaluation clock is separate from the Step Z execution
clock and is used to re-check authorization freshness and replay at command
validation time.

No dependency may be discovered through CLI arguments, stdin, environment
variables, filesystem search, a route, cron, worker, trigger, deployment workflow,
or dynamic module loading. ZB dry validation checks this exact schema. Command
preparation constructs only a sanitized frozen descriptor and never constructs a
function, invokes the executor, or calls a capability method.

## Later one-run execution order

After separate post-merge approval, the guarded Step Z executor remains the sole
owner of the mutation sequence:

1. acquire the single-use envelope claim;
2. re-read the exact bound preimages;
3. verify no drift;
4. atomically replace the US CSV;
5. verify the US result;
6. atomically replace the KR CSV;
7. verify the KR result;
8. mutate the selector exactly once;
9. verify selector postimage and complete cutover state;
10. persist one sanitized cutover receipt;
11. terminalize the envelope claim exactly once.

The Step Z operation plan also contains explicit restoration and restored-state
verification operations for fail-closed rollback. No automatic retry or second
cutover attempt is permitted.

## Stop and escalation rules

Stop without execution if authorization verification, dry validation, preimage
revalidation, claim status, timeout/cancellation policy, rollback readiness,
receipt readiness, or terminalization readiness is uncertain. Ambiguous mutation
or rollback outcomes require manual review under Step Z and cannot produce a
completed closeout.

This PR does not run the procedure, invoke a synthetic or real Step Z executor,
access production credentials or data, perform rollback, activate a loader, or
deploy any change.
