"use strict";

const { createHash, createPublicKey, verify } = require("node:crypto");
const stepZ = require("./metrics-cutover-production-single-use-executor.cjs");
const stepZA = require("./metrics-cutover-production-runtime-ceremony.cjs");
const stepZB = require("./metrics-cutover-production-explicit-invocation-package.cjs");
const provenance = require("./metrics-cutover-current-main-provenance-bridge.cjs");
const adapters = require("./metrics-cutover-production-capability-adapters.cjs");

const VERSION = "finple.step114-2x-zb-r.production-runtime-bundle.v1";
const IMPLEMENTATION_BASELINE_SHA = "51f5c5b923622614875899bcda1f2447dc36e9ed";
const ROLE = "metrics_production_cutover_operator";
const SCOPE = "invoke_exactly_one_verified_production_metrics_csv_cutover";
const SIGNATURE_ALGORITHM = "Ed25519";
const MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS = 300;
const PUBLIC_STATES = Object.freeze([
  "awaiting_production_runtime_configuration_material",
  "production_runtime_invocation_bundle_verified",
  "blocked",
]);
const FAILURE_CLASSIFICATIONS = Object.freeze([
  "blocked_before_production_material_validation",
  "blocked_during_production_configuration_validation",
  "blocked_during_production_authorization_verification",
  "blocked_during_production_invocation_bundle_validation",
  "blocked_during_later_execution_boundary_validation",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "productionExecutionPerformed", "cutoverExecutorInvoked",
  "actualAdapterConstructionPerformed", "productionStateDirectoryCreated",
  "capabilityMethodInvoked", "envelopeClaimAcquired", "envelopeClaimTerminalized",
  "productionCsvCreated", "productionWritePerformed", "selectorMutationPerformed",
  "cutoverReceiptPersisted", "rollbackInvoked", "loaderActivationPerformed",
  "deploymentPerformed", "providerAccessAllowed", "databaseAccessAllowed",
  "credentialAccessAllowed", "sqlExecutionAllowed", "scenarioAccessAllowed",
  "automaticRetryAllowed", "fallbackAllowed", "secondCutoverAttemptAllowed",
  "rawMaterialPresent",
]);
const BUILDER_FIELDS = Object.freeze([
  "filesystem", "pathApi", "repositoryRoot", "gitExecutable", "gitExecFileSync",
  "executionMainSha", "approvedRoot", "stateRootParent", "futureStateRootPath",
  "predecessorPaths", "targetPaths", "selectorPath", "candidateContents",
  "selectorExpectedPostimageBytes", "noOpFaultInjectorContract",
  "platformAttestation", "restorationMaterialIdentity", "adapterManifest",
  "provenancePacket", "provenanceResult", "stepZAPacket", "stepZAResult",
]);
const EVALUATION_FIELDS = Object.freeze([
  "readOnlyBuilderInput", "productionOperatorAllowlist",
  "signedProductionAuthorization", "priorAuthorizationNonceHashes",
  "evaluationClockInstant", "historicalZBPacket", "historicalZBResult",
]);
const LATER_BOUNDARY_FIELDS = Object.freeze([
  ...EVALUATION_FIELDS, "productionInvocationBundle",
  "currentEvaluationClockInstant", "currentPriorAuthorizationNonceHashes",
]);
const ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "signerKeyId", "signerSanitizedIdentityHash", "publicKeyPem",
  "publicKeyFingerprintSha256", "environmentIdentityHash", "allowedRole",
  "allowedScope", "validFrom", "validUntil", "revoked",
]);
const ALLOWLIST_FIELDS = Object.freeze([
  "contractVersion", "entries", "productionAuthorization",
  "syntheticValidationOnly", "rawMaterialPresent", "operatorAllowlistId",
  "operatorAllowlistHash",
]);
const AUTHORIZATION_BODY_FIELDS = Object.freeze([
  "contractVersion", "executionMainSha", "provenanceBridgeId",
  "provenanceBridgeHash", "productionConfigurationManifestId",
  "productionConfigurationManifestHash", "adapterManifestId",
  "adapterManifestHash", "targetSelectorIdentityHash", "stepZContractIdentityHash",
  "stepZOperationPlanHash", "singleUseClaimNamespaceHash",
  "environmentIdentityHash", "authorizationNonceHash",
  "priorAuthorizationNonceContextDigest", "upstreamNonceContextDigest",
  "issuedAt", "expiresAt", "effectiveExpiresAt", "evaluationClockInstant",
  "signerKeyId", "signerSanitizedIdentityHash",
  "signerPublicKeyFingerprintSha256", "role", "scope", "signatureAlgorithm",
  "productionAuthorization", "syntheticValidationOnly", ...FIXED_FALSE_FIELDS,
]);
const AUTHORIZATION_FIELDS = Object.freeze([
  AUTHORIZATION_BODY_FIELDS[0], "productionOperatorAuthorizationId",
  ...AUTHORIZATION_BODY_FIELDS.slice(1), "signatureBase64",
  "productionOperatorAuthorizationHash",
]);
const DEPENDENCY_SCHEMA = Object.freeze({
  preConstructionDependencyNames: Object.freeze([
    "productionInvocationBundle", "signedProductionAuthorization",
    "productionOperatorAllowlist", "priorAuthorizationNonceHashes",
    "evaluationClockInstant", "privateProductionConfigurationMaterial",
    "stepZExecutionPacket", "filesystem", "pathApi", "gitExecutable",
    "gitExecFileSync", "noOpProductionFaultInjector",
  ]),
  postConstructionDependencyNames: Object.freeze([...stepZ.CAPABILITY_NAMES]),
});
const ADAPTER_TARGET_CONTRACT_FIELDS = Object.freeze([
  "role", "market", "path", "publicPath", "versionedTarget", "writeMode",
  "schemaVersion", "normalizedHeader", "normalizedHeaderSha256",
  "schemaIdentitySha256", "expectedContentSha256",
  "expectedDatasetIdentityHash", "expectedRowCount", "expectedByteCount",
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
function isSha(value) { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function isGitSha(value) { return typeof value === "string" && /^[0-9a-f]{40}$/.test(value); }
function isSafeId(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._:-]{7,255}$/.test(value);
}
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
function clone(value) { return JSON.parse(canonicalJson(value)); }
function uniqueSorted(values) { return [...new Set(values)].sort(); }
function parseInstant(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function fixedFalse() {
  return Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false]));
}
function zeroCounts() {
  return {
    capabilityInvocationCounts: Object.fromEntries(stepZ.CAPABILITY_NAMES.map(
      (name) => [name, 0])), commandConstructionCount: 0,
    adapterConstructionCount: 0, envelopeClaimAcquisitionCount: 0,
    envelopeClaimTerminalizationCount: 0, productionCsvCreationCount: 0,
    selectorMutationCount: 0, cutoverReceiptPersistenceCount: 0,
    rollbackInvocationCount: 0,
  };
}
function safeResult(status, overrides = {}) {
  return deepFreeze({ ok: status === PUBLIC_STATES[1], status,
    contractVersion: VERSION,
    failureClassification: status === PUBLIC_STATES[2]
      ? overrides.failureClassification || FAILURE_CLASSIFICATIONS[0] : null,
    blockingIssues: uniqueSorted(overrides.blockingIssues || []),
    productionConfigurationValidated: overrides.productionConfigurationValidated === true,
    productionAuthorizationVerified: overrides.productionAuthorizationVerified === true,
    signerSeparationValidated: overrides.signerSeparationValidated === true,
    nonceValidated: overrides.nonceValidated === true,
    chronologyValidated: overrides.chronologyValidated === true,
    laterExecutionBoundaryValidated: overrides.laterExecutionBoundaryValidated === true,
    productionConfigurationManifest: overrides.productionConfigurationManifest || {},
    productionAuthorization: overrides.productionAuthorization || {},
    productionInvocationBundle: overrides.productionInvocationBundle || {},
    sanitizedDependencyDescriptor: overrides.sanitizedDependencyDescriptor || {},
    ...zeroCounts(), ...fixedFalse() });
}
function publicKeyMaterial(publicKeyPem) {
  const publicKey = createPublicKey(publicKeyPem);
  if (publicKey.asymmetricKeyType !== "ed25519") throw new Error("not_ed25519");
  const der = publicKey.export({ type: "spki", format: "der" });
  return { publicKey, fingerprint: sha256(der) };
}
function canonicalBase64(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  try {
    const bytes = Buffer.from(value, "base64");
    return bytes.length > 0 && bytes.toString("base64") === value ? bytes : null;
  } catch { return null; }
}
function pathIdentity(market, publicPath) {
  return hashContract("FINPLE_STEP114_2X_ZB_R_PATH_IDENTITY\0", { market, publicPath });
}
function rootPolicyIdentity(kind, canonicalRoot) {
  return hashContract("FINPLE_STEP114_2X_ZB_R_ROOT_POLICY_IDENTITY\0",
    { kind, canonicalRootIdentityHash: sha256(Buffer.from(canonicalRoot, "utf8")) });
}

