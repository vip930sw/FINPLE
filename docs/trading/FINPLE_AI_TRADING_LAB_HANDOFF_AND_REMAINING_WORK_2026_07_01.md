# FINPLE AI Trading Lab Handoff And Remaining Work

Date: 2026-07-01

Repo: `vip930sw/FINPLE`

Branch: `main`

Current handoff commit: `eb14fec Record KIS personal terms permission assertion`

## Current State

Step 116 AI Trading Lab has a complete contract/guardrail stack, and the owner/KIS order-authority external blocker is cleared. Trading runtime remains closed.

- Contract/guardrail progress: `119/119 = 100%`
- Required npm check coverage: `160/160 = 100%`
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

## What We Just Clarified

The owner confirmed three order-path points:

1. Personal-account order work is not blocked by an external permission dispute.
2. KIS personal-account trading is allowed and should not remain an external order-submission authority blocker.
3. Personal-account trading does not violate KIS terms and does not require a separate permit, so KIS terms/permit language should not remain an external blocker.

These are now recorded as internal evidence contracts:

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
- Do not create `data/private/trading/manual_order_permission.redacted.json` unless the owner explicitly asks to prepare/import a private local packet.
- Do not create `data/processed/scenario_monthly_returns.csv`.
- Do not modify scenario runtime/API/chart/calculatePortfolioResult.

## Remaining Work To Solve Together

### A. Manual Order Permission Packet Path

Goal: convert the owner order authority assertions into a redacted, local, reviewable manual order permission packet flow.

Next safe tasks:

1. Prepare the owner-assisted manual order permission packet checklist from the existing template and runbooks. Completed as `trading_lab_step116_manual_order_permission_packet_preparation_checklist_contract.json`.
2. Record the internal gate sequence and open only owner-local packet preparation while leaving evidence-dependent stages closed. Completed as `trading_lab_step116_live_guarded_internal_gate_clearance_sequence_contract.json`.
3. Decide the exact hash inputs the owner can safely provide outside the repo. Completed as `trading_lab_step116_manual_order_permission_hash_input_decision_contract.json`.
4. Prepare hash values and the redacted packet outside repo commits.
5. Validate a redacted packet only through an explicit local path.
6. Record a validation result receipt.
7. Review that receipt before any import implementation work.

Current blockers:

- `manual_order_permission_packet_not_imported`
- `manual_order_permission_import_review_blocked_pending_owner_packet`

Relevant existing files:

- `data/processed/trading_lab_step116_redacted_manual_order_permission_template.json`
- `data/processed/trading_lab_step116_manual_order_permission_hash_preparation_runbook_contract.json`
- `data/processed/trading_lab_step116_manual_order_permission_packet_validation_runbook_contract.json`
- `scripts/validate-trading-manual-order-permission-packet.cjs`

### B. Kill Switch Clearance

Goal: keep the global kill switch as the final hard stop until an explicit, auditable clearance review exists.

Next safe tasks:

1. Add a kill-switch clearance review result contract.
2. Keep `FINPLE_TRADING_KILL_SWITCH=true` in production until the review is intentionally cleared.
3. Ensure a clearance result alone still does not submit orders.

Current blocker:

- `kill_switch_clearance_not_recorded_for_order_submission`

Relevant existing file:

- `data/processed/trading_lab_step116_kill_switch_clearance_contract.json`

### C. Risk Gate Clearance

Goal: record a deterministic risk-gate clearance review without opening order submission.

Next safe tasks:

1. Convert parsed trading env values into a reviewed live-guarded risk input snapshot.
2. Narrow `FINPLE_TRADING_ALLOWED_SYMBOLS` before live-guarded mode; wildcard symbols must not become a live allowlist.
3. Record max notional, daily loss, exposure, session, slippage, failed-attempt, and blocked-instrument boundaries.
4. Add a risk-gate clearance review result contract.

Current blocker:

- `risk_gate_clearance_not_recorded_for_order_submission`

Relevant existing files:

- `data/processed/trading_lab_step116_env_risk_gate_contract.json`
- `data/processed/trading_lab_step116_risk_gate_clearance_contract.json`
- `server/src/services/tradingEnvConfig.js`
- `server/src/services/tradingRiskEngine.js`

### D. Dry-Run Replay And Shadow History

Goal: prove the intended order path through deterministic replay and private shadow history before any real adapter work.

Next safe tasks:

1. Define a dry-run replay execution result contract.
2. Define a shadow-history review result contract.
3. Require both results before any live-guarded adapter implementation review.

Current blockers:

- `dry_run_replay_execution_not_recorded_for_live_guarded_order_submission`
- `shadow_history_review_not_recorded_for_live_guarded_order_submission`

Relevant existing files:

- `data/processed/trading_lab_step116_dry_run_replay_contract.json`
- `data/processed/trading_lab_step116_shadow_history_review_contract.json`

