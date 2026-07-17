"use strict";

const {
  canonicalJson,
  hasExactKeys,
  hashWithDomain,
  isRecord,
  isSafeIdentity,
  isSha256,
  uniqueSorted,
} = require("./metrics-cutover-guarded-executor-contracts.cjs");
const {
  FIXED_FALSE_FIELDS: STEP_E_FIXED_FALSE_FIELDS,
  FUTURE_SCENARIOS,
  buildPackageSummary,
  buildValidPostgresqlTestPackage,
  validateFutureEvidenceSpec,
  validateIntrospectionSpec,
  validateMigrationSpec,
  validatePackageSummary,
  validateQuerySpec,
  validateTestDatabaseGate,
  validateUpstreamArtifacts,
} = require("./metrics-cutover-postgresql-test-package.cjs");

const VERSIONS = Object.freeze({
  environment: "metrics-cutover-test-database-environment-classification-v1-step114-2x-f",
  network: "metrics-cutover-network-destination-observation-policy-v1-step114-2x-f",
  database: "metrics-cutover-database-fingerprint-observation-policy-v1-step114-2x-f",
  certificate: "metrics-cutover-certificate-fingerprint-observation-policy-v1-step114-2x-f",
  credential: "metrics-cutover-test-database-credential-injection-policy-v1-step114-2x-f",
  authorization: "metrics-cutover-test-database-one-time-authorization-policy-v1-step114-2x-f",
  summary: "metrics-cutover-test-database-execution-gate-preparation-summary-v1-step114-2x-f",
});

const FIXED_FALSE_FIELDS = Object.freeze([...new Set([
  ...STEP_E_FIXED_FALSE_FIELDS,
  "environmentObservationExecuted", "networkDestinationValidated",
  "databaseFingerprintValidated", "certificateFingerprintValidated",
  "namespaceIsolationValidated", "credentialInjectionValidated",
  "oneTimeAuthorizationIssued", "oneTimeAuthorizationConsumed",
])]);

const DOMAINS = Object.freeze(Object.fromEntries(
  Object.keys(VERSIONS).flatMap((name) => [
    [`${name}Id`, `FINPLE_STEP114_2X_F_${name.toUpperCase()}_ID\0`],
    [`${name}Hash`, `FINPLE_STEP114_2X_F_${name.toUpperCase()}_HASH\0`],
  ]),
));

const SPECS = Object.freeze(Object.fromEntries(Object.entries(VERSIONS).map(
  ([name, version]) => [name, Object.freeze({
    version,
    idField: name === "summary" ? "preparationSummaryId" : `${name}PolicyId`.replace("environmentPolicy", "environmentClassification"),
    hashField: name === "summary" ? "preparationSummaryHash" : `${name}PolicyHash`.replace("environmentPolicy", "environmentClassification"),
    prefix: `metrics-cutover-test-database-${name}`,
    idDomain: DOMAINS[`${name}Id`],
    hashDomain: DOMAINS[`${name}Hash`],
  })]),
));

const UPSTREAM_BINDING_FIELDS = Object.freeze([
  "packageSummaryId", "packageSummaryHash", "testDatabaseGateId",
  "testDatabaseGateHash", "futureEvidenceSpecId", "futureEvidenceSpecHash",
  "exactScenarioCount",
]);

