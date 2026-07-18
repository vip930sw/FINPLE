#!/usr/bin/env node
"use strict";

const {
  evaluateSignedLiveObservationApprovalPackage,
} = require("./lib/metrics-cutover-live-observation-approval-response.cjs");

const result = process.argv.length === 2
  ? evaluateSignedLiveObservationApprovalPackage()
  : evaluateSignedLiveObservationApprovalPackage({ cliArgumentsForbidden: true });
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = process.argv.length === 2 && result.status ===
  "awaiting_external_signed_live_observation_approval_response" ? 0 : 1;
