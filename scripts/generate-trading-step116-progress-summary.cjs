const fs = require("node:fs");
const path = require("node:path");

const CONTRACT_PATH = path.join("data", "processed", "trading_lab_step116_progress_summary.json");
const PACKAGE_JSON_PATH = "package.json";
const ARCHITECTURE_DOC_PATH = path.join(
  "docs",
  "trading",
  "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md",
);
const CONTRACT_VERSION = "trading-lab-step116-progress-summary-v0.1";
const AUDITED_AT = "2026-06-29T00:00:00Z";

const TRACKED_READINESS_CONTRACTS = [
  ["step1160Policy", "Step 116-0 policy baseline", "trading_lab_step1160_policy.json"],
  ["step1160Preflight", "Step 116-0 preflight", "trading_lab_step1160_preflight.json"],
  ["storeSchemaDraft", "Trading store schema draft", "trading_lab_step116_store_schema_draft.json"],
  ["shadowMode", "Shadow-mode read-only contract", "trading_lab_step116_shadow_mode_contract.json"],
  ["orderAdapterDesignReview", "KIS order adapter design review", "trading_lab_step116_kis_order_adapter_design_review.json"],
  ["envReadiness", "Trading env readiness", "trading_lab_step116_env_readiness_contract.json"],
  ["envRiskGate", "Trading env risk gate", "trading_lab_step116_env_risk_gate_contract.json"],
  ["dryRunReplay", "Dry-run replay contract", "trading_lab_step116_dry_run_replay_contract.json"],
  ["shadowHistoryReview", "Shadow history review contract", "trading_lab_step116_shadow_history_review_contract.json"],
  [
    "liveGuardedClearanceReviewResultBundle",
    "Live-guarded clearance review result bundle",
    "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json",
  ],
  ["auditLoggerReadiness", "Audit logger readiness", "trading_lab_step116_audit_logger_readiness_contract.json"],
  ["manualOperatorApproval", "Manual operator approval", "trading_lab_step116_manual_operator_approval_contract.json"],
  ["killSwitchClearance", "Kill-switch clearance", "trading_lab_step116_kill_switch_clearance_contract.json"],
  ["orderCredentialBoundary", "Order credential boundary", "trading_lab_step116_order_credential_boundary_contract.json"],
  ["riskGateClearance", "Risk-gate clearance", "trading_lab_step116_risk_gate_clearance_contract.json"],
  ["privateShadowRuntimePreflight", "Private shadow runtime preflight", "trading_lab_step116_private_shadow_runtime_preflight.json"],
  ["readOnlyApprovalIntake", "Read-only approval intake", "trading_lab_step116_read_only_approval_intake_contract.json"],
  ["readOnlyApprovalImportPreflight", "Read-only approval import preflight", "trading_lab_step116_read_only_approval_import_preflight.json"],
  ["readOnlyProviderRequestEnvelope", "Read-only provider request envelope", "trading_lab_step116_read_only_provider_request_envelope_contract.json"],
  [
    "readOnlyProviderRequestEnvelopeValidation",
    "Read-only provider request envelope validation",
    "trading_lab_step116_read_only_provider_request_envelope_validation_contract.json",
  ],
  [
    "readOnlyProviderRequestEnvelopeValidationPreflight",
    "Read-only provider request envelope validation preflight",
    "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json",
  ],
  ["readOnlyProviderResponseEnvelope", "Read-only provider response envelope", "trading_lab_step116_read_only_provider_response_envelope_contract.json"],
  ["readOnlySnapshotNormalization", "Read-only snapshot normalization", "trading_lab_step116_read_only_snapshot_normalization_contract.json"],
  [
    "readOnlySnapshotNormalizationValidatorFixtures",
    "Read-only snapshot normalization validator fixtures",
    "trading_lab_step116_read_only_snapshot_normalization_validator_fixtures.json",
  ],
  ["readOnlySnapshotRiskInput", "Read-only snapshot risk input", "trading_lab_step116_read_only_snapshot_risk_input_contract.json"],
  [
    "readOnlySnapshotRiskInputValidatorFixtures",
    "Read-only snapshot risk input validator fixtures",
    "trading_lab_step116_read_only_snapshot_risk_input_validator_fixtures.json",
  ],
  ["privateShadowOrderIntent", "Private shadow order intent", "trading_lab_step116_private_shadow_order_intent_contract.json"],
  [
    "privateShadowOrderIntentValidatorFixtures",
    "Private shadow order intent validator fixtures",
    "trading_lab_step116_private_shadow_order_intent_validator_fixtures.json",
  ],
  ["privateShadowIntentAuditEvent", "Private shadow intent audit event", "trading_lab_step116_private_shadow_intent_audit_event_contract.json"],
  [
    "privateShadowIntentAuditEventValidatorFixtures",
    "Private shadow intent audit event validator fixtures",
    "trading_lab_step116_private_shadow_intent_audit_event_validator_fixtures.json",
  ],
  ["privateShadowRuntimeReviewPacket", "Private shadow runtime review packet", "trading_lab_step116_private_shadow_runtime_review_packet_contract.json"],
  [
    "privateShadowRuntimeReviewPacketValidatorFixtures",
    "Private shadow runtime review packet validator fixtures",
    "trading_lab_step116_private_shadow_runtime_review_packet_validator_fixtures.json",
  ],
  ["privateShadowOperatorAccess", "Private shadow operator access", "trading_lab_step116_private_shadow_operator_access_contract.json"],
  [
    "privateShadowOperatorAccessValidatorFixtures",
    "Private shadow operator access validator fixtures",
    "trading_lab_step116_private_shadow_operator_access_validator_fixtures.json",
  ],
  ["manualOrderPermissionPreflight", "Manual order permission preflight", "trading_lab_step116_manual_order_permission_preflight.json"],
  [
    "manualOrderPermissionValidatorFixtures",
    "Manual order permission validator fixtures",
    "trading_lab_step116_manual_order_permission_validator_fixtures.json",
  ],
  [
    "liveGuardedOrderAdapterImplementationPreflight",
    "Live-guarded order adapter implementation preflight",
    "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  ],
  [
    "liveGuardedOrderAdapterImplementationPreflightValidatorFixtures",
    "Live-guarded order adapter implementation preflight validator fixtures",
    "trading_lab_step116_live_guarded_order_adapter_implementation_preflight_validator_fixtures.json",
  ],
  [
    "redactedManualOrderPermissionTemplate",
    "Redacted manual order permission template",
    "trading_lab_step116_redacted_manual_order_permission_template.json",
  ],
  [
    "redactedManualOrderPermissionTemplateValidatorFixtures",
    "Redacted manual order permission template validator fixtures",
    "trading_lab_step116_redacted_manual_order_permission_template_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionHashHelper",
    "Manual order permission hash helper",
    "trading_lab_step116_manual_order_permission_hash_helper_contract.json",
  ],
  [
    "manualOrderPermissionHashHelperValidatorFixtures",
    "Manual order permission hash helper validator fixtures",
    "trading_lab_step116_manual_order_permission_hash_helper_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionHashHelperPreflight",
    "Manual order permission hash helper preflight",
    "trading_lab_step116_manual_order_permission_hash_helper_preflight.json",
  ],
  [
    "manualOrderPermissionHashHelperPreflightValidatorFixtures",
    "Manual order permission hash helper preflight validator fixtures",
    "trading_lab_step116_manual_order_permission_hash_helper_preflight_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionHashHelperImplementationReview",
    "Manual order permission hash helper implementation review",
    "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_contract.json",
  ],
  [
    "manualOrderPermissionHashHelperImplementationReviewValidatorFixtures",
    "Manual order permission hash helper implementation review validator fixtures",
    "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionHashPreparationRunbook",
    "Manual order permission hash preparation runbook",
    "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
  ],
  [
    "manualOrderPermissionHashInputDecision",
    "Manual order permission hash input decision",
    "trading_lab_step116_manual_order_permission_hash_input_decision_contract.json",
  ],
  [
    "manualOrderPermissionOwnerLocalPacketPreparationHandoff",
    "Manual order permission owner-local packet preparation handoff",
    "trading_lab_step116_manual_order_permission_owner_local_packet_preparation_handoff_contract.json",
  ],
  [
    "manualOrderPermissionOwnerLocalPacketPreparationAssertion",
    "Manual order permission owner-local packet preparation assertion",
    "trading_lab_step116_manual_order_permission_owner_local_packet_preparation_assertion_contract.json",
  ],
  [
    "manualOrderPermissionExplicitLocalPacketValidationReceiptIntake",
    "Manual order permission explicit local packet validation receipt intake",
    "trading_lab_step116_manual_order_permission_explicit_local_packet_validation_receipt_intake_contract.json",
  ],
  [
    "manualOrderPermissionOwnerExplicitLocalPacketPathSupplyGate",
    "Manual order permission owner explicit local packet path supply gate",
    "trading_lab_step116_manual_order_permission_owner_explicit_local_packet_path_supply_gate_contract.json",
  ],
  [
    "manualOrderPermissionLocalValidationExecutionPreflight",
    "Manual order permission local validation execution preflight",
    "trading_lab_step116_manual_order_permission_local_validation_execution_preflight_contract.json",
  ],
  [
    "manualOrderPermissionValidationReceiptRecordingPreflight",
    "Manual order permission validation receipt recording preflight",
    "trading_lab_step116_manual_order_permission_validation_receipt_recording_preflight_contract.json",
  ],
  [
    "manualOrderPermissionValidationExecutionResultSupplyGate",
    "Manual order permission validation execution result supply gate",
    "trading_lab_step116_manual_order_permission_validation_execution_result_supply_gate_contract.json",
  ],
  [
    "manualOrderPermissionValidationReceiptExplicitLocalReceiptPathSupplyGate",
    "Manual order permission validation receipt explicit local receipt path supply gate",
    "trading_lab_step116_manual_order_permission_validation_receipt_explicit_local_receipt_path_supply_gate_contract.json",
  ],
  [
    "manualOrderPermissionValidationReceiptLocalValidationExecutionPreflight",
    "Manual order permission validation receipt local validation execution preflight",
    "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_preflight_contract.json",
  ],
  [
    "manualOrderPermissionValidationReceiptLocalValidationExecutionResultSupplyGate",
    "Manual order permission validation receipt local validation execution result supply gate",
    "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_result_supply_gate_contract.json",
  ],
  [
    "manualOrderPermissionValidationReceiptReviewResultRecordingPreflight",
    "Manual order permission validation receipt review result recording preflight",
    "trading_lab_step116_manual_order_permission_validation_receipt_review_result_recording_preflight_contract.json",
  ],
  [
    "manualOrderPermissionValidationReceiptReviewResultSupplyGate",
    "Manual order permission validation receipt review result supply gate",
    "trading_lab_step116_manual_order_permission_validation_receipt_review_result_supply_gate_contract.json",
  ],
  [
    "manualOrderPermissionImportReviewPreflight",
    "Manual order permission import review preflight",
    "trading_lab_step116_manual_order_permission_import_review_preflight_contract.json",
  ],
  [
    "manualOrderPermissionImportImplementationReview",
    "Manual order permission import implementation review",
    "trading_lab_step116_manual_order_permission_import_implementation_review_contract.json",
  ],
  [
    "manualOrderPermissionImportImplementationReviewResultRecordingPreflight",
    "Manual order permission import implementation review result recording preflight",
    "trading_lab_step116_manual_order_permission_import_implementation_review_result_recording_preflight_contract.json",
  ],
  [
    "manualOrderPermissionImportImplementationReviewResultSupplyGate",
    "Manual order permission import implementation review result supply gate",
    "trading_lab_step116_manual_order_permission_import_implementation_review_result_supply_gate_contract.json",
  ],
  [
    "manualOrderPermissionImportResultRecordingPreflight",
    "Manual order permission import result recording preflight",
    "trading_lab_step116_manual_order_permission_import_result_recording_preflight_contract.json",
  ],
  [
    "manualOrderPermissionImportResultSupplyGate",
    "Manual order permission import result supply gate",
    "trading_lab_step116_manual_order_permission_import_result_supply_gate_contract.json",
  ],
  [
    "manualOrderPermissionKillSwitchClearanceReviewPreflight",
    "Manual order permission kill-switch clearance review preflight",
    "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_preflight_contract.json",
  ],
  [
    "manualOrderPermissionKillSwitchClearanceReviewResultSupplyGate",
    "Manual order permission kill-switch clearance review result supply gate",
    "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_supply_gate_contract.json",
  ],
  [
    "manualOrderPermissionKillSwitchClearanceReviewResultRecordingPreflight",
    "Manual order permission kill-switch clearance review result recording preflight",
    "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_recording_preflight_contract.json",
  ],
  [
    "manualOrderPermissionKillSwitchClearanceReviewResult",
    "Manual order permission kill-switch clearance review result",
    "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_contract.json",
  ],
  [
    "manualOrderPermissionKillSwitchClearanceReviewResultReceipt",
    "Manual order permission kill-switch clearance review result receipt",
    "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_receipt_contract.json",
  ],
    [
      "manualOrderPermissionRiskGateClearanceReviewPreflight",
      "Manual order permission risk-gate clearance review preflight",
      "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_preflight_contract.json",
    ],
    [
      "manualOrderPermissionRiskGateClearanceReviewResultSupplyGate",
      "Manual order permission risk-gate clearance review result supply gate",
      "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_supply_gate_contract.json",
    ],
    [
      "manualOrderPermissionRiskGateClearanceReviewResult",
      "Manual order permission risk-gate clearance review result",
      "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_contract.json",
    ],
    [
      "manualOrderPermissionDryRunReplayExecutionResult",
      "Manual order permission dry-run replay execution result",
      "trading_lab_step116_manual_order_permission_dry_run_replay_execution_result_contract.json",
    ],
    [
      "manualOrderPermissionHashPreparationRunbookValidatorFixtures",
      "Manual order permission hash preparation runbook validator fixtures",
      "trading_lab_step116_manual_order_permission_hash_preparation_runbook_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionImportImplementationPreflight",
    "Manual order permission import implementation preflight",
    "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
  ],
  [
    "manualOrderPermissionImportImplementationPreflightValidatorFixtures",
    "Manual order permission import implementation preflight validator fixtures",
    "trading_lab_step116_manual_order_permission_import_implementation_preflight_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionPacketValidatorFixtures",
    "Manual order permission packet validator fixtures",
    "trading_lab_step116_manual_order_permission_packet_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionPacketValidationPreflight",
    "Manual order permission packet validation preflight",
    "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
  ],
  [
    "manualOrderPermissionPacketValidationPreflightValidatorFixtures",
    "Manual order permission packet validation preflight validator fixtures",
    "trading_lab_step116_manual_order_permission_packet_validation_preflight_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionPacketValidationRunbook",
    "Manual order permission packet validation runbook",
    "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json",
  ],
  [
    "manualOrderPermissionPacketPreparationChecklist",
    "Manual order permission packet preparation checklist",
    "trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json",
  ],
  [
    "liveGuardedInternalGateClearanceSequence",
    "Live-guarded internal gate clearance sequence",
    "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
  ],
  [
    "manualOrderPermissionValidationResultReceipt",
    "Manual order permission validation result receipt",
    "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
  ],
  [
    "manualOrderPermissionValidationResultReceiptValidatorFixtures",
    "Manual order permission validation result receipt validator fixtures",
    "trading_lab_step116_manual_order_permission_validation_result_receipt_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionValidationResultReceiptReviewPreflight",
    "Manual order permission validation result receipt review preflight",
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
  ],
  [
    "manualOrderPermissionValidationResultReceiptReviewPreflightValidatorFixtures",
    "Manual order permission validation result receipt review preflight validator fixtures",
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionValidationResultReceiptReviewRunbook",
    "Manual order permission validation result receipt review runbook",
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
  ],
  [
    "manualOrderPermissionValidationResultReceiptReviewRunbookValidatorFixtures",
    "Manual order permission validation result receipt review runbook validator fixtures",
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_validator_fixtures.json",
  ],
  [
    "manualOrderPermissionValidationResultReceiptReviewResult",
    "Manual order permission validation result receipt review result",
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
  ],
  [
    "manualOrderPermissionValidationResultReceiptReviewResultValidatorFixtures",
    "Manual order permission validation result receipt review result validator fixtures",
    "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_validator_fixtures.json",
  ],
  ["mockApprovalEvidenceReceipt", "Mock approval evidence receipt", "trading_lab_step116_mock_approval_evidence_receipt.json"],
  [
    "mockApprovalEvidenceReceiptValidatorFixtures",
    "Mock approval evidence receipt validator fixtures",
    "trading_lab_step116_mock_approval_evidence_receipt_validator_fixtures.json",
  ],
  ["redactedReadOnlyApprovalTemplate", "Redacted read-only approval template", "trading_lab_step116_redacted_read_only_approval_template.json"],
  [
    "ownerReadOnlyEvidenceActionQueue",
    "Owner read-only evidence action queue",
    "trading_lab_step116_owner_read_only_evidence_action_queue_contract.json",
  ],
  [
    "redactedReadOnlyApprovalTemplateValidatorFixtures",
    "Redacted read-only approval template validator fixtures",
    "trading_lab_step116_redacted_read_only_approval_template_validator_fixtures.json",
  ],
  ["redactedApprovalHashHelper", "Redacted approval hash helper", "trading_lab_step116_redacted_approval_hash_helper_contract.json"],
  [
    "redactedApprovalHashHelperValidatorFixtures",
    "Redacted approval hash helper validator fixtures",
    "trading_lab_step116_redacted_approval_hash_helper_validator_fixtures.json",
  ],
  ["redactedApprovalHashHelperPreflight", "Redacted approval hash helper preflight", "trading_lab_step116_redacted_approval_hash_helper_preflight.json"],
  [
    "redactedApprovalHashHelperPreflightValidatorFixtures",
    "Redacted approval hash helper preflight validator fixtures",
    "trading_lab_step116_redacted_approval_hash_helper_preflight_validator_fixtures.json",
  ],
  ["redactedApprovalPacketValidation", "Redacted approval packet validation", "trading_lab_step116_redacted_approval_packet_validation_contract.json"],
  ["redactedApprovalPacketValidationPreflight", "Redacted approval packet validation preflight", "trading_lab_step116_redacted_approval_packet_validation_preflight.json"],
  [
    "redactedApprovalPacketValidationPreflightValidatorFixtures",
    "Redacted approval packet validation preflight validator fixtures",
    "trading_lab_step116_redacted_approval_packet_validation_preflight_validator_fixtures.json",
  ],
  ["redactedApprovalPacketValidatorFixtures", "Redacted approval packet validator fixtures", "trading_lab_step116_redacted_approval_packet_validator_fixtures.json"],
  [
    "privateReadOnlyProviderImplementationPreflight",
    "Private read-only provider implementation preflight",
    "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
  ],
  [
    "privateDbStorageImplementationPreflight",
    "Private DB storage implementation preflight",
    "trading_lab_step116_private_db_storage_implementation_preflight.json",
  ],
  [
    "privateRuntimeRouteImplementationPreflight",
    "Private runtime route implementation preflight",
    "trading_lab_step116_private_runtime_route_implementation_preflight.json",
  ],
  [
    "privateOperatorAccessImplementationPreflight",
    "Private operator access implementation preflight",
    "trading_lab_step116_private_operator_access_implementation_preflight.json",
  ],
  [
    "privateShadowRuntimeImplementationPreflight",
    "Private shadow runtime implementation preflight",
    "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
  ],
  [
    "readOnlyApprovalImportImplementationPreflight",
    "Read-only approval import implementation preflight",
    "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
  ],
  [
    "readOnlyProviderCallAuthorizationPreflight",
    "Read-only provider call authorization preflight",
    "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
  ],
  [
    "readOnlyProviderCallAuthorizationReviewResult",
    "Read-only provider call authorization review result",
    "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json",
  ],
  [
    "readOnlyProviderCallAuthorizationPreflightValidatorFixtures",
    "Read-only provider call authorization preflight validator fixtures",
    "trading_lab_step116_read_only_provider_call_authorization_preflight_validator_fixtures.json",
  ],
  [
    "readOnlyProviderEndpointAllowlist",
    "Read-only provider endpoint allowlist",
    "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json",
  ],
  [
    "readOnlyProviderEndpointAllowlistValidatorFixtures",
    "Read-only provider endpoint allowlist validator fixtures",
    "trading_lab_step116_read_only_provider_endpoint_allowlist_validator_fixtures.json",
  ],
  [
    "readOnlyProviderEndpointCategoryValidationPreflight",
    "Read-only provider endpoint category validation preflight",
    "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
  ],
  [
    "readOnlyProviderEndpointCategoryValidationPreflightValidatorFixtures",
    "Read-only provider endpoint category validation preflight validator fixtures",
    "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight_validator_fixtures.json",
  ],
  [
    "readOnlyProviderRequestEnvelopeValidatorFixtures",
    "Read-only provider request envelope validator fixtures",
    "trading_lab_step116_read_only_provider_request_envelope_validator_fixtures.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidationPreflight",
    "Read-only provider response envelope validation preflight",
    "trading_lab_step116_read_only_provider_response_envelope_validation_preflight.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidatorFixtures",
    "Read-only provider response envelope validator fixtures",
    "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidationResultReceipt",
    "Read-only provider response envelope validation result receipt",
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidationResultReceiptValidatorFixtures",
    "Read-only provider response envelope validation result receipt validator fixtures",
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_validator_fixtures.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidationResultReceiptReviewPreflight",
    "Read-only provider response envelope validation result receipt review preflight",
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidationResultReceiptReviewPreflightValidatorFixtures",
    "Read-only provider response envelope validation result receipt review preflight validator fixtures",
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight_validator_fixtures.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidationResultReceiptReviewRunbook",
    "Read-only provider response envelope validation result receipt review runbook",
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_runbook_contract.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidationResultReceiptReviewRunbookValidatorFixtures",
    "Read-only provider response envelope validation result receipt review runbook validator fixtures",
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_runbook_validator_fixtures.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidationResultReceiptReviewResult",
    "Read-only provider response envelope validation result receipt review result",
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_result_contract.json",
  ],
  [
    "readOnlyProviderResponseEnvelopeValidationResultReceiptReviewResultValidatorFixtures",
    "Read-only provider response envelope validation result receipt review result validator fixtures",
    "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_result_validator_fixtures.json",
  ],
  [
    "tradingLaunchReadinessPlan",
    "Trading launch readiness plan",
    "trading_lab_step116_launch_readiness_plan_contract.json",
  ],
  [
    "tradingRulesAndRiskLimitsReview",
    "Trading rules and risk limits review",
    "trading_lab_step116_trading_rules_and_risk_limits_review_contract.json",
  ],
  [
    "paperShadowOperationalTestPlan",
    "Paper shadow operational test plan",
    "trading_lab_step116_paper_shadow_operational_test_plan_contract.json",
  ],
  [
    "liveGuardedManualTestPlan",
    "Live-guarded manual test plan",
    "trading_lab_step116_live_guarded_manual_test_plan_contract.json",
  ],
  [
    "publicDashboardRouterReviewPlan",
    "Public dashboard and homepage router review plan",
    "trading_lab_step116_public_dashboard_router_review_plan_contract.json",
  ],
  [
    "alphaKrMarketBoundary",
    "Alpha KR market boundary",
    "trading_lab_step116_alpha_kr_market_boundary_contract.json",
  ],
  [
    "brokerContingencyReview",
    "Broker contingency review",
    "trading_lab_step116_broker_contingency_review_contract.json",
  ],
  [
    "ownerOrderPathAssertion",
    "Owner order path assertion",
    "trading_lab_step116_owner_order_path_assertion_contract.json",
  ],
  [
    "kisPersonalOrderAuthorityAssertion",
    "KIS personal order authority assertion",
    "trading_lab_step116_kis_personal_order_authority_assertion_contract.json",
  ],
  [
    "kisPersonalTermsPermissionAssertion",
    "KIS personal terms permission assertion",
    "trading_lab_step116_kis_personal_terms_permission_assertion_contract.json",
  ],
  [
    "readOnlyApprovalPacketPreparationRunbook",
    "Read-only approval packet preparation runbook",
    "trading_lab_step116_read_only_approval_packet_preparation_runbook_contract.json",
  ],
  [
    "readOnlyApprovalPacketValidationRunbook",
    "Read-only approval packet validation runbook",
    "trading_lab_step116_read_only_approval_packet_validation_runbook_contract.json",
  ],
  [
    "readOnlyApprovalPacketValidationResultReceipt",
    "Read-only approval packet validation result receipt",
    "trading_lab_step116_read_only_approval_packet_validation_result_receipt.json",
  ],
  [
    "readOnlyApprovalPacketValidationResultReceiptValidatorFixtures",
    "Read-only approval packet validation result receipt validator fixtures",
    "trading_lab_step116_read_only_approval_packet_validation_result_receipt_validator_fixtures.json",
  ],
  [
    "readOnlyApprovalPacketValidationResultReceiptReviewPreflight",
    "Read-only approval packet validation result receipt review preflight",
    "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight.json",
  ],
  [
    "readOnlyApprovalPacketValidationResultReceiptReviewPreflightValidatorFixtures",
    "Read-only approval packet validation result receipt review preflight validator fixtures",
    "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight_validator_fixtures.json",
  ],
  [
    "readOnlyApprovalPacketValidationResultReceiptReviewRunbook",
    "Read-only approval packet validation result receipt review runbook",
    "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_contract.json",
  ],
];

const REQUIRED_NPM_SCRIPTS = [
  "check:trading-lab-step1160",
  "check:trading-lab-policy",
  "check:trading-paper-ledger",
  "check:trading-risk-engine",
  "check:trading-store-schema-draft",
  "check:trading-shadow-mode-contract",
  "check:trading-kis-order-adapter-design",
  "check:trading-env-readiness",
  "check:trading-env-values",
  "check:trading-env-risk-gate",
  "check:trading-dry-run-replay",
  "check:trading-shadow-history-review",
  "check:trading-live-guarded-clearance-review-result-bundle",
  "check:trading-audit-logger-readiness",
  "check:trading-manual-operator-approval",
  "check:trading-kill-switch-clearance",
  "check:trading-order-credential-boundary",
  "check:trading-risk-gate-clearance",
  "check:trading-private-shadow-runtime-preflight",
  "check:trading-read-only-approval-intake",
  "check:trading-read-only-approval-import-preflight",
  "check:trading-read-only-provider-request-envelope",
  "check:trading-read-only-provider-request-envelope-validation",
  "check:trading-read-only-provider-request-envelope-validation-preflight",
  "check:trading-read-only-provider-request-envelope-validator",
  "check:trading-read-only-provider-response-envelope",
  "check:trading-read-only-snapshot-normalization",
  "check:trading-read-only-snapshot-normalization-validator",
  "check:trading-read-only-snapshot-normalization-validator-fixtures",
  "check:trading-read-only-snapshot-risk-input",
  "check:trading-read-only-snapshot-risk-input-validator",
  "check:trading-read-only-snapshot-risk-input-validator-fixtures",
  "check:trading-private-shadow-order-intent",
  "check:trading-private-shadow-order-intent-validator",
  "check:trading-private-shadow-order-intent-validator-fixtures",
  "check:trading-private-shadow-intent-audit-event",
  "check:trading-private-shadow-intent-audit-event-validator",
  "check:trading-private-shadow-intent-audit-event-validator-fixtures",
  "check:trading-private-shadow-runtime-review-packet",
  "check:trading-private-shadow-runtime-review-packet-validator",
  "check:trading-private-shadow-runtime-review-packet-validator-fixtures",
  "check:trading-private-shadow-operator-access",
  "check:trading-private-shadow-operator-access-validator",
  "check:trading-private-shadow-operator-access-validator-fixtures",
  "check:trading-manual-order-permission",
  "check:trading-manual-order-permission-validator",
  "check:trading-manual-order-permission-validator-fixtures",
  "check:trading-live-guarded-order-adapter-implementation-preflight",
  "check:trading-live-guarded-order-adapter-implementation-preflight-validator",
  "check:trading-live-guarded-order-adapter-implementation-preflight-validator-fixtures",
  "check:trading-redacted-manual-order-permission-template",
  "check:trading-redacted-manual-order-permission-template-validator",
  "check:trading-redacted-manual-order-permission-template-validator-fixtures",
  "check:trading-manual-order-permission-hash-helper",
  "check:trading-manual-order-permission-hash-helper-validator",
  "check:trading-manual-order-permission-hash-helper-validator-fixtures",
  "check:trading-manual-order-permission-hash-helper-preflight",
  "check:trading-manual-order-permission-hash-helper-preflight-validator",
  "check:trading-manual-order-permission-hash-helper-preflight-validator-fixtures",
  "check:trading-manual-order-permission-hash-helper-implementation-review",
  "check:trading-manual-order-permission-hash-helper-implementation-review-validator",
  "check:trading-manual-order-permission-hash-helper-implementation-review-validator-fixtures",
  "check:trading-manual-order-permission-hash-preparation-runbook",
  "check:trading-manual-order-permission-hash-input-decision",
  "check:trading-manual-order-permission-owner-local-packet-preparation-handoff",
  "check:trading-manual-order-permission-owner-local-packet-preparation-assertion",
  "check:trading-manual-order-permission-explicit-local-packet-validation-receipt-intake",
  "check:trading-manual-order-permission-owner-explicit-local-packet-path-supply-gate",
  "check:trading-manual-order-permission-local-validation-execution-preflight",
  "check:trading-manual-order-permission-validation-receipt-recording-preflight",
  "check:trading-manual-order-permission-validation-execution-result-supply-gate",
  "check:trading-manual-order-permission-validation-receipt-explicit-local-receipt-path-supply-gate",
  "check:trading-manual-order-permission-validation-receipt-local-validation-execution-preflight",
  "check:trading-manual-order-permission-validation-receipt-local-validation-execution-result-supply-gate",
  "check:trading-manual-order-permission-validation-receipt-review-result-recording-preflight",
  "check:trading-manual-order-permission-validation-receipt-review-result-supply-gate",
  "check:trading-manual-order-permission-import-review-preflight",
  "check:trading-manual-order-permission-import-implementation-review",
  "check:trading-manual-order-permission-import-implementation-review-result-recording-preflight",
  "check:trading-manual-order-permission-import-implementation-review-result-supply-gate",
  "check:trading-manual-order-permission-import-result-recording-preflight",
  "check:trading-manual-order-permission-import-result-supply-gate",
  "check:trading-manual-order-permission-kill-switch-clearance-review-preflight",
  "check:trading-manual-order-permission-kill-switch-clearance-review-result-supply-gate",
  "check:trading-manual-order-permission-kill-switch-clearance-review-result-recording-preflight",
  "check:trading-manual-order-permission-kill-switch-clearance-review-result",
  "check:trading-manual-order-permission-kill-switch-clearance-review-result-receipt",
  "check:trading-manual-order-permission-risk-gate-clearance-review-preflight",
  "check:trading-manual-order-permission-risk-gate-clearance-review-result-supply-gate",
  "check:trading-manual-order-permission-risk-gate-clearance-review-result",
  "check:trading-manual-order-permission-dry-run-replay-execution-result",
  "check:trading-manual-order-permission-hash-preparation-runbook-validator",
  "check:trading-manual-order-permission-hash-preparation-runbook-validator-fixtures",
  "check:trading-manual-order-permission-import-implementation-preflight",
  "check:trading-manual-order-permission-import-implementation-preflight-validator",
  "check:trading-manual-order-permission-import-implementation-preflight-validator-fixtures",
  "check:trading-manual-order-permission-packet-validator",
  "check:trading-manual-order-permission-packet-validator-fixtures",
  "check:trading-manual-order-permission-packet-validation-preflight",
  "check:trading-manual-order-permission-packet-validation-preflight-validator",
  "check:trading-manual-order-permission-packet-validation-preflight-validator-fixtures",
  "check:trading-manual-order-permission-packet-validation-runbook",
  "check:trading-manual-order-permission-packet-preparation-checklist",
  "check:trading-live-guarded-internal-gate-clearance-sequence",
  "check:trading-manual-order-permission-validation-result-receipt",
  "check:trading-manual-order-permission-validation-result-receipt-validator",
  "check:trading-manual-order-permission-validation-result-receipt-validator-fixtures",
  "check:trading-manual-order-permission-validation-result-receipt-review-preflight",
  "check:trading-manual-order-permission-validation-result-receipt-review-preflight-validator",
  "check:trading-manual-order-permission-validation-result-receipt-review-preflight-validator-fixtures",
  "check:trading-manual-order-permission-validation-result-receipt-review-runbook",
  "check:trading-manual-order-permission-validation-result-receipt-review-runbook-validator",
  "check:trading-manual-order-permission-validation-result-receipt-review-runbook-validator-fixtures",
  "check:trading-manual-order-permission-validation-result-receipt-review-result",
  "check:trading-manual-order-permission-validation-result-receipt-review-result-validator",
  "check:trading-manual-order-permission-validation-result-receipt-review-result-validator-fixtures",
  "check:trading-mock-approval-evidence",
  "check:trading-mock-approval-evidence-validator",
  "check:trading-mock-approval-evidence-validator-fixtures",
  "check:trading-redacted-read-only-approval-template",
  "check:trading-owner-read-only-evidence-action-queue",
  "check:trading-redacted-read-only-approval-template-validator",
  "check:trading-redacted-read-only-approval-template-validator-fixtures",
  "check:trading-redacted-approval-hash-helper",
  "check:trading-redacted-approval-hash-helper-validator",
  "check:trading-redacted-approval-hash-helper-validator-fixtures",
  "check:trading-redacted-approval-hash-helper-preflight",
  "check:trading-redacted-approval-hash-helper-preflight-validator",
  "check:trading-redacted-approval-hash-helper-preflight-validator-fixtures",
  "check:trading-redacted-approval-packet-validation",
  "check:trading-redacted-approval-packet-validation-preflight",
  "check:trading-redacted-approval-packet-validation-preflight-validator",
  "check:trading-redacted-approval-packet-validation-preflight-validator-fixtures",
  "check:trading-redacted-approval-packet-validator",
  "check:trading-redacted-approval-packet-validator-fixtures",
  "check:trading-private-read-only-provider-implementation-preflight",
  "check:trading-private-db-storage-implementation-preflight",
  "check:trading-private-runtime-route-implementation-preflight",
  "check:trading-private-operator-access-implementation-preflight",
  "check:trading-private-shadow-runtime-implementation-preflight",
  "check:trading-read-only-approval-import-implementation-preflight",
  "check:trading-read-only-provider-call-authorization-preflight",
  "check:trading-read-only-provider-call-authorization-review-result",
  "check:trading-read-only-provider-call-authorization-preflight-validator",
  "check:trading-read-only-provider-call-authorization-preflight-validator-fixtures",
  "check:trading-read-only-provider-endpoint-allowlist",
  "check:trading-read-only-provider-endpoint-allowlist-validator",
  "check:trading-read-only-provider-endpoint-allowlist-validator-fixtures",
  "check:trading-read-only-provider-endpoint-category-validation-preflight",
  "check:trading-read-only-provider-endpoint-category-validation-preflight-validator",
  "check:trading-read-only-provider-endpoint-category-validation-preflight-validator-fixtures",
  "check:trading-read-only-provider-request-envelope-validator-fixtures",
  "check:trading-read-only-provider-response-envelope-validation-preflight",
  "check:trading-read-only-provider-response-envelope-validator-fixtures",
  "check:trading-read-only-provider-response-envelope-validator",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-validator",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-validator-fixtures",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-review-preflight",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-review-preflight-validator",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-review-preflight-validator-fixtures",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-review-runbook",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-review-runbook-validator",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-review-runbook-validator-fixtures",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-review-result",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-review-result-validator",
  "check:trading-read-only-provider-response-envelope-validation-result-receipt-review-result-validator-fixtures",
  "check:trading-launch-readiness-plan",
  "check:trading-rules-and-risk-limits-review",
  "check:trading-paper-shadow-operational-test-plan",
  "check:trading-live-guarded-manual-test-plan",
  "check:trading-public-dashboard-router-review-plan",
  "check:trading-alpha-kr-market-boundary",
  "check:trading-broker-contingency-review",
  "check:trading-owner-order-path-assertion",
  "check:trading-kis-personal-order-authority-assertion",
  "check:trading-kis-personal-terms-permission-assertion",
  "check:trading-read-only-approval-packet-preparation-runbook",
  "check:trading-read-only-approval-packet-validation-runbook",
  "check:trading-read-only-approval-packet-validation-result-receipt",
  "check:trading-read-only-approval-packet-validation-result-receipt-validator",
  "check:trading-read-only-approval-packet-validation-result-receipt-validator-fixtures",
  "check:trading-read-only-approval-packet-validation-result-receipt-review-preflight",
  "check:trading-read-only-approval-packet-validation-result-receipt-review-preflight-validator",
  "check:trading-read-only-approval-packet-validation-result-receipt-review-preflight-validator-fixtures",
  "check:trading-read-only-approval-packet-validation-result-receipt-review-runbook",
  "check:trading-read-only-approval-packet-validation-result-receipt-review-runbook-validator",
];

const FORBIDDEN_ALLOW_FLAGS = [
  "providerCallsAllowed",
  "orderSubmissionAllowed",
  "dbMigrationAllowed",
  "publicUiAllowed",
  "runtimeRouteAllowed",
  "liveTradingAllowed",
];
const FORBIDDEN_RUNTIME_ARTIFACTS = [
  path.join("data", "private", "trading", "read_only_approval.redacted.json"),
  path.join("data", "private", "trading", "manual_order_permission.redacted.json"),
  path.join("server", "src", "services", "tradingShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "shadowRuntime.js"),
  path.join("server", "src", "services", "trading", "privateShadowRuntime.js"),
  path.join("server", "src", "services", "trading", "privateOperatorAccess.js"),
  path.join("server", "src", "services", "trading", "readOnlyApprovalImport.js"),
  path.join("server", "src", "services", "trading", "kisReadOnlyProvider.js"),
  path.join("server", "src", "services", "tradingReadOnlyProvider.js"),
  path.join("server", "src", "routes", "trading"),
  path.join("src", "components", "trading"),
  path.join("src", "pages", "TradingLab.jsx"),
  path.join("migrations", "trading"),
];
const FORBIDDEN_SCENARIO_ARTIFACT = path.join("data", "processed", "scenario_monthly_returns.csv");
const REMAINING_TRADING_GATES = [
  "owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet",
  "owner_read_only_evidence_action_queue_ready_import_still_blocked",
  "private_read_only_provider_implementation_review_blocked_pending_owner_packet_import",
  "read_only_provider_call_authorization_blocked_pending_owner_packet_and_provider_review",
  "read_only_provider_call_authorization_review_result_not_owner_supplied",
  "private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access",
  "private_operator_access_implementation_review_blocked_pending_private_runtime_review",
  "db_storage_review_blocked_pending_private_runtime_review",
  "runtime_route_review_blocked_pending_private_runtime_review",
  "manual_order_permission_packet_not_imported",
  "kill_switch_clearance_not_recorded_for_order_submission",
  "risk_gate_clearance_not_recorded_for_order_submission",
  "live_guarded_clearance_review_result_bundle_not_owner_supplied",
  "live_guarded_order_adapter_implementation_review_not_started",
  "trading_rules_runtime_application_blocked_pending_private_shadow_runtime_review",
  "paper_shadow_operational_test_execution_blocked_pending_private_runtime_review",
  "live_guarded_manual_test_execution_blocked_pending_manual_permission_and_operator_clearance",
  "public_dashboard_router_review_blocked_until_live_guarded_review_complete",
  "homepage_router_change_blocked_until_public_dashboard_review",
  "public_homepage_router_blocked_until_live_guarded_review_complete",
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

function missingValues(actual, required) {
  const actualSet = new Set(actual);
  return required.filter((value) => !actualSet.has(value));
}

function forbiddenRuntimeArtifacts() {
  return [...FORBIDDEN_RUNTIME_ARTIFACTS, FORBIDDEN_SCENARIO_ARTIFACT].filter((filePath) => fs.existsSync(filePath));
}

function getAllowFlagViolations(report) {
  const containers = [report.readiness, report.currentState].filter(Boolean);
  return containers.flatMap((container) =>
    FORBIDDEN_ALLOW_FLAGS.filter((flag) => container[flag] === true).map((flag) => `${flag}=true`),
  );
}

function summarizePolicyBaseline(id, title, filePath, report) {
  const defaults = report.defaults ?? {};
  const nonGoals = Array.isArray(report.nonGoals) ? report.nonGoals : [];
  const requiredNonGoals = [
    "kis_provider_calls",
    "order_submission",
    "provider_adapter_implementation",
    "database_migration",
    "public_ui",
    "scenario_monthly_data_write",
    "scenario_runtime_implementation",
  ];
  const blockers = [
    ...(report.status === "draft_baseline_no_runtime_implementation" ? [] : ["policy_status_not_fail_closed_draft"]),
    ...(defaults.providerCallsAllowed === false ? [] : ["policy_provider_calls_not_blocked"]),
    ...(defaults.orderSubmissionAllowed === false ? [] : ["policy_order_submission_not_blocked"]),
    ...(defaults.dbMigrationAllowed === false ? [] : ["policy_db_migration_not_blocked"]),
    ...(defaults.publicUiAllowed === false ? [] : ["policy_public_ui_not_blocked"]),
    ...missingValues(nonGoals, requiredNonGoals).map((nonGoal) => `policy_missing_non_goal_${nonGoal}`),
  ];

  return {
    id,
    title,
    filePath,
    status: report.status ?? null,
    ready: blockers.length === 0,
    blockers,
    allowFlagViolations: [],
  };
}

function summarizeContract([id, title, fileName]) {
  const filePath = path.join("data", "processed", fileName);
  const report = readJson(filePath);
  if (id === "step1160Policy") {
    return summarizePolicyBaseline(id, title, filePath, report);
  }
  const readiness = report.readiness ?? {};
  const blockers = Array.isArray(readiness.blockers) ? readiness.blockers : [];
  const allowFlagViolations = getAllowFlagViolations(report);
  const ready =
    typeof readiness.status === "string" &&
    !readiness.status.startsWith("blocked") &&
    blockers.length === 0 &&
    allowFlagViolations.length === 0;

  return {
    id,
    title,
    filePath,
    status: readiness.status ?? null,
    ready,
    blockers,
    allowFlagViolations,
  };
}

function buildContract() {
  const packageJson = readJson(PACKAGE_JSON_PATH);
  const architectureDoc = readText(ARCHITECTURE_DOC_PATH);
  const milestones = TRACKED_READINESS_CONTRACTS.map(summarizeContract);
  const readyMilestones = milestones.filter((milestone) => milestone.ready);
  const missingNpmScripts = missingValues(Object.keys(packageJson.scripts ?? {}), REQUIRED_NPM_SCRIPTS);
  const forbiddenArtifacts = forbiddenRuntimeArtifacts();
  const checks = {
    summaryOnly: true,
    trackedContractsReady: readyMilestones.length === milestones.length,
    npmScriptsReady: missingNpmScripts.length === 0,
    architectureDocMentionsProgressSummary:
      architectureDoc.includes("Trading Step 116 Progress Summary") &&
      architectureDoc.includes("trading_lab_step116_progress_summary"),
    scenarioMonthlyReturnsCsvAbsent: !fs.existsSync(FORBIDDEN_SCENARIO_ARTIFACT),
    noRuntimeArtifacts: forbiddenArtifacts.length === 0,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    dbMigrationAllowed: false,
    publicUiAllowed: false,
    runtimeRouteAllowed: false,
    liveTradingAllowed: false,
  };
  const contractStackReady =
    checks.trackedContractsReady &&
    checks.npmScriptsReady &&
    checks.architectureDocMentionsProgressSummary &&
    checks.scenarioMonthlyReturnsCsvAbsent &&
    checks.noRuntimeArtifacts;

  return stableJson({
    contractVersion: CONTRACT_VERSION,
    auditedAt: AUDITED_AT,
    step: "Step 116-2L",
    scope: "trading_step116_progress_summary",
    sourceFiles: {
      packageJson: PACKAGE_JSON_PATH,
      architectureDoc: ARCHITECTURE_DOC_PATH,
      trackedContracts: Object.fromEntries(
        TRACKED_READINESS_CONTRACTS.map(([id, , fileName]) => [id, path.join("data", "processed", fileName)]),
      ),
    },
    outputFiles: {
      contract: CONTRACT_PATH,
    },
    currentState: {
      summaryOnly: true,
      contractStackReady,
      readyForReadOnlyProviderCalls: false,
      readyForPrivateShadowRuntime: false,
      orderSubmissionAuthorityExternalBlockerCleared: true,
      kisPersonalTermsPermissionExternalBlockerCleared: true,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
    },
    progress: {
      trackedContractsTotal: milestones.length,
      trackedContractsReady: readyMilestones.length,
      trackedContractsRemaining: milestones.length - readyMilestones.length,
      requiredNpmScriptsTotal: REQUIRED_NPM_SCRIPTS.length,
      requiredNpmScriptsMissing: missingNpmScripts.length,
      completionRatio: Number((readyMilestones.length / milestones.length).toFixed(4)),
      phase: contractStackReady
        ? "private_paper_shadow_contract_stack_ready_order_authority_external_blocker_cleared_pending_private_evidence_and_implementation_reviews"
        : "private_paper_shadow_contract_stack_incomplete",
      authorityExternalBlockersCleared: [
        "owner_order_path_assertion_recorded",
        "kis_personal_order_authority_recorded",
        "kis_personal_terms_permission_assertion_recorded",
      ],
    },
    milestones,
    remainingTradingGates: REMAINING_TRADING_GATES,
    checks,
    evidence: {
      missingNpmScripts,
      forbiddenRuntimeArtifacts: forbiddenArtifacts,
      scenarioMonthlyReturnsCsvPath: FORBIDDEN_SCENARIO_ARTIFACT,
      failedMilestones: milestones.filter((milestone) => !milestone.ready).map((milestone) => milestone.id),
    },
    readiness: {
      status: contractStackReady
        ? "summary_ready_contract_stack_fail_closed_pending_private_trading_reviews"
        : "blocked_before_step116_progress_summary",
      contractStackReady,
      readyForReadOnlyProviderCalls: false,
      readyForPrivateShadowRuntime: false,
      orderSubmissionAuthorityExternalBlockerCleared: true,
      kisPersonalTermsPermissionExternalBlockerCleared: true,
      readyForOrderSubmission: false,
      readyForLiveGuardedTrading: false,
      providerCallsAllowed: false,
      orderSubmissionAllowed: false,
      dbMigrationAllowed: false,
      publicUiAllowed: false,
      runtimeRouteAllowed: false,
      liveTradingAllowed: false,
      blockers: [
        ...(checks.trackedContractsReady ? [] : ["tracked_contracts_not_ready"]),
        ...(checks.npmScriptsReady ? [] : ["required_npm_scripts_missing"]),
        ...(checks.architectureDocMentionsProgressSummary ? [] : ["architecture_doc_missing_progress_summary"]),
        ...(checks.scenarioMonthlyReturnsCsvAbsent ? [] : ["scenario_monthly_returns_csv_present"]),
        ...forbiddenArtifacts.map((filePath) => `forbidden_runtime_artifact_${filePath}`),
      ],
      remainingTradingGates: REMAINING_TRADING_GATES,
    },
  });
}

function main() {
  const checkOnly = process.argv.includes("--check");
  const contract = buildContract();

  if (checkOnly) {
    if (!fs.existsSync(CONTRACT_PATH)) {
      fail(`${CONTRACT_PATH} not found; run node scripts/generate-trading-step116-progress-summary.cjs`);
    }
    const current = fs.readFileSync(CONTRACT_PATH, "utf8");
    if (current !== contract) {
      fail(`${CONTRACT_PATH} is out of date; run node scripts/generate-trading-step116-progress-summary.cjs`);
    }
    console.log("[generate-trading-step116-progress-summary] ok");
    console.log(`[generate-trading-step116-progress-summary] contract=${CONTRACT_PATH}`);
    return;
  }

  fs.mkdirSync(path.dirname(CONTRACT_PATH), { recursive: true });
  fs.writeFileSync(CONTRACT_PATH, contract);
  const parsed = JSON.parse(contract);
  console.log("[generate-trading-step116-progress-summary] wrote contract");
  console.log(`[generate-trading-step116-progress-summary] contractStackReady=${parsed.readiness.contractStackReady}`);
}

main();
