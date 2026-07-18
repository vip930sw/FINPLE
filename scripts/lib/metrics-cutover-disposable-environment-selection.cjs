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
const stepH = require("./metrics-cutover-operator-observation-run-package.cjs");

const VERSIONS = Object.freeze({
  criteria: "metrics-cutover-disposable-environment-selection-criteria-v1-step114-2x-i",
  matrix: "metrics-cutover-disposable-environment-candidate-matrix-v1-step114-2x-i",
  decision: "metrics-cutover-disposable-environment-selection-decision-v1-step114-2x-i",
  runbook: "metrics-cutover-disposable-environment-provisioning-runbook-v1-step114-2x-i",
  futureDecision: "metrics-cutover-disposable-environment-future-decision-v1-step114-2x-i",
  summary: "metrics-cutover-disposable-environment-selection-summary-v1-step114-2x-i",
});

const CANDIDATE_CLASSES = Object.freeze([
  "isolated_managed_postgresql_project",
  "isolated_managed_postgresql_service",
  "local_ephemeral_container_postgresql",
]);

const CRITERIA = Object.freeze([
  ["production_and_application_data_isolation", 14],
  ["new_or_empty_disposable_namespace_proof", 10],
  ["credential_category_separation", 9],
  ["network_and_transport_observation_capability", 7],
  ["deterministic_postgresql_capability", 9],
  ["one_destination_enforcement", 7],
  ["exact_15_scenario_reproducibility", 10],
  ["credential_expiry_and_revocation_support", 7],
  ["sanitized_evidence_auditability", 7],
  ["environment_disposal_certainty", 8],
  ["operator_simplicity", 4],
  ["bounded_cost_exposure_category", 3],
  ["low_local_machine_dependency", 2],
  ["small_failure_blast_radius", 3],
].map(([criterion, weight]) => Object.freeze({
  criterion, weight, minimumScore: 0, maximumScore: 5,
})));

const REFERENCE_SCORES = Object.freeze([
  ["isolated_managed_postgresql_project", [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 3, 3, 5, 5]],
  ["isolated_managed_postgresql_service", [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 3, 5, 5]],
  ["local_ephemeral_container_postgresql", [5, 5, 4, 3, 5, 5, 4, 3, 4, 5, 4, 5, 1, 5]],
].map(([candidateClass, scores]) => Object.freeze({ candidateClass, scores: Object.freeze(scores) })));

const RUNBOOK_SEQUENCE = Object.freeze([
  "confirm_selected_environment_class",
  "create_new_disposable_environment_outside_source_control",
  "verify_no_finple_application_binding",
  "configure_exactly_one_observation_destination",
  "create_new_empty_or_approved_disposable_namespace",
  "provision_distinct_migration_and_runtime_credentials",
  "verify_runtime_denied_privileges",
  "set_expiry_rotation_revocation_and_destruction_controls",
  "assign_environment_disposal_responsibility_and_deadline",
  "produce_sanitized_intake_hashes_offline",
  "request_separate_live_observation_approval",
]);

const FORBIDDEN_MATERIAL_CATEGORIES = Object.freeze([
  "provider_identity", "endpoint", "port", "connection_string", "database_identity",
  "schema_or_table_identity", "credential", "certificate", "project_or_account_identity",
  "secret_reference", "operator_identity", "filesystem_path", "screen_capture", "sql_text",
]);

const FIXED_FALSE_FIELDS = Object.freeze([...new Set([
  ...stepH.FIXED_FALSE_FIELDS,
  "selectionDecisionRecorded", "humanSelectionRecorded",
  "realEnvironmentClassSelected", "realEnvironmentProvisioned", "realTargetSelected",
  "provisioningRunbookActivated",
])]);

