const fs = require("node:fs");
const path = require("node:path");

const APPROVAL_INTAKE_TEMPLATE_PATH = path.join("data", "processed", "scenario_p0_approval_intake_template.csv");
const APPROVAL_READINESS_PATH = path.join("data", "processed", "scenario_p0_approval_readiness.json");
const PROVIDER_ADAPTER_PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_provider_adapter_preflight.json");
const MONTHLY_CACHE_WRITER_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "scenario_p0_monthly_cache_writer_preflight.json",
);
const MONTHLY_DATA_PATH = path.join("data", "processed", "scenario_monthly_returns.csv");
const PREFLIGHT_PATH = path.join("data", "processed", "scenario_p0_provider_runtime_preflight.json");

const PREFLIGHT_VERSION = "scenario-p0-provider-runtime-preflight-v0.1";
const AUDITED_AT = "2026-06-28T00:00:00Z";
const REQUIRED_PROVIDER_GROUPS = {
  KOSPI200_TR_primary_or_kospi200_etf_proxy: {
    providerKind: "korea_investment_open_api",
    requiredEnvVars: ["KIS_APP_KEY", "KIS_APP_SECRET"],
  },
  KR_price_total_return_dividend_provider: {
    providerKind: "korea_investment_open_api",
    requiredEnvVars: ["KIS_APP_KEY", "KIS_APP_SECRET"],
  },
  SP500_TR_primary_or_SPY_adjusted_close_proxy: {
    providerKind: "korea_investment_open_api",
    requiredEnvVars: ["KIS_APP_KEY", "KIS_APP_SECRET"],
    capabilityVerified: false,
    capabilityBlocker: "kis_overseas_monthly_adjusted_close_proxy_capability_not_verified",
  },
  US_price_total_return_dividend_provider: {
    providerKind: "korea_investment_open_api",
    requiredEnvVars: ["KIS_APP_KEY", "KIS_APP_SECRET"],
    capabilityVerified: false,
    capabilityBlocker: "kis_overseas_monthly_adjusted_dividend_split_capability_not_verified",
  },
  USD_KRW_fx_provider: {
    providerKind: "fred",
    requiredEnvVars: ["FRED_API_KEY"],
  },
};
const REQUIRED_OPT_IN_ENV = {
  FINPLE_SCENARIO_PROVIDER_MODE: "live",
  FINPLE_SCENARIO_ALLOW_PROVIDER_CALLS: "1",
};

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

function hasValue(name, env) {
  return String(env[name] ?? "").trim() !== "";
}

