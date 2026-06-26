# FINPLE Docs Index

작성일: 2026-06-26

이 문서는 FINPLE 프로젝트 문서를 **현재 실행 우선순위**에 따라 정리한 인덱스다.

## 우선 읽기 순서

```text
P0 경쟁력·지표·데이터·기술부채
→ P1 AI/ML·시나리오·운영안정화
→ P2 고객검증·베타운영·UX
→ P3 교육계정·브랜드·과거 인수인계
```

# P0. 현재 최우선 문서

| 우선순위 | 문서 | 목적 |
| ---: | --- | --- |
| 1 | [FINPLE 바이브코딩 경쟁력·방어력 개선 로드맵](./strategy/FINPLE_VIBE_CODING_COMPETITIVE_MOAT_ROADMAP.md) | 코드 복제 가능성을 넘어 데이터·계산·운영·고객·제휴 방어력을 구축하는 전체 개선순서 |
| 2 | [Portfolio ML 문서 인덱스](./portfolio-ml/README.md) | AI/ML·시나리오·지표 작업선의 현재 진행상태와 문서 읽기 순서 |
| 3 | [핵심 지표 산정정책 및 감사](./portfolio-ml/FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md) | CAGR·MDD·BETA·배당·Calmar·Raw/rolling 기준과 재산출 정책 |
| 4 | [시나리오 분석 제품 명세](./portfolio-ml/FINPLE_SCENARIO_ANALYSIS_PRODUCT_SPEC.md) | 하락확률·손실규모·회복기간·시장비교·확률밴드의 제품 정의 |
| 5 | [시나리오 분석 구현계획](./portfolio-ml/FINPLE_SCENARIO_ANALYSIS_IMPLEMENTATION_PLAN.md) | 시계열 감사부터 API·UI·통계 검증까지 Step 114 실행순서 |
| 6 | [금융데이터 파이프라인 운영기준](./data-sources/FINPLE_DATA_PIPELINE_PLAYBOOK.md) | CSV·Colab·원천자료·가공산출물의 재생성·검수·보관 기준 |
| 7 | [Data Sentinel 규칙](./portfolio-ml/FINPLE_DATA_SENTINEL_RULES.md) | 데이터 이상치 reason code, severity, 수동검수와 운영기준 |
| 8 | [ML 데이터 인벤토리](./portfolio-ml/FINPLE_ML_DATA_INVENTORY.md) | 현재 앱 데이터 소스, 결측, 후보수와 다음 데이터 작업 기준 |

## P0 실행 핵심

```text
지표 산정정책·데이터 계보 확정
→ Golden Portfolio 회귀테스트
→ Patch.js·import 순서 의존성 감사
→ 보안·인증·결제 운영기준 점검
→ Data Sentinel 운영화
```

# P1. AI/ML·시나리오·운영안정화

## AI/ML 전체 계획

- [AI/ML 전체 작업계획](./portfolio-ml/FINPLE_AI_ML_WORK_PLAN.md)
- [포트폴리오 ML·AI 분석 개발노트](./portfolio-ml/FINPLE_PORTFOLIO_ML_AI_ANALYSIS_DEVELOPMENT_NOTE.md)
- [포트폴리오 ML 구현계획](./portfolio-ml/FINPLE_PORTFOLIO_ML_IMPLEMENTATION_PLAN.md)
- [포트폴리오 ML Codex 인수인계](./portfolio-ml/FINPLE_PORTFOLIO_ML_CODEX_HANDOFF.md)
- [AI/ML 진행현황](./portfolio-ml/FINPLE_AI_ML_PROGRESS_2026_06_25.md)

## Data Sentinel·모델 검증

- [Data Sentinel 수동검수 기록](./portfolio-ml/FINPLE_DATA_SENTINEL_MANUAL_REVIEW_2026_06_25.md)
- [Data Sentinel 이상치 실험](./portfolio-ml/FINPLE_DATA_SENTINEL_ANOMALY_EXPERIMENT.md)
- [Data Sentinel 모델 카드](./portfolio-ml/FINPLE_DATA_SENTINEL_MODEL_CARD.md)

## AI 분석 STEP 4

- [AI 분석 Mock Backend](./portfolio-ml/FINPLE_AI_ANALYSIS_MOCK_BACKEND.md)
- [AI 출력 검증기](./portfolio-ml/FINPLE_AI_OUTPUT_VALIDATOR.md)
- [AI 분석 STEP 4 UI Shell](./portfolio-ml/FINPLE_AI_ANALYSIS_STEP4_UI_SHELL.md)
- [AI 분석 Mock API 연결](./portfolio-ml/FINPLE_AI_ANALYSIS_MOCK_API_CONNECTION.md)

## 시나리오 분석 인수인계

- [시나리오 분석 Codex 인수인계](./portfolio-ml/FINPLE_SCENARIO_ANALYSIS_CODEX_HANDOFF.md)

