# Step 114-2X-N non-executing invocation receipt candidate

## Receipt candidate boundary

Successful offline verification may assemble a deterministic receipt candidate in memory. The candidate binds the Step M verification summary, authority package, approval response, Step N invocation, invoker allowlist, verification policy, invoker key ID, sanitized identity hash, signature digest, scope, role, exact operation order, counts, observation window, request/response/invocation nonces, and issue/expiry timestamps.

The candidate is not a durable receipt, claim, lock, token, runtime credential, or executable authority. It is not persisted and no runtime route, DB client, provider adapter, or observation executor accepts it in Step N.

## Replay and chronology

The prior-invocation nonce context must be a canonical sorted, unique SHA-256 array. The invocation nonce must differ from the Step L intake nonce, Step H request nonce, and Step M response nonce. Replay blocks.

Invocation issuance must not precede the Step M authority package, approval response, Step H request, or observation window. Expiry must remain within the Step M authority, Step H request, Step L intake, Step K template, observation window, and invoker validity. Lifetime is limited to 45 seconds with an explicit 30-second evaluation skew.

## Fixed-false boundary

Waiting, verified-synthetic, blocked, CLI-failure, and exception results keep all Step M authority fields false and add fixed false values for invocation recording, signature consumption, invocation consumption, real invocation recording, and receipt persistence boundaries. In particular:

- live-observation invocation is not recorded, consumed, or activated;
- environment observation and provider/database connection remain unauthorized and unexecuted;
- credential use, SQL, migration, scenario, evidence, and disposal remain unauthorized;
- no claim, lock, durable receipt, commit, push, merge, deployment, or publication authority is granted.

`syntheticValidationOnly=true`, `nonExecuting=true`, and `rawMaterialPresent=false` are exact sealed receipt fields.

## Synthetic fixture rule

Tests create separate approver and invoker Ed25519 key pairs and signatures only in process memory. The core cannot create keys or signatures, and no private key, seed, real signature, or real signer identity is committed or persisted.
