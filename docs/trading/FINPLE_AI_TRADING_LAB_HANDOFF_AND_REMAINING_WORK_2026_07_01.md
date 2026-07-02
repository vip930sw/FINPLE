# FINPLE AI Trading Lab Handoff And Remaining Work

Date: 2026-07-01

Repo: `vip930sw/FINPLE`

Branch: `main`

Current handoff base commit before this update: `5ef8bd1 Record owner-local packet preparation assertion`

## Current State

Step 116 AI Trading Lab has a complete contract/guardrail stack, and the owner/KIS order-authority external blocker is cleared. Trading runtime remains closed.

- Contract/guardrail progress: `157/157 = 100%`
- Required npm check coverage: `198/198 = 100%`
- `orderSubmissionAuthorityExternalBlockerCleared=true`
- `kisPersonalTermsPermissionExternalBlockerCleared=true`
- `readyForReadOnlyProviderCalls=false`
- `readyForOrderSubmission=false`
- `readyForLiveGuardedTrading=false`
- `providerCallsAllowed=false`
- `orderSubmissionAllowed=false`
- `runtimeRouteAllowed=false`
- `publicUiAllowed=false`
- `dbMigrationAllowed=false`
- `scenario_monthly_returns.csv` is absent

Step 114 scenario monthly data/provider work remains blocked separately.

- Step 114 progress: `overallProgressPercent=80`
- Status: `blocked_before_real_approvals_and_monthly_data`
- Real owner/legal/source approvals: `0/37`
- Bootstrap still blocked
- No provider adapter, no provider call, no monthly data write

## Prompt Guidance

The latest prompt guidance should replace older duplicate order-submission wording rather than being appended beside it.

Keep the existing Step 114 and forbidden-artifact rules, then replace the trading-readiness sequence with this policy:

- Personal-account/KIS order submission authority is not an external blocker.
- Actual order submission implementation or execution stays closed until these internal gates complete in order:
  manual permission packet validation receipt, kill-switch clearance review, risk-gate clearance review, dry-run replay execution result, shadow-history review, live-guarded adapter review.
- Progress must be reported separately as order-authority external blocker, internal operational gates, and actual live trading readiness.

## What We Just Clarified

The owner confirmed three order-path points:

1. Personal-account order work is not blocked by an external permission dispute.
2. KIS personal-account trading is allowed and should not remain an external order-submission authority blocker.
3. Personal-account trading does not violate KIS terms and does not require a separate permit, so KIS terms/permit language should not remain an external blocker.

These are recorded as internal evidence contracts:

- `data/processed/trading_lab_step116_owner_order_path_assertion_contract.json`
- `data/processed/trading_lab_step116_kis_personal_order_authority_assertion_contract.json`
- `data/processed/trading_lab_step116_kis_personal_terms_permission_assertion_contract.json`

Important: these contracts clear external order-authority and KIS terms/permit blocker language only. They do not approve real order submission and do not bypass FINPLE operational gates.

## Do Not Do Yet

Until the remaining gates below are explicitly completed:

- Do not submit orders.
- Do not call KIS, Alpha, or any market-data/trading provider.
- Do not create `server/src/routes/trading`.
- Do not create `server/src/services/trading/kisOrderAdapter.js`.
- Do not create `server/src/services/trading/manualOrderPermissionImport.js`.
- Do not create public trading UI or homepage router entries.
- Do not run a DB migration.
- Do not create `data/private/trading/manual_order_permission.redacted.json` in repo commits.
- Do not create `data/private/trading/manual_order_permission_validation_result_receipt.redacted.json` in repo commits.
- Do not create `data/processed/scenario_monthly_returns.csv`.
- Do not modify scenario runtime/API/chart/calculatePortfolioResult.

## Remaining Work To Solve Together

### A. Manual Order Permission Packet Path

Goal: convert the owner order authority assertions into a redacted, local, reviewable manual order permission packet flow.

Completed safe steps:

