const fs = require("node:fs");
const path = require("node:path");
const {
  buildCurrentTradingAiMlAuditSummary,
} = require("./report-trading-ai-ml-audit-summary.cjs");

const BASELINE_COMMIT = "c306dc775a1d5dcba32271934ed112d7ef97a768";
const SNAPSHOT_PATH = "data/processed/trading-ai-ml/step192_contract_hardening_audit_baseline.json";
const SNAPSHOT_TOP_LEVEL_KEYS = Object.freeze([
  "schemaVersion",
  "baselineName",
  "baselineCommit",
  "coveredSteps",
  "coreAudit",
  "supplementalGuards",
  "totals",
  "duplicates",
  "readiness",
]);

function buildStep192ContractHardeningSnapshot(summary) {
  return Object.freeze({
    schemaVersion: summary.schemaVersion,
    baselineName: "step192_contract_hardening",
    baselineCommit: BASELINE_COMMIT,
    coveredSteps: Object.freeze([223, 224, 225, 226, 227]),
    coreAudit: summary.coreAudit,
    supplementalGuards: summary.supplementalGuards,
    totals: summary.totals,
    duplicates: summary.duplicates,
    readiness: summary.readiness,
  });
}

function formatSnapshot(snapshot) {
  const ordered = {};
  for (const key of SNAPSHOT_TOP_LEVEL_KEYS) ordered[key] = snapshot[key];
  return `${JSON.stringify(ordered, null, 2)}\n`;
}

async function main() {
  const summary = await buildCurrentTradingAiMlAuditSummary();
  const snapshot = buildStep192ContractHardeningSnapshot(summary);
  const target = path.resolve(SNAPSHOT_PATH);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, formatSnapshot(snapshot), "utf8");
  console.log("[snapshot-trading-step192-contract-hardening-audit] ok");
  console.log(JSON.stringify({
    snapshotPath: SNAPSHOT_PATH,
    baselineCommit: snapshot.baselineCommit,
    coveredSteps: snapshot.coveredSteps,
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  BASELINE_COMMIT,
  SNAPSHOT_PATH,
  SNAPSHOT_TOP_LEVEL_KEYS,
  buildStep192ContractHardeningSnapshot,
  formatSnapshot,
};
