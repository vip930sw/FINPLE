const assert = require("node:assert/strict");
const {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  FIXED_FALSE_FIELDS,
  OLD_US,
  OLD_KR,
  SELECTOR_PATH,
  TEST_MARKER_FILE,
  US_TARGET,
  KR_TARGET,
  adapters,
  assertFixedFalse,
  claimFiles,
  input,
  makeExecution,
  parseArguments,
  runCli,
  runGit,
  runMetricsCutoverGuardedExecutor,
  selectorText,
  setup,
  sha256,
} = require("./test-support/metrics-cutover-guarded-executor-fixture.cjs");

test("guarded executor completes exactly two create-only writes and one selector postimage", async (t) => {
  const fixture = setup();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const result = await runMetricsCutoverGuardedExecutor(
    input(fixture.repo, fixture.claimDirectory),
    adapters(fixture.execution),
  );
  assert.equal(result.status, "cutover_execution_completed", result.blockingIssues.join(","));
  assert.equal(result.ok, true);
  assert.equal(result.claimAcquired, true);
  assert.equal(result.receiptConsumed, true);
  assert.equal(result.targetsCreated, true);
  assert.equal(result.selectorUpdated, true);
  assert.equal(result.postWriteVerified, true);
  assert.equal(result.targetFileCount, 2);
  assert.equal(result.actualWriteCount, 2);
  assert.equal(result.actualDeleteCount, 0);
  assert.equal(existsSync(path.join(fixture.repo, ...US_TARGET.split("/"))), true);
  assert.equal(existsSync(path.join(fixture.repo, ...KR_TARGET.split("/"))), true);
  const selector = readFileSync(path.join(fixture.repo, ...SELECTOR_PATH.split("/")), "utf8");
  assert.equal(selector.includes(OLD_US), false);
  assert.equal(selector.includes(OLD_KR), false);
  assert.equal(selector.includes(`./${path.basename(US_TARGET)}?raw`), true);
  assert.equal(selector.includes(`./${path.basename(KR_TARGET)}?raw`), true);
  assert.equal(claimFiles(fixture.claimDirectory).length, 1);
  const claim = JSON.parse(
    readFileSync(path.join(fixture.claimDirectory, claimFiles(fixture.claimDirectory)[0]), "utf8"),
  );
  assert.equal(claim.claimStatus, "consumed_success");
  assertFixedFalse(result);
});

test("a duplicate receipt claim blocks before touching a second identical repository", async (t) => {
  const fixture = setup();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const secondRepo = path.join(fixture.root, "repo-copy");
  cpSync(fixture.repo, secondRepo, { recursive: true });
  const first = await runMetricsCutoverGuardedExecutor(
    input(fixture.repo, fixture.claimDirectory),
    adapters(fixture.execution),
  );
  assert.equal(first.status, "cutover_execution_completed");
  const secondExecution = makeExecution(secondRepo);
  secondExecution.verification.invocationReceipt.receiptId =
    fixture.execution.invocationReceipt.receiptId;
  secondExecution.verification.invocationReceipt.receiptHash =
    fixture.execution.invocationReceipt.receiptHash;
  const second = await runMetricsCutoverGuardedExecutor(
    input(secondRepo, fixture.claimDirectory),
    adapters(secondExecution),
  );
  assert.equal(second.status, "blocked");
  assert.ok(second.blockingIssues.includes("receipt_already_claimed"));
  assert.equal(existsSync(path.join(secondRepo, ...US_TARGET.split("/"))), false);
  assertFixedFalse(second);
});

test("an existing target blocks before the claim is acquired", async (t) => {
  const fixture = setup();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  writeFileSync(path.join(fixture.repo, ...US_TARGET.split("/")), "unexpected\n");
  const result = await runMetricsCutoverGuardedExecutor(
    input(fixture.repo, fixture.claimDirectory),
    adapters(fixture.execution),
  );
  assert.equal(result.status, "blocked");
  assert.ok(result.blockingIssues.includes("test_repository_not_clean"));
  assert.equal(claimFiles(fixture.claimDirectory).length, 0);
  assertFixedFalse(result);
});

