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
const stepI = require("./metrics-cutover-disposable-environment-selection.cjs");

const VERSIONS = Object.freeze({
  receipt: "metrics-cutover-operator-environment-class-decision-receipt-v1-step114-2x-j",
  request: "metrics-cutover-disposable-environment-provisioning-request-v1-step114-2x-j",
  summary: "metrics-cutover-environment-class-decision-preparation-summary-v1-step114-2x-j",
});

const PUBLIC_STATES = Object.freeze([
  "awaiting_operator_environment_class_decision",
  "operator_environment_class_decision_validated",
  "blocked",
]);

const REQUIRED_EVIDENCE_CATEGORIES = Object.freeze([
  "environment_class_decision_receipt_hash",
  "step_i_selection_package_binding",
  "disposable_namespace_isolation_attestation_hash",
  "credential_category_separation_attestation_hash",
  "disposal_responsibility_attestation_hash",
  "future_live_observation_approval_required",
]);

const FORBIDDEN_MATERIAL_CATEGORIES = Object.freeze([
  ...stepI.FORBIDDEN_MATERIAL_CATEGORIES,
  "provider_product_or_price_claim",
  "account_project_or_service_identity",
  "command_or_screenshot_material",
  "raw_operator_decision_material",
]);

const AUTHORITY_FALSE_FIELDS = Object.freeze([
  "providerResearchAuthorized",
  "providerSelectionAuthorized",
  "providerAccountAccessAuthorized",
  "realTargetSelectionAuthorized",
  "environmentProvisioningAuthorized",
  "credentialProvisioningAuthorized",
  "credentialUseAuthorized",
  "environmentObservationAuthorized",
  "environmentObservationExecuted",
  "providerConnectionAuthorized",
  "testDatabaseConnectionAuthorized",
  "productionDatabaseConnectionAuthorized",
  "oneTimeAuthorizationIssueAuthorized",
  "oneTimeAuthorizationIssued",
  "provisioningRunbookActivated",
  "sqlExecutionAuthorized",
  "migrationAuthorized",
  "scenarioExecutionAuthorized",
  "evidenceCollectionStarted",
  "environmentDisposalAuthorized",
  "environmentDisposalExecuted",
  "commitAuthorized",
  "pushAuthorized",
  "mergeAuthorized",
  "deploymentAuthorized",
  "productionPublicationAuthorized",
]);

const FIXED_FALSE_FIELDS = Object.freeze([...new Set([
  ...stepI.FIXED_FALSE_FIELDS,
  ...AUTHORITY_FALSE_FIELDS,
  "selectionDecisionRecorded",
  "humanSelectionRecorded",
  "realEnvironmentClassSelected",
])]);

const SPECS = Object.freeze({
  receipt: Object.freeze({
    version: VERSIONS.receipt,
    idField: "decisionReceiptId",
    hashField: "decisionReceiptHash",
    prefix: "metrics-cutover-operator-environment-class-decision-receipt",
    idDomain: "FINPLE_STEP114_2X_J_DECISION_RECEIPT_ID\0",
    hashDomain: "FINPLE_STEP114_2X_J_DECISION_RECEIPT_HASH\0",
  }),
  request: Object.freeze({
    version: VERSIONS.request,
    idField: "provisioningRequestId",
    hashField: "provisioningRequestHash",
    prefix: "metrics-cutover-disposable-environment-provisioning-request",
    idDomain: "FINPLE_STEP114_2X_J_PROVISIONING_REQUEST_ID\0",
    hashDomain: "FINPLE_STEP114_2X_J_PROVISIONING_REQUEST_HASH\0",
  }),
  summary: Object.freeze({
    version: VERSIONS.summary,
    idField: "preparationSummaryId",
    hashField: "preparationSummaryHash",
    prefix: "metrics-cutover-environment-class-decision-preparation-summary",
    idDomain: "FINPLE_STEP114_2X_J_PREPARATION_SUMMARY_ID\0",
    hashDomain: "FINPLE_STEP114_2X_J_PREPARATION_SUMMARY_HASH\0",
  }),
});

