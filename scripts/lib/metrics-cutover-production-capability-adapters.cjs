"use strict";

const { createHash } = require("node:crypto");
const stepZ = require("./metrics-cutover-production-single-use-executor.cjs");

const VERSION = "finple.step114-2x-zb-p.production-capability-adapters.v1";
const MANIFEST_VERSION = "finple.step114-2x-zb-p.production-adapter-manifest.v1";
const CAPABILITY_NAMES = Object.freeze([...stepZ.CAPABILITY_NAMES]);
const MUTATING_CAPABILITIES = new Set([
  "singleUseCutoverEnvelopeStore", "atomicProductionCsvReplacer",
  "selectorMutationCoordinator", "cutoverReceiptStore", "rollbackCoordinator",
]);
const CONSTRUCTION_FIELDS = Object.freeze([
  "filesystem", "pathApi", "approvedRoot", "stateRoot", "targetPaths",
  "selectorPath", "clock", "operationBindings", "platformCapabilities",
  "repositoryIdentity", "restorationMaterial",
]);
const PLATFORM_FIELDS = Object.freeze([
  "atomicSameDirectoryRename", "exclusiveCreate", "fileFsync",
  "directoryFsync", "crossDeviceFallbackAllowed",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "productionConfigured", "automaticRetryAllowed", "fallbackAllowed",
  "secondAttemptAllowed", "rawOutputAllowed", "providerAccessAllowed",
  "databaseAccessAllowed", "networkAccessAllowed", "loaderActivationAllowed",
  "deploymentAllowed",
]);
const REQUIRED_FS_METHODS = Object.freeze([
  "closeSync", "existsSync", "fsyncSync", "lstatSync", "mkdirSync",
  "openSync", "readFileSync", "realpathSync", "renameSync", "unlinkSync",
  "writeFileSync",
]);
const RECEIPT_FORBIDDEN_KEYS = Object.freeze([
  "candidateContentBase64", "selectorContentBase64", "selectorPreimageBase64",
  "selectorPostimageBase64", "signatureBase64", "credential", "endpoint",
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
function parseInstant(value) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value ? parsed : null;
}
function csvRows(bytes) {
  const text = bytes.toString("utf8");
  if (!text || !text.includes("\n")) return 0;
  return text.replace(/\r?\n$/, "").split(/\r?\n/).length - 1;
}
function csvHeader(bytes) {
  return bytes.toString("utf8").split(/\r?\n/, 1)[0];
}
function canonicalBase64(value) {
  if (typeof value !== "string") throw new TypeError("base64_required");
  const bytes = Buffer.from(value, "base64");
  if (bytes.toString("base64") !== value) throw new TypeError("base64_noncanonical");
  return bytes;
}
function sanitizedClone(value) {
  const visit = (item) => {
    if (Array.isArray(item)) return item.map(visit);
    if (!isRecord(item)) return item;
    const output = {};
    for (const [key, child] of Object.entries(item)) {
      if (RECEIPT_FORBIDDEN_KEYS.some((blocked) => key.toLowerCase().includes(blocked.toLowerCase()))) {
        throw new TypeError("raw_receipt_material_forbidden");
      }
      if (typeof child === "string" && /^(?:[a-zA-Z]:[\\/]|[\\/]{2}|\/)/.test(child)) {
        throw new TypeError("absolute_path_in_receipt_forbidden");
      }
      output[key] = visit(child);
    }
    return output;
  };
  return visit(value);
}

function validateConstruction(input) {
  if (!exactKeys(input, CONSTRUCTION_FIELDS)) throw new TypeError("adapter_construction_fields_invalid");
  if (!isRecord(input.filesystem) || REQUIRED_FS_METHODS.some(
    (method) => typeof input.filesystem[method] !== "function")) {
    throw new TypeError("filesystem_capability_invalid");
  }
  if (!isRecord(input.pathApi) || ["basename", "dirname", "isAbsolute", "join",
    "relative", "resolve", "sep"].some((field) => field === "sep"
      ? typeof input.pathApi[field] !== "string"
      : typeof input.pathApi[field] !== "function")) {
    throw new TypeError("path_api_invalid");
  }
  if (!exactKeys(input.platformCapabilities, PLATFORM_FIELDS) ||
      input.platformCapabilities.atomicSameDirectoryRename !== true ||
      input.platformCapabilities.exclusiveCreate !== true ||
      input.platformCapabilities.fileFsync !== true ||
      typeof input.platformCapabilities.directoryFsync !== "boolean" ||
      input.platformCapabilities.crossDeviceFallbackAllowed !== false) {
    throw new TypeError("platform_capabilities_invalid");
  }
  if (!isRecord(input.clock) || typeof input.clock.now !== "function") {
    throw new TypeError("explicit_clock_invalid");
  }
  if (!exactKeys(input.repositoryIdentity, ["headSha", "treeSha"]) ||
      !isGitSha(input.repositoryIdentity.headSha) || !isGitSha(input.repositoryIdentity.treeSha)) {
    throw new TypeError("repository_identity_invalid");
  }
  if (!Array.isArray(input.operationBindings) || input.operationBindings.length === 0 ||
      input.operationBindings.some((binding) => !exactKeys(binding,
        ["capabilityName", "methodName", "operationId", "idempotencyKey"]) ||
        !CAPABILITY_NAMES.includes(binding.capabilityName) ||
        !stepZ.CAPABILITY_METHODS[binding.capabilityName].includes(binding.methodName) ||
        typeof binding.operationId !== "string" || !isSha(binding.idempotencyKey))) {
    throw new TypeError("operation_bindings_invalid");
  }
  const operationIds = input.operationBindings.map((entry) => entry.operationId);
  const idempotencyKeys = input.operationBindings.map((entry) => entry.idempotencyKey);
  if (new Set(operationIds).size !== operationIds.length ||
      new Set(idempotencyKeys).size !== idempotencyKeys.length) {
    throw new TypeError("operation_binding_alias_invalid");
  }
  if (!Array.isArray(input.targetPaths) || input.targetPaths.length !== 2 ||
      !canonicalEqual(input.targetPaths.map((entry) => entry.market), ["US", "KR"]) ||
      input.targetPaths.some((entry) => !exactKeys(entry, ["market", "path", "publicPath"]) ||
        typeof entry.publicPath !== "string" || entry.publicPath.length === 0)) {
    throw new TypeError("target_paths_invalid");
  }
  if (!exactKeys(input.selectorPath, ["path", "publicPath"]) ||
      typeof input.selectorPath.publicPath !== "string" ||
      input.selectorPath.publicPath.length === 0) throw new TypeError("selector_path_invalid");
  if (!exactKeys(input.restorationMaterial, ["targets", "selector"]) ||
      !Array.isArray(input.restorationMaterial.targets) ||
      input.restorationMaterial.targets.length !== 2 ||
      !exactKeys(input.restorationMaterial.selector, ["path", "contentBase64"])) {
    throw new TypeError("restoration_material_invalid");
  }
}

function buildPathGuard(input) {
  const { filesystem: fs, pathApi: path } = input;
  const approvedRoot = path.resolve(input.approvedRoot);
  const stateRoot = path.resolve(input.stateRoot);
  if (approvedRoot !== input.approvedRoot || stateRoot !== input.stateRoot ||
      !path.isAbsolute(approvedRoot) || !path.isAbsolute(stateRoot)) {
    throw new TypeError("absolute_canonical_roots_required");
  }
  const rootReal = fs.realpathSync(approvedRoot);
  const stateReal = fs.realpathSync(stateRoot);
  function inside(root, candidate) {
    const relative = path.relative(root, candidate);
    return relative === "" || (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." && !path.isAbsolute(relative));
  }
  function rejectLinks(root, candidate, allowMissingLeaf) {
    const relative = path.relative(root, candidate);
    let cursor = root;
    for (const part of relative.split(path.sep).filter(Boolean)) {
      cursor = path.join(cursor, part);
      if (!fs.existsSync(cursor)) {
        if (allowMissingLeaf && cursor === candidate) break;
        throw new TypeError("approved_path_parent_missing");
      }
      if (fs.lstatSync(cursor).isSymbolicLink()) throw new TypeError("symlink_or_junction_forbidden");
    }
  }
  function assertPath(raw, root = approvedRoot, rootCanonical = rootReal,
    allowMissingLeaf = false) {
    if (typeof raw !== "string" || !path.isAbsolute(raw) || path.resolve(raw) !== raw ||
        !inside(root, raw)) throw new TypeError("approved_root_escape_or_alias");
    rejectLinks(root, raw, allowMissingLeaf);
    const existing = fs.existsSync(raw) ? raw : path.dirname(raw);
    const existingReal = fs.realpathSync(existing);
    if (!inside(rootCanonical, existingReal)) throw new TypeError("realpath_escape_forbidden");
    return raw;
  }
  for (const target of input.targetPaths) assertPath(target.path, approvedRoot, rootReal, true);
  assertPath(input.selectorPath.path, approvedRoot, rootReal, false);
  assertPath(stateRoot, stateRoot, stateReal, false);
  const all = [...input.targetPaths.map((entry) => entry.path), input.selectorPath.path];
  const publicPaths = [...input.targetPaths.map((entry) => entry.publicPath),
    input.selectorPath.publicPath];
  if (new Set(all).size !== all.length) throw new TypeError("path_aliasing_forbidden");
  if (new Set(publicPaths).size !== publicPaths.length || publicPaths.some((value) =>
    path.isAbsolute(value) || value.includes("..") || value.includes("\\"))) {
    throw new TypeError("public_path_aliasing_or_escape_forbidden");
  }
  return { approvedRoot, rootReal, stateRoot, stateReal, assertApproved: (raw, missing = false) =>
    assertPath(raw, approvedRoot, rootReal, missing), assertState: (raw, missing = false) =>
    assertPath(raw, stateRoot, stateReal, missing) };
}

function createProductionCapabilityAdapters(input) {
  validateConstruction(input);
  const guard = buildPathGuard(input);
  const fs = input.filesystem;
  const path = input.pathApi;
  const bindingByOperation = new Map(input.operationBindings.map((entry) =>
    [entry.operationId, entry]));
  const pathsByMarket = new Map(input.targetPaths.map((entry) => [entry.market, entry]));
  const operationsRoot = path.join(guard.stateRoot, "operations");
  const claimsRoot = path.join(guard.stateRoot, "claims");
  const receiptsRoot = path.join(guard.stateRoot, "receipts");
  for (const directory of [operationsRoot, claimsRoot, receiptsRoot]) {
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: false });
    guard.assertState(directory);
  }

  function assertContext(capabilityName, methodName, context) {
    if (!exactKeys(context, ["operationId", "idempotencyKey", "deadline", "abortSignal"])) {
      throw new TypeError("operation_context_invalid");
    }
    const binding = bindingByOperation.get(context.operationId);
    if (!binding || binding.capabilityName !== capabilityName ||
        binding.methodName !== methodName || binding.idempotencyKey !== context.idempotencyKey) {
      throw new TypeError("operation_identity_or_idempotency_invalid");
    }
    const deadline = parseInstant(context.deadline);
    const now = parseInstant(input.clock.now());
    if (deadline === null || now === null || deadline - now > 100 || deadline < now) {
      throw new TypeError("fixed_deadline_invalid");
    }
    if (!context.abortSignal || typeof context.abortSignal.aborted !== "boolean") {
      throw new TypeError("abort_signal_required");
    }
    if (context.abortSignal.aborted) throw new Error("operation_cancelled");
    return binding;
  }
  function syncDirectory(directory) {
    if (!input.platformCapabilities.directoryFsync) return;
    const handle = fs.openSync(directory, "r");
    try { fs.fsyncSync(handle); } finally { fs.closeSync(handle); }
  }
  function exclusiveWrite(destination, bytes) {
    guard.assertState(destination, true);
    const handle = fs.openSync(destination, "wx", 0o600);
    try { fs.writeFileSync(handle, bytes); fs.fsyncSync(handle); }
    finally { fs.closeSync(handle); }
    syncDirectory(path.dirname(destination));
  }
  function atomicReplace(destination, bytes, statePath = false, operationId = "restore") {
    const assert = statePath ? guard.assertState : guard.assertApproved;
    assert(destination, true);
    const temporary = path.join(path.dirname(destination),
      `.${path.basename(destination)}.${sha256(operationId).slice(0, 24)}.tmp`);
    assert(temporary, true);
    let handle;
    try {
      handle = fs.openSync(temporary, "wx", 0o600);
      fs.writeFileSync(handle, bytes); fs.fsyncSync(handle); fs.closeSync(handle); handle = null;
      if (!canonicalEqual({ sha: sha256(fs.readFileSync(temporary)), bytes: fs.readFileSync(temporary).length },
        { sha: sha256(bytes), bytes: bytes.length })) throw new Error("staged_identity_mismatch");
      fs.renameSync(temporary, destination);
      syncDirectory(path.dirname(destination));
    } finally {
      if (handle !== undefined && handle !== null) fs.closeSync(handle);
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
  function operationPath(operationId) {
    return path.join(operationsRoot, `${sha256(operationId)}.json`);
  }
  function writeOperation(binding, resourceHash, outcome = "committed") {
    const body = { contractVersion: `${VERSION}.operation.v1`,
      capabilityName: binding.capabilityName, methodName: binding.methodName,
      operationId: binding.operationId, idempotencyKey: binding.idempotencyKey,
      outcome, resourceHash, automaticRetryAllowed: false, rawMaterialPresent: false };
    exclusiveWrite(operationPath(binding.operationId), Buffer.from(canonicalJson(body)));
    return body;
  }
  function reconcile(capabilityName, payload, context) {
    const reconciliationDeadline = parseInstant(context.deadline);
    const reconciliationNow = parseInstant(input.clock.now());
    if (!exactKeys(context, ["operationId", "idempotencyKey", "deadline", "abortSignal"]) ||
        reconciliationDeadline === null || reconciliationNow === null ||
        reconciliationDeadline < reconciliationNow ||
        reconciliationDeadline - reconciliationNow > 200 || !context.abortSignal ||
        typeof context.abortSignal.aborted !== "boolean" || context.abortSignal.aborted) {
      throw new TypeError("reconciliation_context_invalid");
    }
    const binding = bindingByOperation.get(context.operationId);
    if (!binding || binding.capabilityName !== capabilityName ||
        binding.idempotencyKey !== context.idempotencyKey ||
        binding.methodName === "reconcileOperationOutcome") {
      throw new TypeError("reconciliation_operation_identity_invalid");
    }
    if (!exactKeys(payload, ["operationId", "idempotencyKey"]) ||
        payload.operationId !== context.operationId ||
        payload.idempotencyKey !== context.idempotencyKey) {
      throw new TypeError("reconciliation_identity_invalid");
    }
    const journal = operationPath(binding.operationId);
    if (!fs.existsSync(journal)) return { outcome: "not_committed", resourceHash: null };
    try {
      const record = JSON.parse(fs.readFileSync(journal, "utf8"));
      if (record.operationId !== binding.operationId ||
          record.idempotencyKey !== binding.idempotencyKey ||
          record.capabilityName !== capabilityName || !isSha(record.resourceHash)) {
        return { outcome: "ambiguous", resourceHash: null };
      }
      return { outcome: "committed", resourceHash: record.resourceHash };
    } catch { return { outcome: "ambiguous", resourceHash: null }; }
  }
  function claimPath(envelopeId) { return path.join(claimsRoot, `${sha256(envelopeId)}.json`); }
  function receiptPath(receiptId) { return path.join(receiptsRoot, `${sha256(receiptId)}.json`); }
  function targetIdentity(market, targetPath, expected = {}) {
    guard.assertApproved(targetPath, false);
    const bytes = fs.readFileSync(targetPath);
    const body = { market, targetPath: expected.targetPath || targetPath,
      contentSha256: sha256(bytes), schemaVersion: expected.schemaVersion,
      schemaIdentitySha256: expected.schemaIdentitySha256,
      datasetIdentityHash: expected.datasetIdentityHash,
      rowCount: csvRows(bytes), byteCount: bytes.length };
    return body;
  }
  function readExpectedPreimages(expected) {
    if (!isRecord(expected) || !Array.isArray(expected.targets) || expected.targets.length !== 2) {
      throw new TypeError("expected_preimages_invalid");
    }
    if (expected.repositoryHeadSha !== input.repositoryIdentity.headSha ||
        expected.repositoryTreeSha !== input.repositoryIdentity.treeSha ||
        expected.selectorPath !== input.selectorPath.publicPath) throw new Error("repository_preimage_drift");
    const selector = fs.readFileSync(input.selectorPath.path);
    if (sha256(selector) !== expected.selectorPreimageSha256) throw new Error("selector_preimage_drift");
    for (const target of expected.targets) {
      const bound = pathsByMarket.get(target.market);
      if (!bound || bound.publicPath !== target.targetPath) throw new Error("target_path_drift");
      const exists = fs.existsSync(bound.path);
      if (exists !== target.exists) throw new Error("target_existence_drift");
      if (exists && sha256(fs.readFileSync(bound.path)) !== target.preimageSha256) {
        throw new Error("target_preimage_drift");
      }
    }
    return JSON.parse(canonicalJson(expected));
  }

  const singleUseCutoverEnvelopeStore = {
    descriptor: stepZ.buildCapabilityDescriptor("singleUseCutoverEnvelopeStore"),
    async acquireEnvelopeClaim(payload, context) {
      const binding = assertContext("singleUseCutoverEnvelopeStore", "acquireEnvelopeClaim", context);
      if (!isRecord(payload) || payload.singleUse !== true ||
          payload.automaticRetryAllowed !== false || payload.secondCutoverAttemptAllowed !== false ||
          payload.rawMaterialPresent !== false) throw new TypeError("claim_payload_invalid");
      const destination = claimPath(payload.envelopeId);
      if (fs.existsSync(destination)) return { outcome: "already_consumed", claimHash: null };
      const claimHash = hashContract("FINPLE_STEP114_2X_ZB_P_CLAIM\0", {
        envelopeId: payload.envelopeId, envelopeHash: payload.envelopeHash,
        approvalNonceHash: payload.approvalNonceHash,
      });
      const record = { contractVersion: `${VERSION}.claim.v1`, envelopeId: payload.envelopeId,
        envelopeHash: payload.envelopeHash, approvalNonceHash: payload.approvalNonceHash,
        claimHash, terminalState: null, terminalizationHash: null,
        automaticRetryAllowed: false, secondAttemptAllowed: false, rawMaterialPresent: false };
      exclusiveWrite(destination, Buffer.from(canonicalJson(record)));
      writeOperation(binding, claimHash);
      return { outcome: "acquired", claimHash };
    },
    async reconcileOperationOutcome(payload, context) {
      return reconcile("singleUseCutoverEnvelopeStore", payload, context);
    },
    async terminalizeEnvelopeClaim(payload, context) {
      const binding = assertContext("singleUseCutoverEnvelopeStore", "terminalizeEnvelopeClaim", context);
      const destination = claimPath(payload.envelopeId);
      if (!fs.existsSync(destination)) throw new Error("claim_missing");
      const record = JSON.parse(fs.readFileSync(destination, "utf8"));
      if (record.claimHash !== payload.claimHash || record.envelopeHash !== payload.envelopeHash ||
          record.terminalState !== null || payload.automaticRetryAllowed !== false ||
          payload.secondCutoverAttemptAllowed !== false || payload.rawMaterialPresent !== false) {
        throw new Error("claim_terminalization_invalid");
      }
      const terminalizationHash = hashContract("FINPLE_STEP114_2X_ZB_P_TERMINALIZATION\0", {
        claimHash: record.claimHash, terminalState: payload.terminalState,
        cutoverReceiptId: payload.cutoverReceiptId, cutoverReceiptHash: payload.cutoverReceiptHash,
      });
      const updated = { ...record, terminalState: payload.terminalState, terminalizationHash };
      atomicReplace(destination, Buffer.from(canonicalJson(updated)), true, binding.operationId);
      writeOperation(binding, terminalizationHash);
      return { outcome: "terminalized", terminalState: payload.terminalState, terminalizationHash };
    },
  };

  const cutoverClock = {
    descriptor: stepZ.buildCapabilityDescriptor("cutoverClock"),
    async readCutoverClock(payload, context) {
      assertContext("cutoverClock", "readCutoverClock", context);
      const instant = input.clock.now();
      if (parseInstant(instant) === null ||
          !exactKeys(payload, ["expectedInstant", "effectiveExpiry"]) ||
          payload.expectedInstant !== instant || parseInstant(payload.effectiveExpiry) === null ||
          parseInstant(instant) >= parseInstant(payload.effectiveExpiry)) {
        throw new Error("cutover_clock_drift");
      }
      return { instant };
    },
  };

  const cutoverPreimageReader = {
    descriptor: stepZ.buildCapabilityDescriptor("cutoverPreimageReader"),
    async readBoundPreimages(payload, context) {
      assertContext("cutoverPreimageReader", "readBoundPreimages", context);
      return readExpectedPreimages(payload.expectedPreimages);
    },
    async readProductionCsvIdentity(payload, context) {
      assertContext("cutoverPreimageReader", "readProductionCsvIdentity", context);
      const bound = pathsByMarket.get(payload.market);
      if (!bound || bound.publicPath !== payload.targetPath) throw new Error("csv_target_path_drift");
      const identity = targetIdentity(payload.market, bound.path, payload.expectedIdentity);
      if (!canonicalEqual(identity, payload.expectedIdentity)) throw new Error("csv_identity_drift");
      return identity;
    },
    async readPostCutoverState(payload, context) {
      assertContext("cutoverPreimageReader", "readPostCutoverState", context);
      const expected = payload.expectedPostState;
      if (expected.repositoryHeadSha !== input.repositoryIdentity.headSha ||
          expected.repositoryTreeSha !== input.repositoryIdentity.treeSha ||
          expected.selectorPath !== input.selectorPath.publicPath ||
          sha256(fs.readFileSync(input.selectorPath.path)) !== expected.selectorPostimageSha256 ||
          !Array.isArray(expected.productionCsvResults) ||
          expected.productionCsvResults.some((identity) => !canonicalEqual(
            targetIdentity(identity.market, pathsByMarket.get(identity.market).path, identity), identity))) {
        throw new Error("post_cutover_state_drift");
      }
      return JSON.parse(canonicalJson(expected));
    },
  };

  const atomicProductionCsvReplacer = {
    descriptor: stepZ.buildCapabilityDescriptor("atomicProductionCsvReplacer"),
    async replaceProductionCsvAtomically(payload, context) {
      const binding = assertContext("atomicProductionCsvReplacer",
        "replaceProductionCsvAtomically", context);
      const target = pathsByMarket.get(payload.market);
      if (!target || target.publicPath !== payload.targetPath ||
          !canonicalEqual([payload.market, payload.sequence], payload.sequence === 1
            ? ["US", 1] : ["KR", 2]) || payload.requireCreateOnlyPreimage !== true ||
          payload.stagingRenameAtomicityRequired !== true ||
          payload.rawMaterialOutputAllowed !== false || payload.replaceCountLimit !== 2) {
        throw new TypeError("atomic_replacement_binding_invalid");
      }
      if (payload.sequence === 2 && !fs.existsSync(pathsByMarket.get("US").path)) {
        throw new Error("us_before_kr_order_required");
      }
      guard.assertApproved(target.path, true);
      if (fs.existsSync(target.path)) throw new Error("create_only_target_exists");
      const bytes = canonicalBase64(payload.candidateContentBase64);
      if (sha256(bytes) !== payload.expectedContentSha256 ||
          bytes.length !== payload.expectedByteCount || csvRows(bytes) !== payload.expectedRowCount) {
        throw new Error("candidate_identity_invalid");
      }
      atomicReplace(target.path, bytes, false, binding.operationId);
      const replacementHash = hashContract("FINPLE_STEP114_2X_ZB_P_REPLACEMENT\0", {
        market: payload.market, contentSha256: payload.expectedContentSha256,
        byteCount: payload.expectedByteCount, rowCount: payload.expectedRowCount,
        operationId: binding.operationId,
      });
      writeOperation(binding, replacementHash);
      return { outcome: "replaced", replacementHash };
    },
    async reconcileOperationOutcome(payload, context) {
      return reconcile("atomicProductionCsvReplacer", payload, context);
    },
  };

  const selectorMutationCoordinator = {
    descriptor: stepZ.buildCapabilityDescriptor("selectorMutationCoordinator"),
    async mutateSelectorExactlyOnce(payload, context) {
      const binding = assertContext("selectorMutationCoordinator", "mutateSelectorExactlyOnce", context);
      if (payload.selectorPath !== input.selectorPath.publicPath || payload.exactReplacementCount !== 2 ||
          payload.selectorMutationCountLimit !== 1 ||
          payload.atomicStagingRenameRequired !== true ||
          payload.rawMaterialOutputAllowed !== false) throw new TypeError("selector_binding_invalid");
      const preimage = canonicalBase64(payload.selectorPreimageBase64);
      const postimage = canonicalBase64(payload.selectorPostimageBase64);
      const current = fs.readFileSync(input.selectorPath.path);
      if (sha256(preimage) !== payload.selectorPreimageSha256 ||
          sha256(postimage) !== payload.selectorExpectedPostimageSha256 ||
          sha256(current) !== payload.selectorPreimageSha256) throw new Error("selector_preimage_drift");
      atomicReplace(input.selectorPath.path, postimage, false, binding.operationId);
      const mutationHash = hashContract("FINPLE_STEP114_2X_ZB_P_SELECTOR_MUTATION\0", {
        selectorPreimageSha256: payload.selectorPreimageSha256,
        selectorExpectedPostimageSha256: payload.selectorExpectedPostimageSha256,
        operationId: binding.operationId,
      });
      writeOperation(binding, mutationHash);
      return { outcome: "mutated", mutationHash };
    },
    async reconcileOperationOutcome(payload, context) {
      return reconcile("selectorMutationCoordinator", payload, context);
    },
  };

  const cutoverReceiptStore = {
    descriptor: stepZ.buildCapabilityDescriptor("cutoverReceiptStore"),
    async persistCutoverReceipt(payload, context) {
      const binding = assertContext("cutoverReceiptStore", "persistCutoverReceipt", context);
      const receipt = sanitizedClone(payload);
      if (!isSha(receipt.cutoverReceiptHash) || typeof receipt.cutoverReceiptId !== "string" ||
          receipt.rawMaterialPresent !== false) throw new TypeError("sanitized_receipt_invalid");
      const destination = receiptPath(receipt.cutoverReceiptId);
      if (fs.existsSync(destination)) throw new Error("receipt_replay_forbidden");
      const receiptStoreHash = hashContract("FINPLE_STEP114_2X_ZB_P_RECEIPT_STORE\0", receipt);
      exclusiveWrite(destination, Buffer.from(canonicalJson({ receipt, receiptStoreHash })));
      writeOperation(binding, receiptStoreHash);
      return { outcome: "persisted", receiptStoreHash };
    },
    async reconcileOperationOutcome(payload, context) {
      return reconcile("cutoverReceiptStore", payload, context);
    },
  };

  const rollbackCoordinator = {
    descriptor: stepZ.buildCapabilityDescriptor("rollbackCoordinator"),
    async restoreBoundPreimages(payload, context) {
      const binding = assertContext("rollbackCoordinator", "restoreBoundPreimages", context);
      if (payload.rawMaterialPresent !== false) throw new TypeError("rollback_raw_material_flag_invalid");
      const restorationTargets = new Map(input.restorationMaterial.targets.map(
        (entry) => [entry.market, entry]));
      for (const [market, enabled] of [["US", payload.restoreUsTarget], ["KR", payload.restoreKrTarget]]) {
        if (!enabled) continue;
        const material = restorationTargets.get(market);
        const target = pathsByMarket.get(market);
        if (!material || !target || material.path !== target.path ||
            !exactKeys(material, ["market", "path", "existed", "contentBase64"])) {
          throw new TypeError("rollback_target_material_invalid");
        }
        if (!material.existed) {
          if (fs.existsSync(target.path)) fs.unlinkSync(target.path);
        } else {
          atomicReplace(target.path, canonicalBase64(material.contentBase64), false,
            `${binding.operationId}-${market}`);
        }
      }
      if (payload.restoreSelector) {
        if (input.restorationMaterial.selector.path !== input.selectorPath.path) {
          throw new TypeError("rollback_selector_material_invalid");
        }
        atomicReplace(input.selectorPath.path,
          canonicalBase64(input.restorationMaterial.selector.contentBase64), false,
          `${binding.operationId}-selector`);
      }
      readExpectedPreimages(payload.exactPreimages);
      if (payload.receiptMayExist === true) {
        return { outcome: "ambiguous", restorationHash: null, manualReviewRequired: true };
      }
      const restorationHash = hashContract("FINPLE_STEP114_2X_ZB_P_RESTORATION\0", {
        envelopeId: payload.envelopeId, envelopeHash: payload.envelopeHash,
        failureStage: payload.failureStage, exactPreimages: payload.exactPreimages,
      });
      writeOperation(binding, restorationHash);
      return { outcome: "restored", restorationHash };
    },
    async reconcileOperationOutcome(payload, context) {
      return reconcile("rollbackCoordinator", payload, context);
    },
  };

  return deepFreeze({ singleUseCutoverEnvelopeStore, cutoverClock,
    cutoverPreimageReader, atomicProductionCsvReplacer, selectorMutationCoordinator,
    cutoverReceiptStore, rollbackCoordinator });
}

function buildProductionAdapterManifest(input) {
  const fields = ["adapterSourceIdentities", "approvedRootPolicyIdentity",
    "platformCapabilities", "claimStateSchemaIdentity", "receiptStateSchemaIdentity",
    "rollbackStateSchemaIdentity"];
  if (!exactKeys(input, fields) || !Array.isArray(input.adapterSourceIdentities) ||
      input.adapterSourceIdentities.length !== 2 ||
      !canonicalEqual(input.adapterSourceIdentities.map((entry) => entry.moduleRole),
        ["production_capability_adapters", "current_main_provenance_bridge"]) ||
      input.adapterSourceIdentities.some((entry) => !exactKeys(entry,
        ["moduleRole", "sourcePathIdentityHash", "sourceBlobIdentityHash",
          "sourceContentSha256"]) || !isSha(entry.sourcePathIdentityHash) ||
          !isSha(entry.sourceBlobIdentityHash) || !isSha(entry.sourceContentSha256)) ||
      !exactKeys(input.platformCapabilities, PLATFORM_FIELDS) ||
      input.platformCapabilities.atomicSameDirectoryRename !== true ||
      input.platformCapabilities.exclusiveCreate !== true ||
      input.platformCapabilities.fileFsync !== true ||
      typeof input.platformCapabilities.directoryFsync !== "boolean" ||
      input.platformCapabilities.crossDeviceFallbackAllowed !== false ||
      !isSha(input.approvedRootPolicyIdentity) ||
      !isSha(input.claimStateSchemaIdentity) || !isSha(input.receiptStateSchemaIdentity) ||
      !isSha(input.rollbackStateSchemaIdentity)) {
    throw new TypeError("adapter_manifest_input_invalid");
  }
  const capabilities = CAPABILITY_NAMES.map((capabilityName) => {
    const descriptor = stepZ.buildCapabilityDescriptor(capabilityName);
    return { capabilityName, descriptorHash: descriptor.descriptorHash,
      methodNames: [...descriptor.methodNames], hardTimeoutMilliseconds: 100,
      timeoutPolicy: descriptor.timeoutPolicy,
      cancellationPolicy: descriptor.cancellationPolicy,
      reconciliationPolicy: descriptor.reconciliationPolicy,
      idempotencyPolicy: descriptor.idempotencyPolicy,
      namespacePolicy: descriptor.namespacePolicy,
      sanitizationPolicy: descriptor.sanitizationPolicy,
      productionCapable: true, productionConfigured: false,
      invocationCount: 0, mutationCount: 0 };
  });
  const body = { contractVersion: MANIFEST_VERSION, adapterContractVersion: VERSION,
    capabilityNames: [...CAPABILITY_NAMES], capabilities,
    adapterSourceIdentities: input.adapterSourceIdentities,
    approvedRootPolicyIdentity: input.approvedRootPolicyIdentity,
    platformCapabilities: input.platformCapabilities,
    claimStateSchemaIdentity: input.claimStateSchemaIdentity,
    receiptStateSchemaIdentity: input.receiptStateSchemaIdentity,
    rollbackStateSchemaIdentity: input.rollbackStateSchemaIdentity,
    productionCapable: true, ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    capabilityInvocationCounts: Object.fromEntries(CAPABILITY_NAMES.map((name) => [name, 0])),
    mutationCount: 0, rawMaterialPresent: false };
  const adapterManifestId = `step114-2x-zb-p-adapter-manifest-${hashContract(
    "FINPLE_STEP114_2X_ZB_P_ADAPTER_MANIFEST_ID\0", body)}`;
  return deepFreeze({ ...body, adapterManifestId,
    adapterManifestHash: hashContract("FINPLE_STEP114_2X_ZB_P_ADAPTER_MANIFEST_HASH\0",
      { ...body, adapterManifestId }) });
}

module.exports = {
  CAPABILITY_NAMES, CONSTRUCTION_FIELDS, FIXED_FALSE_FIELDS, MANIFEST_VERSION,
  MUTATING_CAPABILITIES, PLATFORM_FIELDS, REQUIRED_FS_METHODS, VERSION,
  buildProductionAdapterManifest, canonicalEqual, canonicalJson,
  createProductionCapabilityAdapters, deepFreeze, hashContract, sha256,
};