for (const [name, faultStage, assertions] of [
  [
    "target appears after claim but before exclusive create",
    "before_target_0_create",
    ({ repo }) => {
      writeFileSync(path.join(repo, ...US_TARGET.split("/")), "raced\n", { flag: "wx" });
    },
  ],
  ["failure after first target", "after_target_0_create", null],
  ["failure after second target", "after_target_1_create", null],
  [
    "selector preimage drift before selector write",
    "before_selector_preimage_check",
    ({ repo }) => {
      writeFileSync(
        path.join(repo, ...SELECTOR_PATH.split("/")),
        `${selectorText()}// drift\n`,
      );
    },
  ],
  ["selector write failure injection", "before_selector_write", null],
  [
    "post-write target tampering",
    "before_post_write_verification",
    ({ repo }) => {
      writeFileSync(path.join(repo, ...US_TARGET.split("/")), "tampered\n");
    },
  ],
]) {
  test(`${name} becomes consumed_failed_manual_review without rollback`, async (t) => {
    const fixture = setup();
    t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
    const result = await runMetricsCutoverGuardedExecutor(
      input(fixture.repo, fixture.claimDirectory),
      adapters(fixture.execution, (stage) => {
        if (stage !== faultStage) return;
        if (typeof assertions === "function") assertions(fixture);
        else throw new Error(`fault_${faultStage}`);
        if (faultStage === "before_target_0_create" || faultStage === "before_selector_preimage_check" || faultStage === "before_post_write_verification") {
          return;
        }
      }),
    );
    assert.equal(result.status, "consumed_failed_manual_review");
    assert.equal(result.claimAcquired, true);
    assert.equal(result.receiptConsumed, true);
    assert.equal(result.actualDeleteCount, 0);
    assert.equal(claimFiles(fixture.claimDirectory).length, 1);
    const claim = JSON.parse(
      readFileSync(path.join(fixture.claimDirectory, claimFiles(fixture.claimDirectory)[0]), "utf8"),
    );
    assert.equal(claim.claimStatus, "consumed_failed_manual_review");
    assertFixedFalse(result);
  });
}

test("an unexpected fourth changed path fails post-write verification", async (t) => {
  const fixture = setup();
  t.after(() => rmSync(fixture.root, { recursive: true, force: true }));
  const result = await runMetricsCutoverGuardedExecutor(
    input(fixture.repo, fixture.claimDirectory),
    adapters(fixture.execution, (stage) => {
      if (stage === "before_post_write_verification") {
        writeFileSync(path.join(fixture.repo, "unexpected-fourth-path.txt"), "unexpected\n");
      }
    }),
  );
  assert.equal(result.status, "consumed_failed_manual_review");
  assert.ok(result.blockingIssues.includes("postwrite_changed_paths_invalid"));
  assert.equal(existsSync(path.join(fixture.repo, "unexpected-fourth-path.txt")), true);
  assertFixedFalse(result);
});

test("missing marker, main branch, and claim directory inside repo all block", async (t) => {
  await t.test("missing marker", async () => {
    const fixture = setup();
    rmSync(path.join(fixture.repo, TEST_MARKER_FILE));
    const result = await runMetricsCutoverGuardedExecutor(
      input(fixture.repo, fixture.claimDirectory),
      adapters(fixture.execution),
    );
    assert.equal(result.status, "blocked");
    rmSync(fixture.root, { recursive: true, force: true });
  });
  await t.test("main branch", async () => {
    const fixture = setup();
    runGit(fixture.repo, ["branch", "-m", "main"]);
    const result = await runMetricsCutoverGuardedExecutor(
      input(fixture.repo, fixture.claimDirectory),
      adapters(fixture.execution),
    );
    assert.equal(result.status, "blocked");
    assert.ok(result.blockingIssues.includes("test_repository_branch_invalid"));
    rmSync(fixture.root, { recursive: true, force: true });
  });
  await t.test("claim directory inside repository", async () => {
    const fixture = setup();
    const inside = path.join(fixture.repo, "claims");
    mkdirSync(inside);
    const result = await runMetricsCutoverGuardedExecutor(
      input(fixture.repo, inside),
      adapters(fixture.execution),
    );
    assert.equal(result.status, "blocked");
    assert.ok(result.blockingIssues.includes("claim_directory_inside_repository"));
    rmSync(fixture.root, { recursive: true, force: true });
  });
});