const RECEIPT_FIELDS = Object.freeze([
  "contractVersion", "decisionReceiptId",
  "stepISelectionSummaryId", "stepISelectionSummaryHash",
  "selectionCriteriaId", "selectionCriteriaHash",
  "candidateMatrixId", "candidateMatrixHash",
  "selectionDecisionPolicyId", "selectionDecisionPolicyHash",
  "provisioningRunbookId", "provisioningRunbookHash",
  "futureDecisionContractVersion", "candidateClasses", "criteriaOrder",
  "criterionWeights", "candidateTotals", "deterministicRanking",
  "selectedCandidateClasses", "selectionRationaleHash",
  "operatorDecisionAttestationHash", "decisionNonceHash", "issuedAt", "expiresAt",
  "unresolvedTie", "humanDecisionExplicit", "syntheticValidationOnly",
  "rawMaterialPresent", "providerSpecificMaterialPresent", "manualReviewRequired",
  "decisionReceiptHash",
]);

const REQUEST_FIELDS = Object.freeze([
  "contractVersion", "provisioningRequestId", "decisionReceiptId", "decisionReceiptHash",
  "selectedCandidateClass", "stepIProvisioningRunbookId", "stepIProvisioningRunbookHash",
  "operationSequence", "requiredEvidenceCategories", "forbiddenMaterialCategories",
  "expiresAt", "requestNonceHash", "externalOperatorOnlyAttestationHash",
  "externalOperatorOnly", "syntheticValidationOnly", "rawMaterialPresent",
  "providerSpecificMaterialPresent", "requestAuthorizesExecution",
  ...AUTHORITY_FALSE_FIELDS, "provisioningRequestHash",
]);

const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "preparationSummaryId",
  "decisionReceiptId", "decisionReceiptHash",
  "provisioningRequestId", "provisioningRequestHash",
  "stepISelectionSummaryId", "stepISelectionSummaryHash",
  "publicState", "receiptValidated", "provisioningRequestPrepared",
  "syntheticValidationOnly", "rawMaterialPresent",
  ...FIXED_FALSE_FIELDS, "preparationSummaryHash",
]);

