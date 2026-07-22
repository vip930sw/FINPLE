"use strict";

const { createHash } = require("node:crypto");
const stepZ = require("./metrics-cutover-production-single-use-executor.cjs");
const stepZA = require("./metrics-cutover-production-runtime-ceremony.cjs");
const stepZB = require("./metrics-cutover-production-explicit-invocation-package.cjs");
const adapters = require("./metrics-cutover-production-capability-adapters.cjs");

const VERSION = "finple.step114-2x-zb-p.current-main-provenance-bridge.v1";
const MAXIMUM_PROVENANCE_LIFETIME_SECONDS = 300;
const PUBLIC_STATES = Object.freeze([
  "awaiting_production_adapter_and_provenance_material",
  "production_adapter_and_current_main_binding_verified",
  "blocked",
]);
const FAILURE_CLASSIFICATIONS = Object.freeze([
  "blocked_before_adapter_manifest_validation",
  "blocked_during_current_main_provenance_validation",
  "blocked_during_preimage_and_path_binding_validation",
  "blocked_during_nonce_or_chronology_validation",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "productionConfigured", "cutoverExecutorInvoked", "capabilityMethodInvoked",
  "productionWritePerformed", "selectorMutationPerformed", "rollbackInvoked",
  "loaderActivationPerformed", "deploymentPerformed", "rawMaterialPresent",
  "mergeAuthorizesExecution", "ciAuthorizesExecution", "vercelAuthorizesExecution",
  "healthCheckAuthorizesExecution", "repositoryOwnershipAuthorizesExecution",
  "automaticRetryAllowed", "secondAttemptAllowed", "providerAccessAllowed",
  "databaseAccessAllowed", "networkAccessAllowed",
]);
const INPUT_FIELDS = Object.freeze([
  "executionMainSha", "repositorySnapshot", "reviewedSourceIdentities",
  "observedSourceIdentities", "historicalContracts", "targetPathIdentities",
  "selectorPathIdentity", "adapterManifest", "currentPreimageManifest",
  "predecessorSourceIdentities", "selectorExpectedPostimageIdentity",
  "operatorMaterialIdentities", "provenanceNonceContext", "issuedAt",
  "effectiveExpiresAt", "evaluationClockInstant", "authoritySignals",
]);
const SOURCE_ROLES = Object.freeze([
  "step_z", "step_za", "step_zb", "production_capability_adapters",
  "current_main_provenance_bridge", "production_runtime_bundle",
  "production_no_op_fault_injector",
]);
const SOURCE_IDENTITY_FIELDS = Object.freeze([
  "role", "sourcePath", "sourcePathIdentityHash", "sourceGitBlobSha",
  "sourceContentSha256",
]);
const CRITICAL_SOURCE_PATHS = Object.freeze([
  Object.freeze({ role: "step_z",
    sourcePath: "scripts/lib/metrics-cutover-production-single-use-executor.cjs" }),
  Object.freeze({ role: "step_za",
    sourcePath: "scripts/lib/metrics-cutover-production-runtime-ceremony.cjs" }),
  Object.freeze({ role: "step_zb",
    sourcePath: "scripts/lib/metrics-cutover-production-explicit-invocation-package.cjs" }),
  Object.freeze({ role: "production_capability_adapters",
    sourcePath: "scripts/lib/metrics-cutover-production-capability-adapters.cjs" }),
  Object.freeze({ role: "current_main_provenance_bridge",
    sourcePath: "scripts/lib/metrics-cutover-current-main-provenance-bridge.cjs" }),
  Object.freeze({ role: "production_runtime_bundle",
    sourcePath: "scripts/lib/metrics-cutover-production-runtime-bundle.cjs" }),
  Object.freeze({ role: "production_no_op_fault_injector",
    sourcePath: "scripts/lib/metrics-cutover-production-no-op-fault-injector.cjs" }),
]);
const TARGET_PATH_FIELDS = Object.freeze([
  "market", "approvedRootPolicyHash", "approvedPathIdentityHash",
  "versionedTarget", "writeMode",
]);
const PREDECESSOR_FIELDS = Object.freeze([
  "market", "sourcePathIdentityHash", "contentSha256", "schemaVersion",
  "schemaIdentitySha256", "datasetIdentityHash", "rowCount", "byteCount",
]);
const PREIMAGE_FIELDS = Object.freeze([
  "contractVersion", "repositoryHeadSha", "repositoryTreeSha",
  "targetPreimageIdentities", "selectorPreimageIdentity", "manifestId", "manifestHash",
  "rawMaterialPresent",
]);
const AUTHORITY_FIELDS = Object.freeze([
  "merge", "ci", "vercel", "healthCheck", "repositoryOwnership",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null);
}
function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  throw new TypeError("unsupported_canonical_value");
}
function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}
function hashContract(domain, value) {
  return createHash("sha256").update(domain).update(canonicalJson(value)).digest("hex");
}
function sha256(value) { return createHash("sha256").update(value).digest("hex"); }
function gitBlobSha(bytes) {
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}
function isSha(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function isGitSha(value) { return typeof value === "string" && /^[0-9a-f]{40}$/.test(value); }
function exactKeys(value, fields) {
  return isRecord(value) && canonicalEqual(Object.keys(value).sort(), [...fields].sort());
}
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}
function uniqueSorted(values) { return [...new Set(values)].sort(); }
function cloneCanonical(value) { return JSON.parse(canonicalJson(value)); }
function parseInstant(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function fixedFalse() {
  return Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false]));
}
function emptyCounts() {
  return Object.fromEntries(adapters.CAPABILITY_NAMES.map((name) => [name, 0]));
}

