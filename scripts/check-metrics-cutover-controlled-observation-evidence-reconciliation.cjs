#!/usr/bin/env node
"use strict";

const {
  FAILURE_CLASSIFICATIONS, PUBLIC_STATES, evaluateControlledObservationEvidence,
  safeResult,
} = require("./lib/metrics-cutover-controlled-observation-evidence-reconciliation.cjs");

const result = process.argv.length === 2
  ? evaluateControlledObservationEvidence()
  : safeResult(PUBLIC_STATES[2], {
      failureClassification: FAILURE_CLASSIFICATIONS[0],
      blockingIssues: ["cli_arguments_forbidden"],
    });

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.status === "awaiting_external_execution_closeout_evidence" ? 0 : 1;
