#!/usr/bin/env node
"use strict";

const subject = require("./lib/metrics-cutover-production-approval-envelope.cjs");

const result = process.argv.length === 2
  ? subject.evaluateProductionCutoverApproval()
  : subject.safeResult(subject.PUBLIC_STATES[2], {
      failureClassification: subject.FAILURE_CLASSIFICATIONS[0],
      blockingIssues: ["cli_arguments_forbidden"],
    });
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.status === subject.PUBLIC_STATES[0] ? 0 : 1;
