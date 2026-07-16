const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const {
  cpSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

const {
  CONTRACT_VERSION,
  GIT_COMMANDS,
  MAX_OUTPUT_BYTES,
  SELECTOR_PATH,
  collectMetricsCutoverRepositoryState,
  runReadOnlyGit,
} = require("./lib/metrics-cutover-repository-state-adapter.cjs");

const REPO_ROOT = path.resolve(__dirname, "..");
const SELECTOR_SOURCE = path.join(
  REPO_ROOT,
  "src/data/tickers/screenerCandidateOverlay.js",
);
const US_TARGET =
  "src/data/tickers/us_price_metrics_overlay_step114_2r_candidate.csv";
const KR_TARGET =
  "src/data/tickers/kr_price_metrics_overlay_step114_2r_candidate.csv";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function loadContracts() {
  const q = await import(
    pathToFileURL(
      path.join(
        REPO_ROOT,
        "server/src/services/metricsCutoverExecutionPackagePreflight.js",
      ),
    ).href
  );
  const p = await import(
    pathToFileURL(
      path.join(
        REPO_ROOT,
        "server/src/services/metricsFinalApprovalCutoverRehearsal.js",
      ),
    ).href
  );
  return {
    hashMetricsTrackedPaths: q.hashMetricsTrackedPaths,
    selectorProvenanceCommitSha: q.METRICS_SELECTOR_PROVENANCE_COMMIT_SHA,
    policyVersion: q.METRICS_CUTOVER_EXECUTION_POLICY_CONTRACT_VERSION,
    repositoryPreimageVersion: q.METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION,
    targetPathAbsenceEvidenceVersion:
      q.METRICS_TARGET_PATH_ABSENCE_EVIDENCE_CONTRACT_VERSION,
    hashTargetPathAbsenceEvidence:
      q.hashMetricsTargetPathAbsenceEvidence,
    currentPointerSnapshot: p.getMetricsCurrentPointerSnapshot(),
    evaluate2Q: q.evaluateMetricsCutoverExecutionPackagePreflight,
  };
}

function createWorkspace(t, contracts) {
  const root = mkdtempSync(path.join(os.tmpdir(), "finple-step114-2r-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const tickers = path.join(root, "src/data/tickers");
  mkdirSync(tickers, { recursive: true });
  cpSync(SELECTOR_SOURCE, path.join(tickers, "screenerCandidateOverlay.js"));
  for (const component of contracts.currentPointerSnapshot.components) {
    const target = path.join(root, ...component.path.split("/"));
    mkdirSync(path.dirname(target), { recursive: true });
    if (!lstatExists(target)) writeFileSync(target, "synthetic\n");
  }
  return root;
}

function lstatExists(value) {
  try {
    lstatSync(value);
    return true;
  } catch {
    return false;
  }
}

function defaultTrackedPaths(contracts) {
  return [
    contracts.currentPointerSnapshot.selector.path,
    ...contracts.currentPointerSnapshot.components.map((item) => item.path),
  ];
}

function nul(values) {
  return Buffer.from(`${values.join("\0")}\0`, "utf8");
}

function fakeState(root, contracts, overrides = {}) {
  return {
    root,
    head: "a".repeat(40),
    tree: "b".repeat(40),
    branch: "review/step114-2r",
    status: Buffer.alloc(0),
    tracked: defaultTrackedPaths(contracts),
    ...overrides,
  };
}

function makeRunGit(state, calls = []) {
  const counts = new Map();
  return (_executable, args, cwd) => {
    calls.push({ args: [...args], cwd });
    const key = JSON.stringify(args);
    const count = counts.get(key) || 0;
    counts.set(key, count + 1);
    const select = (value) =>
      Array.isArray(value) && value.length === 2 && Buffer.isBuffer(value[0])
        ? value[Math.min(count, 1)]
        : value;
    if (state.failKey === key) {
      return { ok: false, issue: state.failIssue || "git_command_nonzero_exit" };
    }
    let stdout;
    if (key === JSON.stringify(["rev-parse", "--show-toplevel"])) {
      stdout = select(state.rootBytes) || Buffer.from(`${state.root}\n`);
    } else if (key === JSON.stringify(["rev-parse", "HEAD"])) {
      stdout = select(state.headBytes) || Buffer.from(`${state.head}\n`);
    } else if (key === JSON.stringify(["rev-parse", "HEAD^{tree}"])) {
      stdout = select(state.treeBytes) || Buffer.from(`${state.tree}\n`);
    } else if (
      key === JSON.stringify(["symbolic-ref", "--quiet", "--short", "HEAD"])
    ) {
      if (state.detached) {
        return { ok: false, issue: "git_command_nonzero_exit" };
      }
      stdout = select(state.branchBytes) || Buffer.from(`${state.branch}\n`);
    } else if (
      key ===
      JSON.stringify([
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
      ])
    ) {
      stdout = select(state.statusBytes) || state.status;
    } else if (key === JSON.stringify(["ls-files", "-z"])) {
      stdout = select(state.trackedBytes) || nul(state.tracked);
    } else {
      return { ok: false, issue: "git_command_not_allowlisted" };
    }
    return { ok: true, stdout };
  };
}

async function evaluateFake(t, overrides = {}, adapterOverrides = {}) {
  const contracts = await loadContracts();
  const root = createWorkspace(t, contracts);
  const state = fakeState(root, contracts, overrides);
  const calls = [];
  const result = await collectMetricsCutoverRepositoryState(
    {
      repo: root,
      usTarget: adapterOverrides.usTarget || US_TARGET,
      krTarget: adapterOverrides.krTarget || KR_TARGET,
    },
    {
      contracts,
      runGit: adapterOverrides.runGit || makeRunGit(state, calls),
      fs: adapterOverrides.fs,
    },
  );
  return { result, calls, contracts, root, state };
}

function assertFixedFalse(result) {
  for (const field of [
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
  ]) {
    assert.equal(result[field], false, field);
  }
}

function assertSuppressed(result) {
  assert.deepEqual(result.repositoryPreimage, {});
  assert.deepEqual(result.trustedOptions, {});
  assert.deepEqual(result.executionPolicy, {});
  assert.deepEqual(result.targetPathAbsenceEvidence, {});
  assert.equal(result.selectorContentBase64, "");
  assert.deepEqual(result.trackedPaths, []);
}

function runGitSetup(root, args) {
  const result = spawnSync("git", args, {
    cwd: root,
    shell: false,
    encoding: "utf8",
    timeout: 10_000,
  });
  assert.equal(result.status, 0, `${args.join(" ")}: ${result.stderr}`);
}

function createIntegrationRepository(t, contracts) {
  const root = createWorkspace(t, contracts);
  runGitSetup(root, ["init"]);
  runGitSetup(root, ["config", "user.email", "synthetic@example.invalid"]);
  runGitSetup(root, ["config", "user.name", "Synthetic Test"]);
  runGitSetup(root, ["add", "."]);
  runGitSetup(root, ["commit", "-m", "synthetic repository"]);
  runGitSetup(root, ["branch", "-M", "main"]);
  return root;
}

test("stable clean isolated Git repository returns ready", async (t) => {
  const contracts = await loadContracts();
  const root = createIntegrationRepository(t, contracts);
  const result = await collectMetricsCutoverRepositoryState({
    repo: root,
    usTarget: US_TARGET,
    krTarget: KR_TARGET,
  });
  assert.equal(result.status, "ready");
  assert.equal(result.contractVersion, CONTRACT_VERSION);
  assert.equal(result.repositoryStateStable, true);
  assert.equal(result.worktreeClean, true);
  assert.equal(result.targetPathsAbsent, true);
  assert.equal(
    result.targetPathAbsenceEvidence.contractVersion,
    contracts.targetPathAbsenceEvidenceVersion,
  );
  assert.equal(
    result.targetPathAbsenceEvidence.evidenceHash,
    contracts.hashTargetPathAbsenceEvidence(
      result.targetPathAbsenceEvidence,
    ),
  );
  assert.deepEqual(
    result.targetPathAbsenceEvidence.targets.map((target) => ({
      role: target.role,
      path: target.path,
      tracked: target.tracked,
      absentAtStart: target.absentAtStart,
      absentAtEnd: target.absentAtEnd,
      symlink: target.symlink,
      directory: target.directory,
    })),
    [
      {
        role: "us_price_metrics",
        path: US_TARGET,
        tracked: false,
        absentAtStart: true,
        absentAtEnd: true,
        symlink: false,
        directory: false,
      },
      {
        role: "kr_price_metrics",
        path: KR_TARGET,
        tracked: false,
        absentAtStart: true,
        absentAtEnd: true,
        symlink: false,
        directory: false,
      },
    ],
  );
  assert.equal(
    result.trackedPathsSha256,
    contracts.hashMetricsTrackedPaths(result.trackedPaths),
  );
  assertFixedFalse(result);
});

test("result is deterministic and normalized", async (t) => {
  const first = await evaluateFake(t);
  const second = await collectMetricsCutoverRepositoryState(
    { repo: first.root, usTarget: US_TARGET, krTarget: KR_TARGET },
    {
      contracts: first.contracts,
      runGit: makeRunGit(first.state),
    },
  );
  assert.deepEqual(first.result, second);
});

test("complete idle result suppresses compatibility objects", async () => {
  const result = await collectMetricsCutoverRepositoryState({});
  assert.equal(result.status, "idle");
  assertSuppressed(result);
  assertFixedFalse(result);
});

test("Git subprocess boundary uses exact no-shell argument arrays", () => {
  const invocations = [];
  const spawn = (executable, args, options) => {
    invocations.push({ executable, args, options });
    return { status: 0, signal: null, stdout: Buffer.from("ok\n"), stderr: Buffer.alloc(0) };
  };
  const result = runReadOnlyGit(
    "git",
    ["rev-parse", "HEAD"],
    "C:\\repo",
    { spawn },
  );
  assert.equal(result.ok, true);
  assert.deepEqual(invocations[0].args, ["rev-parse", "HEAD"]);
  assert.equal(invocations[0].options.cwd, "C:\\repo");
  assert.equal(invocations[0].options.shell, false);
  assert.equal(invocations[0].options.encoding, null);
  assert.equal(typeof invocations[0].options.timeout, "number");
  assert.equal(typeof invocations[0].options.maxBuffer, "number");
});

test("all collected Git commands are read-only allowlisted arrays", async (t) => {
  const { result, calls } = await evaluateFake(t);
  assert.equal(result.status, "ready");
  assert.equal(calls.length, 12);
  for (const call of calls) {
    assert.equal(
      GIT_COMMANDS.some((allowed) => JSON.stringify(allowed) === JSON.stringify(call.args)),
      true,
    );
    assert.equal(typeof call.cwd, "string");
  }
});

test("subprocess failures and oversized output fail closed", async (t) => {
  for (const [name, spawnResult, expected] of [
    ["timeout", { status: null, signal: null, error: { code: "ETIMEDOUT" }, stdout: Buffer.alloc(0) }, "timeout"],
    ["nonzero", { status: 1, signal: null, stdout: Buffer.alloc(0) }, "nonzero"],
    ["signal", { status: null, signal: "SIGTERM", stdout: Buffer.alloc(0) }, "signal"],
    ["runtime", { status: null, signal: null, error: { code: "EACCES" }, stdout: Buffer.alloc(0) }, "runtime"],
    ["oversized", { status: 0, signal: null, stdout: Buffer.alloc(9) }, "too_large"],
  ]) {
    await t.test(name, () => {
      const result = runReadOnlyGit("git", ["rev-parse", "HEAD"], ".", {
        spawn: () => spawnResult,
        maxOutputBytes: name === "oversized" ? 8 : MAX_OUTPUT_BYTES,
      });
      assert.equal(result.ok, false);
      assert.match(result.issue, new RegExp(expected));
    });
  }
});

test("invalid UTF-8, not repository, and root mismatch block", async (t) => {
  await t.test("invalid UTF-8", async () => {
    const { result } = await evaluateFake(t, {
      trackedBytes: Buffer.from([0xff, 0x00]),
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /invalid_utf8/);
  });
  await t.test("not repository", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    const state = fakeState(root, contracts, {
      failKey: JSON.stringify(["rev-parse", "--show-toplevel"]),
    });
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(state) },
    );
    assert.equal(result.status, "blocked");
  });
  await t.test("root mismatch", async () => {
    const { result } = await evaluateFake(t, {
      root: path.join(os.tmpdir(), "different-repository"),
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /root/);
  });
});

test("supplied root symlink and selector path escape block", async (t) => {
  await t.test("supplied root symlink", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    const baseFs = { lstatSync, readFileSync, realpathSync };
    const symlinkFs = {
      ...baseFs,
      lstatSync(value) {
        if (path.resolve(value) === path.resolve(root)) {
          return { isDirectory: () => true, isSymbolicLink: () => true };
        }
        return baseFs.lstatSync(value);
      },
    };
    const state = fakeState(root, contracts);
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(state), fs: symlinkFs },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /canonical_directory/);
  });
  await t.test("selector path escape", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    const selector = path.join(root, SELECTOR_PATH);
    const fs = {
      lstatSync,
      readFileSync,
      realpathSync(value) {
        if (path.resolve(value) === path.resolve(selector)) {
          return path.join(os.tmpdir(), "selector-outside-repository.js");
        }
        return realpathSync(value);
      },
    };
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)), fs },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /selector_path_escape/);
  });
});

