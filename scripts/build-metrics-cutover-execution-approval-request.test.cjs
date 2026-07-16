const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
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

const {
  MAX_INPUT_BYTES,
  readMetricsCutoverPostMergeBundleObservation,
} = require("./lib/metrics-cutover-post-merge-dry-run-input.cjs");
const {
  APPROVAL_REQUEST_CONTRACT_VERSION,
  APPROVAL_REQUEST_POLICY_VERSION,
  APPROVAL_REQUEST_SUMMARY_CONTRACT_VERSION,
  APPROVAL_REQUIREMENTS,
  FIXED_FALSE_FIELDS,
  REQUEST_FIELDS,
  TARGET_FIELDS,
  TARGET_SCHEMA_VERSION,
  canonicalizeMetricsCutoverExecutionApprovalRequest,
  compareMetricsCutoverOperatorBundleObservations,
  hashMetricsCutoverExecutionApprovalRequest,
  runMetricsCutoverExecutionApprovalRequest,
  validateMetricsCutoverExecutionApprovalRequest,
  validateMetricsCutoverPostMergeDryRunSummary,
} = require("./lib/metrics-cutover-execution-approval-request.cjs");
const { runCli } = require(
  "./build-metrics-cutover-execution-approval-request.cjs"
);
const {
  buildRealSyntheticOperatorBundle,
  createIsolatedMetricsRepository,
} = require("./test-support/metrics-cutover-post-merge-real-fixture.cjs");

const REPO_ROOT = path.resolve(__dirname, "..");
const HEAD = "a".repeat(40);
const TREE = "b".repeat(40);
const TRACKED_HASH = "c".repeat(64);
const ABSENCE_HASH = "d".repeat(64);
const CANDIDATE_HASH = "e".repeat(64);
const ZIP_HASH = "f".repeat(64);
const REHEARSAL_HASH = "1".repeat(64);
const PACKAGE_HASH = "2".repeat(64);
const SELECTOR_PREIMAGE_HASH = "3".repeat(64);
const SELECTOR_POSTIMAGE_HASH = "4".repeat(64);
const US_HASH = "5".repeat(64);
const KR_HASH = "6".repeat(64);
const BRANCH = "review/step114-2t";
const US_TARGET = "src/data/tickers/future_step114_2t_us.csv";
const KR_TARGET = "src/data/tickers/future_step114_2t_kr.csv";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function tempDirectory(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "finple-step114-2t-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function fixedFalse() {
  return Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false]));
}

function targetSummary(role, overrides = {}) {
  const us = role === "us_price_metrics";
  return {
    role,
    path: us ? US_TARGET : KR_TARGET,
    sha256: us ? US_HASH : KR_HASH,
    byteSize: us ? 120 : 130,
    rowCount: 2,
    market: us ? "US" : "KR",
    schemaVersion: TARGET_SCHEMA_VERSION,
    writeMode: "create_only",
    ...overrides,
  };
}

function readyDryRun(overrides = {}) {
  return {
    ok: true,
    status: "dry_run_ready",
    contractVersion: "metrics-cutover-post-merge-dry-run-v1-step114-2s",
    dryRunReady: true,
    repositoryStateStableAcrossDryRun: true,
    repositoryHeadSha: HEAD,
    repositoryTreeSha: TREE,
    branchName: BRANCH,
    trackedPathsSha256: TRACKED_HASH,
    targetPathAbsenceEvidenceHash: ABSENCE_HASH,
    candidatePackageId: "candidate-step114-2t-synthetic",
    candidatePackageHash: CANDIDATE_HASH,
    zipPackageSha256: ZIP_HASH,
    cutoverRehearsalEvidenceHash: REHEARSAL_HASH,
    executionPackageHash: PACKAGE_HASH,
    selectorPreimageSha256: SELECTOR_PREIMAGE_HASH,
    selectorPostimageSha256: SELECTOR_POSTIMAGE_HASH,
    targetFileCount: 2,
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
    targetSummaries: [
      targetSummary("us_price_metrics"),
      targetSummary("kr_price_metrics"),
    ],
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
    blockingIssues: [],
    warningIssues: [],
    ...overrides,
  };
}

function observation(bytes = Buffer.from('{"synthetic":"bundle"}'), overrides = {}) {
  return {
    ok: true,
    bundle: {},
    blockingIssues: [],
    canonicalInputPath: "C:\\synthetic\\operator-bundle.json",
    bytes: Buffer.from(bytes),
    byteSize: bytes.length,
    sha256: sha256(bytes),
    fileIdentity: "7:42",
    fileIdentitySupported: true,
    ...overrides,
  };
}