test("tracked inventory drift and a non-exact selector postimage block before claim", async (t) => {
  await t.test("tracked inventory hash drift", async () => {
    const fixture = setup();
    fixture.execution.verification.invocationReceipt.trackedPathsSha256 = "f".repeat(64);
    fixture.execution.prepared.packageA.executionPackage.trackedPathsSha256 = "f".repeat(64);
    fixture.execution.prepared.packageB.executionPackage.trackedPathsSha256 = "f".repeat(64);
    const result = await runMetricsCutoverGuardedExecutor(
      input(fixture.repo, fixture.claimDirectory),
      adapters(fixture.execution),
    );
    assert.equal(result.status, "blocked");
    assert.ok(result.blockingIssues.includes("repository_tracked_paths_changed"));
    assert.equal(claimFiles(fixture.claimDirectory).length, 0);
    rmSync(fixture.root, { recursive: true, force: true });
  });
  await t.test("selector postimage contains an unrelated edit", async () => {
    const fixture = setup();
    const packageValue = fixture.execution.prepared.packageA.executionPackage;
    const bytes = Buffer.from(
      `${Buffer.from(packageValue.selectorPostimage.selectorContentBase64, "base64").toString("utf8")}\n// unrelated\n`,
      "utf8",
    );
    for (const packageResult of [
      fixture.execution.prepared.packageA,
      fixture.execution.prepared.packageB,
    ]) {
      packageResult.executionPackage.selectorPostimage.selectorContentBase64 =
        bytes.toString("base64");
      packageResult.executionPackage.selectorPostimage.selectorSha256 = sha256(bytes);
    }
    fixture.execution.verification.invocationReceipt.selectorPostimageSha256 = sha256(bytes);
    const result = await runMetricsCutoverGuardedExecutor(
      input(fixture.repo, fixture.claimDirectory),
      adapters(fixture.execution),
    );
    assert.equal(result.status, "blocked");
    assert.ok(
      result.blockingIssues.includes(
        "selector_postimage_not_exact_two_replacements",
      ),
    );
    assert.equal(claimFiles(fixture.claimDirectory).length, 0);
    rmSync(fixture.root, { recursive: true, force: true });
  });
});

test("CLI accepts exactly seven unique flags and emits one sanitized line", async () => {
  const argv = [
    "--repo", "repo",
    "--claim-dir", "claims",
    "--input", "bundle.json",
    "--response", "response.json",
    "--allowlist", "approver.json",
    "--invocation", "invocation.json",
    "--invoker-allowlist", "invoker.json",
  ];
  assert.deepEqual(parseArguments(argv), {
    repo: "repo",
    claimDirectory: "claims",
    inputPath: "bundle.json",
    responsePath: "response.json",
    allowlistPath: "approver.json",
    invocationPath: "invocation.json",
    invokerAllowlistPath: "invoker.json",
  });
  assert.throws(
    () => parseArguments([...argv.slice(0, -2), "--repo", "again"]),
    /duplicate_flag/,
  );
  assert.throws(() => parseArguments([...argv, "--extra", "x"]));

  const lines = [];
  const exitCodes = [];
  await runCli(argv, {
    writeStdout: (value) => lines.push(value),
    setExitCode: (value) => exitCodes.push(value),
    runExecutor: async () => ({
      ok: true,
      status: "cutover_execution_completed",
      contractVersion: "metrics-cutover-execution-summary-v1-step114-2x-a",
      blockingIssues: [],
      warningIssues: [],
    }),
  });
  assert.equal(lines.length, 1);
  assert.equal(lines[0].split("\n").filter(Boolean).length, 1);
  assert.equal(exitCodes.at(-1), 0);
});
