#!/usr/bin/env node
"use strict";

const ceremony = require("./lib/metrics-cutover-live-observation-execution-ceremony.cjs");

const result = process.argv.length === 2
  ? ceremony.evaluateExecutionCeremony()
  : Object.freeze({
    ...ceremony.evaluateExecutionCeremony({}),
    blockingIssues: Object.freeze(["cli_arguments_forbidden"]),
  });

process.stdout.write(`${JSON.stringify(result)}\n`);
process.exitCode = process.argv.length === 2 ? 0 : 2;
