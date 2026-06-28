const fs = require("node:fs");
const path = require("node:path");

const APPROVAL_INTAKE_TEMPLATE_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template.csv");
const KIS_CAPABILITY_REVIEW_PATH = path.join("data", "processed", "scenario_p0_kis_capability_review.csv");
const KIS_CAPABILITY_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_kis_capability_preflight.json");
const KIS_PRICE_SERVICE_PATH = path.join("server", "src", "services", "kisPriceService.js");
const ASSET_DATA_PROVIDER_PATH = path.join("server", "src", "services", "assetDataProvider.js");
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");

const PREFLIGHT_VERSION = "scenario-p0-kis-capability-preflight-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const READY_STATUS = "ready_for_runtime_preflight";
const REQUIRED_CAPABILITIES = [
  {
    capabilityId: "kis_overseas_monthly_adjusted_close_proxy",
    providerCandidate: "SP500_TR_primary_or_SPY_adjusted_close_proxy",
    blocker: "kis_overseas_monthly_adjusted_close_proxy_capability_not_verified",
  },
  {
    capabilityId: "kis_overseas_monthly_adjusted_dividend_split",
    providerCandidate: "US_price_total_return_dividend_provider",
    blocker: "kis_overseas_monthly_adjusted_dividend_split_capability_not_verified",
  },
];
const REQUIRED_REVIEW_FIELDS = [
  "selectedEndpoint",
  "evidenceUrl",
  "endpointReviewed",
  "termsReviewed",
  "monthlyBackfillReviewed",
  "adjustmentBasisReviewed",
  "rawRedistributionReviewed",
  "reviewOwner",
  "reviewedAt",
  "approvalEvidence",
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

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isYes(value) {
  return String(value ?? "").trim().toLowerCase() === "yes";
}

function inspectRepoSupport() {
  const kisService = fs.existsSync(KIS_PRICE_SERVICE_PATH) ? fs.readFileSync(KIS_PRICE_SERVICE_PATH, "utf8") : "";
  const assetProvider = fs.existsSync(ASSET_DATA_PROVIDER_PATH) ? fs.readFileSync(ASSET_DATA_PROVIDER_PATH, "utf8") : "";
  return {
    kisServiceExists: Boolean(kisService),
    assetDataProviderExists: Boolean(assetProvider),
    overseasCurrentQuoteImplemented:
      kisService.includes("getKisOverseasPrice") &&
      kisService.includes("/uapi/overseas-price/v1/quotations/price-detail"),
    overseasHistoricalMonthlyAdapterImplemented: /monthly|historical|daily-price|period/i.test(kisService) === true,
    overseasDividendSplitAdapterImplemented: /dividend|distribution|corporate-action/i.test(kisService) === true,
    existingRuntimeFallsBackToAlpha: assetProvider.includes("KIS_OVERSEAS_FALLBACK_TO_ALPHA"),
  };
}

function buildPreflight() {
  const intake = readCsv(APPROVAL_INTAKE_TEMPLATE_PATH);
  const review = readCsv(KIS_CAPABILITY_REVIEW_PATH);
  const intakeByProvider = indexBy(intake.rows, "providerCandidate", "approval intake template");
  const reviewByCapability = indexBy(review.rows, "capabilityId", "KIS capability review");
  const repoSupport = inspectRepoSupport();
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);

  const rows = REQUIRED_CAPABILITIES.map((requirement) => {
    const reviewRow = reviewByCapability.get(requirement.capabilityId);
    const intakeRow = intakeByProvider.get(requirement.providerCandidate);
    if (!reviewRow) {
      fail(`${KIS_CAPABILITY_REVIEW_PATH} missing capabilityId=${requirement.capabilityId}`);
    }
    if (!intakeRow) {
      fail(`${APPROVAL_INTAKE_TEMPLATE_PATH} missing providerCandidate=${requirement.providerCandidate}`);
    }
    if (!String(intakeRow.selectedProvider ?? "").includes("Korea Investment")) {
      fail(`${requirement.providerCandidate} must use Korea Investment provider before KIS capability preflight`);
    }
    if (/alpha/i.test(intakeRow.selectedProvider) || /alphavantage/i.test(intakeRow.selectedEndpoint)) {
      fail(`${requirement.providerCandidate} still references Alpha Vantage in selected provider or endpoint`);
    }

    const missingFields = REQUIRED_REVIEW_FIELDS.filter((field) => {
      if (field.endsWith("Reviewed")) {
        return !isYes(reviewRow[field]);
      }
      return String(reviewRow[field] ?? "").trim() === "";
    });
    const endpointValid = isHttpsUrl(reviewRow.selectedEndpoint);
    const evidenceValid = isHttpsUrl(reviewRow.evidenceUrl);
    const capabilityVerified =
      reviewRow.status === READY_STATUS &&
      missingFields.length === 0 &&
      endpointValid &&
      evidenceValid &&
      !monthlyFileExists;
    const blockers = [
      ...(capabilityVerified ? [] : [requirement.blocker]),
      ...missingFields.map((field) => `missing_or_unreviewed_${field}`),
      ...(endpointValid ? [] : ["invalid_or_missing_selectedEndpoint"]),
      ...(evidenceValid ? [] : ["invalid_or_missing_evidenceUrl"]),
      ...(monthlyFileExists ? ["scenario_monthly_returns_csv_already_exists"] : []),
    ];

    return {
      capabilityId: requirement.capabilityId,
      providerCandidate: requirement.providerCandidate,
      sourceScope: reviewRow.sourceScope,
      selectedProvider: intakeRow.selectedProvider,
      selectedEndpoint: reviewRow.selectedEndpoint,
      evidenceUrl: reviewRow.evidenceUrl,
      status: reviewRow.status,
      capabilityVerified,
      blockers: [...new Set(blockers)],
    };
  });

  const capabilityReady = rows.every((row) => row.capabilityVerified);
  const blockers = [...new Set(rows.flatMap((row) => row.blockers))];

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      approvalIntakeTemplate: APPROVAL_INTAKE_TEMPLATE_PATH,
      kisCapabilityReview: KIS_CAPABILITY_REVIEW_PATH,
      kisPriceService: KIS_PRICE_SERVICE_PATH,
      assetDataProvider: ASSET_DATA_PROVIDER_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    outputFiles: {
      preflight: KIS_CAPABILITY_PREFLIGHT_PATH,
    },
    checks: {
      providerCallsMade: false,
      monthlyFileExists,
      requiredCapabilities: REQUIRED_CAPABILITIES.length,
      verifiedCapabilities: rows.filter((row) => row.capabilityVerified).length,
      capabilityReady,
      blockers,
    },
    repoSupport,
    capabilities: rows,
    readiness: {
      status: capabilityReady ? "ready_for_runtime_provider_preflight" : "blocked_pending_kis_capability_review",
      capabilityReady,
      providerCallsAllowed: false,
      monthlyDataFileWritten: monthlyFileExists,
      bootstrapStillBlocked: true,
      nextAllowedStep: capabilityReady
        ? "rerun_provider_runtime_preflight_with_kis_capability_evidence"
        : "record_official_kis_overseas_monthly_price_dividend_split_endpoint_evidence_before_runtime_provider_calls",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(KIS_CAPABILITY_PREFLIGHT_PATH)) {
      fail(`${KIS_CAPABILITY_PREFLIGHT_PATH} not found; run node scripts/generate-scenario-p0-kis-capability-preflight.cjs`);
    }
    const current = fs.readFileSync(KIS_CAPABILITY_PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${KIS_CAPABILITY_PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-p0-kis-capability-preflight.cjs`);
    }
    console.log("[generate-scenario-p0-kis-capability-preflight] ok");
    console.log(`[generate-scenario-p0-kis-capability-preflight] preflight=${KIS_CAPABILITY_PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(KIS_CAPABILITY_PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-p0-kis-capability-preflight] wrote preflight");
  console.log(`[generate-scenario-p0-kis-capability-preflight] capabilityReady=${parsed.checks.capabilityReady}`);
}

main();
