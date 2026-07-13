const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const test = require("node:test");
const {
  ARTIFACT_NAME,
  ARTIFACT_RETENTION_DAYS,
} = require("./report-trading-offline-data-quality-ci.cjs");
const {
  BASELINE_COMMIT,
  SNAPSHOT_PATH,
} = require("./snapshot-trading-step192-contract-hardening-audit.cjs");

test("Step233 checker passes and leaves the working tree unchanged", () => {
  const before = execFileSync("git", ["status", "--short"], { encoding: "utf8" });
  const output = execFileSync(process.execPath, ["scripts/check-trading-step233-non-blocking-data-quality-ci-report.cjs"], {
    encoding: "utf8",
  });
  const after = execFileSync("git", ["status", "--short"], { encoding: "utf8" });

  assert.equal(after, before);
  assert.match(output, /\[check-trading-step233-non-blocking-data-quality-ci-report\] ok/);
  assert.match(output, /"reportMode": "non_blocking_ci"/);
  assert.match(output, /"executionStatus": "completed"/);
  assert.match(output, /"qualityStatus": "blocked"/);
  assert.match(output, /"blocksMerge": false/);
  assert.match(output, /"actualLiveTradingReady": false/);
  assert.match(output, new RegExp(`"artifactName": "${ARTIFACT_NAME}"`));
  assert.match(output, new RegExp(`"retentionDays": ${ARTIFACT_RETENTION_DAYS}`));
  assert.match(output, new RegExp(`"step228BaselineCommit": "${BASELINE_COMMIT}"`));
});

test("Step233 package scripts run through report and dedicated checker coverage", () => {
  const packageJson = fs.readFileSync("package.json", "utf8");

  assert.match(packageJson, /report:trading-offline-data-quality-ci/);
  assert.match(packageJson, /check:trading-step233-non-blocking-data-quality-ci-report/);
  assert.match(packageJson, /scripts\/report-trading-offline-data-quality-ci\.cjs/);
  assert.match(packageJson, /scripts\/report-trading-offline-data-quality-ci\.test\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step233-non-blocking-data-quality-ci-report\.cjs/);
  assert.match(packageJson, /scripts\/check-trading-step233-non-blocking-data-quality-ci-report\.test\.cjs/);
});

test("Step233 workflow is non-blocking, minimal permission, and secret-free", () => {
  const workflow = fs.readFileSync(".github/workflows/trading-offline-data-quality-report.yml", "utf8");

  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /continue-on-error: true/);
  assert.match(workflow, /npm run check:trading-step232-offline-data-quality-gate-readiness/);
  assert.match(workflow, /npm run report:trading-offline-data-quality-ci/);
  assert.match(workflow, /actions\/upload-artifact/);
  assert.match(workflow, new RegExp(`name: ${ARTIFACT_NAME}`));
  assert.match(workflow, new RegExp(`retention-days: ${ARTIFACT_RETENTION_DAYS}`));
  assert.doesNotMatch(workflow, /npm\.cmd/);
  assert.doesNotMatch(workflow, /secrets\./);
  assert.doesNotMatch(workflow, /contents: write|pull-requests: write|issues: write|deployments: write|packages: write/);
});

test("Step233 keeps the Step228 snapshot counts and baseline unchanged", () => {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));

  assert.equal(snapshot.baselineCommit, BASELINE_COMMIT);
  assert.deepEqual(snapshot.coveredSteps, [223, 224, 225, 226, 227]);
  assert.equal(snapshot.coreAudit.counts.sourceCheckerCount, 13);
  assert.equal(snapshot.coreAudit.counts.uniqueServiceTestCount, 10);
  assert.equal(snapshot.coreAudit.counts.uniqueMigrationCheckerTestCount, 14);
  assert.equal(snapshot.coreAudit.counts.uniqueSupportingTestCount, 11);
  assert.equal(snapshot.coreAudit.counts.uniqueCheckerTestCount, 25);
  assert.equal(snapshot.coreAudit.counts.uniqueTestFileCount, 35);
  assert.equal(snapshot.supplementalGuards.count, 1);
  assert.equal(snapshot.totals.totalSourceCheckerCount, 14);
  assert.equal(snapshot.totals.totalUniqueCheckerTestCount, 26);
  assert.equal(snapshot.totals.totalUniqueTestFileCount, 37);
  assert.equal(snapshot.duplicates.duplicateFileCount, 0);
  assert.equal(snapshot.readiness.actualLiveTradingReady, false);
  assert.equal(snapshot.readiness.state, "blocked");
});
