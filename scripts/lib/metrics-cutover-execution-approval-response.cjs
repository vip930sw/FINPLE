const {
  createHash,
  createPublicKey,
  verify: verifySignature,
} = require("node:crypto");
const {
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
} = require("node:fs");
const path = require("node:path");
const { TextDecoder } = require("node:util");

const {
  FIXED_FALSE_FIELDS: STEP114_2T_FIXED_FALSE_FIELDS,
  runMetricsCutoverExecutionApprovalRequest,
  validateMetricsCutoverExecutionApprovalRequest,
} = require("./metrics-cutover-execution-approval-request.cjs");
const {
  parseIsoInstant,
  readMetricsCutoverPostMergeBundleObservation,
  stableFileIdentity,
} = require("./metrics-cutover-post-merge-dry-run-input.cjs");

const APPROVAL_RESPONSE_CONTRACT_VERSION =
  "metrics-cutover-execution-approval-response-v1-step114-2u";
const APPROVAL_VERIFICATION_POLICY_VERSION =
  "metrics-cutover-execution-approval-verification-policy-v1-step114-2u";
const APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-execution-approval-verification-summary-v1-step114-2u";
const EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION =
  "metrics-cutover-execution-approver-allowlist-v1-step114-2u";
const APPROVAL_SCOPE = "metrics_exact_cutover_execution";
const APPROVER_ROLE = "metrics_cutover_execution_approver";
const RESPONSE_ID_DOMAIN = "FINPLE_STEP114_2U_APPROVAL_RESPONSE_ID\0";
const SIGNATURE_DOMAIN = "FINPLE_STEP114_2U_APPROVAL_SIGNATURE\0";
const SIGNATURE_ALGORITHM = "Ed25519";
const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_ALLOWLIST_BYTES = 4 * 1024 * 1024;
const MAX_RESPONSE_AGE_MS = 30 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 60 * 1000;

const RESPONSE_FIELDS = Object.freeze([
  "contractVersion",
  "responseId",
  "requestId",
  "requestHash",
  "operatorBundleSha256",
  "repositoryHeadSha",
  "repositoryTreeSha",
  "executionPackageHash",
  "approvalScope",
  "decision",
  "issuedAt",
  "expiresAt",
  "signerKeyId",
  "signerId",
  "signatureAlgorithm",
  "attestations",
  "signatureBase64",
]);
const ATTESTATION_FACTS = Object.freeze({
  requestReviewed: true,
  repositoryStateReviewed: true,
  executionPackageReviewed: true,
  createOnlyWritesApproved: true,
  exactTwoSelectorReplacementsApproved: true,
  targetDeletionProhibited: true,
  automaticRollbackProhibited: true,
  executionNotYetAuthorized: true,
});
const ATTESTATION_FIELDS = Object.freeze(Object.keys(ATTESTATION_FACTS));
const ALLOWLIST_FIELDS = Object.freeze(["contractVersion", "entries"]);
const ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "signerKeyId",
  "signerId",
  "publicKeyPem",
  "allowedScopes",
  "roles",
  "revoked",
]);
const REQUEST_EQUALITY_FIELDS = Object.freeze([
  "requestId",
  "requestHash",
  "operatorBundleSha256",
  "repositoryHeadSha",
  "repositoryTreeSha",
  "branchName",
  "trackedPathsSha256",
  "targetPathAbsenceEvidenceHash",
  "candidatePackageId",
  "candidatePackageHash",
  "zipPackageSha256",
  "cutoverRehearsalEvidenceHash",
  "executionPackageHash",
  "selectorPreimageSha256",
  "selectorPostimageSha256",
  "targets",
  "plannedWriteCount",
  "plannedDeleteCount",
]);
const FIXED_FALSE_FIELDS = Object.freeze([
  "executionAuthorized",
  "fileWriteAuthorized",
  "commitAuthorized",
  "pushAuthorized",
  "mergeAuthorized",
  "deploymentAuthorized",
  "productionPublicationAuthorized",
  "appExportActivated",
  "pointerMutationExecuted",
  "rollbackExecuted",
  "loaderActivated",
]);
const decoder = new TextDecoder("utf-8", { fatal: true });

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    !/[\0\r\n]/.test(value) &&
    value !== "*"
  );
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isGitSha(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function hasExactKeys(value, expectedFields) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedFields].sort();
  return (
    actual.length === expected.length &&
    actual.every((field, index) => field === expected[index])
  );
}

