# Step 114-2X-X controlled-observation evidence reconciliation

## Scope

This package is a pure, non-writing reconciliation boundary for one caller-supplied,
successfully completed Step 114-2X-W closeout. It does not call the Step T runner,
the Step W executor, a capability method, a claim store, a provider, a database, a
network transport, or a production writer.

The only public states are:

- `awaiting_external_execution_closeout_evidence`
- `production_cutover_evidence_reconciled`
- `blocked`

Zero input remains `awaiting_external_execution_closeout_evidence`.

## Direct validation

The evaluator directly reconstructs and validates the complete Step W/V/U/T/S
chain, the Step T 21-call operation plan, all ten Step T capability descriptors,
the Step W envelope-store descriptor, the single-use envelope claim, the supplied
Step T completed receipt/evidence/closure, and the Step W completion-only closeout.
No injected method is called while performing those checks.

The persisted observation is validated through the merged Step T validator. Its
ordered hash and timestamp output fields must exactly match the upstream executor
input, and each value must match the corresponding sanitized value already bound
in the upstream package. The domain-separated observation digest must equal the
Step T receipt `observationDigest`. Missing, extra, reordered, unknown, stale, or
normally resealed drift is fail-closed.

## Nonce and chronology

Prior reconciliation nonce hashes must be canonical SHA-256 values, unique, and
sorted. The fresh nonce must not be replayed and must differ from the Step U
ceremony nonce and Step V approval nonce. Reconciliation cannot predate the
observation, closure, or Step W closeout, and the evidence-intake age is bounded to
24 hours.

## Failure classifications

- `blocked_before_closeout_validation`
- `blocked_during_observation_reconciliation`
- `blocked_during_cutover_candidate_reconciliation`
- `manual_review_required`

Only fixed sanitized issue codes are returned. Raw observation values, credentials,
endpoints, provider/database identities, artifact bytes, signatures, private keys,
external error messages, stacks, source paths, and commands are not accepted or
returned.

## Authority boundary

Reconciliation proves evidence consistency only. It does not authorize a production
write, selector mutation, loader activation, deployment, retry, or second
observation. Merge, CI, Vercel success, repository ownership, and this reconciled
state are never production-write authority.
