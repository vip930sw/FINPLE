"use strict";

const { createHash, createPublicKey, verify } = require("node:crypto");
const stepZ = require("./metrics-cutover-production-single-use-executor.cjs");
const stepZA = require("./metrics-cutover-production-runtime-ceremony.cjs");
const stepZB = require("./metrics-cutover-production-explicit-invocation-package.cjs");
const provenance = require("./metrics-cutover-current-main-provenance-bridge.cjs");
const adapters = require("./metrics-cutover-production-capability-adapters.cjs");
const noOpFaultInjector = require("./metrics-cutover-production-no-op-fault-injector.cjs");

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
  "selectorExpectedPostimageBytes", "noOpProductionFaultInjector",
  "platformProbe", "restorationMaterial", "adapterManifest",
  "provenancePacket", "provenanceResult", "stepZAPacket", "stepZAResult",
]);
const EVALUATION_FIELDS = Object.freeze([
  "readOnlyBuilderInput", "productionOperatorAllowlist",
  "signedProductionAuthorization", "priorAuthorizationNonceHashes",
  "evaluationClockInstant", "historicalZBPacket", "historicalZBResult",
]);
const PRIVATE_PRODUCTION_CONFIGURATION_FIELDS = Object.freeze([
  "repositoryRoot", "executionMainSha", "approvedRoot", "stateRootParent",
  "futureStateRootPath", "predecessorPaths", "targetPaths", "selectorPath",
  "candidateContents", "selectorExpectedPostimageBytes", "platformProbe",
  "restorationMaterial", "adapterManifest", "provenancePacket", "provenanceResult",
  "historicalZBPacket", "historicalZBResult",
]);
const STEP_Z_IMMUTABLE_EXECUTION_MATERIAL_FIELDS = Object.freeze([
  "stepZAPacket", "stepZAResult", "stepZExecutionMaterialDescriptor",
]);
const PHASE_A_PRE_CONSTRUCTION_FIELDS = Object.freeze([
  "productionInvocationBundle", "signedProductionAuthorization",
  "productionOperatorAllowlist", "currentPriorAuthorizationNonceHashes",
  "currentEvaluationClockInstant", "privateProductionConfigurationMaterial",
  "stepZImmutableExecutionMaterial", "filesystem", "pathApi", "gitExecutable",
  "gitExecFileSync", "noOpProductionFaultInjector",
]);
const LATER_BOUNDARY_FIELDS = PHASE_A_PRE_CONSTRUCTION_FIELDS;
const PHASE_B_POST_CONSTRUCTION_FIELDS = Object.freeze([
  "phaseAPreConstructionResult", "completeStepZPacket", ...stepZ.CAPABILITY_NAMES,
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
  "adapterManifestHash", "runtimeSourceIdentityHash", "targetSelectorIdentityHash",
  "stepZContractIdentityHash",
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
    "productionOperatorAllowlist", "currentPriorAuthorizationNonceHashes",
    "currentEvaluationClockInstant", "privateProductionConfigurationMaterial",
    "stepZImmutableExecutionMaterial", "filesystem", "pathApi", "gitExecutable",
    "gitExecFileSync", "noOpProductionFaultInjector",
  ]),
  postConstructionDependencyNames: Object.freeze([...stepZ.CAPABILITY_NAMES]),
});
const ADAPTER_TARGET_CONTRACT_FIELDS = adapters.TARGET_CONTRACT_FIELDS;
const approvedPhaseAResults = new WeakSet();

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
    phaseAPreConstructionValidated: overrides.phaseAPreConstructionValidated === true,
    phaseBPostConstructionValidated: overrides.phaseBPostConstructionValidated === true,
    phaseAValidationReceipt: overrides.phaseAValidationReceipt || {},
    sanitizedCommandDescriptor: overrides.sanitizedCommandDescriptor || {},
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
function buildReadOnlyApprovedRelativeActualPathIdentity(input) {
  const fields = ["filesystem", "pathApi", "approvedRoot", "candidatePath",
    "pathRole", "leafMayBeMissing"];
  if (!exactKeys(input, fields) || !isRecord(input.filesystem) ||
      !isRecord(input.pathApi) || typeof input.pathRole !== "string" ||
      input.pathRole.length === 0 || typeof input.leafMayBeMissing !== "boolean") {
    throw new TypeError("actual_path_identity_input_invalid");
  }
  const fs = input.filesystem; const path = input.pathApi;
  const requiredFs = ["existsSync", "lstatSync", "realpathSync"];
  const requiredPath = ["basename", "dirname", "isAbsolute", "join", "relative",
    "resolve"];
  if (requiredFs.some((name) => typeof fs[name] !== "function") ||
      requiredPath.some((name) => typeof path[name] !== "function") ||
      typeof path.sep !== "string") throw new TypeError("actual_path_capability_invalid");
  const approvedRoot = path.resolve(input.approvedRoot);
  const candidate = path.resolve(input.candidatePath);
  if (!path.isAbsolute(input.approvedRoot) || approvedRoot !== input.approvedRoot ||
      !path.isAbsolute(input.candidatePath) || candidate !== input.candidatePath ||
      !fs.existsSync(approvedRoot) || fs.lstatSync(approvedRoot).isSymbolicLink()) {
    throw new Error("actual_path_canonicalization_or_root_invalid");
  }
  const approvedRootReal = fs.realpathSync(approvedRoot);
  const lexicalRelative = path.relative(approvedRoot, candidate);
  if (!lexicalRelative || lexicalRelative === ".." ||
      lexicalRelative.startsWith(`..${path.sep}`) || path.isAbsolute(lexicalRelative)) {
    throw new Error("actual_path_root_escape");
  }
  let cursor = approvedRoot;
  const lexicalComponents = lexicalRelative.split(path.sep);
  for (let index = 0; index < lexicalComponents.length; index += 1) {
    const component = lexicalComponents[index];
    if (!component || component === "." || component === "..") {
      throw new Error("actual_path_segment_invalid");
    }
    cursor = path.join(cursor, component);
    if (!fs.existsSync(cursor)) {
      if (input.leafMayBeMissing && index === lexicalComponents.length - 1) break;
      throw new Error("actual_path_parent_missing");
    }
    if (fs.lstatSync(cursor).isSymbolicLink()) {
      throw new Error("actual_path_symlink_or_junction_forbidden");
    }
  }
  let canonicalPath;
  if (fs.existsSync(candidate)) {
    canonicalPath = fs.realpathSync(candidate);
  } else {
    if (!input.leafMayBeMissing) throw new Error("actual_path_missing");
    const parentReal = fs.realpathSync(path.dirname(candidate));
    canonicalPath = path.resolve(parentReal, path.basename(candidate));
  }
  const relative = path.relative(approvedRootReal, canonicalPath);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)) throw new Error("actual_path_realpath_escape");
  const components = relative.split(path.sep);
  if (components.some((component) => !component || component === "." ||
    component === ".." || component.includes("/") || component.includes("\\"))) {
    throw new Error("actual_path_canonical_relative_invalid");
  }
  const canonicalApprovedRelativePath = components.join("/");
  return hashContract(
    "FINPLE_STEP114_2X_ZB_R_APPROVED_RELATIVE_ACTUAL_PATH_IDENTITY\0", {
      pathRole: input.pathRole,
      approvedRootPolicyIdentity: rootPolicyIdentity(
        "approved_data_root", approvedRootReal),
      canonicalApprovedRelativePath,
    });
}

