# FINPLE Step 114-2 시나리오·Colab 재구축 개발노트

작성일: 2026-07-14  
저장소: `vip930sw/FINPLE`  
기준 브랜치: `main`  
기준 커밋: `c059c2a4555046b05d5bf623d44357d7b5328065`  
상태: 구현 전 기준 확정

## 1. 세이브포인트

대규모 데이터·계산·시뮬레이터 단계 개편 전 상태를 다음 브랜치에 보존한다.

```text
savepoint/pre-step114-2-scenario-colab-2026-07-14
```

이 브랜치는 기준 커밋 `c059c2a4555046b05d5bf623d44357d7b5328065`를 가리킨다.

운영 원칙:

- 세이브포인트 브랜치에는 후속 커밋을 추가하지 않는다.
- 구현 브랜치는 세이브포인트가 아니라 최신 `main`에서 생성한다.
- 회귀 발생 시 `main`을 강제로 세이브포인트로 이동하지 않는다.
- 문제가 있는 PR을 순서대로 revert하고 세이브포인트와 비교해 복구한다.
- 시나리오·Colab·STEP 재배치가 운영 검증될 때까지 세이브포인트 브랜치를 삭제하지 않는다.

## 2. 개편 목적

현재 FINPLE은 자산별 CAGR을 기간 내 동일하게 적용한 결정론적 경로를 중심으로 보여준다. 이 방식은 장기 기준선을 설명하는 데 유용하지만 상승·하락·횡보·회복 과정과 체계적 위험을 충분히 보여주지 못한다.

이번 작업의 목적은 기존 기준 전망을 제거하는 것이 아니라 다음 세 층으로 분리하는 것이다.

```text
A. 기준 전망
- selectedCagr를 이용한 장기 계획 기준선

B. 확률적 변화 경로
- 실제 월간 수익률과 자산 간 공동 움직임을 이용한 분포·경로

C. 외부 충격 시나리오
- 시장·금리·유가·환율 등 조건부 충격의 영향
```

생성형 AI는 숫자를 계산하지 않고 A~C의 검증된 결과를 마지막 단계에서 해석한다.

## 3. 최종 시뮬레이터 단계

기존 STEP 4 AI 분석은 마지막 단계인 STEP 6으로 이동한다.

```text
STEP 1  포트폴리오 설정
STEP 2  포트폴리오 비교
STEP 3  상세 분석 · 기준 전망
STEP 4  확률 분석
STEP 5  충격 분석
STEP 6  AI 분석
```

사용자 흐름:

```text
구성
→ 비교
→ 선택 포트폴리오 상세 이해
→ 확률적 불확실성 확인
→ 외부 충격 민감도 확인
→ AI 통합 해석
```

라우터는 초기에는 `/simulator`를 유지하고 내부 step 상태로 구분한다. 직접 링크, 새로고침 복원, 저장 포트폴리오 선택 상태가 깨지지 않도록 step migration을 별도 작업으로 수행한다.

## 4. 단계별 차트 책임

### 4.1 STEP 2 — 복수 포트폴리오 비교

목적:

- 여러 포트폴리오의 동일 조건 기준 전망 비교
- 어떤 포트폴리오를 상세 분석할지 선택

차트 원칙:

- 현재 실질 평가금액 비교선을 유지한다.
- 내부 계산 포인트는 연 단위에서 월 단위로 전환한다.
- X축 라벨은 기간에 따라 연·분기 간격으로 축약한다.
- tooltip은 정확한 `N년 N개월`과 월별 평가금액을 표시한다.
- 복수 포트폴리오 확률 밴드는 겹쳐 표시하지 않는다.
- 확률 비교가 필요한 경우 P10/P50/P90 최종값, 손실확률, MDD를 표 또는 막대차트로 요약한다.

### 4.2 STEP 3 — 단일 포트폴리오 상세 분석

목적:

- 기준 전망의 평가금액 구성과 장기 누적 구조 설명

권장 차트:

1. 월간 평가금액 경로
   - 명목 평가금액
   - 물가 반영 평가금액
   - 누적 납입금
2. 연간 누적 구성 막대
   - 누적 납입금
   - 누적 수익금
   - 누적 배당금

내부 계산은 월 단위로 수행하되 누적 구성 막대는 연말 또는 주요 시점만 표시한다.

### 4.3 STEP 4 — 확률 분석

기본적으로 한 번에 하나의 포트폴리오만 확률 밴드로 표시한다.

메인 차트:

