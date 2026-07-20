# Step 114-2X-V single-use execution envelope

## Purpose

The Step V envelope is a deterministic sanitized handoff record. It proves only that one signed external execution approval was verified against the exact merged Step U/T/S contract. It does not call the Step T runner, consume an approval, acquire a lease or claim, invoke an adapter, perform an observation, persist runtime evidence, or dispose an environment.

## Envelope binding

The domain-separated envelope ID/hash binds:

- merged main SHA;
- signed approval ID/hash and exact approver allowlist ID/hash;
- approval role, scope, signer key ID, sanitized identity hash, and public-key fingerprint;
- Step U evidence-handoff ID/hash;
- Step U runtime-material manifest ID/hash;
- Step U runtime-material inventory ID/hash;
- all 21 Step T operation-plan entries and the operation-plan hash;
- Step S launch package ID/hash;
- ceremony nonce, prior nonce context digest, and approval nonce;
- confirmation, operator authorization, and invocation ID/hash pairs;
- exact lease and claim request operation identities;
- destination count one and observation count one;
- approval issue/expiry, upstream expiry, and effective execution expiry;
- `singleUse=true`;
- fixed-false execution and mutation authority.

The envelope contains no public-key PEM, signature bytes, artifact bytes, credential, token, certificate, endpoint, provider/account/database identity, source path, raw observation, stack trace, or command output.

## Fixed false

These fields remain false in public results, the envelope, and its summary:

- `externalExecutionPerformed`
- `runnerInvoked`
- `capabilityMethodInvoked`
- `providerMutationAllowed`
- `productionMutationAllowed`
- `automaticRetryAllowed`
- `fallbackAllowed`
- `automaticTriggerAllowed`
- `runtimeRouteAdded`
- `cronAdded`
- `workerAdded`
- `deploymentWorkflowChanged`
- `rawMaterialPresent`

The execution-envelope summary is independently domain-separated and canonically reconstructed from the envelope. Any field, ID, hash, expiry, count, validation marker, or authority drift blocks its validator.

## Operator review

Before considering any later step, an operator must independently recheck the envelope expiry, approval nonce replay context, single-use identities, target isolation, kill switch, cancellation/deadline support, disposal readiness, and the continuing absence of production/provider mutation authority. PR merge, CI success, Vercel success, or a Step V verified state must never be interpreted as a trigger.

## Prohibited actions

During Step V, do not invoke `runControlledLiveObservation` or any injected capability; connect to a provider, endpoint, database, DNS, TLS, HTTP, socket, or PostgreSQL service; read credentials, tokens, certificates, or environment secrets; execute SQL/DDL/DML/migration/scenario work; write production CSVs; mutate loader selectors/pointers or Step 4/5/6 behavior; add a runtime route, cron, worker, deployment workflow, fallback, retry, or automatic trigger; or mark the PR Ready or merge it.
