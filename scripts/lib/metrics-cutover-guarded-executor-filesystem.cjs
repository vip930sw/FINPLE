const {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  POST_WRITE_VERIFICATION_CONTRACT_VERSION,
  POST_WRITE_VERIFICATION_HASH_DOMAIN,
  TEST_FIXTURE_CONTRACT_VERSION,
  canonicalJson,
  hasExactKeys,
  hashWithDomain,
  isSafeIdentity,
  sha256,
  targetSummary,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");

const TEST_MARKER_FILE = ".finple-step114-2x-a-test-fixture.json";
const SELECTOR_PATH = "src/data/tickers/screenerCandidateOverlay.js";
const OLD_PRICE_IMPORTS = Object.freeze([
  {
    role: "us_price_metrics",
    importName: "usPriceMetricsOverlayCsv",
    source: "./us_price_metrics_overlay_20260528_app_ready.csv?raw",
  },
  {
    role: "kr_price_metrics",
    importName: "krPriceMetricsOverlayCsv",
    source: "./kr_price_metrics_overlay_20260528_app_ready.csv?raw",
  },
]);
const TEST_MARKER_FIELDS = Object.freeze([
  "contractVersion",
  "fixtureId",
  "testOnly",
]);

function runGit(repo, args) {
  const result = spawnSync("git", args, {
    cwd: repo,
    shell: false,
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`git_command_failed:${args[0] || "unknown"}`);
  }
  return result.stdout.replace(/\r?\n$/, "");
}

function isSafeRepositoryPath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    !/[\0\r\n]/.test(value) &&
    !value.includes("\\") &&
    !value.startsWith("/") &&
    !value.split("/").includes("..")
  );
}

function isSafeTargetPath(value) {
  return (
    isSafeRepositoryPath(value) &&
    value.startsWith("src/data/tickers/") &&
    value.endsWith(".csv")
  );
}

function targetPathIdentity(value) {
  return typeof value === "string"
    ? value.normalize("NFC").toLowerCase()
    : "";
}

function areTargetPathsDistinct(left, right) {
  return (
    isSafeTargetPath(left) &&
    isSafeTargetPath(right) &&
    targetPathIdentity(left) !== targetPathIdentity(right)
  );
}

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return (
    relative !== "" &&
    !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  );
}

function parseMarker(repoRoot) {
  const markerPath = path.join(repoRoot, TEST_MARKER_FILE);
  let value;
  try {
    value = JSON.parse(readFileSync(markerPath, "utf8"));
  } catch {
    return { ok: false, issues: ["test_fixture_marker_invalid"] };
  }
  const issues = [];
  if (!hasExactKeys(value, TEST_MARKER_FIELDS)) {
    issues.push("test_fixture_marker_fields_invalid");
  }
  if (value.contractVersion !== TEST_FIXTURE_CONTRACT_VERSION) {
    issues.push("test_fixture_marker_contract_mismatch");
  }
  if (!isSafeIdentity(value.fixtureId)) {
    issues.push("test_fixture_marker_id_invalid");
  }
  if (value.testOnly !== true) issues.push("test_fixture_marker_not_test_only");
  return { ok: issues.length === 0, marker: value, issues };
}

function validateTestEnvironment(repo, claimDirectory, implementationRoot) {
  const issues = [];
  let repoRoot = "";
  let claimRoot = "";
  try {
    repoRoot = realpathSync(repo);
    claimRoot = realpathSync(claimDirectory);
  } catch {
    return { ok: false, issues: ["test_environment_path_invalid"] };
  }
  let implementationReal = implementationRoot;
  try {
    implementationReal = realpathSync(implementationRoot);
  } catch {
    // The module may be copied into a standalone test harness.
  }
  if (repoRoot === implementationReal) {
    issues.push("real_checkout_execution_prohibited");
  }
  if (claimRoot === repoRoot || isPathInside(repoRoot, claimRoot)) {
    issues.push("claim_directory_inside_repository");
  }
  const markerResult = parseMarker(repoRoot);
  issues.push(...markerResult.issues);
  let branchName = "";
  let statusLines = [];
  try {
    branchName = runGit(repoRoot, ["branch", "--show-current"]);
    statusLines = runGit(repoRoot, [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
    ])
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    issues.push("test_repository_git_state_invalid");
  }
  if (!branchName.startsWith("test/step114-2x-a-") || branchName === "main") {
    issues.push("test_repository_branch_invalid");
  }
  if (statusLines.length > 0) issues.push("test_repository_not_clean");
  return {
    ok: issues.length === 0,
    repoRoot,
    claimRoot,
    branchName,
    marker: markerResult.marker,
    issues: uniqueSorted(issues),
  };
}

