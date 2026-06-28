const fs = require("node:fs");
const path = require("node:path");

const SOURCE_POLICY_CSV_PATH = path.join("data", "processed", "scenario_p0_source_policy_matrix.csv");
const INTAKE_TEMPLATE_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template.csv");
const INTAKE_VALIDATION_PATH = path.join("data", "processed", "scenario_p0_approval_intake_validation.json");
const SYNC_PLAN_PATH = path.join("data", "processed", "scenario_p0_source_policy_sync_plan.json");

const PLAN_VERSION = "scenario-p0-source-policy-sync-plan-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const READY_STATUS = "ready_for_source_policy_review";
const APPROVED_RULES = {
  endpointPolicy: "approved_endpoint_or_documented_proxy",
  licensePolicy: "approved_internal_monthly_derived_return_cache",
  rawPayloadStorage: "approved_hash_or_raw_retention_policy",
  redistributionPolicy: "approved_no_raw_redistribution_monthly_derived_only",
  requiredApproval: "source_license_refresh_policy",
  status: "approved_source_policy",
  blocker: "",
};
const REQUIRED_TEMPLATE_FIELDS = [
  "selectedProvider",
  "selectedEndpoint",
  "licenseDecision",
  "rawPayloadPolicy",
  "redistributionDecision",
  "reviewOwner",
  "decisionOwner",
  "legalReviewer",
  "reviewedAt",
  "evidenceUrl",
];

