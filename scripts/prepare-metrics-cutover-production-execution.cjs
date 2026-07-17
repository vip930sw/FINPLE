#!/usr/bin/env node

const { lstatSync, readFileSync } = require("node:fs");
const {
  FIXED_FALSE_FIELDS,
  PREPARATION_SUMMARY_CONTRACT_VERSION,
  prepareMetricsCutoverProductionExecution,
} = require("./lib/metrics-cutover-production-execution-preparation.cjs");

const MAX_PROFILE_BYTES = 128 * 1024;
const FLAG_FIELDS = Object.freeze({
  "--policy": "executionPolicy",
  "--claim-store-profile": "claimStoreProfile",
  "--host-profile": "hostProfile",
  "--repository-lock-profile": "repositoryLockProfile",
  "--runbook": "runbook",
});

function parseArguments(argv = []) {
  const requiredFlags = Object.keys(FLAG_FIELDS);
  if (!Array.isArray(argv) || argv.length !== requiredFlags.length * 2) {
    throw new TypeError("expected_exactly_five_flag_value_pairs");
  }
  const parsed = {};
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!Object.hasOwn(FLAG_FIELDS, flag)) throw new TypeError(`unsupported_flag:${String(flag)}`);
    if (seen.has(flag)) throw new TypeError(`duplicate_flag:${flag}`);
    if (typeof value !== "string" || value.length === 0 || value.trim() !== value || /[\0\r\n]/.test(value)) {
      throw new TypeError(`invalid_flag_value:${flag}`);
    }
    seen.add(flag);
    parsed[FLAG_FIELDS[flag]] = value;
  }
  if (seen.size !== requiredFlags.length) throw new TypeError("required_flag_missing");
  return parsed;
}

function runtimeFailure(issue) {
  return {
    ok: false,
    status: "blocked",
    contractVersion: PREPARATION_SUMMARY_CONTRACT_VERSION,
    preparationReady: false,
    claimStoreCapabilityValidated: false,
    hostProfileValidated: false,
    repositoryLockProfileValidated: false,
    runbookValidated: false,
    humanDecisionGateRequired: false,
    preparationSummary: {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: [issue],
    warningIssues: [],
  };
}

function readSanitizedJsonFile(filePath, adapters = {}) {
  const lstat = adapters.lstat || lstatSync;
  const readFile = adapters.readFile || readFileSync;
  const stat = lstat(filePath, { bigint: true });
  if (!stat.isFile() || stat.isSymbolicLink()) throw new TypeError("profile_file_not_regular");
  if (stat.size <= 0n || stat.size > BigInt(MAX_PROFILE_BYTES)) throw new TypeError("profile_file_size_invalid");
  const bytes = readFile(filePath);
  if (!Buffer.isBuffer(bytes) || BigInt(bytes.length) !== stat.size) throw new TypeError("profile_file_read_invalid");
  const text = bytes.toString("utf8");
  if (!Buffer.from(text, "utf8").equals(bytes)) throw new TypeError("profile_file_utf8_invalid");
  return JSON.parse(text);
}

async function runCli(argv = process.argv.slice(2), adapters = {}) {
  const writeStdout = adapters.writeStdout || ((value) => process.stdout.write(value));
  const setExitCode = adapters.setExitCode || ((value) => { process.exitCode = value; });
  const prepare = adapters.prepare || prepareMetricsCutoverProductionExecution;
  let paths;
  try {
    paths = parseArguments(argv);
  } catch {
    writeStdout(`${JSON.stringify(runtimeFailure("preparation_cli_arguments_invalid"))}\n`);
    setExitCode(2);
    return;
  }
  try {
    const input = Object.fromEntries(
      Object.entries(paths).map(([field, filePath]) => [
        field,
        readSanitizedJsonFile(filePath, adapters),
      ]),
    );
    const result = prepare(input);
    writeStdout(`${JSON.stringify(result)}\n`);
    setExitCode(result.status === "production_execution_preparation_ready" ? 0 : 1);
  } catch {
    writeStdout(`${JSON.stringify(runtimeFailure("preparation_cli_profile_read_failed"))}\n`);
    setExitCode(2);
  }
}

if (require.main === module) void runCli();

module.exports = {
  FLAG_FIELDS,
  MAX_PROFILE_BYTES,
  parseArguments,
  readSanitizedJsonFile,
  runCli,
  runtimeFailure,
};
