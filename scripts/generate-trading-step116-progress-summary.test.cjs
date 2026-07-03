const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const SCRIPT_PATH = path.resolve("scripts", "generate-trading-step116-progress-summary.cjs");
const CONTRACT = "trading_lab_step116_progress_summary.json";
const DOC_PATH = path.join("docs", "trading", "FINPLE_AI_TRADING_LAB_STEP116_0_ARCHITECTURE_OPERATIONS_2026_06_28.md");
const TRACKED_CONTRACTS = [
  CONTRACT,
  "trading_lab_step1160_policy.json",
  "trading_lab_step1160_preflight.json",
  "trading_lab_step116_store_schema_draft.json",
  "trading_lab_step116_shadow_mode_contract.json",
  "trading_lab_step116_kis_order_adapter_design_review.json",
  "trading_lab_step116_env_readiness_contract.json",
  "trading_lab_step116_env_risk_gate_contract.json",
  "trading_lab_step116_dry_run_replay_contract.json",
  "trading_lab_step116_shadow_history_review_contract.json",
  "trading_lab_step116_live_guarded_clearance_review_result_bundle_contract.json",
  "trading_lab_step116_audit_logger_readiness_contract.json",
  "trading_lab_step116_manual_operator_approval_contract.json",
  "trading_lab_step116_kill_switch_clearance_contract.json",
  "trading_lab_step116_order_credential_boundary_contract.json",
  "trading_lab_step116_risk_gate_clearance_contract.json",
  "trading_lab_step116_private_shadow_runtime_preflight.json",
  "trading_lab_step116_read_only_approval_intake_contract.json",
  "trading_lab_step116_read_only_approval_import_preflight.json",
  "trading_lab_step116_read_only_provider_request_envelope_contract.json",
  "trading_lab_step116_read_only_provider_request_envelope_validation_contract.json",
  "trading_lab_step116_read_only_provider_request_envelope_validation_preflight.json",
  "trading_lab_step116_read_only_provider_response_envelope_contract.json",
  "trading_lab_step116_read_only_snapshot_normalization_contract.json",
  "trading_lab_step116_read_only_snapshot_normalization_validator_fixtures.json",
  "trading_lab_step116_read_only_snapshot_risk_input_contract.json",
  "trading_lab_step116_read_only_snapshot_risk_input_validator_fixtures.json",
  "trading_lab_step116_private_shadow_order_intent_contract.json",
  "trading_lab_step116_private_shadow_order_intent_validator_fixtures.json",
  "trading_lab_step116_private_shadow_intent_audit_event_contract.json",
  "trading_lab_step116_private_shadow_intent_audit_event_validator_fixtures.json",
  "trading_lab_step116_private_shadow_runtime_review_packet_contract.json",
  "trading_lab_step116_private_shadow_runtime_review_packet_validator_fixtures.json",
  "trading_lab_step116_private_shadow_operator_access_contract.json",
  "trading_lab_step116_private_shadow_operator_access_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_preflight.json",
  "trading_lab_step116_manual_order_permission_validator_fixtures.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json",
  "trading_lab_step116_live_guarded_order_adapter_implementation_preflight_validator_fixtures.json",
  "trading_lab_step116_redacted_manual_order_permission_template.json",
  "trading_lab_step116_redacted_manual_order_permission_template_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_hash_helper_contract.json",
  "trading_lab_step116_manual_order_permission_hash_helper_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_hash_helper_preflight.json",
  "trading_lab_step116_manual_order_permission_hash_helper_preflight_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_contract.json",
  "trading_lab_step116_manual_order_permission_hash_helper_implementation_review_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json",
  "trading_lab_step116_manual_order_permission_hash_input_decision_contract.json",
  "trading_lab_step116_manual_order_permission_owner_local_packet_preparation_handoff_contract.json",
  "trading_lab_step116_manual_order_permission_owner_local_packet_preparation_assertion_contract.json",
  "trading_lab_step116_manual_order_permission_explicit_local_packet_validation_receipt_intake_contract.json",
  "trading_lab_step116_manual_order_permission_owner_explicit_local_packet_path_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_local_validation_execution_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_validation_receipt_recording_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_validation_execution_result_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_validation_receipt_explicit_local_receipt_path_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_result_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_validation_receipt_review_result_recording_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_validation_receipt_review_result_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_import_review_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_import_implementation_review_contract.json",
  "trading_lab_step116_manual_order_permission_import_implementation_review_result_recording_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_import_implementation_review_result_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_import_result_recording_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_import_result_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_recording_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_contract.json",
  "trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_receipt_contract.json",
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_preflight_contract.json",
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_supply_gate_contract.json",
  "trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_contract.json",
  "trading_lab_step116_manual_order_permission_dry_run_replay_execution_result_contract.json",
  "trading_lab_step116_manual_order_permission_shadow_history_review_result_contract.json",
  "trading_lab_step116_live_guarded_order_adapter_review_result_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_preflight_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_preflight_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_result_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_preflight_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_preflight_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_live_guarded_private_worker_implementation_boundary_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_private_worker_boundary_review_result_review_result_recording_result_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_taxonomy_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_taxonomy_contract.json",
  "trading_lab_step116_forbidden_item_unlock_sequence_map_contract.json",
  "trading_lab_step116_forbidden_item_unlock_request_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_review_result_recording_result_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_result_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_review_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_review_result_recording_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_result_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_forbidden_item_unlock_chain_closure_recording_result_review_result_recording_result_contract.json",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_preflight_contract.json",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_contract.json",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_manual_order_permission_hash_preparation_runbook_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight.json",
  "trading_lab_step116_manual_order_permission_import_implementation_preflight_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_packet_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight.json",
  "trading_lab_step116_manual_order_permission_packet_validation_preflight_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json",
  "trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json",
  "trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_preflight_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_runbook_validator_fixtures.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_contract.json",
  "trading_lab_step116_manual_order_permission_validation_result_receipt_review_result_validator_fixtures.json",
  "trading_lab_step116_mock_approval_evidence_receipt.json",
  "trading_lab_step116_mock_approval_evidence_receipt_validator_fixtures.json",
  "trading_lab_step116_redacted_read_only_approval_template.json",
  "trading_lab_step116_owner_read_only_evidence_action_queue_contract.json",
  "trading_lab_step116_redacted_read_only_approval_template_validator_fixtures.json",
  "trading_lab_step116_redacted_approval_hash_helper_contract.json",
  "trading_lab_step116_redacted_approval_hash_helper_validator_fixtures.json",
  "trading_lab_step116_redacted_approval_hash_helper_preflight.json",
  "trading_lab_step116_redacted_approval_hash_helper_preflight_validator_fixtures.json",
  "trading_lab_step116_redacted_approval_packet_validation_contract.json",
  "trading_lab_step116_redacted_approval_packet_validation_preflight.json",
  "trading_lab_step116_redacted_approval_packet_validation_preflight_validator_fixtures.json",
  "trading_lab_step116_redacted_approval_packet_validator_fixtures.json",
  "trading_lab_step116_private_read_only_provider_implementation_preflight.json",
  "trading_lab_step116_private_db_storage_implementation_preflight.json",
  "trading_lab_step116_private_runtime_route_implementation_preflight.json",
  "trading_lab_step116_private_operator_access_implementation_preflight.json",
  "trading_lab_step116_private_shadow_runtime_implementation_preflight.json",
  "trading_lab_step116_read_only_approval_import_implementation_preflight.json",
  "trading_lab_step116_read_only_provider_call_authorization_preflight.json",
  "trading_lab_step116_read_only_provider_call_authorization_review_result_contract.json",
  "trading_lab_step116_read_only_provider_call_authorization_preflight_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_contract.json",
  "trading_lab_step116_read_only_provider_endpoint_allowlist_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight.json",
  "trading_lab_step116_read_only_provider_endpoint_category_validation_preflight_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_request_envelope_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_preflight.json",
  "trading_lab_step116_read_only_provider_response_envelope_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_preflight_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_runbook_contract.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_runbook_validator_fixtures.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_result_contract.json",
  "trading_lab_step116_read_only_provider_response_envelope_validation_result_receipt_review_result_validator_fixtures.json",
  "trading_lab_step116_launch_readiness_plan_contract.json",
  "trading_lab_step116_trading_rules_and_risk_limits_review_contract.json",
  "trading_lab_step116_paper_shadow_operational_test_plan_contract.json",
  "trading_lab_step116_live_guarded_manual_test_plan_contract.json",
  "trading_lab_step116_public_dashboard_router_review_plan_contract.json",
  "trading_lab_step116_alpha_kr_market_boundary_contract.json",
  "trading_lab_step116_broker_contingency_review_contract.json",
  "trading_lab_step116_owner_order_path_assertion_contract.json",
  "trading_lab_step116_kis_personal_order_authority_assertion_contract.json",
  "trading_lab_step116_kis_personal_terms_permission_assertion_contract.json",
  "trading_lab_step116_read_only_approval_packet_preparation_runbook_contract.json",
  "trading_lab_step116_read_only_approval_packet_validation_runbook_contract.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_validator_fixtures.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_preflight_validator_fixtures.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_contract.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_runbook_validator_fixtures.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_contract.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_validator_fixtures.json",
  "trading_lab_step116_read_only_approval_packet_validation_result_receipt_review_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_supply_gate_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_preflight_contract.json",
  "trading_lab_step116_read_only_approval_import_review_result_review_result_recording_result_review_result_recording_result_supply_gate_contract.json",
];

