const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  FULL_REPOSITORY_TIMEOUT_MS,
  MODE_DEFINITIONS,
  OWNED_TEMP_PREFIX,
  buildChildEnv,
  buildPlan,
  countGlobalFinpleTempEntries,
  createOwnedTempRoot,
  main,
  runGuard,
  validateCleanupTarget,
} = require("./finple-test-temp-guard.cjs");

function withFixture(fn) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "guard-unit-"));
  try {
    return fn(fixture);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

test("Scenario A: owned TEMP root is under tmpdir with allowlisted prefix", () => {
  withFixture((tmpDir) => {
    const rootA = createOwnedTempRoot({ tmpDir });
    const rootB = createOwnedTempRoot({ tmpDir });
    assert.notEqual(rootA, rootB);
    assert.equal(path.dirname(rootA), tmpDir);
    assert.ok(path.basename(rootA).startsWith(OWNED_TEMP_PREFIX));
    assert.doesNotThrow(() => validateCleanupTarget(rootA, rootA, { tmpDir }));
  });
});

test("Scenario B: child environment isolates TEMP, TMP, and TMPDIR while preserving other env", () => {
  const env = buildChildEnv({ KEEP_ME: "yes", TEMP: "old" }, "owned-root");
  assert.equal(env.TEMP, "owned-root");
  assert.equal(env.TMP, "owned-root");
  assert.equal(env.TMPDIR, "owned-root");
  assert.equal(env.KEEP_ME, "yes");
});

test("Scenario C: successful child cleanup removes owned root", () => {
  withFixture((tmpDir) => {
    let childTemp = null;
    const result = runGuard("ai-ml-architecture", {
      tmpDir,
      stdio: "pipe",
      executor: (_command, _args, options) => {
        childTemp = options.env.TEMP;
        fs.writeFileSync(path.join(childTemp, "child-output.txt"), "ok");
        return { status: 0, signal: null };
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.childStatus, "passed");
    assert.equal(result.cleanupAttempted, true);
    assert.equal(result.cleanupSucceeded, true);
    assert.equal(result.rootExistsAfterCleanup, false);
    assert.equal(fs.existsSync(childTemp), false);
  });
});

test("Scenario D: failed child cleanup runs and failure is not converted to pass", () => {
  withFixture((tmpDir) => {
    const result = runGuard("ai-ml-contracts", {
      tmpDir,
      stdio: "pipe",
      executor: (_command, _args, options) => {
        fs.writeFileSync(path.join(options.env.TEMP, "failure-marker.txt"), "failed");
        return { status: 7, signal: null };
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.childStatus, "failed");
    assert.equal(result.childExitCode, 7);
    assert.equal(result.exitCode, 7);
    assert.equal(result.cleanupSucceeded, true);
    assert.equal(result.rootExistsAfterCleanup, false);
  });
});

test("Scenario E: timeout cleanup runs and timeout is failure", () => {
  withFixture((tmpDir) => {
    const result = runGuard("full-repository-diagnostic", {
      tmpDir,
      stdio: "pipe",
      executor: (_command, _args, options) => {
        assert.equal(options.timeout, FULL_REPOSITORY_TIMEOUT_MS);
        fs.writeFileSync(path.join(options.env.TEMP, "timeout-marker.txt"), "timeout");
        return { status: null, signal: "SIGTERM", error: { code: "ETIMEDOUT" } };
      },
    });
    assert.equal(result.ok, false);
    assert.equal(result.childStatus, "timed_out");
    assert.equal(result.timedOut, true);
    assert.equal(result.passed, false);
    assert.equal(result.exitCode, 124);
    assert.equal(result.cleanupSucceeded, true);
    assert.equal(result.rootExistsAfterCleanup, false);
  });
});

test("Scenario F: cleanup path rejection blocks unsafe targets", () => {
  withFixture((tmpDir) => {
    const owned = createOwnedTempRoot({ tmpDir });
    const sibling = fs.mkdtempSync(path.join(tmpDir, OWNED_TEMP_PREFIX));
    const wrongPrefix = fs.mkdtempSync(path.join(tmpDir, "wrong-prefix-"));
    assert.throws(() => validateCleanupTarget(tmpDir, tmpDir, { tmpDir }), /os tmpdir|owned root/);
    assert.throws(() => validateCleanupTarget(path.parse(tmpDir).root, path.parse(tmpDir).root, { tmpDir }), /filesystem root|owned root/);
    assert.throws(() => validateCleanupTarget(wrongPrefix, wrongPrefix, { tmpDir }), /prefix/);
    assert.throws(() => validateCleanupTarget(sibling, owned, { tmpDir }), /owned root/);
    assert.throws(() => validateCleanupTarget(process.cwd(), process.cwd(), { tmpDir }), /direct child|prefix/);
  });
});

test("Scenario G: pre-existing finple-* artifact in temp fixture is preserved", () => {
  withFixture((tmpDir) => {
    const preExisting = path.join(tmpDir, "finple-pre-existing-artifact");
    fs.mkdirSync(preExisting);
    const before = countGlobalFinpleTempEntries({ tmpDir }).count;
    const result = runGuard("ai-ml-consolidation", {
      tmpDir,
      stdio: "pipe",
      executor: () => ({ status: 0, signal: null }),
    });
    const after = countGlobalFinpleTempEntries({ tmpDir }).count;
    assert.equal(result.ok, true);
    assert.equal(fs.existsSync(preExisting), true);
    assert.equal(before, 1);
    assert.equal(after, 1);
  });
});

test("Scenario H: isolated guarded run has global count delta 0", () => {
  withFixture((tmpDir) => {
    fs.mkdirSync(path.join(tmpDir, "finple-existing-count"));
    const result = runGuard("ai-ml-all", {
      tmpDir,
      stdio: "pipe",
      executor: (_command, _args, options) => {
        fs.writeFileSync(path.join(options.env.TEMP, "owned-only.txt"), "owned");
        return { status: 0, signal: null };
      },
    });
    assert.equal(result.globalFinpleCountBefore, 1);
    assert.equal(result.globalFinpleCountAfter, 1);
    assert.equal(result.globalFinpleCountDelta, 0);
  });
});

test("Scenario I: unknown mode is rejected without cleanup attempt", () => {
  const result = runGuard("not-a-mode", { stdio: "pipe" });
  assert.equal(result.ok, false);
  assert.equal(result.status, "unknown_mode");
  assert.equal(result.cleanupAttempted, false);
  assert.equal(result.exitCode, 1);
});

test("Scenario J: plan mode prints limited metadata without temp creation", () => {
  let output = "";
  const stdout = { write: (chunk) => { output += chunk; } };
  const status = main(["--mode", "ai-ml-all", "--plan"], { stdout, stderr: { write: () => {} } });
  const parsed = JSON.parse(output);
  assert.equal(status, 0);
  assert.equal(parsed.mode, "ai-ml-all");
  assert.equal(parsed.isolationEnabled, true);
  assert.equal(parsed.globalCleanupProhibited, true);
  assert.equal(Object.hasOwn(parsed, "env"), false);
});

test("Scenario K: child exit code propagates", () => {
  withFixture((tmpDir) => {
    const result = runGuard("ai-ml-architecture", {
      tmpDir,
      stdio: "pipe",
      executor: () => ({ status: 42, signal: null }),
    });
    assert.equal(result.exitCode, 42);
    assert.equal(result.passed, false);
  });
});

test("Scenario L: command definitions and options resist mutation", () => {
  const before = JSON.stringify(MODE_DEFINITIONS);
  const plan = buildPlan("ai-ml-all");
  assert.throws(() => {
    MODE_DEFINITIONS["ai-ml-all"].args.push("mutate");
  }, /Cannot add property|object is not extensible|read only/);
  assert.equal(plan.commandLabel, "AI/ML grouped regression");
  assert.equal(JSON.stringify(MODE_DEFINITIONS), before);
});