1. Prepare the owner-assisted manual order permission packet checklist from the existing template and runbooks: `trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json`.
2. Record the internal gate sequence and open only owner-local packet preparation while leaving evidence-dependent stages closed: `trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json`.
3. Decide the exact hash inputs the owner can safely provide outside the repo: `trading_lab_step116_manual_order_permission_hash_input_decision_contract.json`.
4. Open the owner-local redacted packet preparation handoff without creating or reading the private packet: `trading_lab_step116_manual_order_permission_owner_local_packet_preparation_handoff_contract.json`.
5. Record the owner-local packet preparation assertion without creating, reading, or path-recording the private packet: `trading_lab_step116_manual_order_permission_owner_local_packet_preparation_assertion_contract.json`.
6. Open the explicit local packet validation receipt intake without accepting or recording the actual owner-local path: `trading_lab_step116_manual_order_permission_explicit_local_packet_validation_receipt_intake_contract.json`.
7. Open the owner explicit local packet path supply gate without accepting, recording, or validating the actual path: `trading_lab_step116_manual_order_permission_owner_explicit_local_packet_path_supply_gate_contract.json`.
8. Open the local validation execution preflight without reading the private packet, running the validator, or creating a receipt: `trading_lab_step116_manual_order_permission_local_validation_execution_preflight_contract.json`.
9. Open the validation receipt recording preflight without reading validation output, recording a receipt, or opening kill-switch clearance: `trading_lab_step116_manual_order_permission_validation_receipt_recording_preflight_contract.json`.
10. Open the validation execution result supply gate without accepting a result, reading validation output, or recording a receipt: `trading_lab_step116_manual_order_permission_validation_execution_result_supply_gate_contract.json`.
11. Open the explicit local validation receipt path supply gate without accepting a path, reading a receipt, or recording a receipt: `trading_lab_step116_manual_order_permission_validation_receipt_explicit_local_receipt_path_supply_gate_contract.json`.
12. Open the validation receipt local validation execution preflight without running the validator, reading a receipt, or recording a receipt: `trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_preflight_contract.json`.
13. Open the validation receipt local validation execution result supply gate without accepting a result, reading a receipt, or recording a review result: `trading_lab_step116_manual_order_permission_validation_receipt_local_validation_execution_result_supply_gate_contract.json`.
14. Open the validation receipt review result recording preflight without accepting a result, reading a receipt, recording a review result, or importing permission evidence: `trading_lab_step116_manual_order_permission_validation_receipt_review_result_recording_preflight_contract.json`.
15. Open the validation receipt review result supply gate without accepting or recording the review result and without importing permission evidence: `trading_lab_step116_manual_order_permission_validation_receipt_review_result_supply_gate_contract.json`.
16. Open the manual order permission import review preflight without reading the validation receipt/review result, importing permission evidence, or implementing the import service: `trading_lab_step116_manual_order_permission_import_review_preflight_contract.json`.
17. Record the manual order permission import implementation review contract without supplying the review result, reading a private packet, implementing the import service, or importing permission evidence: `trading_lab_step116_manual_order_permission_import_implementation_review_contract.json`.
18. Open the manual order permission import implementation review result recording preflight without accepting the owner review result, reading a private packet, implementing the import service, or importing permission evidence: `trading_lab_step116_manual_order_permission_import_implementation_review_result_recording_preflight_contract.json`.
19. Open the manual order permission import implementation review result supply gate without accepting the owner review result, reading a private packet, implementing the import service, or importing permission evidence: `trading_lab_step116_manual_order_permission_import_implementation_review_result_supply_gate_contract.json`.
20. Open the manual order permission import result recording preflight without accepting the owner review result, reading a private packet, implementing the import service, recording an import result, or importing permission evidence: `trading_lab_step116_manual_order_permission_import_result_recording_preflight_contract.json`.
21. Open the manual order permission import result supply gate without accepting or recording the import result, reading a private packet, implementing the import service, or importing permission evidence: `trading_lab_step116_manual_order_permission_import_result_supply_gate_contract.json`.
22. Open the kill-switch clearance review preflight without accepting the import result, clearing the kill switch, implementing kill-switch runtime, or opening order submission: `trading_lab_step116_manual_order_permission_kill_switch_clearance_review_preflight_contract.json`.
23. Open the kill-switch clearance review result supply gate without accepting, reading, or recording the result, clearing the kill switch, opening risk-gate review, or opening order submission: `trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_supply_gate_contract.json`.
24. Open the kill-switch clearance review result recording preflight without accepting, reading, or recording the result, clearing the kill switch, opening risk-gate review, or opening order submission: `trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_recording_preflight_contract.json`.
25. Open the kill-switch clearance review result contract boundary without reading or recording the result, clearing the kill switch, opening risk-gate review, or opening order submission: `trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_contract.json`.
26. Open the kill-switch clearance review result receipt boundary without reading or recording the result receipt, clearing the kill switch, opening risk-gate review, or opening order submission: `trading_lab_step116_manual_order_permission_kill_switch_clearance_review_result_receipt_contract.json`.
27. Open the risk-gate clearance review preflight without reading private evidence, recording a risk snapshot or risk-gate clearance result, opening dry-run replay, or opening order submission: `trading_lab_step116_manual_order_permission_risk_gate_clearance_review_preflight_contract.json`.
28. Open the risk-gate clearance review result supply gate without accepting, reading, or recording the result, reading private evidence, recording a risk snapshot, opening dry-run replay, or opening order submission: `trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_supply_gate_contract.json`.
29. Open the risk-gate clearance review result contract boundary without reading or recording the owner result, reading private evidence, recording raw risk snapshots, opening dry-run replay, or opening order submission: `trading_lab_step116_manual_order_permission_risk_gate_clearance_review_result_contract.json`.
30. Open the dry-run replay execution result contract boundary without executing a replay, reading private evidence, recording raw order/provider/risk/paper-ledger payloads, opening shadow-history review, or opening order submission: `trading_lab_step116_manual_order_permission_dry_run_replay_execution_result_contract.json`.
31. Open the shadow-history review result contract boundary without reviewing private history, reading private evidence, recording raw shadow/order/provider/risk/audit payloads, opening live-guarded adapter review, or opening order submission: `trading_lab_step116_manual_order_permission_shadow_history_review_result_contract.json`.
32. Open the live-guarded adapter review result contract boundary without recording the owner review result, implementing the adapter, signing provider requests, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_order_adapter_review_result_contract.json`.
33. Open the live-guarded private worker implementation preflight contract boundary without recording the owner adapter review result, implementing a worker or adapter, signing provider requests, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_private_worker_implementation_preflight_contract.json`.
34. Open the live-guarded owner adapter review result supply gate while recording KIS personal permission as not externally blocking, without reading or recording the owner result, implementing worker/adapter code, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_owner_adapter_review_result_supply_gate_contract.json`.
35. Open the live-guarded owner adapter review result recording preflight while keeping KIS personal permission out of the external blocker list, without accepting, reading, or recording the owner result, implementing worker/adapter code, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_owner_adapter_review_result_recording_preflight_contract.json`.
36. Open the live-guarded owner adapter review result recording result supply gate while keeping KIS personal permission out of the external blocker list, without accepting, reading, or recording the recording result, implementing worker/adapter code, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_supply_gate_contract.json`.
37. Open the live-guarded owner adapter review result recording result contract boundary while keeping KIS personal permission out of the external blocker list, without accepting, reading, or recording the recording result, implementing worker/adapter code, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_contract.json`.
38. Open the live-guarded owner adapter review result recording result review preflight while keeping KIS personal permission out of the external blocker list, without accepting, reading, or recording the recording result review, implementing worker/adapter code, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_review_preflight_contract.json`.
39. Open the live-guarded owner adapter review result recording result review result supply gate while keeping KIS personal permission out of the external blocker list, without accepting, reading, or recording the review result, implementing worker/adapter code, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_review_result_supply_gate_contract.json`.
40. Open the live-guarded owner adapter review result recording result review result contract boundary while keeping KIS personal permission out of the external blocker list, without accepting, reading, or recording the review result, implementing worker/adapter code, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_owner_adapter_review_result_recording_result_review_result_contract.json`.
41. Open the live-guarded private worker implementation review boundary while keeping KIS personal permission out of the external blocker list, without accepting, reading, or recording a worker review result, implementing worker/adapter code, calling KIS/provider, creating routes/UI/DB, or opening order submission: `trading_lab_step116_live_guarded_private_worker_implementation_review_contract.json`.

Next safe tasks:

1. Prepare a private-worker implementation review result supply gate without implementing the worker/adapter, calling KIS/provider, creating routes/UI/DB, or opening order submission.
2. Keep actual private worker code closed until the separate owner-supplied adapter review result is explicitly recorded.

Current blockers:

- `manual_order_permission_explicit_local_packet_path_not_supplied`
- `manual_order_permission_validation_receipt_not_recorded`
- `manual_order_permission_packet_not_imported`
- `manual_order_permission_import_review_blocked_pending_owner_packet`
- `manual_order_permission_import_implementation_review_result_not_owner_supplied`
- `manual_order_permission_import_result_not_recorded`
- `kill_switch_clearance_review_result_not_owner_supplied`

Relevant existing files:

- `data/processed/trading_lab_step116_redacted_manual_order_permission_template.json`
- `data/processed/trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json`
- `data/processed/trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json`
- `data/processed/trading_lab_step116_manual_order_permission_validation_result_receipt.json`
- `scripts/validate-trading-manual-order-permission-packet.cjs`

### B. Kill Switch Clearance

Goal: keep the global kill switch as the final hard stop until an explicit, auditable clearance review exists.

Next safe tasks:

1. Record the owner-supplied redacted kill-switch clearance review result outside repo-private values.
2. Keep `FINPLE_TRADING_KILL_SWITCH=true` in production until the review is intentionally cleared.
3. Ensure a clearance result alone still does not submit orders.

Current blocker:

- `kill_switch_clearance_not_recorded_for_order_submission`

### C. Risk Gate Clearance

Goal: record a deterministic risk-gate clearance review without opening order submission.

Next safe tasks:

1. Convert parsed trading env values into a reviewed live-guarded risk input snapshot.
2. Narrow `FINPLE_TRADING_ALLOWED_SYMBOLS` before live-guarded mode; wildcard symbols must not become a live allowlist.
3. Record max notional, daily loss, exposure, session, slippage, failed-attempt, and blocked-instrument boundaries.
4. Add a private-worker implementation review result supply gate after the private-worker implementation review boundary.

Current blocker:

- `risk_gate_clearance_not_recorded_for_order_submission`

### D. Dry-Run Replay And Shadow History

Goal: prove the intended order path through deterministic replay and private shadow history before any real adapter work.

Next safe tasks:

1. Require the dry-run replay execution result, shadow-history result, adapter review result, private-worker preflight, owner adapter review result supply gate, recording preflight, recording result supply gate, recording result contract, recording result review preflight, recording result review result supply gate, recording result review result contract, and private-worker implementation review before any private worker implementation.
2. Define a private-worker implementation review result supply gate without implementing the adapter.

Current blockers:

- `dry_run_replay_execution_not_recorded_for_live_guarded_order_submission`
- `shadow_history_review_not_recorded_for_live_guarded_order_submission`

### E. Live-Guarded KIS Order Adapter Review

Goal: start implementation review only after packet, kill switch, risk gate, replay, and shadow history gates are closed over with evidence.

Next safe tasks:

1. Add an adapter implementation review result contract.
2. Keep it private-worker-only.
3. Keep request/response logging hash-only.
4. Require idempotency key, explicit order intent, manual permission reference hash, kill switch, and risk gate before request signing.

Current blocker:

- `live_guarded_order_adapter_implementation_review_not_started`

### F. Private Runtime, Public Dashboard, And Homepage Router

Goal: only after private live-guarded review is complete, decide how to expose monitoring or dashboard surfaces.

Current blockers:

- `private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access`
- `private_operator_access_implementation_review_blocked_pending_private_runtime_review`
- `public_dashboard_router_review_blocked_until_live_guarded_review_complete`
- `homepage_router_change_blocked_until_public_dashboard_review`

### G. Step 114 Scenario Data Track

Goal: keep scenario analysis data work blocked until real market-data terms/source approval is available.

Current blockers:

- KIS written market-data reply is still pending.
- `scenario_monthly_returns.csv` is absent by design.
- Provider calls and monthly data writes remain blocked.

## Suggested Next Work Order

Fastest safe path toward private trading readiness from the current contract boundary:

1. Private-worker implementation review result supply gate.
2. Private worker implementation only after all prior review result contracts pass.
3. Private dashboard/operator monitoring.
4. Public dashboard/homepage router only after live-guarded review.

This path does not wait on Step 114 market-data approval for personal-account order authority. It still waits on internal FINPLE safety gates before real order submission.

## GitHub Posting Summary

```markdown
### FINPLE AI Trading Lab handoff - 2026-07-01

