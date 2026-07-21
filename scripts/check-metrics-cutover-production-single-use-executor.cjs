#!/usr/bin/env node
"use strict";

const subject = require("./lib/metrics-cutover-production-single-use-executor.cjs");

async function runCli(argv = process.argv.slice(2)) {
  if (argv.length !== 0) {
    return { exitCode: 1, result: subject.safeResult(subject.PUBLIC_STATES[2], {
      failureClassification: subject.FAILURE_CLASSIFICATIONS[0],
      blockingIssues: ["cli_arguments_forbidden"],
    }) };
  }
  return { exitCode: 0,
    result: await subject.executeSingleUseProductionCutover() };
}

if (require.main === module) {
  runCli().then(({ exitCode, result }) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = exitCode;
  });
}

module.exports = { runCli };
