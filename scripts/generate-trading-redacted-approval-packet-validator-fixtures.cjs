const fs = require("node:fs");
const path = require("node:path");
const { validateRedactedApprovalPacket } = require("./validate-trading-redacted-read-only-approval-packet.cjs");

const CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validator_fixtures.json",
);
const VALIDATION_CONTRACT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_contract.json",
);
const VALIDATION_PREFLIGHT_PATH = path.join(
  "data",
  "processed",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
);
const VALIDATOR_PATH = path.join("scripts", "validate-trading-redacted-read-only-approval-packet.cjs");
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);

const CONTRACT_VERSION = "trading-lab-step116-redacted-approval-packet-validator-fixtures-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";
const VALIDATION_NOW = "2026-06-29T00:00:00.000Z";
const FUTURE_APPROVAL_PACKET_PATH = path.join(
  "data",
  "private",
  "trading",
  "read_only_approval.redacted.json",
);
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  FUTURE_APPROVAL_PACKET_PATH,
  path.join("server", "src", "services", "tradingRedactedApprovalPacketValidation.js"),
  path.join("server", "src", "services", "trading", "redactedApprovalPacketValidation.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
];
const FORBIDDEN_SYNTHETIC_PACKET_CONTENT = [
  "full_account_number",
  "raw_account_identifier",
  "app_secret",
  "app_key",
  "access_token",
  "raw_provider_payload",
  "raw_order_payload",
];

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${filePath} not found`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function omitField(packet, field) {
  const next = clone(packet);
  delete next[field];
  return next;
}

function forbiddenRuntimeArtifacts() {
  return FORBIDDEN_RUNTIME_ARTIFACTS.filter((filePath) => fs.existsSync(filePath));
}

function packetContainsForbiddenContent(packet) {
  const serialized = JSON.stringify(packet);
  return FORBIDDEN_SYNTHETIC_PACKET_CONTENT.filter((token) => serialized.includes(token));
}

function validSyntheticRedactedPacket() {
  return {
    approvalId: "approval_fixture_valid_001",
    approvedByHash: "hmac-sha256:fixture_operator_hash_123456",
    approvedAt: "2026-06-29T00:00:00.000Z",
    expiresAt: "2026-07-29T00:00:00.000Z",
    scope: "read_only_shadow",
    environment: "mock",
    baseUrlScope: "virtual_trading_openapivts",
    accountIdHash: "hmac-sha256:fixture_account_hash_123456",
    allowedReadScopes: [
      "account_cash_balance",
      "account_positions",
      "orderable_cash",
      "current_quotes",
      "fx_rate",
      "market_session_state",
      "provider_rate_limit_state",
    ],
    forbiddenActions: [
      "order_submission",
      "order_cancellation",
      "position_mutation",
      "live_trading_endpoint",
      "raw_provider_response_persistence",
      "public_frontend_secret_access",
      "scenario_monthly_cache_write",
    ],
    evidenceTicketHash: "hmac-sha256:fixture_evidence_hash_123456",
    revocationPlanHash: "hmac-sha256:fixture_revocation_hash_123456",
    redactionVersion: "v1",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
  };
}

function invalidSyntheticFixtures(basePacket) {
  return [
    {
      id: "missing_required_field",
      expectedErrorCodes: ["missing_required_field"],
      packet: omitField(basePacket, "revocationPlanHash"),
    },
    {
      id: "unknown_field",
      expectedErrorCodes: ["unknown_field"],
      packet: {
        ...basePacket,
        unexpected: "redacted_fixture_value",
      },
    },
    {
      id: "malformed_hash_field",
      expectedErrorCodes: ["malformed_hash_field"],
      packet: {
        ...basePacket,
        accountIdHash: "not-a-labelled-hash",
      },
    },
    {
      id: "expired_approval",
      expectedErrorCodes: ["expired_approval"],
      packet: {
        ...basePacket,
        expiresAt: "2026-06-28T00:00:00.000Z",
      },
    },
    {
      id: "invalid_scope",
      expectedErrorCodes: ["invalid_scope"],
      packet: {
        ...basePacket,
        scope: "live_guarded",
      },
    },
    {
      id: "invalid_environment",
      expectedErrorCodes: ["invalid_environment"],
      packet: {
        ...basePacket,
        environment: "production",
      },
    },
    {
      id: "invalid_base_url_scope",
      expectedErrorCodes: ["invalid_base_url_scope"],
      packet: {
        ...basePacket,
        baseUrlScope: "live_trading_endpoint",
      },
    },
    {
      id: "forbidden_flag_enabled",
      expectedErrorCodes: ["forbidden_flag_enabled"],
      packet: {
        ...basePacket,
        providerCallsAllowed: true,
      },
    },
    {
      id: "unknown_array_value",
      expectedErrorCodes: ["unknown_array_value"],
      packet: {
        ...basePacket,
        allowedReadScopes: ["account_cash_balance", "order_submission"],
      },
    },
    {
      id: "missing_forbidden_action",
      expectedErrorCodes: ["missing_forbidden_action"],
      packet: {
        ...basePacket,
        forbiddenActions: ["scenario_monthly_cache_write"],
      },
    },
  ];
}

function fixtureValidationEvidence(validPacket, invalidFixtures) {
  const validResult = validateRedactedApprovalPacket(validPacket, { now: VALIDATION_NOW });
  const invalidResults = invalidFixtures.map((fixture) => {
    const result = validateRedactedApprovalPacket(fixture.packet, { now: VALIDATION_NOW });
    const actualErrorCodes = [...new Set(result.errors.map((error) => error.code))].sort();
    const missingExpectedErrorCodes = fixture.expectedErrorCodes.filter((code) => !actualErrorCodes.includes(code));
    return {
      id: fixture.id,
      valid: result.valid,
      expectedErrorCodes: fixture.expectedErrorCodes,
      actualErrorCodes,
      missingExpectedErrorCodes,
      passed: result.valid === false && missingExpectedErrorCodes.length === 0,
    };
  });

  return {
    validFixturePasses: validResult.valid === true,
    validFixtureErrorCodes: validResult.errors.map((error) => error.code),
    invalidFixturesFailWithExpectedCodes: invalidResults.every((result) => result.passed),
    invalidResults,
  };
}

function buildContract() {
  const validationContract = readJson(VALIDATION_CONTRACT_PATH);
  const validationPreflight = readJson(VALIDATION_PREFLIGHT_PATH);
  const validatorSource = readText(VALIDATOR_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const syntheticValidPacket = validSyntheticRedactedPacket();
  const syntheticInvalidFixtures = invalidSyntheticFixtures(syntheticValidPacket);
  const validationEvidence = fixtureValidationEvidence(syntheticValidPacket, syntheticInvalidFixtures);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const forbiddenSyntheticPacketContent = [
    ...packetContainsForbiddenContent(syntheticValidPacket),
    ...syntheticInvalidFixtures.flatMap((fixture) => packetContainsForbiddenContent(fixture.packet)),
  ];
  const checks = {
    fixturesOnly: true,
    validationContractReady:
      validationContract.readiness?.readyForFutureRedactedApprovalPacketValidationImplementationReview === true &&
      validationContract.readiness?.validationImplementationAllowed === true &&
      validationContract.readiness?.approvalPacketCreatedNow === false &&
      validationContract.readiness?.approvalPacketImportedNow === false &&
      validationContract.readiness?.providerCallsAllowed === false &&
      validationContract.readiness?.orderSubmissionAllowed === false,
    validationPreflightReady:
      validationPreflight.readiness?.readyForPureLocalValidatorImplementationReview === true &&
      validationPreflight.readiness?.validationImplementationAllowedNow === true &&
      validationPreflight.readiness?.approvalPacketCreatedNow === false &&
      validationPreflight.readiness?.approvalPacketImportedNow === false &&
      validationPreflight.readiness?.providerCallsAllowed === false &&
      validationPreflight.readiness?.orderSubmissionAllowed === false &&
      validationPreflight.readiness?.runtimeRouteAllowed === false,
    validatorExportsLocalValidation:
      validatorSource.includes("validateRedactedApprovalPacket") &&
      validatorSource.includes("packet_path_required") &&
      validatorSource.includes("--packet"),
    architectureDocMentionsLocalValidator:
      architectureDoc.includes("Trading Redacted Approval Packet Local Validator") &&
      architectureDoc.includes("validate-trading-redacted-read-only-approval-packet"),
    validFixturePasses: validationEvidence.validFixturePasses,
    invalidFixturesFailWithExpectedCodes: validationEvidence.invalidFixturesFailWithExpectedCodes,
    noForbiddenSyntheticPacketContent: forbiddenSyntheticPacketContent.length === 0,
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    privateApprovalPacketCreated: false,
    approvalPacketImportedNow: false,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
  };
  const readyForValidatorFixtureRegression =
    checks.validationContractReady &&
    checks.validationPreflightReady &&
    checks.validatorExportsLocalValidation &&
    checks.architectureDocMentionsLocalValidator &&
    checks.validFixturePasses &&
    checks.invalidFixturesFailWithExpectedCodes &&
    checks.noForbiddenSyntheticPacketContent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2K",
    scope: "trading_redacted_approval_packet_validator_fixtures",
    sourceFiles: {
      validationContract: VALIDATION_CONTRACT_PATH,
      validationPreflight: VALIDATION_PREFLIGHT_PATH,
      validator: VALIDATOR_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      fixturesOnly: true,
      privateApprovalPacketCreated: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    validation: {
      now: VALIDATION_NOW,
      redactionBoundary:
        "synthetic fixtures only; no real account identifiers, operator names, evidence text, private peppers, provider payloads, order payloads, or private approval packet content",
      validSyntheticRedactedPacket: syntheticValidPacket,
      invalidSyntheticFixtures: syntheticInvalidFixtures,
      evidence: validationEvidence,
    },
    checks,
    evidence: {
      validationContractStatus: validationContract.readiness?.status,
      validationPreflightStatus: validationPreflight.readiness?.status,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      forbiddenSyntheticPacketContent: [...new Set(forbiddenSyntheticPacketContent)],
    },
    readiness: {
      status: readyForValidatorFixtureRegression
        ? "fixtures_ready_for_redacted_approval_packet_validator_regression"
        : "blocked_before_redacted_approval_packet_validator_fixture_regression",
      readyForValidatorFixtureRegression,
      fixturesOnly: true,
      privateApprovalPacketCreated: false,
      approvalPacketImportedNow: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.validationContractReady ? [] : ["redacted_approval_packet_validation_contract_not_ready"]),
        ...(checks.validationPreflightReady ? [] : ["redacted_approval_packet_validation_preflight_not_ready"]),
        ...(checks.validatorExportsLocalValidation ? [] : ["local_validator_export_not_ready"]),
        ...(checks.architectureDocMentionsLocalValidator ? [] : ["architecture_doc_missing_local_validator"]),
        ...(checks.validFixturePasses ? [] : ["valid_synthetic_fixture_does_not_pass"]),
        ...(checks.invalidFixturesFailWithExpectedCodes ? [] : ["invalid_synthetic_fixtures_do_not_fail_as_expected"]),
        ...(checks.noForbiddenSyntheticPacketContent ? [] : ["synthetic_fixture_contains_forbidden_content"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(
        `${CONTRACT_PATH} not found; run node scripts/generate-trading-redacted-approval-packet-validator-fixtures.cjs`,
      );
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(
        `${CONTRACT_PATH} is out of date; run node scripts/generate-trading-redacted-approval-packet-validator-fixtures.cjs`,
      );
    }
    console.log("[generate-trading-redacted-approval-packet-validator-fixtures] ok");
    console.log(`[generate-trading-redacted-approval-packet-validator-fixtures] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-redacted-approval-packet-validator-fixtures] wrote contract");
  console.log(
    `[generate-trading-redacted-approval-packet-validator-fixtures] readyForValidatorFixtureRegression=${parsed.readiness.readyForValidatorFixtureRegression}`,
  );
}

main();
