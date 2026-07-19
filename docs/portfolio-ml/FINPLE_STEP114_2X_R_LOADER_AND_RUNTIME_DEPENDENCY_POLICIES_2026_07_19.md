# Step 114-2X-R loader and runtime dependency policies

## Adapter-loader policy

The loader policy is a declaration-only boundary. It binds exactly one immutable future artifact to the Step Q manifest ID/hash, artifact ID and SHA-256, source-tree SHA-256, capability-manifest SHA-256, and adapter-interface version. Digest verification must precede any future load. Fallback artifacts, version/hash substitution, dynamic discovery, automatic retry, and ambiguous-outcome retry are forbidden; uncertainty requires operator review.

The policy keeps `artifactBytesRead`, `artifactDigestVerified`, `moduleResolved`, `adapterRuntimeLoaded`, and `loaderInvoked` false. Step R performs no filesystem lookup, `require.resolve`, dynamic import, module resolution, artifact inspection, or loader call.

## Runtime dependency policy

The atomic claim descriptor binds the Step P/Q claim key and claim nonce, exact namespace and expiry, compare-and-set atomicity, and at most one successful acquisition. Duplicate and replay outcomes are rejected. Ambiguous or failed outcomes cannot be retried automatically. Runtime binding, store access, claim request, creation, and persistence remain false.

The transport descriptor binds the Step P adapter interface and Step O adapter capability policy. It permits exactly one future sanitized, read-only observation sequence against one disposable destination and preserves the exact operation, category, hash-output, and canonical-timestamp order. Writes, DDL, DML, mutation, migration, scenarios, production access, provider mutation, credential echo/persistence, raw output, and retry are forbidden. External transport binding, connection opening, and adapter invocation remain false.

Receipt, evidence-finalization, and disposal descriptors use namespaces distinct from the claim namespace and from one another. Each requires later-stage authorization. Store/coordinator access, persistence, finalization, disposal request, and disposal execution remain false.

## Non-execution guarantee

All descriptors are sanitized synthetic contracts. They neither locate nor bind a real dependency. No provider, network, DNS, TLS, HTTP, socket, PostgreSQL, database, credential, certificate, SQL, migration, scenario, evidence store, receipt store, claim store, or disposal coordinator is accessed.
