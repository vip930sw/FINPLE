const assert = require("node:assert/strict");
const {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const { spawnSync } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { pathToFileURL } = require("node:url");

const {
  INPUT_CONTRACT_VERSION,
  MAX_INPUT_BYTES,
  parseMetricsCutoverPostMergeBundleBytes,
  readMetricsCutoverPostMergeBundle,
} = require("./lib/metrics-cutover-post-merge-dry-run-input.cjs");
const {
  DRY_RUN_CONTRACT_VERSION,
  runMetricsCutoverPostMergeDryRun,
} = require("./lib/metrics-cutover-post-merge-dry-run.cjs");
const { runCli } = require("./run-metrics-cutover-post-merge-dry-run.cjs");
const {
  buildRealSyntheticOperatorBundle,
  createIsolatedMetricsRepository,
} = require("./test-support/metrics-cutover-post-merge-real-fixture.cjs");

const REPO_ROOT = path.resolve(__dirname, "..");
const HEAD = "a".repeat(40);
const TREE = "b".repeat(40);
const TRACKED_HASH = "c".repeat(64);
const EVIDENCE_HASH = "d".repeat(64);
const PACKAGE_HASH = "e".repeat(64);
const SELECTOR_PREIMAGE_HASH = "f".repeat(64);
const SELECTOR_POSTIMAGE_HASH = "1".repeat(64);
const REHEARSAL_HASH = "2".repeat(64);
const CANDIDATE_HASH = "3".repeat(64);
const ZIP_HASH = "4".repeat(64);
const BRANCH = "review/step114-2s";
const US_TARGET = "src/data/tickers/future_us_target.csv";
const KR_TARGET = "src/data/tickers/future_kr_target.csv";

function tempDirectory(t) {
  const root = mkdtempSync(
    path.join(os.tmpdir(), "finple-step114-2s-"),
  );
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function syntheticBundle(overrides = {}) {
  return {
    contractVersion: INPUT_CONTRACT_VERSION,
    expectedRepositoryHeadSha: HEAD,
    requiredBranchName: BRANCH,
    evaluationNow: "2026-07-17T00:00:00.000Z",
    finalApprovalInput: {
      candidatePackageId: "candidate-step114-2s-synthetic",
      productionApprovalReceipt: {
        receiptId: "synthetic-production-receipt",
        signerKeyId: "synthetic-production-key",
        signerId: "synthetic-production-signer",
        signatureBase64: "c3ludGhldGljLXNpZ25hdHVyZQ==",
      },
      appExportApprovalReceipt: {
        receiptId: "synthetic-app-receipt",
        signerKeyId: "synthetic-app-key",
        signerId: "synthetic-app-signer",
        signatureBase64: "c3ludGhldGljLWFwcC1zaWduYXR1cmU=",
      },
      targetExportVerificationEvidence: {
        usTarget: { path: US_TARGET },
        krTarget: { path: KR_TARGET },
      },
    },
    finalApprovalOptions: {
      now: "2026-07-17T00:00:00.000Z",
      finalApprovalAllowlistJson: JSON.stringify([
        {
          signerKeyId: "synthetic-production-key",
          signerId: "synthetic-production-signer",
          publicKeyPem:
            "-----BEGIN PUBLIC KEY-----\nSYNTHETIC\n-----END PUBLIC KEY-----",
          allowedScopes: ["synthetic"],
        },
      ]),
    },
    ...overrides,
  };
}

function fixedFalse() {
  return {
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
  };
}

function snapshot(overrides = {}) {
  return {
    ok: true,
    status: "ready",
    repositoryStateStable: true,
    worktreeClean: true,
    targetPathsAbsent: true,
    repositoryHeadSha: HEAD,
    repositoryTreeSha: TREE,
    branchName: BRANCH,
    trackedPathsSha256: TRACKED_HASH,
    selectorSha256: SELECTOR_PREIMAGE_HASH,
    targetPathAbsenceEvidence: {
      contractVersion:
        "metrics-cutover-target-path-absence-evidence-v1-step114-2r",
      evidenceHash: EVIDENCE_HASH,
      targets: [
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
    },
    repositoryPreimage: {
      selectorContentBase64: "c3ludGhldGljLXNlbGVjdG9y",
      selectorSha256: SELECTOR_PREIMAGE_HASH,
      trackedPathsSha256: TRACKED_HASH,
    },
    trustedOptions: {
      expectedRepositoryHeadSha: HEAD,
      expectedRepositoryTreeSha: TREE,
      expectedTrackedPathsSha256: TRACKED_HASH,
      expectedTargetPathAbsenceEvidenceHash: EVIDENCE_HASH,
      requiredBranchName: BRANCH,
    },
    executionPolicy: {
      expectedRepositoryHeadSha: HEAD,
      expectedRepositoryTreeSha: TREE,
      expectedTrackedPathsSha256: TRACKED_HASH,
      expectedTargetPathAbsenceEvidenceHash: EVIDENCE_HASH,
      requiredBranchName: BRANCH,
    },
    ...fixedFalse(),
    ...overrides,
  };
}

function proposed(overrides = {}) {
  return {
    ok: true,
    status: "ready",
    contractVersion: "metrics-selector-exact-diff-v1-step114-2q",
    selectorPath: "src/data/tickers/screenerCandidateOverlay.js",
    selectorContentBase64: "c3ludGhldGljLXBvc3RpbWFnZQ==",
    selectorSha256: SELECTOR_POSTIMAGE_HASH,
    blockingIssues: [],
    warningIssues: [],
    ...overrides,
  };
}

function packageResult(overrides = {}) {
  return {
    ok: true,
    status: "package_ready",
    executionPackageReady: true,
    executionPackageHash: PACKAGE_HASH,
    selectorPreimageSha256: SELECTOR_PREIMAGE_HASH,
    selectorPostimageSha256: SELECTOR_POSTIMAGE_HASH,
    cutoverRehearsalEvidenceHash: REHEARSAL_HASH,
    candidatePackageId: "candidate-step114-2s-synthetic",
    candidatePackageHash: CANDIDATE_HASH,
    zipPackageSha256: ZIP_HASH,
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
    targetFiles: [
      {
        role: "us_price_metrics",
        path: US_TARGET,
        sha256: "5".repeat(64),
        byteSize: 120,
        rowCount: 2,
        market: "US",
        schemaVersion: "synthetic-schema",
        writeMode: "create_only",
        contentBase64: "U0VDUkVUX1VTX1RBUkdFVA==",
      },
      {
        role: "kr_price_metrics",
        path: KR_TARGET,
        sha256: "6".repeat(64),
        byteSize: 130,
        rowCount: 2,
        market: "KR",
        schemaVersion: "synthetic-schema",
        writeMode: "create_only",
        contentBase64: "U0VDUkVUX0tSX1RBUkdFVA==",
      },
    ],
    executionPackage: {
      selectorContentBase64: "U0VDUkVUX1NFTEVDVE9S",
    },
    rollbackBundle: {
      rollbackSelectorContentBase64: "U0VDUkVUX1JPTExCQUNL",
    },
    exactDiff: { secret: "not public" },
    ...fixedFalse(),
    blockingIssues: [],
    warningIssues: [],
    ...overrides,
  };
}

function makeAdapters({
  bundle = syntheticBundle(),
  snapshots = [snapshot(), snapshot()],
  proposedResults = [proposed(), proposed()],
  packages = [packageResult(), packageResult()],
} = {}) {
  const calls = {
    snapshots: [],
    proposed: [],
    packages: [],
  };
  let snapshotIndex = 0;
  let proposedIndex = 0;
  let packageIndex = 0;
  return {
    calls,
    adapters: {
      readBundle: async () => ({
        ok: true,
        bundle: structuredClone(bundle),
        blockingIssues: [],
      }),
      collectSnapshot: async (input) => {
        calls.snapshots.push(structuredClone(input));
        return structuredClone(
          snapshots[Math.min(snapshotIndex++, snapshots.length - 1)],
        );
      },
      buildProposedSelector: async (preimage, evidence) => {
        calls.proposed.push({
          preimage: structuredClone(preimage),
          evidence: structuredClone(evidence),
        });
        return structuredClone(
          proposedResults[
            Math.min(proposedIndex++, proposedResults.length - 1)
          ],
        );
      },
      evaluatePackage: async (input, options) => {
        calls.packages.push({
          input: structuredClone(input),
          options: structuredClone(options),
        });
        return structuredClone(
          packages[Math.min(packageIndex++, packages.length - 1)],
        );
      },
    },
  };
}

function assertFixedFalse(result) {
  for (const [field, value] of Object.entries(fixedFalse())) {
    assert.equal(result[field], value, field);
  }
}

function assertSuppressed(result) {
  assert.equal(result.executionPackageHash, "");
  assert.deepEqual(result.targetSummaries, []);
  assert.equal(result.targetFileCount, 0);
  assert.equal(result.plannedWriteCount, 0);
  assert.equal(result.plannedDeleteCount, 0);
}

test("valid signed synthetic bundle returns dry_run_ready with identical packages", async () => {
  const setup = makeAdapters();
  const result = await runMetricsCutoverPostMergeDryRun(
    { repo: "C:\\synthetic-repo", inputPath: "C:\\bundle.json" },
    setup.adapters,
  );
  assert.equal(result.status, "dry_run_ready");
  assert.equal(result.contractVersion, DRY_RUN_CONTRACT_VERSION);
  assert.equal(result.executionPackageHash, PACKAGE_HASH);
  assert.equal(result.repositoryStateStableAcrossDryRun, true);
  assert.equal(setup.calls.snapshots.length, 2);
  assert.equal(setup.calls.proposed.length, 2);
  assert.equal(setup.calls.packages.length, 2);
  assert.deepEqual(
    setup.calls.snapshots.map((call) => [call.usTarget, call.krTarget]),
    [
      [US_TARGET, KR_TARGET],
      [US_TARGET, KR_TARGET],
    ],
  );
  assert.equal(
    setup.calls.packages[0].options.finalApprovalOptions.now.toISOString(),
    "2026-07-17T00:00:00.000Z",
  );
  assertFixedFalse(result);
});

test("real signed synthetic bundle passes production snapshots, packages, and CLI", async (t) => {
  const root = tempDirectory(t);
  const repositoryRoot = path.join(root, "repository");
  const bundlePath = path.join(root, "operator-bundle.json");
  const repository = await createIsolatedMetricsRepository(
    REPO_ROOT,
    repositoryRoot,
  );
  const bundle = await buildRealSyntheticOperatorBundle(
    REPO_ROOT,
    repository,
  );
  writeFileSync(bundlePath, JSON.stringify(bundle), "utf8");

  const observedStages = [];
  const result = await runMetricsCutoverPostMergeDryRun(
    { repo: repositoryRoot, inputPath: bundlePath },
    {
      observeStage(stage) {
        observedStages.push(stage);
      },
    },
  );
  assert.equal(result.status, "dry_run_ready");
  assert.equal(result.ok, true);
  assert.deepEqual(observedStages, [
    { stage: "snapshot_a", status: "ready" },
    { stage: "package_a", status: "package_ready" },
    { stage: "snapshot_b", status: "ready" },
    { stage: "package_b", status: "package_ready" },
  ]);
  assert.match(result.executionPackageHash, /^[a-f0-9]{64}$/);
  assert.equal(result.repositoryStateStableAcrossDryRun, true);
  assert.equal(result.targetFileCount, 2);
  assert.equal(result.plannedWriteCount, 2);
  assert.equal(result.plannedDeleteCount, 0);
  assertFixedFalse(result);

  const cli = spawnSync(
    process.execPath,
    [
      path.join(REPO_ROOT, "scripts/run-metrics-cutover-post-merge-dry-run.cjs"),
      "--repo",
      repositoryRoot,
      "--input",
      bundlePath,
    ],
    {
      cwd: REPO_ROOT,
      shell: false,
      encoding: "utf8",
      windowsHide: true,
    },
  );
  assert.equal(cli.status, 0, cli.stderr || cli.stdout);
  assert.equal(cli.stderr, "");
  const stdoutLines = cli.stdout.trim().split(/\r?\n/);
  assert.equal(stdoutLines.length, 1);
  const cliResult = JSON.parse(stdoutLines[0]);
  assert.equal(cliResult.status, "dry_run_ready");
  assert.equal(cliResult.ok, true);
  assert.equal(cliResult.executionPackageHash, result.executionPackageHash);
  assert.equal(cliResult.targetFileCount, 2);
  assert.equal(cliResult.plannedWriteCount, 2);
  assert.equal(cliResult.plannedDeleteCount, 0);
  assertFixedFalse(cliResult);
  assert.equal(Object.hasOwn(cliResult, "executionPackage"), false);

  const serialized = JSON.stringify(cliResult);
  for (const forbidden of [
    "contentBase64",
    "selectorContentBase64",
    "rollbackBundle",
    "receiptId",
    "signatureBase64",
    "publicKeyPem",
    "finalApprovalAllowlistJson",
    "productionAllowlistJson",
    "PRIVATE KEY",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("result is deterministic and bundle input remains immutable", async () => {
  const bundle = syntheticBundle();
  const before = structuredClone(bundle);
  const first = makeAdapters({ bundle });
  const second = makeAdapters({ bundle });
  const firstResult = await runMetricsCutoverPostMergeDryRun(
    { repo: "repo", inputPath: "bundle" },
    first.adapters,
  );
  const secondResult = await runMetricsCutoverPostMergeDryRun(
    { repo: "repo", inputPath: "bundle" },
    second.adapters,
  );
  assert.deepEqual(firstResult, secondResult);
  assert.deepEqual(bundle, before);
});

test("complete idle result and fixed false outputs", async () => {
  const result = await runMetricsCutoverPostMergeDryRun({});
  assert.equal(result.status, "idle");
  assertSuppressed(result);
  assertFixedFalse(result);
});

test("bundle file boundary fails closed", async (t) => {
  const root = tempDirectory(t);
  await t.test("missing", () => {
    const result = readMetricsCutoverPostMergeBundle(
      path.join(root, "missing.json"),
    );
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /input_missing/);
  });
  await t.test("directory", () => {
    const directory = path.join(root, "directory");
    mkdirSync(directory);
    const result = readMetricsCutoverPostMergeBundle(directory);
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /not_regular_file/);
  });
  await t.test("symlink", () => {
    const file = path.join(root, "bundle.json");
    writeFileSync(file, JSON.stringify(syntheticBundle()));
    const result = readMetricsCutoverPostMergeBundle(file, {
      fs: {
        readFileSync,
        realpathSync,
        lstatSync() {
          return {
            size: 10,
            isSymbolicLink: () => true,
            isFile: () => false,
          };
        },
      },
    });
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /input_symlink/);
  });
  await t.test("oversized", () => {
    const result = readMetricsCutoverPostMergeBundle("bundle.json", {
      maxInputBytes: 8,
      fs: {
        realpathSync: () => "bundle.json",
        readFileSync: () => Buffer.alloc(9),
        lstatSync: () => ({
          size: 9,
          isSymbolicLink: () => false,
          isFile: () => true,
        }),
      },
    });
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /size_invalid/);
  });
  await t.test("invalid UTF-8", () => {
    const result = parseMetricsCutoverPostMergeBundleBytes(
      Buffer.from([0xff]),
    );
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /invalid_utf8/);
  });
  await t.test("invalid JSON", () => {
    const result = parseMetricsCutoverPostMergeBundleBytes(
      Buffer.from("{"),
    );
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /invalid_json/);
  });
});

test("operator bundle exact contract validation fails closed", async (t) => {
  const parse = (value) =>
    parseMetricsCutoverPostMergeBundleBytes(
      Buffer.from(
        typeof value === "string" ? value : JSON.stringify(value),
        "utf8",
      ),
    );
  await t.test("duplicate top-level key", () => {
    const json = JSON.stringify(syntheticBundle()).replace(
      '"contractVersion":',
      `"contractVersion":"${INPUT_CONTRACT_VERSION}","contractVersion":`,
    );
    const result = parse(json);
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /duplicate_key/);
  });
  for (const [name, mutate, pattern] of [
    [
      "missing field",
      (bundle) => delete bundle.requiredBranchName,
      /required_field_missing/,
    ],
    [
      "unexpected field",
      (bundle) => {
        bundle.unexpected = true;
      },
      /unexpected_field/,
    ],
    [
      "wrong contract",
      (bundle) => {
        bundle.contractVersion = "wrong";
      },
      /contract_version_mismatch/,
    ],
    [
      "malformed HEAD",
      (bundle) => {
        bundle.expectedRepositoryHeadSha = "ABC";
      },
      /repository_head_invalid/,
    ],
    [
      "malformed branch",
      (bundle) => {
        bundle.requiredBranchName = "bad branch";
      },
      /required_branch_invalid/,
    ],
    [
      "malformed time",
      (bundle) => {
        bundle.evaluationNow = "tomorrow";
      },
      /evaluation_now_invalid/,
    ],
    [
      "conflicting trusted time",
      (bundle) => {
        bundle.finalApprovalOptions.now =
          "2026-07-17T00:00:01.000Z";
      },
      /final_approval_now_conflict/,
    ],
  ]) {
    await t.test(name, () => {
      const bundle = syntheticBundle();
      mutate(bundle);
      const result = parse(bundle);
      assert.equal(result.ok, false);
      assert.match(result.blockingIssues.join("\n"), pattern);
    });
  }
});

