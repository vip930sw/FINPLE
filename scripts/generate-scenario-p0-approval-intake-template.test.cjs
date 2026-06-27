const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-approval-intake-template.cjs");
const FIXTURE_FILES = [
  "scenario_p0_source_approval_decision_record.csv",
  "scenario_p0_owner_legal_decision_packet.csv",
  "scenario_p0_approval_intake_checklist.json",
  "scenario_p0_approval_intake_template.csv",
  "scenario_p0_approval_intake_template_summary.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-scenario-approval-template-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runTemplate(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
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

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (quoted) {
      if (character === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        current += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      values.push(current);
      current = "";
    } else {
      current += character;
    }
  }
  values.push(current);
  return values;
}

function parseCsv(content) {
  const [headerLine, ...lines] = content.trimEnd().replace(/\r\n/g, "\n").split("\n");
  const headers = headerLine.split(",");
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

test("passes with current pending approval intake template", () => {
  const workspace = makeWorkspace();
  const result = runTemplate(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_approval_intake_template\.csv/);
});

test("generates five pending template rows without approvals", () => {
  const workspace = makeWorkspace();
  const result = runTemplate(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const rows = parseCsv(readWorkspaceFile(workspace, "scenario_p0_approval_intake_template.csv"));
  assert.equal(rows.length, 5);
  assert.equal(rows.every((row) => row.approvalStatusDraft === "pending_review"), true);
  assert.equal(rows.every((row) => row.selectedProvider === ""), true);
  assert.equal(rows.every((row) => row.evidenceUrl === ""), true);
});

test("summary keeps providers and monthly data blocked", () => {
  const workspace = makeWorkspace();
  const result = runTemplate(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(readWorkspaceFile(workspace, "scenario_p0_approval_intake_template_summary.json"));
  assert.equal(summary.rowCounts.providerGroups, 5);
  assert.equal(summary.rowCounts.approvedRows, 0);
  assert.equal(summary.readiness.providerCallsAllowed, false);
  assert.equal(summary.readiness.monthlyDataFileWritten, false);
  assert.equal(summary.readiness.bootstrapStillBlocked, true);
});

test("rejects stale committed approval intake template", () => {
  const workspace = makeWorkspace();
  const csv = readWorkspaceFile(workspace, "scenario_p0_approval_intake_template.csv");
  writeWorkspaceFile(workspace, "scenario_p0_approval_intake_template.csv", csv.replace("pending_review", "approved"));

  const result = runTemplate(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_approval_intake_template\.csv is out of date/);
});