function createExplicitReadOnlyGitObjectReader(input) {
  if (!exactKeys(input, ["gitExecutable", "execFileSync"]) ||
      typeof input.gitExecutable !== "string" ||
      !/^(?:[a-zA-Z]:[\\/]|[\\/]{2}|\/)/.test(input.gitExecutable) ||
      typeof input.execFileSync !== "function") {
    throw new TypeError("explicit_git_reader_input_invalid");
  }
  function run(repositoryRoot, args, encoding = "utf8") {
    return input.execFileSync(input.gitExecutable, ["-C", repositoryRoot, ...args], {
      encoding, windowsHide: true, maxBuffer: 16 * 1024 * 1024,
    });
  }
  return deepFreeze({
    resolveCommit(repositoryRoot, executionSha) {
      const headSha = String(run(repositoryRoot,
        ["rev-parse", "--verify", `${executionSha}^{commit}`])).trim();
      const treeSha = String(run(repositoryRoot,
        ["rev-parse", "--verify", `${executionSha}^{tree}`])).trim();
      return { headSha, treeSha };
    },
    readTreeEntry(repositoryRoot, treeSha, sourcePath) {
      const output = Buffer.from(run(repositoryRoot,
        ["ls-tree", "-z", treeSha, "--", sourcePath], "buffer")).toString("utf8");
      const match = /^(100644|100755) (blob) ([0-9a-f]{40})\t([^\0]+)\0$/.exec(output);
      return match ? { mode: match[1], type: match[2], blobSha: match[3], path: match[4] } : null;
    },
    readBlob(repositoryRoot, blobSha) {
      return Buffer.from(run(repositoryRoot, ["cat-file", "blob", blobSha], "buffer"));
    },
  });
}