test("nested eligibility clock is normalized and bound before snapshot A", async (t) => {
  await t.test("matching nested ISO now succeeds", async () => {
    const bundle = syntheticBundle();
    bundle.finalApprovalInput.eligibilityEvaluatedAt =
      "2026-07-16T00:05:00.000Z";
    bundle.finalApprovalOptions.eligibilityOptions = {
      now: "2026-07-16T09:05:00.000+09:00",
      productionAllowlistJson: "[]",
    };
    const parsed = parseMetricsCutoverPostMergeBundleBytes(
      Buffer.from(JSON.stringify(bundle)),
    );
    assert.equal(parsed.ok, true);
    assert.equal(
      parsed.bundle.finalApprovalOptions.eligibilityOptions.now,
      "2026-07-16T00:05:00.000Z",
    );

    const setup = makeAdapters({ bundle: parsed.bundle });
    const result = await runMetricsCutoverPostMergeDryRun(
      { repo: "repo", inputPath: "bundle" },
      setup.adapters,
    );
    assert.equal(result.status, "dry_run_ready");
    const firstNow =
      setup.calls.packages[0].options.finalApprovalOptions
        .eligibilityOptions.now;
    const secondNow =
      setup.calls.packages[1].options.finalApprovalOptions
        .eligibilityOptions.now;
    assert.ok(firstNow instanceof Date);
    assert.ok(secondNow instanceof Date);
    assert.notEqual(firstNow, secondNow);
    assert.equal(firstNow.getTime(), secondNow.getTime());
    assert.equal(firstNow.toISOString(), "2026-07-16T00:05:00.000Z");
  });

  for (const [name, now, expectedIssue] of [
    [
      "malformed nested now",
      "not-an-instant",
      /eligibility_options_now_invalid/,
    ],
    [
      "mismatched nested now",
      "2026-07-16T00:05:00.001Z",
      /eligibility_options_now_conflict/,
    ],
  ]) {
    await t.test(name, async () => {
      const bundle = syntheticBundle();
      bundle.finalApprovalInput.eligibilityEvaluatedAt =
        "2026-07-16T00:05:00.000Z";
      bundle.finalApprovalOptions.eligibilityOptions = { now };
      const setup = makeAdapters({ bundle });
      const result = await runMetricsCutoverPostMergeDryRun(
        { repo: "repo", inputPath: "bundle" },
        setup.adapters,
      );
      assert.equal(result.status, "blocked");
      assert.equal(setup.calls.snapshots.length, 0);
      assert.match(result.blockingIssues.join("\n"), expectedIssue);
    });
  }

  await t.test("omitted nested now remains supported", async () => {
    const bundle = syntheticBundle();
    bundle.finalApprovalInput.eligibilityEvaluatedAt =
      "2026-07-16T00:05:00.000Z";
    bundle.finalApprovalOptions.eligibilityOptions = {
      productionAllowlistJson: "[]",
    };
    const setup = makeAdapters({ bundle });
    const result = await runMetricsCutoverPostMergeDryRun(
      { repo: "repo", inputPath: "bundle" },
      setup.adapters,
    );
    assert.equal(result.status, "dry_run_ready");
    for (const call of setup.calls.packages) {
      assert.equal(
        Object.hasOwn(
          call.options.finalApprovalOptions.eligibilityOptions,
          "now",
        ),
        false,
      );
    }
  });
});

