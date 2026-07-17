const {
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
} = require("node:fs");
const { createHash } = require("node:crypto");
const path = require("node:path");
const { TextDecoder } = require("node:util");

const INPUT_CONTRACT_VERSION =
  "metrics-cutover-post-merge-dry-run-input-v1-step114-2s";
const MAX_INPUT_BYTES = 64 * 1024 * 1024;
const TOP_LEVEL_FIELDS = Object.freeze([
  "contractVersion",
  "expectedRepositoryHeadSha",
  "requiredBranchName",
  "evaluationNow",
  "finalApprovalInput",
  "finalApprovalOptions",
]);
const SENSITIVE_FIELDS = new Set([
  "privatekey",
  "privatekeypem",
  "clientsecret",
  "apisecret",
  "appsecret",
  "apikey",
  "accesstoken",
  "refreshtoken",
  "token",
  "secret",
  "password",
  "credentials",
  "credential",
  "command",
  "commands",
  "shell",
  "executablecommand",
]);
const SHORTCUT_FIELDS = new Set([
  "dryrunready",
  "cutoverrehearsalready",
  "executionpackageready",
  "filewriteauthorized",
  "commitauthorized",
  "pushauthorized",
  "mergeauthorized",
  "deploymentauthorized",
  "productionpublicationauthorized",
  "appexportactivated",
  "pointermutationexecuted",
  "rollbackexecuted",
  "loaderactivated",
]);
const decoder = new TextDecoder("utf-8", { fatal: true });

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableFileIdentity(stat) {
  if (
    typeof stat?.dev === "bigint" &&
    stat.dev >= 0n &&
    typeof stat?.ino === "bigint" &&
    stat.ino > 0n
  ) {
    return {
      supported: true,
      value: `${stat.dev}:${stat.ino}`,
    };
  }
  if (
    Number.isSafeInteger(stat?.dev) &&
    stat.dev >= 0 &&
    Number.isSafeInteger(stat?.ino) &&
    stat.ino > 0
  ) {
    return {
      supported: true,
      value: `${stat.dev}:${stat.ino}`,
    };
  }
  return { supported: false, value: "" };
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

function failedObservation(blockingIssues) {
  return {
    ok: false,
    bundle: null,
    blockingIssues: uniqueSorted(blockingIssues),
  };
}

function normalizeFieldName(value) {
  return typeof value === "string"
    ? value
        .normalize("NFC")
        .toLocaleLowerCase("en-US")
        .replace(/[_\-.\u0020]/g, "")
    : "";
}

function parseIsoInstant(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  ) {
    return null;
  }
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? new Date(milliseconds) : null;
}

function isValidNamedBranch(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    !value.startsWith("-") &&
    !value.startsWith(".") &&
    !value.endsWith(".") &&
    !value.endsWith("/") &&
    !value.endsWith(".lock") &&
    !value.includes("..") &&
    !value.includes("@{") &&
    !value.includes("//") &&
    !/[\0-\x20\x7f~^:?*[\]\\]/.test(value)
  );
}

function readJsonStringToken(text, offset) {
  if (text[offset] !== '"') return null;
  let escaped = false;
  for (let index = offset + 1; index < text.length; index += 1) {
    const char = text[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      const token = text.slice(offset, index + 1);
      try {
        return { value: JSON.parse(token), end: index + 1 };
      } catch {
        return null;
      }
    }
  }
  return null;
}

