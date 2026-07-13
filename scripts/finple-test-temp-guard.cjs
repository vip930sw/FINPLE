const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const OWNED_TEMP_PREFIX = "finple-test-guard-";
const TEMP_ROOT_LABEL = "finple-test-guard-owned";
const OWNED_TEMP_MARKER = ".finple-test-guard-owned";
const FULL_REPOSITORY_TIMEOUT_MS = 260000;
const DEFAULT_CLEANUP_MAX_RETRIES = 4;
const DEFAULT_CLEANUP_RETRY_DELAY_MS = 75;

const MODE_DEFINITIONS = Object.freeze({
  "ai-ml-architecture": Object.freeze({
    label: "AI/ML architecture regression",
    args: Object.freeze(["scripts/run-trading-ai-ml-regression-group.cjs", "--group", "architecture-foundation"]),
    timeoutMs: 0,
  }),
  "ai-ml-contracts": Object.freeze({
    label: "AI/ML contract-chain regression",
    args: Object.freeze(["scripts/run-trading-ai-ml-regression-group.cjs", "--group", "contract-chain"]),
    timeoutMs: 0,
  }),
  "ai-ml-consolidation": Object.freeze({
    label: "AI/ML consolidation-primitives regression",
    args: Object.freeze(["scripts/run-trading-ai-ml-regression-group.cjs", "--group", "consolidation-primitives"]),
    timeoutMs: 0,
  }),
  "ai-ml-all": Object.freeze({
    label: "AI/ML grouped regression",
    args: Object.freeze(["scripts/run-trading-ai-ml-regression-group.cjs", "--all"]),
    timeoutMs: 0,
  }),
  "full-repository-diagnostic": Object.freeze({
    label: "Full repository node test diagnostic",
    args: Object.freeze(["--test", "--test-reporter=dot"]),
    timeoutMs: FULL_REPOSITORY_TIMEOUT_MS,
  }),
});