const FIELD_SETS = Object.freeze({
  receipt: RECEIPT_FIELDS,
  request: REQUEST_FIELDS,
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
  return { ...withId, [spec.hashField]: hashWithDomain(spec.hashDomain, withId) };
}

function validateEnvelope(value, name) {
  const spec = SPECS[name];
  if (!isRecord(value) || !hasExactKeys(value, FIELD_SETS[name])) {
    return [`${name}_fields_invalid`];
  }
  const issues = [];
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

function parseCanonicalInstant(value) {
  if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value
    ? milliseconds : null;
}

function validateHashArray(value, label) {
  if (!Array.isArray(value)) return [`${label}_invalid`];
  const issues = [];
  value.forEach((hash, index) => {
    if (!isSha256(hash)) issues.push(`${label}_hash_invalid:${index}`);
  });
  if (new Set(value).size !== value.length) issues.push(`${label}_duplicate`);
  if (!canonicalEqual(value, [...value].sort())) issues.push(`${label}_unsorted`);
  return uniqueSorted(issues);
}

function buildUpstream() {
  const selectionPacket = stepI.buildValidPreparationPacket();
  return {
    selectionPacket,
    selectionSummary: stepI.buildSelectionSummary(selectionPacket.upstream, selectionPacket.contracts),
  };
}

function buildStepIBindings(upstream) {
  const { selectionPacket, selectionSummary } = upstream;
  const { criteria, matrix, decision, runbook } = selectionPacket.contracts;
  return {
    stepISelectionSummaryId: selectionSummary.selectionSummaryId,
    stepISelectionSummaryHash: selectionSummary.selectionSummaryHash,
    selectionCriteriaId: criteria.selectionCriteriaId,
    selectionCriteriaHash: criteria.selectionCriteriaHash,
    candidateMatrixId: matrix.candidateMatrixId,
    candidateMatrixHash: matrix.candidateMatrixHash,
    selectionDecisionPolicyId: decision.selectionDecisionPolicyId,
    selectionDecisionPolicyHash: decision.selectionDecisionPolicyHash,
    provisioningRunbookId: runbook.provisioningRunbookId,
    provisioningRunbookHash: runbook.provisioningRunbookHash,
    futureDecisionContractVersion: decision.futureDecisionContractVersion,
    candidateClasses: [...matrix.candidateClasses],
    criteriaOrder: criteria.criteria.map(({ criterion }) => criterion),
    criterionWeights: criteria.criteria.map(({ criterion, weight }) => ({ criterion, weight })),
    candidateTotals: matrix.candidateTotals.map((value) => ({ ...value })),
    deterministicRanking: [...matrix.deterministicRanking],
    operationSequence: [...runbook.operationSequence],
    transitiveStepHGBindings: stepI.buildUpstreamBindings(selectionPacket.upstream),
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, ["selectionPacket", "selectionSummary"])) {
    return ["step_i_upstream_fields_invalid"];
  }
  const packet = upstream.selectionPacket;
  if (!isRecord(packet) || !hasExactKeys(packet, ["upstream", "contracts"]) ||
      !isRecord(packet.contracts) || !hasExactKeys(packet.contracts, [
        "criteria", "matrix", "runbook", "decision",
      ])) return ["step_i_selection_packet_fields_invalid"];
  const issues = [...stepI.validateUpstream(packet.upstream)];
  for (const name of ["criteria", "matrix", "runbook", "decision"]) {
    issues.push(...stepI.validateContract(packet.contracts[name], name, packet.upstream, packet.contracts));
  }
  issues.push(...stepI.validateSelectionSummary(
    upstream.selectionSummary, packet.upstream, packet.contracts,
  ));
  let expectedSummary;
  try { expectedSummary = stepI.buildSelectionSummary(packet.upstream, packet.contracts); } catch {}
  if (!expectedSummary || !canonicalEqual(upstream.selectionSummary, expectedSummary)) {
    issues.push("step_i_selection_summary_binding_mismatch");
  }
  let bindings;
  try { bindings = buildStepIBindings(upstream); } catch {
    issues.push("step_i_binding_construction_failed");
  }
  if (bindings) {
    if (!canonicalEqual(bindings.candidateClasses, stepI.CANDIDATE_CLASSES) ||
        bindings.criteriaOrder.length !== 14 ||
        bindings.criterionWeights.reduce((sum, item) => sum + item.weight, 0) !== 100 ||
        bindings.operationSequence.length !== 11) {
      issues.push("step_i_exact_scope_invalid");
    }
    const transitive = bindings.transitiveStepHGBindings.transitiveExecutionPlanBindings;
    if (!isRecord(transitive) || transitive.exactScenarioCount !== 15 ||
        transitive.scenarioOrder.length !== 15 || transitive.executionSequence.length !== 12) {
      issues.push("step_h_g_transitive_scope_invalid");
    }
  }
  return uniqueSorted(issues);
}

function validateDecisionContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, ["upstream", "priorDecisionNonceHashes"])) {
    return ["decision_context_fields_invalid"];
  }
  return uniqueSorted([
    ...validateUpstream(context.upstream),
    ...validateHashArray(context.priorDecisionNonceHashes, "prior_decision_nonce_hashes"),
  ]);
}

function buildSyntheticDecisionReceiptFixture(context) {
  const binding = buildStepIBindings(context.upstream);
  return sealContract({
    contractVersion: VERSIONS.receipt,
    stepISelectionSummaryId: binding.stepISelectionSummaryId,
    stepISelectionSummaryHash: binding.stepISelectionSummaryHash,
    selectionCriteriaId: binding.selectionCriteriaId,
    selectionCriteriaHash: binding.selectionCriteriaHash,
    candidateMatrixId: binding.candidateMatrixId,
    candidateMatrixHash: binding.candidateMatrixHash,
    selectionDecisionPolicyId: binding.selectionDecisionPolicyId,
    selectionDecisionPolicyHash: binding.selectionDecisionPolicyHash,
    provisioningRunbookId: binding.provisioningRunbookId,
    provisioningRunbookHash: binding.provisioningRunbookHash,
    futureDecisionContractVersion: binding.futureDecisionContractVersion,
    candidateClasses: binding.candidateClasses,
    criteriaOrder: binding.criteriaOrder,
    criterionWeights: binding.criterionWeights,
    candidateTotals: binding.candidateTotals,
    deterministicRanking: binding.deterministicRanking,
    selectedCandidateClasses: [binding.deterministicRanking[0]],
    selectionRationaleHash: "1".repeat(64),
    operatorDecisionAttestationHash: "2".repeat(64),
    decisionNonceHash: "3".repeat(64),
    issuedAt: "2026-07-18T00:01:00.000Z",
    expiresAt: "2026-07-18T00:06:00.000Z",
    unresolvedTie: false,
    humanDecisionExplicit: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    providerSpecificMaterialPresent: false,
    manualReviewRequired: false,
  }, "receipt");
}