function currentTrackedPathsSha256(repoRoot) {
  const trackedPaths = runGit(repoRoot, ["ls-files"])
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();
  return sha256(Buffer.from(trackedPaths.join("\0"), "utf8"));
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function claimPathFor(claimRoot, claim) {
  return path.join(claimRoot, `${claim.claimId}.json`);
}

function writeClaimExclusive(claimRoot, claim) {
  const claimPath = claimPathFor(claimRoot, claim);
  writeFileSync(claimPath, serializeJson(claim), {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
  return claimPath;
}

function replaceClaim(claimPath, claim) {
  const tempPath = `${claimPath}.tmp`;
  try {
    writeFileSync(tempPath, serializeJson(claim), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    renameSync(tempPath, claimPath);
  } finally {
    if (existsSync(tempPath)) unlinkSync(tempPath);
  }
}

function countCsvDataRows(bytes) {
  const text = bytes.toString("utf8");
  let inQuotes = false;
  let records = 0;
  let hasContent = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      hasContent = true;
      continue;
    }
    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      if (hasContent) records += 1;
      hasContent = false;
      continue;
    }
    if (!/\s/.test(char) || inQuotes) hasContent = true;
  }
  if (inQuotes) throw new TypeError("csv_unterminated_quote");
  if (hasContent) records += 1;
  return Math.max(0, records - 1);
}

function assertRegularNonSymlink(filePath, issuePrefix, issues) {
  try {
    const stat = lstatSync(filePath);
    if (stat.isSymbolicLink()) issues.push(`${issuePrefix}_symlink`);
    if (!stat.isFile()) issues.push(`${issuePrefix}_not_regular_file`);
  } catch {
    issues.push(`${issuePrefix}_missing`);
  }
}

function ensureContainedPath(repoRoot, repositoryPath, issuePrefix, issues) {
  const absolutePath = path.resolve(repoRoot, ...repositoryPath.split("/"));
  const parent = path.dirname(absolutePath);
  let realParent = "";
  try {
    realParent = realpathSync(parent);
  } catch {
    issues.push(`${issuePrefix}_parent_invalid`);
    return "";
  }
  if (!isPathInside(repoRoot, absolutePath) || !isPathInside(repoRoot, realParent)) {
    issues.push(`${issuePrefix}_outside_repository`);
    return "";
  }
  return absolutePath;
}

function validateSelectorTransformation(bound, issues) {
  if (!bound.preimageBytes || !bound.postimageBytes) {
    issues.push("selector_transformation_bytes_missing");
    return;
  }
  const preimage = bound.preimageBytes.toString("utf8");
  const postimage = bound.postimageBytes.toString("utf8");
  if (!Buffer.from(preimage, "utf8").equals(bound.preimageBytes)) {
    issues.push("selector_preimage_utf8_invalid");
    return;
  }
  if (!Buffer.from(postimage, "utf8").equals(bound.postimageBytes)) {
    issues.push("selector_postimage_utf8_invalid");
    return;
  }
  let expectedPostimage = preimage;
  for (const oldImport of OLD_PRICE_IMPORTS) {
    const target = bound.targets.find((item) => item?.role === oldImport.role);
    if (!target || target.importName !== oldImport.importName) {
      issues.push(`selector_target_import_binding_invalid:${oldImport.role}`);
      continue;
    }
    const newSource = `./${path.basename(target.path)}?raw`;
    const oldCount = expectedPostimage.split(oldImport.source).length - 1;
    const newPreCount = preimage.split(newSource).length - 1;
    if (oldCount !== 1) {
      issues.push(`selector_old_import_count_invalid:${oldImport.role}`);
      continue;
    }
    if (newPreCount !== 0) {
      issues.push(`selector_new_import_already_present:${oldImport.role}`);
      continue;
    }
    expectedPostimage = expectedPostimage.replace(oldImport.source, newSource);
  }
  if (expectedPostimage !== postimage) {
    issues.push("selector_postimage_not_exact_two_replacements");
  }
}

function verifyCurrentPreimage(repoRoot, bound, issues) {
  let currentHead = "";
  let currentTree = "";
  try {
    currentHead = runGit(repoRoot, ["rev-parse", "HEAD"]);
    currentTree = runGit(repoRoot, ["rev-parse", "HEAD^{tree}"]);
  } catch {
    issues.push("repository_identity_read_failed");
  }
  if (currentHead !== bound.receipt.repositoryHeadSha) {
    issues.push("repository_head_changed");
  }
  if (currentTree !== bound.receipt.repositoryTreeSha) {
    issues.push("repository_tree_changed");
  }
  try {
    if (currentTrackedPathsSha256(repoRoot) !== bound.receipt.trackedPathsSha256) {
      issues.push("repository_tracked_paths_changed");
    }
  } catch {
    issues.push("repository_tracked_paths_read_failed");
  }
  const statusLines = runGit(repoRoot, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ])
    .split(/\r?\n/)
    .filter(Boolean);
  if (statusLines.length > 0) issues.push("repository_prewrite_not_clean");

  const selectorPath = ensureContainedPath(
    repoRoot,
    SELECTOR_PATH,
    "selector_preimage",
    issues,
  );
  if (selectorPath) {
    assertRegularNonSymlink(selectorPath, "selector_preimage", issues);
    try {
      const bytes = readFileSync(selectorPath);
      if (!bytes.equals(bound.preimageBytes)) issues.push("selector_preimage_changed");
    } catch {
      issues.push("selector_preimage_read_failed");
    }
  }

  for (const target of bound.targets) {
    if (!target) continue;
    const targetPath = ensureContainedPath(
      repoRoot,
      target.path,
      `target_${target.role}`,
      issues,
    );
    if (!targetPath) continue;
    if (existsSync(targetPath)) issues.push(`target_already_exists:${target.role}`);
    try {
      const tracked = runGit(repoRoot, ["ls-files", "--error-unmatch", target.path]);
      if (tracked === target.path) issues.push(`target_already_tracked:${target.role}`);
    } catch {
      // Expected: target must be untracked and absent.
    }
  }
  return selectorPath;
}