function buildReadOnlyRepositoryMaterial(input) {
  if (!exactKeys(input, ["repositoryRoot", "executionSha", "criticalSourcePaths",
    "gitObjectReader"]) || typeof input.repositoryRoot !== "string" ||
      !/^(?:[a-zA-Z]:[\\/]|[\\/]{2}|\/)/.test(input.repositoryRoot) ||
      !isGitSha(input.executionSha) ||
      !canonicalEqual(input.criticalSourcePaths, CRITICAL_SOURCE_PATHS) ||
      !isRecord(input.gitObjectReader) ||
      ["resolveCommit", "readTreeEntry", "readBlob"].some(
        (method) => typeof input.gitObjectReader[method] !== "function")) {
    throw new TypeError("repository_material_builder_input_invalid");
  }
  const commit = input.gitObjectReader.resolveCommit(input.repositoryRoot, input.executionSha);
  if (!exactKeys(commit, ["headSha", "treeSha"]) ||
      commit.headSha !== input.executionSha || !isGitSha(commit.treeSha)) {
    throw new Error("execution_commit_resolution_invalid");
  }
  const observedSourceIdentities = CRITICAL_SOURCE_PATHS.map(({ role, sourcePath }) => {
    const entry = input.gitObjectReader.readTreeEntry(
      input.repositoryRoot, commit.treeSha, sourcePath);
    if (!exactKeys(entry, ["path", "blobSha", "mode", "type"]) ||
        entry.path !== sourcePath || entry.type !== "blob" ||
        !["100644", "100755"].includes(entry.mode) || !isGitSha(entry.blobSha)) {
      throw new Error(`critical_source_tree_membership_invalid:${role}`);
    }
    const bytes = input.gitObjectReader.readBlob(input.repositoryRoot, entry.blobSha);
    if (!Buffer.isBuffer(bytes) || gitBlobSha(bytes) !== entry.blobSha) {
      throw new Error(`critical_source_blob_mismatch:${role}`);
    }
    return { role, sourcePath,
      sourcePathIdentityHash: hashContract(
        "FINPLE_STEP114_2X_ZB_P_SOURCE_PATH_IDENTITY\0", sourcePath),
      sourceGitBlobSha: entry.blobSha, sourceContentSha256: sha256(bytes) };
  });
  const pathToBlobMembershipHash = hashContract(
    "FINPLE_STEP114_2X_ZB_P_PATH_TO_BLOB_MEMBERSHIP\0",
    observedSourceIdentities.map(({ role, sourcePath, sourceGitBlobSha }) =>
      ({ role, sourcePath, sourceGitBlobSha })));
  const snapshotBody = { headSha: commit.headSha, treeSha: commit.treeSha,
    pathToBlobMembershipHash };
  return deepFreeze({
    repositorySnapshot: { ...snapshotBody,
      snapshotIdentityHash: hashContract(
        "FINPLE_STEP114_2X_ZB_P_REPOSITORY_SNAPSHOT\0", snapshotBody) },
    observedSourceIdentities,
  });
}
function safeResult(status, overrides = {}) {
  const verified = status === PUBLIC_STATES[1];
  return deepFreeze({
    ok: verified, status, contractVersion: VERSION,
    failureClassification: overrides.failureClassification || null,
    blockingIssues: uniqueSorted(overrides.blockingIssues || []),
    currentMainBound: verified,
    historicalContractsPreserved: verified,
    productionAdaptersValidated: verified,
    stepZExecutionMaterialConstructible: verified,
    productionConfigured: false,
    explicitInvocationStillRequired: true,
    provenanceBridge: overrides.provenanceBridge || {},
    adapterManifestIdentity: overrides.adapterManifestIdentity || {},
    capabilityInvocationCounts: emptyCounts(),
    commandConstructionCount: 0, envelopeClaimAcquisitionCount: 0,
    envelopeClaimTerminalizationCount: 0, productionCsvReplacementCount: 0,
    selectorMutationCount: 0, cutoverReceiptPersistenceCount: 0,
    rollbackInvocationCount: 0,
    ...fixedFalse(),
  });
}

function buildHistoricalContracts() {
  return deepFreeze({
    stepZ: { mergedMainSha: stepZ.MERGED_MAIN_SHA, contractVersion: stepZ.VERSION },
    stepZA: { mergedMainSha: stepZA.MERGED_MAIN_SHA, contractVersion: stepZA.VERSION },
    stepZB: { mergedMainSha: stepZB.MERGED_MAIN_SHA, contractVersion: stepZB.VERSION },
  });
}

function validateAdapterManifest(value) {
  const issues = [];
  if (!isRecord(value) || value.contractVersion !== adapters.MANIFEST_VERSION ||
      value.adapterContractVersion !== adapters.VERSION ||
      !Array.isArray(value.capabilities) ||
      !canonicalEqual(value.capabilityNames, adapters.CAPABILITY_NAMES) ||
      value.productionCapable !== true || value.productionConfigured !== false ||
      value.rawMaterialPresent !== false || typeof value.adapterManifestId !== "string" ||
      !isSha(value.adapterManifestHash)) return ["adapter_manifest_shape_invalid"];
  for (const name of adapters.CAPABILITY_NAMES) {
    const entry = value.capabilities.find((candidate) => candidate.capabilityName === name);
    const descriptor = stepZ.buildCapabilityDescriptor(name);
    if (!entry || entry.descriptorHash !== descriptor.descriptorHash ||
        !canonicalEqual(entry.methodNames, descriptor.methodNames) ||
        entry.hardTimeoutMilliseconds !== 100 || entry.productionCapable !== true ||
        entry.productionConfigured !== false || entry.invocationCount !== 0 ||
        entry.mutationCount !== 0) issues.push(`adapter_manifest_capability_invalid:${name}`);
  }
  for (const field of adapters.FIXED_FALSE_FIELDS) {
    if (value[field] !== false) issues.push(`adapter_manifest_fixed_false_invalid:${field}`);
  }
  const withoutIdentity = { ...value };
  delete withoutIdentity.adapterManifestId;
  delete withoutIdentity.adapterManifestHash;
  const expectedId = `step114-2x-zb-p-adapter-manifest-${hashContract(
    "FINPLE_STEP114_2X_ZB_P_ADAPTER_MANIFEST_ID\0", withoutIdentity)}`;
  if (value.adapterManifestId !== expectedId) issues.push("adapter_manifest_id_invalid");
  const withoutHash = { ...value }; delete withoutHash.adapterManifestHash;
  if (value.adapterManifestHash !== hashContract(
    "FINPLE_STEP114_2X_ZB_P_ADAPTER_MANIFEST_HASH\0", withoutHash)) {
    issues.push("adapter_manifest_seal_invalid");
  }
  return uniqueSorted(issues);
}

