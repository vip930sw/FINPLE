#!/usr/bin/env node

const {
  FIXED_FALSE_FIELDS,
  EXECUTION_SUMMARY_CONTRACT_VERSION,
  runMetricsCutoverGuardedExecutor,
} = require("./lib/metrics-cutover-guarded-executor.cjs");

const FLAG_FIELDS = Object.freeze({
  "--repo": "repo",
  "--claim-dir": "claimDirectory",
  "--input": "inputPath",
  "--response": "responsePath",
  "--allowlist": "allowlistPath",
  "--invocation": "invocationPath",
  "--invoker-allowlist": "invokerAllowlistPath",
});

function parseArguments(argv = []) {
  const keys = Object.keys(FLAG_FIELDS);
  if (!Array.isArray(argv) || argv.length !== keys.length * 2) {
    throw new TypeError("expected_exactly_seven_flag_value_pairs");
  }
  const parsed = {};
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!Object.hasOwn(FLAG_FIELDS, flag)) {
      throw new TypeError(`unsupported_flag:${String(flag)}`);
    }
    if (seen.has(flag)) throw new TypeError(`duplicate_flag:${flag}`);
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.trim() !== value ||
      /[\0\r\n]/.test(value)
    ) {
      throw new TypeError(`invalid_flag_value:${flag}`);
    }
    seen.add(flag);
    parsed[FLAG_FIELDS[flag]] = value;
  }
  if (seen.size !== keys.length) throw new TypeError("required_flag_missing");
  return parsed;
}

function runtimeFailure(issue) {
  return {
    ok: false,
    status: "blocked",
    contractVersion: EXECUTION_SUMMARY_CONTRACT_VERSION,
    claimAcquired: false,
    receiptConsumed: false,
    targetsCreated: false,
    selectorUpdated: false,
    postWriteVerified: false,
    claimId: "",
    claimHash: "",
    invocationReceiptId: "",
    invocationReceiptHash: "",
    postWriteReceipt: {},
    targetFileCount: 0,
    actualWriteCount: 0,
    actualDeleteCount: 0,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: [issue],
    warningIssues: [],
  };
}

async function runCli(argv = process.argv.slice(2), adapters = {}) {
  const writeStdout = adapters.writeStdout || ((value) => process.stdout.write(value));
  const setExitCode =
    adapters.setExitCode || ((value) => { process.exitCode = value; });
  const runExecutor =
    adapters.runExecutor || runMetricsCutoverGuardedExecutor;
  let input;
  try {
    input = parseArguments(argv);
  } catch {
    writeStdout(`${JSON.stringify(runtimeFailure("guarded_executor_cli_arguments_invalid"))}\n`);
    setExitCode(2);
    return;
  }
  try {
    const result = await runExecutor(input, adapters.executorAdapters || {});
    writeStdout(`${JSON.stringify(result)}\n`);
    setExitCode(result?.status === "cutover_execution_completed" ? 0 : 1);
  } catch {
    writeStdout(`${JSON.stringify(runtimeFailure("guarded_executor_cli_runtime_failure"))}\n`);
    setExitCode(2);
  }
}

if (require.main === module) {
  void runCli();
}

module.exports = {
  FLAG_FIELDS,
  parseArguments,
  runCli,
  runtimeFailure,
};
