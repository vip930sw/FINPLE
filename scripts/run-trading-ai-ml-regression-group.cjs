const { spawnSync } = require("node:child_process");
const {
  collectGroupTestFiles,
  getAiMlRegressionGroup,
  listAiMlRegressionGroups,
  validateAiMlRegressionCoverage,
} = require("./trading-ai-ml-regression-groups.cjs");

const GROUP_ORDER = Object.freeze([
  "architecture-foundation",
  "contract-chain",
  "consolidation-primitives",
]);

function buildNodeTestArgs(testFiles) {
  if (!Array.isArray(testFiles) || testFiles.length === 0) {
    throw new Error("empty test file list is not allowed");
  }
  return Object.freeze(["--test", "--test-reporter=dot", ...testFiles]);
}

function buildGroupPlan(group) {
  const testFiles = collectGroupTestFiles(group);
  return Object.freeze({
    groupId: group.groupId,
    coveredStepIds: Object.freeze([...group.coveredStepIds]),
    testFileCount: testFiles.length,
    testFiles,
  });
}

function runGroup(groupId, { executor = spawnSync, stdio = "inherit", cwd = process.cwd() } = {}) {
  const group = getAiMlRegressionGroup(groupId);
  if (!group) {
    return Object.freeze({
      ok: false,
      status: 1,
      error: `unknown AI/ML regression group: ${groupId}`,
    });
  }
  const testFiles = collectGroupTestFiles(group);
  if (testFiles.length === 0) {
    return Object.freeze({
      ok: false,
      status: 1,
      error: `empty AI/ML regression group: ${groupId}`,
    });
  }
  const args = buildNodeTestArgs(testFiles);
  const result = executor(process.execPath, args, {
    cwd,
    shell: false,
    stdio,
  });
  const status = typeof result?.status === "number" ? result.status : 1;
  return Object.freeze({
    ok: status === 0,
    status,
    groupId,
    args,
  });
}

function runAllGroups(options = {}) {
  const results = [];
  for (const groupId of GROUP_ORDER) {
    const result = runGroup(groupId, options);
    results.push(result);
    if (result.status !== 0) {
      return Object.freeze({
        ok: false,
        status: result.status,
        failedGroupId: groupId,
        results: Object.freeze(results),
      });
    }
  }
  return Object.freeze({
    ok: true,
    status: 0,
    results: Object.freeze(results),
  });
}

function parseArgs(argv) {
  const args = [...argv];
  const parsed = {
    all: false,
    list: false,
    plan: false,
    groupId: null,
  };
  while (args.length > 0) {
    const arg = args.shift();
    if (arg === "--all") parsed.all = true;
    else if (arg === "--list") parsed.list = true;
    else if (arg === "--plan") parsed.plan = true;
    else if (arg === "--group") parsed.groupId = args.shift() || "";
    else throw new Error(`unknown argument: ${arg}`);
  }
  return parsed;
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function main(argv = process.argv.slice(2)) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 1;
  }

  const coverage = validateAiMlRegressionCoverage();
  if (!coverage.ok) {
    process.stderr.write(`${coverage.errors.join("\n")}\n`);
    return 1;
  }

  if (parsed.list) {
    printJson(listAiMlRegressionGroups().map((group) => group.groupId));
    return 0;
  }

  if (parsed.plan) {
    if (parsed.all) {
      printJson(GROUP_ORDER.map((groupId) => buildGroupPlan(getAiMlRegressionGroup(groupId))));
      return 0;
    }
    const group = getAiMlRegressionGroup(parsed.groupId);
    if (!group) {
      process.stderr.write(`unknown AI/ML regression group: ${parsed.groupId}\n`);
      return 1;
    }
    printJson(buildGroupPlan(group));
    return 0;
  }

  if (parsed.all) {
    return runAllGroups().status;
  }
  if (parsed.groupId) {
    const result = runGroup(parsed.groupId);
    if (result.error) process.stderr.write(`${result.error}\n`);
    return result.status;
  }

  process.stderr.write("expected --group <groupId>, --all, --list, or --plan\n");
  return 1;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  GROUP_ORDER,
  buildGroupPlan,
  buildNodeTestArgs,
  main,
  parseArgs,
  runAllGroups,
  runGroup,
};