function buildStepZExecutionMaterialDescriptor(stepZAPacket, stepZAResult) {
  const stepZPacket = stepZAPacket.stepZPacket;
  const inventory = stepZAResult.runtimeMaterialInventory;
  const handoff = stepZAResult.explicitExecutionHandoff;
  const body = {
    contractVersion: `${VERSION}.step-z-execution-material-descriptor.v1`,
    exactInputFields: [...stepZ.INPUT_FIELDS],
    mergedMainSha: stepZPacket.mergedMainSha,
    stepZContractVersion: stepZ.VERSION,
    stepZContractMergedMainSha: stepZ.MERGED_MAIN_SHA,
    stepYChainIdentities: clone(handoff.chainIdentities),
    executionClockInstant: stepZPacket.executionClockInstant,
    capabilityNames: [...stepZ.CAPABILITY_NAMES],
    capabilityInventoryHash: handoff.capabilityInventoryHash,
    runtimeMaterialInventoryId: inventory.runtimeMaterialInventoryId,
    runtimeMaterialInventoryHash: inventory.runtimeMaterialInventoryHash,
    explicitExecutionHandoffId: handoff.explicitExecutionHandoffId,
    explicitExecutionHandoffHash: handoff.explicitExecutionHandoffHash,
    operationPlanHash: handoff.operationPlanHash,
    executorTraceHash: handoff.executorTraceHash,
    privateStepYPacketRequiredAtInvocation: true,
    privateStepYResultRequiredAtInvocation: true,
    sevenConstructedCapabilitiesRequiredAtInvocation: true,
    actualAdapterConstructionPerformed: false,
    executionPerformed: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract(
    "FINPLE_STEP114_2X_ZB_R_STEP_Z_EXECUTION_MATERIAL_ID\0", body);
  const withId = { ...body,
    stepZExecutionMaterialDescriptorId:
      `step114-2x-zb-r-step-z-execution-material-${idHash}` };
  return deepFreeze({ ...withId, stepZExecutionMaterialDescriptorHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_STEP_Z_EXECUTION_MATERIAL_HASH\0", withId) });
}

function validateNoOpFaultInjectorContract(value) {
  if (!exactKeys(value, ["contractVersion", "mode", "hitBehavior",
    "productionSafe", "mutationCount", "contractIdentityHash"]) ||
      value.contractVersion !== "finple.step114-2x-zb-r.no-op-fault-injector.v1" ||
      value.mode !== "no_op" || value.hitBehavior !== "return_without_side_effect" ||
      value.productionSafe !== true || value.mutationCount !== 0) return false;
  const body = { ...value }; delete body.contractIdentityHash;
  return value.contractIdentityHash === hashContract(
    "FINPLE_STEP114_2X_ZB_R_NO_OP_FAULT_INJECTOR\0", body);
}
function buildNoOpFaultInjectorContract() {
  const body = { contractVersion: "finple.step114-2x-zb-r.no-op-fault-injector.v1",
    mode: "no_op", hitBehavior: "return_without_side_effect",
    productionSafe: true, mutationCount: 0 };
  return deepFreeze({ ...body, contractIdentityHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_NO_OP_FAULT_INJECTOR\0", body) });
}

function buildReadOnlyPathGuard(input) {
  const fs = input.filesystem; const path = input.pathApi;
  const requiredFs = ["existsSync", "lstatSync", "readFileSync", "realpathSync"];
  const requiredPath = ["dirname", "isAbsolute", "relative", "resolve"];
  if (!isRecord(fs) || requiredFs.some((name) => typeof fs[name] !== "function") ||
      !isRecord(path) || requiredPath.some((name) => typeof path[name] !== "function") ||
      typeof path.sep !== "string") throw new TypeError("read_only_capabilities_invalid");
  const approvedRoot = path.resolve(input.approvedRoot);
  const stateRootParent = path.resolve(input.stateRootParent);
  if (!path.isAbsolute(input.approvedRoot) || approvedRoot !== input.approvedRoot ||
      !path.isAbsolute(input.stateRootParent) || stateRootParent !== input.stateRootParent ||
      !fs.existsSync(approvedRoot) || !fs.existsSync(stateRootParent)) {
    throw new TypeError("explicit_canonical_roots_invalid");
  }
  const approvedReal = fs.realpathSync(approvedRoot);
  const stateParentReal = fs.realpathSync(stateRootParent);
  function inside(root, candidate) {
    const relative = path.relative(root, candidate);
    return relative === "" || (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
  }
  function walkNoLinks(root, candidate, leafMayBeMissing) {
    const relative = path.relative(root, candidate);
    let cursor = root;
    for (const component of relative.split(path.sep).filter(Boolean)) {
      cursor = path.resolve(cursor, component);
      if (!fs.existsSync(cursor)) {
        if (leafMayBeMissing && cursor === candidate) return;
        throw new Error("path_parent_missing");
      }
      if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error("symlink_or_junction_forbidden");
    }
  }
  function existingFile(raw) {
    const value = path.resolve(raw);
    if (!path.isAbsolute(raw) || value !== raw || !inside(approvedRoot, value)) {
      throw new Error("approved_root_escape_or_alias");
    }
    walkNoLinks(approvedRoot, value, false);
    if (!fs.lstatSync(value).isFile() || !inside(approvedReal, fs.realpathSync(value))) {
      throw new Error("approved_existing_file_invalid");
    }
    return value;
  }
  function absentFile(raw) {
    const value = path.resolve(raw);
    if (!path.isAbsolute(raw) || value !== raw || !inside(approvedRoot, value)) {
      throw new Error("approved_root_escape_or_alias");
    }
    if (fs.existsSync(value)) throw new Error("versioned_target_exists");
    walkNoLinks(approvedRoot, value, true);
    const parent = path.dirname(value);
    if (!fs.existsSync(parent) || !inside(approvedReal, fs.realpathSync(parent))) {
      throw new Error("target_parent_invalid");
    }
    return value;
  }
  const future = path.resolve(input.futureStateRootPath);
  if (!path.isAbsolute(input.futureStateRootPath) || future !== input.futureStateRootPath ||
      !inside(stateRootParent, future) || fs.existsSync(future)) {
    throw new Error("future_state_root_must_be_absent");
  }
  walkNoLinks(stateRootParent, future, true);
  if (!inside(stateParentReal, fs.realpathSync(path.dirname(future)))) {
    throw new Error("state_root_parent_realpath_invalid");
  }
  return { approvedRoot, approvedReal, stateRootParent, stateParentReal,
    existingFile, absentFile };
}

function validatePlatformAttestation(value) {
  const fields = ["contractVersion", "probeRootKind", "probeRootPolicyIdentity",
    "atomicSameDirectoryRename", "exclusiveCreate", "fileFsync", "directoryFsync",
    "crossDeviceFallbackAllowed", "actualProductionPathUsed", "attestationHash"];
  if (!exactKeys(value, fields) ||
      value.contractVersion !== "finple.step114-2x-zb-r.platform-attestation.v1" ||
      value.probeRootKind !== "isolated_temporary_directory" ||
      !isSha(value.probeRootPolicyIdentity) ||
      value.atomicSameDirectoryRename !== true || value.exclusiveCreate !== true ||
      value.fileFsync !== true || typeof value.directoryFsync !== "boolean" ||
      value.crossDeviceFallbackAllowed !== false ||
      value.actualProductionPathUsed !== false) return false;
  const body = { ...value }; delete body.attestationHash;
  return value.attestationHash === hashContract(
    "FINPLE_STEP114_2X_ZB_R_PLATFORM_ATTESTATION\0", body);
}
function buildPlatformAttestation(input) {
  const body = { contractVersion: "finple.step114-2x-zb-r.platform-attestation.v1",
    probeRootKind: "isolated_temporary_directory",
    probeRootPolicyIdentity: input.probeRootPolicyIdentity,
    atomicSameDirectoryRename: input.atomicSameDirectoryRename,
    exclusiveCreate: input.exclusiveCreate, fileFsync: input.fileFsync,
    directoryFsync: input.directoryFsync,
    crossDeviceFallbackAllowed: false, actualProductionPathUsed: false };
  return deepFreeze({ ...body, attestationHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_PLATFORM_ATTESTATION\0", body) });
}

function buildReadOnlyProductionConfigurationMaterial(input) {
  if (!exactKeys(input, BUILDER_FIELDS) || !isGitSha(input.executionMainSha) ||
      typeof input.gitExecFileSync !== "function" ||
      !isSha(input.restorationMaterialIdentity) ||
      !validateNoOpFaultInjectorContract(input.noOpFaultInjectorContract) ||
      !validatePlatformAttestation(input.platformAttestation)) {
    throw new TypeError("read_only_builder_input_invalid");
  }
  const guard = buildReadOnlyPathGuard(input);
  const approvedRootPolicyIdentity = rootPolicyIdentity("approved_data_root",
    guard.approvedReal);
  const stateRootPolicyIdentity = hashContract(
    "FINPLE_STEP114_2X_ZB_R_STATE_ROOT_POLICY_IDENTITY\0", {
      parentPolicyIdentity: rootPolicyIdentity("state_root_parent", guard.stateParentReal),
      futureStateRootPathIdentity: sha256(Buffer.from(input.futureStateRootPath, "utf8")),
      stateRootAbsent: true,
    });
  if (input.adapterManifest?.approvedRootPolicyIdentity !==
      approvedRootPolicyIdentity || provenance.validateAdapterManifest(
        input.adapterManifest).length) throw new Error("adapter_manifest_root_or_seal_invalid");

  const gitReader = provenance.createExplicitReadOnlyGitObjectReader({
    gitExecutable: input.gitExecutable, execFileSync: input.gitExecFileSync });
  const repositoryMaterial = provenance.buildReadOnlyRepositoryMaterial({
    repositoryRoot: input.repositoryRoot, executionSha: input.executionMainSha,
    criticalSourcePaths: provenance.CRITICAL_SOURCE_PATHS, gitObjectReader: gitReader });

  if (!Array.isArray(input.predecessorPaths) || input.predecessorPaths.length !== 2 ||
      !canonicalEqual(input.predecessorPaths.map((entry) => entry.market), ["US", "KR"]) ||
      !Array.isArray(input.targetPaths) || input.targetPaths.length !== 2 ||
      !canonicalEqual(input.targetPaths.map((entry) => entry.market), ["US", "KR"]) ||
      !Array.isArray(input.candidateContents) || input.candidateContents.length !== 2 ||
      !canonicalEqual(input.candidateContents.map((entry) => entry.market), ["US", "KR"]) ||
      input.candidateContents.some((entry) => !exactKeys(entry, ["market", "bytes"]) ||
        !Buffer.isBuffer(entry.bytes))) throw new TypeError("runtime_csv_material_invalid");

  const predecessorIdentities = input.predecessorPaths.map((entry) => {
    const fields = ["market", "role", "path", "publicPath", "sourcePathIdentityHash",
      "schemaVersion", "normalizedHeader", "normalizedHeaderSha256",
      "schemaIdentitySha256"];
    if (!exactKeys(entry, fields) || entry.sourcePathIdentityHash !==
        pathIdentity(entry.market, entry.publicPath)) throw new Error("predecessor_contract_invalid");
    const bytes = input.filesystem.readFileSync(guard.existingFile(entry.path));
    const derived = adapters.deriveCsvIdentity(bytes, entry);
    return { market: entry.market, sourcePathIdentityHash: entry.sourcePathIdentityHash,
      contentSha256: derived.contentSha256, schemaVersion: derived.schemaVersion,
      schemaIdentitySha256: derived.schemaIdentitySha256,
      datasetIdentityHash: derived.datasetIdentityHash, rowCount: derived.rowCount,
      byteCount: derived.byteCount };
  });
  const targetIdentities = input.targetPaths.map((entry, index) => {
    const candidate = input.candidateContents[index];
    if (!exactKeys(entry, [...ADAPTER_TARGET_CONTRACT_FIELDS,
      "approvedPathIdentityHash"]) || entry.versionedTarget !== true ||
        entry.writeMode !== "create_only" ||
        entry.approvedPathIdentityHash !== pathIdentity(entry.market, entry.publicPath)) {
      throw new Error("versioned_target_contract_invalid");
    }
    guard.absentFile(entry.path);
    const derived = adapters.deriveCsvIdentity(candidate.bytes, entry);
    const expected = { contentSha256: entry.expectedContentSha256,
      schemaIdentitySha256: entry.schemaIdentitySha256,
      datasetIdentityHash: entry.expectedDatasetIdentityHash,
      rowCount: entry.expectedRowCount, byteCount: entry.expectedByteCount };
    if (!canonicalEqual({ contentSha256: derived.contentSha256,
      schemaIdentitySha256: derived.schemaIdentitySha256,
      datasetIdentityHash: derived.datasetIdentityHash, rowCount: derived.rowCount,
      byteCount: derived.byteCount }, expected)) throw new Error("candidate_identity_invalid");
    return { market: entry.market, role: entry.role,
      approvedPathIdentityHash: entry.approvedPathIdentityHash,
      versionedTarget: true, writeMode: "create_only",
      contentSha256: derived.contentSha256, schemaVersion: derived.schemaVersion,
      schemaIdentitySha256: derived.schemaIdentitySha256,
      datasetIdentityHash: derived.datasetIdentityHash, rowCount: derived.rowCount,
      byteCount: derived.byteCount };
  });
  const allPaths = [...input.predecessorPaths.map((entry) => entry.path),
    ...input.targetPaths.map((entry) => entry.path), input.selectorPath.path];
  if (new Set(allPaths).size !== allPaths.length) throw new Error("production_path_alias_invalid");
  if (!exactKeys(input.selectorPath, ["path", "publicPath", "pathIdentityHash"]) ||
      input.selectorPath.pathIdentityHash !== pathIdentity("selector",
        input.selectorPath.publicPath)) throw new Error("selector_path_contract_invalid");
  const selectorPreimageBytes = input.filesystem.readFileSync(
    guard.existingFile(input.selectorPath.path));
  if (!Buffer.isBuffer(input.selectorExpectedPostimageBytes)) {
    throw new TypeError("selector_postimage_bytes_invalid");
  }
  const selectorExpectedPostimageIdentity =
    provenance.buildSelectorExpectedPostimageIdentity({
      selectorPathIdentityHash: input.selectorPath.pathIdentityHash,
      selectorPostimageBytes: input.selectorExpectedPostimageBytes,
      versionedTargetPublicPaths: input.targetPaths.map((entry) => entry.publicPath),
      targetPathIdentities: input.targetPaths.map((entry) => ({ market: entry.market,
        approvedRootPolicyHash: approvedRootPolicyIdentity,
        approvedPathIdentityHash: entry.approvedPathIdentityHash,
        versionedTarget: true, writeMode: "create_only" })),
    });
  const selectorText = input.selectorExpectedPostimageBytes.toString("utf8");
  if (input.predecessorPaths.some((entry) => selectorText.includes(entry.publicPath))) {
    throw new Error("selector_postimage_retains_predecessor_reference");
  }
  const selectorPreimageIdentity = { pathIdentityHash: input.selectorPath.pathIdentityHash,
    contentIdentityHash: sha256(selectorPreimageBytes), byteCount: selectorPreimageBytes.length };

  const rebuiltProvenance = provenance.evaluateCurrentMainProvenanceBridge(
    input.provenancePacket);
  if (!rebuiltProvenance.ok || !canonicalEqual(rebuiltProvenance, input.provenanceResult) ||
      input.provenancePacket.executionMainSha !== input.executionMainSha ||
      !canonicalEqual(input.provenancePacket.repositorySnapshot,
        repositoryMaterial.repositorySnapshot) ||
      !canonicalEqual(input.provenancePacket.observedSourceIdentities,
        repositoryMaterial.observedSourceIdentities) ||
      !canonicalEqual(input.provenancePacket.adapterManifest, input.adapterManifest) ||
      !canonicalEqual(input.provenancePacket.predecessorSourceIdentities,
        predecessorIdentities) ||
      !canonicalEqual(input.provenancePacket.selectorExpectedPostimageIdentity,
        selectorExpectedPostimageIdentity) ||
      input.provenancePacket.currentPreimageManifest.selectorPreimageIdentity
        .contentIdentityHash !== selectorPreimageIdentity.contentIdentityHash ||
      !canonicalEqual(input.provenancePacket.targetPathIdentities.map((entry) =>
        entry.approvedPathIdentityHash), targetIdentities.map((entry) =>
        entry.approvedPathIdentityHash))) {
    throw new Error("current_main_provenance_material_mismatch");
  }

  const za = stepZB.validateStepZA(input.stepZAPacket, input.stepZAResult);
  if (za.issues.length) throw new Error("step_za_chain_validation_failed");
  const envelope = za.stepZDirect.envelope;
  const expectedPlan = stepZA.buildOperationPlan(
    envelope.singleUseProductionCutoverEnvelopeHash);
  if (!canonicalEqual(input.stepZAResult.runtimeMaterialInventory.operationPlan,
    expectedPlan)) throw new Error("step_z_operation_plan_mismatch");
  const expectedTargets = envelope.criticalBindings.productionCsvTargets;
  if (!canonicalEqual(targetIdentities.map((entry) => ({ market: entry.market,
    role: entry.role, contentSha256: entry.contentSha256,
    schemaVersion: entry.schemaVersion, schemaIdentitySha256: entry.schemaIdentitySha256,
    datasetIdentityHash: entry.datasetIdentityHash, rowCount: entry.rowCount,
    byteCount: entry.byteCount })), expectedTargets.map((target) => ({ market: target.market,
    role: target.role, contentSha256: target.contentSha256,
    schemaVersion: target.schemaVersion, schemaIdentitySha256: target.schemaIdentitySha256,
    datasetIdentityHash: target.datasetIdentityHash, rowCount: target.rowCount,
    byteCount: target.byteCount })))) throw new Error("step_z_candidate_binding_mismatch");

  const targetSelectorIdentityHash = hashContract(
    "FINPLE_STEP114_2X_ZB_R_TARGET_SELECTOR_IDENTITY\0", {
      targets: targetIdentities, selectorPreimageIdentity,
      selectorExpectedPostimageIdentity });
  const operationPlanHash = hashContract(
    "FINPLE_STEP114_2X_ZB_R_OPERATION_PLAN\0", expectedPlan);
  const stepZExecutionMaterialDescriptor =
    buildStepZExecutionMaterialDescriptor(input.stepZAPacket, input.stepZAResult);
  const adapterConstructionSchemaIdentity = hashContract(
    "FINPLE_STEP114_2X_ZB_R_ADAPTER_CONSTRUCTION_SCHEMA\0", {
      constructionFields: adapters.CONSTRUCTION_FIELDS,
      capabilityNames: adapters.CAPABILITY_NAMES,
      targetContractFields: [...ADAPTER_TARGET_CONTRACT_FIELDS],
    });
  const singleUseClaimNamespaceHash = stepZB.buildSingleUseClaimNamespaceHash(
    input.stepZAResult.explicitExecutionHandoff);
  const environmentIdentityHash = hashContract(
    "FINPLE_STEP114_2X_ZB_R_ENVIRONMENT_IDENTITY\0", {
      executionMainSha: input.executionMainSha, approvedRootPolicyIdentity,
      stateRootPolicyIdentity,
      repositorySnapshotIdentityHash: repositoryMaterial.repositorySnapshot.snapshotIdentityHash,
    });
  return deepFreeze({ contractVersion: `${VERSION}.read-only-material.v1`,
    executionMainSha: input.executionMainSha,
    repositorySnapshot: repositoryMaterial.repositorySnapshot,
    provenanceBridgeId: rebuiltProvenance.provenanceBridge.provenanceBridgeId,
    provenanceBridgeHash: rebuiltProvenance.provenanceBridge.provenanceBridgeHash,
    adapterManifestId: input.adapterManifest.adapterManifestId,
    adapterManifestHash: input.adapterManifest.adapterManifestHash,
    approvedRootPolicyIdentity, stateRootPolicyIdentity, environmentIdentityHash,
    predecessorIdentities, targetIdentities, selectorPreimageIdentity,
    selectorExpectedPostimageIdentity, targetSelectorIdentityHash,
    noOpFaultInjectorContractIdentity:
      input.noOpFaultInjectorContract.contractIdentityHash,
    platformAttestation: clone(input.platformAttestation),
    adapterConstructionSchemaIdentity, restorationMaterialIdentity:
      input.restorationMaterialIdentity,
    operationPlan: clone(expectedPlan), operationPlanHash,
    stepZExecutionMaterialDescriptor,
    idempotencyIdentities: expectedPlan.map((entry) => ({ sequence: entry.sequence,
      operationId: entry.operationId, idempotencyKey: entry.idempotencyKey })),
    singleUseClaimNamespaceHash, productionCapable: true,
    targetAbsenceValidated: true, selectorReferencesValidated: true,
    stateRootAbsent: true, readOnlyValidationPerformed: true,
    productionExecutionPerformed: false, actualAdapterConstructionPerformed: false,
    productionStateDirectoryCreated: false, rawMaterialPresent: false });
}

function buildProductionConfigurationManifest(material) {
  if (!isRecord(material) || material.readOnlyValidationPerformed !== true ||
      material.targetAbsenceValidated !== true || material.stateRootAbsent !== true ||
      material.rawMaterialPresent !== false) {
    throw new TypeError("read_only_material_not_verified");
  }
  const body = { contractVersion: `${VERSION}.configuration-manifest.v1`,
    executionMainSha: material.executionMainSha,
    repositorySnapshot: material.repositorySnapshot,
    provenanceBridgeId: material.provenanceBridgeId,
    provenanceBridgeHash: material.provenanceBridgeHash,
    adapterManifestId: material.adapterManifestId,
    adapterManifestHash: material.adapterManifestHash,
    approvedRootPolicyIdentity: material.approvedRootPolicyIdentity,
    stateRootPolicyIdentity: material.stateRootPolicyIdentity,
    environmentIdentityHash: material.environmentIdentityHash,
    predecessorIdentities: material.predecessorIdentities,
    targetIdentities: material.targetIdentities,
    selectorPreimageIdentity: material.selectorPreimageIdentity,
    selectorExpectedPostimageIdentity: material.selectorExpectedPostimageIdentity,
    targetSelectorIdentityHash: material.targetSelectorIdentityHash,
    noOpFaultInjectorContractIdentity: material.noOpFaultInjectorContractIdentity,
    platformAttestation: material.platformAttestation,
    adapterConstructionSchemaIdentity: material.adapterConstructionSchemaIdentity,
    restorationMaterialIdentity: material.restorationMaterialIdentity,
    operationPlan: material.operationPlan, operationPlanHash: material.operationPlanHash,
    stepZExecutionMaterialDescriptor: material.stepZExecutionMaterialDescriptor,
    idempotencyIdentities: material.idempotencyIdentities,
    singleUseClaimNamespaceHash: material.singleUseClaimNamespaceHash,
    productionMode: true, productionCapable: true,
    productionConfigurationValidated: true,
    productionConfiguredForLaterExplicitInvocation: true,
    productionExecutionPerformed: false, automaticRetryAllowed: false,
    fallbackAllowed: false, secondCutoverAttemptAllowed: false,
    rawMaterialPresent: false };
  const idHash = hashContract(
    "FINPLE_STEP114_2X_ZB_R_CONFIGURATION_MANIFEST_ID\0", body);
  const withId = { ...body,
    productionConfigurationManifestId: `step114-2x-zb-r-configuration-${idHash}` };
  return deepFreeze({ ...withId, productionConfigurationManifestHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_CONFIGURATION_MANIFEST_HASH\0", withId) });
}

function buildProductionOperatorAllowlist(publicKeyPem, environmentIdentityHash,
  overrides = {}) {
  const { fingerprint } = publicKeyMaterial(publicKeyPem);
  const entry = { signerKeyId: "production-step-zb-r-cutover-operator-key",
    signerSanitizedIdentityHash: hashContract(
      "FINPLE_STEP114_2X_ZB_R_OPERATOR_IDENTITY\0", "operator"),
    publicKeyPem, publicKeyFingerprintSha256: fingerprint, environmentIdentityHash,
    allowedRole: ROLE, allowedScope: SCOPE,
    validFrom: "2026-07-22T04:00:00.000Z",
    validUntil: "2026-07-22T04:05:00.000Z", revoked: false,
    ...(overrides.entry || {}) };
  const body = { contractVersion: `${VERSION}.operator-allowlist.v1`,
    entries: overrides.entries || [entry], productionAuthorization: true,
    syntheticValidationOnly: false, rawMaterialPresent: false,
    ...(overrides.contract || {}) };
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_R_ALLOWLIST_ID\0", body);
  const withId = { ...body,
    operatorAllowlistId: `step114-2x-zb-r-allowlist-${idHash}` };
  return deepFreeze({ ...withId, operatorAllowlistHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_ALLOWLIST_HASH\0", withId) });
}
function normalizeAllowlist(value) {
  const issues = [];
  if (!exactKeys(value, ALLOWLIST_FIELDS)) return { issues: ["allowlist_fields_invalid"], entries: [] };
  const body = Object.fromEntries(ALLOWLIST_FIELDS.slice(0, 5).map((field) =>
    [field, value[field]]));
  const expectedId = `step114-2x-zb-r-allowlist-${hashContract(
    "FINPLE_STEP114_2X_ZB_R_ALLOWLIST_ID\0", body)}`;
  if (value.operatorAllowlistId !== expectedId || value.operatorAllowlistHash !==
      hashContract("FINPLE_STEP114_2X_ZB_R_ALLOWLIST_HASH\0",
        { ...body, operatorAllowlistId: expectedId })) issues.push("allowlist_seal_invalid");
  if (value.productionAuthorization !== true || value.syntheticValidationOnly !== false ||
      value.rawMaterialPresent !== false || !Array.isArray(value.entries) ||
      value.entries.length !== 1) issues.push("allowlist_production_mode_or_count_invalid");
  const entries = [];
  for (const entry of Array.isArray(value.entries) ? value.entries : []) {
    if (!exactKeys(entry, ALLOWLIST_ENTRY_FIELDS) || !isSafeId(entry.signerKeyId) ||
        entry.signerKeyId.includes("*") || !isSha(entry.signerSanitizedIdentityHash) ||
        !isSha(entry.environmentIdentityHash) || entry.allowedRole !== ROLE ||
        entry.allowedScope !== SCOPE || entry.allowedRole.includes("*") ||
        entry.allowedScope.includes("*") || entry.revoked !== false) {
      issues.push("allowlist_entry_contract_invalid"); continue;
    }
    let key = null; let fingerprint = null;
    try { ({ publicKey: key, fingerprint } = publicKeyMaterial(entry.publicKeyPem)); }
    catch { issues.push("allowlist_entry_key_invalid"); }
    const from = parseInstant(entry.validFrom); const until = parseInstant(entry.validUntil);
    if (!key || fingerprint !== entry.publicKeyFingerprintSha256 || from === null ||
        until === null || until <= from) issues.push("allowlist_entry_identity_or_validity_invalid");
    entries.push({ ...entry, publicKey: key, validFromMs: from, validUntilMs: until });
  }
  return { issues: uniqueSorted(issues), entries: issues.length ? [] : entries };
}

function buildHistoricalIdentities() {
  return deepFreeze({ stepZ: { mergedMainSha: stepZ.MERGED_MAIN_SHA,
    contractVersion: stepZ.VERSION }, stepZA: { mergedMainSha: stepZA.MERGED_MAIN_SHA,
    contractVersion: stepZA.VERSION }, stepZB: { mergedMainSha: stepZB.MERGED_MAIN_SHA,
    contractVersion: stepZB.VERSION, syntheticValidationOnlyRequired: true } });
}
function stepZContractIdentityHash() {
  return hashContract("FINPLE_STEP114_2X_ZB_R_STEP_Z_CONTRACT_IDENTITY\0", {
    mergedMainSha: stepZ.MERGED_MAIN_SHA, contractVersion: stepZ.VERSION,
    inputFields: stepZ.INPUT_FIELDS, capabilityNames: stepZ.CAPABILITY_NAMES,
    executionTrace: stepZ.EXECUTION_TRACE });
}
function buildUpstreamNonceHashes(stepZAPacket, historicalZBPacket) {
  const values = [];
  const visit = (value, key = "") => {
    if (Array.isArray(value) && /nonce/i.test(key)) {
      for (const item of value) if (isSha(item)) values.push(item);
    } else if (isRecord(value)) {
      for (const [childKey, child] of Object.entries(value)) visit(child, childKey);
    } else if (isSha(value) && /nonce/i.test(key)) values.push(value);
  };
  visit(stepZAPacket); visit(historicalZBPacket);
  return uniqueSorted(values);
}
function validateHistoricalZB(packet, result) {
  if (!exactKeys(packet, stepZB.INPUT_FIELDS)) return { issues: ["historical_zb_packet_invalid"] };
  let rebuilt;
  try { rebuilt = stepZB.evaluateExplicitProductionCutoverInvocation(packet); }
  catch { return { issues: ["historical_zb_evaluation_failed"] }; }
  if (!rebuilt.ok || !canonicalEqual(rebuilt, result) ||
      packet.productionCutoverOperatorAllowlist.syntheticValidationOnly !== true ||
      packet.signedOperatorAuthorization.syntheticValidationOnly !== true) {
    return { issues: ["historical_zb_synthetic_contract_invalid"] };
  }
  return { issues: [], rebuilt };
}
function buildAuthorizationBody(configurationManifest, signer, nonceContext,
  evaluationClockInstant, overrides = {}) {
  const issuedAt = overrides.issuedAt || evaluationClockInstant;
  const expiresAt = overrides.expiresAt || new Date(
    parseInstant(issuedAt) + MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS * 1000).toISOString();
  const upstreamExpiry = overrides.upstreamExpiry;
  const effectiveExpiresAt = new Date(Math.min(parseInstant(expiresAt),
    parseInstant(upstreamExpiry))).toISOString();
  return { contractVersion: `${VERSION}.production-authorization.v1`,
    executionMainSha: configurationManifest.executionMainSha,
    provenanceBridgeId: configurationManifest.provenanceBridgeId,
    provenanceBridgeHash: configurationManifest.provenanceBridgeHash,
    productionConfigurationManifestId:
      configurationManifest.productionConfigurationManifestId,
    productionConfigurationManifestHash:
      configurationManifest.productionConfigurationManifestHash,
    adapterManifestId: configurationManifest.adapterManifestId,
    adapterManifestHash: configurationManifest.adapterManifestHash,
    targetSelectorIdentityHash: configurationManifest.targetSelectorIdentityHash,
    stepZContractIdentityHash: stepZContractIdentityHash(),
    stepZOperationPlanHash: configurationManifest.operationPlanHash,
    singleUseClaimNamespaceHash: configurationManifest.singleUseClaimNamespaceHash,
    environmentIdentityHash: configurationManifest.environmentIdentityHash,
    authorizationNonceHash: overrides.authorizationNonceHash,
    priorAuthorizationNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_ZB_R_PRIOR_NONCE_CONTEXT\0", nonceContext.prior),
    upstreamNonceContextDigest: hashContract(
      "FINPLE_STEP114_2X_ZB_R_UPSTREAM_NONCE_CONTEXT\0", nonceContext.upstream),
    issuedAt, expiresAt, effectiveExpiresAt, evaluationClockInstant,
    signerKeyId: signer.signerKeyId,
    signerSanitizedIdentityHash: signer.signerSanitizedIdentityHash,
    signerPublicKeyFingerprintSha256: signer.publicKeyFingerprintSha256,
    role: ROLE, scope: SCOPE, signatureAlgorithm: SIGNATURE_ALGORITHM,
    productionAuthorization: true, syntheticValidationOnly: false,
    ...fixedFalse(), ...overrides.body };
}
function sealUnsignedAuthorization(body) {
  if (!exactKeys(body, AUTHORIZATION_BODY_FIELDS)) throw new TypeError("authorization_body_invalid");
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_R_AUTHORIZATION_ID\0", body);
  return deepFreeze({ contractVersion: body.contractVersion,
    productionOperatorAuthorizationId: `step114-2x-zb-r-authorization-${idHash}`,
    ...Object.fromEntries(AUTHORIZATION_BODY_FIELDS.slice(1).map((field) =>
      [field, body[field]])) });
}
function authorizationSignaturePayload(unsigned) {
  return Buffer.from(`FINPLE_STEP114_2X_ZB_R_PRODUCTION_AUTHORIZATION\0${canonicalJson(unsigned)}`,
    "utf8");
}
function sealSignedAuthorization(unsigned, signatureBase64) {
  if (!canonicalBase64(signatureBase64)) throw new TypeError("signature_invalid");
  const withSignature = { ...unsigned, signatureBase64 };
  return deepFreeze({ ...withSignature, productionOperatorAuthorizationHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_AUTHORIZATION_HASH\0", withSignature) });
}
function authorizationSummary(value) {
  const signature = canonicalBase64(value.signatureBase64);
  return deepFreeze({ productionOperatorAuthorizationId:
    value.productionOperatorAuthorizationId,
  productionOperatorAuthorizationHash: value.productionOperatorAuthorizationHash,
  operatorSignatureDigest: signature ? sha256(signature) : null,
  signerKeyId: value.signerKeyId,
  signerSanitizedIdentityHash: value.signerSanitizedIdentityHash,
  signerPublicKeyFingerprintSha256: value.signerPublicKeyFingerprintSha256,
  role: value.role, scope: value.scope, productionAuthorization: true,
  syntheticValidationOnly: false, issuedAt: value.issuedAt,
  effectiveExpiresAt: value.effectiveExpiresAt });
}
function validateProductionAuthorization(value, allowlist, configurationManifest,
  stepZAPacket, historicalZBPacket, historicalZBResult, priorNonceHashes,
  currentEvaluationClockInstant,
  requireCreationClockEquality) {
  const issues = [];
  if (!exactKeys(value, AUTHORIZATION_FIELDS)) return { issues: ["authorization_fields_invalid"] };
  const normalized = normalizeAllowlist(allowlist); issues.push(...normalized.issues);
  const matches = normalized.entries.filter((entry) =>
    entry.signerKeyId === value.signerKeyId &&
    entry.signerSanitizedIdentityHash === value.signerSanitizedIdentityHash &&
    entry.publicKeyFingerprintSha256 === value.signerPublicKeyFingerprintSha256 &&
    entry.environmentIdentityHash === configurationManifest.environmentIdentityHash);
  if (matches.length !== 1) issues.push("authorization_signer_not_exactly_allowlisted");
  const upstreamNonces = buildUpstreamNonceHashes(stepZAPacket, historicalZBPacket);
  const prior = Array.isArray(priorNonceHashes) ? priorNonceHashes : [];
  if (!Array.isArray(priorNonceHashes) || prior.some((item) => !isSha(item)) ||
      !canonicalEqual(prior, [...prior].sort()) || new Set(prior).size !== prior.length ||
      !isSha(value.authorizationNonceHash) || prior.includes(value.authorizationNonceHash) ||
      upstreamNonces.includes(value.authorizationNonceHash)) {
    issues.push("authorization_nonce_replay_or_upstream_collision");
  }
  let expectedUnsigned = null;
  try {
    const expectedBody = buildAuthorizationBody(configurationManifest, {
      signerKeyId: value.signerKeyId,
      signerSanitizedIdentityHash: value.signerSanitizedIdentityHash,
      publicKeyFingerprintSha256: value.signerPublicKeyFingerprintSha256,
    }, { prior, upstream: upstreamNonces }, value.evaluationClockInstant, {
      issuedAt: value.issuedAt, expiresAt: value.expiresAt,
      upstreamExpiry: stepZAPacket.stepZPacket.stepYResult
        .singleUseProductionCutoverEnvelope.effectiveCutoverExpiresAt,
      authorizationNonceHash: value.authorizationNonceHash,
    });
    expectedUnsigned = sealUnsignedAuthorization(expectedBody);
  } catch { issues.push("authorization_body_reconstruction_failed"); }
  const suppliedUnsigned = Object.fromEntries(AUTHORIZATION_FIELDS.slice(0, -2).map(
    (field) => [field, value[field]]));
  if (!expectedUnsigned || !canonicalEqual(suppliedUnsigned, expectedUnsigned)) {
    issues.push("authorization_configuration_binding_mismatch");
  }
  const withSignature = { ...suppliedUnsigned, signatureBase64: value.signatureBase64 };
  if (value.productionOperatorAuthorizationHash !== hashContract(
    "FINPLE_STEP114_2X_ZB_R_AUTHORIZATION_HASH\0", withSignature)) {
    issues.push("authorization_seal_invalid");
  }
  const signature = canonicalBase64(value.signatureBase64);
  if (!signature || !expectedUnsigned || matches.length !== 1) {
    issues.push("authorization_signature_invalid");
  } else {
    try {
      if (!verify(null, authorizationSignaturePayload(expectedUnsigned),
        matches[0].publicKey, signature)) issues.push("authorization_signature_invalid");
    } catch { issues.push("authorization_signature_invalid"); }
  }
  const issued = parseInstant(value.issuedAt); const expires = parseInstant(value.expiresAt);
  const effective = parseInstant(value.effectiveExpiresAt);
  const creationEvaluation = parseInstant(value.evaluationClockInstant);
  const currentEvaluation = parseInstant(currentEvaluationClockInstant);
  const upstreamExpiry = parseInstant(stepZAPacket.stepZPacket.stepYResult
    .singleUseProductionCutoverEnvelope.effectiveCutoverExpiresAt);
  if ([issued, expires, effective, creationEvaluation, currentEvaluation,
    upstreamExpiry].includes(null) || issued > creationEvaluation ||
      creationEvaluation > currentEvaluation || currentEvaluation >= effective ||
      issued >= expires || effective !== Math.min(expires, upstreamExpiry) ||
      expires - issued > MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS * 1000 ||
      (requireCreationClockEquality && value.evaluationClockInstant !==
        currentEvaluationClockInstant)) issues.push("authorization_chronology_or_expiry_invalid");
  if (matches.length === 1 && (issued < matches[0].validFromMs ||
      expires > matches[0].validUntilMs || currentEvaluation < matches[0].validFromMs ||
      currentEvaluation >= matches[0].validUntilMs)) {
    issues.push("authorization_signer_outside_validity_interval");
  }
  let upstreamSigners = [];
  try { upstreamSigners = stepZB.buildUpstreamSignerIdentities(stepZAPacket); }
  catch { issues.push("upstream_signer_identity_validation_failed"); }
  const historicalSigner = historicalZBResult.invocationPackage?.operatorSignerIdentity;
  if (isRecord(historicalSigner)) upstreamSigners.push({
    keyId: historicalSigner.signerKeyId,
    identityHash: historicalSigner.signerSanitizedIdentityHash,
    fingerprint: historicalSigner.signerPublicKeyFingerprintSha256 });
  if (upstreamSigners.some((entry) => entry.keyId === value.signerKeyId ||
      entry.identityHash === value.signerSanitizedIdentityHash ||
      entry.fingerprint === value.signerPublicKeyFingerprintSha256)) {
    issues.push("production_operator_signer_upstream_separation_failed");
  }
  if (value.role !== ROLE || value.scope !== SCOPE ||
      value.signatureAlgorithm !== SIGNATURE_ALGORITHM ||
      value.productionAuthorization !== true || value.syntheticValidationOnly !== false) {
    issues.push("authorization_production_role_scope_algorithm_invalid");
  }
  for (const field of FIXED_FALSE_FIELDS) {
    if (value[field] !== false) issues.push(`authorization_fixed_false_invalid:${field}`);
  }
  return { issues: uniqueSorted(issues), matches, expectedUnsigned,
    upstreamNonces, signerSeparationValidated: !issues.includes(
      "production_operator_signer_upstream_separation_failed") };
}

function buildDependencyDescriptor(configurationManifest) {
  const laterExecutionAssemblerContract = buildLaterExecutionAssemblerContract();
  const body = { contractVersion: `${VERSION}.sanitized-dependency-descriptor.v1`,
    preConstructionDependencyNames: [...DEPENDENCY_SCHEMA.preConstructionDependencyNames],
    postConstructionDependencyNames: [...DEPENDENCY_SCHEMA.postConstructionDependencyNames],
    productionConfigurationManifestId:
      configurationManifest.productionConfigurationManifestId,
    productionConfigurationManifestHash:
      configurationManifest.productionConfigurationManifestHash,
    adapterConstructionSchemaIdentity:
      configurationManifest.adapterConstructionSchemaIdentity,
    noOpFaultInjectorContractIdentity:
      configurationManifest.noOpFaultInjectorContractIdentity,
    stepZExecutionMaterialDescriptorId:
      configurationManifest.stepZExecutionMaterialDescriptor
        .stepZExecutionMaterialDescriptorId,
    stepZExecutionMaterialDescriptorHash:
      configurationManifest.stepZExecutionMaterialDescriptor
        .stepZExecutionMaterialDescriptorHash,
    laterExecutionAssemblerContractId:
      laterExecutionAssemblerContract.laterExecutionAssemblerContractId,
    laterExecutionAssemblerContractHash:
      laterExecutionAssemblerContract.laterExecutionAssemblerContractHash,
    validationMustPrecedeAdapterConstruction: true,
    stateRootCreationAllowedDuringValidation: false,
    actualAdapterConstructionPerformed: false,
    executionPerformed: false, rawMaterialPresent: false };
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_R_DEPENDENCY_DESCRIPTOR_ID\0", body);
  const withId = { ...body,
    dependencyDescriptorId: `step114-2x-zb-r-dependencies-${idHash}` };
  return deepFreeze({ ...withId, dependencyDescriptorHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_DEPENDENCY_DESCRIPTOR_HASH\0", withId) });
}
function buildLaterExecutionAssemblerContract() {
  const body = {
    contractVersion: `${VERSION}.later-execution-assembler-contract.v1`,
    preConstructionValidationDependencies:
      [...DEPENDENCY_SCHEMA.preConstructionDependencyNames],
    postConstructionAssemblyDependencies:
      [...DEPENDENCY_SCHEMA.postConstructionDependencyNames],
    preConstructionValidationRequired: true,
    exactSevenCapabilitiesRequiredAfterConstruction: true,
    assemblerImplementationDeferredToLaterExplicitInvocation: true,
    adapterConstructionAllowedByThisContract: false,
    stateRootCreationAllowedByThisContract: false,
    assemblerInvoked: false,
    executorInvoked: false,
    executionPerformed: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract(
    "FINPLE_STEP114_2X_ZB_R_LATER_ASSEMBLER_CONTRACT_ID\0", body);
  const withId = { ...body, laterExecutionAssemblerContractId:
    `step114-2x-zb-r-later-assembler-${idHash}` };
  return deepFreeze({ ...withId, laterExecutionAssemblerContractHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_LATER_ASSEMBLER_CONTRACT_HASH\0", withId) });
}
function buildProductionInvocationBundle(configurationManifest, authorization,
  stepZAPacket) {
  const auth = authorizationSummary(authorization);
  const dependencyDescriptor = buildDependencyDescriptor(configurationManifest);
  const body = { contractVersion: `${VERSION}.production-invocation-bundle.v1`,
    historicalContracts: buildHistoricalIdentities(),
    executionMainSha: configurationManifest.executionMainSha,
    currentMainProvenanceIdentity: { provenanceBridgeId:
      configurationManifest.provenanceBridgeId, provenanceBridgeHash:
      configurationManifest.provenanceBridgeHash },
    productionConfigurationIdentity: { productionConfigurationManifestId:
      configurationManifest.productionConfigurationManifestId,
    productionConfigurationManifestHash:
      configurationManifest.productionConfigurationManifestHash },
    productionAdapterManifestIdentity: { adapterManifestId:
      configurationManifest.adapterManifestId, adapterManifestHash:
      configurationManifest.adapterManifestHash },
    targetIdentities: configurationManifest.targetIdentities,
    selectorPreimageIdentity: configurationManifest.selectorPreimageIdentity,
    selectorExpectedPostimageIdentity:
      configurationManifest.selectorExpectedPostimageIdentity,
    targetSelectorIdentityHash: configurationManifest.targetSelectorIdentityHash,
    stepZInputShapeIdentity: hashContract(
      "FINPLE_STEP114_2X_ZB_R_STEP_Z_INPUT_SHAPE\0", stepZ.INPUT_FIELDS),
    stepZExecutionMaterialDescriptor:
      configurationManifest.stepZExecutionMaterialDescriptor,
    operationPlan: configurationManifest.operationPlan,
    operationPlanHash: configurationManifest.operationPlanHash,
    idempotencyIdentities: configurationManifest.idempotencyIdentities,
    singleUseClaimNamespaceHash:
      configurationManifest.singleUseClaimNamespaceHash,
    productionOperatorAuthorizationId: auth.productionOperatorAuthorizationId,
    productionOperatorAuthorizationHash: auth.productionOperatorAuthorizationHash,
    operatorSignatureDigest: auth.operatorSignatureDigest,
    operatorSignerIdentity: { signerKeyId: auth.signerKeyId,
      signerSanitizedIdentityHash: auth.signerSanitizedIdentityHash,
      signerPublicKeyFingerprintSha256: auth.signerPublicKeyFingerprintSha256,
      role: auth.role, scope: auth.scope },
    executionClockInstant: authorization.evaluationClockInstant,
    effectiveExpiresAt: authorization.effectiveExpiresAt,
    sanitizedDependencyDescriptor: dependencyDescriptor,
    explicitInvocationRequired: true, singleUse: true,
    productionAuthorizationVerified: true, productionExecutionPerformed: false,
    capabilityInvocationCounts: Object.fromEntries(stepZ.CAPABILITY_NAMES.map(
      (name) => [name, 0])), mutationCount: 0, rawMaterialPresent: false };
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_R_INVOCATION_BUNDLE_ID\0", body);
  const withId = { ...body,
    productionInvocationBundleId: `step114-2x-zb-r-bundle-${idHash}` };
  return deepFreeze({ ...withId, productionInvocationBundleHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_INVOCATION_BUNDLE_HASH\0", withId) });
}
function validateBundleSeal(value) {
  if (!isRecord(value) || typeof value.productionInvocationBundleId !== "string" ||
      !isSha(value.productionInvocationBundleHash)) return ["bundle_shape_invalid"];
  const body = { ...value }; delete body.productionInvocationBundleId;
  delete body.productionInvocationBundleHash;
  const expectedId = `step114-2x-zb-r-bundle-${hashContract(
    "FINPLE_STEP114_2X_ZB_R_INVOCATION_BUNDLE_ID\0", body)}`;
  const withId = { ...body, productionInvocationBundleId: expectedId };
  const issues = [];
  if (value.productionInvocationBundleId !== expectedId ||
      value.productionInvocationBundleHash !== hashContract(
        "FINPLE_STEP114_2X_ZB_R_INVOCATION_BUNDLE_HASH\0", withId)) {
    issues.push("bundle_seal_invalid");
  }
  if (value.explicitInvocationRequired !== true || value.singleUse !== true ||
      value.productionAuthorizationVerified !== true ||
      value.productionExecutionPerformed !== false || value.mutationCount !== 0 ||
      value.rawMaterialPresent !== false || !canonicalEqual(value.historicalContracts,
        buildHistoricalIdentities())) issues.push("bundle_constraints_invalid");
  return uniqueSorted(issues);
}

function evaluateProductionRuntimeBundle(packet) {
  if (packet === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(packet, EVALUATION_FIELDS)) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[0],
    blockingIssues: ["production_runtime_packet_fields_invalid"] });
  let material;
  try { material = buildReadOnlyProductionConfigurationMaterial(packet.readOnlyBuilderInput); }
  catch (error) { return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[0],
    blockingIssues: [String(error.message || "read_only_material_validation_failed")] }); }
  let configurationManifest;
  try { configurationManifest = buildProductionConfigurationManifest(material); }
  catch { return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[1],
    blockingIssues: ["production_configuration_manifest_invalid"] }); }
  const historical = validateHistoricalZB(packet.historicalZBPacket,
    packet.historicalZBResult);
  if (historical.issues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[1],
    blockingIssues: historical.issues });
  if (!isRecord(packet.signedProductionAuthorization) ||
      packet.signedProductionAuthorization.syntheticValidationOnly !== false ||
      packet.signedProductionAuthorization.productionAuthorization !== true) {
    return safeResult(PUBLIC_STATES[2], {
      failureClassification: FAILURE_CLASSIFICATIONS[2],
      blockingIssues: ["historical_synthetic_authorization_not_production_authority"],
      productionConfigurationValidated: true,
      productionConfigurationManifest: configurationManifest });
  }
  const auth = validateProductionAuthorization(packet.signedProductionAuthorization,
    packet.productionOperatorAllowlist, configurationManifest,
    packet.readOnlyBuilderInput.stepZAPacket, packet.historicalZBPacket,
    packet.historicalZBResult,
    packet.priorAuthorizationNonceHashes, packet.evaluationClockInstant, true);
  if (auth.issues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[2], blockingIssues: auth.issues,
    productionConfigurationValidated: true,
    productionConfigurationManifest: configurationManifest });
  const bundle = buildProductionInvocationBundle(configurationManifest,
    packet.signedProductionAuthorization, packet.readOnlyBuilderInput.stepZAPacket);
  const expected = buildProductionInvocationBundle(configurationManifest,
    packet.signedProductionAuthorization, packet.readOnlyBuilderInput.stepZAPacket);
  const bundleIssues = validateBundleSeal(bundle);
  if (bundleIssues.length || !canonicalEqual(bundle, expected)) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[3], blockingIssues: bundleIssues.length
      ? bundleIssues : ["bundle_canonical_reconstruction_failed"] });
  return safeResult(PUBLIC_STATES[1], { productionConfigurationValidated: true,
    productionAuthorizationVerified: true, signerSeparationValidated: true,
    nonceValidated: true, chronologyValidated: true,
    productionConfigurationManifest: configurationManifest,
    productionAuthorization: authorizationSummary(packet.signedProductionAuthorization),
    productionInvocationBundle: bundle,
    sanitizedDependencyDescriptor: bundle.sanitizedDependencyDescriptor });
}

function validateLaterExecutionBoundary(input) {
  if (input === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(input, LATER_BOUNDARY_FIELDS)) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4],
    blockingIssues: ["later_boundary_fields_invalid"] });
  if (!isRecord(input.signedProductionAuthorization)) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4],
    blockingIssues: ["later_boundary_authorization_invalid"] });
  const basePacket = Object.fromEntries(EVALUATION_FIELDS.map((field) =>
    [field, input[field]]));
  basePacket.evaluationClockInstant = input.signedProductionAuthorization
    .evaluationClockInstant;
  const initial = evaluateProductionRuntimeBundle(basePacket);
  if (!initial.ok) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4],
    blockingIssues: initial.blockingIssues });
  let material;
  try { material = buildReadOnlyProductionConfigurationMaterial(input.readOnlyBuilderInput); }
  catch { return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4],
    blockingIssues: ["later_boundary_read_only_material_drift"] }); }
  const manifest = buildProductionConfigurationManifest(material);
  const auth = validateProductionAuthorization(input.signedProductionAuthorization,
    input.productionOperatorAllowlist, manifest, input.readOnlyBuilderInput.stepZAPacket,
    input.historicalZBPacket, input.historicalZBResult,
    input.currentPriorAuthorizationNonceHashes,
    input.currentEvaluationClockInstant, false);
  if (auth.issues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4], blockingIssues: auth.issues });
  const expectedBundle = buildProductionInvocationBundle(manifest,
    input.signedProductionAuthorization, input.readOnlyBuilderInput.stepZAPacket);
  if (!canonicalEqual(input.productionInvocationBundle, expectedBundle)) {
    return safeResult(PUBLIC_STATES[2], {
      failureClassification: FAILURE_CLASSIFICATIONS[4],
      blockingIssues: ["later_boundary_bundle_canonical_mismatch"] });
  }
  return safeResult(PUBLIC_STATES[1], { productionConfigurationValidated: true,
    productionAuthorizationVerified: true, signerSeparationValidated: true,
    nonceValidated: true, chronologyValidated: true,
    laterExecutionBoundaryValidated: true,
    productionConfigurationManifest: manifest,
    productionAuthorization: authorizationSummary(input.signedProductionAuthorization),
    productionInvocationBundle: expectedBundle,
    sanitizedDependencyDescriptor: expectedBundle.sanitizedDependencyDescriptor });
}