test("sensitive fields reject while public verification fields remain allowed", async (t) => {
  for (const field of [
    "private_key",
    "private-key",
    "client_secret",
    "access_token",
    "refresh-token",
    "api_key",
    "token",
    "secret",
  ]) {
    await t.test(field, () => {
      const bundle = syntheticBundle();
      bundle.finalApprovalInput.nested = { [field]: "forbidden" };
      const result = parseMetricsCutoverPostMergeBundleBytes(
        Buffer.from(JSON.stringify(bundle)),
      );
      assert.equal(result.ok, false);
      assert.match(result.blockingIssues.join("\n"), /sensitive_field/);
    });
  }
  const allowed = syntheticBundle();
  allowed.finalApprovalInput.allowed = {
    publicKeyPem: "synthetic-public-key",
    signerKeyId: "key-id",
    signerId: "signer-id",
    signatureBase64: "c2lnbmF0dXJl",
    receiptId: "receipt-id",
    allowedScopes: ["scope"],
  };
  const result = parseMetricsCutoverPostMergeBundleBytes(
    Buffer.from(JSON.stringify(allowed)),
  );
  assert.equal(result.ok, true);

  const shortcut = syntheticBundle();
  shortcut.finalApprovalInput.executionPackageReady = true;
  const shortcutResult = parseMetricsCutoverPostMergeBundleBytes(
    Buffer.from(JSON.stringify(shortcut)),
  );
  assert.equal(shortcutResult.ok, false);
  assert.match(shortcutResult.blockingIssues.join("\n"), /shortcut_field/);
});