function invokeFault(adapters, stage, context = {}) {
  if (typeof adapters.fault === "function") adapters.fault(stage, context);
}

function writeExclusiveAndVerify(filePath, target) {
  let descriptor = null;
  try {
    descriptor = openSync(filePath, "wx", 0o600);
    writeFileSync(descriptor, target.bytes);
    fsyncSync(descriptor);
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
  const issues = [];
  assertRegularNonSymlink(filePath, `target_${target.role}_postwrite`, issues);
  if (issues.length > 0) throw new Error(issues[0]);
  const actual = readFileSync(filePath);
  if (!actual.equals(target.bytes)) throw new Error(`target_bytes_mismatch:${target.role}`);
  if (sha256(actual) !== target.sha256) throw new Error(`target_hash_mismatch:${target.role}`);
  if (actual.length !== target.byteSize) throw new Error(`target_size_mismatch:${target.role}`);
  if (countCsvDataRows(actual) !== target.rowCount) {
    throw new Error(`target_row_count_mismatch:${target.role}`);
  }
}

function replaceSelector(selectorPath, postimageBytes, claimId) {
  const tempPath = path.join(
    path.dirname(selectorPath),
    `.${path.basename(selectorPath)}.${claimId}.tmp`,
  );
  let descriptor = null;
  try {
    const selectorMode = statSync(selectorPath).mode & 0o777;
    descriptor = openSync(tempPath, "wx", selectorMode);
    writeFileSync(descriptor, postimageBytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    renameSync(tempPath, selectorPath);
  } finally {
    if (descriptor !== null) closeSync(descriptor);
    if (existsSync(tempPath)) unlinkSync(tempPath);
  }
}

function postWriteVerification(repoRoot, bound) {
  const issues = [];
  for (const target of bound.targets) {
    if (!target) {
      issues.push("postwrite_target_missing_contract");
      continue;
    }
    const targetPath = ensureContainedPath(
      repoRoot,
      target.path,
      `postwrite_target_${target.role}`,
      issues,
    );
    if (!targetPath) continue;
    assertRegularNonSymlink(targetPath, `postwrite_target_${target.role}`, issues);
    try {
      const bytes = readFileSync(targetPath);
      if (!bytes.equals(target.bytes)) issues.push(`postwrite_target_bytes_mismatch:${target.role}`);
      if (sha256(bytes) !== target.sha256) issues.push(`postwrite_target_hash_mismatch:${target.role}`);
      if (bytes.length !== target.byteSize) issues.push(`postwrite_target_size_mismatch:${target.role}`);
      if (countCsvDataRows(bytes) !== target.rowCount) {
        issues.push(`postwrite_target_row_count_mismatch:${target.role}`);
      }
    } catch {
      issues.push(`postwrite_target_read_failed:${target.role}`);
    }
  }
  const selectorPath = ensureContainedPath(
    repoRoot,
    SELECTOR_PATH,
    "postwrite_selector",
    issues,
  );
  if (selectorPath) {
    assertRegularNonSymlink(selectorPath, "postwrite_selector", issues);
    try {
      const bytes = readFileSync(selectorPath);
      if (!bytes.equals(bound.postimageBytes)) issues.push("postwrite_selector_bytes_mismatch");
      if (sha256(bytes) !== bound.receipt.selectorPostimageSha256) {
        issues.push("postwrite_selector_hash_mismatch");
      }
    } catch {
      issues.push("postwrite_selector_read_failed");
    }
  }
  let statusLines = [];
  try {
    statusLines = runGit(repoRoot, [
      "status",
      "--porcelain=v1",
      "--untracked-files=all",
    ])
      .split(/\r?\n/)
      .filter(Boolean)
      .sort();
  } catch {
    issues.push("postwrite_git_status_failed");
  }
  const expectedStatus = [
    ` M ${SELECTOR_PATH}`,
    `?? ${bound.targets[0].path}`,
    `?? ${bound.targets[1].path}`,
  ].sort();
  if (canonicalJson(statusLines) !== canonicalJson(expectedStatus)) {
    issues.push("postwrite_changed_paths_invalid");
  }
  const verification = {
    contractVersion: POST_WRITE_VERIFICATION_CONTRACT_VERSION,
    repositoryHeadSha: bound.receipt.repositoryHeadSha,
    repositoryTreeSha: bound.receipt.repositoryTreeSha,
    trackedPathsSha256: bound.receipt.trackedPathsSha256,
    executionPackageHash: bound.receipt.executionPackageHash,
    selectorPostimageSha256: bound.receipt.selectorPostimageSha256,
    targets: bound.targets.map(targetSummary),
    changedPaths: [SELECTOR_PATH, ...bound.targets.map((target) => target.path)].sort(),
    actualWriteCount: 2,
    actualDeleteCount: 0,
  };
  const verificationHash = hashWithDomain(
    POST_WRITE_VERIFICATION_HASH_DOMAIN,
    verification,
  );
  return {
    ok: issues.length === 0,
    issues: uniqueSorted(issues),
    verification,
    verificationHash,
  };
}

module.exports = {
  OLD_PRICE_IMPORTS,
  SELECTOR_PATH,
  TEST_MARKER_FILE,
  areTargetPathsDistinct,
  countCsvDataRows,
  currentTrackedPathsSha256,
  ensureContainedPath,
  invokeFault,
  isSafeTargetPath,
  postWriteVerification,
  replaceClaim,
  replaceSelector,
  runGit,
  validateSelectorTransformation,
  validateTestEnvironment,
  verifyCurrentPreimage,
  writeClaimExclusive,
  writeExclusiveAndVerify,
};
