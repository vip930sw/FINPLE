#!/usr/bin/env node
"use strict";

const {
  evaluateSignedOperatorRunPackage,
} = require("./lib/metrics-cutover-live-observation-operator-run-package.cjs");

const result = process.argv.length === 2
  ? evaluateSignedOperatorRunPackage()
  : evaluateSignedOperatorRunPackage({ cliArgumentsForbidden: true });

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = process.argv.length === 2 && result.status ===
  "awaiting_external_signed_live_observation_operator_authorization" ? 0 : 1;