function topLevelJsonKeys(text) {
  const keys = [];
  let index = 0;
  const skipWhitespace = () => {
    while (index < text.length && /\s/.test(text[index])) index += 1;
  };
  skipWhitespace();
  if (text[index] !== "{") return keys;
  index += 1;
  while (index < text.length) {
    skipWhitespace();
    if (text[index] === "}") return keys;
    const keyToken = readJsonStringToken(text, index);
    if (!keyToken) return keys;
    keys.push(keyToken.value);
    index = keyToken.end;
    skipWhitespace();
    if (text[index] !== ":") return keys;
    index += 1;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (; index < text.length; index += 1) {
      const char = text[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }
      if (char === '"') {
        inString = true;
      } else if (char === "{" || char === "[") {
        depth += 1;
      } else if (char === "}" || char === "]") {
        if (char === "}" && depth === 0) return keys;
        depth -= 1;
      } else if (char === "," && depth === 0) {
        index += 1;
        break;
      }
    }
  }
  return keys;
}

function collectForbiddenFields(value, issues) {
  const visit = (current) => {
    if (typeof current === "string") {
      const trimmed = current.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          visit(JSON.parse(trimmed));
        } catch {
          // String fields that are not valid embedded JSON remain opaque.
        }
      }
      return;
    }
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (!isPlainObject(current)) return;
    for (const [key, nested] of Object.entries(current)) {
      const normalized = normalizeFieldName(key);
      if (SENSITIVE_FIELDS.has(normalized)) {
        issues.push(`operator_bundle_sensitive_field_forbidden:${key}`);
      }
      if (SHORTCUT_FIELDS.has(normalized)) {
        issues.push(`operator_bundle_shortcut_field_forbidden:${key}`);
      }
      visit(nested);
    }
  };
  visit(value);
}

function validateBundle(bundle, topLevelKeys) {
  const issues = [];
  if (!isPlainObject(bundle)) {
    return ["operator_bundle_not_object"];
  }
  const seen = new Set();
  for (const key of topLevelKeys) {
    if (seen.has(key)) issues.push(`operator_bundle_duplicate_key:${key}`);
    seen.add(key);
  }
  const actualKeys = Object.keys(bundle).sort();
  const expectedKeys = [...TOP_LEVEL_FIELDS].sort();
  for (const key of expectedKeys) {
    if (!Object.hasOwn(bundle, key)) {
      issues.push(`operator_bundle_required_field_missing:${key}`);
    }
  }
  for (const key of actualKeys) {
    if (!TOP_LEVEL_FIELDS.includes(key)) {
      issues.push(`operator_bundle_unexpected_field:${key}`);
    }
  }
  if (bundle.contractVersion !== INPUT_CONTRACT_VERSION) {
    issues.push("operator_bundle_contract_version_mismatch");
  }
  if (
    typeof bundle.expectedRepositoryHeadSha !== "string" ||
    !/^[a-f0-9]{40}$/.test(bundle.expectedRepositoryHeadSha)
  ) {
    issues.push("operator_bundle_expected_repository_head_invalid");
  }
  if (!isValidNamedBranch(bundle.requiredBranchName)) {
    issues.push("operator_bundle_required_branch_invalid");
  }
  const evaluationInstant = parseIsoInstant(bundle.evaluationNow);
  if (!evaluationInstant) {
    issues.push("operator_bundle_evaluation_now_invalid");
  }
  if (!isPlainObject(bundle.finalApprovalInput)) {
    issues.push("operator_bundle_final_approval_input_not_object");
  }
  if (!isPlainObject(bundle.finalApprovalOptions)) {
    issues.push("operator_bundle_final_approval_options_not_object");
  }
  if (
    evaluationInstant &&
    isPlainObject(bundle.finalApprovalOptions) &&
    Object.hasOwn(bundle.finalApprovalOptions, "now")
  ) {
    const optionInstant = parseIsoInstant(bundle.finalApprovalOptions.now);
    if (
      !optionInstant ||
      optionInstant.getTime() !== evaluationInstant.getTime()
    ) {
      issues.push("operator_bundle_final_approval_now_conflict");
    }
  }
  const eligibilityEvaluatedAt = parseIsoInstant(
    bundle.finalApprovalInput?.eligibilityEvaluatedAt,
  );
  const eligibilityOptions = bundle.finalApprovalOptions?.eligibilityOptions;
  if (
    isPlainObject(eligibilityOptions) &&
    Object.hasOwn(eligibilityOptions, "now")
  ) {
    const eligibilityOptionInstant = parseIsoInstant(eligibilityOptions.now);
    if (!eligibilityOptionInstant) {
      issues.push("operator_bundle_eligibility_options_now_invalid");
    } else if (
      !eligibilityEvaluatedAt ||
      eligibilityOptionInstant.getTime() !== eligibilityEvaluatedAt.getTime()
    ) {
      issues.push("operator_bundle_eligibility_options_now_conflict");
    }
  }
  collectForbiddenFields(bundle, issues);
  return uniqueSorted(issues);
}