function validateOperatorDecisionReceipt(value, context, evaluationClockInstant) {
  const contextIssues = validateDecisionContext(context);
  const issues = [...validateEnvelope(value, "receipt"), ...contextIssues];
  if (!isRecord(value) || !isRecord(context) || !isRecord(context.upstream) ||
      !Array.isArray(context.priorDecisionNonceHashes) || contextIssues.length > 0) {
    return uniqueSorted(issues);
  }
  let binding;
  try { binding = buildStepIBindings(context.upstream); } catch {
    return uniqueSorted([...issues, "receipt_step_i_binding_failed"]);
  }
  for (const field of [
    "stepISelectionSummaryId", "stepISelectionSummaryHash",
    "selectionCriteriaId", "selectionCriteriaHash", "candidateMatrixId", "candidateMatrixHash",
    "selectionDecisionPolicyId", "selectionDecisionPolicyHash",
    "provisioningRunbookId", "provisioningRunbookHash", "futureDecisionContractVersion",
  ]) {
    if (value[field] !== binding[field]) issues.push(`receipt_step_i_binding_mismatch:${field}`);
  }
  for (const field of [
    "candidateClasses", "criteriaOrder", "criterionWeights", "candidateTotals", "deterministicRanking",
  ]) {
    if (!canonicalEqual(value[field], binding[field])) issues.push(`receipt_step_i_scope_invalid:${field}`);
  }
  const totals = binding.candidateTotals.map(({ weightedTotal }) => weightedTotal);
  if (new Set(totals).size !== totals.length || value.unresolvedTie !== false) {
    issues.push("receipt_unresolved_tie_manual_review");
  }
  if (!Array.isArray(value.selectedCandidateClasses) || value.selectedCandidateClasses.length !== 1 ||
      value.selectedCandidateClasses[0] !== binding.deterministicRanking[0] ||
      !binding.candidateClasses.includes(value.selectedCandidateClasses[0])) {
    issues.push("receipt_selected_candidate_invalid");
  }
  for (const field of [
    "selectionRationaleHash", "operatorDecisionAttestationHash", "decisionNonceHash",
  ]) {
    if (!isSha256(value[field])) issues.push(`receipt_hash_invalid:${field}`);
  }
  if (isSha256(value.decisionNonceHash) &&
      context.priorDecisionNonceHashes.includes(value.decisionNonceHash)) {
    issues.push("receipt_decision_nonce_replay_manual_review");
  }
  if (value.humanDecisionExplicit !== true || value.syntheticValidationOnly !== true ||
      value.rawMaterialPresent !== false || value.providerSpecificMaterialPresent !== false) {
    issues.push("receipt_synthetic_or_raw_boundary_invalid");
  }
  const issuedAt = parseCanonicalInstant(value.issuedAt);
  const expiresAt = parseCanonicalInstant(value.expiresAt);
  const evaluationClock = parseCanonicalInstant(evaluationClockInstant);
  if (issuedAt === null) issues.push("receipt_issued_at_invalid");
  if (expiresAt === null) issues.push("receipt_expires_at_invalid");
  if (evaluationClock === null) issues.push("receipt_evaluation_clock_invalid");
  if ([issuedAt, expiresAt, evaluationClock].every((instant) => instant !== null)) {
    const policy = context.upstream.selectionPacket.contracts.decision;
    const skew = policy.allowedClockSkewSeconds * 1000;
    const lifetime = policy.maximumDecisionLifetimeSeconds * 1000;
    if (issuedAt >= expiresAt) issues.push("receipt_timestamp_inversion");
    if (issuedAt > evaluationClock + skew) issues.push("receipt_future_dated");
    if (evaluationClock >= expiresAt) issues.push("receipt_expired");
    if (expiresAt - issuedAt > lifetime) issues.push("receipt_lifetime_excessive");
  }
  const reviewRequired = issues.length > 0;
  if (reviewRequired && value.manualReviewRequired !== true) {
    issues.push("receipt_manual_review_required");
  }
  if (!reviewRequired && value.manualReviewRequired !== false) {
    issues.push("receipt_manual_review_unexpected");
  }
  return uniqueSorted(issues);
}

function validateRequestContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, ["decisionContext", "priorRequestNonceHashes"])) {
    return ["request_context_fields_invalid"];
  }
  return uniqueSorted([
    ...validateDecisionContext(context.decisionContext),
    ...validateHashArray(context.priorRequestNonceHashes, "prior_request_nonce_hashes"),
  ]);
}