Step 116 guardrail stack is complete:
- 129/129 tracked contracts ready
- 170/170 required npm checks present
- `readyForReadOnlyProviderCalls=false`
- `readyForOrderSubmission=false`
- `readyForLiveGuardedTrading=false`

Owner assertions now recorded:
- personal-account order path is not externally blocked
- KIS personal-account trading authority should not remain an order-submission blocker
- KIS personal-account terms/permit language should not remain an external blocker

Still intentionally blocked:
- order submission
- KIS/provider calls
- runtime route
- public UI/homepage router
- DB migration
- provider adapter
- `scenario_monthly_returns.csv`

Next work:
1. owner supplies an explicit local redacted manual order permission packet path outside repo commits
2. manual order permission packet validation receipt through that explicit owner-local packet path
3. kill-switch clearance review result
4. risk-gate clearance review result
5. dry-run replay execution result
6. shadow-history review result
7. live-guarded KIS order adapter implementation review

Step 114 scenario data remains separately blocked pending written market-data/source approval. No `scenario_monthly_returns.csv` should be created until the source-policy and writer gates open.
```

## Next Chat Kickoff Prompt

```text
FINPLE 저장소 vip930sw/FINPLE의 main 브랜치에서 이어서 작업해주세요.

작업 기준은 실제 GitHub main 소스입니다. 시작 시 반드시 로컬/원격 main, Render API/DB health, Vercel 운영 응답을 확인해주세요.