test("detached or changing HEAD, tree, and branch block", async (t) => {
  for (const [name, override, pattern] of [
    ["detached", { detached: true }, /detached|nonzero/],
    [
      "HEAD",
      {
        headBytes: [
          Buffer.from(`${"a".repeat(40)}\n`),
          Buffer.from(`${"c".repeat(40)}\n`),
        ],
      },
      /head_changed/,
    ],
    [
      "tree",
      {
        treeBytes: [
          Buffer.from(`${"b".repeat(40)}\n`),
          Buffer.from(`${"d".repeat(40)}\n`),
        ],
      },
      /tree_changed/,
    ],
    [
      "branch",
      {
        branchBytes: [
          Buffer.from("review/one\n"),
          Buffer.from("review/two\n"),
        ],
      },
      /branch_changed/,
    ],
  ]) {
    await t.test(name, async () => {
      const { result } = await evaluateFake(t, override);
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), pattern);
      assertSuppressed(result);
    });
  }
  await t.test("malformed branch", async () => {
    const { result } = await evaluateFake(t, {
      branch: "review branch",
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /branch_invalid/);
  });
});

test("final Git state is collected after second filesystem observations", async (t) => {
  for (const [name, mutateState, pattern] of [
    [
      "HEAD changes during second selector observation",
      (state) => {
        state.head = "c".repeat(40);
      },
      /repository_head_changed/,
    ],
    [
      "worktree changes during second selector observation",
      (state) => {
        state.status = Buffer.from("?? changed-during-observation\0");
      },
      /worktree_status_changed|worktree_not_clean/,
    ],
  ]) {
    await t.test(name, async () => {
      const contracts = await loadContracts();
      const root = createWorkspace(t, contracts);
      const state = fakeState(root, contracts);
      let selectorStats = 0;
      const fs = {
        readFileSync,
        realpathSync,
        lstatSync(value) {
          if (
            path.resolve(value) ===
            path.resolve(path.join(root, SELECTOR_PATH))
          ) {
            selectorStats += 1;
            if (selectorStats === 2) mutateState(state);
          }
          return lstatSync(value);
        },
      };
      const result = await collectMetricsCutoverRepositoryState(
        { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
        { contracts, runGit: makeRunGit(state), fs },
      );
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), pattern);
      assertSuppressed(result);
    });
  }
});

