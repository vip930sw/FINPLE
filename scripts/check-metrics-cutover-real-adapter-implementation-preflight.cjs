#!/usr/bin/env node

const {
  buildValidPreflightPacket,
  evaluateMetricsCutoverRealAdapterImplementationPreflight,
} = require("./lib/metrics-cutover-real-adapter-implementation-preflight.cjs");

function runCheck() {
  return evaluateMetricsCutoverRealAdapterImplementationPreflight(
    buildValidPreflightPacket(),
  );
}

function main(argv = process.argv.slice(2)) {
  if (argv.length !== 0) {
    process.stdout.write(`${JSON.stringify({
      ok: false,
      status: "blocked",
      blockingIssues: ["cli_arguments_forbidden"],
    })}\n`);
    process.exitCode = 2;
    return;
  }
  const result = runCheck();
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.ok ? 0 : 2;
}

if (require.main === module) {
  try {
    main();
  } catch {
    process.stdout.write(`${JSON.stringify({
      ok: false,
      status: "blocked",
      blockingIssues: ["preflight_check_failed"],
    })}\n`);
    process.exitCode = 2;
  }
}

module.exports = { main, runCheck };
