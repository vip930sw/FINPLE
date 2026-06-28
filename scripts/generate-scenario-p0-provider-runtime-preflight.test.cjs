const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-provider-runtime-preflight.cjs");
const PREFLIGHT = "scenario_p0_provider_runtime_preflight.json";
const FIXTURE_FILES = [
  "scenario_p0_approval_intake_template.csv",
  "scenario_p0_approval_readiness.json",
  "scenario_p0_provider_adapter_preflight.json",
  "scenario_p0_monthly_cache_writer_preflight.json",
  "scenario_p0_kis_capability_preflight.json",
  PREFLIGHT,
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-provider-runtime-preflight-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  return workspace;
}

function runPreflight(workspace, args = ["--check"], env = {}) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ...env,
    },
  });
}

function readWorkspaceJson(workspace, fileName) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeWorkspaceJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

function fullCredentialEnv() {
  return {
    FINPLE_SCENARIO_PROVIDER_MODE: "live",
    FINPLE_SCENARIO_ALLOW_PROVIDER_CALLS: "1",
    FRED_API_KEY: "test-fred-key",
    KIS_APP_KEY: "test-kis-app-key",
    KIS_APP_SECRET: "test-kis-app-secret",
  };
}

test("passes with current blocked runtime provider preflight", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_provider_runtime_preflight\.json/);
});

test("keeps current runtime provider calls blocked without credentials and explicit opt-in", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerCredentialsReady, false);
  assert.equal(report.checks.optInReady, false);
  assert.equal(report.checks.runtimeProviderCallsAllowed, false);
  assert.doesNotMatch(report.checks.blockers.join("|"), /ALPHA_VANTAGE_API_KEY/);
  assert.match(report.checks.blockers.join("|"), /missing_env_KIS_APP_KEY/);
  assert.match(report.checks.blockers.join("|"), /missing_or_invalid_env_FINPLE_SCENARIO_PROVIDER_MODE/);
});

test("keeps KIS replacement blocked until overseas monthly capabilities are verified", () => {
  const workspace = makeWorkspace();
  const result = runPreflight(workspace, [], fullCredentialEnv());

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerCredentialsReady, true);
  assert.equal(report.checks.providerCapabilityReady, false);
  assert.equal(report.checks.optInReady, true);
  assert.equal(report.checks.runtimeProviderCallsAllowed, false);
  assert.match(report.checks.blockers.join("|"), /runtime_provider_capability_not_verified/);
  assert.match(report.checks.blockers.join("|"), /kis_overseas_monthly_adjusted_dividend_split_capability_not_verified/);
});

test("opens only when credentials, opt-in, and KIS capability evidence are all present", () => {
  const workspace = makeWorkspace();
  const capability = readWorkspaceJson(workspace, "scenario_p0_kis_capability_preflight.json");
  capability.checks.capabilityReady = true;
  capability.checks.verifiedCapabilities = 2;
  capability.checks.blockers = [];
  capability.capabilities = capability.capabilities.map((row) => ({
    ...row,
    status: "ready_for_runtime_preflight",
    capabilityVerified: true,
    blockers: [],
  }));
  capability.readiness.status = "ready_for_runtime_provider_preflight";
  capability.readiness.capabilityReady = true;
  writeWorkspaceJson(workspace, "scenario_p0_kis_capability_preflight.json", capability);

  const result = runPreflight(workspace, [], fullCredentialEnv());

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerCredentialsReady, true);
  assert.equal(report.checks.providerCapabilityReady, true);
  assert.equal(report.checks.optInReady, true);
  assert.equal(report.checks.runtimeProviderCallsAllowed, true);
});

test("stays blocked when one provider credential is missing", () => {
  const workspace = makeWorkspace();
  const env = fullCredentialEnv();
  delete env.FRED_API_KEY;

  const result = runPreflight(workspace, [], env);

  assert.equal(result.status, 0, result.stderr);
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  assert.equal(report.checks.providerCredentialsReady, false);
  assert.equal(report.checks.runtimeProviderCallsAllowed, false);
  assert.match(report.checks.blockers.join("|"), /missing_env_FRED_API_KEY/);
});

test("rejects stale committed runtime provider preflight", () => {
  const workspace = makeWorkspace();
  const report = readWorkspaceJson(workspace, PREFLIGHT);
  report.checks.runtimeProviderCallsAllowed = true;
  writeWorkspaceJson(workspace, PREFLIGHT, report);

  const result = runPreflight(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_provider_runtime_preflight\.json is out of date/);
});