test("target paths are derived only from Step 114-2P evidence", async () => {
  const setup = makeAdapters();
  await runMetricsCutoverPostMergeDryRun(
    {
      repo: "repo",
      inputPath: "bundle",
      usTarget: "caller-us.csv",
      krTarget: "caller-kr.csv",
    },
    setup.adapters,
  );
  assert.equal(setup.calls.snapshots[0].usTarget, US_TARGET);
  assert.equal(setup.calls.snapshots[0].krTarget, KR_TARGET);
});

test("malformed and colliding derived targets block before snapshots", async (t) => {
  for (const [name, usTarget, krTarget] of [
    ["malformed", "../bad.csv", KR_TARGET],
    [
      "case collision",
      "src/data/tickers/Future.csv",
      "src/data/tickers/future.csv",
    ],
    [
      "Unicode collision",
      "src/data/tickers/métrics.csv",
      "src/data/tickers/me\u0301trics.csv",
    ],
  ]) {
    await t.test(name, async () => {
      const bundle = syntheticBundle();
      bundle.finalApprovalInput.targetExportVerificationEvidence.usTarget.path =
        usTarget;
      bundle.finalApprovalInput.targetExportVerificationEvidence.krTarget.path =
        krTarget;
      const setup = makeAdapters({ bundle });
      const result = await runMetricsCutoverPostMergeDryRun(
        { repo: "repo", inputPath: "bundle" },
        setup.adapters,
      );
      assert.equal(result.status, "blocked");
      assert.equal(setup.calls.snapshots.length, 0);
      assertSuppressed(result);
    });
  }
});

