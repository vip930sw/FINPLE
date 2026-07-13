# FINPLE Step 114-2 Codex 새 채팅 시작문

아래 블록을 Step 114-2 첫 구현용 Codex 새 채팅에 그대로 붙여 넣는다.

---

```text
FINPLE Step 114-2A 작업을 진행하세요.

저장소:
- vip930sw/FINPLE
- 기본 브랜치 main

먼저 수행:
1. 최신 main을 checkout/pull하고 start SHA를 기록하세요.
2. git status가 clean인지 확인하세요.
3. 저장소 루트와 작업 경로에 AGENTS.md가 있는지 확인하고, 있으면 반드시 따르세요.
4. open PR/branch 중 Step 114-2, scenario, monthly metrics, Colab notebook과 충돌하는 작업이 있는지 확인하세요.
5. 아래 문서를 순서대로 읽으세요.

필수 문서:
- docs/portfolio-ml/FINPLE_STEP114_2_SCENARIO_COLAB_REARCHITECTURE_DEVELOPMENT_NOTE_2026_07_14.md
- docs/portfolio-ml/FINPLE_STEP114_2_WORK_INSTRUCTIONS_AND_HANDOFF_2026_07_14.md
- docs/data-sources/FINPLE_COLAB_ONE_CLICK_WORKFLOW.md
- docs/data-sources/FINPLE_METRICS_CSV_POLICY_V3.md
- docs/data-sources/FINPLE_METRICS_CSV_SCHEMA_V3.md
- docs/portfolio-ml/FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md

세이브포인트:
- savepoint/pre-step114-2-scenario-colab-2026-07-14
- 이 브랜치는 읽기·비교용입니다.
- commit, rebase, force push, delete하지 마세요.
- 새 작업 브랜치는 최신 main에서 만드세요.

이번 작업 범위:
- Step 114-2A Colab skeleton과 offline fixture pipeline만 구현합니다.
- 외부 API나 실제 시장데이터를 호출하지 않습니다.
- 운영 CSV, loader, simulator runtime, UI, CSS, auth, payment, DB, AI, trading 코드를 변경하지 않습니다.
- STEP navigation과 기존 STEP 4 AI 분석을 이동하지 않습니다.

권장 브랜치:
- codex/step114-2a-colab-fixture-pipeline

목표:
1. notebooks/FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb skeleton
2. notebook은 다음 다섯 구간만 사용자에게 명확히 노출
   - 설정 확인
   - 입력 확인
   - 파이프라인 실행
   - 결과 요약
   - ZIP 다운로드
3. notebook의 핵심 계산은 repository Python module을 호출
4. 단일 진입함수
   - run_finple_monthly_metrics_pipeline(CONFIG)
5. offline fixture만으로 end-to-end 실행
6. 다음 output package 생성
   - finple_metrics_output_YYYY_MM.csv
   - finple_metrics_selected_YYYY_MM.csv
   - finple_metrics_review_required_YYYY_MM.csv
   - finple_metrics_audit_report_YYYY_MM.html
   - finple_metrics_manifest_YYYY_MM.json
   - finple_monthly_returns_YYYY_MM.csv
   - ZIP package
7. source input SHA256, pipelineVersion, schemaVersion, calculationPolicyVersion 기록
8. critical validation 실패 시 selected/app export와 ZIP을 publish-ready 상태로 만들지 않기
9. KR ticker leading zero 보존
10. 동일 fixture와 CONFIG에서 핵심 결과 재현

권장 구조:
- notebooks/FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb
- scripts/metrics_pipeline/__init__.py
- scripts/metrics_pipeline/config.py
- scripts/metrics_pipeline/schemas.py
- scripts/metrics_pipeline/pipeline.py
- scripts/metrics_pipeline/audit.py
- scripts/metrics_pipeline/package.py
- scripts/metrics_pipeline/tests/
- data/fixtures/monthly-metrics/

CONFIG 최소 항목:
- metric_base_date
- market_scope
- selected_cagr_policy=rolling_median_all_markets
- current_price_display=false
- total_return_cagr_mode=reference_only
- output_version
- input_mode=fixture
- random_seed 또는 deterministic fixture option

fixture 요구사항:
- US ETF/stock 예시
- KR ETF/stock 예시이며 0으로 시작하는 6자리 ticker 포함
- 충분한 장기 데이터 예시
- short history 예시
- duplicate date 또는 invalid price를 가진 실패 fixture
- split 또는 cash dividend event 예시
- benchmark mapping 예시

테스트:
- normal fixture pipeline 성공
- 동일 입력 재현성
- KR ticker 6자리 보존
- source hash 생성
- critical error에서 publish 차단
- review_required 분리
- output schema column 검증
- ZIP 필수 파일 검증

금지:
- yfinance, KIS, Alpha Vantage, 유료 provider 실호출
- secret 하드코딩
- raw source overwrite
- 기존 2026-05 운영 overlay 수정
- current price/quote 필드 app export 추가
- notebook cell에 계산 로직 복제
- unrelated refactor
- 대규모 UI 변경

검증 명령:
- Python unit tests
- notebook JSON 유효성 검사 또는 nbformat 기반 smoke check
- npm run build는 프론트 코드 미변경이어도 저장소 기준상 필요 여부를 판단해 실행하고 결과를 보고
- git diff --check

PR 규칙:
- 이 작업만 포함한 작은 PR을 생성하세요.
- PR 본문에 start/end SHA, 변경 파일, fixture 가정, 테스트 결과, 운영 영향 없음, rollback, 다음 Step 114-2B를 기록하세요.
- 문서와 구현이 다르면 임의로 확대해석하지 말고 중단해 질문하세요.

완료 보고 형식:
1. 작업 기준과 SHA
2. AGENTS 및 충돌 확인
3. 구현 내용
4. 생성 파일
5. 테스트 결과
6. 운영 영향
7. 알려진 한계
8. commit/push/PR
9. 다음 Step 114-2B 준비사항
```

---

## 후속 Codex 채팅 원칙

Step 114-2A가 merge된 뒤 새 채팅에서 `FINPLE_STEP114_2_WORK_INSTRUCTIONS_AND_HANDOFF_2026_07_14.md`의 다음 PR 하나만 지정한다.

한 채팅에서 114-2B~J를 연속 구현하지 않는다. 각 PR이 merge되고 main이 갱신된 뒤 다음 작업을 시작한다.