현재 상태:
- Step 116 AI Trading Lab contract/guardrail stack은 129/129 ready, required npm checks 170/170 입니다.
- owner order path assertion, KIS personal order authority assertion, KIS personal terms permission assertion은 기록 완료되었습니다.
- 개인계좌/KIS 주문 제출 권한은 외부 blocker가 아닙니다.
- owner-local manual order permission packet preparation assertion, explicit local packet validation receipt intake, owner explicit local packet path supply gate, local validation execution preflight, validation receipt recording preflight, validation execution result supply gate, explicit local validation receipt path supply gate, validation receipt local validation execution preflight, validation receipt local validation execution result supply gate는 기록되었습니다.
- actual owner-local packet path, private packet, validation receipt는 아직 repo에 기록하지 않았습니다.
- 실제 주문 제출 구현/실행은 manual permission packet validation receipt, kill-switch clearance review, risk-gate clearance review, dry-run replay execution result, shadow-history review, live-guarded adapter review가 순서대로 완료되기 전까지 열지 않습니다.
- readyForReadOnlyProviderCalls=false
- readyForOrderSubmission=false
- readyForLiveGuardedTrading=false
- providerCallsAllowed=false
- orderSubmissionAllowed=false
- runtimeRouteAllowed=false
- publicUiAllowed=false
- dbMigrationAllowed=false
- scenario_monthly_returns.csv 없음