function validateSources(reviewed, observed) {
  const issues = [];
  for (const [label, entries] of [["reviewed", reviewed], ["observed", observed]]) {
    if (!Array.isArray(entries) || entries.length !== SOURCE_ROLES.length ||
        !canonicalEqual(entries.map((entry) => ({ role: entry.role,
          sourcePath: entry.sourcePath })), CRITICAL_SOURCE_PATHS)) {
      issues.push(`${label}_source_roles_invalid`); continue;
    }
    for (const entry of entries) {
      if (!exactKeys(entry, SOURCE_IDENTITY_FIELDS) ||
          entry.sourcePathIdentityHash !== hashContract(
            "FINPLE_STEP114_2X_ZB_P_SOURCE_PATH_IDENTITY\0", entry.sourcePath) ||
          !isGitSha(entry.sourceGitBlobSha) || !isSha(entry.sourceContentSha256)) {
        issues.push(`${label}_source_identity_invalid:${entry.role}`);
      }
    }
  }
  if (!canonicalEqual(reviewed, observed)) issues.push("critical_source_blob_or_content_drift");
  return uniqueSorted(issues);
}

function validatePathsAndPreimages(packet) {
  const issues = [];
  if (!Array.isArray(packet.targetPathIdentities) ||
      packet.targetPathIdentities.length !== 2 ||
      !canonicalEqual(packet.targetPathIdentities.map((entry) => entry.market), ["US", "KR"])) {
    issues.push("target_path_order_invalid");
  } else {
    for (const entry of packet.targetPathIdentities) {
      if (!exactKeys(entry, TARGET_PATH_FIELDS) ||
          !isSha(entry.approvedRootPolicyHash) || !isSha(entry.approvedPathIdentityHash) ||
          entry.versionedTarget !== true || entry.writeMode !== "create_only") {
        issues.push(`target_path_identity_invalid:${entry.market}`);
      }
    }
    if (packet.targetPathIdentities[0]?.approvedPathIdentityHash ===
        packet.targetPathIdentities[1]?.approvedPathIdentityHash) issues.push("target_path_aliasing_forbidden");
  }
  if (!exactKeys(packet.selectorPathIdentity,
    ["approvedRootPolicyHash", "approvedPathIdentityHash"]) ||
      !isSha(packet.selectorPathIdentity.approvedRootPolicyHash) ||
      !isSha(packet.selectorPathIdentity.approvedPathIdentityHash) ||
      packet.targetPathIdentities?.some((entry) =>
        entry.approvedPathIdentityHash === packet.selectorPathIdentity.approvedPathIdentityHash)) {
    issues.push("selector_path_identity_invalid");
  }
  const expectedRootPolicy = packet.adapterManifest?.approvedRootPolicyIdentity;
  if (!isSha(expectedRootPolicy) || packet.targetPathIdentities?.some((entry) =>
    entry.approvedRootPolicyHash !== expectedRootPolicy) ||
      packet.selectorPathIdentity?.approvedRootPolicyHash !== expectedRootPolicy) {
    issues.push("approved_root_policy_binding_invalid");
  }
  const manifest = packet.currentPreimageManifest;
  if (!exactKeys(manifest, PREIMAGE_FIELDS) || manifest.rawMaterialPresent !== false ||
      manifest.repositoryHeadSha !== packet.executionMainSha ||
      manifest.repositoryTreeSha !== packet.repositorySnapshot?.treeSha ||
      !Array.isArray(manifest.targetPreimageIdentities) ||
      manifest.targetPreimageIdentities.length !== 2 ||
      !canonicalEqual(manifest.targetPreimageIdentities.map((entry) => entry.market),
        ["US", "KR"]) ||
      manifest.targetPreimageIdentities.some((entry) =>
        !exactKeys(entry, ["market", "pathIdentityHash", "exists",
          "contentIdentityHash", "byteCount", "rowCount"]) ||
        !isSha(entry.pathIdentityHash) || entry.exists !== false ||
        entry.contentIdentityHash !== null || entry.byteCount !== 0 ||
        entry.rowCount !== 0) ||
      !isRecord(manifest.selectorPreimageIdentity) || !isSha(manifest.manifestHash) ||
      !exactKeys(manifest.selectorPreimageIdentity,
        ["pathIdentityHash", "contentIdentityHash", "byteCount"]) ||
      !isSha(manifest.selectorPreimageIdentity.pathIdentityHash) ||
      !isSha(manifest.selectorPreimageIdentity.contentIdentityHash) ||
      !Number.isInteger(manifest.selectorPreimageIdentity.byteCount) ||
      manifest.selectorPreimageIdentity.byteCount < 0 ||
      typeof manifest.manifestId !== "string") {
    issues.push("current_preimage_manifest_invalid");
  } else {
    const expectedManifestId = `step114-2x-zb-p-current-preimage-${hashContract(
      "FINPLE_STEP114_2X_ZB_P_CURRENT_PREIMAGE_MANIFEST_ID\0", {
        repositoryHeadSha: manifest.repositoryHeadSha,
        repositoryTreeSha: manifest.repositoryTreeSha,
        targetPreimageIdentities: manifest.targetPreimageIdentities,
        selectorPreimageIdentity: manifest.selectorPreimageIdentity,
      })}`;
    if (manifest.manifestId !== expectedManifestId) {
      issues.push("current_preimage_manifest_id_invalid");
    }
    const body = { ...manifest }; delete body.manifestHash;
    if (manifest.manifestHash !== hashContract(
      "FINPLE_STEP114_2X_ZB_P_CURRENT_PREIMAGE_MANIFEST_HASH\0", body)) {
      issues.push("current_preimage_manifest_seal_invalid");
    }
    const targetPaths = manifest.targetPreimageIdentities.map((entry) => entry.pathIdentityHash);
    if (!canonicalEqual(targetPaths,
      packet.targetPathIdentities.map((entry) => entry.approvedPathIdentityHash)) ||
        manifest.selectorPreimageIdentity.pathIdentityHash !==
          packet.selectorPathIdentity.approvedPathIdentityHash) {
      issues.push("preimage_path_binding_invalid");
    }
    if (manifest.targetPreimageIdentities.some((entry) => entry.exists !== false ||
        entry.contentIdentityHash !== null || entry.byteCount !== 0 || entry.rowCount !== 0)) {
      issues.push("historical_step_z_requires_absent_versioned_targets");
    }
  }
  if (!Array.isArray(packet.predecessorSourceIdentities) ||
      packet.predecessorSourceIdentities.length !== 2 ||
      !canonicalEqual(packet.predecessorSourceIdentities.map((entry) => entry.market),
        ["US", "KR"]) || packet.predecessorSourceIdentities.some((entry) =>
        !exactKeys(entry, PREDECESSOR_FIELDS) || !isSha(entry.sourcePathIdentityHash) ||
        !isSha(entry.contentSha256) || typeof entry.schemaVersion !== "string" ||
        entry.schemaVersion.length === 0 || !isSha(entry.schemaIdentitySha256) ||
        !isSha(entry.datasetIdentityHash) || !Number.isInteger(entry.rowCount) ||
        entry.rowCount < 1 || !Number.isInteger(entry.byteCount) || entry.byteCount < 1) ||
      packet.predecessorSourceIdentities.some((entry) =>
        packet.targetPathIdentities?.some((target) =>
          target.approvedPathIdentityHash === entry.sourcePathIdentityHash))) {
    issues.push("predecessor_source_identity_invalid");
  }
  if (!exactKeys(packet.selectorExpectedPostimageIdentity,
    ["selectorPathIdentityHash", "contentSha256", "referencedTargetPathIdentityHashes"]) ||
      packet.selectorExpectedPostimageIdentity.selectorPathIdentityHash !==
        packet.selectorPathIdentity?.approvedPathIdentityHash ||
      !isSha(packet.selectorExpectedPostimageIdentity.contentSha256) ||
      !canonicalEqual(packet.selectorExpectedPostimageIdentity.referencedTargetPathIdentityHashes,
        packet.targetPathIdentities?.map((entry) => entry.approvedPathIdentityHash))) {
    issues.push("selector_expected_postimage_versioned_target_binding_invalid");
  }
  return uniqueSorted(issues);
}