function makeWorkspace() {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "finple-trading-step116-progress-summary-"));
  const processedDir = path.join(workspace, "data", "processed");
  fs.mkdirSync(processedDir, { recursive: true });
  for (const fileName of TRACKED_CONTRACTS) {
    fs.copyFileSync(path.join("data", "processed", fileName), path.join(processedDir, fileName));
  }
  fs.copyFileSync("package.json", path.join(workspace, "package.json"));
  const docTarget = path.join(workspace, DOC_PATH);
  fs.mkdirSync(path.dirname(docTarget), { recursive: true });
  fs.copyFileSync(DOC_PATH, docTarget);
  return workspace;
}

function runSummary(workspace, args = ["--check"]) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd: workspace,
    encoding: "utf8",
  });
}

function readJson(workspace, fileName = CONTRACT) {
  return JSON.parse(fs.readFileSync(path.join(workspace, "data", "processed", fileName), "utf8"));
}

function writeJson(workspace, fileName, value) {
  fs.writeFileSync(path.join(workspace, "data", "processed", fileName), `${JSON.stringify(value, null, 2)}\n`);
}

test("passes with current Step 116 progress summary", () => {
  const workspace = makeWorkspace();
  const result = runSummary(workspace);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /trading_lab_step116_progress_summary\.json/);
});