const SPECS = Object.freeze({
  criteria: Object.freeze({
    version: VERSIONS.criteria, idField: "selectionCriteriaId",
    hashField: "selectionCriteriaHash", prefix: "metrics-cutover-disposable-environment-selection-criteria",
    idDomain: "FINPLE_STEP114_2X_I_CRITERIA_ID\0", hashDomain: "FINPLE_STEP114_2X_I_CRITERIA_HASH\0",
  }),
  matrix: Object.freeze({
    version: VERSIONS.matrix, idField: "candidateMatrixId",
    hashField: "candidateMatrixHash", prefix: "metrics-cutover-disposable-environment-candidate-matrix",
    idDomain: "FINPLE_STEP114_2X_I_MATRIX_ID\0", hashDomain: "FINPLE_STEP114_2X_I_MATRIX_HASH\0",
  }),
  decision: Object.freeze({
    version: VERSIONS.decision, idField: "selectionDecisionPolicyId",
    hashField: "selectionDecisionPolicyHash", prefix: "metrics-cutover-disposable-environment-selection-decision",
    idDomain: "FINPLE_STEP114_2X_I_DECISION_ID\0", hashDomain: "FINPLE_STEP114_2X_I_DECISION_HASH\0",
  }),
  runbook: Object.freeze({
    version: VERSIONS.runbook, idField: "provisioningRunbookId",
    hashField: "provisioningRunbookHash", prefix: "metrics-cutover-disposable-environment-provisioning-runbook",
    idDomain: "FINPLE_STEP114_2X_I_RUNBOOK_ID\0", hashDomain: "FINPLE_STEP114_2X_I_RUNBOOK_HASH\0",
  }),
  futureDecision: Object.freeze({
    version: VERSIONS.futureDecision, idField: "futureDecisionId",
    hashField: "futureDecisionHash", prefix: "metrics-cutover-disposable-environment-future-decision",
    idDomain: "FINPLE_STEP114_2X_I_FUTURE_DECISION_ID\0", hashDomain: "FINPLE_STEP114_2X_I_FUTURE_DECISION_HASH\0",
  }),
  summary: Object.freeze({
    version: VERSIONS.summary, idField: "selectionSummaryId",
    hashField: "selectionSummaryHash", prefix: "metrics-cutover-disposable-environment-selection-summary",
    idDomain: "FINPLE_STEP114_2X_I_SUMMARY_ID\0", hashDomain: "FINPLE_STEP114_2X_I_SUMMARY_HASH\0",
  }),
});

