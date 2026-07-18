# Step 114-2X-O single-use consumption and evidence contracts

## Single-use claim protocol

The non-executing policy derives one sanitized claim key from the Step N invocation ID, invocation hash, and invocation nonce hash. A later executor must acquire exactly one atomic claim through compare-and-set or an equivalent primitive before any adapter call.

The policy requires:

- distinct claim and execution-receipt namespaces;
- claim expiry bounded by the invocation and observation window;
- duplicate and replay rejection;
- failure before adapter invocation when claim acquisition fails;
- no automatic retry after ambiguous claim or adapter outcomes;
- explicit operator review for uncertainty.

Step O neither implements nor accesses a durable store. `claimCreated`, `claimPersisted`, and every corresponding authority remain false.

## Transport-neutral adapter policy

The descriptor permits one read-only, one-destination sanitized observation sequence in the exact Step H category order. It prohibits writes, DDL, DML, state mutation, migration, scenario execution, provider mutation, credential echo or persistence, raw endpoint/certificate/credential output, production database access, automatic retry, and adapter invocation in this stage.

## Evidence-manifest template

The manifest binds the Step O executor input, Step N invocation and receipt candidate, adapter policy, exact observation categories, exact Step H hash/timestamp output fields, observation window, and one destination. It is a template only: output values are unpopulated and evidence, observation, claim, invocation consumption, adapter invocation, and execution-receipt persistence remain false. Evidence finalization and disposal require later separate stages.