const ENVIRONMENT_FIELDS = Object.freeze([
  "contractVersion", "environmentClassificationId", "upstreamBindings",
  "purposeClassification", "production", "staging", "sharedDevelopment",
  "applicationDataStorage", "analyticsOrReportingStorage",
  "existingFinpleApplicationDatabase", "containsUnrelatedData",
  "allowedNamespaceCategories", "futureNamespaceEvidenceRequired",
  "environmentObserved", "environmentClassificationHash",
]);
const NETWORK_FIELDS = Object.freeze([
  "contractVersion", "networkPolicyId", "upstreamBindings",
  "futureObservationFields", "observationMethodCategory", "maximumAgeSeconds",
  "allowedClockSkewSeconds", "exactDestinationCount", "wildcardAllowed",
  "redirectAllowed", "dnsRebindingAllowed", "loopbackAllowed",
  "privateNetworkAllowed", "metadataServiceAllowed",
  "productionDestinationAllowed", "stagingDestinationAllowed",
  "unrelatedDestinationAllowed", "ambiguityPolicy", "rawMaterialForbidden",
  "observationExecuted", "networkPolicyHash",
]);
const DATABASE_FIELDS = Object.freeze([
  "contractVersion", "databasePolicyId", "upstreamBindings",
  "futureObservationFields", "purposeClassification",
  "serverCapabilityCategoryRequired", "utcBehaviorAttestationRequired",
  "transactionIsolationAttestationRequired", "schemaPackageStates",
  "applicationObjectAbsenceRequired", "unrelatedObjectAbsenceRequired",
  "maximumAgeSeconds", "allowedClockSkewSeconds", "mismatchPolicy",
  "ambiguityPolicy", "catalogQueryExecuted", "observationExecuted",
  "databasePolicyHash",
]);
const CERTIFICATE_FIELDS = Object.freeze([
  "contractVersion", "certificatePolicyId", "upstreamBindings",
  "futureObservationFields", "tlsRequired", "chainVerificationCategory",
  "hostnameVerificationRequired", "rotationPolicy", "mismatchPolicy",
  "expiryPolicy", "rawMaterialForbidden", "observationExecuted",
  "certificatePolicyHash",
]);
const CREDENTIAL_FIELDS = Object.freeze([
  "contractVersion", "credentialPolicyId", "upstreamBindings",
  "migrationCredentialCategory", "runtimeCredentialCategory",
  "categoriesDistinct", "futureSecretInjectionBoundaryOnly",
  "forbiddenInjectionSources", "forbiddenReuseCategories",
  "runtimeDeniedPrivileges", "runtimeSchemaOwner", "runtimeSuperuser",
  "migrationCredentialUsedForAdapterScenarios", "rotationRequired",
  "revocationRequired", "expiryRequired", "credentialValuesPresent",
  "credentialPolicyHash",
]);
const AUTHORIZATION_FIELDS = Object.freeze([
  "contractVersion", "authorizationPolicyId", "upstreamBindings",
  "environmentClassificationId", "environmentClassificationHash",
  "networkPolicyId", "networkPolicyHash", "databasePolicyId",
  "databasePolicyHash", "certificatePolicyId", "certificatePolicyHash",
  "credentialPolicyId", "credentialPolicyHash", "futureEnvelopeFields",
  "testPurpose", "allowedOperationSet", "maximumExecutionCount",
  "productionScopeAllowed", "productionCutoverScopeAllowed", "reuseAllowed",
  "extensionAllowed", "transferAllowed", "deleteToRetryAllowed",
  "automaticReissueAllowed", "ambiguousIssuePolicy",
  "ambiguousConsumePolicy", "authorizationIssued", "authorizationConsumed",
  "authorizationPolicyHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "preparationSummaryId", "upstreamBindings",
  "environmentClassificationId", "environmentClassificationHash",
  "networkPolicyId", "networkPolicyHash", "databasePolicyId",
  "databasePolicyHash", "certificatePolicyId", "certificatePolicyHash",
  "credentialPolicyId", "credentialPolicyHash", "authorizationPolicyId",
  "authorizationPolicyHash", "exactScenarioCount", "gatePrepared",
  "environmentObserved", "authorizationIssued", "authorizationConsumed",
  ...FIXED_FALSE_FIELDS, "preparationSummaryHash",
]);

const FIELD_SETS = Object.freeze({
  environment: ENVIRONMENT_FIELDS, network: NETWORK_FIELDS,
  database: DATABASE_FIELDS, certificate: CERTIFICATE_FIELDS,
  credential: CREDENTIAL_FIELDS, authorization: AUTHORIZATION_FIELDS,
  summary: SUMMARY_FIELDS,
});

function without(value, field) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
}

function canonicalEqual(left, right) {
  try { return canonicalJson(left) === canonicalJson(right); } catch { return false; }
}

