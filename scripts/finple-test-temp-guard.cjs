const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const OWNED_TEMP_PREFIX = "finple-test-guard-";
const TEMP_ROOT_LABEL = "finple-test-guard-owned";
const FULL_REPOSITORY_TIMEOUT_MS = 260000;

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

function createOwnedTempRoot({ tmpDir = os.tmpdir(), mkdtempSync = fs.mkdtempSync } = {}) {
  const base = path.join(tmpDir, OWNED_TEMP_PREFIX);
  return mkdtempSync(base);
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

function cleanupOwnedTempRoot(ownedRoot, { tmpDir = os.tmpdir(), rmSync = fs.rmSync } = {}) {
  const safeRoot = validateCleanupTarget(ownedRoot, ownedRoot, { tmpDir });
  rmSync(safeRoot, { recursive: true, force: true });
  return true;
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
    ownedRoot = createOwnedTempRoot({ tmpDir, mkdtempSync });
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
    const afterChild = collectOwnedRootInventory(ownedRoot);
    inventory.entryCountAfterChild = afterChild.entryCount;
    inventory.fileCountAfterChild = afterChild.fileCount;
    inventory.directoryCountAfterChild = afterChild.directoryCount;
  } finally {
    if (ownedRoot) {
      cleanupAttempted = true;
      cleanupSucceeded = cleanupOwnedTempRoot(ownedRoot, { tmpDir, rmSync });
    }
  }

  const rootExistsAfterCleanup = ownedRoot ? existsSync(ownedRoot) : false;
  const globalAfter = countGlobalFinpleTempEntries({ tmpDir });
  const globalDelta = globalBefore.ok && globalAfter.ok ? globalAfter.count - globalBefore.count : null;

  return Object.freeze({
    ok: childSummary.ok && cleanupSucceeded && rootExistsAfterCleanup === false,
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
    rootExistsAfterCleanup,
    childStatus: childSummary.childStatus,
    childExitCode: childSummary.childExitCode,
    childSignal: childSummary.childSignal,
    timedOut: childSummary.timedOut,
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
  FULL_REPOSITORY_TIMEOUT_MS,
  MODE_DEFINITIONS,
  OWNED_TEMP_PREFIX,
  TEMP_ROOT_LABEL,
  buildChildEnv,
  buildPlan,
  cleanupOwnedTempRoot,
  collectOwnedRootInventory,
  countGlobalFinpleTempEntries,
  createOwnedTempRoot,
  isDirectChildOf,
  main,
  parseArgs,
  runGuard,
  validateCleanupTarget,
};