function makeAdapters({
  bytes = Buffer.from('{"synthetic":"bundle"}'),
  observationA,
  observationB,
  dryRun = readyDryRun(),
} = {}) {
  const observations = [
    observationA || observation(bytes),
    observationB || observation(bytes),
  ];
  const calls = { observe: 0, dryRun: 0 };
  return {
    calls,
    adapters: {
      observeBundle: async () => {
        const value =
          observations[Math.min(calls.observe, observations.length - 1)];
        calls.observe += 1;
        return {
          ...value,
          bytes: Buffer.from(value.bytes || []),
        };
      },
      runDryRun: async () => {
        calls.dryRun += 1;
        return structuredClone(dryRun);
      },
    },
  };
}

function assertFixedFalse(result) {
  for (const field of FIXED_FALSE_FIELDS) {
    assert.equal(result[field], false, field);
  }
}

function assertSuppressed(result) {
  assert.equal(result.approvalRequestReady, false);
  assert.equal(result.approvalRequestHash, "");
  assert.deepEqual(result.approvalRequest, {});
  assert.equal(result.executionPackageHash, "");
  assert.equal(result.targetFileCount, 0);
  assert.equal(result.plannedWriteCount, 0);
  assert.equal(result.plannedDeleteCount, 0);
}

async function buildUnitResult(options = {}) {
  const setup = makeAdapters(options);
  const result = await runMetricsCutoverExecutionApprovalRequest(
    { repo: "C:\\synthetic-repo", inputPath: "C:\\synthetic\\bundle.json" },
    setup.adapters,
  );
  return { result, setup };
}

test("valid stable sanitized Step 114-2S result returns request_ready", async () => {
  const { result, setup } = await buildUnitResult();
  assert.equal(result.ok, true);
  assert.equal(result.status, "request_ready");
  assert.equal(
    result.contractVersion,
    APPROVAL_REQUEST_SUMMARY_CONTRACT_VERSION,
  );
  assert.equal(result.approvalRequestReady, true);
  assert.equal(setup.calls.observe, 2);
  assert.equal(setup.calls.dryRun, 1);
  assert.equal(result.approvalRequestHash, result.approvalRequest.requestHash);
  assert.equal(
    result.approvalRequest.contractVersion,
    APPROVAL_REQUEST_CONTRACT_VERSION,
  );
  assert.equal(
    result.approvalRequest.policyVersion,
    APPROVAL_REQUEST_POLICY_VERSION,
  );
  assert.equal(result.approvalRequest.requestScope, "metrics_exact_cutover_execution");
  assert.equal(result.approvalRequest.requestStatus, "unsigned_request");
  assert.deepEqual(
    Object.keys(result.approvalRequest).sort(),
    [...REQUEST_FIELDS].sort(),
  );
  assert.deepEqual(result.approvalRequest.approvalRequirements, APPROVAL_REQUIREMENTS);
  assertFixedFalse(result);
});

