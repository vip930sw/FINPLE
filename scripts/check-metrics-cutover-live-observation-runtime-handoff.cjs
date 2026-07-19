#!/usr/bin/env node
"use strict";

const {
  evaluateRuntimeHandoffPreflight,
} = require("./lib/metrics-cutover-live-observation-runtime-handoff.cjs");

const result = process.argv.length === 2
  ? evaluateRuntimeHandoffPreflight()
  : evaluateRuntimeHandoffPreflight({ invalidArguments: true });
process.stdout.write(`${JSON.stringify(result)}\n`);
process.exitCode = result.status === "blocked" ? 2 : 0;