function parseArgs(argv) {
  const args = [...argv];
  const parsed = { mode: null, list: false, plan: false };
  while (args.length > 0) {
    const arg = args.shift();
    if (arg === "--mode") parsed.mode = args.shift() || "";
    else if (arg === "--list") parsed.list = true;
    else if (arg === "--plan") parsed.plan = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return Object.freeze(parsed);
}

function resolveMode(mode) {
  return MODE_DEFINITIONS[mode] || null;
}

function printJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function createOwnedTempRoot({ tmpDir = os.tmpdir(), mkdtempSync = fs.mkdtempSync, writeFileSync = fs.writeFileSync } = {}) {
  const base = path.join(tmpDir, OWNED_TEMP_PREFIX);
  const ownedRoot = mkdtempSync(base);
  writeFileSync(path.join(ownedRoot, OWNED_TEMP_MARKER), "owned\n", "utf8");
  return ownedRoot;
}

function isSamePath(a, b) {
  return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}

function isDirectChildOf(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative.length > 0 && !relative.startsWith("..") && !path.isAbsolute(relative) && !relative.includes(path.sep);
}

function validateCleanupTarget(targetRoot, ownedRoot, { tmpDir = os.tmpdir() } = {}) {
  const resolvedTarget = path.resolve(targetRoot || "");
  const resolvedOwnedRoot = path.resolve(ownedRoot || "");
  const resolvedTmpDir = path.resolve(tmpDir);
  const parsed = path.parse(resolvedTarget);

  if (!resolvedTarget || !resolvedOwnedRoot) throw new Error("cleanup target missing");
  if (!isSamePath(resolvedTarget, resolvedOwnedRoot)) throw new Error("cleanup target is not the owned root");
  if (isSamePath(resolvedTarget, parsed.root)) throw new Error("cleanup target cannot be filesystem root");
  if (isSamePath(resolvedTarget, resolvedTmpDir)) throw new Error("cleanup target cannot be os tmpdir");
  if (!isDirectChildOf(resolvedTmpDir, resolvedTarget)) throw new Error("cleanup target must be a direct child of os tmpdir");
  if (!path.basename(resolvedTarget).startsWith(OWNED_TEMP_PREFIX)) throw new Error("cleanup target prefix is not allowlisted");
  return resolvedTarget;
}

function waitForCleanupRetry(delayMs) {
  if (delayMs <= 0) return;
  const shared = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(shared, 0, 0, delayMs);
}

function toCleanupPath(safeRoot) {
  return process.platform === "win32" ? path.toNamespacedPath(safeRoot) : safeRoot;
}

function cleanupOwnedFinpleTempRoot(ownedRoot, {
  tmpDir = os.tmpdir(),
  expectedOwnedRoot = ownedRoot,
  existsSync = fs.existsSync,
  rmSync = fs.rmSync,
  maxRetries = DEFAULT_CLEANUP_MAX_RETRIES,
  retryDelayMs = DEFAULT_CLEANUP_RETRY_DELAY_MS,
  wait = waitForCleanupRetry,
} = {}) {
  const result = {
    attempted: true,
    cleanupPathMode: process.platform === "win32" ? "windows_namespaced" : "standard",
    cleanupSucceeded: false,
    ownedRootExistsAfter: true,
    retryCount: 0,
    markerValidated: false,
    exactOwnedRootValidated: false,
    redacted: true,
  };

  let safeRoot;
  try {
    safeRoot = validateCleanupTarget(ownedRoot, expectedOwnedRoot, { tmpDir });
    result.exactOwnedRootValidated = true;
    const markerPath = path.join(safeRoot, OWNED_TEMP_MARKER);
    if (!existsSync(markerPath)) throw new Error("owned root marker missing");
    result.markerValidated = true;
  } catch (_error) {
    result.cleanupSucceeded = false;
    result.ownedRootExistsAfter = ownedRoot ? existsSync(ownedRoot) : false;
    return Object.freeze(result);
  }

  const cleanupPath = toCleanupPath(safeRoot);
  const boundedRetries = Math.max(0, Math.min(Number(maxRetries) || 0, 5));

  for (let attempt = 0; attempt <= boundedRetries; attempt += 1) {
    try {
      rmSync(cleanupPath, { recursive: true, force: true });
      result.ownedRootExistsAfter = existsSync(safeRoot);
      if (result.ownedRootExistsAfter === false) {
        result.cleanupSucceeded = true;
        result.retryCount = attempt;
        return Object.freeze(result);
      }
    } catch (_error) {
      result.ownedRootExistsAfter = existsSync(safeRoot);
    }
    if (attempt < boundedRetries) wait(retryDelayMs);
  }

  result.retryCount = boundedRetries;
  result.cleanupSucceeded = false;
  result.ownedRootExistsAfter = existsSync(safeRoot);
  return Object.freeze(result);
}

function cleanupOwnedTempRoot(ownedRoot, options = {}) {
  return cleanupOwnedFinpleTempRoot(ownedRoot, options).cleanupSucceeded;
}

function countGlobalFinpleTempEntries({ tmpDir = os.tmpdir(), readdirSync = fs.readdirSync } = {}) {
  try {
    const count = readdirSync(tmpDir, { withFileTypes: true }).filter((entry) => entry.name.startsWith("finple-")).length;
    return Object.freeze({ ok: true, count, warning: null });
  } catch (error) {
    return Object.freeze({ ok: false, count: null, warning: "global_temp_count_unavailable" });
  }
}

function collectOwnedRootInventory(root, { existsSync = fs.existsSync, readdirSync = fs.readdirSync, statSync = fs.statSync } = {}) {
  if (!root || !existsSync(root)) {
    return Object.freeze({ entryCount: 0, fileCount: 0, directoryCount: 0 });
  }
  let entryCount = 0;
  let fileCount = 0;
  let directoryCount = 0;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      entryCount += 1;
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        directoryCount += 1;
        stack.push(entryPath);
      } else if (entry.isFile()) {
        fileCount += 1;
      } else {
        const stat = statSync(entryPath);
        if (stat.isDirectory()) {
          directoryCount += 1;
          stack.push(entryPath);
        } else if (stat.isFile()) {
          fileCount += 1;
        }
      }
    }
  }
  return Object.freeze({ entryCount, fileCount, directoryCount });
}