function validateNonceAndChronology(packet) {
  const issues = [];
  const context = packet.provenanceNonceContext;
  if (!exactKeys(context, ["priorNonceHashes", "provenanceNonceHash", "upstreamNonceHashes"]) ||
      !Array.isArray(context.priorNonceHashes) || !Array.isArray(context.upstreamNonceHashes) ||
      [...context.priorNonceHashes, ...context.upstreamNonceHashes,
        context.provenanceNonceHash].some((value) => !isSha(value)) ||
      !canonicalEqual(context.priorNonceHashes, [...context.priorNonceHashes].sort()) ||
      !canonicalEqual(context.upstreamNonceHashes, [...context.upstreamNonceHashes].sort()) ||
      new Set(context.priorNonceHashes).size !== context.priorNonceHashes.length ||
      new Set(context.upstreamNonceHashes).size !== context.upstreamNonceHashes.length ||
      context.priorNonceHashes.includes(context.provenanceNonceHash) ||
      context.upstreamNonceHashes.includes(context.provenanceNonceHash)) {
    issues.push("provenance_nonce_replay_or_collision");
  }
  const issued = parseInstant(packet.issuedAt);
  const evaluation = parseInstant(packet.evaluationClockInstant);
  const expiry = parseInstant(packet.effectiveExpiresAt);
  if ([issued, evaluation, expiry].includes(null) || issued > evaluation || evaluation >= expiry ||
      expiry - issued > MAXIMUM_PROVENANCE_LIFETIME_SECONDS * 1000) {
    issues.push("provenance_chronology_or_expiry_invalid");
  }
  return uniqueSorted(issues);
}

