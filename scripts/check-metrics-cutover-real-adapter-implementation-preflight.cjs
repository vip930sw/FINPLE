#!/usr/bin/env node

const {
  buildValidPreflightPacket,
  evaluateMetricsCutoverRealAdapterImplementationPreflight,
  safeResult,
} = require("./lib/metrics-cutover-real-adapter-implementation-preflight.cjs");

function runCheck() {
  return evaluateMetricsCutoverRealAdapterImplementationPreflight(
    buildValidPreflightPacket(),
  );
}

function evaluateCliRequest(argv = process.argv.slice(2), options = {}) {
  try {
    if (argv.length !== 0) {
      return safeResult("blocked", {}, ["cli_arguments_forbidden"]);
    }
    return (options.runCheck || runCheck)();
  } catch {
    return safeResult("blocked", {}, ["preflight_check_failed"]);
  }
}

function main(argv = process.argv.slice(2), options = {}) {
  const result = evaluateCliRequest(argv, options);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.ok ? 0 : 2;
}

if (require.main === module) {
  main();
}

module.exports = { evaluateCliRequest, main, runCheck };