```text
기준 CAGR 전망             점선
P50 중앙 경로              굵은 실선
P25~P75                    진한 음영
P10~P90                    옅은 음영
선택적 대표 변화 경로       얇은 실선
누적 납입금                보조선
```

하단 지표:

- 1년 보유 손실확률
- 3년·5년 원금 미달확률
- 목표금액 달성확률
- 시나리오 MDD 중앙값과 하위 위험값
- 평균·최장 회복기간
- 미회복 시나리오 비율

복수 포트폴리오 비교는 밴드 중첩 대신 탭, 비교표, P10/P50/P90 막대차트를 사용한다.

### 4.4 STEP 5 — 외부 충격 분석

확률 분석과 분리된 조건부 분석으로 제공한다.

초기 preset 후보:

- 주식시장 급락
- 금리 급등
- 유가·지정학 충격
- 원·달러 환율 급등·급락
- 사용자 지정 시장충격

MVP는 데이터가 검증된 요인부터 제공한다. 근거가 부족한 요인의 숫자를 사건명에 맞춰 임의로 하드코딩하지 않는다.

차트:

1. 선택 포트폴리오
   - 기준 경로
   - 충격 경로
   - 충격 발생시점
   - 회복시점
2. 복수 포트폴리오
   - 충격 손실률 막대
   - 회복기간
   - 목표도달 지연기간

### 4.5 STEP 6 — AI 분석

AI는 STEP 2~5의 검증된 결과만 해석한다.

허용:

- 기준 성장성 해석
- 하방위험과 회복력 해석
- 포트폴리오 간 차이 설명
- 데이터 품질과 분석 한계 고지

금지:

- CAGR, MDD, BETA, 손실확률 재계산
- 근거 없는 수치 생성
- 미래수익 보장
- 매수·매도 지시
- 사용자 적합성 단정

## 5. 데이터 시간 해상도

권장 기준:

```text
원천 가격 보관       가능한 경우 일별
장기 지표 산출       월말 가격 + 필요 시 일별 MDD
시나리오 입력        월간 수익률
차트 포인트          월별
X축 문자 표시        투자기간에 따른 adaptive tick
```

일별 데이터는 과거 실제 MDD, 분할 검증, 급락구간 확인에 사용한다. 장기 시나리오와 사용자 차트는 월 단위를 기본으로 한다.

구분 필드:

```text
historicalMddDaily
scenarioMddMonthly
```

두 값을 같은 정의로 섞지 않는다.

## 6. 가격·수익률 기준

원천 가격은 다음을 구분한다.

```text
close
splitAdjustedClose
totalReturnAdjustedClose
cashDividend
splitFactor
```

기본 정책:

- `selectedCagr`는 배당률 별도 표시와의 중복을 피하기 위해 가격수익 기준을 우선한다.
- 총수익 시계열은 내부 참고·시나리오 옵션으로 분리한다.
- 분할·배당 조정 근거와 공급자 설명을 manifest에 기록한다.
- adjusted close 정의를 확인하지 못한 소스는 자동 publish하지 않는다.

## 7. Colab 운영 구조

Colab은 월마다 Codex가 수정하는 일회성 노트북이 아니라 반영구 운영도구로 만든다.

구조:

```text
notebooks/FINPLE_MONTHLY_METRICS_ONE_CLICK.ipynb
- CONFIG 확인
- 입력·키 확인
- Run all
- 요약·감사 결과 확인
- ZIP 다운로드

scripts/metrics_pipeline/
- source adapter
- normalization
- corporate action audit
- monthly return builder
- rolling metrics
- scenario input export
- audit report
- manifest
```

노트북에는 핵심 계산식을 복제하지 않는다. 저장소 Python 모듈을 불러와 한 개의 진입함수만 실행한다.

```python
run_finple_monthly_metrics_pipeline(CONFIG)
```

반영구 사용 필수요건:

- 최근 완료 월말 자동 선택
- 증분 갱신
- checkpoint·resume
- 실패 ticker 재시도
- rate limit 대응
- 입력 파일 SHA256
- pipeline/schema/policy/adapter version 기록
- raw source 불변 보관
- critical validation 실패 시 app export 생성 금지
- review_required 분리
- output ZIP 자동 생성

## 8. 무료 운영 단계의 소스 정책

매출 발생 전에는 유료 공급자를 연결하지 않는다.

초기 adapter 우선순위:

1. 업로드된 원천 CSV·공공데이터
2. 한국 공공데이터 API adapter
3. 승인 전 연구용 adapter
4. 향후 유료 공급자 adapter

모든 adapter는 다음 메타데이터를 반환해야 한다.