function parseMetricsCutoverPostMergeBundleBytes(bytes) {
  let text;
  try {
    text = decoder.decode(bytes);
  } catch {
    return {
      ok: false,
      bundle: null,
      blockingIssues: ["operator_bundle_invalid_utf8"],
    };
  }
  const topLevelKeys = topLevelJsonKeys(text);
  let bundle;
  try {
    bundle = JSON.parse(text);
  } catch {
    return {
      ok: false,
      bundle: null,
      blockingIssues: ["operator_bundle_invalid_json"],
    };
  }
  const issues = validateBundle(bundle, topLevelKeys);
  if (issues.length > 0) {
    return { ok: false, bundle: null, blockingIssues: issues };
  }
  const evaluationInstant = parseIsoInstant(bundle.evaluationNow);
  const eligibilityOptions = bundle.finalApprovalOptions.eligibilityOptions;
  const normalizedEligibilityOptions =
    isPlainObject(eligibilityOptions) &&
    Object.hasOwn(eligibilityOptions, "now")
      ? {
          ...eligibilityOptions,
          now: parseIsoInstant(eligibilityOptions.now).toISOString(),
        }
      : eligibilityOptions;
  return {
    ok: true,
    bundle: {
      ...bundle,
      evaluationNow: evaluationInstant.toISOString(),
      finalApprovalOptions: {
        ...bundle.finalApprovalOptions,
        now: evaluationInstant.toISOString(),
        ...(eligibilityOptions === undefined
          ? {}
          : { eligibilityOptions: normalizedEligibilityOptions }),
      },
    },
    blockingIssues: [],
  };
}