## 인증·결제·MY PAGE

- [인증 운영 체크리스트](./auth-operations-checklist.md)
- [이메일·소셜로그인 인수인계](./auth-social-login-handoff.md)
- [소셜로그인 공급자 설정](./social-login-provider-setup.md)
- [Step 112 결제·MY PAGE 인수인계](./FINPLE_step112_payment_mypage_handoff.md)
- [Step 112-5 MY PAGE 안정화·통합 계획](./FINPLE_step112_5_mypage_stabilization_plan.md)
- [Step 112-6 MY PAGE UI·CSS 인수인계](./FINPLE_step112_6_mypage_ui_handoff.md)
- [2026-06-20 운영·문의·메일 인수인계](./FINPLE_worklog_handoff_2026_06_20.md)

## UI 안정성

- [반응형 UI 인수인계](./FINPLE_responsive_ui_handoff_2026_06_22.md)
- [UI 공통 시각 규칙](./FINPLE_ui_visual_rules.md)
- [정책·업데이트 라우터 TOP 버튼 기준](./FINPLE_legal_routes_top_button.md)

# P2. 고객검증·베타운영·제품 개선

## 베타 공개·운영

- [Step 83 운영 전 최종 점검표](./FINPLE_step83_prelaunch_checklist.md)
- [Step 85 사용자 테스트 시나리오](./FINPLE_step85_user_test_scenarios.md)
- [Step 86 보류 기능·개선 Backlog](./FINPLE_step86_hold_fix_backlog.md)
- [Step 87 베타 공개 체크리스트](./FINPLE_step87_beta_release_check.md)
- [Step 88 베타 공개 공지문](./FINPLE_step88_beta_announcement.md)
- [Step 89 사용자 피드백 수집](./FINPLE_step89_feedback_collection.md)
- [Step 90 베타 운영·개선 로그](./FINPLE_step90_beta_ops_log.md)
- [Step 93 소수 사용자 공유 메시지](./FINPLE_step93_beta_share_messages.md)
- [Step 94 베타 피드백 운영 가이드](./FINPLE_step94_beta_feedback_runbook.md)
- [Step 99 사용자 FAQ](./FINPLE_step99_user_faq.md)
- [Step 102 베타 운영 안정성 점검](./FINPLE_step102_beta_stability_check.md)
- [Step 103 운영용 오류 안내문구 정책](./FINPLE_step103_error_message_policy.md)

## 출시·모니터링

- [Step 106 홈 화면 QA](./FINPLE_step106_home_qa_checklist.md)
- [Step 107 임시 패치 파일 정리](./FINPLE_step107_temp_file_cleanup.md)
- [Step 108 Beta v0.1 마감·Git Tag 준비](./FINPLE_step108_beta_v01_release_tag.md)
- [Step 109 Beta 공개 후 24시간 모니터링](./FINPLE_step109_beta_v01_24h_monitoring.md)

## 제품·브랜드·투자성향

- [투자 MBTI 포트폴리오 매핑 감사](./FINPLE_step110_4_mbti_portfolio_mapping_audit.md)
- [About·브랜드 아이덴티티 인수인계](./FINPLE_about_brand_identity_handoff.md)
- [Updates 사용자 변경내역 작성기준](./FINPLE_updates_worklog_guide.md)

# P3. 데이터 아카이브·교육계정·인수인계 자료

## 데이터 아카이브

- [Colab 아카이브 인벤토리](./data-sources/FINPLE_colab_archive_inventory_20260526.md)
- [CSV·Colab 작업 인수인계](./data-sources/FINPLE_step108_10_csv_colab_handoff.md)

## 교육계정

- [교육계정 작업내역·인수인계](./FINPLE_education_account_worklog_2026_06_14.md)
- [교육계정 구현·운영계획](./FINPLE_education_account_plan.md)
- [2026-06-13 채팅 인수인계](./FINPLE_chat_handoff_2026_06_13.md)

# 문서 관리 기준

- 현재 실행문서는 P0와 P1을 우선 갱신한다.
- 기능 변경이 생기면 관련 구현계획·운영문서·인수인계 문서를 함께 수정한다.
- 데이터 정책 변경은 지표 산정정책과 Data Sentinel 문서에 동시에 반영한다.
- AI·ML 기능은 모델 카드와 검증결과가 없는 상태에서 운영 경쟁력으로 표현하지 않는다.
- 베타 오류와 개선사항은 Step 90 운영로그에 기록한다.
- 사용자 피드백은 Step 89 기준에 따라 P0·P1·P2·HOLD로 분류한다.
- 날짜가 명시된 인수인계 문서는 최신 문서와 충돌할 경우 최신 문서를 우선한다.
## Recent AI Analysis Handoff

- [FINPLE AI Analysis Handoff 2026-06-27](./portfolio-ml/FINPLE_AI_ANALYSIS_HANDOFF_2026_06_27.md)