const CRITERIA_FIELDS = Object.freeze([
  "contractVersion", "selectionCriteriaId", "upstreamBindings", "criteria",
  "scoreType", "minimumScore", "maximumScore", "weightTotal",
  "allCriteriaRequired", "incompleteEvidencePolicy", "selectionCriteriaHash",
]);
const MATRIX_FIELDS = Object.freeze([
  "contractVersion", "candidateMatrixId", "upstreamBindings",
  "selectionCriteriaId", "selectionCriteriaHash", "candidateClasses",
  "candidateScores", "candidateTotals", "deterministicRanking",
  "rankingDirection", "tiePolicy", "evidenceScope", "liveResearchPerformed",
  "livePricingLookupPerformed", "providerSpecificClaimsPresent", "candidateMatrixHash",
]);
const RUNBOOK_FIELDS = Object.freeze([
  "contractVersion", "provisioningRunbookId", "upstreamBindings", "operationSequence",
  "forbiddenMaterialCategories", "externalOperatorOnly", "automaticProvisioningAllowed",
  "automaticSelectionAllowed", "automaticCleanupAllowed", "automaticRetryAllowed",
  "automaticDisposalAllowed", "applicationCredentialReuseAllowed",
  "migrationCredentialReuseForObservationAllowed", "liveObservationAllowed",
  "connectionAllowed", "runbookActivated", "provisioningRunbookHash",
]);
const DECISION_FIELDS = Object.freeze([
  "contractVersion", "selectionDecisionPolicyId", "upstreamBindings",
  "selectionCriteriaId", "selectionCriteriaHash", "candidateMatrixId", "candidateMatrixHash",
  "provisioningRunbookId", "provisioningRunbookHash", "futureDecisionContractVersion",
  "exactSelectedCandidateCount", "highestRankedCandidateRequired", "unresolvedTieAllowed",
  "selectionRationaleHashRequired", "operatorDecisionAttestationHashRequired",
  "decisionNonceHashRequired", "maximumDecisionLifetimeSeconds", "allowedClockSkewSeconds",
  "priorNonceContextPolicy", "ambiguityPolicy", "rawMaterialAllowed",
  "decisionRecorded", "humanSelectionRecorded", "realEnvironmentClassSelected",
  "selectionDecisionPolicyHash",
]);
const FUTURE_DECISION_FIELDS = Object.freeze([
  "contractVersion", "futureDecisionId", "selectionSummaryId", "selectionSummaryHash",
  "selectionDecisionPolicyId", "selectionDecisionPolicyHash",
  "selectionCriteriaId", "selectionCriteriaHash", "candidateMatrixId", "candidateMatrixHash",
  "provisioningRunbookId", "provisioningRunbookHash", "candidateClasses",
  "criteriaOrder", "criterionWeights", "candidateTotals", "deterministicRanking",
  "selectedCandidateClasses", "selectionRationaleHash", "operatorDecisionAttestationHash",
  "decisionNonceHash", "issuedAt", "expiresAt", "unresolvedTie",
  "syntheticFutureValidationOnly", "realSelectionRecorded", "manualReviewRequired",
  "rawMaterialPresent", "futureDecisionHash",
]);
const SUMMARY_FIELDS = Object.freeze([
  "contractVersion", "selectionSummaryId", "upstreamBindings",
  "selectionCriteriaId", "selectionCriteriaHash", "candidateMatrixId", "candidateMatrixHash",
  "selectionDecisionPolicyId", "selectionDecisionPolicyHash",
  "provisioningRunbookId", "provisioningRunbookHash", "futureDecisionContractVersion",
  "candidateClassCount", "criterionCount", "runbookStepCount", "packagePrepared",
  "candidateMatrixValidated", "weightedDecisionPolicyValidated", "runbookValidated",
  ...FIXED_FALSE_FIELDS, "selectionSummaryHash",
]);