test("summarizes contract progress while keeping trading locked", () => {
  const workspace = makeWorkspace();
  const result = runSummary(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.progress.trackedContractsTotal, 262);
  assert.equal(report.progress.trackedContractsReady, 262);
  assert.equal(report.progress.trackedContractsRemaining, 0);
  assert.equal(report.progress.requiredNpmScriptsTotal, 304);
  assert.deepEqual(report.progress.authorityExternalBlockersCleared, [
    "owner_order_path_assertion_recorded",
    "kis_personal_order_authority_recorded",
    "kis_personal_terms_permission_assertion_recorded",
  ]);
  assert.equal(report.readiness.contractStackReady, true);
  assert.equal(report.readiness.orderSubmissionAuthorityExternalBlockerCleared, true);
  assert.equal(report.readiness.kisPersonalTermsPermissionExternalBlockerCleared, true);
  assert.equal(report.currentState.kisPersonalTermsPermissionExternalBlockerCleared, true);
  assert.equal(report.readiness.readyForReadOnlyProviderCalls, false);
  assert.equal(report.readiness.readyForPrivateShadowRuntime, false);
  assert.equal(report.readiness.readyForOrderSubmission, false);
  assert.equal(report.readiness.readyForLiveGuardedTrading, false);
});

test("records remaining trading gates instead of approving provider calls or orders", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);

  assert.match(
    report.remainingTradingGates.join("|"),
    /owner_redacted_read_only_approval_packet_import_blocked_pending_owner_packet/,
  );
  assert.match(
    report.remainingTradingGates.join("|"),
    /owner_read_only_evidence_action_queue_ready_import_still_blocked/,
  );
  assert.match(
    report.remainingTradingGates.join("|"),
    /private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access/,
  );
  assert.match(
    report.remainingTradingGates.join("|"),
    /read_only_provider_call_authorization_blocked_pending_owner_packet_and_provider_review/,
  );
  assert.match(
    report.remainingTradingGates.join("|"),
    /read_only_provider_call_authorization_review_result_not_owner_supplied/,
  );
  assert.match(
    report.remainingTradingGates.join("|"),
    /private_operator_access_implementation_review_blocked_pending_private_runtime_review/,
  );
  assert.doesNotMatch(report.remainingTradingGates.join("|"), /owner_order_path_assertion_recorded_orders_still_blocked/);
  assert.doesNotMatch(
    report.remainingTradingGates.join("|"),
    /kis_personal_order_authority_recorded_orders_still_blocked/,
  );
  assert.doesNotMatch(
    report.remainingTradingGates.join("|"),
    /kis_personal_terms_permission_assertion_recorded_orders_still_blocked/,
  );
  assert.match(report.remainingTradingGates.join("|"), /manual_order_permission_packet_not_imported/);
  assert.match(
    report.remainingTradingGates.join("|"),
    /live_guarded_clearance_review_result_bundle_not_owner_supplied/,
  );
  assert.match(report.remainingTradingGates.join("|"), /live_guarded_order_adapter_implementation_review_not_started/);
  assert.match(report.remainingTradingGates.join("|"), /trading_rules_runtime_application_blocked_pending_private_shadow_runtime_review/);
  assert.match(report.remainingTradingGates.join("|"), /paper_shadow_operational_test_execution_blocked_pending_private_runtime_review/);
  assert.match(
    report.remainingTradingGates.join("|"),
    /live_guarded_manual_test_execution_blocked_pending_manual_permission_and_operator_clearance/,
  );
  assert.match(
    report.remainingTradingGates.join("|"),
    /public_dashboard_router_review_blocked_until_live_guarded_review_complete/,
  );
  assert.match(report.remainingTradingGates.join("|"), /homepage_router_change_blocked_until_public_dashboard_review/);
  assert.match(report.remainingTradingGates.join("|"), /public_homepage_router_blocked_until_live_guarded_review_complete/);
  assert.equal(report.readiness.providerCallsAllowed, false);
  assert.equal(report.readiness.orderSubmissionAllowed, false);
  assert.equal(report.readiness.runtimeRouteAllowed, false);
  assert.equal(report.readiness.publicUiAllowed, false);
});