function buildChildEnv(baseEnv, ownedRoot) {
  return Object.freeze({
    ...baseEnv,
    TEMP: ownedRoot,
    TMP: ownedRoot,
    TMPDIR: ownedRoot,
  });
}

function buildPlan(mode) {
  const definition = resolveMode(mode);
  if (!definition) return null;
  return Object.freeze({
    mode,
    commandLabel: definition.label,
    internalTimeoutMs: definition.timeoutMs || 0,
    isolationEnabled: true,
    cleanupPolicy: "owned-root-only",
    globalCleanupProhibited: true,
  });
}

function classifyChildResult(childResult, definition) {
  const timedOut = childResult?.error?.code === "ETIMEDOUT";
  const status = typeof childResult?.status === "number" ? childResult.status : timedOut ? 124 : 1;
  const signal = childResult?.signal || null;
  return Object.freeze({
    ok: status === 0 && !timedOut,
    childStatus: timedOut ? "timed_out" : status === 0 ? "passed" : "failed",
    childExitCode: status,
    childSignal: signal,
    timedOut,
    exitCode: status,
    passed: status === 0 && !timedOut,
    timeoutMs: definition.timeoutMs || 0,
  });
}

function runGuard(mode, {
  cwd = process.cwd(),
  env = process.env,
  tmpDir = os.tmpdir(),
  executor = spawnSync,
  stdio = "inherit",
  mkdtempSync = fs.mkdtempSync,
  rmSync = fs.rmSync,
  existsSync = fs.existsSync,
  writeFileSync = fs.writeFileSync,
  cleanup = cleanupOwnedFinpleTempRoot,
} = {}) {
  const definition = resolveMode(mode);
  if (!definition) {
    return Object.freeze({
      ok: false,
      status: "unknown_mode",
      exitCode: 1,
      passed: false,
      mode,
      cleanupAttempted: false,
      cleanupSucceeded: false,
      rootExistsAfterCleanup: false,
    });
  }

  const globalBefore = countGlobalFinpleTempEntries({ tmpDir });
  let ownedRoot = null;
  let cleanupAttempted = false;
  let cleanupSucceeded = false;
  let cleanupResult = Object.freeze({
    attempted: false,
    cleanupPathMode: process.platform === "win32" ? "windows_namespaced" : "standard",
    cleanupSucceeded: false,
    ownedRootExistsAfter: false,
    retryCount: 0,
    markerValidated: false,
    exactOwnedRootValidated: false,
    redacted: true,
  });
  let childSummary = {
    ok: false,
    childStatus: "not_started",
    childExitCode: 1,
    childSignal: null,
    timedOut: false,
    exitCode: 1,
    passed: false,
    timeoutMs: definition.timeoutMs || 0,
  };
  const inventory = {
    ownedRootCreated: false,
    entryCountBefore: 0,
    entryCountAfterChild: 0,
    fileCountAfterChild: 0,
    directoryCountAfterChild: 0,
  };

  try {
    ownedRoot = createOwnedTempRoot({ tmpDir, mkdtempSync, writeFileSync });
    validateCleanupTarget(ownedRoot, ownedRoot, { tmpDir });
    inventory.ownedRootCreated = true;
    inventory.entryCountBefore = collectOwnedRootInventory(ownedRoot).entryCount;
    const spawnOptions = {
      cwd,
      env: buildChildEnv(env, ownedRoot),
      shell: false,
      stdio,
    };
    if (definition.timeoutMs > 0) spawnOptions.timeout = definition.timeoutMs;
    const childResult = executor(process.execPath, [...definition.args], spawnOptions);
    childSummary = classifyChildResult(childResult, definition);
    childSummary = Object.freeze({
      ...childSummary,
      childTerminatedBeforeCleanup: true,
    });
    const afterChild = collectOwnedRootInventory(ownedRoot);
    inventory.entryCountAfterChild = afterChild.entryCount;
    inventory.fileCountAfterChild = afterChild.fileCount;
    inventory.directoryCountAfterChild = afterChild.directoryCount;
  } finally {
    if (ownedRoot) {
      cleanupAttempted = true;
      cleanupResult = cleanup(ownedRoot, { tmpDir, expectedOwnedRoot: ownedRoot, rmSync, existsSync });
      cleanupSucceeded = cleanupResult.cleanupSucceeded;
    }
  }

  const rootExistsAfterCleanup = ownedRoot ? cleanupResult.ownedRootExistsAfter : false;
  const globalAfter = countGlobalFinpleTempEntries({ tmpDir });
  const globalDelta = globalBefore.ok && globalAfter.ok ? globalAfter.count - globalBefore.count : null;

  return Object.freeze({
    ok: childSummary.ok && cleanupSucceeded && rootExistsAfterCleanup === false && globalDelta === 0,
    status: childSummary.childStatus,
    mode,
    tempRootLabel: TEMP_ROOT_LABEL,
    ownedRootCreated: inventory.ownedRootCreated,
    entryCountBefore: inventory.entryCountBefore,
    entryCountAfterChild: inventory.entryCountAfterChild,
    fileCountAfterChild: inventory.fileCountAfterChild,
    directoryCountAfterChild: inventory.directoryCountAfterChild,
    cleanupAttempted,
    cleanupSucceeded,
    cleanupPathMode: cleanupResult.cleanupPathMode,
    cleanupRetryCount: cleanupResult.retryCount,
    cleanupMarkerValidated: cleanupResult.markerValidated,
    cleanupExactOwnedRootValidated: cleanupResult.exactOwnedRootValidated,
    rootExistsAfterCleanup,
    ownedRootExistsAfter: rootExistsAfterCleanup,
    childStatus: childSummary.childStatus,
    childPassed: childSummary.passed,
    childExitCode: childSummary.childExitCode,
    childSignal: childSummary.childSignal,
    timedOut: childSummary.timedOut,
    configuredTimeoutMs: childSummary.timeoutMs,
    passed: childSummary.passed,
    exitCode: childSummary.exitCode,
    globalFinpleCountBefore: globalBefore.count,
    globalFinpleCountAfter: globalAfter.count,
    globalFinpleCountDelta: globalDelta,
    globalFinpleCountWarning: globalBefore.warning || globalAfter.warning,
  });
}

