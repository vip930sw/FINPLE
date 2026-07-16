const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const {
  lstatSync,
  readFileSync,
  realpathSync,
} = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { TextDecoder } = require("node:util");

const CONTRACT_VERSION =
  "metrics-cutover-repository-state-adapter-v1-step114-2r";
const SELECTOR_PATH = "src/data/tickers/screenerCandidateOverlay.js";
const COMMAND_TIMEOUT_MS = 10_000;
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
const GIT_COMMANDS = Object.freeze([
  ["rev-parse", "--show-toplevel"],
  ["rev-parse", "HEAD"],
  ["rev-parse", "HEAD^{tree}"],
  ["symbolic-ref", "--quiet", "--short", "HEAD"],
  ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
  ["ls-files", "-z"],
]);
const GIT_COMMAND_KEYS = new Set(GIT_COMMANDS.map((args) => JSON.stringify(args)));
const decoder = new TextDecoder("utf-8", { fatal: true });

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function safeResult(status, fields = {}, issues = [], warnings = []) {
  const ready = status === "ready";
  return {
    ok: ready,
    status,
    contractVersion: CONTRACT_VERSION,
    repositoryRootVerified: fields.repositoryRootVerified === true,
    repositoryStateStable: fields.repositoryStateStable === true,
    repositoryHeadSha: fields.repositoryHeadSha || "",
    repositoryTreeSha: fields.repositoryTreeSha || "",
    branchName: fields.branchName || "",
    detachedHead: fields.detachedHead === true,
    worktreeClean: fields.worktreeClean === true,
    worktreeStatusEntryCount: Number.isInteger(fields.worktreeStatusEntryCount)
      ? fields.worktreeStatusEntryCount
      : 0,
    trackedPathCount:
      ready && Number.isInteger(fields.trackedPathCount)
        ? fields.trackedPathCount
        : 0,
    trackedPathsSha256: fields.trackedPathsSha256 || "",
    selectorPath: SELECTOR_PATH,
    selectorSha256: fields.selectorSha256 || "",
    selectorContentBase64: ready ? fields.selectorContentBase64 || "" : "",
    selectorVerified: fields.selectorVerified === true,
    targetPathCount:
      Number.isInteger(fields.targetPathCount) ? fields.targetPathCount : 0,
    targetPathsAbsent: fields.targetPathsAbsent === true,
    trackedPaths: ready && Array.isArray(fields.trackedPaths)
      ? [...fields.trackedPaths]
      : [],
    repositoryPreimage:
      ready && fields.repositoryPreimage ? fields.repositoryPreimage : {},
    trustedOptions: ready && fields.trustedOptions ? fields.trustedOptions : {},
    executionPolicy:
      ready && fields.executionPolicy ? fields.executionPolicy : {},
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

function sanitizeProcessFailure(result) {
  if (result?.error?.code === "ETIMEDOUT") return "git_command_timeout";
  if (result?.error?.code === "ENOBUFS") return "git_command_output_too_large";
  if (result?.error) return "git_command_runtime_error";
  if (result?.signal) return "git_command_signal_termination";
  return "git_command_nonzero_exit";
}

function runReadOnlyGit(
  gitExecutable,
  args,
  cwd,
  {
    spawn = spawnSync,
    timeoutMs = COMMAND_TIMEOUT_MS,
    maxOutputBytes = MAX_OUTPUT_BYTES,
  } = {},
) {
  if (!GIT_COMMAND_KEYS.has(JSON.stringify(args))) {
    return {
      ok: false,
      issue: "git_command_not_allowlisted",
      stdout: Buffer.alloc(0),
    };
  }
  const result = spawn(gitExecutable, args, {
    cwd,
    shell: false,
    timeout: timeoutMs,
    maxBuffer: maxOutputBytes,
    encoding: null,
    windowsHide: true,
  });
  const stdout = Buffer.isBuffer(result?.stdout)
    ? result.stdout
    : Buffer.from(result?.stdout || "");
  if (stdout.length > maxOutputBytes) {
    return { ok: false, issue: "git_command_output_too_large", stdout };
  }
  if (result?.error || result?.signal || result?.status !== 0) {
    return { ok: false, issue: sanitizeProcessFailure(result), stdout };
  }
  return { ok: true, stdout };
}

function strictUtf8(bytes, issue, issues) {
  try {
    return decoder.decode(bytes);
  } catch {
    issues.push(issue);
    return "";
  }
}

function singleLine(bytes, issuePrefix, issues) {
  const text = strictUtf8(bytes, `${issuePrefix}_invalid_utf8`, issues);
  if (!text) return "";
  const value = text.replace(/\r?\n$/, "");
  if (!value || /[\0\r\n]/.test(value)) {
    issues.push(`${issuePrefix}_malformed`);
    return "";
  }
  return value;
}

function isGitSha(value) {
  return typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
}

function isSafeBranchName(value) {
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

function isSafeRepositoryPath(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value &&
    !/[\0\r\n]/.test(value) &&
    !value.includes("\\") &&
    !path.posix.isAbsolute(value) &&
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

function insideRoot(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

function parseNulRecords(bytes, issuePrefix, issues, { allowEmpty = false } = {}) {
  if (bytes.length === 0) return allowEmpty ? [] : [];
  if (bytes[bytes.length - 1] !== 0) {
    issues.push(`${issuePrefix}_missing_terminal_nul`);
    return [];
  }
  const text = strictUtf8(
    bytes.subarray(0, bytes.length - 1),
    `${issuePrefix}_invalid_utf8`,
    issues,
  );
  if (!text && bytes.length > 1) return [];
  const records = text ? text.split("\0") : [];
  if (records.some((record) => record.length === 0)) {
    issues.push(`${issuePrefix}_empty_record`);
  }
  return records;
}

function validateTrackedPaths(records, issues) {
  const seen = new Set();
  for (const record of records) {
    if (!isSafeRepositoryPath(record)) {
      issues.push("tracked_path_invalid");
    } else if (seen.has(record)) {
      issues.push("tracked_path_duplicate");
    } else {
      seen.add(record);
    }
  }
  return [...seen];
}

function inspectFile(
  root,
  relativePath,
  {
    fs = { lstatSync, readFileSync, realpathSync },
    requireRegularFile = true,
  } = {},
) {
  const absolute = path.resolve(root, ...relativePath.split("/"));
  if (!insideRoot(root, absolute)) {
    return { ok: false, issue: "path_escape" };
  }
  let stat;
  try {
    stat = fs.lstatSync(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return { ok: false, issue: "path_missing" };
    return { ok: false, issue: "path_inspection_failed" };
  }
  if (stat.isSymbolicLink()) return { ok: false, issue: "path_symlink" };
  if (requireRegularFile && !stat.isFile()) {
    return { ok: false, issue: "path_not_regular_file" };
  }
  let canonical;
  try {
    canonical = fs.realpathSync(absolute);
  } catch {
    return { ok: false, issue: "path_realpath_failed" };
  }
  if (!insideRoot(root, canonical)) return { ok: false, issue: "path_escape" };
  return { ok: true, absolute, canonical, stat };
}

function inspectTargetAbsence(root, relativePath, fs) {
  if (!isSafeTargetPath(relativePath)) {
    return { absent: false, issue: "target_path_invalid" };
  }
  const parentRelative = path.posix.dirname(relativePath);
  const parent = inspectFile(root, parentRelative, {
    fs,
    requireRegularFile: false,
  });
  if (!parent.ok) return { absent: false, issue: "target_parent_invalid" };
  if (!parent.stat.isDirectory()) {
    return { absent: false, issue: "target_parent_not_directory" };
  }
  const absolute = path.resolve(root, ...relativePath.split("/"));
  if (!insideRoot(root, absolute)) {
    return { absent: false, issue: "target_path_escape" };
  }
  try {
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) return { absent: false, issue: "target_symlink" };
    if (stat.isDirectory()) return { absent: false, issue: "target_directory" };
    return { absent: false, issue: "target_exists" };
  } catch (error) {
    if (error?.code === "ENOENT") return { absent: true };
    return { absent: false, issue: "target_inspection_failed" };
  }
}

async function loadContracts() {
  const serviceUrl = pathToFileURL(
    path.resolve(
      __dirname,
      "../../server/src/services/metricsCutoverExecutionPackagePreflight.js",
    ),
  ).href;
  const rehearsalUrl = pathToFileURL(
    path.resolve(
      __dirname,
      "../../server/src/services/metricsFinalApprovalCutoverRehearsal.js",
    ),
  ).href;
  const [preflight, rehearsal] = await Promise.all([
    import(serviceUrl),
    import(rehearsalUrl),
  ]);
  return {
    hashMetricsTrackedPaths: preflight.hashMetricsTrackedPaths,
    selectorProvenanceCommitSha:
      preflight.METRICS_SELECTOR_PROVENANCE_COMMIT_SHA,
    policyVersion:
      preflight.METRICS_CUTOVER_EXECUTION_POLICY_CONTRACT_VERSION,
    repositoryPreimageVersion:
      preflight.METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION,
    currentPointerSnapshot: rehearsal.getMetricsCurrentPointerSnapshot(),
  };
}

function commandOutput(runGit, gitExecutable, args, cwd, issues) {
  const result = runGit(gitExecutable, args, cwd);
  if (!result?.ok) {
    issues.push(result?.issue || "git_command_failed");
    return Buffer.alloc(0);
  }
  if (!Buffer.isBuffer(result.stdout)) {
    issues.push("git_command_stdout_not_buffer");
    return Buffer.alloc(0);
  }
  return result.stdout;
}

function collectGitState(runGit, gitExecutable, cwd, contracts, issues) {
  const rootBytes = commandOutput(
    runGit,
    gitExecutable,
    ["rev-parse", "--show-toplevel"],
    cwd,
    issues,
  );
  const headBytes = commandOutput(
    runGit,
    gitExecutable,
    ["rev-parse", "HEAD"],
    cwd,
    issues,
  );
  const treeBytes = commandOutput(
    runGit,
    gitExecutable,
    ["rev-parse", "HEAD^{tree}"],
    cwd,
    issues,
  );
  const branchBytes = commandOutput(
    runGit,
    gitExecutable,
    ["symbolic-ref", "--quiet", "--short", "HEAD"],
    cwd,
    issues,
  );
  const statusBytes = commandOutput(
    runGit,
    gitExecutable,
    ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
    cwd,
    issues,
  );
  const trackedBytes = commandOutput(
    runGit,
    gitExecutable,
    ["ls-files", "-z"],
    cwd,
    issues,
  );
  const root = singleLine(rootBytes, "repository_root", issues);
  const head = singleLine(headBytes, "repository_head", issues);
  const tree = singleLine(treeBytes, "repository_tree", issues);
  const branch = singleLine(branchBytes, "repository_branch", issues);
  if (head && !isGitSha(head)) issues.push("repository_head_invalid");
  if (tree && !isGitSha(tree)) issues.push("repository_tree_invalid");
  if (branch && !isSafeBranchName(branch)) {
    issues.push("repository_branch_invalid");
  }
  const statusRecords = parseNulRecords(statusBytes, "worktree_status", issues, {
    allowEmpty: true,
  });
  const trackedRecords = parseNulRecords(
    trackedBytes,
    "tracked_inventory",
    issues,
  );
  const trackedPaths = validateTrackedPaths(trackedRecords, issues);
  const trackedPathsSha256 = contracts.hashMetricsTrackedPaths(trackedPaths);
  return {
    root,
    head,
    tree,
    branch,
    detachedHead: !branch,
    statusBytes,
    statusHash: sha256(statusBytes),
    statusEntryCount: statusRecords.length,
    trackedPaths,
    trackedPathsSha256,
  };
}

function sameBuffer(left, right) {
  return Buffer.isBuffer(left) && Buffer.isBuffer(right) && left.equals(right);
}

async function collectMetricsCutoverRepositoryState(input = {}, adapters = {}) {
  if (
    !input ||
    typeof input !== "object" ||
    !input.repo ||
    !input.usTarget ||
    !input.krTarget
  ) {
    return safeResult("idle", {}, ["repository_state_input_missing"]);
  }
  const issues = [];
  const fs = adapters.fs || { lstatSync, readFileSync, realpathSync };
  const contracts = adapters.contracts || (await loadContracts());
  const gitExecutable = adapters.gitExecutable || "git";
  const runGit =
    adapters.runGit ||
    ((executable, args, cwd) =>
      runReadOnlyGit(executable, args, cwd, {
        spawn: adapters.spawn || spawnSync,
        timeoutMs: adapters.timeoutMs || COMMAND_TIMEOUT_MS,
        maxOutputBytes: adapters.maxOutputBytes || MAX_OUTPUT_BYTES,
      }));

  if (
    typeof input.usTarget !== "string" ||
    typeof input.krTarget !== "string" ||
    input.usTarget === input.krTarget ||
    !isSafeTargetPath(input.usTarget) ||
    !isSafeTargetPath(input.krTarget)
  ) {
    issues.push("target_paths_invalid");
  }

  let suppliedPath;
  let suppliedStat;
  let suppliedRoot;
  try {
    suppliedPath = path.resolve(String(input.repo));
    suppliedStat = fs.lstatSync(suppliedPath);
    suppliedRoot = fs.realpathSync(suppliedPath);
  } catch {
    return safeResult("blocked", {}, ["supplied_repository_invalid"]);
  }
  if (!suppliedStat.isDirectory() || suppliedStat.isSymbolicLink()) {
    issues.push("supplied_repository_not_canonical_directory");
  }

  const start = collectGitState(
    runGit,
    gitExecutable,
    suppliedRoot,
    contracts,
    issues,
  );
  let gitRoot = "";
  try {
    gitRoot = start.root ? fs.realpathSync(start.root) : "";
  } catch {
    issues.push("git_repository_root_invalid");
  }
  const repositoryRootVerified =
    Boolean(gitRoot) && gitRoot === suppliedRoot && insideRoot(suppliedRoot, gitRoot);
  if (!repositoryRootVerified) issues.push("repository_root_mismatch");

  const selectorInspection = inspectFile(
    suppliedRoot,
    SELECTOR_PATH,
    { fs },
  );
  let selectorStart = Buffer.alloc(0);
  if (!selectorInspection.ok) {
    issues.push(`selector_${selectorInspection.issue}`);
  } else {
    try {
      selectorStart = fs.readFileSync(selectorInspection.absolute);
    } catch {
      issues.push("selector_read_failed");
    }
  }
  const selectorStartSha = sha256(selectorStart);
  if (
    selectorStartSha !== contracts.currentPointerSnapshot.selector.sha256
  ) {
    issues.push("selector_sha256_mismatch");
  }

  const targetStart = [
    inspectTargetAbsence(suppliedRoot, input.usTarget, fs),
    inspectTargetAbsence(suppliedRoot, input.krTarget, fs),
  ];
  for (const target of targetStart) {
    if (!target.absent) issues.push(target.issue);
  }
  for (const targetPath of [input.usTarget, input.krTarget]) {
    if (start.trackedPaths.includes(targetPath)) {
      issues.push("target_path_tracked");
    }
  }

  const end = collectGitState(
    runGit,
    gitExecutable,
    suppliedRoot,
    contracts,
    issues,
  );
  const selectorEndInspection = inspectFile(
    suppliedRoot,
    SELECTOR_PATH,
    { fs },
  );
  let selectorEnd = Buffer.alloc(0);
  if (!selectorEndInspection.ok) {
    issues.push(`selector_second_${selectorEndInspection.issue}`);
  } else {
    try {
      selectorEnd = fs.readFileSync(selectorEndInspection.absolute);
    } catch {
      issues.push("selector_second_read_failed");
    }
  }
  const targetEnd = [
    inspectTargetAbsence(suppliedRoot, input.usTarget, fs),
    inspectTargetAbsence(suppliedRoot, input.krTarget, fs),
  ];
  for (const target of targetEnd) {
    if (!target.absent) issues.push(target.issue);
  }

  const stabilityChecks = [
    ["repository_root_changed", start.root === end.root],
    ["repository_head_changed", start.head === end.head],
    ["repository_tree_changed", start.tree === end.tree],
    ["repository_branch_changed", start.branch === end.branch],
    ["worktree_status_changed", sameBuffer(start.statusBytes, end.statusBytes)],
    [
      "tracked_inventory_changed",
      start.trackedPathsSha256 === end.trackedPathsSha256,
    ],
    ["selector_changed", sameBuffer(selectorStart, selectorEnd)],
    [
      "selector_path_changed",
      selectorInspection.ok &&
        selectorEndInspection.ok &&
        selectorInspection.canonical === selectorEndInspection.canonical,
    ],
    [
      "target_absence_changed",
      targetStart.every(
        (value, index) =>
          value.absent === targetEnd[index].absent &&
          value.issue === targetEnd[index].issue,
      ),
    ],
  ];
  for (const [issue, stable] of stabilityChecks) {
    if (!stable) issues.push(issue);
  }
  if (start.detachedHead || end.detachedHead) issues.push("detached_head");
  if (start.statusBytes.length > 0) issues.push("worktree_not_clean");
  for (const requiredPath of [
    contracts.currentPointerSnapshot.selector.path,
    ...contracts.currentPointerSnapshot.components.map((item) => item.path),
  ]) {
    if (!start.trackedPaths.includes(requiredPath)) {
      issues.push("required_tracked_path_missing");
    }
  }

  const repositoryStateStable = stabilityChecks.every(([, stable]) => stable);
  const selectorVerified =
    selectorInspection.ok &&
    selectorEndInspection.ok &&
    selectorStart.length > 0 &&
    selectorStartSha === contracts.currentPointerSnapshot.selector.sha256 &&
    sameBuffer(selectorStart, selectorEnd) &&
    selectorInspection.canonical === selectorEndInspection.canonical;
  const targetPathsAbsent =
    targetStart.every((item) => item.absent) &&
    targetEnd.every((item) => item.absent);
  const ready =
    issues.length === 0 &&
    repositoryRootVerified &&
    repositoryStateStable &&
    selectorVerified &&
    targetPathsAbsent &&
    start.statusBytes.length === 0;

  const commonFields = {
    repositoryRootVerified,
    repositoryStateStable,
    repositoryHeadSha: start.head,
    repositoryTreeSha: start.tree,
    branchName: start.branch,
    detachedHead: start.detachedHead,
    worktreeClean: start.statusBytes.length === 0,
    worktreeStatusEntryCount: start.statusEntryCount,
    trackedPathCount: start.trackedPaths.length,
    trackedPathsSha256: start.trackedPathsSha256,
    selectorSha256: selectorStartSha,
    selectorVerified,
    targetPathCount: 2,
    targetPathsAbsent,
  };
  if (!ready) return safeResult("blocked", commonFields, issues);

  const repositoryPreimage = {
    contractVersion: contracts.repositoryPreimageVersion,
    selectorProvenanceCommitSha: contracts.selectorProvenanceCommitSha,
    repositoryHeadSha: start.head,
    repositoryTreeSha: start.tree,
    selectorPath: SELECTOR_PATH,
    selectorContentBase64: selectorStart.toString("base64"),
    selectorSha256: selectorStartSha,
    trackedPaths: [...start.trackedPaths].sort(),
    trackedPathsSha256: start.trackedPathsSha256,
    worktreeClean: true,
    branchName: start.branch,
  };
  const trustedOptions = {
    expectedSelectorProvenanceCommitSha:
      contracts.selectorProvenanceCommitSha,
    expectedRepositoryHeadSha: start.head,
    expectedRepositoryTreeSha: start.tree,
    expectedTrackedPathsSha256: start.trackedPathsSha256,
    requiredBranchName: start.branch,
  };
  const executionPolicy = {
    policyVersion: contracts.policyVersion,
    ...trustedOptions,
    requireCleanWorktree: true,
    requireCreateOnlyTargets: true,
    requireExactTwoSelectorReplacements: true,
    allowTargetDeletionOnRollback: false,
  };
  return safeResult("ready", {
    ...commonFields,
    trackedPaths: repositoryPreimage.trackedPaths,
    selectorContentBase64: repositoryPreimage.selectorContentBase64,
    repositoryPreimage,
    trustedOptions,
    executionPolicy,
  });
}

module.exports = {
  COMMAND_TIMEOUT_MS,
  CONTRACT_VERSION,
  GIT_COMMANDS,
  MAX_OUTPUT_BYTES,
  SELECTOR_PATH,
  collectMetricsCutoverRepositoryState,
  runReadOnlyGit,
  safeResult,
};