module.exports = {
  ALLOWLIST_ENTRY_FIELDS, ALLOWLIST_FIELDS, AUTHORIZATION_BODY_FIELDS,
  ADAPTER_TARGET_CONTRACT_FIELDS, AUTHORIZATION_FIELDS, BUILDER_FIELDS,
  DEPENDENCY_SCHEMA, EVALUATION_FIELDS,
  FAILURE_CLASSIFICATIONS, FIXED_FALSE_FIELDS, IMPLEMENTATION_BASELINE_SHA,
  LATER_BOUNDARY_FIELDS, MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS, PUBLIC_STATES,
  ROLE, SCOPE, SIGNATURE_ALGORITHM, VERSION,
  authorizationSignaturePayload, authorizationSummary,
  buildAuthorizationBody, buildHistoricalIdentities, buildNoOpFaultInjectorContract,
  buildLaterExecutionAssemblerContract, buildPlatformAttestation,
  buildProductionConfigurationManifest,
  buildProductionInvocationBundle, buildProductionOperatorAllowlist,
  buildReadOnlyProductionConfigurationMaterial, buildStepZExecutionMaterialDescriptor,
  canonicalJson, deepFreeze,
  evaluateProductionRuntimeBundle, hashContract, pathIdentity, safeResult,
  rootPolicyIdentity, sha256,
  sealSignedAuthorization, sealUnsignedAuthorization, stepZContractIdentityHash,
  validateBundleSeal, validateLaterExecutionBoundary,
  validateNoOpFaultInjectorContract, validatePlatformAttestation,
  validateProductionAuthorization,
};