test("snapshot A, proposed selector, and package A failures stop the flow", async (t) => {
  await t.test("snapshot A blocked", async () => {
    const setup = makeAdapters({
      snapshots: [snapshot({ status: "blocked", ok: false })],
    });
    const result = await runMetricsCutoverPostMergeDryRun(
      { repo: "repo", inputPath: "bundle" },
      setup.adapters,
    );
    assert.equal(result.status, "blocked");
    assert.equal(setup.calls.proposed.length, 0);
    assert.equal(setup.calls.packages.length, 0);
  });
  await t.test("proposed-selector A blocked", async () => {
    const setup = makeAdapters({
      proposedResults: [
        proposed({
          status: "blocked",
          ok: false,
          selectorContentBase64: "",
          selectorSha256: "",
        }),
      ],
    });
    const result = await runMetricsCutoverPostMergeDryRun(
      { repo: "repo", inputPath: "bundle" },
      setup.adapters,
    );
    assert.equal(result.status, "blocked");
    assert.equal(setup.calls.packages.length, 0);
    assertSuppressed(result);
  });
  await t.test("package A blocked", async () => {
    const setup = makeAdapters({
      packages: [
        packageResult({
          status: "blocked",
          ok: false,
          executionPackageReady: false,
          executionPackageHash: "",
        }),
      ],
    });
    const result = await runMetricsCutoverPostMergeDryRun(
      { repo: "repo", inputPath: "bundle" },
      setup.adapters,
    );
    assert.equal(result.status, "blocked");
    assert.equal(setup.calls.snapshots.length, 1);
    assertSuppressed(result);
  });
});

