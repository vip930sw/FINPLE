const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  DEFAULT_CLEANUP_MAX_RETRIES,
  FULL_REPOSITORY_TIMEOUT_MS,
  MODE_DEFINITIONS,
  OWNED_TEMP_MARKER,
  OWNED_TEMP_PREFIX,
  buildChildEnv,
  buildPlan,
  cleanupOwnedFinpleTempRoot,
  countGlobalFinpleTempEntries,
  createOwnedTempRoot,
  main,
  runGuard,
  toCleanupPath,
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

function makeDeepDirectory(root) {
  let current = root;
  for (let index = 0; index < 18; index += 1) {
    current = path.join(current, `deep-segment-${index}-abcdefghijklmnopqrstuvwxyz`);
    fs.mkdirSync(process.platform === "win32" ? path.toNamespacedPath(current) : current);
  }
  const filePath = path.join(current, "deep-file.txt");
  fs.writeFileSync(process.platform === "win32" ? path.toNamespacedPath(filePath) : filePath, "deep");
  return filePath;
}

test("Scenario A: owned TEMP root is under tmpdir with allowlisted prefix", () => {
  withFixture((tmpDir) => {
    const rootA = createOwnedTempRoot({ tmpDir });
    const rootB = createOwnedTempRoot({ tmpDir });
    assert.notEqual(rootA, rootB);
    assert.equal(path.dirname(rootA), tmpDir);
    assert.ok(path.basename(rootA).startsWith(OWNED_TEMP_PREFIX));
    assert.equal(fs.existsSync(path.join(rootA, OWNED_TEMP_MARKER)), true);
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
    assert.equal(result.cleanupMarkerValidated, true);
    assert.equal(result.cleanupExactOwnedRootValidated, true);
    assert.equal(result.ownedRootExistsAfter, false);
    assert.equal(result.globalFinpleCountDelta, 0);
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
    assert.equal(result.ownedRootExistsAfter, false);
    assert.equal(result.configuredTimeoutMs, FULL_REPOSITORY_TIMEOUT_MS);
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

test("Scenario M: shallow owned root cleanup helper removes marked root", () => {
  withFixture((tmpDir) => {
    const owned = createOwnedTempRoot({ tmpDir });
    fs.writeFileSync(path.join(owned, "owned-file.txt"), "owned");

    const result = cleanupOwnedFinpleTempRoot(owned, { tmpDir, retryDelayMs: 0 });

    assert.equal(result.attempted, true);
    assert.equal(result.cleanupSucceeded, true);
    assert.equal(result.ownedRootExistsAfter, false);
    assert.equal(result.markerValidated, true);
    assert.equal(result.exactOwnedRootValidated, true);
    assert.equal(result.retryCount, 0);
    assert.equal(result.cleanupPathMode, process.platform === "win32" ? "windows_namespaced" : "standard");
  });
});

test("Scenario N: deep nested owned root cleanup uses long-path safe removal", () => {
  withFixture((tmpDir) => {
    const owned = createOwnedTempRoot({ tmpDir });
    const deepFile = makeDeepDirectory(owned);
    assert.equal(fs.existsSync(process.platform === "win32" ? path.toNamespacedPath(deepFile) : deepFile), true);

    const result = cleanupOwnedFinpleTempRoot(owned, { tmpDir, retryDelayMs: 0 });

    assert.equal(result.cleanupSucceeded, true);
    assert.equal(result.ownedRootExistsAfter, false);
    assert.equal(fs.existsSync(owned), false);
    assert.equal(toCleanupPath(owned), process.platform === "win32" ? path.toNamespacedPath(owned) : owned);
  });
});

test("Scenario O: marker missing rejects cleanup without deleting root", () => {
  withFixture((tmpDir) => {
    const unsafe = fs.mkdtempSync(path.join(tmpDir, OWNED_TEMP_PREFIX));
    fs.writeFileSync(path.join(unsafe, "keep.txt"), "keep");

    const result = cleanupOwnedFinpleTempRoot(unsafe, { tmpDir, retryDelayMs: 0 });

    assert.equal(result.cleanupSucceeded, false);
    assert.equal(result.markerValidated, false);
    assert.equal(result.ownedRootExistsAfter, true);
    assert.equal(fs.existsSync(unsafe), true);
  });
});

test("Scenario P: unsafe cleanup targets are rejected", () => {
  withFixture((tmpDir) => {
    const owned = createOwnedTempRoot({ tmpDir });
    const arbitrary = fs.mkdtempSync(path.join(tmpDir, OWNED_TEMP_PREFIX));
    fs.writeFileSync(path.join(arbitrary, OWNED_TEMP_MARKER), "owned\n");

    assert.throws(() => validateCleanupTarget(tmpDir, tmpDir, { tmpDir }), /os tmpdir|owned root/);
    assert.throws(() => validateCleanupTarget(process.cwd(), process.cwd(), { tmpDir }), /direct child|prefix/);
    assert.throws(() => validateCleanupTarget(path.parse(tmpDir).root, path.parse(tmpDir).root, { tmpDir }), /filesystem root|owned root/);

    const wrongRoot = cleanupOwnedFinpleTempRoot(arbitrary, {
      tmpDir,
      expectedOwnedRoot: owned,
      retryDelayMs: 0,
    });
    assert.equal(wrongRoot.cleanupSucceeded, false);
    assert.equal(wrongRoot.exactOwnedRootValidated, false);
    assert.equal(fs.existsSync(arbitrary), true);
  });
});

test("Scenario Q: cleanup retry succeeds after controlled transient failure", () => {
  withFixture((tmpDir) => {
    const owned = createOwnedTempRoot({ tmpDir });
    let attempts = 0;
    const result = cleanupOwnedFinpleTempRoot(owned, {
      tmpDir,
      retryDelayMs: 0,
      rmSync: (cleanupPath, options) => {
        attempts += 1;
        if (attempts === 1) throw new Error("controlled");
        fs.rmSync(cleanupPath, options);
      },
      wait: () => {},
    });

    assert.equal(result.cleanupSucceeded, true);
    assert.equal(result.retryCount, 1);
    assert.equal(result.ownedRootExistsAfter, false);
    assert.equal(attempts, 2);
  });
});

test("Scenario R: permanent cleanup failure is not converted to success", () => {
  withFixture((tmpDir) => {
    const owned = createOwnedTempRoot({ tmpDir });
    const result = cleanupOwnedFinpleTempRoot(owned, {
      tmpDir,
      maxRetries: 2,
      retryDelayMs: 0,
      rmSync: () => {
        throw new Error("controlled");
      },
      wait: () => {},
    });

    assert.equal(result.cleanupSucceeded, false);
    assert.equal(result.retryCount, 2);
    assert.equal(result.ownedRootExistsAfter, true);
    assert.equal(fs.existsSync(owned), true);
  });
});

test("Scenario S: timeout result remains failed even when cleanup succeeds", () => {
  withFixture((tmpDir) => {
    const result = runGuard("full-repository-diagnostic", {
      tmpDir,
      stdio: "pipe",
      executor: (_command, _args, options) => {
        fs.writeFileSync(path.join(options.env.TEMP, "timeout-output.txt"), "timeout");
        return { status: null, signal: "SIGTERM", error: { code: "ETIMEDOUT" } };
      },
    });

    assert.equal(result.timedOut, true);
    assert.equal(result.childPassed, false);
    assert.equal(result.cleanupAttempted, true);
    assert.equal(result.cleanupSucceeded, true);
    assert.equal(result.ownedRootExistsAfter, false);
    assert.equal(result.globalFinpleCountDelta, 0);
    assert.equal(result.ok, false);
    assert.equal(result.passed, false);
  });
});

test("Scenario T: cleanup failure keeps overall guard result failed", () => {
  withFixture((tmpDir) => {
    const result = runGuard("ai-ml-architecture", {
      tmpDir,
      stdio: "pipe",
      executor: () => ({ status: 0, signal: null }),
      cleanup: (ownedRoot) => Object.freeze({
        attempted: true,
        cleanupPathMode: "standard",
        cleanupSucceeded: false,
        ownedRootExistsAfter: true,
        retryCount: DEFAULT_CLEANUP_MAX_RETRIES,
        markerValidated: true,
        exactOwnedRootValidated: true,
        redacted: true,
      }),
    });

    assert.equal(result.childPassed, true);
    assert.equal(result.cleanupSucceeded, false);
    assert.equal(result.ownedRootExistsAfter, true);
    assert.equal(result.ok, false);
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
