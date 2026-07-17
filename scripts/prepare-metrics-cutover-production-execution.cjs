#!/usr/bin/env node

const {
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
} = require("node:fs");
const path = require("node:path");
const {
  scanJsonForDuplicateObjectKeys,
} = require("./lib/metrics-cutover-execution-approval-response.cjs");
const {
  FIXED_FALSE_FIELDS,
  PREPARATION_SUMMARY_CONTRACT_VERSION,
  prepareMetricsCutoverProductionExecution,
} = require("./lib/metrics-cutover-production-execution-preparation.cjs");

const MAX_PROFILE_BYTES = 128 * 1024;
const decoder = new TextDecoder("utf-8", { fatal: true });
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

function statTypeIdentity(stat) {
  if (
    !stat ||
    typeof stat.isFile !== "function" ||
    typeof stat.isSymbolicLink !== "function"
  ) {
    throw new TypeError("profile_file_type_identity_invalid");
  }
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new TypeError("profile_file_not_regular");
  }
  return "regular_file";
}

function statFileIdentity(stat) {
  if (
    typeof stat?.dev !== "bigint" ||
    typeof stat?.ino !== "bigint" ||
    stat.dev < 0n ||
    stat.ino <= 0n
  ) {
    throw new TypeError("profile_file_identity_invalid");
  }
  return `${stat.dev}:${stat.ino}`;
}

function statByteSize(stat) {
  if (typeof stat?.size !== "bigint" || stat.size < 0n) {
    throw new TypeError("profile_file_size_invalid");
  }
  return stat.size;
}

function readBoundedDescriptor(descriptor, expectedSize, fs) {
  const byteLength = Number(expectedSize);
  const buffer = Buffer.alloc(byteLength + 1);
  let offset = 0;
  while (offset < buffer.length) {
    const bytesRead = fs.readSync(
      descriptor,
      buffer,
      offset,
      buffer.length - offset,
      null,
    );
    if (!Number.isInteger(bytesRead) || bytesRead < 0) {
      throw new TypeError("profile_file_read_invalid");
    }
    if (bytesRead === 0) break;
    offset += bytesRead;
  }
  if (offset > byteLength) {
    throw new TypeError("profile_file_size_changed");
  }
  return buffer.subarray(0, offset);
}

function observeSanitizedJsonFile(filePath, adapters = {}) {
  const fs = adapters.fs || {
    closeSync,
    fstatSync,
    lstatSync,
    openSync,
    readSync,
    realpathSync,
  };
  const absolute = path.resolve(filePath);
  const pathBefore = fs.lstatSync(absolute, { bigint: true });
  const canonicalPathBefore = fs.realpathSync(absolute);
  const expectedType = statTypeIdentity(pathBefore);
  const expectedIdentity = statFileIdentity(pathBefore);
  const expectedSize = statByteSize(pathBefore);
  if (expectedSize <= 0n || expectedSize > BigInt(MAX_PROFILE_BYTES)) {
    throw new TypeError("profile_file_size_invalid");
  }

  let descriptor = null;
  let descriptorBefore;
  let descriptorAfter;
  let bytes;
  let readError = null;
  let closeError = null;
  try {
    descriptor = fs.openSync(canonicalPathBefore, "r");
    descriptorBefore = fs.fstatSync(descriptor, { bigint: true });
    statTypeIdentity(descriptorBefore);
    statFileIdentity(descriptorBefore);
    statByteSize(descriptorBefore);
    bytes = readBoundedDescriptor(descriptor, expectedSize, fs);
    descriptorAfter = fs.fstatSync(descriptor, { bigint: true });
  } catch (error) {
    readError = error;
  } finally {
    if (descriptor !== null) {
      try {
        fs.closeSync(descriptor);
      } catch (error) {
        closeError = error;
      }
    }
  }
  if (closeError) throw new TypeError("profile_file_close_failed");
  if (readError) throw readError;

  const pathAfter = fs.lstatSync(absolute, { bigint: true });
  const canonicalPathAfter = fs.realpathSync(absolute);
  const observations = [pathBefore, descriptorBefore, descriptorAfter, pathAfter];
  if (
    observations.some((stat) => statTypeIdentity(stat) !== expectedType) ||
    observations.some((stat) => statFileIdentity(stat) !== expectedIdentity) ||
    observations.some((stat) => statByteSize(stat) !== expectedSize) ||
    canonicalPathBefore !== canonicalPathAfter ||
    !Buffer.isBuffer(bytes) ||
    BigInt(bytes.length) !== expectedSize
  ) {
    throw new TypeError("profile_file_changed_during_read");
  }

  let text;
  try {
    text = decoder.decode(bytes);
  } catch {
    throw new TypeError("profile_file_utf8_invalid");
  }
  const duplicateKeyScan = scanJsonForDuplicateObjectKeys(text);
  if (!duplicateKeyScan.ok) {
    throw new TypeError(
      duplicateKeyScan.duplicateKey
        ? "profile_file_duplicate_json_object_key"
        : "profile_file_json_invalid",
    );
  }
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    throw new TypeError("profile_file_json_invalid");
  }
  return {
    value,
    canonicalInputPath: canonicalPathBefore,
    fileIdentity: expectedIdentity,
  };
}

function readSanitizedJsonFile(filePath, adapters = {}) {
  return observeSanitizedJsonFile(filePath, adapters).value;
}

function canonicalPathIdentity(value) {
  return path.normalize(value).normalize("NFC").toLowerCase();
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
    const input = {};
    const canonicalPaths = new Set();
    const fileIdentities = new Set();
    for (const [field, filePath] of Object.entries(paths)) {
      const observation = observeSanitizedJsonFile(filePath, adapters);
      const pathIdentity = canonicalPathIdentity(
        observation.canonicalInputPath,
      );
      if (
        canonicalPaths.has(pathIdentity) ||
        fileIdentities.has(observation.fileIdentity)
      ) {
        throw new TypeError("profile_input_reused");
      }
      canonicalPaths.add(pathIdentity);
      fileIdentities.add(observation.fileIdentity);
      input[field] = observation.value;
    }
    const result = prepare(input);
    writeStdout(`${JSON.stringify(result)}\n`);
    setExitCode(result.status === "production_execution_preparation_ready" ? 0 : 1);
  } catch (error) {
    const issue =
      error?.message === "profile_input_reused"
        ? "preparation_cli_profile_path_reused"
        : error?.message === "profile_file_duplicate_json_object_key"
          ? "preparation_cli_duplicate_json_object_key"
          : "preparation_cli_profile_read_failed";
    writeStdout(`${JSON.stringify(runtimeFailure(issue))}\n`);
    setExitCode(2);
  }
}

if (require.main === module) void runCli();

module.exports = {
  FLAG_FIELDS,
  MAX_PROFILE_BYTES,
  observeSanitizedJsonFile,
  parseArguments,
  readSanitizedJsonFile,
  runCli,
  runtimeFailure,
};