test("real production-default Step 114-2S fixture and actual CLI return sanitized request_ready", async (t) => {
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

  const result = await runMetricsCutoverExecutionApprovalRequest({
    repo: repositoryRoot,
    inputPath: bundlePath,
  });
  assert.equal(result.status, "request_ready");
  assert.equal(result.ok, true);
  assert.equal(result.approvalRequest.targets.length, 2);
  assert.equal(result.targetFileCount, 2);
  assert.equal(result.plannedWriteCount, 2);
  assert.equal(result.plannedDeleteCount, 0);
  assert.equal(
    validateMetricsCutoverExecutionApprovalRequest(result.approvalRequest).ok,
    true,
  );
  assertFixedFalse(result);

  const cli = spawnSync(
    process.execPath,
    [
      path.join(
        REPO_ROOT,
        "scripts/build-metrics-cutover-execution-approval-request.cjs",
      ),
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
  const lines = cli.stdout.trim().split(/\r?\n/);
  assert.equal(lines.length, 1);
  const cliResult = JSON.parse(lines[0]);
  assert.equal(cliResult.status, "request_ready");
  assert.equal(cliResult.approvalRequestHash, result.approvalRequestHash);
  assertFixedFalse(cliResult);
  assert.equal(Object.hasOwn(cliResult, "executionPackage"), false);
  assert.equal(
    Object.hasOwn(cliResult.approvalRequest, "executionPackage"),
    false,
  );

  const serialized = JSON.stringify(cliResult);
  for (const forbidden of [
    bundlePath,
    repositoryRoot,
    "finalApprovalInput",
    "finalApprovalOptions",
    "contentBase64",
    "selectorContentBase64",
    "rollbackBundle",
    "exactDiff",
    "step114-2s-candidate-receipt",
    "step114-2s-production-receipt",
    "step114-2s-app-receipt",
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

test("request is deterministic and operator input remains immutable", async () => {
  const input = {
    repo: "C:\\synthetic-repo",
    inputPath: "C:\\synthetic\\bundle.json",
  };
  const before = structuredClone(input);
  const first = makeAdapters();
  const second = makeAdapters();
  const firstResult = await runMetricsCutoverExecutionApprovalRequest(
    input,
    first.adapters,
  );
  const secondResult = await runMetricsCutoverExecutionApprovalRequest(
    input,
    second.adapters,
  );
  assert.deepEqual(firstResult, secondResult);
  assert.deepEqual(input, before);
});

test("canonical request ID and hash recompute exactly", async () => {
  const { result } = await buildUnitResult();
  const request = result.approvalRequest;
  const validation = validateMetricsCutoverExecutionApprovalRequest(request);
  assert.deepEqual(validation, { ok: true, issues: [] });
  assert.equal(
    hashMetricsCutoverExecutionApprovalRequest(request),
    request.requestHash,
  );
  const canonical = canonicalizeMetricsCutoverExecutionApprovalRequest(request);
  assert.equal(typeof canonical, "string");
  assert.equal(canonical.includes('"requestHash"'), false);
});

test("identity mutations alter requestId and requestHash", async (t) => {
  const baseline = (await buildUnitResult()).result.approvalRequest;
  const changedBundle = (
    await buildUnitResult({
      bytes: Buffer.from('{"synthetic":"bundlf"}'),
    })
  ).result.approvalRequest;
  assert.notEqual(changedBundle.requestId, baseline.requestId);
  assert.notEqual(changedBundle.requestHash, baseline.requestHash);

  for (const [name, field, value] of [
    ["HEAD", "repositoryHeadSha", "7".repeat(40)],
    ["tree", "repositoryTreeSha", "8".repeat(40)],
    ["execution package", "executionPackageHash", "9".repeat(64)],
    ["target absence", "targetPathAbsenceEvidenceHash", "a".repeat(64)],
  ]) {
    await t.test(name, async () => {
      const dryRun = readyDryRun({ [field]: value });
      const changed = (await buildUnitResult({ dryRun })).result.approvalRequest;
      assert.notEqual(changed.requestId, baseline.requestId);
      assert.notEqual(changed.requestHash, baseline.requestHash);
    });
  }
});

test("request ID and request hash tampering fail validation", async (t) => {
  const request = (await buildUnitResult()).result.approvalRequest;
  await t.test("request ID", () => {
    const mutated = structuredClone(request);
    mutated.requestId = `metrics-cutover-request-${"9".repeat(64)}`;
    const result = validateMetricsCutoverExecutionApprovalRequest(mutated);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /id_mismatch/);
  });
  await t.test("request hash", () => {
    const mutated = structuredClone(request);
    mutated.requestHash = "9".repeat(64);
    const result = validateMetricsCutoverExecutionApprovalRequest(mutated);
    assert.equal(result.ok, false);
    assert.match(result.issues.join("\n"), /hash_mismatch/);
  });
});

test("request exact fields and nested objects fail closed", async (t) => {
  const request = (await buildUnitResult()).result.approvalRequest;
  for (const [name, mutate, pattern] of [
    [
      "missing request field",
      (value) => delete value.policyVersion,
      /fields_invalid/,
    ],
    [
      "extra request field",
      (value) => {
        value.timestamp = "forbidden";
      },
      /fields_invalid/,
    ],
    [
      "extra target field",
      (value) => {
        value.targets[0].contentBase64 = "forbidden";
      },
      /target_fields_invalid/,
    ],
    [
      "missing requirement",
      (value) => {
        delete value.approvalRequirements.requiresFreshRepositoryRecheck;
      },
      /requirements_fields_invalid/,
    ],
    [
      "permissive requirement",
      (value) => {
        value.approvalRequirements.allowAutomaticRollback = true;
      },
      /requirement_mismatch/,
    ],
  ]) {
    await t.test(name, () => {
      const mutated = structuredClone(request);
      mutate(mutated);
      const result = validateMetricsCutoverExecutionApprovalRequest(mutated);
      assert.equal(result.ok, false);
      assert.match(result.issues.join("\n"), pattern);
    });
  }
});

test("canonicalization rejects unsupported JSON-like values", async (t) => {
  const request = (await buildUnitResult()).result.approvalRequest;
  const cases = [
    ["undefined", undefined],
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["Date", new Date()],
    ["Buffer", Buffer.from("x")],
    ["function", () => {}],
    ["symbol", Symbol("x")],
    ["bigint", 1n],
    ["prototype", Object.create({ inherited: true })],
  ];
  for (const [name, unsupported] of cases) {
    await t.test(name, () => {
      const mutated = structuredClone(request);
      mutated.targets[0].byteSize = unsupported;
      assert.throws(
        () => canonicalizeMetricsCutoverExecutionApprovalRequest(mutated),
        TypeError,
      );
    });
  }
});

test("operator-bundle observation boundary blocks invalid inputs", async (t) => {
  const root = tempDirectory(t);
  await t.test("missing", () => {
    const result = readMetricsCutoverPostMergeBundleObservation(
      path.join(root, "missing.json"),
    );
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /input_missing/);
  });
  await t.test("directory", () => {
    const directory = path.join(root, "directory");
    mkdirSync(directory);
    const result = readMetricsCutoverPostMergeBundleObservation(directory);
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /not_regular_file/);
  });
  await t.test("symlink", () => {
    const result = readMetricsCutoverPostMergeBundleObservation("bundle", {
      fs: {
        lstatSync: () => ({
          size: 10,
          isSymbolicLink: () => true,
          isFile: () => false,
        }),
        realpathSync: () => "bundle",
        readFileSync: () => Buffer.alloc(10),
      },
    });
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /input_symlink/);
  });
  await t.test("oversized", () => {
    const result = readMetricsCutoverPostMergeBundleObservation("bundle", {
      maxInputBytes: MAX_INPUT_BYTES,
      fs: {
        lstatSync: () => ({
          size: MAX_INPUT_BYTES + 1,
          isSymbolicLink: () => false,
          isFile: () => true,
        }),
        realpathSync: () => "bundle",
        readFileSync: () => Buffer.alloc(0),
      },
    });
    assert.equal(result.ok, false);
    assert.match(result.blockingIssues.join("\n"), /size_invalid/);
  });
  for (const [name, bytes, pattern] of [
    ["invalid UTF-8", Buffer.from([0xff]), /invalid_utf8/],
    ["invalid JSON", Buffer.from("{"), /invalid_json/],
  ]) {
    await t.test(name, () => {
      const file = path.join(root, `${name.replace(/\s/g, "-")}.json`);
      writeFileSync(file, bytes);
      const result = readMetricsCutoverPostMergeBundleObservation(file);
      assert.equal(result.ok, false);
      assert.match(result.blockingIssues.join("\n"), pattern);
    });
  }
});

test("bundle A/B path, bytes, hash, size, and file identity must remain stable", async (t) => {
  const base = observation(Buffer.from("stable"));
  const mutations = [
    [
      "bytes",
      observation(Buffer.from("stablE")),
      /bytes_changed|sha256_changed/,
    ],
    [
      "canonical path",
      observation(Buffer.from("stable"), {
        canonicalInputPath: "C:\\other\\bundle.json",
      }),
      /canonical_path_changed/,
    ],
    [
      "size",
      observation(Buffer.from("stable"), { byteSize: 7 }),
      /byte_size_changed/,
    ],
    [
      "identity",
      observation(Buffer.from("stable"), { fileIdentity: "7:43" }),
      /file_identity_changed/,
    ],
    [
      "identity support",
      observation(Buffer.from("stable"), {
        fileIdentity: "",
        fileIdentitySupported: false,
      }),
      /identity_support_changed/,
    ],
  ];
  for (const [name, right, pattern] of mutations) {
    await t.test(name, () => {
      const result = compareMetricsCutoverOperatorBundleObservations(
        base,
        right,
      );
      assert.equal(result.ok, false);
      assert.match(result.issues.join("\n"), pattern);
    });
  }
});

test("coordinator blocks bundle changes across the Step 114-2S call", async (t) => {
  const left = observation(Buffer.from("before"));
  for (const [name, right, pattern] of [
    [
      "bytes and hash",
      observation(Buffer.from("after!")),
      /bytes_changed|sha256_changed/,
    ],
    [
      "canonical path",
      observation(Buffer.from("before"), {
        canonicalInputPath: "C:\\replacement\\operator-bundle.json",
      }),
      /canonical_path_changed/,
    ],
    [
      "byte size",
      observation(Buffer.from("before"), { byteSize: 99 }),
      /byte_size_changed/,
    ],
    [
      "file identity",
      observation(Buffer.from("before"), { fileIdentity: "7:99" }),
      /file_identity_changed/,
    ],
  ]) {
    await t.test(name, async () => {
      const { result, setup } = await buildUnitResult({
        observationA: left,
        observationB: right,
      });
      assert.equal(result.status, "blocked");
      assert.equal(setup.calls.dryRun, 1);
      assert.equal(setup.calls.observe, 2);
      assert.match(result.blockingIssues.join("\n"), pattern);
      assertSuppressed(result);
      assertFixedFalse(result);
    });
  }
});

test("unsupported file identity remains valid when both observations agree", async () => {
  const bytes = Buffer.from("stable-without-identity");
  const left = observation(bytes, {
    fileIdentity: "",
    fileIdentitySupported: false,
  });
  const right = observation(bytes, {
    fileIdentity: "",
    fileIdentitySupported: false,
  });
  const { result } = await buildUnitResult({
    observationA: left,
    observationB: right,
  });
  assert.equal(result.status, "request_ready");
});

test("Step 114-2S blocked, malformed authorization, and invalid counts propagate", async (t) => {
  for (const [name, dryRun, pattern] of [
    [
      "blocked",
      readyDryRun({
        ok: false,
        status: "blocked",
        dryRunReady: false,
        executionPackageHash: "",
        targetFileCount: 0,
        plannedWriteCount: 0,
      }),
      /step114_2s_result_invalid/,
    ],
    [
      "authorization",
      readyDryRun({ commitAuthorized: true }),
      /authorization_output_invalid/,
    ],
    [
      "target count",
      readyDryRun({ targetFileCount: 1 }),
      /targetFileCount/,
    ],
    [
      "write count",
      readyDryRun({ plannedWriteCount: 1 }),
      /plannedWriteCount/,
    ],
    [
      "delete count",
      readyDryRun({ plannedDeleteCount: 1 }),
      /plannedDeleteCount/,
    ],
  ]) {
    await t.test(name, async () => {
      const { result } = await buildUnitResult({ dryRun });
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), pattern);
      assertSuppressed(result);
      assertFixedFalse(result);
    });
  }
});