test("dirty tracked, staged, untracked, rename, conflict, and deletion block", async (t) => {
  for (const [name, status] of [
    ["tracked", " M src/file.js"],
    ["staged", "M  src/file.js"],
    ["untracked", "?? src/new.js"],
    ["rename", "R  src/old.js\0src/new.js"],
    ["conflict", "UU src/file.js"],
    ["deletion", " D src/file.js"],
  ]) {
    await t.test(name, async () => {
      const bytes = Buffer.from(`${status}\0`, "utf8");
      const { result } = await evaluateFake(t, { status: bytes });
      assert.equal(result.status, "blocked");
      assert.equal(result.worktreeClean, false);
      assert.equal(result.blockingIssues.includes("worktree_not_clean"), true);
      assertSuppressed(result);
    });
  }
});

test("changing and malformed worktree status block", async (t) => {
  await t.test("changing", async () => {
    const { result } = await evaluateFake(t, {
      statusBytes: [Buffer.alloc(0), Buffer.from("?? changed\0")],
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /status_changed/);
  });
  await t.test("malformed", async () => {
    const { result } = await evaluateFake(t, {
      status: Buffer.from("?? missing-nul"),
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /terminal_nul/);
  });
});

test("tracked inventory validation and stability fail closed", async (t) => {
  await t.test("malformed terminal NUL", async () => {
    const { result } = await evaluateFake(t, {
      trackedBytes: Buffer.from("src/file.js"),
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /terminal_nul/);
  });
  await t.test("duplicate", async () => {
    const contracts = await loadContracts();
    const paths = defaultTrackedPaths(contracts);
    const { result } = await evaluateFake(t, {
      tracked: [...paths, paths[0]],
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /duplicate/);
  });
  await t.test("traversal", async () => {
    const contracts = await loadContracts();
    const { result } = await evaluateFake(t, {
      tracked: [...defaultTrackedPaths(contracts), "../escape"],
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /tracked_path_invalid/);
  });
  await t.test("reordered equivalent", async () => {
    const contracts = await loadContracts();
    const paths = defaultTrackedPaths(contracts);
    const { result } = await evaluateFake(t, {
      trackedBytes: [nul(paths), nul([...paths].reverse())],
    });
    assert.equal(result.status, "ready");
  });
  await t.test("changing inventory", async () => {
    const contracts = await loadContracts();
    const paths = defaultTrackedPaths(contracts);
    const { result } = await evaluateFake(t, {
      trackedBytes: [nul(paths), nul([...paths, "src/extra.csv"])],
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /inventory_changed/);
  });
});

test("selector missing, symlink, directory, hash mismatch, and changing reads block", async (t) => {
  await t.test("missing", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    rmSync(path.join(root, SELECTOR_PATH));
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)) },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /selector_path_missing/);
  });
  await t.test("symlink", async () => {
    const { result } = await evaluateFake(t, {}, {
      fs: {
        lstatSync(value) {
          if (String(value).endsWith("screenerCandidateOverlay.js")) {
            return { isSymbolicLink: () => true, isFile: () => false };
          }
          return lstatSync(value);
        },
        readFileSync,
        realpathSync,
      },
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /selector_path_symlink/);
  });
  await t.test("directory", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    const selector = path.join(root, SELECTOR_PATH);
    rmSync(selector);
    mkdirSync(selector);
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)) },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /not_regular_file/);
  });
  await t.test("hash mismatch", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    writeFileSync(path.join(root, SELECTOR_PATH), "changed\n");
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)) },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /sha256_mismatch/);
  });
  await t.test("changes between reads", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    const original = readFileSync(path.join(root, SELECTOR_PATH));
    let reads = 0;
    const fs = {
      lstatSync,
      realpathSync,
      readFileSync(value) {
        if (String(value).endsWith("screenerCandidateOverlay.js")) {
          reads += 1;
          return reads === 1 ? original : Buffer.from(`${original}changed`);
        }
        return readFileSync(value);
      },
    };
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)), fs },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /selector_changed/);
  });
  await t.test("becomes symlink after first read", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    const selector = path.join(root, SELECTOR_PATH);
    let selectorStats = 0;
    const fs = {
      readFileSync,
      realpathSync,
      lstatSync(value) {
        if (path.resolve(value) === path.resolve(selector)) {
          selectorStats += 1;
          if (selectorStats === 2) {
            return { isSymbolicLink: () => true, isFile: () => false };
          }
        }
        return lstatSync(value);
      },
    };
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)), fs },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /selector_second_path_symlink/);
  });
});

