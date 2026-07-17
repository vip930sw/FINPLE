const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  hashMetricsCutoverExecutionInvocationReceipt,
  recomputeMetricsCutoverExecutionInvocationReceiptId,
} = require("../lib/metrics-cutover-execution-invocation.cjs");
const {
  TARGET_SCHEMA_VERSION,
} = require("../lib/metrics-cutover-execution-approval-request.cjs");
const {
  canonicalJson,
} = require("../lib/metrics-cutover-guarded-executor-contracts.cjs");
const test = require("node:test");

const {
  FIXED_FALSE_FIELDS,
  SELECTOR_PATH,
  TEST_FIXTURE_CONTRACT_VERSION,
  TEST_MARKER_FILE,
  runMetricsCutoverGuardedExecutor,
} = require("../lib/metrics-cutover-guarded-executor.cjs");
const { parseArguments, runCli } = require("../run-metrics-cutover-guarded-executor.cjs");

const OLD_US = "./us_price_metrics_overlay_20260528_app_ready.csv?raw";
const OLD_KR = "./kr_price_metrics_overlay_20260528_app_ready.csv?raw";
const US_TARGET = "src/data/tickers/us_price_metrics_overlay_step114_2x_a_test.csv";
const KR_TARGET = "src/data/tickers/kr_price_metrics_overlay_step114_2x_a_test.csv";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function runGit(repo, args) {
  const result = spawnSync("git", args, {
    cwd: repo,
    shell: false,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_DATE: "2026-07-17T00:00:00Z",
      GIT_COMMITTER_DATE: "2026-07-17T00:00:00Z",
    },
  });
  assert.equal(
    result.status,
    0,
    `git ${args.join(" ")} failed: ${result.stderr || result.stdout}`,
  );
  return result.stdout.trim();
}

function selectorText() {
  return [
    'import finpleAppCandidates2000Csv from "./finple_app_candidates_2000_final_v1.csv?raw";',
    'import krEtfDividendOverlayCsv from "./kr_etf_dividend_overlay_20260525.csv?raw";',
    'import krStockDividendOverlayCsv from "./kr_stock_dividend_overlay_20260525.csv?raw";',
    'import usDividendOverlayCsv from "./us_dividend_overlay_20260527.csv?raw";',
    `import usPriceMetricsOverlayCsv from "${OLD_US}";`,
    `import krPriceMetricsOverlayCsv from "${OLD_KR}";`,
    "",
    "export default {};",
    "",
  ].join("\n");
}

