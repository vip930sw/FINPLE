const {
  closeSync,
  existsSync,
  fstatSync,
  ftruncateSync,
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
const {
  areMetricsTargetPathsDistinct,
  getMetricsTargetPathIdentity,
} = require("./metrics-target-path-identity.cjs");

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
const TARGET_EXPORT_HEADERS = Object.freeze([
  "market",
  "ticker",
  "expectedCagr",
  "priceCagr10y",
  "mdd",
  "beta",
  "dataYears",
  "benchmarkTicker",
  "metricsStatus",
  "metricsSource",
  "reviewReason",
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

function readGitStatus(repo) {
  const result = spawnSync(
    "git",
    ["-c", "core.quotepath=false", "status", "--porcelain=v1", "-z", "--untracked-files=all"],
    {
      cwd: repo,
      shell: false,
      encoding: "buffer",
      windowsHide: true,
    },
  );
  if (result.status !== 0 || !Buffer.isBuffer(result.stdout)) {
    throw new Error("git_command_failed:status");
  }
  if (result.stdout.length === 0) return [];
  if (result.stdout.at(-1) !== 0) {
    throw new Error("git_status_output_not_nul_terminated");
  }
  return result.stdout
    .subarray(0, -1)
    .toString("utf8")
    .split("\0")
    .map((record) => {
      if (record.length < 4 || record[2] !== " ") {
        throw new Error("git_status_record_invalid");
      }
      return { status: record.slice(0, 2), path: record.slice(3) };
    });
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

function areTargetPathsDistinct(left, right) {
  return (
    isSafeTargetPath(left) &&
    isSafeTargetPath(right) &&
    areMetricsTargetPathsDistinct(left, right)
  );
}

function filesystemIdentity(value) {
  return getMetricsTargetPathIdentity(value, { filesystemPath: value })
    .filesystemCollisionKey;
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

function pathsOverlapOrContain(left, right) {
  return (
    filesystemIdentity(left) === filesystemIdentity(right) ||
    isPathInside(left, right) ||
    isPathInside(right, left)
  );
}

function readStableRegularFile(filePath, issuePrefix) {
  let descriptor = null;
  try {
    const pathBefore = lstatSync(filePath, { bigint: true });
    if (pathBefore.isSymbolicLink()) {
      throw new Error(`${issuePrefix}_symlink`);
    }
    if (!pathBefore.isFile()) {
      throw new Error(`${issuePrefix}_not_regular_file`);
    }
    if (
      typeof pathBefore.dev !== "bigint" ||
      typeof pathBefore.ino !== "bigint" ||
      pathBefore.dev < 0n ||
      pathBefore.ino <= 0n
    ) {
      throw new Error(`${issuePrefix}_identity_invalid`);
    }
    descriptor = openSync(filePath, "r");
    const descriptorBefore = fstatSync(descriptor, { bigint: true });
    const bytes = readFileSync(descriptor);
    const descriptorAfter = fstatSync(descriptor, { bigint: true });
    const pathAfter = lstatSync(filePath, { bigint: true });
    const identity = (value) => `${value.dev}:${value.ino}`;
    const expectedIdentity = identity(pathBefore);
    if (
      pathAfter.isSymbolicLink() ||
      !pathAfter.isFile() ||
      identity(pathAfter) !== expectedIdentity ||
      identity(descriptorBefore) !== expectedIdentity ||
      identity(descriptorAfter) !== expectedIdentity ||
      pathBefore.size !== descriptorBefore.size ||
      descriptorBefore.size !== descriptorAfter.size ||
      descriptorAfter.size !== pathAfter.size ||
      BigInt(bytes.length) !== descriptorAfter.size
    ) {
      throw new Error(`${issuePrefix}_identity_changed`);
    }
    return {
      bytes,
      mode: Number(pathBefore.mode & 0o777n),
      identity: expectedIdentity,
    };
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function parseMarker(repoRoot) {
  const markerPath = path.join(repoRoot, TEST_MARKER_FILE);
  let value;
  try {
    const observation = readStableRegularFile(
      markerPath,
      "test_fixture_marker",
    );
    if (observation.bytes.length === 0 || observation.bytes.length > 4096) {
      return { ok: false, issues: ["test_fixture_marker_size_invalid"] };
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(
      observation.bytes,
    );
    value = JSON.parse(text);
  } catch (error) {
    const issue = isSafeIdentity(error?.message || "")
      ? error.message
      : "test_fixture_marker_invalid";
    return { ok: false, issues: [issue] };
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

function validateDirectoryIdentity(inputPath, issuePrefix, issues) {
  try {
    const stat = lstatSync(inputPath, { bigint: true });
    if (stat.isSymbolicLink()) issues.push(`${issuePrefix}_symlink`);
    if (!stat.isDirectory()) issues.push(`${issuePrefix}_not_directory`);
  } catch {
    issues.push(`${issuePrefix}_invalid`);
  }
}

function validateTestEnvironment(repo, claimDirectory, implementationRoot) {
  const issues = [];
  let repoRoot = "";
  let claimRoot = "";
  try {
    validateDirectoryIdentity(repo, "test_repository_path", issues);
    validateDirectoryIdentity(
      claimDirectory,
      "claim_directory_path",
      issues,
    );
    repoRoot = realpathSync(repo);
    claimRoot = realpathSync(claimDirectory);
  } catch {
    return { ok: false, issues: ["test_environment_path_invalid"] };
  }
  let implementationReal = implementationRoot;
  try {
    implementationReal = realpathSync(implementationRoot);
  } catch {
    issues.push("implementation_checkout_path_invalid");
    implementationReal = "";
  }
  if (
    implementationReal &&
    filesystemIdentity(repoRoot) === filesystemIdentity(implementationReal)
  ) {
    issues.push("real_checkout_execution_prohibited");
  }
  if (implementationReal && pathsOverlapOrContain(repoRoot, implementationReal)) {
    issues.push("test_repository_overlaps_implementation_checkout");
  }
  if (implementationReal && pathsOverlapOrContain(claimRoot, implementationReal)) {
    issues.push("claim_directory_overlaps_implementation_checkout");
  }
  if (pathsOverlapOrContain(repoRoot, claimRoot)) {
    issues.push("test_repository_claim_directory_overlap");
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
    const trackedMarker = runGit(repoRoot, [
      "ls-files",
      "--error-unmatch",
      "--",
      TEST_MARKER_FILE,
    ]);
    if (trackedMarker !== TEST_MARKER_FILE) {
      issues.push("test_fixture_marker_not_committed");
    }
    statusLines = readGitStatus(repoRoot);
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

function syncClaimParentDirectory(claimRoot) {
  if (process.platform === "win32") return "unsupported_platform";
  let descriptor = null;
  let status = "sync_failed";
  try {
    descriptor = openSync(claimRoot, "r");
    fsyncSync(descriptor);
    status = "synced";
  } catch (error) {
    if (
      ["EINVAL", "ENOTSUP", "EOPNOTSUPP", "EISDIR", "EPERM"].includes(
        error?.code,
      )
    ) {
      status = "unsupported_platform";
    } else {
      status = "sync_failed";
    }
  } finally {
    if (descriptor !== null) {
      try {
        closeSync(descriptor);
      } catch {
        status = "sync_failed";
      }
    }
  }
  return status;
}

function writeClaimExclusive(claimRoot, claim) {
  const claimPath = claimPathFor(claimRoot, claim);
  let descriptor = null;
  let claimFileSynced = false;
  try {
    descriptor = openSync(claimPath, "wx", 0o600);
    try {
      writeFileSync(descriptor, serializeJson(claim), { encoding: "utf8" });
      fsyncSync(descriptor);
      claimFileSynced = true;
    } catch {
      claimFileSynced = false;
    }
  } finally {
    if (descriptor !== null) {
      try {
        closeSync(descriptor);
      } catch {
        claimFileSynced = false;
      }
    }
  }
  return {
    claimPath,
    parentDirectoryDurability: claimFileSynced
      ? syncClaimParentDirectory(claimRoot)
      : "sync_failed",
  };
}

function replaceClaim(claimPath, claim) {
  let descriptor = null;
  try {
    const before = lstatSync(claimPath, { bigint: true });
    if (!before.isFile() || before.isSymbolicLink()) {
      throw new Error("claim_file_identity_invalid");
    }
    descriptor = openSync(claimPath, "r+");
    const descriptorBefore = require("node:fs").fstatSync(descriptor, {
      bigint: true,
    });
    if (
      before.dev !== descriptorBefore.dev ||
      before.ino !== descriptorBefore.ino
    ) {
      throw new Error("claim_file_identity_changed");
    }
    ftruncateSync(descriptor, 0);
    writeFileSync(descriptor, serializeJson(claim), { encoding: "utf8" });
    fsyncSync(descriptor);
  } finally {
    if (descriptor !== null) closeSync(descriptor);
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

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  if (quoted) throw new TypeError("csv_unterminated_quote");
  cells.push(current);
  return cells;
}

function validateTargetCsvBytes(bytes, expectedMarket, declaredRowCount) {
  const issues = [];
  let text = "";
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return ["csv_utf8_invalid"];
  }
  const lines = text.replaceAll("\r\n", "\n").replaceAll("\r", "\n").split("\n");
  while (lines.at(-1) === "") lines.pop();
  if (lines.length < 2 || lines.some((line) => line.length === 0)) {
    return ["csv_rows_invalid"];
  }
  let headers;
  try {
    headers = parseCsvLine(lines[0]);
  } catch {
    return ["csv_header_invalid"];
  }
  headers[0] = headers[0].replace(/^\uFEFF/, "");
  if (canonicalJson(headers) !== canonicalJson(TARGET_EXPORT_HEADERS)) {
    issues.push("csv_schema_mismatch");
  }
  const seen = new Set();
  for (let index = 1; index < lines.length; index += 1) {
    let cells;
    try {
      cells = parseCsvLine(lines[index]);
    } catch {
      issues.push(`csv_row_invalid:${index}`);
      continue;
    }
    if (cells.length !== TARGET_EXPORT_HEADERS.length) {
      issues.push(`csv_column_count_invalid:${index}`);
      continue;
    }
    const market = cells[0].trim().toUpperCase();
    const ticker = cells[1].trim().toUpperCase();
    if (market !== expectedMarket) issues.push(`csv_market_mismatch:${index}`);
    if (!ticker) {
      issues.push(`csv_ticker_missing:${index}`);
    } else if (seen.has(`${market}:${ticker}`)) {
      issues.push(`csv_duplicate_market_ticker:${market}:${ticker}`);
    } else {
      seen.add(`${market}:${ticker}`);
    }
    for (const numericIndex of [2, 3, 4, 5, 6]) {
      const value = cells[numericIndex].trim();
      if (value && !Number.isFinite(Number(value))) {
        issues.push(`csv_numeric_value_invalid:${index}`);
        break;
      }
    }
  }
  if (lines.length - 1 !== declaredRowCount) issues.push("csv_row_count_mismatch");
  return uniqueSorted(issues);
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

function captureSelectorPreimage(selectorPath, bound) {
  const observation = readStableRegularFile(
    selectorPath,
    "selector_preimage",
  );
  if (!observation.bytes.equals(bound.preimageBytes)) {
    throw new Error("selector_preimage_changed");
  }
  if (
    bound.selectorMode !== undefined &&
    observation.mode !== bound.selectorMode
  ) {
    throw new Error("selector_preimage_mode_changed");
  }
  if (
    bound.selectorIdentity !== undefined &&
    observation.identity !== bound.selectorIdentity
  ) {
    throw new Error("selector_preimage_identity_changed");
  }
  return observation;
}

function ensureContainedPath(repoRoot, repositoryPath, issuePrefix, issues) {
  if (!isSafeRepositoryPath(repositoryPath)) {
    issues.push(`${issuePrefix}_repository_path_invalid`);
    return "";
  }
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
  let cursor = repoRoot;
  for (const segment of path.relative(repoRoot, parent).split(path.sep)) {
    if (!segment) continue;
    cursor = path.join(cursor, segment);
    try {
      const stat = lstatSync(cursor, { bigint: true });
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        issues.push(`${issuePrefix}_parent_identity_invalid`);
        return "";
      }
    } catch {
      issues.push(`${issuePrefix}_parent_invalid`);
      return "";
    }
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
  let currentBranch = "";
  try {
    currentHead = runGit(repoRoot, ["rev-parse", "HEAD"]);
    currentTree = runGit(repoRoot, ["rev-parse", "HEAD^{tree}"]);
    currentBranch = runGit(repoRoot, ["branch", "--show-current"]);
  } catch {
    issues.push("repository_identity_read_failed");
  }
  if (currentHead !== bound.receipt.repositoryHeadSha) {
    issues.push("repository_head_changed");
  }
  if (currentTree !== bound.receipt.repositoryTreeSha) {
    issues.push("repository_tree_changed");
  }
  if (currentBranch !== bound.branchName) {
    issues.push("repository_branch_changed");
  }
  try {
    if (currentTrackedPathsSha256(repoRoot) !== bound.receipt.trackedPathsSha256) {
      issues.push("repository_tracked_paths_changed");
    }
  } catch {
    issues.push("repository_tracked_paths_read_failed");
  }
  const statusLines = readGitStatus(repoRoot);
  if (statusLines.length > 0) issues.push("repository_prewrite_not_clean");

  const selectorPath = ensureContainedPath(
    repoRoot,
    SELECTOR_PATH,
    "selector_preimage",
    issues,
  );
  if (selectorPath) {
    try {
      const observation = captureSelectorPreimage(selectorPath, bound);
      if (bound.selectorMode === undefined) {
        bound.selectorMode = observation.mode;
      }
      if (bound.selectorIdentity === undefined) {
        bound.selectorIdentity = observation.identity;
      }
    } catch (error) {
      issues.push(
        isSafeIdentity(error?.message || "")
          ? error.message
          : "selector_preimage_read_failed",
      );
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

function writeExclusiveAndVerify(repoRoot, filePath, target) {
  if (existsSync(filePath)) {
    throw new Error(`target_already_exists:${target.role}`);
  }
  try {
    runGit(repoRoot, ["ls-files", "--error-unmatch", "--", target.path]);
    throw new Error(`target_already_tracked:${target.role}`);
  } catch (error) {
    if (error?.message?.startsWith("target_already_tracked:")) throw error;
  }
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

function replaceSelector(
  selectorPath,
  postimageBytes,
  claimId,
  expectedPreimage,
) {
  const tempPath = path.join(
    path.dirname(selectorPath),
    `.${path.basename(selectorPath)}.${claimId}.tmp`,
  );
  let descriptor = null;
  try {
    descriptor = openSync(tempPath, "wx", expectedPreimage.mode);
    writeFileSync(descriptor, postimageBytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = null;
    const actualPreimage = readStableRegularFile(
      selectorPath,
      "selector_pre_rename",
    );
    if (
      !actualPreimage.bytes.equals(expectedPreimage.bytes) ||
      actualPreimage.mode !== expectedPreimage.mode ||
      actualPreimage.identity !== expectedPreimage.identity
    ) {
      throw new Error("selector_preimage_changed_before_rename");
    }
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
      if ((statSync(selectorPath).mode & 0o777) !== bound.selectorMode) {
        issues.push("postwrite_selector_mode_mismatch");
      }
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
    statusLines = readGitStatus(repoRoot)
      .map((entry) => `${entry.status} ${entry.path}`)
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
  try {
    if (runGit(repoRoot, ["rev-parse", "HEAD"]) !== bound.receipt.repositoryHeadSha) {
      issues.push("postwrite_repository_head_changed");
    }
    if (runGit(repoRoot, ["rev-parse", "HEAD^{tree}"]) !== bound.receipt.repositoryTreeSha) {
      issues.push("postwrite_repository_tree_changed");
    }
    if (runGit(repoRoot, ["branch", "--show-current"]) !== bound.branchName) {
      issues.push("postwrite_repository_branch_changed");
    }
    if (currentTrackedPathsSha256(repoRoot) !== bound.receipt.trackedPathsSha256) {
      issues.push("postwrite_repository_tracked_paths_changed");
    }
  } catch {
    issues.push("postwrite_repository_identity_read_failed");
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
  captureSelectorPreimage,
  countCsvDataRows,
  currentTrackedPathsSha256,
  ensureContainedPath,
  invokeFault,
  isSafeTargetPath,
  postWriteVerification,
  replaceClaim,
  replaceSelector,
  runGit,
  syncClaimParentDirectory,
  validateSelectorTransformation,
  validateTargetCsvBytes,
  validateTestEnvironment,
  verifyCurrentPreimage,
  writeClaimExclusive,
  writeExclusiveAndVerify,
};