function fail(message) {
  throw new Error(message);
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

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  const normalized = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((line, index, all) => line !== "" || index < all.length - 1);
  if (lines.length < 2) {
    fail(`${filePath} must contain a header and at least one data row`);
  }
  const headers = lines[0].split(",");
  const rows = lines.slice(1).filter(Boolean).map((line, lineIndex) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) {
      fail(`${filePath}:${lineIndex + 2} has ${values.length} fields, expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { headers, rows };
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function indexBy(rows, field, label) {
  const indexed = new Map();
  for (const row of rows) {
    const key = row[field];
    if (!key) {
      fail(`${label} has a row without ${field}`);
    }
    if (indexed.has(key)) {
      fail(`${label} has duplicate ${field}: ${key}`);
    }
    indexed.set(key, row);
  }
  return indexed;
}

function missingTemplateFields(row) {
  return REQUIRED_TEMPLATE_FIELDS.filter((field) => !String(row[field] ?? "").trim());
}

function validateProviderAlignment(sourcePolicyRows, templateRows, validationRows) {
  const sourceProviders = [...new Set(sourcePolicyRows.map((row) => row.providerCandidate))].sort();
  const templateProviders = templateRows.map((row) => row.providerCandidate).sort();
  const validationProviders = validationRows.map((row) => row.providerCandidate).sort();
  if (sourceProviders.join("|") !== templateProviders.join("|")) {
    fail("providerCandidate mismatch between source policy matrix and approval intake template");
  }
  if (sourceProviders.join("|") !== validationProviders.join("|")) {
    fail("providerCandidate mismatch between source policy matrix and approval intake validation");
  }
}

function buildPlan() {
  const sourcePolicy = readCsv(SOURCE_POLICY_CSV_PATH);
  const intakeTemplate = readCsv(INTAKE_TEMPLATE_PATH);
  const intakeValidation = readJson(INTAKE_VALIDATION_PATH);
  const validationRows = intakeValidation.providerGroups ?? [];
  if (sourcePolicy.rows.length !== 17) {
    fail(`${SOURCE_POLICY_CSV_PATH} must contain 17 P0 source policy rows`);
  }
  if (intakeTemplate.rows.length !== 5 || validationRows.length !== 5) {
    fail("approval intake template and validation must each contain 5 provider-group rows");
  }
  validateProviderAlignment(sourcePolicy.rows, intakeTemplate.rows, validationRows);

  const templateByProvider = indexBy(intakeTemplate.rows, "providerCandidate", "approval intake template");
  const validationByProvider = indexBy(validationRows, "providerCandidate", "approval intake validation");
  const providerPlans = [...templateByProvider.keys()].sort().map((providerCandidate) => {
    const template = templateByProvider.get(providerCandidate);
    const validation = validationByProvider.get(providerCandidate);
    const policyRows = sourcePolicy.rows.filter((row) => row.providerCandidate === providerCandidate);
    const missingFields = missingTemplateFields(template);
    const validationBlockers = validation.blockers ?? [];
    const ready =
      template.approvalStatusDraft === READY_STATUS &&
      validation.readyForSourcePolicyReview === true &&
      missingFields.length === 0 &&
      validationBlockers.length === 0;
    const blockers = [
      ...(template.approvalStatusDraft === READY_STATUS ? [] : ["approval_intake_template_not_ready"]),
      ...(validation.readyForSourcePolicyReview === true ? [] : ["approval_intake_validation_not_ready"]),
      ...missingFields.map((field) => `missing_${field}`),
      ...validationBlockers,
    ];

    return {
      providerCandidate,
      namedProviderCandidate: template.namedProviderCandidate,
      sourcePolicyRows: policyRows.length,
      readyForSourcePolicySync: ready,
      plannedSourcePolicyUpdates: ready ? policyRows.length : 0,
      selectedProvider: template.selectedProvider,
      selectedEndpoint: template.selectedEndpoint,
      reviewedAt: template.reviewedAt,
      evidenceUrl: template.evidenceUrl,
      blockers: ready ? [] : [...new Set(blockers)],
    };
  });

  const plannedUpdates = providerPlans.reduce((sum, row) => sum + row.plannedSourcePolicyUpdates, 0);
  const readyProviderGroups = providerPlans.filter((row) => row.readyForSourcePolicySync).length;
  const syncPlanReady = readyProviderGroups === providerPlans.length && plannedUpdates === sourcePolicy.rows.length;
  const plannedRows = sourcePolicy.rows
    .filter((row) => providerPlans.find((provider) => provider.providerCandidate === row.providerCandidate)?.readyForSourcePolicySync)
    .map((row) => {
      const provider = templateByProvider.get(row.providerCandidate);
      return {
        manifestType: row.manifestType,
        market: row.market,
        ticker: row.ticker,
        providerCandidate: row.providerCandidate,
        currentStatus: row.status,
        proposedStatus: APPROVED_RULES.status,
        proposedEndpointPolicy: APPROVED_RULES.endpointPolicy,
        proposedLicensePolicy: APPROVED_RULES.licensePolicy,
        proposedRawPayloadStorage: APPROVED_RULES.rawPayloadStorage,
        proposedRedistributionPolicy: APPROVED_RULES.redistributionPolicy,
        selectedProvider: provider.selectedProvider,
        selectedEndpoint: provider.selectedEndpoint,
        evidenceUrl: provider.evidenceUrl,
      };
    });

  return stableJson({
    planVersion: PLAN_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      sourcePolicyMatrix: SOURCE_POLICY_CSV_PATH,
      approvalIntakeTemplate: INTAKE_TEMPLATE_PATH,
      approvalIntakeValidation: INTAKE_VALIDATION_PATH,
    },
    outputFiles: {
      syncPlan: SYNC_PLAN_PATH,
      sourcePolicyMatrixTarget: SOURCE_POLICY_CSV_PATH,
      monthlyDataTarget: "data/processed/scenario_monthly_returns.csv",
    },
    rowCounts: {
      providerGroups: providerPlans.length,
      readyProviderGroups,
      blockedProviderGroups: providerPlans.length - readyProviderGroups,
      totalSourcePolicyRows: sourcePolicy.rows.length,
      plannedSourcePolicyUpdates: plannedUpdates,
      blockedSourcePolicyRows: sourcePolicy.rows.length - plannedUpdates,
    },
    readiness: {
      status: syncPlanReady ? "ready_for_manual_source_policy_sync_review" : "blocked_pending_ready_approval_intake",
      syncPlanReady,
      sourcePolicyMatrixWritten: false,
      providerCallsAllowed: false,
      monthlyDataFileWritten: false,
      bootstrapStillBlocked: true,
      nextAllowedStep: syncPlanReady
        ? "manually_sync_approved_source_policy_rows_then_run_approval_readiness"
        : "fill_and_validate_real_approval_intake_before_source_policy_sync",
    },
    providerGroups: providerPlans,
    plannedRows,
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const plan = buildPlan();

  if (checkOnly) {
    if (!fs.existsSync(SYNC_PLAN_PATH)) {
      fail(`${SYNC_PLAN_PATH} not found; run node scripts/generate-scenario-p0-source-policy-sync-plan.cjs`);
    }
    const current = fs.readFileSync(SYNC_PLAN_PATH, "utf8");
    if (current !== plan) {
      fail(`${SYNC_PLAN_PATH} is out of date; run node scripts/generate-scenario-p0-source-policy-sync-plan.cjs`);
    }
    console.log("[generate-scenario-p0-source-policy-sync-plan] ok");
    console.log(`[generate-scenario-p0-source-policy-sync-plan] plan=${SYNC_PLAN_PATH}`);
    return;
  }

  fs.writeFileSync(SYNC_PLAN_PATH, plan);
  const parsed = JSON.parse(plan);
  console.log("[generate-scenario-p0-source-policy-sync-plan] wrote plan");
  console.log(`[generate-scenario-p0-source-policy-sync-plan] plan=${SYNC_PLAN_PATH}`);
  console.log(`[generate-scenario-p0-source-policy-sync-plan] plannedSourcePolicyUpdates=${parsed.rowCounts.plannedSourcePolicyUpdates}`);
}

main();