### E. Live-Guarded KIS Order Adapter Review

Goal: start implementation review only after packet, kill switch, risk gate, replay, and shadow history gates are closed over with evidence.

Next safe tasks:

1. Add an adapter implementation review result contract.
2. Keep it private-worker-only.
3. Keep request/response logging hash-only.
4. Require idempotency key, explicit order intent, manual permission reference hash, kill switch, and risk gate before request signing.

Current blocker:

- `live_guarded_order_adapter_implementation_review_not_started`

Relevant existing files:

- `data/processed/trading_lab_step116_kis_order_adapter_design_review.json`
- `data/processed/trading_lab_step116_live_guarded_order_adapter_implementation_preflight.json`

### F. Private Runtime, Public Dashboard, And Homepage Router

Goal: only after private live-guarded review is complete, decide how to expose monitoring or dashboard surfaces.

Next safe tasks:

1. Finish private runtime/operator-access implementation reviews.
2. Create a private operational dashboard plan.
3. Only then review public UI or homepage router work.

Current blockers:

- `private_shadow_runtime_implementation_review_blocked_pending_owner_packet_and_operator_access`
- `private_operator_access_implementation_review_blocked_pending_private_runtime_review`
- `public_dashboard_router_review_blocked_until_live_guarded_review_complete`
- `homepage_router_change_blocked_until_public_dashboard_review`

### G. Step 114 Scenario Data Track

Goal: keep scenario analysis data work blocked until real market-data terms/source approval is available.

Next safe tasks after KIS or alternate source approval:

1. Record the written approval or rejection.
2. Complete owner/legal/source approval import.
3. Approve the 17 P0 source-policy rows.
4. Only then review provider adapter and monthly cache writer work.
5. Generate and validate `scenario_monthly_returns.csv`.
6. Unlock Bootstrap.
7. Only then resume scenario runtime/API/chart/calculation work.

Current blockers:

- KIS written market-data reply is still pending.
- `scenario_monthly_returns.csv` is absent by design.
- Provider calls and monthly data writes remain blocked.

## Suggested Next Work Order

Fastest safe path toward private trading readiness:

1. Manual order permission packet preparation guidance.
2. Manual order permission packet validation result receipt path.
3. Kill-switch clearance review result contract.
4. Risk-gate clearance review result contract.
5. Dry-run replay execution result contract.
6. Shadow-history review result contract.
7. Live-guarded KIS order adapter implementation review contract.
8. Private worker implementation only after all above pass.
9. Private dashboard/operator monitoring.
10. Public dashboard/homepage router only after live-guarded review.

This path does not wait on Step 114 market-data approval for personal-account order authority. It still waits on internal FINPLE safety gates before real order submission.

## GitHub Posting Summary

```markdown
### FINPLE AI Trading Lab handoff - 2026-07-01

Current main: `adf481e`

Step 116 guardrail stack is complete:
- 114/114 tracked contracts ready
- 155/155 required npm checks present
- `readyForReadOnlyProviderCalls=false`
- `readyForOrderSubmission=false`
- `readyForLiveGuardedTrading=false`

Owner assertions now recorded:
- personal-account order path is not externally blocked
- KIS personal-account trading authority should not remain an order-submission blocker

Still intentionally blocked:
- order submission
- KIS/provider calls
- runtime route
- public UI/homepage router
- DB migration
- provider adapter
- `scenario_monthly_returns.csv`

Next work:
1. manual order permission packet preparation and validation receipt
2. kill-switch clearance review result
3. risk-gate clearance review result
4. dry-run replay execution result
5. shadow-history review result
6. live-guarded KIS order adapter implementation review

Step 114 scenario data remains separately blocked pending written market-data/source approval. No `scenario_monthly_returns.csv` should be created until the source-policy and writer gates open.
```

## Next Chat Kickoff Prompt

```text
FINPLE 저장소 vip930sw/FINPLE의 main 브랜치에서 이어서 작업해주세요.

작업 기준은 실제 GitHub main 소스입니다. 시작 시 반드시 로컬/원격 main, Render API/DB health, Vercel 운영 응답을 확인해주세요.

현재 handoff 기준 커밋은 adf481e Record KIS personal order authority assertion 입니다.

현재 상태:
- Step 116 AI Trading Lab contract/guardrail stack은 114/114 ready, required npm checks 155/155 입니다.
- owner order path assertion과 KIS personal order authority assertion은 기록 완료되었습니다.
- 개인계좌 주문 권한은 외부 blocker로 보지 않습니다.
- 그러나 실제 주문 제출은 아직 금지입니다.
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
Step 116 다음 단계로 manual order permission packet preparation/validation receipt, kill-switch clearance review result, risk-gate clearance review result, dry-run replay execution result, shadow-history review result를 묶어서 안전하게 진행해주세요.

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
