# Step 114-2X-ZB-R production runtime bundle

## Purpose

This step adds a non-executing boundary that can validate explicitly supplied
production runtime material and seal one sanitized invocation bundle for a
later, separately authorized Step Z ceremony. It does not configure or execute
the production cutover.

The historical Step Z, ZA, and ZB versions and merged-main constants remain
unchanged. In particular, historical ZB remains `syntheticValidationOnly=true`
and cannot supply production authority.

## Public result states

- `awaiting_production_runtime_configuration_material`
- `production_runtime_invocation_bundle_verified`
- `blocked`

Zero input and the zero-argument CLI return the awaiting state. The CLI has no
execution option.

## Sanitized configuration manifest

The manifest binds the explicitly injected execution SHA and repository
head/tree identity, current-main provenance bridge, adapter manifest, approved
data-root and separate future state-root policies, predecessor and absent
versioned-target identities, candidate CSV identities, selector preimage and
postimage, platform attestation, no-op fault-injector identity, restoration
identity, exact Step Z material descriptor, operation plan, idempotency keys,
and single-use claim namespace.

It sets:

```text
productionCapable=true
productionConfigurationValidated=true
productionConfiguredForLaterExplicitInvocation=true
productionExecutionPerformed=false
```

It exposes identities only. Absolute paths, candidate or selector bytes,
restoration bytes, state contents, capability methods, private keys, public-key
PEM, and signature Base64 are not included.

## Read-only material builder

All filesystem, path, repository root, Git executable, Git object reader,
execution SHA, data root, state-root parent, candidate, selector, and provenance
inputs are explicit. There is no cwd, environment, branch, network, provider,
database, or credential discovery.

The builder verifies Git tree/blob/content membership, including the ZB-R
runtime bundle and approved no-op fault-injector factory sources, approved-root realpaths,
symlink or junction rejection, path alias rejection, existing predecessor bytes,
absent create-only versioned targets, actual CSV header/schema/content/dataset/
row/byte identities, and selector preimage/postimage reference constraints. A
platform attestation is generated only by a real isolated probe that performs
exclusive create, file write/fsync, same-directory rename, renamed-content
verification, directory-fsync capability observation, and cleanup. A caller
cannot supply a self-asserted attestation. The probe's exact five platform
capability fields must canonically equal the sealed adapter manifest before the
configuration manifest, authorization, or invocation bundle can be created.

The runtime target public paths, historical Step Z target-file paths, US/KR
ordering, selector path, selector preimage and postimage hashes, versioned
selector references, candidate identities, operation plan, and claim namespace
must all match directly before a configuration manifest can be built.

Restoration identity is derived from the two exact absent target path states and
the actual selector preimage path/content/byte count. An arbitrary restoration
hash is not accepted, and raw restoration bytes remain private.

The builder does not call `createProductionCapabilityAdapters`, create a state
directory, acquire or terminalize a claim, write a CSV, mutate a selector,
persist a receipt, rollback, activate a loader, or deploy.

## Two-phase later boundary

Phase A requires
canonical bundle, signed authorization, allowlist, nonce/clock state, private
configuration material, exact Step Z material, explicit filesystem/path/Git
objects, and the factory-branded no-op fault injector. Before any adapter
construction or state-root creation it reruns the read-only builder and isolated
probe, rebuilds the manifest, revalidates authorization/nonce/expiry, and checks
private material, immutable Step Z material, and bundle canonical equality.

Phase B accepts the complete Step Z packet and the exact seven explicitly
constructed capability objects. The adapter factory privately registers each
complete set and each capability owner with module-private weak collections;
no public object contains the brand or private path material. The read-only
factory verifier accepts only seven capabilities from one registered set.

The sanitized construction binding covers execution main/head/tree, approved-
root and state-root policies, exact target contracts, selector binding,
operation/idempotency plan, probed platform capability identity, restoration
identity, approved no-op identity, construction schema, and all seven Step Z
descriptors. Phase B requires canonical equality with the Phase A configuration
manifest in addition to exact Step Z fields, immutable packet core, top-level
object identity, descriptors, and method sets. Historical synthetic objects,
hand-built lookalikes, mixed sets, and differently configured factory sets fail
closed. The result remains a sanitized command descriptor and never invokes a
capability or executor.

PR/CI constructs the real factory only against isolated synthetic temporary
directories, synthetic bytes, and the approved no-op instance. It never uses a
production path or state root. Assembler execution, executor, capability-method,
and mutation counts remain zero.
