#!/usr/bin/env node

const {
  collectMetricsCutoverRepositoryState,
  safeResult,
} = require("./lib/metrics-cutover-repository-state-adapter.cjs");

function parseArguments(argv) {
  const allowed = new Set(["--repo", "--us-target", "--kr-target"]);
  const parsed = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!allowed.has(flag) || typeof value !== "string" || value.length === 0) {
      return null;
    }
    if (Object.hasOwn(parsed, flag)) return null;
    parsed[flag] = value;
  }
  if (argv.length !== 6 || Object.keys(parsed).length !== 3) return null;
  return {
    repo: parsed["--repo"],
    usTarget: parsed["--us-target"],
    krTarget: parsed["--kr-target"],
  };
}

async function main() {
  const input = parseArguments(process.argv.slice(2));
  if (!input) {
    const result = await collectMetricsCutoverRepositoryState({});
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.stderr.write("invalid invocation\n");
    process.exitCode = 2;
    return;
  }
  try {
    const result = await collectMetricsCutoverRepositoryState(input);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exitCode = result.status === "ready" ? 0 : 1;
  } catch {
    process.stdout.write(
      `${JSON.stringify(
        safeResult("idle", {}, ["repository_state_runtime_error"]),
      )}\n`,
    );
    process.stderr.write("repository-state collection runtime error\n");
    process.exitCode = 2;
  }
}

main();
