"use strict";

const { createHash, generateKeyPairSync, sign } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const stepZB = require("../lib/metrics-cutover-production-explicit-invocation-package.cjs");
const stepZBFixture = require(
  "./metrics-cutover-production-explicit-invocation-package-fixture.cjs");
const provenance = require("../lib/metrics-cutover-current-main-provenance-bridge.cjs");
const adapters = require("../lib/metrics-cutover-production-capability-adapters.cjs");
const subject = require("../lib/metrics-cutover-production-runtime-bundle.cjs");

const EXECUTION_SHA = "abcdefabcdefabcdefabcdefabcdefabcdefabcd";
const TREE_SHA = "1234512345123451234512345123451234512345";
const EVALUATION_CLOCK = "2026-07-18T00:03:29.000Z";
const PRODUCTION_KEYS = generateKeyPairSync("ed25519");

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function gitBlobSha(bytes) {
  return createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
}
function productionPem(keys = PRODUCTION_KEYS) {
  return keys.publicKey.export({ type: "spki", format: "pem" });
}
function signerFromAllowlist(allowlist) {
  const entry = allowlist.entries[0];
  return { signerKeyId: entry.signerKeyId,
    signerSanitizedIdentityHash: entry.signerSanitizedIdentityHash,
    publicKeyFingerprintSha256: entry.publicKeyFingerprintSha256 };
}
function signAuthorizationBody(body, privateKey = PRODUCTION_KEYS.privateKey) {
  const unsigned = subject.sealUnsignedAuthorization(body);
  const signatureBase64 = sign(null, subject.authorizationSignaturePayload(unsigned),
    privateKey).toString("base64");
  return subject.sealSignedAuthorization(unsigned, signatureBase64);
}
function resealAuthorization(authorization, overrides = {}, privateKey = PRODUCTION_KEYS.privateKey) {
  const body = Object.fromEntries(subject.AUTHORIZATION_BODY_FIELDS.map((field) =>
    [field, Object.prototype.hasOwnProperty.call(overrides, field)
      ? overrides[field] : clone(authorization[field])]));
  return signAuthorizationBody(body, privateKey);
}
function resealAllowlist(allowlist) {
  const body = Object.fromEntries(subject.ALLOWLIST_FIELDS.slice(0, 5).map(
    (field) => [field, clone(allowlist[field])]));
  const id = `step114-2x-zb-r-allowlist-${subject.hashContract(
    "FINPLE_STEP114_2X_ZB_R_ALLOWLIST_ID\0", body)}`;
  return { ...body, operatorAllowlistId: id, operatorAllowlistHash: subject.hashContract(
    "FINPLE_STEP114_2X_ZB_R_ALLOWLIST_HASH\0", { ...body, operatorAllowlistId: id }) };
}
function sourceRepositoryMaterial(repositoryRoot) {
  const blobs = new Map(provenance.CRITICAL_SOURCE_PATHS.map(({ sourcePath }, index) => {
    const bytes = Buffer.from(`synthetic reviewed source ${index}\n`);
    return [sourcePath, { bytes, blobSha: gitBlobSha(bytes) }];
  }));
  const gitExecFileSync = (_executable, args) => {
    const command = args[2];
    if (command === "rev-parse") {
      return args[4].endsWith("^{commit}") ? `${EXECUTION_SHA}\n` : `${TREE_SHA}\n`;
    }
    if (command === "ls-tree") {
      const sourcePath = args.at(-1); const blob = blobs.get(sourcePath);
      return Buffer.from(`100644 blob ${blob.blobSha}\t${sourcePath}\0`);
    }
    if (command === "cat-file") {
      const blob = [...blobs.values()].find((entry) => entry.blobSha === args[4]);
      return blob.bytes;
    }
    throw new Error("unexpected_git_command");
  };
  const gitExecutable = process.platform === "win32" ? "C:/synthetic/git.exe" : "/synthetic/git";
  const reader = provenance.createExplicitReadOnlyGitObjectReader({
    gitExecutable, execFileSync: gitExecFileSync });
  const repositoryMaterial = provenance.buildReadOnlyRepositoryMaterial({
    repositoryRoot, executionSha: EXECUTION_SHA,
    criticalSourcePaths: provenance.CRITICAL_SOURCE_PATHS, gitObjectReader: reader });
  return { repositoryMaterial, gitExecutable, gitExecFileSync };
}
function makeTargetContract(target, targetPath, publicPath, bytes, approvedPathIdentityHash) {
  const normalizedHeader = bytes.toString("utf8").split(/\r?\n/, 1)[0];
  return { role: target.role, market: target.market, path: targetPath, publicPath,
    versionedTarget: true, writeMode: "create_only",
    schemaVersion: target.schemaVersion, normalizedHeader,
    normalizedHeaderSha256: subject.sha256(normalizedHeader),
    schemaIdentitySha256: target.schemaIdentitySha256,
    expectedContentSha256: target.contentSha256,
    expectedDatasetIdentityHash: target.datasetIdentityHash,
    expectedRowCount: target.rowCount, expectedByteCount: target.byteCount,
    approvedPathIdentityHash };
}
function makePredecessorContract(target, predecessorPath, publicPath, bytes) {
  const normalizedHeader = bytes.toString("utf8").split(/\r?\n/, 1)[0];
  return { market: target.market, role: target.role, path: predecessorPath, publicPath,
    sourcePathIdentityHash: subject.pathIdentity(target.market, publicPath),
    schemaVersion: target.schemaVersion, normalizedHeader,
    normalizedHeaderSha256: subject.sha256(normalizedHeader),
    schemaIdentitySha256: target.schemaIdentitySha256 };
}