function writeTrackedFixture(repo) {
  const tickerDir = path.join(repo, "src/data/tickers");
  mkdirSync(tickerDir, { recursive: true });
  writeFileSync(
    path.join(repo, TEST_MARKER_FILE),
    `${JSON.stringify(
      {
        contractVersion: TEST_FIXTURE_CONTRACT_VERSION,
        fixtureId: "step114-2x-a-focused-test",
        testOnly: true,
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(path.join(repo, ...SELECTOR_PATH.split("/")), selectorText());
  for (const name of [
    "finple_app_candidates_2000_final_v1.csv",
    "kr_etf_dividend_overlay_20260525.csv",
    "kr_stock_dividend_overlay_20260525.csv",
    "us_dividend_overlay_20260527.csv",
    "us_price_metrics_overlay_20260528_app_ready.csv",
    "kr_price_metrics_overlay_20260528_app_ready.csv",
  ]) {
    writeFileSync(path.join(tickerDir, name), "market,ticker\nUS,TEST\n");
  }
}

function createRepository(root, name = "repo") {
  const repo = path.join(root, name);
  mkdirSync(repo, { recursive: true });
  runGit(repo, ["init", "-b", "test/step114-2x-a-fixture"]);
  runGit(repo, ["config", "user.name", "FINPLE Step 114-2X-A Test"]);
  runGit(repo, ["config", "user.email", "step114-2x-a@example.invalid"]);
  writeTrackedFixture(repo);
  runGit(repo, ["add", "."]);
  runGit(repo, ["commit", "-m", "Synthetic Step 114-2X-A preimage"]);
  return repo;
}

function target(role, market, targetPath, ticker) {
  const text = [
    "market,ticker,expectedCagr,priceCagr10y,mdd,beta,dataYears,benchmarkTicker,metricsStatus,metricsSource,reviewReason",
    `${market},${ticker},10.5,9.5,-20.0,1.0,10.0,${market === "US" ? "SPY" : "^KS11"},ready,synthetic_test,`,
    "",
  ].join("\n");
  const bytes = Buffer.from(text, "utf8");
  return {
    role,
    importName:
      role === "us_price_metrics"
        ? "usPriceMetricsOverlayCsv"
        : "krPriceMetricsOverlayCsv",
    path: targetPath,
    contentBase64: bytes.toString("base64"),
    sha256: sha256(bytes),
    byteSize: bytes.length,
    rowCount: 1,
    market,
    schemaVersion: TARGET_SCHEMA_VERSION,
    writeMode: "create_only",
  };
}

function summary(targetValue) {
  return {
    role: targetValue.role,
    path: targetValue.path,
    sha256: targetValue.sha256,
    byteSize: targetValue.byteSize,
    rowCount: targetValue.rowCount,
    market: targetValue.market,
    schemaVersion: targetValue.schemaVersion,
    writeMode: targetValue.writeMode,
  };
}

function resealExecution(execution) {
  for (const packageResult of [
    execution.prepared.packageA,
    execution.prepared.packageB,
  ]) {
    const payload = structuredClone(packageResult.executionPackage);
    delete payload.executionPackageHash;
    packageResult.executionPackage.executionPackageHash = sha256(
      Buffer.from(canonicalJson(payload), "utf8"),
    );
    packageResult.executionPackageHash =
      packageResult.executionPackage.executionPackageHash;
  }
  const receipt = execution.verification.invocationReceipt;
  receipt.executionPackageHash =
    execution.prepared.packageA.executionPackageHash;
  receipt.receiptId =
    recomputeMetricsCutoverExecutionInvocationReceiptId(receipt);
  receipt.receiptHash = "0".repeat(64);
  receipt.receiptHash = hashMetricsCutoverExecutionInvocationReceipt(receipt);
  execution.invocationReceipt = receipt;
  execution.executionPackage = execution.prepared.packageA.executionPackage;
  return execution;
}

function makeExecution(repo) {
  const head = runGit(repo, ["rev-parse", "HEAD"]);
  const tree = runGit(repo, ["rev-parse", "HEAD^{tree}"]);
  const tracked = runGit(repo, ["ls-files"])
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();
  const trackedPathsSha256 = sha256(Buffer.from(tracked.join("\0"), "utf8"));
  const preimageBytes = readFileSync(path.join(repo, ...SELECTOR_PATH.split("/")));
  const postimageText = preimageBytes
    .toString("utf8")
    .replace(
      OLD_US,
      `./${path.basename(US_TARGET)}?raw`,
    )
    .replace(
      OLD_KR,
      `./${path.basename(KR_TARGET)}?raw`,
    );
  const postimageBytes = Buffer.from(postimageText, "utf8");
  const us = target("us_price_metrics", "US", US_TARGET, "AAPL");
  const kr = target("kr_price_metrics", "KR", KR_TARGET, "005930");
  const targetPathAbsenceEvidenceHash = "d".repeat(64);
  const executionPackage = {
    contractVersion: "metrics-cutover-execution-package-v1-step114-2q",
    cutoverRehearsalEvidenceHash: "c".repeat(64),
    candidatePackageId: "step114-2x-a-synthetic-candidate",
    candidatePackageHash: "1".repeat(64),
    zipPackageSha256: "2".repeat(64),
    packageIndexFile: "candidate-package-index.json",
    selectorProvenanceCommitSha: "3".repeat(40),
    repositoryHeadSha: head,
    repositoryTreeSha: tree,
    trackedPathsSha256,
    targetPathAbsenceEvidenceHash,
    branchName: "test/step114-2x-a-fixture",
    repositoryPreimage: {
      contractVersion: "metrics-repository-preimage-v1-step114-2q",
      selectorProvenanceCommitSha: "3".repeat(40),
      repositoryHeadSha: head,
      repositoryTreeSha: tree,
      selectorPath: SELECTOR_PATH,
      selectorContentBase64: preimageBytes.toString("base64"),
      selectorSha256: sha256(preimageBytes),
      trackedPaths: tracked,
      trackedPathsSha256,
      targetPathAbsenceEvidenceHash,
      worktreeClean: true,
      branchName: "test/step114-2x-a-fixture",
    },
    selectorPreimage: {
      contractVersion: "metrics-repository-preimage-v1-step114-2q",
      selectorPath: SELECTOR_PATH,
      selectorContentBase64: preimageBytes.toString("base64"),
      selectorSha256: sha256(preimageBytes),
    },
    targetFiles: [us, kr],
    selectorPostimage: {
      selectorPath: SELECTOR_PATH,
      selectorContentBase64: postimageBytes.toString("base64"),
      selectorSha256: sha256(postimageBytes),
    },
    exactDiff: { replacementCount: 2, changedLineCount: 2 },
    pointerIdentities: {
      currentPointerIdentityHash: "4".repeat(64),
      targetPointerIdentityHash: "5".repeat(64),
      rollbackPointerIdentityHash: "4".repeat(64),
    },
    rollbackBundle: { rollbackFileDeletes: [] },
    executionPolicy: { requireCreateOnlyTargets: true },
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
    executionPackageHash: "0".repeat(64),
  };
  const packagePayload = structuredClone(executionPackage);
  delete packagePayload.executionPackageHash;
  executionPackage.executionPackageHash = sha256(
    Buffer.from(canonicalJson(packagePayload), "utf8"),
  );
  const executionPackageHash = executionPackage.executionPackageHash;
  const invocationReceipt = {
    contractVersion: "metrics-cutover-execution-invocation-receipt-v1-step114-2w",
    receiptId: "",
    receiptStatus: "verified_unconsumed",
    invocationId: `metrics-cutover-execution-invocation-${"2".repeat(64)}`,
    invocationHash: "3".repeat(64),
    authorityPackageId: `metrics-cutover-authority-package-${"4".repeat(64)}`,
    authorityPackageHash: "5".repeat(64),
    requestId: `metrics-cutover-request-${"6".repeat(64)}`,
    requestHash: "7".repeat(64),
    verificationReceiptHash: "8".repeat(64),
    operatorBundleSha256: "9".repeat(64),
    repositoryHeadSha: head,
    repositoryTreeSha: tree,
    trackedPathsSha256,
    targetPathAbsenceEvidenceHash,
    executionPackageHash,
    selectorPreimageSha256: sha256(preimageBytes),
    selectorPostimageSha256: sha256(postimageBytes),
    invocationNonceHash: "a".repeat(64),
    invokerKeyId: "step114-2x-a-invoker-key",
    invokerId: "step114-2x-a-invoker",
    invokedAt: "2026-07-17T00:55:00.000Z",
    expiresAt: "2026-07-17T01:05:00.000Z",
    targets: [summary(us), summary(kr)],
    plannedWriteCount: 2,
    plannedDeleteCount: 0,
    receiptRequirements: {
      requiresExactRepositoryHead: true,
      requiresExactRepositoryTree: true,
      requiresExactTrackedPathsHash: true,
      requiresFreshAuthorityReproduction: true,
      requiresFreshApprovalReverification: true,
      requiresCreateOnlyWrites: true,
      requiresExactTwoSelectorReplacements: true,
      requiresPostWriteVerification: true,
      singleUse: true,
      allowTargetDeletion: false,
      allowAutomaticRollback: false,
    },
    receiptHash: "0".repeat(64),
  };
  invocationReceipt.receiptId =
    recomputeMetricsCutoverExecutionInvocationReceiptId(invocationReceipt);
  invocationReceipt.receiptHash =
    hashMetricsCutoverExecutionInvocationReceipt(invocationReceipt);
  const packageResult = {
    ok: true,
    status: "package_ready",
    executionPackageHash,
    executionPackage,
  };
  return {
    verification: {
      ok: true,
      status: "execution_invocation_verified",
      invocationReceipt,
    },
    prepared: {
      status: "ready",
      packageA: structuredClone(packageResult),
      packageB: structuredClone(packageResult),
    },
    invocationReceipt,
    executionPackage,
  };
}

function adapters(execution, fault) {
  return {
    verifyInvocation: async () => structuredClone(execution.verification),
    prepareExecutionPackage: async () => structuredClone(execution.prepared),
    fault,
  };
}

function input(repo, claimDirectory) {
  return {
    repo,
    claimDirectory,
    inputPath: "synthetic-operator-bundle.json",
    responsePath: "synthetic-response.json",
    allowlistPath: "synthetic-approver-allowlist.json",
    invocationPath: "synthetic-invocation.json",
    invokerAllowlistPath: "synthetic-invoker-allowlist.json",
  };
}

function assertFixedFalse(result) {
  for (const field of FIXED_FALSE_FIELDS) assert.equal(result[field], false, field);
}

function claimFiles(claimDirectory) {
  return require("node:fs")
    .readdirSync(claimDirectory)
    .filter((name) => name.endsWith(".json"));
}

function setup() {
  const root = mkdtempSync(path.join(os.tmpdir(), "finple-step114-2x-a-"));
  const repo = createRepository(root);
  const claimDirectory = path.join(root, "claims");
  mkdirSync(claimDirectory);
  const execution = makeExecution(repo);
  return { root, repo, claimDirectory, execution };
}

module.exports = {
  FIXED_FALSE_FIELDS,
  SELECTOR_PATH,
  TEST_FIXTURE_CONTRACT_VERSION,
  TEST_MARKER_FILE,
  OLD_US,
  OLD_KR,
  US_TARGET,
  KR_TARGET,
  sha256,
  runGit,
  selectorText,
  writeTrackedFixture,
  createRepository,
  target,
  summary,
  makeExecution,
  resealExecution,
  adapters,
  input,
  assertFixedFalse,
  claimFiles,
  setup,
  runMetricsCutoverGuardedExecutor,
  parseArguments,
  runCli,
};
