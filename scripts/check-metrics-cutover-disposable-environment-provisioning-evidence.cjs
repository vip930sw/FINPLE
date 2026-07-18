#!/usr/bin/env node
"use strict";

const {
  evaluateProvisioningEvidencePackage,
  safeResult,
} = require("./lib/metrics-cutover-disposable-environment-provisioning-evidence.cjs");

function runCheck() {
  return evaluateProvisioningEvidencePackage();
}

function evaluateCliRequest(argv = process.argv.slice(2), options = {}) {
  try {
    if (!Array.isArray(argv) || argv.length !== 0) {
      return safeResult("blocked", {}, ["cli_arguments_forbidden"]);
    }
    return (options.runCheck || runCheck)();
  } catch {
    return safeResult("blocked", {}, ["provisioning_evidence_check_failed"]);
  }
}

function main(argv = process.argv.slice(2), options = {}) {
  const result = evaluateCliRequest(argv, options);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.status === "blocked" ? 2 : 0;
}

if (require.main === module) main();

module.exports = { evaluateCliRequest, main, runCheck };