function canonicalJson(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("non_finite_number");
    return JSON.stringify(value);
  }
  if (
    value === undefined ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint" ||
    value instanceof Date ||
    Buffer.isBuffer(value)
  ) {
    throw new TypeError("unsupported_canonical_value");
  }
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) {
        throw new TypeError("sparse_array_not_supported");
      }
    }
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (!isRecord(value)) {
    throw new TypeError("prototype_bearing_object_not_supported");
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => {
      if (value[key] === undefined) {
        throw new TypeError("undefined_not_supported");
      }
      return `${JSON.stringify(key)}:${canonicalJson(value[key])}`;
    })
    .join(",")}}`;
}

function decodeCanonicalBase64(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      value,
    )
  ) {
    return null;
  }
  const bytes = Buffer.from(value, "base64");
  return bytes.toString("base64") === value ? bytes : null;
}

function responseIdentityPayload(value) {
  return {
    requestId: value.requestId,
    requestHash: value.requestHash,
    signerKeyId: value.signerKeyId,
    signerId: value.signerId,
    issuedAt: value.issuedAt,
    expiresAt: value.expiresAt,
  };
}

function recomputeMetricsCutoverExecutionApprovalResponseId(value = {}) {
  return `metrics-cutover-approval-response-${sha256(
    Buffer.concat([
      Buffer.from(RESPONSE_ID_DOMAIN, "utf8"),
      Buffer.from(canonicalJson(responseIdentityPayload(value)), "utf8"),
    ]),
  )}`;
}

function validateResponseShape(value, { skipSignature = false } = {}) {
  const issues = [];
  if (!hasExactKeys(value, RESPONSE_FIELDS)) {
    return ["approval_response_fields_invalid"];
  }
  if (value.contractVersion !== APPROVAL_RESPONSE_CONTRACT_VERSION) {
    issues.push("approval_response_contract_version_mismatch");
  }
  if (
    typeof value.responseId !== "string" ||
    !/^metrics-cutover-approval-response-[a-f0-9]{64}$/.test(
      value.responseId,
    )
  ) {
    issues.push("approval_response_id_invalid");
  }
  if (
    typeof value.requestId !== "string" ||
    !/^metrics-cutover-request-[a-f0-9]{64}$/.test(value.requestId)
  ) {
    issues.push("approval_response_request_id_invalid");
  }
  for (const field of [
    "requestHash",
    "operatorBundleSha256",
    "executionPackageHash",
  ]) {
    if (!isSha256(value[field])) {
      issues.push(`approval_response_hash_invalid:${field}`);
    }
  }
  for (const field of ["repositoryHeadSha", "repositoryTreeSha"]) {
    if (!isGitSha(value[field])) {
      issues.push(`approval_response_git_sha_invalid:${field}`);
    }
  }
  if (value.approvalScope !== APPROVAL_SCOPE) {
    issues.push("approval_response_scope_mismatch");
  }
  if (value.decision !== "approved") {
    issues.push("approval_response_decision_mismatch");
  }
  if (!parseIsoInstant(value.issuedAt)) {
    issues.push("approval_response_issued_at_invalid");
  }
  if (!parseIsoInstant(value.expiresAt)) {
    issues.push("approval_response_expires_at_invalid");
  }
  if (!isNonEmptyString(value.signerKeyId)) {
    issues.push("approval_response_signer_key_id_invalid");
  }
  if (!isNonEmptyString(value.signerId)) {
    issues.push("approval_response_signer_id_invalid");
  }
  if (value.signatureAlgorithm !== SIGNATURE_ALGORITHM) {
    issues.push("approval_response_signature_algorithm_mismatch");
  }
  if (!hasExactKeys(value.attestations, ATTESTATION_FIELDS)) {
    issues.push("approval_response_attestation_fields_invalid");
  } else {
    for (const [field, expected] of Object.entries(ATTESTATION_FACTS)) {
      if (value.attestations[field] !== expected) {
        issues.push(`approval_response_attestation_mismatch:${field}`);
      }
    }
  }
  if (!skipSignature) {
    const signature = decodeCanonicalBase64(value.signatureBase64);
    if (!signature) {
      issues.push("approval_response_signature_base64_invalid");
    } else if (signature.length !== 64) {
      issues.push("approval_response_signature_length_invalid");
    }
  }
  try {
    canonicalJson(value);
  } catch {
    issues.push("approval_response_canonical_value_invalid");
  }
  if (
    issues.length === 0 &&
    value.responseId !==
      recomputeMetricsCutoverExecutionApprovalResponseId(value)
  ) {
    issues.push("approval_response_id_mismatch");
  }
  return uniqueSorted(issues);
}

function validateResponseTime(value, evaluationNow, issues) {
  const evaluation =
    evaluationNow instanceof Date
      ? new Date(evaluationNow.getTime())
      : parseIsoInstant(evaluationNow);
  const issuedAt = parseIsoInstant(value.issuedAt);
  const expiresAt = parseIsoInstant(value.expiresAt);
  if (!evaluation || !issuedAt || !expiresAt) {
    issues.push("approval_response_time_policy_input_invalid");
    return;
  }
  const nowMs = evaluation.getTime();
  const issuedMs = issuedAt.getTime();
  const expiresMs = expiresAt.getTime();
  if (expiresMs <= issuedMs) {
    issues.push("approval_response_expiry_order_invalid");
  }
  if (issuedMs > nowMs) {
    issues.push("approval_response_issued_in_future");
  }
  if (issuedMs - nowMs > MAX_FUTURE_SKEW_MS) {
    issues.push("approval_response_future_skew_exceeded");
  }
  if (nowMs >= expiresMs) {
    issues.push("approval_response_expired");
  }
  if (nowMs - issuedMs > MAX_RESPONSE_AGE_MS) {
    issues.push("approval_response_stale");
  }
}

function validateResponseRequestBinding(value, request, issues) {
  if (!isRecord(request)) {
    issues.push("approval_response_request_binding_missing");
    return;
  }
  for (const field of [
    "requestId",
    "requestHash",
    "operatorBundleSha256",
    "repositoryHeadSha",
    "repositoryTreeSha",
    "executionPackageHash",
  ]) {
    if (value[field] !== request[field]) {
      issues.push(`approval_response_request_identity_mismatch:${field}`);
    }
  }
}

function validateMetricsCutoverExecutionApprovalResponse(
  value = {},
  { evaluationNow, request } = {},
) {
  const issues = validateResponseShape(value);
  if (evaluationNow !== undefined) {
    validateResponseTime(value, evaluationNow, issues);
  }
  if (request !== undefined) {
    validateResponseRequestBinding(value, request, issues);
  }
  return { ok: issues.length === 0, issues: uniqueSorted(issues) };
}

function canonicalizeMetricsCutoverExecutionApprovalResponse(value = {}) {
  const issues = validateResponseShape(value);
  if (issues.length > 0) throw new TypeError(issues.join(","));
  return canonicalJson(value);
}

function hashMetricsCutoverExecutionApprovalResponse(value = {}) {
  return sha256(
    Buffer.from(
      canonicalizeMetricsCutoverExecutionApprovalResponse(value),
      "utf8",
    ),
  );
}

function buildMetricsCutoverExecutionApprovalSignaturePayload(value = {}) {
  const issues = validateResponseShape(value, { skipSignature: true });
  if (issues.length > 0) throw new TypeError(issues.join(","));
  const unsigned = {};
  for (const field of RESPONSE_FIELDS) {
    if (field !== "signatureBase64") unsigned[field] = value[field];
  }
  return Buffer.concat([
    Buffer.from(SIGNATURE_DOMAIN, "utf8"),
    Buffer.from(canonicalJson(unsigned), "utf8"),
  ]);
}

function validateExactStringArray(value, expected, issuePrefix, issues) {
  if (
    !Array.isArray(value) ||
    value.length !== 1 ||
    value[0] !== expected
  ) {
    issues.push(`${issuePrefix}_invalid`);
  }
}

function normalizeExecutionApproverAllowlist(value = {}) {
  const issues = [];
  if (!hasExactKeys(value, ALLOWLIST_FIELDS)) {
    return { ok: false, entries: [], issues: ["approver_allowlist_fields_invalid"] };
  }
  if (value.contractVersion !== EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION) {
    issues.push("approver_allowlist_contract_version_mismatch");
  }
  if (!Array.isArray(value.entries) || value.entries.length === 0) {
    issues.push("approver_allowlist_entries_invalid");
    return { ok: false, entries: [], issues: uniqueSorted(issues) };
  }
  const keyIds = new Set();
  const signerIds = new Set();
  const fingerprints = new Set();
  const entries = [];
  value.entries.forEach((entry, index) => {
    const prefix = `approver_allowlist_entry_${index}`;
    if (!hasExactKeys(entry, ALLOWLIST_ENTRY_FIELDS)) {
      issues.push(`${prefix}_fields_invalid`);
      return;
    }
    if (!isNonEmptyString(entry.signerKeyId)) {
      issues.push(`${prefix}_signer_key_id_invalid`);
    } else if (keyIds.has(entry.signerKeyId)) {
      issues.push("approver_allowlist_signer_key_id_duplicate");
    } else {
      keyIds.add(entry.signerKeyId);
    }
    if (!isNonEmptyString(entry.signerId)) {
      issues.push(`${prefix}_signer_id_invalid`);
    } else if (signerIds.has(entry.signerId)) {
      issues.push("approver_allowlist_signer_id_duplicate");
    } else {
      signerIds.add(entry.signerId);
    }
    validateExactStringArray(
      entry.allowedScopes,
      APPROVAL_SCOPE,
      `${prefix}_allowed_scopes`,
      issues,
    );
    validateExactStringArray(
      entry.roles,
      APPROVER_ROLE,
      `${prefix}_roles`,
      issues,
    );
    if (entry.revoked !== false) {
      issues.push(`${prefix}_revoked`);
    }
    let publicKey = null;
    let fingerprint = "";
    try {
      publicKey = createPublicKey(entry.publicKeyPem);
      if (publicKey.asymmetricKeyType !== "ed25519") {
        issues.push(`${prefix}_public_key_not_ed25519`);
      } else {
        const spki = publicKey.export({ type: "spki", format: "der" });
        fingerprint = sha256(spki);
        if (fingerprints.has(fingerprint)) {
          issues.push("approver_allowlist_public_key_duplicate");
        } else {
          fingerprints.add(fingerprint);
        }
      }
    } catch {
      issues.push(`${prefix}_public_key_invalid`);
    }
    entries.push({
      signerKeyId: entry.signerKeyId,
      signerId: entry.signerId,
      publicKey,
      fingerprint,
    });
  });
  return {
    ok: issues.length === 0,
    entries: issues.length === 0 ? entries : [],
    issues: uniqueSorted(issues),
  };
}

function statByteSize(stat) {
  if (typeof stat?.size === "bigint") {
    return stat.size >= 0n && stat.size <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(stat.size)
      : null;
  }
  return Number.isSafeInteger(stat?.size) && stat.size >= 0
    ? stat.size
    : null;
}

function identitiesEqual(left, right) {
  return (
    left.supported === right.supported &&
    (!left.supported || left.value === right.value)
  );
}

function failedObservation(kind, issues) {
  return {
    ok: false,
    value: null,
    blockingIssues: uniqueSorted(
      issues.map((issue) => `${kind}_${issue}`),
    ),
  };
}

function parseJsonBytes(bytes, kind) {
  let text;
  try {
    text = decoder.decode(bytes);
  } catch {
    return { ok: false, value: null, issues: ["invalid_utf8"] };
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, value: null, issues: ["invalid_json"] };
  }
  const validation =
    kind === "approval_response"
      ? validateMetricsCutoverExecutionApprovalResponse(value)
      : normalizeExecutionApproverAllowlist(value);
  return validation.ok
    ? { ok: true, value, issues: [] }
    : { ok: false, value: null, issues: validation.issues };
}

function readDescriptorAtomicJsonObservation(
  inputPath,
  kind,
  maxInputBytes,
  {
    fs = {
      closeSync,
      fstatSync,
      lstatSync,
      openSync,
      readFileSync,
      realpathSync,
    },
  } = {},
) {
  if (!isNonEmptyString(inputPath)) {
    return failedObservation(kind, ["input_path_missing"]);
  }
  const absolute = path.resolve(inputPath);
  let pathStatBefore;
  let canonicalPathBefore;
  try {
    pathStatBefore = fs.lstatSync(absolute, { bigint: true });
    canonicalPathBefore = fs.realpathSync(absolute);
  } catch (error) {
    return failedObservation(kind, [
      error?.code === "ENOENT" ? "input_missing" : "input_inspection_failed",
    ]);
  }
  if (pathStatBefore.isSymbolicLink()) {
    return failedObservation(kind, ["input_symlink"]);
  }
  if (!pathStatBefore.isFile()) {
    return failedObservation(kind, ["input_not_regular_file"]);
  }
  const pathSizeBefore = statByteSize(pathStatBefore);
  if (
    pathSizeBefore === null ||
    pathSizeBefore <= 0 ||
    pathSizeBefore > maxInputBytes
  ) {
    return failedObservation(kind, ["input_size_invalid"]);
  }

  let descriptor;
  let descriptorStatBefore;
  let descriptorStatAfter;
  let bytes;
  let readFailed = false;
  let closeFailed = false;
  try {
    descriptor = fs.openSync(canonicalPathBefore, "r");
    descriptorStatBefore = fs.fstatSync(descriptor, { bigint: true });
    bytes = fs.readFileSync(descriptor);
    descriptorStatAfter = fs.fstatSync(descriptor, { bigint: true });
  } catch {
    readFailed = true;
  } finally {
    if (descriptor !== undefined) {
      try {
        fs.closeSync(descriptor);
      } catch {
        closeFailed = true;
      }
    }
  }
  if (closeFailed) return failedObservation(kind, ["input_close_failed"]);
  if (readFailed) return failedObservation(kind, ["input_read_failed"]);

  let pathStatAfter;
  let canonicalPathAfter;
  try {
    pathStatAfter = fs.lstatSync(absolute, { bigint: true });
    canonicalPathAfter = fs.realpathSync(absolute);
  } catch {
    return failedObservation(kind, ["post_read_inspection_failed"]);
  }
  const issues = [];
  if (pathStatAfter.isSymbolicLink()) issues.push("symlink_during_read");
  if (!pathStatAfter.isFile()) issues.push("not_regular_file_during_read");
  if (canonicalPathBefore !== canonicalPathAfter) {
    issues.push("canonical_path_changed_during_read");
  }
  const pathIdentityBefore = stableFileIdentity(pathStatBefore);
  const pathIdentityAfter = stableFileIdentity(pathStatAfter);
  const descriptorIdentityBefore = stableFileIdentity(descriptorStatBefore);
  const descriptorIdentityAfter = stableFileIdentity(descriptorStatAfter);
  if (!identitiesEqual(pathIdentityBefore, pathIdentityAfter)) {
    issues.push("path_identity_changed_during_read");
  }
  if (!identitiesEqual(descriptorIdentityBefore, descriptorIdentityAfter)) {
    issues.push("descriptor_identity_changed_during_read");
  }
  if (
    !identitiesEqual(pathIdentityBefore, descriptorIdentityBefore) ||
    !identitiesEqual(pathIdentityAfter, descriptorIdentityAfter)
  ) {
    issues.push("path_descriptor_identity_mismatch");
  }
  const pathSizeAfter = statByteSize(pathStatAfter);
  const descriptorSizeBefore = statByteSize(descriptorStatBefore);
  const descriptorSizeAfter = statByteSize(descriptorStatAfter);
  if (
    pathSizeAfter === null ||
    descriptorSizeBefore === null ||
    descriptorSizeAfter === null ||
    pathSizeBefore !== pathSizeAfter ||
    pathSizeBefore !== descriptorSizeBefore ||
    descriptorSizeBefore !== descriptorSizeAfter
  ) {
    issues.push("size_changed_during_read");
  }
  if (
    !Buffer.isBuffer(bytes) ||
    descriptorSizeAfter === null ||
    bytes.length !== descriptorSizeAfter
  ) {
    issues.push("bytes_size_mismatch");
  }
  if (issues.length > 0) return failedObservation(kind, issues);
  const parsed = parseJsonBytes(bytes, kind);
  if (!parsed.ok) return failedObservation(kind, parsed.issues);
  return {
    ok: true,
    value: parsed.value,
    blockingIssues: [],
    canonicalInputPath: canonicalPathBefore,
    bytes,
    byteSize: bytes.length,
    sha256: sha256(bytes),
    fileIdentity: descriptorIdentityAfter.value,
    fileIdentitySupported: descriptorIdentityAfter.supported,
  };
}

function readMetricsCutoverExecutionApprovalResponseObservation(
  inputPath,
  options = {},
) {
  return readDescriptorAtomicJsonObservation(
    inputPath,
    "approval_response",
    options.maxInputBytes || MAX_RESPONSE_BYTES,
    options,
  );
}

function readMetricsCutoverExecutionApproverAllowlistObservation(
  inputPath,
  options = {},
) {
  return readDescriptorAtomicJsonObservation(
    inputPath,
    "approver_allowlist",
    options.maxInputBytes || MAX_ALLOWLIST_BYTES,
    options,
  );
}

function compareFileObservations(left, right, kind) {
  const issues = [];
  if (!left?.ok) issues.push(`${kind}_observation_a_invalid`);
  if (!right?.ok) issues.push(`${kind}_observation_b_invalid`);
  if (issues.length > 0) return issues;
  if (left.canonicalInputPath !== right.canonicalInputPath) {
    issues.push(`${kind}_canonical_path_changed`);
  }
  if (left.byteSize !== right.byteSize) issues.push(`${kind}_byte_size_changed`);
  if (left.sha256 !== right.sha256) issues.push(`${kind}_sha256_changed`);
  if (
    !Buffer.isBuffer(left.bytes) ||
    !Buffer.isBuffer(right.bytes) ||
    !left.bytes.equals(right.bytes)
  ) {
    issues.push(`${kind}_bytes_changed`);
  }
  if (left.fileIdentitySupported !== right.fileIdentitySupported) {
    issues.push(`${kind}_file_identity_support_changed`);
  } else if (
    left.fileIdentitySupported === true &&
    left.fileIdentity !== right.fileIdentity
  ) {
    issues.push(`${kind}_file_identity_changed`);
  }
  return uniqueSorted(issues);
}

function validateStep1142TResult(result, label) {
  const issues = [];
  if (!isRecord(result)) return [`step114_2t_${label}_not_object`];
  for (const [field, expected] of Object.entries({
    status: "request_ready",
    ok: true,
    approvalRequestReady: true,
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
  })) {
    if (result[field] !== expected) {
      issues.push(`step114_2t_${label}_invalid:${field}`);
    }
  }
  for (const field of STEP114_2T_FIXED_FALSE_FIELDS) {
    if (result[field] !== false) {
      issues.push(`step114_2t_${label}_fixed_false_invalid:${field}`);
    }
  }
  const validation = validateMetricsCutoverExecutionApprovalRequest(
    result.approvalRequest,
  );
  if (!validation.ok) {
    issues.push(...validation.issues.map((issue) => `step114_2t_${label}:${issue}`));
  } else {
    const request = result.approvalRequest;
    for (const field of [
      "operatorBundleSha256",
      "repositoryHeadSha",
      "repositoryTreeSha",
      "branchName",
      "executionPackageHash",
    ]) {
      if (result[field] !== request[field]) {
        issues.push(`step114_2t_${label}_outer_identity_mismatch:${field}`);
      }
    }
    if (result.approvalRequestHash !== request.requestHash) {
      issues.push(`step114_2t_${label}_outer_identity_mismatch:requestHash`);
    }
  }
  return uniqueSorted(issues);
}

function compareStep1142TRequests(left, right) {
  const issues = [];
  for (const field of REQUEST_EQUALITY_FIELDS) {
    let equal = false;
    try {
      equal = canonicalJson(left?.[field]) === canonicalJson(right?.[field]);
    } catch {
      equal = false;
    }
    if (!equal) issues.push(`step114_2t_request_changed:${field}`);
  }
  return uniqueSorted(issues);
}

function priorSignerIdentities(bundle, issues) {
  const receipts = [
    bundle?.finalApprovalInput?.productionApprovalReceipt,
    bundle?.finalApprovalInput?.appExportApprovalReceipt,
  ];
  const signerKeyIds = new Set();
  const signerIds = new Set();
  for (const receipt of receipts) {
    if (
      !isRecord(receipt) ||
      !isNonEmptyString(receipt.signerKeyId) ||
      !isNonEmptyString(receipt.signerId)
    ) {
      issues.push("operator_bundle_prior_signer_identity_invalid");
      continue;
    }
    signerKeyIds.add(receipt.signerKeyId);
    signerIds.add(receipt.signerId);
  }
  return { signerKeyIds, signerIds };
}

function hashMetricsCutoverExecutionApprovalVerificationReceipt(receipt) {
  const payload = { ...receipt };
  delete payload.verificationReceiptHash;
  return sha256(Buffer.from(canonicalJson(payload), "utf8"));
}

function buildMetricsCutoverExecutionApprovalVerificationReceipt({
  request,
  response,
  responseHash,
  responseFileSha256,
  allowlistFileSha256,
}) {
  const receipt = {
    requestId: request.requestId,
    requestHash: request.requestHash,
    responseId: response.responseId,
    responseHash,
    responseFileSha256,
    allowlistFileSha256,
    operatorBundleSha256: request.operatorBundleSha256,
    repositoryHeadSha: request.repositoryHeadSha,
    repositoryTreeSha: request.repositoryTreeSha,
    branchName: request.branchName,
    executionPackageHash: request.executionPackageHash,
    signerKeyId: response.signerKeyId,
    signerId: response.signerId,
    issuedAt: response.issuedAt,
    expiresAt: response.expiresAt,
    targets: request.targets.map((target) => ({ ...target })),
    plannedWriteCount: request.plannedWriteCount,
    plannedDeleteCount: request.plannedDeleteCount,
    policyFacts: {
      verificationPolicyVersion: APPROVAL_VERIFICATION_POLICY_VERSION,
      approvalScope: APPROVAL_SCOPE,
      signatureAlgorithm: SIGNATURE_ALGORITHM,
      maxResponseAgeMinutes: 30,
      maxFutureSkewSeconds: 60,
      createOnlyWritesRequired: true,
      exactTwoSelectorReplacementsRequired: true,
      targetDeletionProhibited: true,
      automaticRollbackProhibited: true,
      executionNotYetAuthorized: true,
    },
    verificationReceiptHash: "0".repeat(64),
  };
  receipt.verificationReceiptHash =
    hashMetricsCutoverExecutionApprovalVerificationReceipt(receipt);
  return receipt;
}

function safeResult(status, fields = {}, issues = [], warnings = []) {
  const ready = status === "approval_verified";
  return {
    ok: ready,
    status,
    contractVersion: APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION,
    approvalResponseVerified: ready,
    approvalDecisionAccepted: ready,
    signatureVerified: ready,
    verificationReceiptHash: ready ? fields.verificationReceiptHash || "" : "",
    requestId: ready ? fields.requestId || "" : "",
    requestHash: ready ? fields.requestHash || "" : "",
    responseId: ready ? fields.responseId || "" : "",
    responseHash: ready ? fields.responseHash || "" : "",
    responseFileSha256: ready ? fields.responseFileSha256 || "" : "",
    allowlistFileSha256: ready ? fields.allowlistFileSha256 || "" : "",
    operatorBundleSha256: ready ? fields.operatorBundleSha256 || "" : "",
    repositoryHeadSha: ready ? fields.repositoryHeadSha || "" : "",
    repositoryTreeSha: ready ? fields.repositoryTreeSha || "" : "",
    branchName: ready ? fields.branchName || "" : "",
    executionPackageHash: ready ? fields.executionPackageHash || "" : "",
    signerKeyId: ready ? fields.signerKeyId || "" : "",
    signerId: ready ? fields.signerId || "" : "",
    issuedAt: ready ? fields.issuedAt || "" : "",
    expiresAt: ready ? fields.expiresAt || "" : "",
    targetFileCount: ready && Number.isInteger(fields.targetFileCount)
      ? fields.targetFileCount
      : 0,
    plannedWriteCount: ready && Number.isInteger(fields.plannedWriteCount)
      ? fields.plannedWriteCount
      : 0,
    plannedDeleteCount: ready && Number.isInteger(fields.plannedDeleteCount)
      ? fields.plannedDeleteCount
      : 0,
    executionAuthorized: false,
    fileWriteAuthorized: false,
    commitAuthorized: false,
    pushAuthorized: false,
    mergeAuthorized: false,
    deploymentAuthorized: false,
    productionPublicationAuthorized: false,
    appExportActivated: false,
    pointerMutationExecuted: false,
    rollbackExecuted: false,
    loaderActivated: false,
    blockingIssues: uniqueSorted(issues),
    warningIssues: uniqueSorted(warnings),
  };
}

async function runMetricsCutoverExecutionApprovalResponseVerification(
  input = {},
  adapters = {},
) {
  if (!isRecord(input) || Object.keys(input).length === 0) {
    return safeResult("idle", {}, [
      "metrics_cutover_execution_approval_response_input_missing",
    ]);
  }
  if (
    !hasExactKeys(input, [
      "repo",
      "inputPath",
      "responsePath",
      "allowlistPath",
    ]) ||
    !isNonEmptyString(input.repo) ||
    !isNonEmptyString(input.inputPath) ||
    !isNonEmptyString(input.responsePath) ||
    !isNonEmptyString(input.allowlistPath)
  ) {
    return safeResult("blocked", {}, [
      "metrics_cutover_execution_approval_response_invocation_invalid",
    ]);
  }
  const observeResponse =
    adapters.observeResponse ||
    readMetricsCutoverExecutionApprovalResponseObservation;
  const observeAllowlist =
    adapters.observeAllowlist ||
    readMetricsCutoverExecutionApproverAllowlistObservation;
  const observeBundle =
    adapters.observeBundle || readMetricsCutoverPostMergeBundleObservation;
  const runApprovalRequest =
    adapters.runApprovalRequest ||
    runMetricsCutoverExecutionApprovalRequest;

  const responseA = await observeResponse(input.responsePath);
  const allowlistA = await observeAllowlist(input.allowlistPath);
  const initialIssues = [
    ...(responseA?.ok
      ? []
      : responseA?.blockingIssues || ["approval_response_observation_a_failed"]),
    ...(allowlistA?.ok
      ? []
      : allowlistA?.blockingIssues || ["approver_allowlist_observation_a_failed"]),
  ];
  if (initialIssues.length > 0) {
    return safeResult("blocked", {}, initialIssues);
  }

  const requestAResult = await runApprovalRequest({
    repo: input.repo,
    inputPath: input.inputPath,
  });
  const requestAIssues = validateStep1142TResult(requestAResult, "a");
  if (requestAIssues.length > 0) {
    return safeResult("blocked", {}, requestAIssues);
  }
  const requestA = requestAResult.approvalRequest;
  const bundleObservation = await observeBundle(input.inputPath);
  if (!bundleObservation?.ok || !isRecord(bundleObservation.bundle)) {
    return safeResult(
      "blocked",
      {},
      bundleObservation?.blockingIssues || ["operator_bundle_observation_failed"],
    );
  }
  const issues = [];
  if (bundleObservation.sha256 !== requestA.operatorBundleSha256) {
    issues.push("operator_bundle_request_a_hash_mismatch");
  }
  const evaluationNow = bundleObservation.bundle.evaluationNow;
  const responseValidation = validateMetricsCutoverExecutionApprovalResponse(
    responseA.value,
    { evaluationNow, request: requestA },
  );
  issues.push(...responseValidation.issues);
  const normalizedAllowlist = normalizeExecutionApproverAllowlist(
    allowlistA.value,
  );
  issues.push(...normalizedAllowlist.issues);
  const priorIdentities = priorSignerIdentities(
    bundleObservation.bundle,
    issues,
  );
  const response = responseA.value;
  if (priorIdentities.signerKeyIds.has(response.signerKeyId)) {
    issues.push("execution_approver_signer_key_not_distinct");
  }
  if (priorIdentities.signerIds.has(response.signerId)) {
    issues.push("execution_approver_signer_id_not_distinct");
  }
  const keyMatches = normalizedAllowlist.entries.filter(
    (entry) => entry.signerKeyId === response.signerKeyId,
  );
  const signerMatches = normalizedAllowlist.entries.filter(
    (entry) => entry.signerId === response.signerId,
  );
  let matchedEntry = null;
  if (
    keyMatches.length !== 1 ||
    signerMatches.length !== 1 ||
    keyMatches[0] !== signerMatches[0]
  ) {
    issues.push("execution_approver_resolution_failed");
  } else {
    matchedEntry = keyMatches[0];
  }
  if (issues.length === 0 && matchedEntry) {
    const signature = decodeCanonicalBase64(response.signatureBase64);
    let verified = false;
    try {
      verified = verifySignature(
        null,
        buildMetricsCutoverExecutionApprovalSignaturePayload(response),
        matchedEntry.publicKey,
        signature,
      );
    } catch {
      verified = false;
    }
    if (!verified) issues.push("approval_response_signature_invalid");
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  const requestBResult = await runApprovalRequest({
    repo: input.repo,
    inputPath: input.inputPath,
  });
  const responseB = await observeResponse(input.responsePath);
  const allowlistB = await observeAllowlist(input.allowlistPath);
  issues.push(...validateStep1142TResult(requestBResult, "b"));
  if (!responseB?.ok) {
    issues.push(
      ...(responseB?.blockingIssues || ["approval_response_observation_b_failed"]),
    );
  }
  if (!allowlistB?.ok) {
    issues.push(
      ...(allowlistB?.blockingIssues || ["approver_allowlist_observation_b_failed"]),
    );
  }
  issues.push(...compareFileObservations(responseA, responseB, "approval_response"));
  issues.push(...compareFileObservations(allowlistA, allowlistB, "approver_allowlist"));
  if (requestBResult?.approvalRequest) {
    issues.push(...compareStep1142TRequests(requestA, requestBResult.approvalRequest));
    if (
      requestBResult.approvalRequest.operatorBundleSha256 !==
      bundleObservation.sha256
    ) {
      issues.push("operator_bundle_request_b_hash_mismatch");
    }
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  let responseHash;
  let receipt;
  try {
    responseHash = hashMetricsCutoverExecutionApprovalResponse(response);
    receipt = buildMetricsCutoverExecutionApprovalVerificationReceipt({
      request: requestA,
      response,
      responseHash,
      responseFileSha256: responseA.sha256,
      allowlistFileSha256: allowlistA.sha256,
    });
  } catch {
    return safeResult("blocked", {}, ["approval_verification_receipt_failed"]);
  }
  return safeResult(
    "approval_verified",
    {
      verificationReceiptHash: receipt.verificationReceiptHash,
      requestId: requestA.requestId,
      requestHash: requestA.requestHash,
      responseId: response.responseId,
      responseHash,
      responseFileSha256: responseA.sha256,
      allowlistFileSha256: allowlistA.sha256,
      operatorBundleSha256: requestA.operatorBundleSha256,
      repositoryHeadSha: requestA.repositoryHeadSha,
      repositoryTreeSha: requestA.repositoryTreeSha,
      branchName: requestA.branchName,
      executionPackageHash: requestA.executionPackageHash,
      signerKeyId: response.signerKeyId,
      signerId: response.signerId,
      issuedAt: response.issuedAt,
      expiresAt: response.expiresAt,
      targetFileCount: requestA.targets.length,
      plannedWriteCount: requestA.plannedWriteCount,
      plannedDeleteCount: requestA.plannedDeleteCount,
    },
    [],
    requestAResult.warningIssues,
  );
}

module.exports = {
  ALLOWLIST_ENTRY_FIELDS,
  ALLOWLIST_FIELDS,
  APPROVAL_RESPONSE_CONTRACT_VERSION,
  APPROVAL_SCOPE,
  APPROVAL_VERIFICATION_POLICY_VERSION,
  APPROVAL_VERIFICATION_SUMMARY_CONTRACT_VERSION,
  APPROVER_ROLE,
  ATTESTATION_FACTS,
  ATTESTATION_FIELDS,
  EXECUTION_APPROVER_ALLOWLIST_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS,
  MAX_ALLOWLIST_BYTES,
  MAX_FUTURE_SKEW_MS,
  MAX_RESPONSE_AGE_MS,
  MAX_RESPONSE_BYTES,
  RESPONSE_FIELDS,
  SIGNATURE_ALGORITHM,
  buildMetricsCutoverExecutionApprovalSignaturePayload,
  buildMetricsCutoverExecutionApprovalVerificationReceipt,
  canonicalizeMetricsCutoverExecutionApprovalResponse,
  compareFileObservations,
  hashMetricsCutoverExecutionApprovalResponse,
  hashMetricsCutoverExecutionApprovalVerificationReceipt,
  normalizeExecutionApproverAllowlist,
  readMetricsCutoverExecutionApprovalResponseObservation,
  readMetricsCutoverExecutionApproverAllowlistObservation,
  recomputeMetricsCutoverExecutionApprovalResponseId,
  runMetricsCutoverExecutionApprovalResponseVerification,
  safeResult,
  validateMetricsCutoverExecutionApprovalResponse,
};