function sealContract(value, name) {
  const spec = SPECS[name];
  const withId = { ...value };
  withId[spec.idField] = `${spec.prefix}-${hashWithDomain(spec.idDomain, value)}`;
  return {
    ...withId,
    [spec.hashField]: hashWithDomain(spec.hashDomain, withId),
  };
}

function validateEnvelope(value, name) {
  const spec = SPECS[name];
  const issues = [];
  if (!isRecord(value) || !hasExactKeys(value, FIELD_SETS[name])) {
    return [`${name}_fields_invalid`];
  }
  if (value.contractVersion !== spec.version) issues.push(`${name}_contract_version_invalid`);
  const idInput = without(without(value, spec.idField), spec.hashField);
  const expectedId = `${spec.prefix}-${hashWithDomain(spec.idDomain, idInput)}`;
  if (!isSafeIdentity(value[spec.idField]) || value[spec.idField] !== expectedId) {
    issues.push(`${name}_id_mismatch`);
  }
  const expectedHash = hashWithDomain(spec.hashDomain, without(value, spec.hashField));
  if (!isSha256(value[spec.hashField]) || value[spec.hashField] !== expectedHash) {
    issues.push(`${name}_hash_mismatch`);
  }
  return issues;
}

function buildUpstream() {
  const postgresqlPackage = buildValidPostgresqlTestPackage();
  return { postgresqlPackage, packageSummary: buildPackageSummary(postgresqlPackage) };
}

function buildUpstreamBindings(upstream) {
  const packet = upstream.postgresqlPackage;
  return {
    packageSummaryId: upstream.packageSummary.packageSummaryId,
    packageSummaryHash: upstream.packageSummary.packageSummaryHash,
    testDatabaseGateId: packet.testDatabaseGate.testDatabaseGateId,
    testDatabaseGateHash: packet.testDatabaseGate.testDatabaseGateHash,
    futureEvidenceSpecId: packet.futureEvidenceSpec.futureEvidenceSpecId,
    futureEvidenceSpecHash: packet.futureEvidenceSpec.futureEvidenceSpecHash,
    exactScenarioCount: FUTURE_SCENARIOS.length,
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, ["postgresqlPackage", "packageSummary"])) {
    return ["upstream_fields_invalid"];
  }
  const packet = upstream.postgresqlPackage;
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "upstreamArtifacts", "migrationSpec", "querySpec", "introspectionSpec",
    "testDatabaseGate", "futureEvidenceSpec",
  ])) return ["upstream_postgresql_package_fields_invalid"];
  return uniqueSorted([
    ...validateUpstreamArtifacts(packet.upstreamArtifacts),
    ...validateMigrationSpec(packet.migrationSpec, packet.upstreamArtifacts),
    ...validateQuerySpec(packet.querySpec, packet.upstreamArtifacts),
    ...validateIntrospectionSpec(packet.introspectionSpec, packet.upstreamArtifacts, packet.migrationSpec),
    ...validateTestDatabaseGate(packet.testDatabaseGate, packet.upstreamArtifacts, packet.migrationSpec, packet.querySpec, packet.introspectionSpec),
    ...validateFutureEvidenceSpec(packet.futureEvidenceSpec, packet.upstreamArtifacts, packet.migrationSpec, packet.querySpec, packet.introspectionSpec, packet.testDatabaseGate),
    ...validatePackageSummary(upstream.packageSummary, packet),
  ]);
}

function validateBindings(value, upstream, label) {
  if (!isRecord(value) || !hasExactKeys(value, UPSTREAM_BINDING_FIELDS)) {
    return [`${label}_upstream_binding_fields_invalid`];
  }
  return canonicalEqual(value, buildUpstreamBindings(upstream))
    ? [] : [`${label}_upstream_binding_mismatch`];
}