let cachedHistorical;
function historical() {
  if (cachedHistorical) return cachedHistorical;
  const built = stepZBFixture.buildFixture();
  const result = stepZB.evaluateExplicitProductionCutoverInvocation(built.packet);
  if (!result.ok) throw new Error(`historical_zb_fixture_invalid:${result.blockingIssues}`);
  cachedHistorical = { built, result };
  return cachedHistorical;
}

function buildFixture(testContext) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "finple-zb-r-runtime-"));
  const repositoryRoot = path.join(root, "repository");
  const approvedRoot = path.join(root, "approved");
  const stateRootParent = path.join(root, "state-parent");
  fs.mkdirSync(repositoryRoot); fs.mkdirSync(approvedRoot); fs.mkdirSync(stateRootParent);
  const { built: historicalBuilt, result: historicalResult } = historical();
  const stepZAPacket = historicalBuilt.packet.stepZAPacket;
  const stepZAResult = historicalBuilt.packet.stepZAResult;
  const za = stepZB.validateStepZA(stepZAPacket, stepZAResult);
  if (za.issues.length) throw new Error(`za_invalid:${za.issues}`);
  const envelopeTargets = za.stepZDirect.envelope.criticalBindings.productionCsvTargets;
  const sourceTargets = za.stepZDirect.executionPackage.targetFiles;
  const candidateContents = sourceTargets.map((entry) => ({ market: entry.market,
    bytes: Buffer.from(entry.contentBase64, "base64") }));
  const approvedRootPolicyIdentity = subject.rootPolicyIdentity("approved_data_root",
    fs.realpathSync(approvedRoot));
  const targetPaths = envelopeTargets.map((target, index) => {
    const publicPath = target.targetPath;
    const targetPath = path.join(approvedRoot, `versioned-${target.market.toLowerCase()}.csv`);
    return makeTargetContract(target, targetPath, publicPath,
      candidateContents[index].bytes, subject.pathIdentity(target.market, publicPath));
  });
  const predecessorPaths = envelopeTargets.map((target) => {
    const publicPath = `synthetic/current-${target.market.toLowerCase()}.csv`;
    const predecessorPath = path.join(approvedRoot, `current-${target.market.toLowerCase()}.csv`);
    const ticker = target.market === "US" ? "OLD" : "000001";
    const bytes = Buffer.from(`${target.normalizedHeader || "market,ticker,value"}\n${target.market},${ticker},0\n`);
    fs.writeFileSync(predecessorPath, bytes);
    return makePredecessorContract(target, predecessorPath, publicPath, bytes);
  });
  const selectorPath = path.join(approvedRoot, "selector.js");
  const selectorPreimageBytes = Buffer.from(
    za.stepZDirect.executionPackage.selectorPreimage.selectorContentBase64, "base64");
  const selectorExpectedPostimageBytes = Buffer.from(
    `export const productionMetricTargets = [${targetPaths.map((entry) =>
      JSON.stringify(entry.publicPath)).join(", ")}];\n`);
  fs.writeFileSync(selectorPath, selectorPreimageBytes);
  const selectorPublicPath = za.stepZDirect.executionPackage.selectorPreimage.selectorPath;
  const selectorPathIdentityHash = subject.pathIdentity("selector", selectorPublicPath);
  const { repositoryMaterial, gitExecutable, gitExecFileSync } =
    sourceRepositoryMaterial(repositoryRoot);
  const adapterSources = repositoryMaterial.observedSourceIdentities
    .filter((entry) => ["production_capability_adapters",
      "current_main_provenance_bridge"].includes(entry.role))
    .map((entry) => ({ moduleRole: entry.role, sourcePath: entry.sourcePath,
      sourcePathIdentityHash: entry.sourcePathIdentityHash,
      sourceGitBlobSha: entry.sourceGitBlobSha,
      sourceContentSha256: entry.sourceContentSha256 }));
  const platformAttestation = subject.buildPlatformAttestation({
    probeRootPolicyIdentity: subject.hashContract(
      "FINPLE_STEP114_2X_ZB_R_TEST_PROBE_ROOT\0", "isolated"),
    atomicSameDirectoryRename: true, exclusiveCreate: true, fileFsync: true,
    directoryFsync: false });
  const adapterManifest = adapters.buildProductionAdapterManifest({
    adapterSourceIdentities: adapterSources, approvedRootPolicyIdentity,
    platformCapabilities: { atomicSameDirectoryRename: true, exclusiveCreate: true,
      fileFsync: true, directoryFsync: false, crossDeviceFallbackAllowed: false },
    claimStateSchemaIdentity: subject.sha256("claim-schema"),
    receiptStateSchemaIdentity: subject.sha256("receipt-schema"),
    rollbackStateSchemaIdentity: subject.sha256("rollback-schema") });
  const predecessorIdentities = predecessorPaths.map((entry) => {
    const identity = adapters.deriveCsvIdentity(fs.readFileSync(entry.path), entry);
    return { market: entry.market, sourcePathIdentityHash: entry.sourcePathIdentityHash,
      contentSha256: identity.contentSha256, schemaVersion: identity.schemaVersion,
      schemaIdentitySha256: identity.schemaIdentitySha256,
      datasetIdentityHash: identity.datasetIdentityHash, rowCount: identity.rowCount,
      byteCount: identity.byteCount };
  });
  const targetPathIdentities = targetPaths.map((entry) => ({ market: entry.market,
    approvedRootPolicyHash: approvedRootPolicyIdentity,
    approvedPathIdentityHash: entry.approvedPathIdentityHash,
    versionedTarget: true, writeMode: "create_only" }));
  const selectorPathIdentity = { approvedRootPolicyHash: approvedRootPolicyIdentity,
    approvedPathIdentityHash: selectorPathIdentityHash };
  const selectorExpectedPostimageIdentity =
    provenance.buildSelectorExpectedPostimageIdentity({ selectorPathIdentityHash,
      selectorPostimageBytes: selectorExpectedPostimageBytes,
      versionedTargetPublicPaths: targetPaths.map((entry) => entry.publicPath),
      targetPathIdentities });
  const currentPreimageManifest = provenance.buildCurrentPreimageManifest({
    repositoryHeadSha: EXECUTION_SHA, repositoryTreeSha: TREE_SHA,
    targetPreimageIdentities: targetPathIdentities.map((entry) => ({
      market: entry.market, pathIdentityHash: entry.approvedPathIdentityHash,
      exists: false, contentIdentityHash: null, byteCount: 0, rowCount: 0 })),
    selectorPreimageIdentity: { pathIdentityHash: selectorPathIdentityHash,
      contentIdentityHash: subject.sha256(selectorPreimageBytes),
      byteCount: selectorPreimageBytes.length } });
  const provenancePacket = { executionMainSha: EXECUTION_SHA,
    repositorySnapshot: repositoryMaterial.repositorySnapshot,
    reviewedSourceIdentities: repositoryMaterial.observedSourceIdentities,
    observedSourceIdentities: repositoryMaterial.observedSourceIdentities,
    historicalContracts: provenance.buildHistoricalContracts(), targetPathIdentities,
    selectorPathIdentity, adapterManifest, currentPreimageManifest,
    predecessorSourceIdentities: predecessorIdentities,
    selectorExpectedPostimageIdentity, operatorMaterialIdentities: null,
    provenanceNonceContext: { priorNonceHashes: [],
      provenanceNonceHash: subject.sha256("provenance-nonce"),
      upstreamNonceHashes: [subject.sha256("provenance-upstream")] },
    issuedAt: "2026-07-18T00:03:25.000Z",
    effectiveExpiresAt: "2026-07-18T00:03:30.000Z",
    evaluationClockInstant: "2026-07-18T00:03:29.000Z",
    authoritySignals: { merge: false, ci: false, vercel: false,
      healthCheck: false, repositoryOwnership: false } };
  const provenanceResult = provenance.evaluateCurrentMainProvenanceBridge(provenancePacket);
  if (!provenanceResult.ok) throw new Error(`provenance_invalid:${provenanceResult.blockingIssues}`);
  const readOnlyBuilderInput = { filesystem: fs, pathApi: path, repositoryRoot,
    gitExecutable, gitExecFileSync, executionMainSha: EXECUTION_SHA, approvedRoot,
    stateRootParent, futureStateRootPath: path.join(stateRootParent, "future-state"),
    predecessorPaths, targetPaths,
    selectorPath: { path: selectorPath, publicPath: selectorPublicPath,
      pathIdentityHash: selectorPathIdentityHash }, candidateContents,
    selectorExpectedPostimageBytes,
    noOpFaultInjectorContract: subject.buildNoOpFaultInjectorContract(),
    platformAttestation, restorationMaterialIdentity: subject.sha256("restoration-material"),
    adapterManifest, provenancePacket, provenanceResult, stepZAPacket, stepZAResult };
  const material = subject.buildReadOnlyProductionConfigurationMaterial(readOnlyBuilderInput);
  const configurationManifest = subject.buildProductionConfigurationManifest(material);
  const allowlist = subject.buildProductionOperatorAllowlist(productionPem(),
    configurationManifest.environmentIdentityHash, { entry: {
      validFrom: "2026-07-18T00:03:28.000Z",
      validUntil: "2026-07-18T00:03:30.000Z" } });
  const authorizationNonceHash = subject.sha256("production-runtime-nonce");
  const body = subject.buildAuthorizationBody(configurationManifest,
    signerFromAllowlist(allowlist), { prior: [], upstream: [] }, EVALUATION_CLOCK, {
      authorizationNonceHash, upstreamExpiry: stepZAPacket.stepZPacket.stepYResult
        .singleUseProductionCutoverEnvelope.effectiveCutoverExpiresAt,
      expiresAt: "2026-07-18T00:03:30.000Z" });
  // Replace the provisional upstream digest with the exact validator-derived context.
  const upstream = (() => {
    const values = [];
    const visit = (value, key = "") => {
      if (Array.isArray(value) && /nonce/i.test(key)) {
        for (const item of value) if (/^[0-9a-f]{64}$/.test(item)) values.push(item);
      } else if (value && typeof value === "object") {
        for (const [childKey, child] of Object.entries(value)) visit(child, childKey);
      } else if (typeof value === "string" && /^[0-9a-f]{64}$/.test(value) &&
          /nonce/i.test(key)) values.push(value);
    };
    visit(stepZAPacket);
    visit(historicalBuilt.packet);
    return [...new Set(values)].sort();
  })();
  body.upstreamNonceContextDigest = subject.hashContract(
    "FINPLE_STEP114_2X_ZB_R_UPSTREAM_NONCE_CONTEXT\0", upstream);
  const authorization = signAuthorizationBody(body);
  const packet = { readOnlyBuilderInput, productionOperatorAllowlist: allowlist,
    signedProductionAuthorization: authorization, priorAuthorizationNonceHashes: [],
    evaluationClockInstant: EVALUATION_CLOCK,
    historicalZBPacket: historicalBuilt.packet, historicalZBResult: historicalResult };
  const fixture = { root, repositoryRoot, approvedRoot, stateRootParent,
    selectorPath, targetPaths, predecessorPaths, readOnlyBuilderInput, material,
    configurationManifest, allowlist, authorization, packet,
    historicalBuilt, historicalResult, productionKeys: PRODUCTION_KEYS };
  if (testContext) testContext.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return fixture;
}
function laterInput(result, fixture, overrides = {}) {
  return { ...fixture.packet, productionInvocationBundle: result.productionInvocationBundle,
    currentEvaluationClockInstant: "2026-07-18T00:03:29.500Z",
    currentPriorAuthorizationNonceHashes: [], ...overrides };
}

module.exports = { EVALUATION_CLOCK, EXECUTION_SHA, PRODUCTION_KEYS, buildFixture,
  clone, laterInput, productionPem, resealAllowlist, resealAuthorization,
  signAuthorizationBody, signerFromAllowlist };