test("target tracked, existing file, directory, duplicate, malformed, and appearing targets block", async (t) => {
  await t.test("tracked", async () => {
    const contracts = await loadContracts();
    const { result } = await evaluateFake(t, {
      tracked: [...defaultTrackedPaths(contracts), US_TARGET],
    });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_path_tracked/);
  });
  for (const name of ["ignored existing", "untracked existing"]) {
    await t.test(name, async () => {
      const contracts = await loadContracts();
      const root = createWorkspace(t, contracts);
      writeFileSync(path.join(root, US_TARGET), "collision\n");
      const result = await collectMetricsCutoverRepositoryState(
        { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
        { contracts, runGit: makeRunGit(fakeState(root, contracts)) },
      );
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), /target_exists/);
    });
  }
  await t.test("directory", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    mkdirSync(path.join(root, US_TARGET));
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)) },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_directory/);
  });
  await t.test("symlink", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    const target = path.join(root, US_TARGET);
    const fs = {
      readFileSync,
      realpathSync,
      lstatSync(value) {
        if (path.resolve(value) === path.resolve(target)) {
          return {
            isSymbolicLink: () => true,
            isDirectory: () => false,
            isFile: () => false,
          };
        }
        return lstatSync(value);
      },
    };
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)), fs },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_symlink/);
  });
  await t.test("parent path escape", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    const targetParent = path.dirname(path.join(root, US_TARGET));
    const fs = {
      lstatSync,
      readFileSync,
      realpathSync(value) {
        if (path.resolve(value) === path.resolve(targetParent)) {
          return path.join(os.tmpdir(), "target-parent-outside-repository");
        }
        return realpathSync(value);
      },
    };
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)), fs },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_parent_invalid/);
  });
  await t.test("duplicate", async () => {
    const { result } = await evaluateFake(t, {}, { krTarget: US_TARGET });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_paths_invalid/);
  });
  await t.test("case-only identity collision", async () => {
    const { result } = await evaluateFake(
      t,
      {},
      {
        usTarget: "src/data/tickers/Future_Target.csv",
        krTarget: "src/data/tickers/future_target.csv",
      },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_paths_invalid/);
    assertSuppressed(result);
  });
  await t.test("Unicode normalization identity collision", async () => {
    const { result } = await evaluateFake(
      t,
      {},
      {
        usTarget: "src/data/tickers/métrics_target.csv",
        krTarget: "src/data/tickers/me\u0301trics_target.csv",
      },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_paths_invalid/);
    assertSuppressed(result);
  });
  await t.test("clearly distinct target identities remain ready", async () => {
    const { result } = await evaluateFake(t);
    assert.equal(result.status, "ready");
  });
  await t.test("malformed", async () => {
    const { result } = await evaluateFake(t, {}, { usTarget: "../bad.csv" });
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_paths_invalid/);
  });
  await t.test("appears during collection", async () => {
    const contracts = await loadContracts();
    const root = createWorkspace(t, contracts);
    const target = path.join(root, US_TARGET);
    let targetChecks = 0;
    const fs = {
      readFileSync,
      realpathSync,
      lstatSync(value) {
        if (path.resolve(value) === path.resolve(target)) {
          targetChecks += 1;
          if (targetChecks === 1) {
            const error = new Error("missing");
            error.code = "ENOENT";
            throw error;
          }
          return {
            isSymbolicLink: () => false,
            isDirectory: () => false,
            isFile: () => true,
          };
        }
        return lstatSync(value);
      },
    };
    const result = await collectMetricsCutoverRepositoryState(
      { repo: root, usTarget: US_TARGET, krTarget: KR_TARGET },
      { contracts, runGit: makeRunGit(fakeState(root, contracts)), fs },
    );
    assert.equal(result.status, "blocked");
    assert.match(result.blockingIssues.join("\n"), /target_absence_changed|target_exists/);
  });
});

