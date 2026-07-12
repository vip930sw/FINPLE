const assert = require("node:assert/strict");
const test = require("node:test");
const {
  GROUP_ORDER,
  buildGroupPlan,
  buildNodeTestArgs,
  parseArgs,
  runAllGroups,
  runGroup,
} = require("./run-trading-ai-ml-regression-group.cjs");
const { getAiMlRegressionGroup } = require("./trading-ai-ml-regression-groups.cjs");

test("Scenario F: unknown group is rejected with non-zero status", () => {
  const result = runGroup("unknown-group", { executor: () => ({ status: 0 }) });
  assert.equal(result.ok, false);
  assert.equal(result.status, 1);
  assert.match(result.error, /unknown AI\/ML regression group/);
});

test("Scenario G: plan mode returns limited metadata without running tests", () => {
  const group = getAiMlRegressionGroup("contract-chain");
  const plan = buildGroupPlan(group);
  assert.deepEqual(plan.coveredStepIds, ["step196", "step197", "step198", "step199"]);
  assert.equal(plan.groupId, "contract-chain");
  assert.equal(plan.testFileCount, plan.testFiles.length);
  assert.ok(plan.testFiles.includes("server/src/services/tradingAiMlManifestHandoffEligibility.test.js"));
});

test("Scenario H: command construction uses process.execPath, dot reporter, explicit files, and shell false", () => {
  const calls = [];
  const result = runGroup("architecture-foundation", {
    executor: (command, args, options) => {
      calls.push({ command, args, options });
      return { status: 0 };
    },
    stdio: "pipe",
    cwd: "repo-root",
  });
  assert.equal(result.status, 0);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].command, process.execPath);
  assert.equal(calls[0].options.shell, false);
  assert.equal(calls[0].options.cwd, "repo-root");
  assert.deepEqual(calls[0].args.slice(0, 2), ["--test", "--test-reporter=dot"]);
  assert.ok(calls[0].args.includes("scripts/check-trading-step195-ai-ml-readiness-gate-summary.test.cjs"));
});

test("Scenario I: child failure propagates and all-group execution stops at first failing group", () => {
  const calls = [];
  const result = runAllGroups({
    executor: (command, args) => {
      calls.push({ command, args });
      return { status: calls.length === 2 ? 7 : 0 };
    },
    stdio: "pipe",
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, 7);
  assert.equal(result.failedGroupId, "contract-chain");
  assert.deepEqual(calls.map((call) => call.args[2]), [
    "server/src/services/tradingAiMlStrategyManagement.test.js",
    "server/src/services/tradingAiMlBatchContractReview.test.js",
  ]);
});

test("runner parses allowlisted CLI modes and rejects unknown arguments", () => {
  assert.deepEqual(parseArgs(["--group", "contract-chain", "--plan"]), {
    all: false,
    list: false,
    plan: true,
    groupId: "contract-chain",
  });
  assert.throws(() => parseArgs(["--file", "x.test.js"]), /unknown argument/);
});

test("runner keeps aggregate group order deterministic", () => {
  assert.deepEqual([...GROUP_ORDER], [
    "architecture-foundation",
    "contract-chain",
    "consolidation-primitives",
  ]);
  assert.deepEqual(buildNodeTestArgs(["a.test.cjs"]), ["--test", "--test-reporter=dot", "a.test.cjs"]);
  assert.throws(() => buildNodeTestArgs([]), /empty test file list/);
});
