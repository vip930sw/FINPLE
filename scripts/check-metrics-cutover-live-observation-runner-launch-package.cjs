#!/usr/bin/env node
"use strict";

const {
  evaluateRunnerLaunchPackage,
} = require("./lib/metrics-cutover-live-observation-runner-launch-package.cjs");

const result = process.argv.length === 2
  ? evaluateRunnerLaunchPackage()
  : evaluateRunnerLaunchPackage({ invalidArguments: true });
process.stdout.write(`${JSON.stringify(result)}\n`);
process.exitCode = result.status === "blocked" ? 2 : 0;