function buildSyntheticProvisioningRequestFixture(receipt, context) {
  const binding = buildStepIBindings(context.decisionContext.upstream);
  return sealContract({
    contractVersion: VERSIONS.request,
    decisionReceiptId: receipt.decisionReceiptId,
    decisionReceiptHash: receipt.decisionReceiptHash,
    selectedCandidateClass: receipt.selectedCandidateClasses[0],
    stepIProvisioningRunbookId: binding.provisioningRunbookId,
    stepIProvisioningRunbookHash: binding.provisioningRunbookHash,
    operationSequence: binding.operationSequence,
    requiredEvidenceCategories: [...REQUIRED_EVIDENCE_CATEGORIES],
    forbiddenMaterialCategories: [...FORBIDDEN_MATERIAL_CATEGORIES],
    expiresAt: receipt.expiresAt,
    requestNonceHash: "4".repeat(64),
    externalOperatorOnlyAttestationHash: "5".repeat(64),
    externalOperatorOnly: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    providerSpecificMaterialPresent: false,
    requestAuthorizesExecution: false,
    ...Object.fromEntries(AUTHORITY_FALSE_FIELDS.map((field) => [field, false])),
  }, "request");
}

function validateProvisioningRequest(value, receipt, context, evaluationClockInstant) {
  const contextIssues = validateRequestContext(context);
  const receiptIssues = isRecord(context) && isRecord(context.decisionContext)
    ? validateOperatorDecisionReceipt(receipt, context.decisionContext, evaluationClockInstant)
    : ["request_receipt_context_invalid"];
  const issues = [...validateEnvelope(value, "request"), ...contextIssues, ...receiptIssues];
  if (!isRecord(value) || !isRecord(receipt) || !isRecord(context) ||
      !isRecord(context.decisionContext) || !Array.isArray(context.priorRequestNonceHashes) ||
      contextIssues.length > 0 || receiptIssues.length > 0) return uniqueSorted(issues);
  const binding = buildStepIBindings(context.decisionContext.upstream);
  if (value.decisionReceiptId !== receipt.decisionReceiptId ||
      value.decisionReceiptHash !== receipt.decisionReceiptHash) {
    issues.push("request_receipt_binding_mismatch");
  }
  if (value.selectedCandidateClass !== receipt.selectedCandidateClasses[0]) {
    issues.push("request_selected_candidate_binding_mismatch");
  }
  if (value.stepIProvisioningRunbookId !== binding.provisioningRunbookId ||
      value.stepIProvisioningRunbookHash !== binding.provisioningRunbookHash) {
    issues.push("request_runbook_binding_mismatch");
  }
  if (!canonicalEqual(value.operationSequence, binding.operationSequence)) {
    issues.push("request_operation_sequence_invalid");
  }
  if (!canonicalEqual(value.requiredEvidenceCategories, REQUIRED_EVIDENCE_CATEGORIES) ||
      !canonicalEqual(value.forbiddenMaterialCategories, FORBIDDEN_MATERIAL_CATEGORIES)) {
    issues.push("request_material_category_scope_invalid");
  }
  if (!isSha256(value.requestNonceHash)) issues.push("request_nonce_hash_invalid");
  if (!isSha256(value.externalOperatorOnlyAttestationHash)) {
    issues.push("request_external_operator_attestation_hash_invalid");
  }
  if (isSha256(value.requestNonceHash) &&
      context.priorRequestNonceHashes.includes(value.requestNonceHash)) {
    issues.push("request_nonce_replay_manual_review");
  }
  if (value.externalOperatorOnly !== true || value.syntheticValidationOnly !== true ||
      value.rawMaterialPresent !== false || value.providerSpecificMaterialPresent !== false ||
      value.requestAuthorizesExecution !== false) {
    issues.push("request_non_authorizing_boundary_invalid");
  }
  for (const field of AUTHORITY_FALSE_FIELDS) {
    if (value[field] !== false) issues.push(`request_authority_must_be_false:${field}`);
  }
  const expiresAt = parseCanonicalInstant(value.expiresAt);
  const receiptExpiresAt = parseCanonicalInstant(receipt.expiresAt);
  const evaluationClock = parseCanonicalInstant(evaluationClockInstant);
  if (expiresAt === null) issues.push("request_expires_at_invalid");
  if ([expiresAt, receiptExpiresAt, evaluationClock].every((instant) => instant !== null)) {
    if (expiresAt > receiptExpiresAt) issues.push("request_outlives_receipt");
    if (evaluationClock >= expiresAt) issues.push("request_expired");
  }
  return uniqueSorted(issues);
}