function buildStepZExecutionMaterialDescriptor(stepZAPacket, stepZAResult,
  targetSelectorBindingHash) {
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
    targetSelectorBindingHash,
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
  return noOpFaultInjector.isApprovedNoOpProductionFaultInjector(value);
}
function buildNoOpFaultInjectorContract() {
  return noOpFaultInjector.createNoOpProductionFaultInjector();
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

function runIsolatedPlatformProbe(input) {
  const fields = ["filesystem", "pathApi", "probeRoot", "approvedRoot",
    "stateRootParent", "probeRootPolicyIdentity"];
  if (!exactKeys(input, fields) || !isRecord(input.filesystem) ||
      !isRecord(input.pathApi) || !isSha(input.probeRootPolicyIdentity)) {
    throw new TypeError("platform_probe_input_invalid");
  }
  const fs = input.filesystem; const path = input.pathApi;
  const fsMethods = ["closeSync", "existsSync", "fsyncSync", "lstatSync", "openSync",
    "readFileSync", "realpathSync", "renameSync", "unlinkSync", "writeFileSync"];
  const pathMethods = ["isAbsolute", "join", "relative", "resolve"];
  if (fsMethods.some((name) => typeof fs[name] !== "function") ||
      pathMethods.some((name) => typeof path[name] !== "function") ||
      typeof path.sep !== "string") throw new TypeError("platform_probe_capability_invalid");
  const canonical = (value) => path.resolve(value);
  const probeRoot = canonical(input.probeRoot);
  const approvedRoot = canonical(input.approvedRoot);
  const stateRootParent = canonical(input.stateRootParent);
  if ([input.probeRoot, input.approvedRoot, input.stateRootParent].some(
    (value, index) => !path.isAbsolute(value) || canonical(value) !== value ||
      !fs.existsSync(value) || fs.lstatSync(value).isSymbolicLink() ||
      !fs.lstatSync(value).isDirectory()) ||
      new Set([probeRoot, approvedRoot, stateRootParent]).size !== 3) {
    throw new Error("platform_probe_root_invalid");
  }
  const probeReal = fs.realpathSync(probeRoot);
  const approvedReal = fs.realpathSync(approvedRoot);
  const stateReal = fs.realpathSync(stateRootParent);
  const inside = (root, candidate) => {
    const relative = path.relative(root, candidate);
    return relative === "" || (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
  };
  if (inside(approvedReal, probeReal) || inside(probeReal, approvedReal) ||
      inside(stateReal, probeReal) || inside(probeReal, stateReal) ||
      input.probeRootPolicyIdentity !== rootPolicyIdentity(
        "isolated_platform_probe_root", probeReal)) {
    throw new Error("platform_probe_not_isolated");
  }
  const suffix = input.probeRootPolicyIdentity.slice(0, 20);
  const source = path.join(probeRoot, `.finple-zb-r-probe-${suffix}.tmp`);
  const destination = path.join(probeRoot, `.finple-zb-r-probe-${suffix}.renamed`);
  const payload = Buffer.from(`finple-zb-r-platform-probe:${suffix}\n`, "utf8");
  let sourceCreated = false; let destinationCreated = false; let handle = null;
  let directoryHandle = null; let directoryFsync = false;
  try {
    if (fs.existsSync(source) || fs.existsSync(destination)) {
      throw new Error("platform_probe_preexisting_artifact");
    }
    handle = fs.openSync(source, "wx"); sourceCreated = true;
    let exclusiveCreate = false;
    try { const duplicate = fs.openSync(source, "wx"); fs.closeSync(duplicate); }
    catch (error) { exclusiveCreate = error?.code === "EEXIST"; }
    if (!exclusiveCreate) throw new Error("platform_probe_exclusive_create_failed");
    fs.writeFileSync(handle, payload); fs.fsyncSync(handle); fs.closeSync(handle); handle = null;
    fs.renameSync(source, destination); sourceCreated = false; destinationCreated = true;
    const observed = fs.readFileSync(destination);
    if (!Buffer.isBuffer(observed) || observed.compare(payload) !== 0) {
      throw new Error("platform_probe_renamed_content_mismatch");
    }
    try {
      directoryHandle = fs.openSync(probeRoot, "r");
      fs.fsyncSync(directoryHandle); directoryFsync = true;
    } catch { directoryFsync = false; }
    finally {
      if (directoryHandle !== null) { fs.closeSync(directoryHandle); directoryHandle = null; }
    }
  } finally {
    if (handle !== null) { try { fs.closeSync(handle); } catch {} }
    if (sourceCreated && fs.existsSync(source)) fs.unlinkSync(source);
    if (destinationCreated && fs.existsSync(destination)) fs.unlinkSync(destination);
  }
  if (fs.existsSync(source) || fs.existsSync(destination)) {
    throw new Error("platform_probe_cleanup_failed");
  }
  return buildPlatformAttestation({ probeRootPolicyIdentity: input.probeRootPolicyIdentity,
    atomicSameDirectoryRename: true, exclusiveCreate: true, fileFsync: true,
    directoryFsync });
}

function deriveRestorationMaterialIdentity(restorationMaterial, input,
  selectorPreimageBytes, expectedActualPathIdentities) {
  if (!exactKeys(restorationMaterial, ["contractVersion", "targets", "selector",
    "createOnly"]) || restorationMaterial.contractVersion !==
      "finple.step114-2x-zb-r.private-restoration-material.v1" ||
      restorationMaterial.createOnly !== true ||
      !Array.isArray(restorationMaterial.targets) ||
      restorationMaterial.targets.length !== 2 ||
      !canonicalEqual(restorationMaterial.targets.map((entry) => entry.market), ["US", "KR"]) ||
      !exactKeys(expectedActualPathIdentities, ["targets", "selector"]) ||
      !Array.isArray(expectedActualPathIdentities.targets) ||
      expectedActualPathIdentities.targets.length !== 2 ||
      expectedActualPathIdentities.targets.some((entry) => !isSha(entry)) ||
      !isSha(expectedActualPathIdentities.selector) ||
      !exactKeys(restorationMaterial.selector,
        ["path", "publicPath", "contentBase64"])) {
    throw new TypeError("restoration_material_invalid");
  }
  const targetIdentities = restorationMaterial.targets.map((entry, index) => {
    const target = input.targetPaths[index];
    if (!exactKeys(entry, ["market", "path", "publicPath", "exists"]) ||
        entry.market !== target.market || entry.path !== target.path ||
        entry.publicPath !== target.publicPath || entry.exists !== false) {
      throw new Error("restoration_target_binding_invalid");
    }
    const approvedRelativePathIdentityHash =
      buildReadOnlyApprovedRelativeActualPathIdentity({
        filesystem: input.filesystem, pathApi: input.pathApi,
        approvedRoot: input.approvedRoot, candidatePath: entry.path,
        pathRole: `production_csv_target:${entry.market}`, leafMayBeMissing: true,
      });
    if (approvedRelativePathIdentityHash !== expectedActualPathIdentities.targets[index]) {
      throw new Error("restoration_target_actual_path_identity_mismatch");
    }
    return { market: entry.market,
      publicPathIdentityHash: pathIdentity(entry.market, entry.publicPath),
      approvedRelativePathIdentityHash, exists: false };
  });
  const selectorBytes = canonicalBase64(restorationMaterial.selector.contentBase64);
  if (!selectorBytes || restorationMaterial.selector.path !== input.selectorPath.path ||
      restorationMaterial.selector.publicPath !== input.selectorPath.publicPath ||
      selectorBytes.compare(selectorPreimageBytes) !== 0) {
    throw new Error("restoration_selector_binding_invalid");
  }
  const selectorApprovedRelativePathIdentityHash =
    buildReadOnlyApprovedRelativeActualPathIdentity({
      filesystem: input.filesystem, pathApi: input.pathApi,
      approvedRoot: input.approvedRoot,
      candidatePath: restorationMaterial.selector.path,
      pathRole: "production_selector", leafMayBeMissing: false,
    });
  if (selectorApprovedRelativePathIdentityHash !==
      expectedActualPathIdentities.selector) {
    throw new Error("restoration_selector_actual_path_identity_mismatch");
  }
  const body = {
    contractVersion: "finple.step114-2x-zb-r.restoration-identity.v1",
    targets: targetIdentities,
    selector: { publicPathIdentityHash: input.selectorPath.pathIdentityHash,
      approvedRelativePathIdentityHash: selectorApprovedRelativePathIdentityHash,
      contentSha256: sha256(selectorBytes), byteCount: selectorBytes.length },
    restorationSchemaVersion: "create-only-absent-targets-selector-preimage.v1",
    createOnly: true,
    rawMaterialPresent: false,
  };
  return deepFreeze({ ...body, restorationMaterialIdentityHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_RESTORATION_MATERIAL_IDENTITY\0", body) });
}

function buildReadOnlyProductionConfigurationMaterial(input) {
  if (!exactKeys(input, BUILDER_FIELDS) || !isGitSha(input.executionMainSha) ||
      typeof input.gitExecFileSync !== "function" ||
      !validateNoOpFaultInjectorContract(input.noOpProductionFaultInjector) ||
      !exactKeys(input.platformProbe, ["probeRoot", "probeRootPolicyIdentity"])) {
    throw new TypeError("read_only_builder_input_invalid");
  }
  const guard = buildReadOnlyPathGuard(input);
  const platformAttestation = runIsolatedPlatformProbe({ filesystem: input.filesystem,
    pathApi: input.pathApi, probeRoot: input.platformProbe.probeRoot,
    probeRootPolicyIdentity: input.platformProbe.probeRootPolicyIdentity,
    approvedRoot: input.approvedRoot, stateRootParent: input.stateRootParent });
  const actualPlatformCapabilities = Object.fromEntries(
    adapters.PLATFORM_FIELDS.map((field) => [field, platformAttestation[field]]));
  if (!canonicalEqual(input.adapterManifest?.platformCapabilities,
      actualPlatformCapabilities)) {
    throw new Error("adapter_manifest_platform_capabilities_mismatch");
  }
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
  const runtimeSourceIdentities = repositoryMaterial.observedSourceIdentities.filter(
    (entry) => ["production_runtime_bundle", "production_no_op_fault_injector"]
      .includes(entry.role));
  if (runtimeSourceIdentities.length !== 2 ||
      !canonicalEqual(runtimeSourceIdentities.map(({ role, sourcePath }) =>
        ({ role, sourcePath })), provenance.CRITICAL_SOURCE_PATHS.filter((entry) =>
        ["production_runtime_bundle", "production_no_op_fault_injector"]
          .includes(entry.role)))) {
    throw new Error("runtime_source_provenance_invalid");
  }
  const runtimeSourceIdentityHash = hashContract(
    "FINPLE_STEP114_2X_ZB_R_RUNTIME_SOURCE_IDENTITY\0", runtimeSourceIdentities);

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
  const selectorTargetReferences = input.targetPaths.map((entry) =>
    `./${entry.publicPath.split("/").at(-1)}?raw`);
  const selectorExpectedPostimageIdentity =
    provenance.buildSelectorExpectedPostimageIdentity({
      selectorPathIdentityHash: input.selectorPath.pathIdentityHash,
      selectorPostimageBytes: input.selectorExpectedPostimageBytes,
      versionedTargetPublicPaths: selectorTargetReferences,
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
  const targetApprovedRelativePathIdentityHashes = input.targetPaths.map((entry) =>
    buildReadOnlyApprovedRelativeActualPathIdentity({
      filesystem: input.filesystem, pathApi: input.pathApi,
      approvedRoot: input.approvedRoot, candidatePath: entry.path,
      pathRole: `production_csv_target:${entry.market}`, leafMayBeMissing: true,
    }));
  const selectorApprovedRelativePathIdentityHash =
    buildReadOnlyApprovedRelativeActualPathIdentity({
      filesystem: input.filesystem, pathApi: input.pathApi,
      approvedRoot: input.approvedRoot, candidatePath: input.selectorPath.path,
      pathRole: "production_selector", leafMayBeMissing: false,
    });
  const restorationMaterialIdentity = deriveRestorationMaterialIdentity(
    input.restorationMaterial, input, selectorPreimageBytes, {
      targets: targetApprovedRelativePathIdentityHashes,
      selector: selectorApprovedRelativePathIdentityHash,
    });

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
  const executionPackage = za.stepZDirect.executionPackage;
  const expectedPlan = stepZA.buildOperationPlan(
    envelope.singleUseProductionCutoverEnvelopeHash);
  if (!canonicalEqual(input.stepZAResult.runtimeMaterialInventory.operationPlan,
    expectedPlan)) throw new Error("step_z_operation_plan_mismatch");
  const expectedTargets = envelope.criticalBindings.productionCsvTargets;
  if (!canonicalEqual(input.targetPaths.map((entry) => entry.publicPath),
      expectedTargets.map((entry) => entry.targetPath)) ||
      !canonicalEqual(executionPackage.targetFiles.map((entry) => entry.path),
        expectedTargets.map((entry) => entry.targetPath)) ||
      input.selectorPath.publicPath !== executionPackage.selectorPreimage.selectorPath ||
      input.selectorPath.publicPath !== executionPackage.selectorPostimage.selectorPath ||
      sha256(selectorPreimageBytes) !== envelope.criticalBindings.selectorPreimageSha256 ||
      sha256(input.selectorExpectedPostimageBytes) !==
        envelope.criticalBindings.selectorExpectedPostimageSha256 ||
      !canonicalEqual(selectorTargetReferences, expectedTargets.map((entry) =>
        `./${entry.targetPath.split("/").at(-1)}?raw`))) {
    throw new Error("step_z_target_selector_binding_mismatch");
  }
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
  const targetSelectorBindingHash = hashContract(
    "FINPLE_STEP114_2X_ZB_R_STEP_Z_TARGET_SELECTOR_BINDING\0", {
      targetPaths: input.targetPaths.map((entry) => ({ market: entry.market,
        pathIdentityHash: entry.approvedPathIdentityHash, publicPath: entry.publicPath })),
      selectorPathIdentityHash: input.selectorPath.pathIdentityHash,
      selectorPreimageSha256: selectorPreimageIdentity.contentIdentityHash,
      selectorExpectedPostimageSha256: selectorExpectedPostimageIdentity.contentSha256,
      selectorTargetReferences,
    });
  const operationPlanHash = hashContract(
    "FINPLE_STEP114_2X_ZB_R_OPERATION_PLAN\0", expectedPlan);
  const stepZExecutionMaterialDescriptor =
    buildStepZExecutionMaterialDescriptor(input.stepZAPacket, input.stepZAResult,
      targetSelectorBindingHash);
  const adapterConstructionSchemaIdentity =
    adapters.buildAdapterConstructionSchemaIdentity();
  const adapterConstructionBinding =
    adapters.buildProductionAdapterConstructionBinding({
      executionIdentity: { mainSha: input.executionMainSha,
        headSha: repositoryMaterial.repositorySnapshot.headSha,
        treeSha: repositoryMaterial.repositorySnapshot.treeSha },
      approvedRootPolicyIdentity, stateRootPolicyIdentity,
      targetContracts: input.targetPaths.map((entry, index) => ({
        role: entry.role, market: entry.market,
        publicPathIdentityHash: entry.approvedPathIdentityHash,
        approvedRelativePathIdentityHash:
          targetApprovedRelativePathIdentityHashes[index],
        publicPath: entry.publicPath, versionedTarget: entry.versionedTarget,
        writeMode: entry.writeMode, schemaVersion: entry.schemaVersion,
        normalizedHeaderSha256: entry.normalizedHeaderSha256,
        schemaIdentitySha256: entry.schemaIdentitySha256,
        expectedContentSha256: entry.expectedContentSha256,
        expectedDatasetIdentityHash: entry.expectedDatasetIdentityHash,
        expectedRowCount: entry.expectedRowCount,
        expectedByteCount: entry.expectedByteCount,
      })),
      selectorBinding: {
        publicPathIdentityHash: input.selectorPath.pathIdentityHash,
        approvedRelativePathIdentityHash:
          selectorApprovedRelativePathIdentityHash,
        publicPath: input.selectorPath.publicPath,
        preimageSha256: selectorPreimageIdentity.contentIdentityHash,
        expectedPostimageSha256: selectorExpectedPostimageIdentity.contentSha256,
        targetReferences: selectorTargetReferences },
      operationPlan: clone(expectedPlan),
      platformCapabilities: actualPlatformCapabilities,
      restorationMaterialIdentity,
      noOpProductionFaultInjectorIdentity:
        adapters.buildNoOpProductionFaultInjectorIdentity(
          input.noOpProductionFaultInjector),
      adapterConstructionSchemaIdentity,
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
    runtimeSourceIdentities, runtimeSourceIdentityHash,
    approvedRootPolicyIdentity, stateRootPolicyIdentity, environmentIdentityHash,
    predecessorIdentities, targetIdentities, selectorPreimageIdentity,
    selectorExpectedPostimageIdentity, targetSelectorIdentityHash,
    noOpFaultInjectorContractIdentity:
      input.noOpProductionFaultInjector.descriptor.descriptorHash,
    platformAttestation: clone(platformAttestation),
    adapterConstructionSchemaIdentity, adapterConstructionBinding,
    restorationMaterialIdentity,
    operationPlan: clone(expectedPlan), operationPlanHash,
    stepZExecutionMaterialDescriptor, targetSelectorBindingHash,
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
    runtimeSourceIdentities: material.runtimeSourceIdentities,
    runtimeSourceIdentityHash: material.runtimeSourceIdentityHash,
    approvedRootPolicyIdentity: material.approvedRootPolicyIdentity,
    stateRootPolicyIdentity: material.stateRootPolicyIdentity,
    environmentIdentityHash: material.environmentIdentityHash,
    predecessorIdentities: material.predecessorIdentities,
    targetIdentities: material.targetIdentities,
    selectorPreimageIdentity: material.selectorPreimageIdentity,
    selectorExpectedPostimageIdentity: material.selectorExpectedPostimageIdentity,
    targetSelectorIdentityHash: material.targetSelectorIdentityHash,
    targetSelectorBindingHash: material.targetSelectorBindingHash,
    noOpFaultInjectorContractIdentity: material.noOpFaultInjectorContractIdentity,
    platformAttestation: material.platformAttestation,
    adapterConstructionSchemaIdentity: material.adapterConstructionSchemaIdentity,
    adapterConstructionBinding: material.adapterConstructionBinding,
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
    runtimeSourceIdentityHash: configurationManifest.runtimeSourceIdentityHash,
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
    runtimeSourceProvenanceIdentity: {
      runtimeSourceIdentities: configurationManifest.runtimeSourceIdentities,
      runtimeSourceIdentityHash: configurationManifest.runtimeSourceIdentityHash,
    },
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

function stepZImmutableCoreHash(packet) {
  if (!exactKeys(packet, stepZ.INPUT_FIELDS)) throw new TypeError("step_z_packet_fields_invalid");
  const direct = stepZ.directValidateStepY(packet);
  if (direct.issues.length) throw new Error("step_z_immutable_core_chain_invalid");
  const envelope = direct.envelope;
  return hashContract("FINPLE_STEP114_2X_ZB_R_STEP_Z_IMMUTABLE_CORE\0", {
    mergedMainSha: packet.mergedMainSha,
    executionClockInstant: packet.executionClockInstant,
    stepYResultStatus: packet.stepYResult.status,
    productionCutoverApprovalId: envelope.productionCutoverApprovalId,
    productionCutoverApprovalHash: envelope.productionCutoverApprovalHash,
    singleUseProductionCutoverEnvelopeId: envelope.singleUseProductionCutoverEnvelopeId,
    singleUseProductionCutoverEnvelopeHash:
      envelope.singleUseProductionCutoverEnvelopeHash,
    criticalBindings: envelope.criticalBindings,
  });
}

function buildPhaseAValidationReceipt(manifest, bundle, immutableMaterial,
  evaluationClockInstant) {
  const body = {
    contractVersion: `${VERSION}.phase-a-validation-receipt.v1`,
    productionConfigurationManifestId: manifest.productionConfigurationManifestId,
    productionConfigurationManifestHash: manifest.productionConfigurationManifestHash,
    productionInvocationBundleId: bundle.productionInvocationBundleId,
    productionInvocationBundleHash: bundle.productionInvocationBundleHash,
    stepZImmutableCoreHash: stepZImmutableCoreHash(
      immutableMaterial.stepZAPacket.stepZPacket),
    stepZExecutionMaterialDescriptorId:
      immutableMaterial.stepZExecutionMaterialDescriptor
        .stepZExecutionMaterialDescriptorId,
    stepZExecutionMaterialDescriptorHash:
      immutableMaterial.stepZExecutionMaterialDescriptor
        .stepZExecutionMaterialDescriptorHash,
    targetSelectorBindingHash: manifest.targetSelectorBindingHash,
    adapterConstructionBindingHash:
      manifest.adapterConstructionBinding.adapterConstructionBindingHash,
    runtimeSourceIdentityHash: manifest.runtimeSourceIdentityHash,
    restorationMaterialIdentityHash:
      manifest.restorationMaterialIdentity.restorationMaterialIdentityHash,
    evaluationClockInstant,
    preConstructionValidationComplete: true,
    adapterConstructionPerformed: false,
    stateRootCreated: false,
    capabilityMethodInvoked: false,
    executionPerformed: false,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_R_PHASE_A_RECEIPT_ID\0", body);
  const withId = { ...body,
    phaseAValidationReceiptId: `step114-2x-zb-r-phase-a-${idHash}` };
  return deepFreeze({ ...withId, phaseAValidationReceiptHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_PHASE_A_RECEIPT_HASH\0", withId) });
}

function validatePhaseAPreConstructionBoundary(input) {
  if (input === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(input, PHASE_A_PRE_CONSTRUCTION_FIELDS)) {
    return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4],
    blockingIssues: ["phase_a_fields_invalid"] });
  }
  const privateMaterial = input.privateProductionConfigurationMaterial;
  const immutableMaterial = input.stepZImmutableExecutionMaterial;
  if (!exactKeys(privateMaterial, PRIVATE_PRODUCTION_CONFIGURATION_FIELDS) ||
      !exactKeys(immutableMaterial, STEP_Z_IMMUTABLE_EXECUTION_MATERIAL_FIELDS) ||
      !isRecord(input.signedProductionAuthorization) ||
      !validateNoOpFaultInjectorContract(input.noOpProductionFaultInjector)) {
    return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4],
    blockingIssues: ["phase_a_private_or_immutable_material_invalid"] });
  }
  const readOnlyBuilderInput = {
    filesystem: input.filesystem, pathApi: input.pathApi,
    repositoryRoot: privateMaterial.repositoryRoot,
    gitExecutable: input.gitExecutable, gitExecFileSync: input.gitExecFileSync,
    executionMainSha: privateMaterial.executionMainSha,
    approvedRoot: privateMaterial.approvedRoot,
    stateRootParent: privateMaterial.stateRootParent,
    futureStateRootPath: privateMaterial.futureStateRootPath,
    predecessorPaths: privateMaterial.predecessorPaths,
    targetPaths: privateMaterial.targetPaths,
    selectorPath: privateMaterial.selectorPath,
    candidateContents: privateMaterial.candidateContents,
    selectorExpectedPostimageBytes: privateMaterial.selectorExpectedPostimageBytes,
    noOpProductionFaultInjector: input.noOpProductionFaultInjector,
    platformProbe: privateMaterial.platformProbe,
    restorationMaterial: privateMaterial.restorationMaterial,
    adapterManifest: privateMaterial.adapterManifest,
    provenancePacket: privateMaterial.provenancePacket,
    provenanceResult: privateMaterial.provenanceResult,
    stepZAPacket: immutableMaterial.stepZAPacket,
    stepZAResult: immutableMaterial.stepZAResult,
  };
  let material; let manifest;
  try {
    material = buildReadOnlyProductionConfigurationMaterial(readOnlyBuilderInput);
    manifest = buildProductionConfigurationManifest(material);
  } catch (error) {
    return safeResult(PUBLIC_STATES[2], {
      failureClassification: FAILURE_CLASSIFICATIONS[4],
      blockingIssues: [String(error.message || "phase_a_read_only_validation_failed")] });
  }
  if (!canonicalEqual(immutableMaterial.stepZExecutionMaterialDescriptor,
      manifest.stepZExecutionMaterialDescriptor)) {
    return safeResult(PUBLIC_STATES[2], {
      failureClassification: FAILURE_CLASSIFICATIONS[4],
      blockingIssues: ["phase_a_step_z_immutable_material_mismatch"] });
  }
  const historical = validateHistoricalZB(privateMaterial.historicalZBPacket,
    privateMaterial.historicalZBResult);
  if (historical.issues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4],
    blockingIssues: historical.issues });
  const auth = validateProductionAuthorization(input.signedProductionAuthorization,
    input.productionOperatorAllowlist, manifest, immutableMaterial.stepZAPacket,
    privateMaterial.historicalZBPacket, privateMaterial.historicalZBResult,
    input.currentPriorAuthorizationNonceHashes,
    input.currentEvaluationClockInstant, false);
  if (auth.issues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4],
    blockingIssues: auth.issues });
  const expectedBundle = buildProductionInvocationBundle(manifest,
    input.signedProductionAuthorization, immutableMaterial.stepZAPacket);
  if (!canonicalEqual(input.productionInvocationBundle, expectedBundle)) {
    return safeResult(PUBLIC_STATES[2], {
      failureClassification: FAILURE_CLASSIFICATIONS[4],
      blockingIssues: ["phase_a_bundle_canonical_mismatch"] });
  }
  const receipt = buildPhaseAValidationReceipt(manifest, expectedBundle,
    immutableMaterial, input.currentEvaluationClockInstant);
  const result = safeResult(PUBLIC_STATES[1], { productionConfigurationValidated: true,
    productionAuthorizationVerified: true, signerSeparationValidated: true,
    nonceValidated: true, chronologyValidated: true,
    laterExecutionBoundaryValidated: true, phaseAPreConstructionValidated: true,
    phaseAValidationReceipt: receipt,
    productionConfigurationManifest: manifest,
    productionAuthorization: authorizationSummary(input.signedProductionAuthorization),
    productionInvocationBundle: expectedBundle,
    sanitizedDependencyDescriptor: expectedBundle.sanitizedDependencyDescriptor });
  approvedPhaseAResults.add(result);
  return result;
}

function buildPhaseBCommandDescriptor(phaseAResult, packet) {
  const receipt = phaseAResult.phaseAValidationReceipt;
  const body = {
    contractVersion: `${VERSION}.phase-b-sanitized-command-descriptor.v1`,
    phaseAValidationReceiptId: receipt.phaseAValidationReceiptId,
    phaseAValidationReceiptHash: receipt.phaseAValidationReceiptHash,
    productionInvocationBundleId:
      phaseAResult.productionInvocationBundle.productionInvocationBundleId,
    productionInvocationBundleHash:
      phaseAResult.productionInvocationBundle.productionInvocationBundleHash,
    stepZImmutableCoreHash: stepZImmutableCoreHash(packet),
    targetSelectorBindingHash: receipt.targetSelectorBindingHash,
    adapterConstructionBindingHash: receipt.adapterConstructionBindingHash,
    capabilityBindings: stepZ.CAPABILITY_NAMES.map((name) => ({
      capabilityName: name, descriptor: clone(packet[name].descriptor),
    })),
    commandConstructed: true,
    executorInvoked: false,
    capabilityMethodInvoked: false,
    executionPerformed: false,
    mutationCount: 0,
    rawMaterialPresent: false,
  };
  const idHash = hashContract("FINPLE_STEP114_2X_ZB_R_PHASE_B_COMMAND_ID\0", body);
  const withId = { ...body,
    phaseBCommandDescriptorId: `step114-2x-zb-r-phase-b-command-${idHash}` };
  return deepFreeze({ ...withId, phaseBCommandDescriptorHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_PHASE_B_COMMAND_HASH\0", withId) });
}

function validatePhaseBPostConstructionBoundary(input) {
  if (input === undefined) return safeResult(PUBLIC_STATES[0]);
  if (!exactKeys(input, PHASE_B_POST_CONSTRUCTION_FIELDS) ||
      !approvedPhaseAResults.has(input.phaseAPreConstructionResult) ||
      !exactKeys(input.completeStepZPacket, stepZ.INPUT_FIELDS)) {
    return safeResult(PUBLIC_STATES[2], {
      failureClassification: FAILURE_CLASSIFICATIONS[4],
      blockingIssues: ["phase_b_fields_or_phase_a_result_invalid"] });
  }
  const issues = [];
  try {
    if (stepZImmutableCoreHash(input.completeStepZPacket) !==
        input.phaseAPreConstructionResult.phaseAValidationReceipt.stepZImmutableCoreHash) {
      issues.push("phase_b_step_z_immutable_core_mismatch");
    }
  } catch { issues.push("phase_b_step_z_immutable_core_invalid"); }
  for (const name of stepZ.CAPABILITY_NAMES) {
    if (input[name] !== input.completeStepZPacket[name]) {
      issues.push(`phase_b_capability_object_identity_mismatch:${name}`);
    }
  }
  const capabilitySet = Object.fromEntries(stepZ.CAPABILITY_NAMES.map((name) =>
    [name, input[name]]));
  const constructionBinding =
    adapters.getVerifiedProductionAdapterConstructionBinding(capabilitySet);
  if (!constructionBinding) {
    issues.push("phase_b_adapter_factory_provenance_invalid");
  } else if (!canonicalEqual(constructionBinding,
    input.phaseAPreConstructionResult.productionConfigurationManifest
      .adapterConstructionBinding)) {
    issues.push("phase_b_adapter_construction_binding_mismatch");
  }
  issues.push(...stepZ.validateAllCapabilities(input.completeStepZPacket));
  if (input.phaseAPreConstructionResult.productionConfigurationManifest
    .targetSelectorBindingHash !== input.phaseAPreConstructionResult
      .phaseAValidationReceipt.targetSelectorBindingHash) {
    issues.push("phase_b_configuration_target_selector_binding_mismatch");
  }
  if (issues.length) return safeResult(PUBLIC_STATES[2], {
    failureClassification: FAILURE_CLASSIFICATIONS[4],
    blockingIssues: issues });
  const descriptor = buildPhaseBCommandDescriptor(
    input.phaseAPreConstructionResult, input.completeStepZPacket);
  return safeResult(PUBLIC_STATES[1], {
    productionConfigurationValidated: true,
    productionAuthorizationVerified: true,
    signerSeparationValidated: true, nonceValidated: true,
    chronologyValidated: true, laterExecutionBoundaryValidated: true,
    phaseAPreConstructionValidated: true, phaseBPostConstructionValidated: true,
    phaseAValidationReceipt: input.phaseAPreConstructionResult.phaseAValidationReceipt,
    productionConfigurationManifest:
      input.phaseAPreConstructionResult.productionConfigurationManifest,
    productionAuthorization: input.phaseAPreConstructionResult.productionAuthorization,
    productionInvocationBundle:
      input.phaseAPreConstructionResult.productionInvocationBundle,
    sanitizedDependencyDescriptor:
      input.phaseAPreConstructionResult.sanitizedDependencyDescriptor,
    sanitizedCommandDescriptor: descriptor,
  });
}

const validateLaterExecutionBoundary = validatePhaseAPreConstructionBoundary;

module.exports = {
  ALLOWLIST_ENTRY_FIELDS, ALLOWLIST_FIELDS, AUTHORIZATION_BODY_FIELDS,
  ADAPTER_TARGET_CONTRACT_FIELDS, AUTHORIZATION_FIELDS, BUILDER_FIELDS,
  DEPENDENCY_SCHEMA, EVALUATION_FIELDS,
  FAILURE_CLASSIFICATIONS, FIXED_FALSE_FIELDS, IMPLEMENTATION_BASELINE_SHA,
  LATER_BOUNDARY_FIELDS, MAXIMUM_AUTHORIZATION_LIFETIME_SECONDS,
  PHASE_A_PRE_CONSTRUCTION_FIELDS, PHASE_B_POST_CONSTRUCTION_FIELDS,
  PRIVATE_PRODUCTION_CONFIGURATION_FIELDS, PUBLIC_STATES,
  ROLE, SCOPE, SIGNATURE_ALGORITHM, VERSION,
  STEP_Z_IMMUTABLE_EXECUTION_MATERIAL_FIELDS,
  authorizationSignaturePayload, authorizationSummary,
  buildAuthorizationBody, buildHistoricalIdentities, buildNoOpFaultInjectorContract,
  buildLaterExecutionAssemblerContract,
  buildProductionConfigurationManifest,
  buildProductionInvocationBundle, buildProductionOperatorAllowlist,
  buildReadOnlyProductionConfigurationMaterial, buildStepZExecutionMaterialDescriptor,
  canonicalJson, deepFreeze,
  evaluateProductionRuntimeBundle, hashContract, pathIdentity, safeResult,
  rootPolicyIdentity, sha256,
  runIsolatedPlatformProbe,
  sealSignedAuthorization, sealUnsignedAuthorization, stepZContractIdentityHash,
  validateBundleSeal, validateLaterExecutionBoundary,
  validatePhaseAPreConstructionBoundary, validatePhaseBPostConstructionBoundary,
  validateNoOpFaultInjectorContract, validatePlatformAttestation,
  validateProductionAuthorization, deriveRestorationMaterialIdentity,
};
