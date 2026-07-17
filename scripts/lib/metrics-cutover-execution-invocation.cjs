const {
  createHash,
  createPublicKey,
  verify: verifySignature,
} = require("node:crypto");

const {
  TARGET_FIELDS,
} = require("./metrics-cutover-execution-approval-request.cjs");
const {
  parseCanonicalUtcMillisecondInstant,
  readDescriptorAtomicJsonObservation,
  readMetricsCutoverExecutionApprovalResponseObservation,
  readMetricsCutoverExecutionApproverAllowlistObservation,
  runMetricsCutoverExecutionApprovalResponseVerification,
  scanJsonForDuplicateObjectKeys,
} = require("./metrics-cutover-execution-approval-response.cjs");
const {
  AUTHORITY_SUMMARY_CONTRACT_VERSION,
  FIXED_FALSE_FIELDS: STEP114_2V_FIXED_FALSE_FIELDS,
  canonicalizeMetricsCutoverExecutionAuthorityPackage,
  runMetricsCutoverExecutionAuthorityPackage,
  validateMetricsCutoverExecutionAuthorityPackage,
} = require("./metrics-cutover-execution-authority-package.cjs");
const {
  readMetricsCutoverPostMergeBundleObservation,
} = require("./metrics-cutover-post-merge-dry-run-input.cjs");

const EXECUTION_INVOCATION_CONTRACT_VERSION =
  "metrics-cutover-execution-invocation-v1-step114-2w";
const EXECUTION_INVOCATION_POLICY_VERSION =
  "metrics-cutover-execution-invocation-policy-v1-step114-2w";
const EXECUTION_INVOCATION_SUMMARY_CONTRACT_VERSION =
  "metrics-cutover-execution-invocation-verification-summary-v1-step114-2w";
const EXECUTION_INVOKER_ALLOWLIST_CONTRACT_VERSION =
  "metrics-cutover-execution-invoker-allowlist-v1-step114-2w";
const EXECUTION_INVOCATION_RECEIPT_CONTRACT_VERSION =
  "metrics-cutover-execution-invocation-receipt-v1-step114-2w";

const EXECUTION_INVOCATION_ID_DOMAIN =
  "FINPLE_STEP114_2W_EXECUTION_INVOCATION_ID\0";
const EXECUTION_INVOCATION_SIGNATURE_DOMAIN =
  "FINPLE_STEP114_2W_EXECUTION_INVOCATION_SIGNATURE\0";
const EXECUTION_INVOCATION_RECEIPT_ID_DOMAIN =
  "FINPLE_STEP114_2W_INVOCATION_RECEIPT_ID\0";
const EXECUTION_INVOCATION_RECEIPT_HASH_DOMAIN =
  "FINPLE_STEP114_2W_INVOCATION_RECEIPT_HASH\0";

const EXECUTION_SCOPE = "metrics_exact_cutover_execution";
const EXECUTION_INVOCATION_STATUS = "explicit_single_use_invocation";
const EXECUTION_INVOKER_ROLE = "metrics_cutover_execution_invoker";
const SIGNATURE_ALGORITHM = "Ed25519";
const INVOCATION_RECEIPT_STATUS = "verified_unconsumed";
const MAX_INVOCATION_BYTES = 1024 * 1024;
const MAX_INVOKER_ALLOWLIST_BYTES = 4 * 1024 * 1024;
const MAX_FUTURE_SKEW_MS = 60 * 1000;
const MAX_INVOCATION_AGE_MS = 10 * 60 * 1000;
const MAX_INVOCATION_LIFETIME_MS = 15 * 60 * 1000;

const INVOCATION_FIELDS = Object.freeze([
  "contractVersion",
  "invocationId",
  "authorityPackageId",
  "authorityPackageHash",
  "requestId",
  "requestHash",
  "verificationReceiptHash",
  "operatorBundleSha256",
  "repositoryHeadSha",
  "repositoryTreeSha",
  "trackedPathsSha256",
  "targetPathAbsenceEvidenceHash",
  "executionPackageHash",
  "selectorPreimageSha256",
  "selectorPostimageSha256",
  "targets",
  "plannedWriteCount",
  "plannedDeleteCount",
  "invocationScope",
  "invocationStatus",
  "invokedAt",
  "expiresAt",
  "invocationNonce",
  "invokerKeyId",
  "invokerId",
  "signatureAlgorithm",
  "attestations",
  "signatureBase64",
]);

const INVOCATION_ATTESTATIONS = Object.freeze({
  exactAuthorityPackageReviewed: true,
  freshRepositoryRecheckRequired: true,
  freshApprovalReverificationRequired: true,
  createOnlyWritesAcknowledged: true,
  exactTwoSelectorReplacementsAcknowledged: true,
  targetDeletionProhibited: true,
  automaticRollbackProhibited: true,
  singleUseReceiptRequired: true,
  executionNotYetPerformed: true,
});
const INVOCATION_ATTESTATION_FIELDS = Object.freeze(
  Object.keys(INVOCATION_ATTESTATIONS),
);
const INVOKER_ALLOWLIST_FIELDS = Object.freeze(["contractVersion", "entries"]);
const INVOKER_ALLOWLIST_ENTRY_FIELDS = Object.freeze([
  "invokerKeyId",
  "invokerId",
  "publicKeyPem",
  "allowedScopes",
  "roles",
  "revoked",
]);

const INVOCATION_RECEIPT_REQUIREMENTS = Object.freeze({
  requiresExactRepositoryHead: true,
  requiresExactRepositoryTree: true,
  requiresExactTrackedPathsHash: true,
  requiresFreshAuthorityReproduction: true,
  requiresFreshApprovalReverification: true,
  requiresCreateOnlyWrites: true,
  requiresExactTwoSelectorReplacements: true,
  requiresPostWriteVerification: true,
  singleUse: true,
  allowTargetDeletion: false,
  allowAutomaticRollback: false,
});
const INVOCATION_RECEIPT_REQUIREMENT_FIELDS = Object.freeze(
  Object.keys(INVOCATION_RECEIPT_REQUIREMENTS),
);
const INVOCATION_RECEIPT_FIELDS = Object.freeze([
  "contractVersion",
  "receiptId",
  "receiptStatus",
  "invocationId",
  "invocationHash",
  "authorityPackageId",
  "authorityPackageHash",
  "requestId",
  "requestHash",
  "verificationReceiptHash",
  "operatorBundleSha256",
  "repositoryHeadSha",
  "repositoryTreeSha",
  "trackedPathsSha256",
  "targetPathAbsenceEvidenceHash",
  "executionPackageHash",
  "selectorPreimageSha256",
  "selectorPostimageSha256",
  "invocationNonceHash",
  "invokerKeyId",
  "invokerId",
  "invokedAt",
  "expiresAt",
  "targets",
  "plannedWriteCount",
  "plannedDeleteCount",
  "receiptRequirements",
  "receiptHash",
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
    !/[\0\r\n]/.test(value)
  );
}