test("snapshot A expected HEAD and branch are enforced", async (t) => {
  for (const [name, mutation, pattern] of [
    [
      "wrong HEAD",
      { repositoryHeadSha: "9".repeat(40) },
      /repository_head_mismatch/,
    ],
    ["wrong branch", { branchName: "other" }, /branch_mismatch/],
  ]) {
    await t.test(name, async () => {
      const setup = makeAdapters({ snapshots: [snapshot(mutation)] });
      const result = await runMetricsCutoverPostMergeDryRun(
        { repo: "repo", inputPath: "bundle" },
        setup.adapters,
      );
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), pattern);
    });
  }
});

test("snapshot A/B repository changes block", async (t) => {
  const mutations = [
    ["HEAD", { repositoryHeadSha: "9".repeat(40) }],
    ["tree", { repositoryTreeSha: "8".repeat(40) }],
    ["branch", { branchName: "review/changed" }],
    ["tracked inventory", { trackedPathsSha256: "7".repeat(64) }],
    ["selector", { selectorSha256: "6".repeat(64) }],
    [
      "selector bytes",
      {
        repositoryPreimage: {
          ...snapshot().repositoryPreimage,
          selectorContentBase64: "Y2hhbmdlZA==",
        },
      },
    ],
    [
      "target evidence",
      {
        targetPathAbsenceEvidence: {
          ...snapshot().targetPathAbsenceEvidence,
          evidenceHash: "5".repeat(64),
        },
      },
    ],
  ];
  for (const [name, mutation] of mutations) {
    await t.test(name, async () => {
      const setup = makeAdapters({
        snapshots: [snapshot(), snapshot(mutation)],
      });
      const result = await runMetricsCutoverPostMergeDryRun(
        { repo: "repo", inputPath: "bundle" },
        setup.adapters,
      );
      assert.equal(result.status, "blocked");
      assert.equal(setup.calls.packages.length, 1);
      assertSuppressed(result);
    });
  }
});