function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 1;
  }

  if (parsed.list) {
    printJson(Object.keys(MODE_DEFINITIONS), stdout);
    return 0;
  }

  if (!parsed.mode) {
    stderr.write("expected --mode <allowlisted-mode> or --list\n");
    return 1;
  }

  const plan = buildPlan(parsed.mode);
  if (!plan) {
    stderr.write(`unknown mode: ${parsed.mode}\n`);
    return 1;
  }

  if (parsed.plan) {
    printJson(plan, stdout);
    return 0;
  }

  const result = runGuard(parsed.mode);
  printJson(result, stdout);
  return result.exitCode || (result.ok ? 0 : 1);
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  DEFAULT_CLEANUP_MAX_RETRIES,
  DEFAULT_CLEANUP_RETRY_DELAY_MS,
  FULL_REPOSITORY_TIMEOUT_MS,
  MODE_DEFINITIONS,
  OWNED_TEMP_MARKER,
  OWNED_TEMP_PREFIX,
  TEMP_ROOT_LABEL,
  buildChildEnv,
  buildPlan,
  cleanupOwnedFinpleTempRoot,
  cleanupOwnedTempRoot,
  collectOwnedRootInventory,
  countGlobalFinpleTempEntries,
  createOwnedTempRoot,
  isDirectChildOf,
  main,
  parseArgs,
  runGuard,
  toCleanupPath,
  validateCleanupTarget,
};
