const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.resolve("scripts", "generate-scenario-p0-external-provider-terms-review.cjs");
const FIXTURE_FILES = [
  "scenario_p0_provider_candidate_review.csv",
  "scenario_p0_external_provider_terms_review.csv",
  "scenario_p0_external_provider_terms_review_summary.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-external-provider-terms-review-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });

  for (const fileName of FIXTURE_FILES) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }

  return workspace;
}

function runReview(workspace, args = ["--check"]) {
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

function readWorkspaceJson(workspace, fileName) {
  return JSON.parse(readWorkspaceFile(workspace, fileName));
}

function writeWorkspaceJson(workspace, fileName, value) {
  writeWorkspaceFile(workspace, fileName, `${JSON.stringify(value, null, 2)}\n`);
}

function parseCsv(content) {
  const [headerLine, ...lines] = content.trimEnd().replace(/\r\n/g, "\n").split("\n");
  const headers = headerLine.split(",");
  const rows = lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
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

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(headers, rows) {
  return `${headers.join(",")}\n${rows
    .map((row) => headers.map((header) => csvEscape(row[header])).join(","))
    .join("\n")}\n`;
}

test("passes with current blocked external provider terms review", () => {
  const workspace = makeWorkspace();
  const result = runReview(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /scenario_p0_external_provider_terms_review\.csv/);
});

test("summary keeps external terms unapproved and monthly data absent", () => {
  const workspace = makeWorkspace();
  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const summary = readWorkspaceJson(workspace, "scenario_p0_external_provider_terms_review_summary.json");
  assert.equal(summary.rowCounts.providerCandidates, 5);
  assert.equal(summary.rowCounts.approvedProviders, 0);
  assert.equal(summary.rowCounts.blockedProviders, 5);
  assert.equal(summary.termsIntegrity.expectedProviderCandidates, 5);
  assert.equal(summary.termsIntegrity.providerSetVerified, true);
  assert.equal(summary.termsIntegrity.officialUrlsVerified, true);
  assert.equal(summary.termsIntegrity.noTermsApproved, true);
  assert.equal(summary.termsIntegrity.monthlyDataFileAbsent, true);
  assert.equal(summary.readiness.providerCallsAllowed, false);
  assert.equal(summary.readiness.monthlyDataFileWritten, false);
  assert.equal(summary.readiness.bootstrapStillBlocked, true);
});

test("rejects provider candidate set drift", () => {
  const workspace = makeWorkspace();
  const parsed = parseCsv(readWorkspaceFile(workspace, "scenario_p0_provider_candidate_review.csv"));
  parsed.rows[0].providerCandidate = "unexpected_provider";
  writeWorkspaceFile(workspace, "scenario_p0_provider_candidate_review.csv", toCsv(parsed.headers, parsed.rows));

  const result = runReview(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /provider without external terms review: unexpected_provider/);
});

test("summary lists only HTTPS official docs and terms URLs", () => {
  const workspace = makeWorkspace();
  const result = runReview(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const summary = readWorkspaceJson(workspace, "scenario_p0_external_provider_terms_review_summary.json");
  for (const source of summary.officialSourcesReviewed) {
    assert.equal(new URL(source.officialDocsUrl).protocol, "https:");
    assert.equal(new URL(source.officialTermsUrl).protocol, "https:");
  }
});

test("rejects premature monthly data before external terms approval", () => {
  const workspace = makeWorkspace();
  writeWorkspaceFile(workspace, "scenario_monthly_returns.csv", "month,ticker,monthlyReturn\n");

  const result = runReview(workspace, []);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_monthly_returns\.csv exists before external provider terms are approved/);
});

test("rejects stale committed external provider terms summary", () => {
  const workspace = makeWorkspace();
  const summary = readWorkspaceJson(workspace, "scenario_p0_external_provider_terms_review_summary.json");
  summary.rowCounts.approvedProviders = 5;
  writeWorkspaceJson(workspace, "scenario_p0_external_provider_terms_review_summary.json", summary);

  const result = runReview(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /scenario_p0_external_provider_terms_review_summary\.json is out of date/);
});