function buildSelectorExpectedPostimageIdentity(input) {
  if (!exactKeys(input, ["selectorPathIdentityHash", "selectorPostimageBytes",
    "versionedTargetPublicPaths", "targetPathIdentities"]) ||
      !isSha(input.selectorPathIdentityHash) ||
      !Buffer.isBuffer(input.selectorPostimageBytes) ||
      input.selectorPostimageBytes.length === 0 ||
      !Array.isArray(input.versionedTargetPublicPaths) ||
      input.versionedTargetPublicPaths.length !== 2 ||
      input.versionedTargetPublicPaths.some((value) => typeof value !== "string" ||
        value.length === 0 || value.includes("\\") || value.includes("..")) ||
      !Array.isArray(input.targetPathIdentities) ||
      input.targetPathIdentities.length !== 2 ||
      !canonicalEqual(input.targetPathIdentities.map((entry) => entry.market), ["US", "KR"]) ||
      input.targetPathIdentities.some((entry) => !exactKeys(entry, TARGET_PATH_FIELDS) ||
        entry.versionedTarget !== true || entry.writeMode !== "create_only" ||
        !isSha(entry.approvedPathIdentityHash))) {
    throw new TypeError("selector_expected_postimage_builder_input_invalid");
  }
  const selectorText = input.selectorPostimageBytes.toString("utf8");
  if (Buffer.from(selectorText, "utf8").compare(input.selectorPostimageBytes) !== 0 ||
      input.versionedTargetPublicPaths.some((targetPath) =>
        selectorText.split(targetPath).length - 1 !== 1)) {
    throw new Error("selector_postimage_versioned_target_reference_invalid");
  }
  return deepFreeze({ selectorPathIdentityHash: input.selectorPathIdentityHash,
    contentSha256: sha256(input.selectorPostimageBytes),
    referencedTargetPathIdentityHashes: input.targetPathIdentities.map(
      (entry) => entry.approvedPathIdentityHash) });
}