function buildEnvironmentClassification(upstream) {
  return sealContract({
    contractVersion: VERSIONS.environment,
    upstreamBindings: buildUpstreamBindings(upstream),
    purposeClassification: "disposable_isolated_conformance_only",
    production: false, staging: false, sharedDevelopment: false,
    applicationDataStorage: false, analyticsOrReportingStorage: false,
    existingFinpleApplicationDatabase: false, containsUnrelatedData: false,
    allowedNamespaceCategories: [
      "new_empty_disposable_namespace",
      "separately_approved_disposable_namespace",
    ],
    futureNamespaceEvidenceRequired: true, environmentObserved: false,
  }, "environment");
}

function buildNetworkPolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.network,
    upstreamBindings: buildUpstreamBindings(upstream),
    futureObservationFields: [
      "destinationAllowlistHash", "observationMethodCategory",
      "observerAttestationHash", "observedAt", "expiresAt",
    ],
    observationMethodCategory: "future_sanitized_out_of_band_attestation",
    maximumAgeSeconds: 900, allowedClockSkewSeconds: 30,
    exactDestinationCount: 1, wildcardAllowed: false, redirectAllowed: false,
    dnsRebindingAllowed: false, loopbackAllowed: false,
    privateNetworkAllowed: false, metadataServiceAllowed: false,
    productionDestinationAllowed: false, stagingDestinationAllowed: false,
    unrelatedDestinationAllowed: false, ambiguityPolicy: "manual_review_fail_closed",
    rawMaterialForbidden: ["endpoint", "hostname", "ip_address", "port", "url"],
    observationExecuted: false,
  }, "network");
}

function buildDatabasePolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.database,
    upstreamBindings: buildUpstreamBindings(upstream),
    futureObservationFields: [
      "databaseFingerprintHash", "disposableNamespaceEvidenceHash",
      "purposeClassification", "serverCapabilityCategory",
      "utcBehaviorAttestationHash", "transactionIsolationAttestationHash",
      "schemaPackageState", "observedAt", "expiresAt",
    ],
    purposeClassification: "disposable_isolated_conformance_only",
    serverCapabilityCategoryRequired: true,
    utcBehaviorAttestationRequired: true,
    transactionIsolationAttestationRequired: true,
    schemaPackageStates: [
      "expected_package_absent_before_migration",
      "exact_expected_package_bound_after_migration",
    ],
    applicationObjectAbsenceRequired: true, unrelatedObjectAbsenceRequired: true,
    maximumAgeSeconds: 900, allowedClockSkewSeconds: 30,
    mismatchPolicy: "manual_review_fail_closed",
    ambiguityPolicy: "manual_review_fail_closed",
    catalogQueryExecuted: false, observationExecuted: false,
  }, "database");
}

function buildCertificatePolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.certificate,
    upstreamBindings: buildUpstreamBindings(upstream),
    futureObservationFields: [
      "certificateFingerprintHash", "observedAt", "expiresAt",
    ],
    tlsRequired: true,
    chainVerificationCategory: "future_full_chain_verification_required",
    hostnameVerificationRequired: true,
    rotationPolicy: "new_fingerprint_requires_new_observation_and_manual_review",
    mismatchPolicy: "manual_review_fail_closed",
    expiryPolicy: "manual_review_fail_closed",
    rawMaterialForbidden: [
      "raw_certificate", "subject", "issuer", "san", "hostname", "endpoint",
    ],
    observationExecuted: false,
  }, "certificate");
}

function buildCredentialPolicy(upstream) {
  return sealContract({
    contractVersion: VERSIONS.credential,
    upstreamBindings: buildUpstreamBindings(upstream),
    migrationCredentialCategory: "future_dedicated_test_migration_credential",
    runtimeCredentialCategory: "future_dedicated_test_runtime_credential",
    categoriesDistinct: true, futureSecretInjectionBoundaryOnly: true,
    forbiddenInjectionSources: [
      "cli", "stdin", "environment_fallback", "committed_file", "log",
      "public_output", "application_variable_fallback",
    ],
    forbiddenReuseCategories: [
      "application_service_role", "managed_application_database",
      "trading_provider", "payment", "authentication", "deployment",
    ],
    runtimeDeniedPrivileges: [
      "ALTER", "DELETE", "DROP", "TRUNCATE", "SCHEMA_OWNER", "SUPERUSER",
    ],
    runtimeSchemaOwner: false, runtimeSuperuser: false,
    migrationCredentialUsedForAdapterScenarios: false,
    rotationRequired: true, revocationRequired: true, expiryRequired: true,
    credentialValuesPresent: false,
  }, "credential");
}

