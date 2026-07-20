#!/usr/bin/env node
"use strict";

const subject = require("./lib/metrics-cutover-live-observation-controlled-runner.cjs");

const input = process.argv.length === 2 ? undefined : { invalidArguments: true };
subject.runControlledLiveObservation(input).then((result) => {
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.status === "blocked" ? 2 : 0;
});