test("Step 114-2S target summary validation is exact and fail-closed", async (t) => {
  const cases = [
    [
      "target count",
      (targets) => {
        targets.pop();
      },
      /target_summary_count_invalid/,
    ],
    [
      "colliding path",
      (targets) => {
        targets[1].path = targets[0].path.toUpperCase();
      },
      /paths_not_distinct/,
    ],
    [
      "wrong role",
      (targets) => {
        targets[0].role = "kr_price_metrics";
      },
      /role_mismatch/,
    ],
    [
      "wrong market",
      (targets) => {
        targets[0].market = "KR";
      },
      /market_mismatch/,
    ],
    [
      "wrong schema",
      (targets) => {
        targets[0].schemaVersion = "wrong";
      },
      /schema_version_mismatch/,
    ],
    [
      "wrong write mode",
      (targets) => {
        targets[0].writeMode = "overwrite";
      },
      /write_mode_mismatch/,
    ],
    [
      "invalid size",
      (targets) => {
        targets[0].byteSize = 0;
      },
      /byte_size_invalid/,
    ],
    [
      "invalid row count",
      (targets) => {
        targets[0].rowCount = 0;
      },
      /row_count_invalid/,
    ],
    [
      "invalid hash",
      (targets) => {
        targets[0].sha256 = "x";
      },
      /sha256_invalid/,
    ],
    [
      "extra field",
      (targets) => {
        targets[0].contentBase64 = "forbidden";
      },
      /fields_invalid/,
    ],
  ];
  for (const [name, mutate, pattern] of cases) {
    await t.test(name, async () => {
      const targets = [
        targetSummary("us_price_metrics"),
        targetSummary("kr_price_metrics"),
      ];
      mutate(targets);
      const dryRun = readyDryRun({ targetSummaries: targets });
      const validation = validateMetricsCutoverPostMergeDryRunSummary(dryRun);
      assert.equal(validation.ok, false);
      assert.match(validation.issues.join("\n"), pattern);
      const { result } = await buildUnitResult({ dryRun });
      assert.equal(result.status, "blocked");
      assertSuppressed(result);
    });
  }
});