test("rejects stale summary if trading readiness is manually flipped on", () => {
  const workspace = makeWorkspace();
  const report = readJson(workspace);
  report.currentState.readyForOrderSubmission = true;
  report.readiness.readyForLiveGuardedTrading = true;
  writeJson(workspace, CONTRACT, report);

  const result = runSummary(workspace);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /trading_lab_step116_progress_summary\.json is out of date/);
});

test("blocks summary readiness if a tracked contract allows provider calls", () => {
  const workspace = makeWorkspace();
  const envRiskGate = readJson(workspace, "trading_lab_step116_env_risk_gate_contract.json");
  envRiskGate.readiness.providerCallsAllowed = true;
  writeJson(workspace, "trading_lab_step116_env_risk_gate_contract.json", envRiskGate);

  const result = runSummary(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.trackedContractsReady, false);
  assert.equal(report.readiness.contractStackReady, false);
  assert.match(report.evidence.failedMilestones.join("|"), /envRiskGate/);
});

test("blocks summary readiness if runtime artifacts appear too early", () => {
  const workspace = makeWorkspace();
  fs.mkdirSync(path.join(workspace, "server", "src", "routes", "trading"), { recursive: true });

  const result = runSummary(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.noRuntimeArtifacts, false);
  assert.equal(report.readiness.contractStackReady, false);
  assert.match(report.readiness.blockers.join("|"), /forbidden_runtime_artifact/);
});

test("blocks summary readiness if scenario monthly returns CSV appears", () => {
  const workspace = makeWorkspace();
  fs.writeFileSync(path.join(workspace, "data", "processed", "scenario_monthly_returns.csv"), "symbol,date,return\n");

  const result = runSummary(workspace, []);

  assert.equal(result.status, 0, result.stderr);
  const report = readJson(workspace);
  assert.equal(report.checks.scenarioMonthlyReturnsCsvAbsent, false);
  assert.equal(report.readiness.contractStackReady, false);
  assert.match(report.readiness.blockers.join("|"), /scenario_monthly_returns_csv_present/);
});
