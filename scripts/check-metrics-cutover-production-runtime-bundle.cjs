"use strict";

const subject = require("./lib/metrics-cutover-production-runtime-bundle.cjs");

function runCli(args = process.argv.slice(2), write = (value) => process.stdout.write(value)) {
  const result = args.length === 0 ? subject.evaluateProductionRuntimeBundle() :
    subject.safeResult(subject.PUBLIC_STATES[2], {
      failureClassification: subject.FAILURE_CLASSIFICATIONS[0],
      blockingIssues: ["cli_arguments_forbidden"],
    });
  write(`${JSON.stringify(result)}\n`);
  return result.status === subject.PUBLIC_STATES[0] ? 0 : 1;
}

if (require.main === module) process.exitCode = runCli();

module.exports = { runCli };