test("snapshot B and package B blocked results propagate", async (t) => {
  await t.test("snapshot B", async () => {
    const setup = makeAdapters({
      snapshots: [
        snapshot(),
        snapshot({ status: "blocked", ok: false }),
      ],
    });
    const result = await runMetricsCutoverPostMergeDryRun(
      { repo: "repo", inputPath: "bundle" },
      setup.adapters,
    );
    assert.equal(result.status, "blocked");
    assert.equal(setup.calls.packages.length, 1);
  });
  await t.test("package B", async () => {
    const setup = makeAdapters({
      packages: [
        packageResult(),
        packageResult({
          status: "blocked",
          ok: false,
          executionPackageReady: false,
          executionPackageHash: "",
        }),
      ],
    });
    const result = await runMetricsCutoverPostMergeDryRun(
      { repo: "repo", inputPath: "bundle" },
      setup.adapters,
    );
    assert.equal(result.status, "blocked");
    assertSuppressed(result);
  });
  await t.test("proposed-selector B", async () => {
    const setup = makeAdapters({
      proposedResults: [
        proposed(),
        proposed({
          status: "blocked",
          ok: false,
          selectorContentBase64: "",
          selectorSha256: "",
        }),
      ],
    });
    const result = await runMetricsCutoverPostMergeDryRun(
      { repo: "repo", inputPath: "bundle" },
      setup.adapters,
    );
    assert.equal(result.status, "blocked");
    assert.equal(setup.calls.packages.length, 1);
    assertSuppressed(result);
  });
});

test("package A/B deterministic fields must match", async (t) => {
  for (const [name, mutation] of [
    ["execution package", { executionPackageHash: "9".repeat(64) }],
    ["selector preimage", { selectorPreimageSha256: "8".repeat(64) }],
    ["selector postimage", { selectorPostimageSha256: "7".repeat(64) }],
    ["rehearsal evidence", { cutoverRehearsalEvidenceHash: "6".repeat(64) }],
  ]) {
    await t.test(name, async () => {
      const setup = makeAdapters({
        packages: [packageResult(), packageResult(mutation)],
      });
      const result = await runMetricsCutoverPostMergeDryRun(
        { repo: "repo", inputPath: "bundle" },
        setup.adapters,
      );
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), /execution_package_changed/);
      assertSuppressed(result);
    });
  }
});