test("caller-supplied approval, signature, readiness, hash, or execution fields block", async (t) => {
  for (const field of [
    "approvalGranted",
    "signatureBase64",
    "approvalRequestReady",
    "executionPackageHash",
    "executionAuthorized",
  ]) {
    await t.test(field, async () => {
      const result = await runMetricsCutoverExecutionApprovalRequest({
        repo: "repo",
        inputPath: "bundle",
        [field]: true,
      });
      assert.equal(result.status, "blocked");
      assert.match(result.blockingIssues.join("\n"), /invocation_invalid/);
      assertSuppressed(result);
      assertFixedFalse(result);
    });
  }
});

test("blocked and idle results suppress approval request and execution package identity", async () => {
  const idle = await runMetricsCutoverExecutionApprovalRequest({});
  assert.equal(idle.status, "idle");
  assertSuppressed(idle);
  assertFixedFalse(idle);

  const blocked = await runMetricsCutoverExecutionApprovalRequest({
    repo: "repo",
  });
  assert.equal(blocked.status, "blocked");
  assertSuppressed(blocked);
  assertFixedFalse(blocked);
});

test("CLI accepts exactly --repo and --input and emits one JSON line", async () => {
  for (const [name, argv, result, expectedCode] of [
    [
      "ready",
      ["--repo", "repo", "--input", "bundle"],
      { status: "request_ready" },
      0,
    ],
    [
      "blocked",
      ["--repo", "repo", "--input", "bundle"],
      { status: "blocked" },
      1,
    ],
  ]) {
    const stdout = [];
    const stderr = [];
    const code = await runCli(argv, {
      runApprovalRequest: async () => result,
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    });
    assert.equal(code, expectedCode, name);
    assert.equal(stdout.length, 1);
    assert.equal(stdout[0].trim().split(/\r?\n/).length, 1);
    JSON.parse(stdout[0]);
    assert.equal(stderr.length, 0);
  }

  for (const argv of [
    ["--repo", "repo"],
    ["--repo", "repo", "--input", "bundle", "--output", "request.json"],
    ["--repo", "repo", "--signature", "value"],
    ["--repo", "repo", "--input", "bundle", "--input", "other"],
  ]) {
    const stdout = [];
    const stderr = [];
    const code = await runCli(argv, {
      stdout: (value) => stdout.push(value),
      stderr: (value) => stderr.push(value),
    });
    assert.equal(code, 2);
    assert.equal(stdout.length, 1);
    assert.equal(stderr.length, 1);
  }
});