function isSafeIdentity(value) {
  return (
    isNonEmptyString(value) &&
    value.length <= 128 &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) &&
    value !== "*"
  );
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isGitSha(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function hasExactKeys(value, fields) {
  if (!isRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
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
      if (value[key] === undefined) throw new TypeError("undefined_not_supported");
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
  const decoded = Buffer.from(value, "base64");
  return decoded.toString("base64") === value ? decoded : null;
}

function invocationIdentityPayload(value) {
  return {
    authorityPackageId: value.authorityPackageId,
    authorityPackageHash: value.authorityPackageHash,
    requestId: value.requestId,
    requestHash: value.requestHash,
    verificationReceiptHash: value.verificationReceiptHash,
    repositoryHeadSha: value.repositoryHeadSha,
    repositoryTreeSha: value.repositoryTreeSha,
    executionPackageHash: value.executionPackageHash,
    invocationNonce: value.invocationNonce,
    invokerKeyId: value.invokerKeyId,
    invokerId: value.invokerId,
    invokedAt: value.invokedAt,
    expiresAt: value.expiresAt,
  };
}

function recomputeMetricsCutoverExecutionInvocationId(value = {}) {
  return `metrics-cutover-execution-invocation-${sha256(
    Buffer.concat([
      Buffer.from(EXECUTION_INVOCATION_ID_DOMAIN, "utf8"),
      Buffer.from(canonicalJson(invocationIdentityPayload(value)), "utf8"),
    ]),
  )}`;
}

function validateAttestations(value, issues) {
  if (!hasExactKeys(value, INVOCATION_ATTESTATION_FIELDS)) {
    issues.push("execution_invocation_attestations_fields_invalid");
    return;
  }
  for (const [field, expected] of Object.entries(INVOCATION_ATTESTATIONS)) {
    if (value[field] !== expected) {
      issues.push(`execution_invocation_attestation_mismatch:${field}`);
    }
  }
}

function validateInvocationShape(value, { skipSignature = false } = {}) {
  const issues = [];
  if (!hasExactKeys(value, INVOCATION_FIELDS)) {
    return ["execution_invocation_fields_invalid"];
  }
  if (value.contractVersion !== EXECUTION_INVOCATION_CONTRACT_VERSION) {
    issues.push("execution_invocation_contract_version_mismatch");
  }
  if (
    typeof value.invocationId !== "string" ||
    !/^metrics-cutover-execution-invocation-[a-f0-9]{64}$/.test(
      value.invocationId,
    )
  ) {
    issues.push("execution_invocation_id_invalid");
  }
  if (
    typeof value.authorityPackageId !== "string" ||
    !/^metrics-cutover-authority-package-[a-f0-9]{64}$/.test(
      value.authorityPackageId,
    )
  ) {
    issues.push("execution_invocation_authority_package_id_invalid");
  }
  if (
    typeof value.requestId !== "string" ||
    !/^metrics-cutover-request-[a-f0-9]{64}$/.test(value.requestId)
  ) {
    issues.push("execution_invocation_request_id_invalid");
  }
  for (const field of [
    "authorityPackageHash",
    "requestHash",
    "verificationReceiptHash",
    "operatorBundleSha256",
    "trackedPathsSha256",
    "targetPathAbsenceEvidenceHash",
    "executionPackageHash",
    "selectorPreimageSha256",
    "selectorPostimageSha256",
  ]) {
    if (!isSha256(value[field])) {
      issues.push(`execution_invocation_hash_invalid:${field}`);
    }
  }
  for (const field of ["repositoryHeadSha", "repositoryTreeSha"]) {
    if (!isGitSha(value[field])) {
      issues.push(`execution_invocation_git_sha_invalid:${field}`);
    }
  }
  if (!Array.isArray(value.targets) || value.targets.length !== 2) {
    issues.push("execution_invocation_targets_invalid");
  } else {
    value.targets.forEach((target, index) => {
      if (!hasExactKeys(target, TARGET_FIELDS)) {
        issues.push(`execution_invocation_target_${index}_fields_invalid`);
      }
    });
  }
  if (value.plannedWriteCount !== 2) {
    issues.push("execution_invocation_planned_write_count_invalid");
  }
  if (value.plannedDeleteCount !== 0) {
    issues.push("execution_invocation_planned_delete_count_invalid");
  }
  if (value.invocationScope !== EXECUTION_SCOPE) {
    issues.push("execution_invocation_scope_mismatch");
  }
  if (value.invocationStatus !== EXECUTION_INVOCATION_STATUS) {
    issues.push("execution_invocation_status_mismatch");
  }
  if (!parseCanonicalUtcMillisecondInstant(value.invokedAt)) {
    issues.push("execution_invocation_invoked_at_invalid");
  }
  if (!parseCanonicalUtcMillisecondInstant(value.expiresAt)) {
    issues.push("execution_invocation_expires_at_invalid");
  }
  if (
    typeof value.invocationNonce !== "string" ||
    !/^[A-Za-z0-9_-]{32,128}$/.test(value.invocationNonce)
  ) {
    issues.push("execution_invocation_nonce_invalid");
  }
  if (!isSafeIdentity(value.invokerKeyId)) {
    issues.push("execution_invocation_invoker_key_id_invalid");
  }
  if (!isSafeIdentity(value.invokerId)) {
    issues.push("execution_invocation_invoker_id_invalid");
  }
  if (value.signatureAlgorithm !== SIGNATURE_ALGORITHM) {
    issues.push("execution_invocation_signature_algorithm_mismatch");
  }
  validateAttestations(value.attestations, issues);
  if (!skipSignature) {
    const signature = decodeCanonicalBase64(value.signatureBase64);
    if (!signature || signature.length !== 64) {
      issues.push("execution_invocation_signature_invalid");
    }
  }
  try {
    canonicalJson(value);
  } catch {
    issues.push("execution_invocation_canonical_value_invalid");
  }
  return uniqueSorted(issues);
}

function validateAuthorityBinding(value, authorityPackage, issues) {
  if (!isRecord(authorityPackage)) {
    issues.push("execution_invocation_authority_package_missing");
    return;
  }
  for (const field of [
    "authorityPackageId",
    "authorityPackageHash",
    "requestId",
    "requestHash",
    "verificationReceiptHash",
    "operatorBundleSha256",
    "repositoryHeadSha",
    "repositoryTreeSha",
    "trackedPathsSha256",
    "targetPathAbsenceEvidenceHash",
    "executionPackageHash",
    "selectorPreimageSha256",
    "selectorPostimageSha256",
    "plannedWriteCount",
    "plannedDeleteCount",
  ]) {
    if (value[field] !== authorityPackage[field]) {
      issues.push(`execution_invocation_authority_mismatch:${field}`);
    }
  }
  try {
    if (canonicalJson(value.targets) !== canonicalJson(authorityPackage.targets)) {
      issues.push("execution_invocation_authority_mismatch:targets");
    }
  } catch {
    issues.push("execution_invocation_authority_mismatch:targets");
  }
}

function validateInvocationTime(value, evaluationNow, issues) {
  const evaluation = parseCanonicalUtcMillisecondInstant(evaluationNow);
  const invoked = parseCanonicalUtcMillisecondInstant(value.invokedAt);
  const expires = parseCanonicalUtcMillisecondInstant(value.expiresAt);
  if (!evaluation) {
    issues.push("execution_invocation_evaluation_now_invalid");
    return;
  }
  if (!invoked || !expires) return;
  const evaluationMilliseconds = evaluation.getTime();
  const invokedMilliseconds = invoked.getTime();
  const expiresMilliseconds = expires.getTime();
  if (invokedMilliseconds > evaluationMilliseconds + MAX_FUTURE_SKEW_MS) {
    issues.push("execution_invocation_invoked_at_too_far_future");
  }
  if (evaluationMilliseconds >= expiresMilliseconds) {
    issues.push("execution_invocation_expired");
  }
  if (expiresMilliseconds <= invokedMilliseconds) {
    issues.push("execution_invocation_expiry_not_after_invocation");
  }
  if (evaluationMilliseconds - invokedMilliseconds > MAX_INVOCATION_AGE_MS) {
    issues.push("execution_invocation_too_old");
  }
  if (expiresMilliseconds - invokedMilliseconds > MAX_INVOCATION_LIFETIME_MS) {
    issues.push("execution_invocation_lifetime_too_long");
  }
}

function validateMetricsCutoverExecutionInvocation(
  value = {},
  { authorityPackage, evaluationNow } = {},
) {
  const issues = validateInvocationShape(value);
  if (
    issues.length === 0 &&
    value.invocationId !== recomputeMetricsCutoverExecutionInvocationId(value)
  ) {
    issues.push("execution_invocation_id_mismatch");
  }
  if (authorityPackage !== undefined) {
    validateAuthorityBinding(value, authorityPackage, issues);
  }
  if (evaluationNow !== undefined) {
    validateInvocationTime(value, evaluationNow, issues);
  }
  return { ok: issues.length === 0, issues: uniqueSorted(issues) };
}

function canonicalizeMetricsCutoverExecutionInvocation(value = {}) {
  const issues = validateInvocationShape(value);
  if (issues.length > 0) throw new TypeError(issues.join(","));
  return canonicalJson(value);
}

function hashMetricsCutoverExecutionInvocation(value = {}) {
  return sha256(
    Buffer.from(canonicalizeMetricsCutoverExecutionInvocation(value), "utf8"),
  );
}

function buildMetricsCutoverExecutionInvocationSignaturePayload(value = {}) {
  const issues = validateInvocationShape(value, { skipSignature: true });
  if (issues.length > 0) throw new TypeError(issues.join(","));
  const payload = {};
  for (const field of INVOCATION_FIELDS) {
    if (field !== "signatureBase64") payload[field] = value[field];
  }
  return Buffer.concat([
    Buffer.from(EXECUTION_INVOCATION_SIGNATURE_DOMAIN, "utf8"),
    Buffer.from(canonicalJson(payload), "utf8"),
  ]);
}

function validateExactStringArray(value, expected, prefix, issues) {
  if (
    !Array.isArray(value) ||
    value.length !== expected.length ||
    value.some((item, index) => item !== expected[index]) ||
    new Set(value).size !== value.length
  ) {
    issues.push(`${prefix}_invalid`);
  }
}

function normalizeMetricsCutoverExecutionInvokerAllowlist(value = {}) {
  const issues = [];
  if (!hasExactKeys(value, INVOKER_ALLOWLIST_FIELDS)) {
    return { ok: false, entries: [], issues: ["invoker_allowlist_fields_invalid"] };
  }
  if (value.contractVersion !== EXECUTION_INVOKER_ALLOWLIST_CONTRACT_VERSION) {
    issues.push("invoker_allowlist_contract_version_mismatch");
  }
  if (!Array.isArray(value.entries) || value.entries.length === 0 || value.entries.length > 64) {
    issues.push("invoker_allowlist_entries_invalid");
    return { ok: false, entries: [], issues: uniqueSorted(issues) };
  }
  const keyIds = new Set();
  const invokerIds = new Set();
  const fingerprints = new Set();
  const entries = [];
  value.entries.forEach((entry, index) => {
    const prefix = `invoker_allowlist_entry_${index}`;
    if (!hasExactKeys(entry, INVOKER_ALLOWLIST_ENTRY_FIELDS)) {
      issues.push(`${prefix}_fields_invalid`);
      return;
    }
    if (!isSafeIdentity(entry.invokerKeyId)) {
      issues.push(`${prefix}_invoker_key_id_invalid`);
    } else if (keyIds.has(entry.invokerKeyId)) {
      issues.push("invoker_allowlist_invoker_key_id_duplicate");
    } else {
      keyIds.add(entry.invokerKeyId);
    }
    if (!isSafeIdentity(entry.invokerId)) {
      issues.push(`${prefix}_invoker_id_invalid`);
    } else if (invokerIds.has(entry.invokerId)) {
      issues.push("invoker_allowlist_invoker_id_duplicate");
    } else {
      invokerIds.add(entry.invokerId);
    }
    validateExactStringArray(
      entry.allowedScopes,
      [EXECUTION_SCOPE],
      `${prefix}_allowed_scopes`,
      issues,
    );
    validateExactStringArray(
      entry.roles,
      [EXECUTION_INVOKER_ROLE],
      `${prefix}_roles`,
      issues,
    );
    if (entry.revoked !== false) issues.push(`${prefix}_revoked`);
    let publicKey = null;
    let fingerprint = "";
    try {
      if (
        typeof entry.publicKeyPem !== "string" ||
        entry.publicKeyPem.trim().length === 0 ||
        entry.publicKeyPem.length > 16 * 1024
      ) {
        throw new TypeError("invalid_public_key_text");
      }
      publicKey = createPublicKey(entry.publicKeyPem);
      if (publicKey.asymmetricKeyType !== "ed25519") {
        issues.push(`${prefix}_public_key_not_ed25519`);
      } else {
        const canonicalDer = publicKey.export({ type: "spki", format: "der" });
        fingerprint = sha256(canonicalDer);
        if (fingerprints.has(fingerprint)) {
          issues.push("invoker_allowlist_public_key_duplicate");
        } else {
          fingerprints.add(fingerprint);
        }
      }
    } catch {
      issues.push(`${prefix}_public_key_invalid`);
    }
    entries.push({
      invokerKeyId: entry.invokerKeyId,
      invokerId: entry.invokerId,
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

function parseStrictJsonBytes(bytes, validator) {
  let text;
  try {
    text = decoder.decode(bytes);
  } catch {
    return { ok: false, value: null, issues: ["invalid_utf8"] };
  }
  const duplicateKeyScan = scanJsonForDuplicateObjectKeys(text);
  if (!duplicateKeyScan.ok) {
    return { ok: false, value: null, issues: [duplicateKeyScan.issue] };
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, value: null, issues: ["invalid_json"] };
  }
  const validation = validator(value);
  return validation.ok
    ? { ok: true, value, issues: [] }
    : { ok: false, value: null, issues: validation.issues };
}

function readMetricsCutoverExecutionInvocationObservation(inputPath, options = {}) {
  return readDescriptorAtomicJsonObservation(
    inputPath,
    "execution_invocation",
    options.maxInputBytes || MAX_INVOCATION_BYTES,
    {
      ...options,
      parseBytes: (bytes) =>
        parseStrictJsonBytes(bytes, (value) =>
          validateMetricsCutoverExecutionInvocation(value),
        ),
    },
  );
}

function readMetricsCutoverExecutionInvokerAllowlistObservation(
  inputPath,
  options = {},
) {
  return readDescriptorAtomicJsonObservation(
    inputPath,
    "execution_invoker_allowlist",
    options.maxInputBytes || MAX_INVOKER_ALLOWLIST_BYTES,
    {
      ...options,
      parseBytes: (bytes) =>
        parseStrictJsonBytes(
          bytes,
          normalizeMetricsCutoverExecutionInvokerAllowlist,
        ),
    },
  );
}

function receiptIdentityPayload(value) {
  return {
    invocationId: value.invocationId,
    invocationHash: value.invocationHash,
    authorityPackageId: value.authorityPackageId,
    authorityPackageHash: value.authorityPackageHash,
    repositoryHeadSha: value.repositoryHeadSha,
    repositoryTreeSha: value.repositoryTreeSha,
    executionPackageHash: value.executionPackageHash,
    invocationNonceHash: value.invocationNonceHash,
    invokerKeyId: value.invokerKeyId,
    invokerId: value.invokerId,
  };
}

function recomputeMetricsCutoverExecutionInvocationReceiptId(value = {}) {
  return `metrics-cutover-execution-invocation-receipt-${sha256(
    Buffer.concat([
      Buffer.from(EXECUTION_INVOCATION_RECEIPT_ID_DOMAIN, "utf8"),
      Buffer.from(canonicalJson(receiptIdentityPayload(value)), "utf8"),
    ]),
  )}`;
}

function validateReceiptRequirements(value, issues) {
  if (!hasExactKeys(value, INVOCATION_RECEIPT_REQUIREMENT_FIELDS)) {
    issues.push("invocation_receipt_requirements_fields_invalid");
    return;
  }
  for (const [field, expected] of Object.entries(INVOCATION_RECEIPT_REQUIREMENTS)) {
    if (value[field] !== expected) {
      issues.push(`invocation_receipt_requirement_mismatch:${field}`);
    }
  }
}

function validateReceiptShape(value) {
  const issues = [];
  if (!hasExactKeys(value, INVOCATION_RECEIPT_FIELDS)) {
    return ["invocation_receipt_fields_invalid"];
  }
  if (value.contractVersion !== EXECUTION_INVOCATION_RECEIPT_CONTRACT_VERSION) {
    issues.push("invocation_receipt_contract_version_mismatch");
  }
  if (
    typeof value.receiptId !== "string" ||
    !/^metrics-cutover-execution-invocation-receipt-[a-f0-9]{64}$/.test(
      value.receiptId,
    )
  ) {
    issues.push("invocation_receipt_id_invalid");
  }
  if (value.receiptStatus !== INVOCATION_RECEIPT_STATUS) {
    issues.push("invocation_receipt_status_mismatch");
  }
  if (
    typeof value.invocationId !== "string" ||
    !/^metrics-cutover-execution-invocation-[a-f0-9]{64}$/.test(
      value.invocationId,
    )
  ) {
    issues.push("invocation_receipt_invocation_id_invalid");
  }
  if (
    typeof value.authorityPackageId !== "string" ||
    !/^metrics-cutover-authority-package-[a-f0-9]{64}$/.test(
      value.authorityPackageId,
    )
  ) {
    issues.push("invocation_receipt_authority_package_id_invalid");
  }
  if (
    typeof value.requestId !== "string" ||
    !/^metrics-cutover-request-[a-f0-9]{64}$/.test(value.requestId)
  ) {
    issues.push("invocation_receipt_request_id_invalid");
  }
  for (const field of [
    "invocationHash",
    "authorityPackageHash",
    "requestHash",
    "verificationReceiptHash",
    "operatorBundleSha256",
    "trackedPathsSha256",
    "targetPathAbsenceEvidenceHash",
    "executionPackageHash",
    "selectorPreimageSha256",
    "selectorPostimageSha256",
    "invocationNonceHash",
    "receiptHash",
  ]) {
    if (!isSha256(value[field])) {
      issues.push(`invocation_receipt_hash_invalid:${field}`);
    }
  }
  for (const field of ["repositoryHeadSha", "repositoryTreeSha"]) {
    if (!isGitSha(value[field])) {
      issues.push(`invocation_receipt_git_sha_invalid:${field}`);
    }
  }
  if (!isSafeIdentity(value.invokerKeyId)) {
    issues.push("invocation_receipt_invoker_key_id_invalid");
  }
  if (!isSafeIdentity(value.invokerId)) {
    issues.push("invocation_receipt_invoker_id_invalid");
  }
  if (!parseCanonicalUtcMillisecondInstant(value.invokedAt)) {
    issues.push("invocation_receipt_invoked_at_invalid");
  }
  if (!parseCanonicalUtcMillisecondInstant(value.expiresAt)) {
    issues.push("invocation_receipt_expires_at_invalid");
  }
  if (!Array.isArray(value.targets) || value.targets.length !== 2) {
    issues.push("invocation_receipt_targets_invalid");
  } else {
    value.targets.forEach((target, index) => {
      if (!hasExactKeys(target, TARGET_FIELDS)) {
        issues.push(`invocation_receipt_target_${index}_fields_invalid`);
      }
    });
  }
  if (value.plannedWriteCount !== 2) {
    issues.push("invocation_receipt_planned_write_count_invalid");
  }
  if (value.plannedDeleteCount !== 0) {
    issues.push("invocation_receipt_planned_delete_count_invalid");
  }
  validateReceiptRequirements(value.receiptRequirements, issues);
  try {
    canonicalJson(value);
  } catch {
    issues.push("invocation_receipt_canonical_value_invalid");
  }
  return uniqueSorted(issues);
}

function canonicalizeMetricsCutoverExecutionInvocationReceipt(value = {}) {
  const issues = validateReceiptShape(value);
  if (issues.length > 0) throw new TypeError(issues.join(","));
  const payload = {};
  for (const field of INVOCATION_RECEIPT_FIELDS) {
    if (field !== "receiptHash") payload[field] = value[field];
  }
  return canonicalJson(payload);
}

function hashMetricsCutoverExecutionInvocationReceipt(value = {}) {
  return sha256(
    Buffer.concat([
      Buffer.from(EXECUTION_INVOCATION_RECEIPT_HASH_DOMAIN, "utf8"),
      Buffer.from(
        canonicalizeMetricsCutoverExecutionInvocationReceipt(value),
        "utf8",
      ),
    ]),
  );
}

function validateReceiptBinding(value, invocation, authorityPackage, issues) {
  if (invocation !== undefined) {
    const invocationHash = hashMetricsCutoverExecutionInvocation(invocation);
    for (const [receiptField, expected] of [
      ["invocationId", invocation.invocationId],
      ["invocationHash", invocationHash],
      ["invocationNonceHash", sha256(Buffer.from(invocation.invocationNonce, "utf8"))],
      ["invokerKeyId", invocation.invokerKeyId],
      ["invokerId", invocation.invokerId],
      ["invokedAt", invocation.invokedAt],
      ["expiresAt", invocation.expiresAt],
    ]) {
      if (value[receiptField] !== expected) {
        issues.push(`invocation_receipt_invocation_mismatch:${receiptField}`);
      }
    }
  }
  if (authorityPackage !== undefined) {
    for (const field of [
      "authorityPackageId",
      "authorityPackageHash",
      "requestId",
      "requestHash",
      "verificationReceiptHash",
      "operatorBundleSha256",
      "repositoryHeadSha",
      "repositoryTreeSha",
      "trackedPathsSha256",
      "targetPathAbsenceEvidenceHash",
      "executionPackageHash",
      "selectorPreimageSha256",
      "selectorPostimageSha256",
      "plannedWriteCount",
      "plannedDeleteCount",
    ]) {
      if (value[field] !== authorityPackage[field]) {
        issues.push(`invocation_receipt_authority_mismatch:${field}`);
      }
    }
    try {
      if (canonicalJson(value.targets) !== canonicalJson(authorityPackage.targets)) {
        issues.push("invocation_receipt_authority_mismatch:targets");
      }
    } catch {
      issues.push("invocation_receipt_authority_mismatch:targets");
    }
  }
}

function validateMetricsCutoverExecutionInvocationReceipt(
  value = {},
  { invocation, authorityPackage } = {},
) {
  const issues = validateReceiptShape(value);
  if (
    issues.length === 0 &&
    value.receiptId !== recomputeMetricsCutoverExecutionInvocationReceiptId(value)
  ) {
    issues.push("invocation_receipt_id_mismatch");
  }
  if (issues.length === 0) {
    const expectedHash = hashMetricsCutoverExecutionInvocationReceipt(value);
    if (value.receiptHash !== expectedHash) {
      issues.push("invocation_receipt_hash_mismatch");
    }
  }
  if (invocation !== undefined || authorityPackage !== undefined) {
    try {
      validateReceiptBinding(value, invocation, authorityPackage, issues);
    } catch {
      issues.push("invocation_receipt_binding_recomputation_failed");
    }
  }
  return { ok: issues.length === 0, issues: uniqueSorted(issues) };
}

function buildMetricsCutoverExecutionInvocationReceipt(
  invocation,
  authorityPackage,
) {
  const invocationValidation = validateMetricsCutoverExecutionInvocation(
    invocation,
    { authorityPackage },
  );
  const authorityValidation =
    validateMetricsCutoverExecutionAuthorityPackage(authorityPackage);
  if (!invocationValidation.ok || !authorityValidation.ok) {
    throw new TypeError("invocation_receipt_source_invalid");
  }
  const value = {
    contractVersion: EXECUTION_INVOCATION_RECEIPT_CONTRACT_VERSION,
    receiptId: "",
    receiptStatus: INVOCATION_RECEIPT_STATUS,
    invocationId: invocation.invocationId,
    invocationHash: hashMetricsCutoverExecutionInvocation(invocation),
    authorityPackageId: authorityPackage.authorityPackageId,
    authorityPackageHash: authorityPackage.authorityPackageHash,
    requestId: authorityPackage.requestId,
    requestHash: authorityPackage.requestHash,
    verificationReceiptHash: authorityPackage.verificationReceiptHash,
    operatorBundleSha256: authorityPackage.operatorBundleSha256,
    repositoryHeadSha: authorityPackage.repositoryHeadSha,
    repositoryTreeSha: authorityPackage.repositoryTreeSha,
    trackedPathsSha256: authorityPackage.trackedPathsSha256,
    targetPathAbsenceEvidenceHash:
      authorityPackage.targetPathAbsenceEvidenceHash,
    executionPackageHash: authorityPackage.executionPackageHash,
    selectorPreimageSha256: authorityPackage.selectorPreimageSha256,
    selectorPostimageSha256: authorityPackage.selectorPostimageSha256,
    invocationNonceHash: sha256(
      Buffer.from(invocation.invocationNonce, "utf8"),
    ),
    invokerKeyId: invocation.invokerKeyId,
    invokerId: invocation.invokerId,
    invokedAt: invocation.invokedAt,
    expiresAt: invocation.expiresAt,
    targets: authorityPackage.targets.map((target) => ({ ...target })),
    plannedWriteCount: authorityPackage.plannedWriteCount,
    plannedDeleteCount: authorityPackage.plannedDeleteCount,
    receiptRequirements: { ...INVOCATION_RECEIPT_REQUIREMENTS },
    receiptHash: "0".repeat(64),
  };
  value.receiptId = recomputeMetricsCutoverExecutionInvocationReceiptId(value);
  value.receiptHash = hashMetricsCutoverExecutionInvocationReceipt(value);
  const validation = validateMetricsCutoverExecutionInvocationReceipt(value, {
    invocation,
    authorityPackage,
  });
  if (!validation.ok) throw new TypeError("invocation_receipt_invalid");
  return value;
}

function compareObservations(reference, candidate, kind, label) {
  const issues = [];
  if (!reference?.ok) issues.push(`${kind}_outer_observation_invalid`);
  if (!candidate?.ok) issues.push(`${kind}_consumed_observation_invalid:${label}`);
  if (issues.length > 0) return issues;
  if (reference.canonicalInputPath !== candidate.canonicalInputPath) {
    issues.push(`${kind}_consumed_canonical_path_mismatch:${label}`);
  }
  if (reference.byteSize !== candidate.byteSize) {
    issues.push(`${kind}_consumed_byte_size_mismatch:${label}`);
  }
  if (reference.sha256 !== candidate.sha256) {
    issues.push(`${kind}_consumed_sha256_mismatch:${label}`);
  }
  if (
    !Buffer.isBuffer(reference.bytes) ||
    !Buffer.isBuffer(candidate.bytes) ||
    !reference.bytes.equals(candidate.bytes)
  ) {
    issues.push(`${kind}_consumed_bytes_mismatch:${label}`);
  }
  if (reference.fileIdentitySupported !== candidate.fileIdentitySupported) {
    issues.push(`${kind}_consumed_identity_support_mismatch:${label}`);
  } else if (
    reference.fileIdentitySupported === true &&
    reference.fileIdentity !== candidate.fileIdentity
  ) {
    issues.push(`${kind}_consumed_file_identity_mismatch:${label}`);
  }
  return uniqueSorted(issues);
}

function validateAuthorityResult(result, label) {
  const issues = [];
  if (!isRecord(result)) return [`step114_2v_${label}_not_object`];
  for (const [field, expected] of Object.entries({
    contractVersion: AUTHORITY_SUMMARY_CONTRACT_VERSION,
    status: "authority_package_ready",
    ok: true,
    authorityPackageReady: true,
    approvalResponseVerified: true,
    signatureVerified: true,
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
  })) {
    if (result[field] !== expected) {
      issues.push(`step114_2v_${label}_invalid:${field}`);
    }
  }
  if (!Array.isArray(result.blockingIssues) || result.blockingIssues.length > 0) {
    issues.push(`step114_2v_${label}_blocking_issues_invalid`);
  }
  if (!Array.isArray(result.warningIssues)) {
    issues.push(`step114_2v_${label}_warning_issues_invalid`);
  }
  for (const field of STEP114_2V_FIXED_FALSE_FIELDS) {
    if (result[field] !== false) {
      issues.push(`step114_2v_${label}_fixed_false_invalid:${field}`);
    }
  }
  const validation =
    validateMetricsCutoverExecutionAuthorityPackage(result.authorityPackage);
  if (!validation.ok) {
    issues.push(
      ...validation.issues.map((issue) => `step114_2v_${label}:${issue}`),
    );
  } else {
    const authority = result.authorityPackage;
    for (const [outerField, authorityField] of [
      ["authorityPackageId", "authorityPackageId"],
      ["authorityPackageHash", "authorityPackageHash"],
      ["verificationReceiptHash", "verificationReceiptHash"],
      ["requestId", "requestId"],
      ["requestHash", "requestHash"],
      ["executionPackageHash", "executionPackageHash"],
      ["repositoryHeadSha", "repositoryHeadSha"],
      ["repositoryTreeSha", "repositoryTreeSha"],
      ["branchName", "branchName"],
    ]) {
      if (result[outerField] !== authority[authorityField]) {
        issues.push(`step114_2v_${label}_outer_identity_mismatch:${outerField}`);
      }
    }
  }
  return uniqueSorted(issues);
}

function newAuthorityCapture() {
  return { bundle: [], response: [], allowlist: [], verifications: [] };
}

function validateAuthorityCapture(label, capture, outer) {
  const issues = [];
  const expected = { bundle: 22, response: 6, allowlist: 6 };
  for (const kind of ["bundle", "response", "allowlist"]) {
    if (capture[kind].length !== expected[kind]) {
      issues.push(`authority_consumed_observation_count_invalid:${label}:${kind}`);
      continue;
    }
    capture[kind].forEach((observation, index) => {
      issues.push(
        ...compareObservations(
          outer[kind],
          observation,
          kind,
          `${label}_${index}`,
        ),
      );
    });
  }
  if (capture.verifications.length !== 2) {
    issues.push(`authority_verification_capture_count_invalid:${label}`);
  }
  return uniqueSorted(issues);
}

function compareAuthorities(left, right) {
  const issues = [];
  try {
    const leftCanonical = canonicalizeMetricsCutoverExecutionAuthorityPackage(
      left.authorityPackage,
    );
    const rightCanonical = canonicalizeMetricsCutoverExecutionAuthorityPackage(
      right.authorityPackage,
    );
    if (leftCanonical !== rightCanonical) {
      issues.push("step114_2v_authority_package_changed");
    }
  } catch {
    issues.push("step114_2v_authority_package_comparison_failed");
  }
  for (const field of [
    "authorityPackageId",
    "authorityPackageHash",
    "verificationReceiptHash",
    "requestId",
    "requestHash",
    "executionPackageHash",
    "repositoryHeadSha",
    "repositoryTreeSha",
    "branchName",
    "targetFileCount",
    "plannedWriteCount",
    "plannedDeleteCount",
  ]) {
    if (left[field] !== right[field]) {
      issues.push(`step114_2v_summary_changed:${field}`);
    }
  }
  return uniqueSorted(issues);
}

function collectPriorSignerIdentities(bundle, captures, issues) {
  const keyIds = new Set();
  const signerIds = new Set();
  for (const receiptName of [
    "productionApprovalReceipt",
    "appExportApprovalReceipt",
  ]) {
    const receipt = bundle?.finalApprovalInput?.[receiptName];
    if (!isSafeIdentity(receipt?.signerKeyId) || !isSafeIdentity(receipt?.signerId)) {
      issues.push(`prior_signer_identity_invalid:${receiptName}`);
      continue;
    }
    keyIds.add(receipt.signerKeyId);
    signerIds.add(receipt.signerId);
  }
  const verifications = captures.flatMap((capture) => capture.verifications);
  let expectedKeyId = null;
  let expectedSignerId = null;
  for (const verification of verifications) {
    if (
      !isSafeIdentity(verification?.signerKeyId) ||
      !isSafeIdentity(verification?.signerId)
    ) {
      issues.push("execution_approver_identity_invalid");
      continue;
    }
    if (expectedKeyId === null) {
      expectedKeyId = verification.signerKeyId;
      expectedSignerId = verification.signerId;
    } else if (
      expectedKeyId !== verification.signerKeyId ||
      expectedSignerId !== verification.signerId
    ) {
      issues.push("execution_approver_identity_changed");
    }
    keyIds.add(verification.signerKeyId);
    signerIds.add(verification.signerId);
  }
  return { keyIds, signerIds };
}

function safeResult(status, fields = {}, issues = [], warnings = []) {
  const ready = status === "execution_invocation_verified";
  return {
    ok: ready,
    status,
    contractVersion: EXECUTION_INVOCATION_SUMMARY_CONTRACT_VERSION,
    policyVersion: EXECUTION_INVOCATION_POLICY_VERSION,
    executionInvocationVerified: ready,
    signatureVerified: ready,
    singleUseReceiptReady: ready,
    invocationReceipt:
      ready && isRecord(fields.invocationReceipt)
        ? structuredClone(fields.invocationReceipt)
        : {},
    receiptId: ready ? fields.receiptId || "" : "",
    receiptHash: ready ? fields.receiptHash || "" : "",
    invocationId: ready ? fields.invocationId || "" : "",
    invocationHash: ready ? fields.invocationHash || "" : "",
    authorityPackageId: ready ? fields.authorityPackageId || "" : "",
    authorityPackageHash: ready ? fields.authorityPackageHash || "" : "",
    verificationReceiptHash:
      ready ? fields.verificationReceiptHash || "" : "",
    requestId: ready ? fields.requestId || "" : "",
    requestHash: ready ? fields.requestHash || "" : "",
    operatorBundleSha256: ready ? fields.operatorBundleSha256 || "" : "",
    repositoryHeadSha: ready ? fields.repositoryHeadSha || "" : "",
    repositoryTreeSha: ready ? fields.repositoryTreeSha || "" : "",
    branchName: ready ? fields.branchName || "" : "",
    trackedPathsSha256: ready ? fields.trackedPathsSha256 || "" : "",
    targetPathAbsenceEvidenceHash:
      ready ? fields.targetPathAbsenceEvidenceHash || "" : "",
    executionPackageHash: ready ? fields.executionPackageHash || "" : "",
    selectorPreimageSha256:
      ready ? fields.selectorPreimageSha256 || "" : "",
    selectorPostimageSha256:
      ready ? fields.selectorPostimageSha256 || "" : "",
    invokerKeyId: ready ? fields.invokerKeyId || "" : "",
    invokerId: ready ? fields.invokerId || "" : "",
    invokedAt: ready ? fields.invokedAt || "" : "",
    expiresAt: ready ? fields.expiresAt || "" : "",
    targetFileCount:
      ready && Number.isInteger(fields.targetFileCount)
        ? fields.targetFileCount
        : 0,
    plannedWriteCount:
      ready && Number.isInteger(fields.plannedWriteCount)
        ? fields.plannedWriteCount
        : 0,
    plannedDeleteCount:
      ready && Number.isInteger(fields.plannedDeleteCount)
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

async function runMetricsCutoverExecutionInvocationVerification(
  input = {},
  adapters = {},
) {
  if (!isRecord(input) || Object.keys(input).length === 0) {
    return safeResult("idle", {}, [
      "metrics_cutover_execution_invocation_input_missing",
    ]);
  }
  const inputFields = [
    "repo",
    "inputPath",
    "responsePath",
    "allowlistPath",
    "invocationPath",
    "invokerAllowlistPath",
  ];
  if (
    !hasExactKeys(input, inputFields) ||
    inputFields.some((field) => !isNonEmptyString(input[field]))
  ) {
    return safeResult("blocked", {}, [
      "metrics_cutover_execution_invocation_invocation_invalid",
    ]);
  }

  const observeBundle =
    adapters.observeBundle || readMetricsCutoverPostMergeBundleObservation;
  const observeResponse =
    adapters.observeResponse ||
    readMetricsCutoverExecutionApprovalResponseObservation;
  const observeApproverAllowlist =
    adapters.observeApproverAllowlist ||
    readMetricsCutoverExecutionApproverAllowlistObservation;
  const observeInvocation =
    adapters.observeInvocation ||
    readMetricsCutoverExecutionInvocationObservation;
  const observeInvokerAllowlist =
    adapters.observeInvokerAllowlist ||
    readMetricsCutoverExecutionInvokerAllowlistObservation;
  const runAuthority =
    adapters.runAuthority || runMetricsCutoverExecutionAuthorityPackage;
  const runVerification =
    adapters.runVerification ||
    runMetricsCutoverExecutionApprovalResponseVerification;

  const outerA = {
    bundle: await observeBundle(input.inputPath),
    response: await observeResponse(input.responsePath),
    allowlist: await observeApproverAllowlist(input.allowlistPath),
    invocation: await observeInvocation(input.invocationPath),
    invokerAllowlist: await observeInvokerAllowlist(
      input.invokerAllowlistPath,
    ),
  };
  const initialIssues = [];
  for (const [kind, observation] of Object.entries(outerA)) {
    if (!observation?.ok) {
      initialIssues.push(
        ...(observation?.blockingIssues || [`${kind}_outer_a_failed`]),
      );
    }
  }
  if (initialIssues.length > 0) {
    return safeResult("blocked", {}, initialIssues);
  }

  const captures = {};
  const createCapturingReader = (label, kind, reader) => async (filePath) => {
    const observation = await reader(filePath);
    captures[label][kind].push(observation);
    return observation;
  };
  const runCapturedAuthority = async (label) => {
    captures[label] = newAuthorityCapture();
    return runAuthority(
      {
        repo: input.repo,
        inputPath: input.inputPath,
        responsePath: input.responsePath,
        allowlistPath: input.allowlistPath,
      },
      {
        observeBundle: createCapturingReader(label, "bundle", observeBundle),
        observeResponse: createCapturingReader(
          label,
          "response",
          observeResponse,
        ),
        observeAllowlist: createCapturingReader(
          label,
          "allowlist",
          observeApproverAllowlist,
        ),
        runVerification: async (verificationInput, verificationAdapters) => {
          const result = await runVerification(
            verificationInput,
            verificationAdapters,
          );
          captures[label].verifications.push(result);
          return result;
        },
      },
    );
  };

  const issues = [];
  const authorityA = await runCapturedAuthority("authority_a");
  issues.push(...validateAuthorityResult(authorityA, "a"));
  issues.push(
    ...validateAuthorityCapture("authority_a", captures.authority_a, outerA),
  );
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  const consumedInvocation = await observeInvocation(input.invocationPath);
  const consumedInvokerAllowlist = await observeInvokerAllowlist(
    input.invokerAllowlistPath,
  );
  issues.push(
    ...compareObservations(
      outerA.invocation,
      consumedInvocation,
      "invocation",
      "consumed",
    ),
    ...compareObservations(
      outerA.invokerAllowlist,
      consumedInvokerAllowlist,
      "invoker_allowlist",
      "consumed",
    ),
  );
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  const authorityPackage = authorityA.authorityPackage;
  const invocation = consumedInvocation.value;
  const evaluationNow = outerA.bundle?.bundle?.evaluationNow;
  const invocationValidation = validateMetricsCutoverExecutionInvocation(
    invocation,
    { authorityPackage, evaluationNow },
  );
  issues.push(...invocationValidation.issues);
  const normalizedAllowlist =
    normalizeMetricsCutoverExecutionInvokerAllowlist(
      consumedInvokerAllowlist.value,
    );
  issues.push(...normalizedAllowlist.issues);
  const priorSigners = collectPriorSignerIdentities(
    outerA.bundle.bundle,
    [captures.authority_a],
    issues,
  );
  if (priorSigners.keyIds.has(invocation.invokerKeyId)) {
    issues.push("execution_invoker_key_id_reused");
  }
  if (priorSigners.signerIds.has(invocation.invokerId)) {
    issues.push("execution_invoker_id_reused");
  }
  const keyMatches = normalizedAllowlist.entries.filter(
    (entry) => entry.invokerKeyId === invocation.invokerKeyId,
  );
  const idMatches = normalizedAllowlist.entries.filter(
    (entry) => entry.invokerId === invocation.invokerId,
  );
  let matchedEntry = null;
  if (
    keyMatches.length !== 1 ||
    idMatches.length !== 1 ||
    keyMatches[0] !== idMatches[0]
  ) {
    issues.push("execution_invoker_resolution_failed");
  } else {
    matchedEntry = keyMatches[0];
  }
  if (issues.length === 0 && matchedEntry) {
    const signature = decodeCanonicalBase64(invocation.signatureBase64);
    let verified = false;
    try {
      verified = verifySignature(
        null,
        buildMetricsCutoverExecutionInvocationSignaturePayload(invocation),
        matchedEntry.publicKey,
        signature,
      );
    } catch {
      verified = false;
    }
    if (!verified) issues.push("execution_invocation_signature_verification_failed");
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  const authorityB = await runCapturedAuthority("authority_b");
  issues.push(...validateAuthorityResult(authorityB, "b"));
  issues.push(
    ...validateAuthorityCapture("authority_b", captures.authority_b, outerA),
  );
  issues.push(...compareAuthorities(authorityA, authorityB));
  collectPriorSignerIdentities(
    outerA.bundle.bundle,
    [captures.authority_a, captures.authority_b],
    issues,
  );
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  const outerB = {
    bundle: await observeBundle(input.inputPath),
    response: await observeResponse(input.responsePath),
    allowlist: await observeApproverAllowlist(input.allowlistPath),
    invocation: await observeInvocation(input.invocationPath),
    invokerAllowlist: await observeInvokerAllowlist(
      input.invokerAllowlistPath,
    ),
  };
  for (const kind of [
    "bundle",
    "response",
    "allowlist",
    "invocation",
    "invokerAllowlist",
  ]) {
    issues.push(
      ...compareObservations(outerA[kind], outerB[kind], kind, "outer_a_b"),
    );
  }
  for (const [label, capture] of Object.entries(captures)) {
    for (const kind of ["bundle", "response", "allowlist"]) {
      capture[kind].forEach((observation, index) => {
        issues.push(
          ...compareObservations(
            outerB[kind],
            observation,
            kind,
            `${label}_${index}_outer_b`,
          ),
        );
      });
    }
  }
  issues.push(
    ...compareObservations(
      outerB.invocation,
      consumedInvocation,
      "invocation",
      "consumed_outer_b",
    ),
    ...compareObservations(
      outerB.invokerAllowlist,
      consumedInvokerAllowlist,
      "invoker_allowlist",
      "consumed_outer_b",
    ),
  );
  if (issues.length > 0) return safeResult("blocked", {}, issues);

  let receipt;
  try {
    receipt = buildMetricsCutoverExecutionInvocationReceipt(
      invocation,
      authorityPackage,
    );
  } catch {
    return safeResult("blocked", {}, ["invocation_receipt_construction_failed"]);
  }
  const receiptValidation = validateMetricsCutoverExecutionInvocationReceipt(
    receipt,
    { invocation, authorityPackage },
  );
  if (!receiptValidation.ok) {
    return safeResult("blocked", {}, receiptValidation.issues);
  }

  return safeResult(
    "execution_invocation_verified",
    {
      invocationReceipt: receipt,
      receiptId: receipt.receiptId,
      receiptHash: receipt.receiptHash,
      invocationId: invocation.invocationId,
      invocationHash: receipt.invocationHash,
      authorityPackageId: authorityPackage.authorityPackageId,
      authorityPackageHash: authorityPackage.authorityPackageHash,
      verificationReceiptHash: authorityPackage.verificationReceiptHash,
      requestId: authorityPackage.requestId,
      requestHash: authorityPackage.requestHash,
      operatorBundleSha256: authorityPackage.operatorBundleSha256,
      repositoryHeadSha: authorityPackage.repositoryHeadSha,
      repositoryTreeSha: authorityPackage.repositoryTreeSha,
      branchName: authorityPackage.branchName,
      trackedPathsSha256: authorityPackage.trackedPathsSha256,
      targetPathAbsenceEvidenceHash:
        authorityPackage.targetPathAbsenceEvidenceHash,
      executionPackageHash: authorityPackage.executionPackageHash,
      selectorPreimageSha256: authorityPackage.selectorPreimageSha256,
      selectorPostimageSha256: authorityPackage.selectorPostimageSha256,
      invokerKeyId: invocation.invokerKeyId,
      invokerId: invocation.invokerId,
      invokedAt: invocation.invokedAt,
      expiresAt: invocation.expiresAt,
      targetFileCount: authorityPackage.targets.length,
      plannedWriteCount: authorityPackage.plannedWriteCount,
      plannedDeleteCount: authorityPackage.plannedDeleteCount,
    },
    [],
    [...(authorityA.warningIssues || []), ...(authorityB.warningIssues || [])],
  );
}

module.exports = {
  EXECUTION_INVOCATION_CONTRACT_VERSION,
  EXECUTION_INVOCATION_ID_DOMAIN,
  EXECUTION_INVOCATION_POLICY_VERSION,
  EXECUTION_INVOCATION_RECEIPT_CONTRACT_VERSION,
  EXECUTION_INVOCATION_RECEIPT_HASH_DOMAIN,
  EXECUTION_INVOCATION_RECEIPT_ID_DOMAIN,
  EXECUTION_INVOCATION_SIGNATURE_DOMAIN,
  EXECUTION_INVOCATION_STATUS,
  EXECUTION_INVOCATION_SUMMARY_CONTRACT_VERSION,
  EXECUTION_INVOKER_ALLOWLIST_CONTRACT_VERSION,
  EXECUTION_INVOKER_ROLE,
  EXECUTION_SCOPE,
  FIXED_FALSE_FIELDS,
  INVOCATION_ATTESTATIONS,
  INVOCATION_ATTESTATION_FIELDS,
  INVOCATION_FIELDS,
  INVOCATION_RECEIPT_FIELDS,
  INVOCATION_RECEIPT_STATUS,
  INVOCATION_RECEIPT_REQUIREMENTS,
  INVOKER_ALLOWLIST_ENTRY_FIELDS,
  INVOKER_ALLOWLIST_FIELDS,
  MAX_FUTURE_SKEW_MS,
  MAX_INVOCATION_AGE_MS,
  MAX_INVOCATION_BYTES,
  MAX_INVOCATION_LIFETIME_MS,
  MAX_INVOKER_ALLOWLIST_BYTES,
  SIGNATURE_ALGORITHM,
  buildMetricsCutoverExecutionInvocationReceipt,
  buildMetricsCutoverExecutionInvocationSignaturePayload,
  canonicalizeMetricsCutoverExecutionInvocation,
  canonicalizeMetricsCutoverExecutionInvocationReceipt,
  hashMetricsCutoverExecutionInvocation,
  hashMetricsCutoverExecutionInvocationReceipt,
  normalizeMetricsCutoverExecutionInvokerAllowlist,
  readMetricsCutoverExecutionInvocationObservation,
  readMetricsCutoverExecutionInvokerAllowlistObservation,
  recomputeMetricsCutoverExecutionInvocationId,
  recomputeMetricsCutoverExecutionInvocationReceiptId,
  runMetricsCutoverExecutionInvocationVerification,
  safeResult,
  validateMetricsCutoverExecutionInvocation,
  validateMetricsCutoverExecutionInvocationReceipt,
};
