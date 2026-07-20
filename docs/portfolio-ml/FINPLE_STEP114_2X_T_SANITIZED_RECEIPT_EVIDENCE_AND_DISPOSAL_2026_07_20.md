# Step 114-2X-T sanitized receipt, evidence, and disposal contracts

The pre-disposal in-memory receipt candidate binds the Step S launch ID/hash, confirmation ID/hash, Step Q operator authorization ID/hash, Step N invocation ID/hash, Step O claim key hash, Step R precondition manifest ID/hash, a domain-separated sanitized observation digest, canonical completion time, and adapter invocation count one. Its phase is exactly `pre_disposal_candidate`; it does not claim a final disposal result. It contains no endpoint, provider, credential, certificate, database identity, raw observation, SQL, or connection material.

Receipt persistence must return the exact receipt hash. Evidence finalization occupies a separate namespace, binds the launch and receipt ID/hash pair, and includes the completed runtime prefix through `sanitized_evidence_finalized`. It also records that disposal remains required. Evidence finalization cannot substitute for disposal.

The environment disposal coordinator is invoked once in a finally-equivalent boundary after runtime dependency binding, for both successful and failing later paths. The completed public state requires an exact `completed` disposal result and a sanitized SHA-256 disposal receipt hash. Ambiguous, malformed, failed, thrown, or timed-out disposal results are classified `disposal_uncertain`; they never preserve a nominal success.

Only after successful disposal and exact lease terminalization does the core seal a distinct post-disposal execution closure receipt. It binds `disposalStatus=completed`, the disposal receipt hash, `leaseTerminalState=completed`, the complete twenty-state runtime trace and its domain-separated hash, the Step S launch package ID/hash, the pre-disposal receipt and evidence ID/hash pairs, adapter invocation count one, and `rawMaterialPresent=false`. A failed or ambiguous disposal or lease terminalization produces no completed closure receipt.

All repository tests use deterministic in-memory doubles. The core does not import a provider SDK, PostgreSQL client, filesystem API, network API, environment-variable loader, runtime clock, route, worker, cron, or deployment integration.
