#!/usr/bin/env node
"use strict";

const {
  evaluateSignedLiveObservationInvocationPackage,
} = require("./lib/metrics-cutover-live-observation-invocation.cjs");

const result = process.argv.length === 2
  ? evaluateSignedLiveObservationInvocationPackage()
  : evaluateSignedLiveObservationInvocationPackage({ cliArgumentsForbidden: true });
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = process.argv.length === 2 && result.status ===
  "awaiting_external_signed_live_observation_invocation" ? 0 : 1;