function buildAuthorizationPolicy(upstream, contracts) {
  return sealContract({
    contractVersion: VERSIONS.authorization,
    upstreamBindings: buildUpstreamBindings(upstream),
    environmentClassificationId: contracts.environment.environmentClassificationId,
    environmentClassificationHash: contracts.environment.environmentClassificationHash,
    networkPolicyId: contracts.network.networkPolicyId,
    networkPolicyHash: contracts.network.networkPolicyHash,
    databasePolicyId: contracts.database.databasePolicyId,
    databasePolicyHash: contracts.database.databasePolicyHash,
    certificatePolicyId: contracts.certificate.certificatePolicyId,
    certificatePolicyHash: contracts.certificate.certificatePolicyHash,
    credentialPolicyId: contracts.credential.credentialPolicyId,
    credentialPolicyHash: contracts.credential.credentialPolicyHash,
    futureEnvelopeFields: [
      "sanitizedApproverIdentityHash", "issuedAt", "expiresAt", "nonceHash",
    ],
    testPurpose: "exact_15_scenario_disposable_conformance_run",
    allowedOperationSet: [
      "observe_sanitized_environment_evidence",
      "connect_once_to_disposable_test_database",
      "apply_exact_bound_migration_package",
      "execute_exact_15_scenario_conformance_run",
      "collect_sanitized_hash_chained_evidence",
    ],
    maximumExecutionCount: 1,
    productionScopeAllowed: false, productionCutoverScopeAllowed: false,
    reuseAllowed: false, extensionAllowed: false, transferAllowed: false,
    deleteToRetryAllowed: false, automaticReissueAllowed: false,
    ambiguousIssuePolicy: "manual_review_fail_closed",
    ambiguousConsumePolicy: "manual_review_fail_closed",
    authorizationIssued: false, authorizationConsumed: false,
  }, "authorization");
}

function buildContracts(upstream) {
  const contracts = {
    environment: buildEnvironmentClassification(upstream),
    network: buildNetworkPolicy(upstream),
    database: buildDatabasePolicy(upstream),
    certificate: buildCertificatePolicy(upstream),
    credential: buildCredentialPolicy(upstream),
  };
  contracts.authorization = buildAuthorizationPolicy(upstream, contracts);
  return contracts;
}

function expectedContract(name, upstream, contracts) {
  if (name === "environment") return buildEnvironmentClassification(upstream);
  if (name === "network") return buildNetworkPolicy(upstream);
  if (name === "database") return buildDatabasePolicy(upstream);
  if (name === "certificate") return buildCertificatePolicy(upstream);
  if (name === "credential") return buildCredentialPolicy(upstream);
  return buildAuthorizationPolicy(upstream, contracts);
}

function validateContract(value, name, upstream, contracts) {
  const issues = [
    ...validateEnvelope(value, name),
    ...validateBindings(value?.upstreamBindings, upstream, name),
  ];
  let expected;
  try { expected = expectedContract(name, upstream, contracts); } catch {
    return uniqueSorted([...issues, `${name}_expected_contract_failed`]);
  }
  for (const field of FIELD_SETS[name]) {
    if (field === SPECS[name].idField || field === SPECS[name].hashField) continue;
    if (!canonicalEqual(value?.[field], expected[field])) issues.push(`${name}_field_invalid:${field}`);
  }
  return uniqueSorted(issues);
}