function readMetricsCutoverPostMergeBundleObservation(
  inputPath,
  {
    fs = {
      closeSync,
      fstatSync,
      lstatSync,
      openSync,
      readFileSync,
      realpathSync,
    },
    maxInputBytes = MAX_INPUT_BYTES,
  } = {},
) {
  if (typeof inputPath !== "string" || inputPath.length === 0) {
    return failedObservation(["operator_bundle_input_path_missing"]);
  }
  const absolute = path.resolve(inputPath);
  let pathStatBefore;
  let canonicalPathBefore;
  try {
    pathStatBefore = fs.lstatSync(absolute, { bigint: true });
    canonicalPathBefore = fs.realpathSync(absolute);
  } catch (error) {
    return failedObservation([
        error?.code === "ENOENT"
          ? "operator_bundle_input_missing"
          : "operator_bundle_input_inspection_failed",
    ]);
  }
  if (pathStatBefore.isSymbolicLink()) {
    return failedObservation(["operator_bundle_input_symlink"]);
  }
  if (!pathStatBefore.isFile()) {
    return failedObservation(["operator_bundle_input_not_regular_file"]);
  }
  const pathSizeBefore = statByteSize(pathStatBefore);
  if (
    pathSizeBefore === null ||
    pathSizeBefore <= 0 ||
    pathSizeBefore > maxInputBytes
  ) {
    return failedObservation(["operator_bundle_input_size_invalid"]);
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
  if (closeFailed) {
    return failedObservation(["operator_bundle_input_close_failed"]);
  }
  if (readFailed) {
    return failedObservation(["operator_bundle_input_read_failed"]);
  }

  let pathStatAfter;
  let canonicalPathAfter;
  try {
    pathStatAfter = fs.lstatSync(absolute, { bigint: true });
    canonicalPathAfter = fs.realpathSync(absolute);
  } catch {
    return failedObservation([
      "operator_bundle_input_post_read_inspection_failed",
    ]);
  }

  const stabilityIssues = [];
  if (pathStatAfter.isSymbolicLink()) {
    stabilityIssues.push("operator_bundle_input_symlink_during_read");
  }
  if (!pathStatAfter.isFile()) {
    stabilityIssues.push(
      "operator_bundle_input_not_regular_file_during_read",
    );
  }
  if (canonicalPathBefore !== canonicalPathAfter) {
    stabilityIssues.push(
      "operator_bundle_input_canonical_path_changed_during_read",
    );
  }
  const pathIdentityBefore = stableFileIdentity(pathStatBefore);
  const pathIdentityAfter = stableFileIdentity(pathStatAfter);
  const descriptorIdentityBefore = stableFileIdentity(descriptorStatBefore);
  const descriptorIdentityAfter = stableFileIdentity(descriptorStatAfter);
  if (!identitiesEqual(pathIdentityBefore, pathIdentityAfter)) {
    stabilityIssues.push(
      "operator_bundle_input_path_identity_changed_during_read",
    );
  }
  if (!identitiesEqual(descriptorIdentityBefore, descriptorIdentityAfter)) {
    stabilityIssues.push(
      "operator_bundle_input_descriptor_identity_changed_during_read",
    );
  }
  if (
    !identitiesEqual(pathIdentityBefore, descriptorIdentityBefore) ||
    !identitiesEqual(pathIdentityAfter, descriptorIdentityAfter)
  ) {
    stabilityIssues.push(
      "operator_bundle_input_path_descriptor_identity_mismatch",
    );
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
    stabilityIssues.push("operator_bundle_input_size_changed_during_read");
  }
  if (
    !Buffer.isBuffer(bytes) ||
    descriptorSizeAfter === null ||
    bytes.length !== descriptorSizeAfter
  ) {
    stabilityIssues.push("operator_bundle_input_bytes_size_mismatch");
  }
  if (stabilityIssues.length > 0) {
    return failedObservation(stabilityIssues);
  }
  const parsed = parseMetricsCutoverPostMergeBundleBytes(bytes);
  if (!parsed.ok) {
    return {
      ...parsed,
      canonicalInputPath: canonicalPathBefore,
      bytes: Buffer.alloc(0),
      byteSize: 0,
      sha256: "",
      fileIdentity: "",
      fileIdentitySupported: false,
    };
  }
  return {
    ...parsed,
    canonicalInputPath: canonicalPathBefore,
    bytes,
    byteSize: bytes.length,
    sha256: sha256(bytes),
    fileIdentity: descriptorIdentityAfter.value,
    fileIdentitySupported: descriptorIdentityAfter.supported,
  };
}

function readMetricsCutoverPostMergeBundle(inputPath, options = {}) {
  const observation = readMetricsCutoverPostMergeBundleObservation(
    inputPath,
    options,
  );
  return {
    ok: observation.ok,
    bundle: observation.bundle,
    blockingIssues: observation.blockingIssues,
    ...(observation.canonicalInputPath
      ? { canonicalInputPath: observation.canonicalInputPath }
      : {}),
  };
}

module.exports = {
  INPUT_CONTRACT_VERSION,
  MAX_INPUT_BYTES,
  TOP_LEVEL_FIELDS,
  normalizeFieldName,
  parseIsoInstant,
  parseMetricsCutoverPostMergeBundleBytes,
  readMetricsCutoverPostMergeBundle,
  readMetricsCutoverPostMergeBundleObservation,
  stableFileIdentity,
};
