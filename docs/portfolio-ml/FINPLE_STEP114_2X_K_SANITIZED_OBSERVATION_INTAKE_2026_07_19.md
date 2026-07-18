# Step 114-2X-K Sanitized Observation-Intake Template

## Non-authorizing template

The Step K output is a template definition, not a collected observation intake. It binds a valid synthetic provisioning-evidence fixture to the exact Step J request and Step H sanitized-intake schema without populating any endpoint, database fingerprint, certificate fingerprint, observer attestation, observation-window timestamp, credential, provider identity, or raw value.

Contract version:

`metrics-cutover-sanitized-environment-observation-intake-template-v1-step114-2x-k`

## Exact Step H scope

The template preserves:

- the Step H sanitized-intake schema ID/hash;
- exact allowed-field order;
- exact required hash-placeholder order;
- exact required timestamp-placeholder order;
- allowed target-purpose and namespace classifications;
- exact destination count of one;
- credential attestation categories;
- credential-boundary ID/hash and exact runtime denied privileges;
- disposal-policy ID/hash and strict deadline categories;
- a separate live-observation approval prerequisite.

Skip, addition, reorder, substitution, weakening, or resealing of any Step H source contract blocks the template.

## Fixed false template fields

- `intakeCollected=false`
- `observationRequested=false`
- `observationApproved=false`
- `observationExecuted=false`
- `requestAuthorizesObservation=false`
- `requestAuthorizesConnection=false`

The template uses an explicit evaluation clock, bounded expiry, and a strict sorted/unique prior-template-nonce context. No nonce persistence, approval request, connection, observation, or evidence collection is implemented.
