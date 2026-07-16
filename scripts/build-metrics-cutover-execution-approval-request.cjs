#!/usr/bin/env node

const {
  runMetricsCutoverExecutionApprovalRequest,
  safeResult,
} = require("./lib/metrics-cutover-execution-approval-request.cjs");

function parseArguments(argv) {
  if (!Array.isArray(argv) || argv.length !== 4) return null;
  const allowed = new Set(["--repo", "--input"]);
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (
      !allowed.has(flag) ||
      typeof value !== "string" ||
      value.length === 0 ||
      Object.hasOwn(parsed, flag)
    ) {
      return null;
    }
    parsed[flag] = value;
  }
  if (!parsed["--repo"] || !parsed["--input"]) return null;
  return {
    repo: parsed["--repo"],
    inputPath: parsed["--input"],
  };
}

async function runCli(
  argv,
  {
    runApprovalRequest = runMetricsCutoverExecutionApprovalRequest,
    stdout = (value) => process.stdout.write(value),
    stderr = (value) => process.stderr.write(value),
  } = {},
) {
  const input = parseArguments(argv);
  if (!input) {
    stdout(
      `${JSON.stringify(
        safeResult("idle", {}, [
          "approval_request_cli_invocation_invalid",
        ]),
      )}\n`,
    );
    stderr("invalid invocation\n");
    return 2;
  }
  try {
    const result = await runApprovalRequest(input);
    stdout(`${JSON.stringify(result)}\n`);
    return result.status === "request_ready" ? 0 : 1;
  } catch {
    stdout(
      `${JSON.stringify(
        safeResult("idle", {}, [
          "approval_request_cli_runtime_error",
        ]),
      )}\n`,
    );
    stderr("approval-request preflight runtime error\n");
    return 2;
  }
}

if (require.main === module) {
  runCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}

module.exports = {
  parseArguments,
  runCli,
};
