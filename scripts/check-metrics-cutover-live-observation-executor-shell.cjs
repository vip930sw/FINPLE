#!/usr/bin/env node
"use strict";

const {
  evaluateLiveObservationExecutorShell,
} = require("./lib/metrics-cutover-live-observation-executor-shell.cjs");

const result = process.argv.length === 2
  ? evaluateLiveObservationExecutorShell()
  : evaluateLiveObservationExecutorShell({ cliArgumentsForbidden: true });

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = process.argv.length === 2 && result.status ===
  "awaiting_external_live_observation_execution_dependencies" ? 0 : 1;
