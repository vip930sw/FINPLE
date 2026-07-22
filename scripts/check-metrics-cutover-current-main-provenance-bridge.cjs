#!/usr/bin/env node
"use strict";

const {
  evaluateCurrentMainProvenanceBridge,
} = require("./lib/metrics-cutover-current-main-provenance-bridge.cjs");

function runCli(argv = process.argv.slice(2), write = console.log) {
  const result = argv.length === 0
    ? evaluateCurrentMainProvenanceBridge()
    : { ...evaluateCurrentMainProvenanceBridge({}),
      blockingIssues: ["cli_arguments_forbidden"] };
  write(JSON.stringify(result, null, 2));
  return argv.length === 0 ? 0 : 1;
}

if (require.main === module) process.exitCode = runCli();
module.exports = { runCli };