function buildPreparationSummary(upstream, contracts) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    upstreamBindings: buildUpstreamBindings(upstream),
    environmentClassificationId: contracts.environment.environmentClassificationId,
    environmentClassificationHash: contracts.environment.environmentClassificationHash,
    networkPolicyId: contracts.network.networkPolicyId,
    networkPolicyHash: contracts.network.networkPolicyHash,
    databasePolicyId: contracts.database.databasePolicyId,
    databasePolicyHash: contracts.database.databasePolicyHash,
    certificatePolicyId: contracts.certificate.certificatePolicyId,
    certificatePolicyHash: contracts.certificate.certificatePolicyHash,
    credentialPolicyId: contracts.credential.credentialPolicyId,
    credentialPolicyHash: contracts.credential.credentialPolicyHash,
    authorizationPolicyId: contracts.authorization.authorizationPolicyId,
    authorizationPolicyHash: contracts.authorization.authorizationPolicyHash,
    exactScenarioCount: FUTURE_SCENARIOS.length,
    gatePrepared: true, environmentObserved: false,
    authorizationIssued: false, authorizationConsumed: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}

function validatePreparationSummary(summary, upstream, contracts) {
  const issues = [
    ...validateEnvelope(summary, "summary"),
    ...validateBindings(summary?.upstreamBindings, upstream, "summary"),
  ];
  let expected;
  try { expected = buildPreparationSummary(upstream, contracts); } catch {
    return uniqueSorted([...issues, "summary_expected_contract_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if ([SPECS.summary.idField, SPECS.summary.hashField].includes(field)) continue;
    if (!canonicalEqual(summary?.[field], expected[field])) issues.push(`summary_field_invalid:${field}`);
  }
  for (const field of FIXED_FALSE_FIELDS) {
    if (summary?.[field] !== false) issues.push(`summary_fixed_false_invalid:${field}`);
  }
  return uniqueSorted(issues);
}

function buildValidPreparationPacket() {
  const upstream = buildUpstream();
  const contracts = buildContracts(upstream);
  return { upstream, contracts };
}

function safeResult(status, summary = {}, issues = []) {
  const ready = status === "test_database_execution_gate_prepared";
  return {
    ok: ready, status, contractVersion: VERSIONS.summary,
    gatePrepared: ready, upstreamValidated: ready,
    environmentPolicyValidated: ready, networkPolicyValidated: ready,
    databasePolicyValidated: ready, certificatePolicyValidated: ready,
    credentialPolicyValidated: ready, authorizationPolicyValidated: ready,
    preparationSummary: ready ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: ready ? [
      "gate_prepared_is_not_environment_observation_connection_or_execution_authority",
    ] : [],
  };
}

function evaluateTestDatabaseExecutionGatePreparation(packet) {
  if (packet === undefined || packet === null) return safeResult("idle");
  if (!isRecord(packet) || !hasExactKeys(packet, ["upstream", "contracts"]) ||
      !isRecord(packet.contracts) || !hasExactKeys(packet.contracts, [
        "environment", "network", "database", "certificate", "credential",
        "authorization",
      ])) return safeResult("blocked", {}, ["preparation_packet_fields_invalid"]);
  const issues = validateUpstream(packet.upstream);
  for (const name of [
    "environment", "network", "database", "certificate", "credential",
    "authorization",
  ]) {
    issues.push(...validateContract(
      packet.contracts[name], name, packet.upstream, packet.contracts,
    ));
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);
  try {
    const summary = buildPreparationSummary(packet.upstream, packet.contracts);
    issues.push(...validatePreparationSummary(summary, packet.upstream, packet.contracts));
    canonicalJson(summary);
    return issues.length > 0
      ? safeResult("blocked", {}, issues)
      : safeResult("test_database_execution_gate_prepared", summary);
  } catch {
    return safeResult("blocked", {}, ["preparation_summary_construction_failed"]);
  }
}

module.exports = {
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  SPECS,
  UPSTREAM_BINDING_FIELDS,
  VERSIONS,
  buildAuthorizationPolicy,
  buildCertificatePolicy,
  buildContracts,
  buildCredentialPolicy,
  buildDatabasePolicy,
  buildEnvironmentClassification,
  buildNetworkPolicy,
  buildPreparationSummary,
  buildUpstream,
  buildUpstreamBindings,
  buildValidPreparationPacket,
  evaluateTestDatabaseExecutionGatePreparation,
  safeResult,
  sealContract,
  validateContract,
  validatePreparationSummary,
  validateUpstream,
};
