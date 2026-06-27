const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-approval-readiness.cjs");
const FIXTURE_FILES = [
  "scenario_p0_source_policy_matrix.csv",
  "scenario_p0_source_policy_matrix_summary.json",
  "scenario_p0_external_provider_terms_review.csv",
  "scenario_p0_owner_legal_decision_packet.csv",
  "scenario_p0_cache_writer_gate.json",
  "scenario_p0_approval_readiness.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-p0-approval-readiness-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runReadiness(workspace) {
  return spawnSync(process.execPath, [SCRIPT_PATH, "--check"], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readWorkspaceFile(workspace, fileName) {
  return fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8");
}

function writeWorkspaceFile(workspace, fileName, content) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), content);
}

test("passes with current blocked P0 approval fixture", () => {
  const workspace = makeWorkspace();
  const result = runReadiness(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_approval_readiness\.json/);
});

test("rejects provider candidate drift between gate files", () => {
  const workspace = makeWorkspace();
  const ownerLegalCsv = readWorkspaceFile(workspace, "scenario_p0_owner_legal_decision_packet.csv");
  writeWorkspaceFile(
    workspace,
    "scenario_p0_owner_legal_decision_packet.csv",
    ownerLegalCsv.replace("USD_KRW_fx_provider", "USD_KRW_fx_provider_DRIFT"),
  );

  const result = runReadiness(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /providerCandidate mismatch between source policy and owner\/legal packet/);
});

test("rejects writer gate provider calls before approval layers are complete", () => {
  const workspace = makeWorkspace();
  const writerGate = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_cache_writer_gate.json"));
  writerGate.readiness.providerCallsAllowed = true;
  writeWorkspaceFile(workspace, "scenario_p0_cache_writer_gate.json", `${JSON.stringify(writerGate, null, 2)}\n`);

  const result = runReadiness(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /writer gate allows provider calls before terms, owner\/legal, and source policy approvals/);
});

test("rejects writer gate monthly writes before all approval layers are complete", () => {
  const workspace = makeWorkspace();
  const writerGate = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_cache_writer_gate.json"));
  writerGate.readiness.canWriteMonthlyData = true;
  writeWorkspaceFile(workspace, "scenario_p0_cache_writer_gate.json", `${JSON.stringify(writerGate, null, 2)}\n`);

  const result = runReadiness(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /writer gate allows monthly data writes before all approval readiness checks are complete/);
});