const FIELD_SETS = Object.freeze({
  criteria: CRITERIA_FIELDS, matrix: MATRIX_FIELDS, decision: DECISION_FIELDS,
  runbook: RUNBOOK_FIELDS, futureDecision: FUTURE_DECISION_FIELDS, summary: SUMMARY_FIELDS,
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
  if (!isRecord(value) || !hasExactKeys(value, FIELD_SETS[name])) return [`${name}_fields_invalid`];
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

function buildUpstream() {
  const operatorObservationPacket = stepH.buildValidPreparationPacket();
  return {
    operatorObservationPacket,
    operatorObservationSummary: stepH.buildRunPackageSummary(
      operatorObservationPacket.upstream, operatorObservationPacket.contracts,
    ),
  };
}

function buildUpstreamBindings(upstream) {
  const packet = upstream.operatorObservationPacket;
  const summary = upstream.operatorObservationSummary;
  return {
    runPackageSummaryId: summary.runPackageSummaryId,
    runPackageSummaryHash: summary.runPackageSummaryHash,
    readinessChecklistId: packet.contracts.readiness.readinessChecklistId,
    readinessChecklistHash: packet.contracts.readiness.readinessChecklistHash,
    sanitizedEnvironmentIntakeSchemaId: packet.contracts.intake.sanitizedEnvironmentIntakeSchemaId,
    sanitizedEnvironmentIntakeSchemaHash: packet.contracts.intake.sanitizedEnvironmentIntakeSchemaHash,
    approvalRequestPolicyId: packet.contracts.approval.approvalRequestPolicyId,
    approvalRequestPolicyHash: packet.contracts.approval.approvalRequestPolicyHash,
    credentialProvisioningBoundaryId: packet.contracts.credential.credentialProvisioningBoundaryId,
    credentialProvisioningBoundaryHash: packet.contracts.credential.credentialProvisioningBoundaryHash,
    disposalResponsibilityPolicyId: packet.contracts.disposal.disposalResponsibilityPolicyId,
    disposalResponsibilityPolicyHash: packet.contracts.disposal.disposalResponsibilityPolicyHash,
    requestedObservationOperations: [...stepH.REQUESTED_OPERATION_SET],
    transitiveExecutionPlanBindings: stepH.buildUpstreamBindings(packet.upstream),
  };
}

function validateUpstream(upstream) {
  if (!isRecord(upstream) || !hasExactKeys(upstream, [
    "operatorObservationPacket", "operatorObservationSummary",
  ])) return ["upstream_fields_invalid"];
  const packet = upstream.operatorObservationPacket;
  if (!isRecord(packet) || !hasExactKeys(packet, ["upstream", "contracts"]) ||
      !isRecord(packet.contracts) || !hasExactKeys(packet.contracts, [
        "readiness", "intake", "credential", "disposal", "approval",
      ])) return ["step_h_packet_fields_invalid"];
  const issues = [...stepH.validateUpstream(packet.upstream)];
  for (const name of ["readiness", "intake", "credential", "disposal", "approval"]) {
    issues.push(...stepH.validateContract(packet.contracts[name], name, packet.upstream, packet.contracts));
  }
  issues.push(...stepH.validateRunPackageSummary(
    upstream.operatorObservationSummary, packet.upstream, packet.contracts,
  ));
  let expectedSummary;
  try { expectedSummary = stepH.buildRunPackageSummary(packet.upstream, packet.contracts); } catch {}
  if (!expectedSummary || !canonicalEqual(upstream.operatorObservationSummary, expectedSummary)) {
    issues.push("step_h_summary_binding_mismatch");
  }
  if (!canonicalEqual(packet.contracts.approval.requestedOperationSet, stepH.REQUESTED_OPERATION_SET)) {
    issues.push("step_h_requested_operation_order_mismatch");
  }
  const transitive = stepH.buildUpstreamBindings(packet.upstream);
  if (transitive.exactScenarioCount !== 15 || transitive.scenarioOrder.length !== 15 ||
      transitive.executionSequence.length !== 12) {
    issues.push("step_h_transitive_execution_scope_invalid");
  }
  return uniqueSorted(issues);
}

function weightedTotal(scores) {
  return scores.reduce((total, score, index) => total + score * CRITERIA[index].weight, 0);
}

function referenceCandidateScores() {
  return REFERENCE_SCORES.map(({ candidateClass, scores }) => ({
    candidateClass,
    scores: scores.map((score, index) => ({ criterion: CRITERIA[index].criterion, score })),
    weightedTotal: weightedTotal(scores),
  }));
}

function referenceCandidateTotals() {
  return referenceCandidateScores().map(({ candidateClass, weightedTotal: total }) => ({
    candidateClass, weightedTotal: total,
  }));
}

function referenceRanking() {
  return referenceCandidateTotals()
    .sort((left, right) => right.weightedTotal - left.weightedTotal ||
      left.candidateClass.localeCompare(right.candidateClass))
    .map(({ candidateClass }) => candidateClass);
}

function buildCriteria(upstream) {
  return sealContract({
    contractVersion: VERSIONS.criteria,
    upstreamBindings: buildUpstreamBindings(upstream),
    criteria: CRITERIA.map((value) => ({ ...value })),
    scoreType: "bounded_integer", minimumScore: 0, maximumScore: 5,
    weightTotal: 100, allCriteriaRequired: true,
    incompleteEvidencePolicy: "manual_review_fail_closed",
  }, "criteria");
}

function buildCandidateMatrix(upstream, criteria) {
  return sealContract({
    contractVersion: VERSIONS.matrix,
    upstreamBindings: buildUpstreamBindings(upstream),
    selectionCriteriaId: criteria.selectionCriteriaId,
    selectionCriteriaHash: criteria.selectionCriteriaHash,
    candidateClasses: [...CANDIDATE_CLASSES],
    candidateScores: referenceCandidateScores(),
    candidateTotals: referenceCandidateTotals(),
    deterministicRanking: referenceRanking(),
    rankingDirection: "highest_weighted_total_first",
    tiePolicy: "unresolved_tie_manual_review_fail_closed",
    evidenceScope: "synthetic_reference_only",
    liveResearchPerformed: false,
    livePricingLookupPerformed: false,
    providerSpecificClaimsPresent: false,
  }, "matrix");
}

function buildRunbook(upstream) {
  return sealContract({
    contractVersion: VERSIONS.runbook,
    upstreamBindings: buildUpstreamBindings(upstream),
    operationSequence: [...RUNBOOK_SEQUENCE],
    forbiddenMaterialCategories: [...FORBIDDEN_MATERIAL_CATEGORIES],
    externalOperatorOnly: true,
    automaticProvisioningAllowed: false, automaticSelectionAllowed: false,
    automaticCleanupAllowed: false, automaticRetryAllowed: false,
    automaticDisposalAllowed: false, applicationCredentialReuseAllowed: false,
    migrationCredentialReuseForObservationAllowed: false,
    liveObservationAllowed: false, connectionAllowed: false, runbookActivated: false,
  }, "runbook");
}

function buildDecisionPolicy(upstream, criteria, matrix, runbook) {
  return sealContract({
    contractVersion: VERSIONS.decision,
    upstreamBindings: buildUpstreamBindings(upstream),
    selectionCriteriaId: criteria.selectionCriteriaId,
    selectionCriteriaHash: criteria.selectionCriteriaHash,
    candidateMatrixId: matrix.candidateMatrixId,
    candidateMatrixHash: matrix.candidateMatrixHash,
    provisioningRunbookId: runbook.provisioningRunbookId,
    provisioningRunbookHash: runbook.provisioningRunbookHash,
    futureDecisionContractVersion: VERSIONS.futureDecision,
    exactSelectedCandidateCount: 1, highestRankedCandidateRequired: true,
    unresolvedTieAllowed: false, selectionRationaleHashRequired: true,
    operatorDecisionAttestationHashRequired: true, decisionNonceHashRequired: true,
    maximumDecisionLifetimeSeconds: 600, allowedClockSkewSeconds: 30,
    priorNonceContextPolicy: "strict_sorted_unique_sha256",
    ambiguityPolicy: "manual_review_fail_closed", rawMaterialAllowed: false,
    decisionRecorded: false, humanSelectionRecorded: false,
    realEnvironmentClassSelected: false,
  }, "decision");
}

function buildContracts(upstream) {
  const criteria = buildCriteria(upstream);
  const matrix = buildCandidateMatrix(upstream, criteria);
  const runbook = buildRunbook(upstream);
  return { criteria, matrix, runbook, decision: buildDecisionPolicy(upstream, criteria, matrix, runbook) };
}

function expectedContract(name, upstream, contracts) {
  if (name === "criteria") return buildCriteria(upstream);
  if (name === "matrix") return buildCandidateMatrix(upstream, contracts.criteria);
  if (name === "runbook") return buildRunbook(upstream);
  return buildDecisionPolicy(upstream, contracts.criteria, contracts.matrix, contracts.runbook);
}

function validateContract(value, name, upstream, contracts) {
  const issues = [...validateEnvelope(value, name)];
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

function buildSelectionSummary(upstream, contracts) {
  return sealContract({
    contractVersion: VERSIONS.summary,
    upstreamBindings: buildUpstreamBindings(upstream),
    selectionCriteriaId: contracts.criteria.selectionCriteriaId,
    selectionCriteriaHash: contracts.criteria.selectionCriteriaHash,
    candidateMatrixId: contracts.matrix.candidateMatrixId,
    candidateMatrixHash: contracts.matrix.candidateMatrixHash,
    selectionDecisionPolicyId: contracts.decision.selectionDecisionPolicyId,
    selectionDecisionPolicyHash: contracts.decision.selectionDecisionPolicyHash,
    provisioningRunbookId: contracts.runbook.provisioningRunbookId,
    provisioningRunbookHash: contracts.runbook.provisioningRunbookHash,
    futureDecisionContractVersion: VERSIONS.futureDecision,
    candidateClassCount: CANDIDATE_CLASSES.length,
    criterionCount: CRITERIA.length,
    runbookStepCount: RUNBOOK_SEQUENCE.length,
    packagePrepared: true, candidateMatrixValidated: true,
    weightedDecisionPolicyValidated: true, runbookValidated: true,
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
  }, "summary");
}

function validateSelectionSummary(value, upstream, contracts) {
  const issues = [...validateEnvelope(value, "summary")];
  let expected;
  try { expected = buildSelectionSummary(upstream, contracts); } catch {
    return uniqueSorted([...issues, "selection_summary_expected_failed"]);
  }
  for (const field of SUMMARY_FIELDS) {
    if (field === "selectionSummaryId" || field === "selectionSummaryHash") continue;
    if (!canonicalEqual(value?.[field], expected[field])) {
      issues.push(`selection_summary_field_invalid:${field}`);
    }
  }
  return uniqueSorted(issues);
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

function validateDecisionContext(context) {
  if (!isRecord(context) || !hasExactKeys(context, [
    "upstream", "contracts", "selectionSummary", "priorDecisionNonceHashes",
  ])) return ["decision_context_fields_invalid"];
  const issues = [...validateUpstream(context.upstream)];
  if (!isRecord(context.contracts) || !hasExactKeys(context.contracts, [
    "criteria", "matrix", "runbook", "decision",
  ])) issues.push("decision_context_contracts_fields_invalid");
  for (const name of ["criteria", "matrix", "runbook", "decision"]) {
    issues.push(...validateContract(context.contracts?.[name], name, context.upstream, context.contracts));
  }
  issues.push(...validateSelectionSummary(context.selectionSummary, context.upstream, context.contracts));
  issues.push(...validateHashArray(context.priorDecisionNonceHashes, "prior_decision_nonce_hashes"));
  return uniqueSorted(issues);
}

function validateFutureSelectionDecision(value, context, evaluationClockInstant) {
  const contextIssues = validateDecisionContext(context);
  const issues = [...validateEnvelope(value, "futureDecision"), ...contextIssues];
  if (!isRecord(value) || !isRecord(context) || !isRecord(context.contracts) ||
      !isRecord(context.selectionSummary) || !Array.isArray(context.priorDecisionNonceHashes)) {
    return uniqueSorted(issues);
  }
  if (contextIssues.length > 0) return uniqueSorted(issues);
  const { criteria, matrix, runbook, decision } = context.contracts;
  const summary = context.selectionSummary;
  for (const field of ["selectionSummaryId", "selectionSummaryHash"]) {
    if (value[field] !== summary[field]) issues.push(`future_decision_summary_binding_mismatch:${field}`);
  }
  for (const [contract, idField, hashField] of [
    [decision, "selectionDecisionPolicyId", "selectionDecisionPolicyHash"],
    [criteria, "selectionCriteriaId", "selectionCriteriaHash"],
    [matrix, "candidateMatrixId", "candidateMatrixHash"],
    [runbook, "provisioningRunbookId", "provisioningRunbookHash"],
  ]) {
    if (value[idField] !== contract[idField] || value[hashField] !== contract[hashField]) {
      issues.push(`future_decision_contract_binding_mismatch:${idField}`);
    }
  }
  const criteriaOrder = criteria.criteria.map(({ criterion }) => criterion);
  const criterionWeights = criteria.criteria.map(({ criterion, weight }) => ({ criterion, weight }));
  if (!canonicalEqual(value.candidateClasses, matrix.candidateClasses) ||
      !canonicalEqual(value.criteriaOrder, criteriaOrder) ||
      !canonicalEqual(value.criterionWeights, criterionWeights)) {
    issues.push("future_decision_matrix_scope_invalid");
  }
  if (!canonicalEqual(value.candidateTotals, matrix.candidateTotals) ||
      !canonicalEqual(value.deterministicRanking, matrix.deterministicRanking)) {
    issues.push("future_decision_total_or_ranking_invalid");
  }
  const totals = matrix.candidateTotals.map(({ weightedTotal: total }) => total);
  if (new Set(totals).size !== totals.length || value.unresolvedTie !== false) {
    issues.push("future_decision_unresolved_tie_manual_review");
  }
  if (!Array.isArray(value.selectedCandidateClasses) || value.selectedCandidateClasses.length !== 1 ||
      value.selectedCandidateClasses[0] !== matrix.deterministicRanking[0] ||
      !CANDIDATE_CLASSES.includes(value.selectedCandidateClasses[0])) {
    issues.push("future_decision_selection_invalid");
  }
  for (const field of [
    "selectionRationaleHash", "operatorDecisionAttestationHash", "decisionNonceHash",
  ]) {
    if (!isSha256(value[field])) issues.push(`future_decision_hash_invalid:${field}`);
  }
  if (isSha256(value.decisionNonceHash) &&
      context.priorDecisionNonceHashes.includes(value.decisionNonceHash)) {
    issues.push("future_decision_nonce_replay_manual_review");
  }
  if (value.syntheticFutureValidationOnly !== true || value.realSelectionRecorded !== false ||
      value.rawMaterialPresent !== false) {
    issues.push("future_decision_real_or_raw_material_boundary_invalid");
  }
  const issuedAt = parseCanonicalInstant(value.issuedAt);
  const expiresAt = parseCanonicalInstant(value.expiresAt);
  const evaluationClock = parseCanonicalInstant(evaluationClockInstant);
  if (issuedAt === null) issues.push("future_decision_issued_at_invalid");
  if (expiresAt === null) issues.push("future_decision_expires_at_invalid");
  if (evaluationClock === null) issues.push("future_decision_evaluation_clock_invalid");
  if ([issuedAt, expiresAt, evaluationClock].every((instant) => instant !== null)) {
    const skew = decision.allowedClockSkewSeconds * 1000;
    const maximumLifetime = decision.maximumDecisionLifetimeSeconds * 1000;
    if (issuedAt >= expiresAt) issues.push("future_decision_timestamp_inversion");
    if (issuedAt > evaluationClock + skew) issues.push("future_decision_future_dated");
    if (evaluationClock >= expiresAt) issues.push("future_decision_expired");
    if (expiresAt - issuedAt > maximumLifetime) issues.push("future_decision_lifetime_excessive");
  }
  const reviewRequired = issues.length > 0;
  if (reviewRequired && value.manualReviewRequired !== true) {
    issues.push("future_decision_manual_review_required");
  }
  if (!reviewRequired && value.manualReviewRequired !== false) {
    issues.push("future_decision_manual_review_unexpected");
  }
  return uniqueSorted(issues);
}

function buildSyntheticFutureDecisionFixture(context) {
  const { criteria, matrix, runbook, decision } = context.contracts;
  const summary = context.selectionSummary;
  return sealContract({
    contractVersion: VERSIONS.futureDecision,
    selectionSummaryId: summary.selectionSummaryId,
    selectionSummaryHash: summary.selectionSummaryHash,
    selectionDecisionPolicyId: decision.selectionDecisionPolicyId,
    selectionDecisionPolicyHash: decision.selectionDecisionPolicyHash,
    selectionCriteriaId: criteria.selectionCriteriaId,
    selectionCriteriaHash: criteria.selectionCriteriaHash,
    candidateMatrixId: matrix.candidateMatrixId,
    candidateMatrixHash: matrix.candidateMatrixHash,
    provisioningRunbookId: runbook.provisioningRunbookId,
    provisioningRunbookHash: runbook.provisioningRunbookHash,
    candidateClasses: [...matrix.candidateClasses],
    criteriaOrder: criteria.criteria.map(({ criterion }) => criterion),
    criterionWeights: criteria.criteria.map(({ criterion, weight }) => ({ criterion, weight })),
    candidateTotals: matrix.candidateTotals.map((value) => ({ ...value })),
    deterministicRanking: [...matrix.deterministicRanking],
    selectedCandidateClasses: [matrix.deterministicRanking[0]],
    selectionRationaleHash: "1".repeat(64),
    operatorDecisionAttestationHash: "2".repeat(64),
    decisionNonceHash: "3".repeat(64),
    issuedAt: "2026-07-18T00:01:00.000Z",
    expiresAt: "2026-07-18T00:06:00.000Z",
    unresolvedTie: false, syntheticFutureValidationOnly: true,
    realSelectionRecorded: false, manualReviewRequired: false, rawMaterialPresent: false,
  }, "futureDecision");
}

function buildValidPreparationPacket() {
  const upstream = buildUpstream();
  return { upstream, contracts: buildContracts(upstream) };
}

function safeResult(status, summary = {}, issues = []) {
  const ready = status === "disposable_environment_selection_package_prepared";
  return {
    ok: ready, status, contractVersion: VERSIONS.summary,
    packagePrepared: ready, upstreamValidated: ready,
    candidateMatrixValidated: ready, weightedDecisionPolicyValidated: ready,
    provisioningRunbookValidated: ready,
    selectionSummary: ready ? summary : {},
    ...Object.fromEntries(FIXED_FALSE_FIELDS.map((field) => [field, false])),
    blockingIssues: uniqueSorted(issues),
    warningIssues: ready ? [
      "package_prepared_is_not_real_environment_selection_provisioning_or_execution_authority",
    ] : [],
  };
}

function evaluateDisposableEnvironmentSelectionPackage(packet) {
  if (packet === undefined || packet === null) return safeResult("idle");
  if (!isRecord(packet) || !hasExactKeys(packet, ["upstream", "contracts"]) ||
      !isRecord(packet.contracts) || !hasExactKeys(packet.contracts, [
        "criteria", "matrix", "runbook", "decision",
      ])) return safeResult("blocked", {}, ["selection_packet_fields_invalid"]);
  const issues = [...validateUpstream(packet.upstream)];
  for (const name of ["criteria", "matrix", "runbook", "decision"]) {
    issues.push(...validateContract(packet.contracts[name], name, packet.upstream, packet.contracts));
  }
  if (issues.length > 0) return safeResult("blocked", {}, issues);
  try {
    const summary = buildSelectionSummary(packet.upstream, packet.contracts);
    issues.push(...validateSelectionSummary(summary, packet.upstream, packet.contracts));
    canonicalJson(summary);
    return issues.length > 0 ? safeResult("blocked", {}, issues)
      : safeResult("disposable_environment_selection_package_prepared", summary);
  } catch {
    return safeResult("blocked", {}, ["selection_summary_construction_failed"]);
  }
}

module.exports = {
  CANDIDATE_CLASSES, CRITERIA, FIELD_SETS, FIXED_FALSE_FIELDS,
  FORBIDDEN_MATERIAL_CATEGORIES, REFERENCE_SCORES, RUNBOOK_SEQUENCE, SPECS, VERSIONS,
  buildCandidateMatrix, buildContracts, buildCriteria, buildDecisionPolicy,
  buildRunbook, buildSelectionSummary, buildSyntheticFutureDecisionFixture,
  buildUpstream, buildUpstreamBindings, buildValidPreparationPacket,
  evaluateDisposableEnvironmentSelectionPackage, referenceCandidateScores,
  referenceCandidateTotals, referenceRanking, safeResult, sealContract,
  validateContract, validateDecisionContext, validateFutureSelectionDecision,
  validateSelectionSummary, validateUpstream, weightedTotal,
};