function buildPreparationSummary(receipt, request, upstream) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    decisionReceiptId: receipt.decisionReceiptId,
    decisionReceiptHash: receipt.decisionReceiptHash,
    provisioningRequestId: request.provisioningRequestId,
    provisioningRequestHash: request.provisioningRequestHash,
    stepISelectionSummaryId: upstream.selectionSummary.selectionSummaryId,
    stepISelectionSummaryHash: upstream.selectionSummary.selectionSummaryHash,
    publicState: "operator_environment_class_decision_validated",
    receiptValidated: true,
    provisioningRequestPrepared: true,
    syntheticValidationOnly: true,
    rawMaterialPresent: false,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}

function validatePreparationSummary(value, receipt, request, upstream) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildPreparationSummary(receipt, request, upstream); } catch {
    return uniqueSorted([...issues, "summary_expected_construction_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if (field === "preparationSummaryId" || field === "preparationSummaryHash") continue;
    if (!canonicalEqual(value?.[field], expected[field])) issues.push(`summary_field_invalid:${field}`);
  }
  return uniqueSorted(issues);
}

function buildValidSyntheticPacket() {
  const decisionContext = { upstream: buildUpstream(), priorDecisionNonceHashes: [] };
  const receipt = buildSyntheticDecisionReceiptFixture(decisionContext);
  const requestContext = { decisionContext, priorRequestNonceHashes: [] };
  return {
    decisionContext,
    receipt,
    requestContext,
    request: buildSyntheticProvisioningRequestFixture(receipt, requestContext),
    evaluationClockInstant: "2026-07-18T00:02:00.000Z",
  };
}

function safeResult(status, summary = {}, issues = []) {
  const validated = status === "operator_environment_class_decision_validated";
  return {
    ok: validated,
    status,
    contractVersion: VERSIONS.summary,
    receiptValidated: validated,
    provisioningRequestPrepared: validated,
    preparationSummary: validated ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: validated ? [
      "synthetic_validation_does_not_record_a_real_decision_or_authorize_provisioning",
    ] : [],
  };
}

function evaluateOperatorEnvironmentClassDecision(packet) {
  if (packet === undefined || packet === null) {
    return safeResult("awaiting_operator_environment_class_decision");
  }
  if (!isRecord(packet) || !hasExactKeys(packet, [
    "decisionContext", "receipt", "requestContext", "request", "evaluationClockInstant",
  ])) return safeResult("blocked", {}, ["decision_packet_fields_invalid"]);
  try {
    const issues = [
      ...validateOperatorDecisionReceipt(
        packet.receipt, packet.decisionContext, packet.evaluationClockInstant,
      ),
      ...validateProvisioningRequest(
        packet.request, packet.receipt, packet.requestContext, packet.evaluationClockInstant,
      ),
    ];
    if (issues.length > 0) return safeResult("blocked", {}, issues);
    const summary = buildPreparationSummary(
      packet.receipt, packet.request, packet.decisionContext.upstream,
    );
    issues.push(...validatePreparationSummary(
      summary, packet.receipt, packet.request, packet.decisionContext.upstream,
    ));
    canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, issues)
      : safeResult("operator_environment_class_decision_validated", summary);
  } catch {
    return safeResult("blocked", {}, ["operator_environment_class_decision_validation_failed"]);
  }
}

module.exports = {
  AUTHORITY_FALSE_FIELDS,
  FIELD_SETS,
  FIXED_FALSE_FIELDS,
  FORBIDDEN_MATERIAL_CATEGORIES,
  PUBLIC_STATES,
  REQUIRED_EVIDENCE_CATEGORIES,
  SPECS,
  VERSIONS,
  buildPreparationSummary,
  buildStepIBindings,
  buildSyntheticDecisionReceiptFixture,
  buildSyntheticProvisioningRequestFixture,
  buildUpstream,
  buildValidSyntheticPacket,
  evaluateOperatorEnvironmentClassDecision,
  safeResult,
  sealContract,
  validateDecisionContext,
  validateOperatorDecisionReceipt,
  validatePreparationSummary,
  validateProvisioningRequest,
  validateRequestContext,
  validateUpstream,
};