test("ready result and request expose only explicit safe fields", async () => {
  const { result } = await buildUnitResult();
  assert.deepEqual(
    Object.keys(result.approvalRequest.targets[0]).sort(),
    [...TARGET_FIELDS].sort(),
  );
  assert.equal(Object.hasOwn(result, "finalApprovalInput"), false);
  assert.equal(Object.hasOwn(result, "finalApprovalOptions"), false);
  assert.equal(Object.hasOwn(result, "canonicalInputPath"), false);
  assert.equal(Object.hasOwn(result, "executionPackage"), false);
  assert.equal(Object.hasOwn(result.approvalRequest, "receiptId"), false);
  const serialized = JSON.stringify(result);
  for (const forbidden of [
    "contentBase64",
    "selectorContentBase64",
    "rollbackBundle",
    "exactDiff",
    "signatureBase64",
    "publicKeyPem",
    "privateKey",
    "password",
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});

test("production Step 114-2T sources contain no write, mutation, signing, or external action", () => {
  const source = [
    "lib/metrics-cutover-execution-approval-request.cjs",
    "build-metrics-cutover-execution-approval-request.cjs",
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
    "spawn(",
    "spawnSync(",
    "exec(",
    "execFile(",
    "shell: true",
    "generateKeyPair",
    "signPayload",
    "verifySignature",
    "fetch(",
    "https:",
    "database.",
    "provider.",
    "deploymentApi",
    "publicationApi",
    "pointerMutationExecuted: true",
    "rollbackExecuted: true",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
