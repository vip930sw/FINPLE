#!/usr/bin/env node
"use strict";

const {
  evaluateLiveObservationExecutorPreflight,
} = require("./lib/metrics-cutover-live-observation-executor-preflight.cjs");

const result = process.argv.length === 2
  ? evaluateLiveObservationExecutorPreflight()
  : evaluateLiveObservationExecutorPreflight({ cliArgumentsForbidden: true });

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = process.argv.length === 2 && result.status ===
  "awaiting_external_live_observation_executor_inputs" ? 0 : 1;
