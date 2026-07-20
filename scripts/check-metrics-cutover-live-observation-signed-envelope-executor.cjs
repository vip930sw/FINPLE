#!/usr/bin/env node
"use strict";

const subject = require("./lib/metrics-cutover-live-observation-signed-envelope-executor.cjs");

async function main(argv = process.argv.slice(2)) {
  if (argv.length) {
    process.stdout.write(`${JSON.stringify(subject.safeResult("blocked", {
      failureClassification: "blocked_before_envelope_claim",
      blockingIssues: ["step_w_cli_arguments_forbidden"],
    }))}\n`);
    return 1;
  }
  process.stdout.write(`${JSON.stringify(await subject.executeSignedEnvelopeOnce())}\n`);
  return 0;
}

if (require.main === module) main().then((code) => { process.exitCode = code; });
module.exports = { main };