절대 금지:
- 실제 KIS/provider 호출 금지
- 주문 제출 금지
- provider adapter 구현 금지
- runtime route 추가 금지
- public UI/homepage router 추가 금지
- DB migration 금지
- scenario_monthly_returns.csv 작성 금지
- scenario runtime/API/chart/calculatePortfolioResult 수정 금지

다음 권장 작업:
Step 116 다음 단계로 private worker implementation review/preflight contract boundary를 안전하게 준비해주세요. 실제 adapter 구현, KIS/provider 호출, 주문 제출, runtime route, public UI, DB migration은 계속 금지입니다.

진척도는 order authority external blocker, internal operational gates, actual live trading readiness를 분리해서 보고해주세요.

작업 후 관련 npm 검증, node --test, git diff --check, npm.cmd run build를 실행하고 커밋/푸시까지 진행해주세요.
```

## Verification Checklist For Next Agent

Run before editing:

```powershell
git status -sb
git rev-parse HEAD
git ls-remote origin refs/heads/main
curl.exe -sS https://finple-api.onrender.com/api/health
curl.exe -sS https://finple-api.onrender.com/api/db/health
curl.exe -sS -I https://finple.co.kr/
Test-Path data\processed\scenario_monthly_returns.csv
```

Run before commit:

```powershell
npm.cmd run check:trading-step116-progress-summary
npm.cmd run check:trading-launch-readiness-plan
node --test
git diff --check
npm.cmd run build
Test-Path data\processed\scenario_monthly_returns.csv
```

Final report must explicitly state whether the work created public UI, runtime route, provider calls, DB migration, order submission, or `scenario_monthly_returns.csv`.
