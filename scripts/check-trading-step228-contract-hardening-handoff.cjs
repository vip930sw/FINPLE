const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const {
  buildCurrentTradingAiMlAuditSummary,
} = require("./report-trading-ai-ml-audit-summary.cjs");
const {
  BASELINE_COMMIT,
  SNAPSHOT_PATH,
  SNAPSHOT_TOP_LEVEL_KEYS,
  buildStep192ContractHardeningSnapshot,
  formatSnapshot,
} = require("./snapshot-trading-step192-contract-hardening-audit.cjs");

const HANDOFF_PATH = "docs/trading-ai-ml/FINPLE_STEP192_CONTRACT_HARDENING_HANDOFF.md";
const STEP228_SCRIPT = "check:trading-step228-contract-hardening-handoff";
const SNAPSHOT_SCRIPT = "snapshot:trading-step192-contract-hardening-audit";

const REQUIRED_FILES = [
  "package.json",
  HANDOFF_PATH,
  SNAPSHOT_PATH,
  "scripts/snapshot-trading-step192-contract-hardening-audit.cjs",
  "scripts/check-trading-step228-contract-hardening-handoff.cjs",
  "scripts/check-trading-step228-contract-hardening-handoff.test.cjs",
  "scripts/report-trading-ai-ml-audit-summary.cjs",
];

const ALLOWED_TOUCHED_FILES = new Set(REQUIRED_FILES);
ALLOWED_TOUCHED_FILES.add("docs/trading-ai-ml/");
ALLOWED_TOUCHED_FILES.add("data/processed/trading-ai-ml/");

const FORBIDDEN_TOUCHED_FILES = [
  "scripts/run-trading-ai-ml-primitives-migration-regression.cjs",
  "scripts/trading-ai-ml-primitives-migration-audit.cjs",
  "scripts/check-trading-step223-ai-ml-contract-primitives-step192-pilot.cjs",
  "scripts/check-trading-step224-step192-dataset-contract-compatibility.cjs",
  "scripts/check-trading-step225-step192-dataset-contract-manifest.cjs",
  "scripts/check-trading-step226-step225-supplemental-audit-registration.cjs",
  "scripts/check-trading-step227-ai-ml-audit-reporting-baseline.cjs",
  "server/src/services/tradingAiMlDatasetArchitecture.js",
  "server/src/services/tradingAiMlDatasetContractManifest.js",
  "server/src/index.js",
  "server/src/services/tradingAdminLabDashboardShell.js",
  "src/components/TradingReadinessPanel.jsx",
  "src/App.jsx",
  "src/App.css",
  "data/processed/scenario_monthly_returns.csv",
  "src/components/portfolio/services/calculatePortfolioResult.js",
  ".github/workflows",
];

const REQUIRED_COMMANDS = [
  "npm.cmd run check:trading-step228-contract-hardening-handoff",
  "npm.cmd run check:trading-step227-ai-ml-audit-reporting-baseline",
  "npm.cmd run report:trading-ai-ml-audit-summary",
  "npm.cmd run check:trading-step226-step225-supplemental-audit-registration",
  "npm.cmd run check:trading-step225-step192-dataset-contract-manifest",
  "npm.cmd run check:trading-step224-step192-dataset-contract-compatibility",
  "npm.cmd run check:trading-step223-ai-ml-contract-primitives-step192-pilot",
  "npm.cmd run check:trading-ai-ml-primitives-migration-regression",
  "npm.cmd run check:trading-ai-ml-regression",
];

const REQUIRED_DOC_SNIPPETS = [
  "적용 범위",
  "기준 시작·종료 Step",
  BASELINE_COMMIT,
  "Step223",
  "Step224",
  "Step225",
  "Step226",
  "Step227",
  "Step192 runtime contract 불변 원칙",
  "manifest 공개 범위와 금지 범위",
  "core audit와 supplemental guard 구분",
  "확정 count",
  "duplicate 0",
  "민감정보 미노출",
  "live trading readiness",
  "별도 migration Step",
];

const FORBIDDEN_MATERIAL = [
  "credential",
  "provider payload",
  "raw metadata",
  "hash value",
  "digest value",
  "fingerprint value",
  "token issuance",
  "account identifier",
  "order payload",
];

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(source, snippet, label) {
  assert(source.includes(snippet), `${label} missing: ${snippet}`);
}

function assertNotIncludes(source, snippet, label) {
  assert(!source.toLowerCase().includes(snippet.toLowerCase()), `${label} must not include: ${snippet}`);
}

function getStatus() {
  return execFileSync("git", ["status", "--short"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/\\/g, "/"))
    .sort();
}

function getTouchedFiles() {
  const tracked = execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean);
  return [...new Set([...tracked, ...getStatus()])].map((file) => file.replace(/\\/g, "/")).sort();
}