test("ready public result is explicit and contains no sensitive package material", async () => {
  const setup = makeAdapters();
  const result = await runMetricsCutoverPostMergeDryRun(
    { repo: "repo", inputPath: "bundle" },
    setup.adapters,
  );
  assert.equal(result.targetSummaries.length, 2);
  for (const target of result.targetSummaries) {
    assert.deepEqual(Object.keys(target).sort(), [
      "byteSize",
      "market",
      "path",
      "role",
      "rowCount",
      "schemaVersion",
      "sha256",
      "writeMode",
    ]);
  }
  const serialized = JSON.stringify(result);
  assert.equal(Object.hasOwn(result, "executionPackage"), false);
  for (const forbidden of [
    "contentBase64",
    "selectorContentBase64",
    "rollbackBundle",
    "signatureBase64",
    "publicKeyPem",
    "finalApprovalAllowlistJson",
    "synthetic-production-receipt",
    "U0VDUkVUX1VTX1RBUkdFVA",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("pure Step 114-2Q proposed-selector helper succeeds and suppresses failures", async () => {
  const service = await import(
    pathToFileURL(
      path.join(
        REPO_ROOT,
        "server/src/services/metricsCutoverExecutionPackagePreflight.js",
      ),
    ).href
  );
  const rehearsal = await import(
    pathToFileURL(
      path.join(
        REPO_ROOT,
        "server/src/services/metricsFinalApprovalCutoverRehearsal.js",
      ),
    ).href
  );
  const bytes = readFileSync(
    path.join(
      REPO_ROOT,
      "src/data/tickers/screenerCandidateOverlay.js",
    ),
  );
  const trusted = rehearsal.getMetricsCurrentPointerSnapshot();
  const success = service.buildMetricsCutoverProposedSelectorEvidence(
    {
      contractVersion:
        service.METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION,
      selectorPath: trusted.selector.path,
      selectorContentBase64: bytes.toString("base64"),
      selectorSha256: trusted.selector.sha256,
    },
    {
      usTarget: { path: US_TARGET },
      krTarget: { path: KR_TARGET },
    },
  );
  assert.equal(success.status, "ready");
  assert.equal(success.ok, true);
  assert.notEqual(success.selectorContentBase64, "");
  const blocked = service.buildMetricsCutoverProposedSelectorEvidence(
    {
      contractVersion:
        service.METRICS_REPOSITORY_PREIMAGE_CONTRACT_VERSION,
      selectorPath: trusted.selector.path,
      selectorContentBase64: bytes.toString("base64"),
      selectorSha256: "0".repeat(64),
    },
    {
      usTarget: { path: US_TARGET },
      krTarget: { path: KR_TARGET },
    },
  );
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.selectorContentBase64, "");
  assert.equal(blocked.selectorSha256, "");
});

test("CLI writes one JSON line and returns documented exit codes", async () => {
  for (const [name, argv, result, expectedCode] of [
    [
      "ready",
      ["--repo", "repo", "--input", "bundle.json"],
      { ...packageResult(), status: "dry_run_ready" },
      0,
    ],
    [
      "blocked",
      ["--repo", "repo", "--input", "bundle.json"],
      { status: "blocked" },
      1,
    ],
  ]) {
    const stdout = [];
    const stderr = [];
    const code = await runCli(argv, {
      runDryRun: async () => result,
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    });
    assert.equal(code, expectedCode, name);
    assert.equal(stdout.length, 1);
    assert.equal(stdout[0].trim().split(/\r?\n/).length, 1);
    JSON.parse(stdout[0]);
    assert.equal(stderr.length, 0);
  }
  const stdout = [];
  const stderr = [];
  const code = await runCli(["--repo", "repo"], {
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
  });
  assert.equal(code, 2);
  assert.equal(stdout.length, 1);
  assert.equal(stderr.length, 1);
});

test("production Step 114-2S sources contain no mutation or external side effects", () => {
  const source = [
    "lib/metrics-cutover-post-merge-dry-run-input.cjs",
    "lib/metrics-cutover-post-merge-dry-run.cjs",
    "run-metrics-cutover-post-merge-dry-run.cjs",
  ]
    .map((file) => readFileSync(path.join(__dirname, file), "utf8"))
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
    "database.",
    "provider.",
    "deploymentApi",
    "publicationApi",
    "pointerMutationAuthorized: true",
    "rollbackExecuted: true",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.equal(MAX_INPUT_BYTES, 64 * 1024 * 1024);
});
