#!/usr/bin/env node
"use strict";

const subject = require("./lib/metrics-cutover-live-observation-external-execution-approval.cjs");

let result;
let exitCode = 0;
if (process.argv.length !== 2) {
  result = subject.safeResult("blocked", { blockingIssues: ["cli_arguments_forbidden"] });
  exitCode = 2;
} else {
  result = subject.evaluateExternalExecutionApproval();
}
process.stdout.write(`${JSON.stringify(result)}\n`);
process.exitCode = exitCode;