function buildCurrentPreimageManifest(input) {
  if (!exactKeys(input, ["repositoryHeadSha", "repositoryTreeSha",
    "targetPreimageIdentities", "selectorPreimageIdentity"]) ||
      !isGitSha(input.repositoryHeadSha) || !isGitSha(input.repositoryTreeSha) ||
      !Array.isArray(input.targetPreimageIdentities) ||
      input.targetPreimageIdentities.length !== 2 ||
      !canonicalEqual(input.targetPreimageIdentities.map((entry) => entry.market), ["US", "KR"]) ||
      input.targetPreimageIdentities.some((entry) =>
        !exactKeys(entry, ["market", "pathIdentityHash", "exists",
          "contentIdentityHash", "byteCount", "rowCount"]) ||
        !isSha(entry.pathIdentityHash) || entry.exists !== false ||
        entry.contentIdentityHash !== null || entry.byteCount !== 0 ||
        entry.rowCount !== 0) ||
      !exactKeys(input.selectorPreimageIdentity,
        ["pathIdentityHash", "contentIdentityHash", "byteCount"]) ||
      !isSha(input.selectorPreimageIdentity.pathIdentityHash) ||
      !isSha(input.selectorPreimageIdentity.contentIdentityHash) ||
      !Number.isInteger(input.selectorPreimageIdentity.byteCount) ||
      input.selectorPreimageIdentity.byteCount < 0) {
    throw new TypeError("current_preimage_manifest_input_invalid");
  }
  const body = { contractVersion: "finple.step114-2x-zb-p.current-preimage-manifest.v1",
    repositoryHeadSha: input.repositoryHeadSha,
    repositoryTreeSha: input.repositoryTreeSha,
    targetPreimageIdentities: cloneCanonical(input.targetPreimageIdentities),
    selectorPreimageIdentity: cloneCanonical(input.selectorPreimageIdentity),
    manifestId: `step114-2x-zb-p-current-preimage-${hashContract(
      "FINPLE_STEP114_2X_ZB_P_CURRENT_PREIMAGE_MANIFEST_ID\0", input)}`,
    rawMaterialPresent: false };
  return deepFreeze({ ...body, manifestHash: hashContract(
    "FINPLE_STEP114_2X_ZB_P_CURRENT_PREIMAGE_MANIFEST_HASH\0", body) });
}

function buildProvenanceBridge(packet) {
  const body = {
    contractVersion: VERSION,
    executionMainSha: packet.executionMainSha,
    repositoryHeadSha: packet.repositorySnapshot.headSha,
    repositoryTreeSha: packet.repositorySnapshot.treeSha,
    repositorySnapshotIdentityHash: packet.repositorySnapshot.snapshotIdentityHash,
    pathToBlobMembershipHash: packet.repositorySnapshot.pathToBlobMembershipHash,
    criticalSourceIdentities: cloneCanonical(packet.observedSourceIdentities),
    historicalContracts: cloneCanonical(packet.historicalContracts),
    targetPathIdentities: cloneCanonical(packet.targetPathIdentities),
    selectorPathIdentity: cloneCanonical(packet.selectorPathIdentity),
    predecessorSourceIdentities: cloneCanonical(packet.predecessorSourceIdentities),
    selectorExpectedPostimageIdentity:
      cloneCanonical(packet.selectorExpectedPostimageIdentity),
    adapterManifestId: packet.adapterManifest.adapterManifestId,
    adapterManifestHash: packet.adapterManifest.adapterManifestHash,
    currentPreimageManifestId: packet.currentPreimageManifest.manifestId,
    currentPreimageManifestHash: packet.currentPreimageManifest.manifestHash,
    operatorMaterialIdentities: cloneCanonical(packet.operatorMaterialIdentities),
    provenanceNonceHash: packet.provenanceNonceContext.provenanceNonceHash,
    evaluationClockInstant: packet.evaluationClockInstant,
    effectiveExpiresAt: packet.effectiveExpiresAt,
    currentMainBound: true, historicalContractsPreserved: true,
    productionAdaptersValidated: true, productionConfigured: false,
    stepZExecutionMaterialConstructible: true,
    explicitInvocationStillRequired: true,
    capabilityInvocationCounts: emptyCounts(),
    commandConstructionCount: 0, mutationCount: 0,
    ...fixedFalse(),
  };
  const provenanceBridgeId = `step114-2x-zb-p-provenance-${hashContract(
    "FINPLE_STEP114_2X_ZB_P_PROVENANCE_BRIDGE_ID\0", body)}`;
  return deepFreeze({ ...body, provenanceBridgeId,
    provenanceBridgeHash: hashContract("FINPLE_STEP114_2X_ZB_P_PROVENANCE_BRIDGE_HASH\0",
      { ...body, provenanceBridgeId }) });
}