function assertSnapshotMatches(snapshot, expected) {
  assert(JSON.stringify(Object.keys(snapshot)) === JSON.stringify([...SNAPSHOT_TOP_LEVEL_KEYS]), "snapshot top-level key set mismatch");
  assert(snapshot.schemaVersion === "1.0.0", "snapshot schema version mismatch");
  assert(snapshot.baselineName === "step192_contract_hardening", "snapshot baseline name mismatch");
  assert(snapshot.baselineCommit === BASELINE_COMMIT, "snapshot baseline commit mismatch");
  assert(JSON.stringify(snapshot.coveredSteps) === JSON.stringify([223, 224, 225, 226, 227]), "covered steps mismatch");
  assert(JSON.stringify(snapshot.coreAudit) === JSON.stringify(expected.coreAudit), "snapshot core audit mismatch");
  assert(JSON.stringify(snapshot.supplementalGuards) === JSON.stringify(expected.supplementalGuards), "snapshot supplemental guards mismatch");
  assert(JSON.stringify(snapshot.totals) === JSON.stringify(expected.totals), "snapshot totals mismatch");
  assert(JSON.stringify(snapshot.duplicates) === JSON.stringify(expected.duplicates), "snapshot duplicates mismatch");
  assert(JSON.stringify(snapshot.readiness) === JSON.stringify(expected.readiness), "snapshot readiness mismatch");
  assert(snapshot.coreAudit.scope === "step192_to_step200", "core scope changed");
  assert(snapshot.coreAudit.expectedStageCount === 9, "core stage count changed");
  assert(snapshot.duplicates.duplicateFileCount === 0, "duplicate file count changed");
  assert(Array.isArray(snapshot.duplicates.duplicateSourceCheckers) && snapshot.duplicates.duplicateSourceCheckers.length === 0, "duplicate source checker mismatch");
  assert(snapshot.readiness.actualLiveTradingReady === false, "actual live trading readiness changed");
  assert(snapshot.readiness.state === "blocked", "readiness state mismatch");
}

(async function main() {
  for (const file of REQUIRED_FILES) {
    assert(fs.existsSync(file), `missing required file: ${file}`);
  }

  const beforeStatus = JSON.stringify(getStatus());
  const packageJson = read("package.json");
  const handoff = read(HANDOFF_PATH);
  const snapshotSource = read(SNAPSHOT_PATH);
  const snapshot = JSON.parse(snapshotSource);
  const summary = await buildCurrentTradingAiMlAuditSummary();
  const expectedSnapshot = buildStep192ContractHardeningSnapshot(summary);

  assertIncludes(packageJson, `"${SNAPSHOT_SCRIPT}"`, "package snapshot script");
  assertIncludes(packageJson, `"${STEP228_SCRIPT}"`, "package Step228 check script");
  assertIncludes(packageJson, "scripts/snapshot-trading-step192-contract-hardening-audit.cjs", "package snapshot file link");
  assertIncludes(packageJson, "scripts/check-trading-step228-contract-hardening-handoff.cjs", "package Step228 checker link");
  assertIncludes(packageJson, "scripts/check-trading-step228-contract-hardening-handoff.test.cjs", "package Step228 checker test link");

  for (const snippet of REQUIRED_DOC_SNIPPETS) assertIncludes(handoff, snippet, "handoff document");
  for (const command of REQUIRED_COMMANDS) assertIncludes(handoff, command, "handoff reproduction command");

  assertSnapshotMatches(snapshot, expectedSnapshot);
  assert(formatSnapshot(snapshot) === snapshotSource, "snapshot format is not canonical");

  for (const source of [handoff, snapshotSource]) {
    for (const forbidden of FORBIDDEN_MATERIAL) {
      assertNotIncludes(source, forbidden, "Step228 handoff or snapshot");
    }
  }

  const touchedFiles = getTouchedFiles();
  for (const file of touchedFiles) {
    assert(ALLOWED_TOUCHED_FILES.has(file), `unexpected Step228 touched file: ${file}`);
  }
  for (const file of FORBIDDEN_TOUCHED_FILES) {
    assert(!touchedFiles.includes(file), `forbidden Step228 touched file: ${file}`);
  }

  const afterStatus = JSON.stringify(getStatus());
  assert(afterStatus === beforeStatus, "Step228 check modified the working tree");

  console.log("[check-trading-step228-contract-hardening-handoff] ok");
  console.log(JSON.stringify({
    handoffPath: HANDOFF_PATH,
    snapshotPath: SNAPSHOT_PATH,
    baselineCommit: snapshot.baselineCommit,
    coveredSteps: snapshot.coveredSteps,
    coreScope: snapshot.coreAudit.scope,
    duplicateFileCount: snapshot.duplicates.duplicateFileCount,
    readiness: snapshot.readiness,
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
