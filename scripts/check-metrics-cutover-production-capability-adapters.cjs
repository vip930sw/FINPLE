#!/usr/bin/env node
"use strict";

const {
  CAPABILITY_NAMES, VERSION,
} = require("./lib/metrics-cutover-production-capability-adapters.cjs");

const AWAITING = "awaiting_production_adapter_and_provenance_material";

function runCli(argv = process.argv.slice(2), write = console.log) {
  if (argv.length !== 0) {
    write(JSON.stringify({ ok: false, status: "blocked", contractVersion: VERSION,
      blockingIssues: ["cli_arguments_forbidden"], capabilityNames: [...CAPABILITY_NAMES],
      productionConfigured: false, capabilityMethodInvoked: false,
      rawMaterialPresent: false }, null, 2));
    return 1;
  }
  write(JSON.stringify({ ok: false, status: AWAITING, contractVersion: VERSION,
    blockingIssues: [], capabilityNames: [...CAPABILITY_NAMES],
    productionConfigured: false, capabilityMethodInvoked: false,
    rawMaterialPresent: false }, null, 2));
  return 0;
}

if (require.main === module) process.exitCode = runCli();
module.exports = { AWAITING, runCli };