function evaluateCurrentMainProvenanceBridge(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(packet, INPUT_FIELDS)) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[0],
    blockingIssues: ["provenance_packet_fields_invalid"],
  });
  const adapterIssues = validateAdapterManifest(packet.adapterManifest);
  if (adapterIssues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[0], blockingIssues: adapterIssues,
  });
  const sourceIssues = validateSources(packet.reviewedSourceIdentities,
    packet.observedSourceIdentities);
  const repository = packet.repositorySnapshot;
  const expectedMembershipHash = hashContract(
    "FINPLE_STEP114_2X_ZB_P_PATH_TO_BLOB_MEMBERSHIP\0",
    Array.isArray(packet.observedSourceIdentities)
      ? packet.observedSourceIdentities.map(({ role, sourcePath, sourceGitBlobSha }) =>
        ({ role, sourcePath, sourceGitBlobSha })) : []);
  if (!exactKeys(repository, ["headSha", "treeSha", "pathToBlobMembershipHash",
    "snapshotIdentityHash"]) ||
      !isGitSha(packet.executionMainSha) || repository.headSha !== packet.executionMainSha ||
      !isGitSha(repository.treeSha) || repository.pathToBlobMembershipHash !==
        expectedMembershipHash || !isSha(repository.snapshotIdentityHash) ||
      repository.snapshotIdentityHash !== hashContract(
        "FINPLE_STEP114_2X_ZB_P_REPOSITORY_SNAPSHOT\0",
        { headSha: repository.headSha, treeSha: repository.treeSha,
          pathToBlobMembershipHash: repository.pathToBlobMembershipHash })) {
    sourceIssues.push("execution_main_repository_binding_invalid");
  }
  const expectedAdapterSources = Array.isArray(packet.observedSourceIdentities)
    ? packet.observedSourceIdentities
      .filter((entry) => ["production_capability_adapters",
        "current_main_provenance_bridge"].includes(entry.role))
      .map((entry) => ({ moduleRole: entry.role, sourcePath: entry.sourcePath,
        sourcePathIdentityHash: entry.sourcePathIdentityHash,
        sourceGitBlobSha: entry.sourceGitBlobSha,
        sourceContentSha256: entry.sourceContentSha256 })) : [];
  if (!canonicalEqual(packet.adapterManifest.adapterSourceIdentities,
    expectedAdapterSources)) {
    sourceIssues.push("adapter_manifest_observed_source_mismatch");
  }
  if (!canonicalEqual(packet.historicalContracts, buildHistoricalContracts())) {
    sourceIssues.push("historical_contract_baseline_or_version_drift");
  }
  if (sourceIssues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[1], blockingIssues: sourceIssues,
  });
  const pathIssues = validatePathsAndPreimages(packet);
  if (pathIssues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[2], blockingIssues: pathIssues,
  });
  if (!(packet.operatorMaterialIdentities === null ||
      (exactKeys(packet.operatorMaterialIdentities,
        ["operatorAllowlistIdentityHash", "operatorAuthorizationIdentityHash"]) &&
        Object.values(packet.operatorMaterialIdentities).every(isSha)))) {
    return safeResult(PUBLIC_STATES[2], {
      failureClassification: FAILURE_CLASSIFICATIONS[3],
      blockingIssues: ["operator_material_identities_invalid"],
    });
  }
  if (!exactKeys(packet.authoritySignals, AUTHORITY_FIELDS) ||
      Object.values(packet.authoritySignals).some((value) => value !== false)) {
    return safeResult(PUBLIC_STATES[2], {
      failureClassification: FAILURE_CLASSIFICATIONS[3],
      blockingIssues: ["external_signal_execution_authority_forbidden"],
    });
  }
  const nonceIssues = validateNonceAndChronology(packet);
  if (nonceIssues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[3], blockingIssues: nonceIssues,
  });
  const provenanceBridge = buildProvenanceBridge(packet);
  return safeResult(PUBLIC_STATES[1], { provenanceBridge,
    adapterManifestIdentity: {
      adapterManifestId: packet.adapterManifest.adapterManifestId,
      adapterManifestHash: packet.adapterManifest.adapterManifestHash,
    } });
}

module.exports = {
  AUTHORITY_FIELDS, CRITICAL_SOURCE_PATHS, FAILURE_CLASSIFICATIONS,
  FIXED_FALSE_FIELDS, INPUT_FIELDS,
  MAXIMUM_PROVENANCE_LIFETIME_SECONDS, PREIMAGE_FIELDS, PUBLIC_STATES,
  PREDECESSOR_FIELDS, SOURCE_IDENTITY_FIELDS, SOURCE_ROLES, TARGET_PATH_FIELDS, VERSION,
  buildCurrentPreimageManifest, buildHistoricalContracts, buildProvenanceBridge,
  buildReadOnlyRepositoryMaterial, buildSelectorExpectedPostimageIdentity,
  createExplicitReadOnlyGitObjectReader,
  canonicalJson, deepFreeze, evaluateCurrentMainProvenanceBridge, hashContract,
  safeResult, validateAdapterManifest, validateNonceAndChronology,
  validatePathsAndPreimages, validateSources,
};