function buildPreflight(env = process.env) {
  const approvalIntake = readCsv(APPROVAL_INTAKE_TEMPLATE_PATH);
  const approvalReadiness = readJson(APPROVAL_READINESS_PATH);
  const providerAdapterPreflight = readJson(PROVIDER_ADAPTER_PREFLIGHT_PATH);
  const monthlyCacheWriterPreflight = readJson(MONTHLY_CACHE_WRITER_PREFLIGHT_PATH);
  const monthlyFileExists = fs.existsSync(MONTHLY_DATA_PATH);

  const approvedProviderGroups = approvalIntake.rows.filter((row) => row.approvalStatusDraft === "ready_for_source_policy_review");
  const unknownProviders = approvedProviderGroups
    .map((row) => row.providerCandidate)
    .filter((providerCandidate) => !REQUIRED_PROVIDER_GROUPS[providerCandidate]);
  if (unknownProviders.length > 0) {
    fail(`unknown providerCandidate in approval intake: ${unknownProviders.join("|")}`);
  }

  const optInRows = Object.entries(REQUIRED_OPT_IN_ENV).map(([name, expectedValue]) => {
    const actualValue = String(env[name] ?? "").trim();
    return {
      name,
      expectedValue,
      present: actualValue !== "",
      matchesExpectedValue: actualValue === expectedValue,
    };
  });
  const optInReady = optInRows.every((row) => row.matchesExpectedValue);

  const providerGroups = approvedProviderGroups
    .slice()
    .sort((left, right) => left.providerCandidate.localeCompare(right.providerCandidate))
    .map((row) => {
      const requirement = REQUIRED_PROVIDER_GROUPS[row.providerCandidate];
      const missingEnvVars = requirement.requiredEnvVars.filter((name) => !hasValue(name, env));
      const capabilityVerified = requirement.capabilityVerified !== false;
      const credentialsPresent = missingEnvVars.length === 0;
      return {
        providerCandidate: row.providerCandidate,
        selectedProvider: row.selectedProvider,
        selectedEndpoint: row.selectedEndpoint,
        providerKind: requirement.providerKind,
        requiredEnvVars: requirement.requiredEnvVars,
        missingEnvVars,
        credentialsPresent,
        capabilityVerified,
        capabilityBlocker: capabilityVerified ? "" : requirement.capabilityBlocker,
        readyForRuntimeProviderCalls: credentialsPresent && capabilityVerified,
      };
    });

  const approvalReady = approvalReadiness.readiness?.providerCallsAllowed === true;
  const adapterReady = providerAdapterPreflight.readiness?.providerCallsAllowed === true;
  const writerReady = monthlyCacheWriterPreflight.readiness?.providerCallsAllowed === true;
  const providerCredentialsReady = providerGroups.length === 5 && providerGroups.every((row) => row.credentialsPresent);
  const providerCapabilityReady = providerGroups.length === 5 && providerGroups.every((row) => row.capabilityVerified);
  const runtimeProviderCallsAllowed =
    approvalReady &&
    adapterReady &&
    writerReady &&
    providerCredentialsReady &&
    providerCapabilityReady &&
    optInReady &&
    !monthlyFileExists;
  const blockers = [
    ...new Set([
      ...(approvalReady ? [] : ["approval_readiness_provider_calls_not_allowed"]),
      ...(adapterReady ? [] : ["provider_adapter_preflight_not_ready"]),
      ...(writerReady ? [] : ["monthly_cache_writer_preflight_not_ready"]),
      ...(providerGroups.length === 5 ? [] : ["provider_group_count_mismatch"]),
      ...(providerCredentialsReady ? [] : ["runtime_provider_credentials_missing"]),
      ...(providerCapabilityReady ? [] : ["runtime_provider_capability_not_verified"]),
      ...(optInReady ? [] : ["runtime_provider_calls_not_explicitly_enabled"]),
      ...(monthlyFileExists ? ["scenario_monthly_returns_csv_already_exists"] : []),
      ...providerGroups.flatMap((row) => row.missingEnvVars.map((name) => `missing_env_${name}`)),
      ...providerGroups.filter((row) => row.capabilityBlocker).map((row) => row.capabilityBlocker),
      ...optInRows.filter((row) => !row.matchesExpectedValue).map((row) => `missing_or_invalid_env_${row.name}`),
    ]),
  ];

  return stableJson({
    preflightVersion: PREFLIGHT_VERSION,
    auditedAt: AUDITED_AT,
    sourceFiles: {
      approvalIntakeTemplate: APPROVAL_INTAKE_TEMPLATE_PATH,
      approvalReadiness: APPROVAL_READINESS_PATH,
      providerAdapterPreflight: PROVIDER_ADAPTER_PREFLIGHT_PATH,
      monthlyCacheWriterPreflight: MONTHLY_CACHE_WRITER_PREFLIGHT_PATH,
      monthlyDataTarget: MONTHLY_DATA_PATH,
    },
    outputFiles: {
      preflight: PREFLIGHT_PATH,
    },
    checks: {
      approvalReady,
      adapterReady,
      writerReady,
      providerGroups: providerGroups.length,
      providerCredentialsReady,
      providerCapabilityReady,
      optInReady,
      monthlyFileExists,
      runtimeProviderCallsAllowed,
      blockers,
    },
    optInPolicy: {
      required: REQUIRED_OPT_IN_ENV,
      rows: optInRows,
    },
    providerGroups,
    readiness: {
      status: runtimeProviderCallsAllowed
        ? "ready_for_controlled_runtime_provider_calls"
        : "blocked_before_runtime_provider_calls",
      runtimeProviderCallsAllowed,
      monthlyDataFileWritten: monthlyFileExists,
      bootstrapStillBlocked: true,
      nextAllowedStep: runtimeProviderCallsAllowed
        ? "run_controlled_monthly_cache_writer_to_create_validated_scenario_monthly_returns"
        : "configure_runtime_provider_credentials_and_explicit_live_call_opt_in_before_monthly_write",
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const preflight = buildPreflight();

  if (checkOnly) {
    if (!fs.existsSync(PREFLIGHT_PATH)) {
      fail(`${PREFLIGHT_PATH} not found; run node scripts/generate-scenario-p0-provider-runtime-preflight.cjs`);
    }
    const current = fs.readFileSync(PREFLIGHT_PATH, "utf8");
    if (current !== preflight) {
      fail(`${PREFLIGHT_PATH} is out of date; run node scripts/generate-scenario-p0-provider-runtime-preflight.cjs`);
    }
    console.log("[generate-scenario-p0-provider-runtime-preflight] ok");
    console.log(`[generate-scenario-p0-provider-runtime-preflight] preflight=${PREFLIGHT_PATH}`);
    return;
  }

  fs.writeFileSync(PREFLIGHT_PATH, preflight);
  const parsed = JSON.parse(preflight);
  console.log("[generate-scenario-p0-provider-runtime-preflight] wrote preflight");
  console.log(`[generate-scenario-p0-provider-runtime-preflight] runtimeProviderCallsAllowed=${parsed.checks.runtimeProviderCallsAllowed}`);
}

main();
