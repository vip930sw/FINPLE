const PROXY_STATUS_MARKER_PATTERN = /(?:^|[*:_\-\s])proxy(?:$|[*:_\-\s])/i;

export const APP_EXPORT_SCENARIO_ERROR_CODES = Object.freeze({
  PROXY_MONTHLY_RETURN: "unsupported_product_policy:proxy_monthly_return",
  MISSING_PROXY_LINEAGE: "missing_metric_lineage:monthly_return_proxy_status",
  IDENTITY_UNAVAILABLE: "production_monthly_identity_unavailable",
});

const POLICY_MESSAGES = Object.freeze({
  [APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN]:
    "Proxy-marked monthly-return rows are unavailable for scenario generation.",
  [APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE]:
    "Monthly-return proxy lineage is unavailable for scenario generation.",
});

export class AppExportScenarioPolicyError extends TypeError {
  constructor({ code, identity }) {
    super(POLICY_MESSAGES[code] || "Scenario policy rejected the input.");
    this.name = "AppExportScenarioPolicyError";
    this.code = code;
    this.identity = identity;
    this.domain = "scenario_policy";
    this.catalogFallbackEligible = false;
  }
}

function normalize(value) {
  return String(value || "").trim().toUpperCase();
}

function statusMarksProxy(value) {
  return typeof value === "string" && PROXY_STATUS_MARKER_PATTERN.test(value.trim());
}

function catalogAllowsLegacyIdentity(identity, catalogPolicyByIdentity) {
  if (
    !catalogPolicyByIdentity ||
    typeof catalogPolicyByIdentity !== "object" ||
    Array.isArray(catalogPolicyByIdentity) ||
    !Object.isFrozen(catalogPolicyByIdentity) ||
    !Object.prototype.hasOwnProperty.call(catalogPolicyByIdentity, identity)
  ) return false;

  const record = catalogPolicyByIdentity[identity];
  if (!record || typeof record !== "object" || !Object.isFrozen(record)) return false;
  return (
    normalize(record.identity?.split(":", 1)[0]) === normalize(identity.split(":", 1)[0]) &&
    normalize(record.identity?.split(":").slice(1).join(":")) === normalize(identity.split(":").slice(1).join(":")) &&
    record.policyEvidenceValid === true &&
    record.ordinaryDistribution === true &&
    record.ordinaryLegacyEligible === true &&
    String(record.dataStatus || "").trim().toLowerCase() === "ready" &&
    String(record.metricsStatus || "").trim().toLowerCase() === "ready" &&
    String(record.reviewFlag || "").trim().toLowerCase() === "none" &&
    ["", "none"].includes(String(record.reviewApprovalStatus || "").trim().toLowerCase()) &&
    !String(record.reviewApprovalPolicyVersion || "").trim() &&
    !String(record.reviewPolicy || "").trim()
  );
}

export function assertMonthlyScenarioLineage(
  identity,
  rows = [],
  {
    runtimeMode = "internal_preview_review_only",
    monthlyRowContract = "proxy_aware_v2",
    legacyProductionBindingVerified = false,
    catalogPolicyByIdentity = null,
  } = {},
) {
  const lineageStates = new Set();
  for (const row of rows) {
    if (typeof row?.dataStatus !== "string") {
      throw new AppExportScenarioPolicyError({
        code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
        identity,
      });
    }
    const legacyUnproven =
      row?.isProxy === null &&
      row?.proxyTicker === null &&
      row?.proxyLineageStatus === "legacy_unproven";
    lineageStates.add(legacyUnproven ? "legacy_unproven" : "proxy_aware");
    if (
      statusMarksProxy(row?.dataStatus) ||
      row?.isProxy === true ||
      (typeof row?.proxyTicker === "string" && row.proxyTicker.trim())
    ) {
      throw new AppExportScenarioPolicyError({
        code: APP_EXPORT_SCENARIO_ERROR_CODES.PROXY_MONTHLY_RETURN,
        identity,
      });
    }
    if (legacyUnproven) {
      const allowed =
        runtimeMode === "production_app_export_ready" &&
        monthlyRowContract === "legacy_v1" &&
        legacyProductionBindingVerified === true &&
        catalogAllowsLegacyIdentity(identity, catalogPolicyByIdentity);
      if (!allowed) {
        throw new AppExportScenarioPolicyError({
          code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
          identity,
        });
      }
      continue;
    }
    if (
      row?.isProxy !== false ||
      typeof row?.proxyTicker !== "string" ||
      row.proxyTicker.trim() ||
      row?.proxyLineageStatus === "legacy_unproven"
    ) {
      throw new AppExportScenarioPolicyError({
        code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
        identity,
      });
    }
  }
  if (lineageStates.size > 1) {
    throw new AppExportScenarioPolicyError({
      code: APP_EXPORT_SCENARIO_ERROR_CODES.MISSING_PROXY_LINEAGE,
      identity,
    });
  }
}
