#!/usr/bin/env node
"use strict";

const {
  buildValidPreparationPacket,
  evaluateTestDatabaseExecutionGatePreparation,
  safeResult,
} = require("./lib/metrics-cutover-test-database-execution-gate-preparation.cjs");

function runCheck() {
  return evaluateTestDatabaseExecutionGatePreparation(
    buildValidPreparationPacket(),
  );
}

function evaluateCliRequest(argv = process.argv.slice(2), options = {}) {
  try {
    if (!Array.isArray(argv) || argv.length !== 0) {
      return safeResult("blocked", {}, ["cli_arguments_forbidden"]);
    }
    return (options.runCheck || runCheck)();
  } catch {
    return safeResult("blocked", {}, ["execution_gate_preparation_check_failed"]);
  }
}

function main(argv = process.argv.slice(2), options = {}) {
  const result = evaluateCliRequest(argv, options);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.ok ? 0 : 2;
}

if (require.main === module) main();

module.exports = { evaluateCliRequest, main, runCheck };