```text
sourceId
retrievedAt
licenseStatus
internalUseAllowed
commercialDerivedDisplayAllowed
redistributionAllowed
priceAdjustmentBasis
publicationEligibility
```

`publicationEligibility != approved`인 데이터는 연구·감사 결과까지만 생성하고 운영 app export로 자동 승격하지 않는다.

## 9. 확률 경로 방식

MVP 기본 방식은 동일 날짜 정렬을 보존하는 공동 월간 Block Bootstrap이다.

```text
동일 월의 모든 자산·벤치마크·환율 수익률 정렬
→ 6개월 또는 12개월 블록 공동 추출
→ 투자기간만큼 연결
→ 리밸런싱·월 납입·물가 반영
→ 수천 개 경로 생성
```

금지:

- 자산별 독립 월 추출
- 자산별 손실확률 단순 가중평균
- 연간 상승·하락 부호만 독립 추첨
- Bootstrap 경로에 BETA 재적용
- MDD를 연간 수익률에 직접 혼합

CAGR의 역할:

- 장기 기준 전망의 중심값
- 필요할 경우 시뮬레이션 장기 중앙값 calibration의 기준
- 각 경로에 동일한 수익률을 강제하는 값이 아님

MDD의 역할:

- 생성된 NAV 경로의 결과값
- 역사적 분포와 시뮬레이션 분포의 검증값
- 급락의 발생빈도나 연간 부호를 직접 결정하는 입력값이 아님

## 10. 납입금·NAV 분리

두 경로를 분리한다.

```text
평가금액 경로
- 초기 투자금
- 월 납입금
- 배당·재투자
- 물가 반영

위험 NAV 경로
- 외부 납입금 제외
- 순수 시장수익률과 리밸런싱만 반영
- MDD·회복기간 계산에 사용
```

월 납입 시점은 하나로 고정하고 문서화한다.

권장 초기 정책:

```text
월초 납입
(전월 평가금액 + 월 납입금) × (1 + 월 수익률)
```

기존 FINPLE 계산과 결과 차이가 크면 migration report를 생성하고 운영 정책을 확정한다.

## 11. 재현성과 감사

각 실행에는 다음을 기록한다.

```text
metricBaseDate
pipelineVersion
schemaVersion
calculationPolicyVersion
scenarioVersion
source hashes
randomSeed
simulationCount
blockMonths
rebalanceFrequency
returnBasis
currencyMode
dataStartDate
dataEndDate
```

동일 데이터·정책·seed에서는 동일 결과가 나와야 한다.

## 12. 추가 안전장치

- Golden Portfolio fixture를 만든다.
- 월간 경로와 기존 연간 최종값의 migration tolerance를 정의한다.
- 대표 US·KR ticker를 자동검사한다.
- 한국 ticker는 항상 문자열 6자리로 보존한다.
- proxy와 실제 자산을 명시적으로 구분한다.
- 환헤지 ETF와 비헤지 ETF를 같은 proxy로 처리하지 않는다.
- 상장기간 부족 자산은 확률 분석에서 제외하거나 coverage 경고를 표시한다.
- 데이터가 없는 자산에 합성 확률값을 만들어 넣지 않는다.
- STEP 4·5 실행 전 dataQuality grade를 표시한다.
- 모바일에서는 6단계 nav를 가로 스크롤 또는 `현재 단계 / 6` 형태로 축약한다.
- PDF에는 기준·확률·충격을 서로 다른 섹션으로 출력한다.
- 분석 결과 캐시 키에 데이터버전·정책버전·seed를 포함한다.

## 13. 기존 문서와의 우선순위

이 문서는 다음 기존 문서의 통계·데이터 원칙은 유지하되 UI 단계배치와 월간 운영구조를 최신화한다.

- `FINPLE_SCENARIO_ANALYSIS_PRODUCT_SPEC.md`
- `FINPLE_SCENARIO_ANALYSIS_IMPLEMENTATION_PLAN.md`
- `FINPLE_SCENARIO_ANALYSIS_CODEX_HANDOFF.md`
- `FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md`
- `FINPLE_COLAB_ONE_CLICK_WORKFLOW.md`

충돌 시 2026-07-14 이후의 본 문서와 Step 114-2 인수인계 문서를 우선한다.

## 14. 이번 문서 PR의 범위

이번 PR은 문서와 인수인계만 변경한다.

변경하지 않는 영역:

- 런타임 UI·CSS
- 기존 STEP 계산
- 운영 CSV
- 인증·결제·DB
- Render·Vercel 설정
- Trading·KIS·주문 기능
- AI API 계약