test("ready compatibility objects match Step 114-2Q repository contract", async (t) => {
  const { result, contracts } = await evaluateFake(t);
  assert.equal(result.status, "ready");
  assert.equal(
    result.repositoryPreimage.selectorProvenanceCommitSha,
    result.trustedOptions.expectedSelectorProvenanceCommitSha,
  );
  assert.equal(
    result.repositoryPreimage.repositoryHeadSha,
    result.executionPolicy.expectedRepositoryHeadSha,
  );
  assert.equal(
    result.repositoryPreimage.repositoryTreeSha,
    result.trustedOptions.expectedRepositoryTreeSha,
  );
  assert.equal(
    result.repositoryPreimage.trackedPathsSha256,
    result.executionPolicy.expectedTrackedPathsSha256,
  );
  assert.equal(
    result.targetPathAbsenceEvidence.evidenceHash,
    result.repositoryPreimage.targetPathAbsenceEvidenceHash,
  );
  assert.equal(
    result.targetPathAbsenceEvidence.evidenceHash,
    result.trustedOptions.expectedTargetPathAbsenceEvidenceHash,
  );
  assert.equal(
    result.targetPathAbsenceEvidence.evidenceHash,
    result.executionPolicy.expectedTargetPathAbsenceEvidenceHash,
  );
  const qResult = contracts.evaluate2Q(
    {
      finalApprovalInput: {},
      targetPathAbsenceEvidence:
        result.targetPathAbsenceEvidence,
      repositoryPreimage: result.repositoryPreimage,
      executionPolicy: result.executionPolicy,
      proposedSelector: {},
    },
    result.trustedOptions,
  );
  assert.equal(qResult.repositoryPreimageVerified, true);
  assert.equal(
    qResult.blockingIssues.some((issue) =>
      /trusted_|repository_preimage_(repository|tracked|branch|selector_provenance)/.test(issue),
    ),
    false,
  );
});

test("blocked JSON suppresses selector bytes and reusable compatibility objects", async (t) => {
  const { result } = await evaluateFake(t, {
    status: Buffer.from("?? untracked\0"),
  });
  assert.equal(result.status, "blocked");
  assertSuppressed(result);
  assert.equal(JSON.stringify(result).includes("selectorContentBase64\":\""), true);
  assertFixedFalse(result);
});

test("CLI emits one JSON document and uses documented exit codes", async (t) => {
  const contracts = await loadContracts();
  const root = createIntegrationRepository(t, contracts);
  const cli = path.join(__dirname, "collect-metrics-cutover-repository-state.cjs");
  const ready = spawnSync(
    process.execPath,
    [
      cli,
      "--repo",
      root,
      "--us-target",
      US_TARGET,
      "--kr-target",
      KR_TARGET,
    ],
    {
      cwd: root,
      shell: false,
      encoding: "utf8",
      timeout: 30_000,
    },
  );
  assert.equal(ready.status, 0, ready.stderr);
  assert.equal(ready.stderr, "");
  assert.equal(ready.stdout.trim().split(/\r?\n/).length, 1);
  assert.equal(JSON.parse(ready.stdout).status, "ready");

  writeFileSync(path.join(root, "untracked.txt"), "dirty\n");
  const blocked = spawnSync(
    process.execPath,
    [
      cli,
      "--repo",
      root,
      "--us-target",
      US_TARGET,
      "--kr-target",
      KR_TARGET,
    ],
    {
      cwd: root,
      shell: false,
      encoding: "utf8",
      timeout: 30_000,
    },
  );
  assert.equal(blocked.status, 1, blocked.stderr);
  assert.equal(blocked.stdout.trim().split(/\r?\n/).length, 1);
  assert.equal(JSON.parse(blocked.stdout).status, "blocked");

  const invalid = spawnSync(process.execPath, [cli, "--repo", root], {
    cwd: root,
    shell: false,
    encoding: "utf8",
    timeout: 30_000,
  });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /invalid invocation/);
  assert.equal(invalid.stdout.trim().split(/\r?\n/).length, 1);
  assert.equal(JSON.parse(invalid.stdout).status, "idle");
});

test("production adapter contains no write, Git mutation, network, DB, or provider calls", () => {
  const source = [
    "metrics-cutover-repository-state-adapter.cjs",
    "metrics-target-path-identity.cjs",
  ]
    .map((file) =>
      readFileSync(path.join(__dirname, "lib", file), "utf8"),
    )
    .join("\n");
  for (const forbidden of [
    "writeFile",
    "appendFile",
    "rename(",
    "unlink(",
    "rm(",
    "mkdir",
    "chmod",
    "chown",
    "symlinkSync(",
    ".symlink(",
    "shell: true",
    "fetch(",
    "https:",
    "database",
    "provider",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  for (const command of [
    "fetch",
    "pull",
    "add",
    "commit",
    "push",
    "checkout",
    "switch",
    "reset",
    "clean",
    "gc",
    "update-index",
    "apply",
    "restore",
    "merge",
    "rebase",
  ]) {
    assert.equal(
      GIT_COMMANDS.some((args) => args[0] === command),
      false,
      command,
    );
  }
});
