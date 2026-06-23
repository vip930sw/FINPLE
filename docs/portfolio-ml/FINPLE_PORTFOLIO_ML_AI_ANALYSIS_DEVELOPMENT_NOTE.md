# FINPLE Portfolio ML / AI Analysis Development Note

작성일: 2026-06-23  
대상 저장소: `vip930sw/FINPLE`  
단계: Step 113 기획·인수인계  
상태: 개발 착수 전 기준 문서

## 1. 문서 목적

이 문서는 FINPLE의 포트폴리오 머신러닝과 사용자용 AI 분석 기능을 개발할 때 지켜야 할 제품 방향, 기능 경계, 코드 구조, 데이터 계약, 검증 기준을 정의한다.

목표는 다음과 같다.

1. 기존 포트폴리오 시뮬레이터의 계산 결과를 훼손하지 않는다.
2. 머신러닝을 미래 수익률 예측이나 종목 추천 기능으로 오해하지 않도록 범위를 제한한다.
3. 데이터 품질 검증, 자산 특성 분류, 포트폴리오 위험 해석을 단계적으로 도입한다.
4. 사용자에게 보이는 기능은 `AI 분석`으로 통일한다.
5. Codex가 작은 작업 단위로 안전하게 구현할 수 있도록 기준점을 제공한다.

---

## 2. 핵심 결론

FINPLE의 포트폴리오 ML은 다음 세 계층으로 구성한다.

```text
ML-01 Data Sentinel
자산 데이터 품질·이상치 검증

ML-02 Asset DNA
자산 역할·유사도·실질적 노출 분류

AI Analysis
검증된 계산값과 ML 결과를 사용자 문장으로 해석
```

사용자에게는 머신러닝 내부 구조를 전부 메뉴로 노출하지 않는다.

```text
사용자 메뉴명: AI 분석
위치: 포트폴리오 시뮬레이터 STEP 4
초기 라우터: /simulator 내부 탭
```

다음 구조는 만들지 않는다.

```text
상단 최상위 메뉴에 독립 AI 분석 추가
/simulator와 분리된 독립 입력 화면
AI가 CAGR·MDD·BETA·예상 평가금액을 다시 계산
AI 종목 추천 또는 매수·매도 지시
미래 수익률 예측을 핵심 기능으로 표시
```

---

## 3. 현재 FINPLE 구조 기준

### 3.1 현재 시뮬레이터 탭

현재 구현은 다음 세 단계다.

```text
settings = STEP 1 시뮬레이터
compare  = STEP 2 포트폴리오
 detail  = STEP 3 상세분석
```

관련 파일:

```text
src/components/PersonalPage.jsx
src/components/PortfolioSimulator.jsx
src/components/portfolio/components/SimulatorTabNav.jsx
src/components/portfolio/components/DetailPanel.jsx
src/components/portfolio/hooks/usePortfolioSimulator.js
src/components/portfolio/utils/portfolioCalculations.js
```

### 3.2 현재 상세분석의 역할

`DetailPanel.jsx`는 다음 정보를 표시한다.

```text
포트폴리오 종합 진단
예상 평가금액
CAGR
BETA
MDD
Calmar
배당률
자산 역할 비중
리스크 진단
활용 방향 및 개선 제안
분석 조건
연차별 성과
성장 차트
상세 자산표
```

현재 상세분석은 계산 엔진과 규칙형 문구를 기반으로 한다. AI 분석은 이를 대체하지 않고 별도 Step에서 확장한다.

### 3.3 현재 라우팅 특성

FINPLE은 별도 라우터 라이브러리보다 `App.jsx`, `PersonalPage.jsx`, History API와 내부 상태를 조합해 라우팅한다.

과거 독립 상세분석 라우터를 만들었을 때 기존 CSS, 상태, 푸터, 데이터 흐름과 분리되는 문제가 있었다. 따라서 AI 분석 MVP에서는 신규 최상위 라우터를 만들지 않는다.

---

## 4. 제품 용어

### 4.1 사용자에게 표시할 용어

| 내부 용어 | 사용자 표시 |
|---|---|
| Portfolio ML | AI 분석 기반 기술 또는 표시 생략 |
| Data Sentinel | 데이터 신뢰도 |
| Asset DNA | 자산 역할 / 유사자산 |
| Portfolio Insight | AI 분석 |
| anomaly | 검토 필요 항목 |
| confidence | 분석 신뢰도 |
| peer deviation | 유사자산 대비 편차 |

### 4.2 사용 금지 또는 제한 용어

```text
AI 투자 추천
AI 맞춤 투자
AI 포트폴리오 처방
AI 종목 추천
매수 추천
매도 추천
수익 가능성
상승 확률
적정 매수가
이 비중으로 투자하세요
```

### 4.3 권장 문구

```text
AI 분석 생성
포트폴리오 구조 분석
데이터 신뢰도 확인
실질적 분산 효과
주요 위험요인
자산 역할 분석
분석 결과는 참고자료이며 투자 권유가 아닙니다
```

---

## 5. 기능 범위

## 5.1 ML-01 Data Sentinel

### 목적

자산별 CAGR, BETA, MDD, 배당률, 상장기간, 가격 데이터의 오류 가능성을 자동 탐지한다.

### 초기 검증 대상

```text
CAGR 비정상 고·저값
MDD 양수 또는 범위 오류
BETA 비정상값
배당률 과대값
상장기간보다 긴 지표기간
수정주가·분할 미반영 가능성
한국 종목코드 앞자리 0 누락
동일 지수 ETF 간 과도한 편차
결측값과 0의 혼동
짧은 상장 이력
```

### 초기 구현 원칙

1. 규칙 기반 Baseline을 먼저 만든다.
2. 이후 Isolation Forest 등 비지도 이상치 탐지를 추가한다.
3. 모델 결과만으로 자동 수정하지 않는다.
4. `review_required` 목록을 관리자 또는 CSV로 출력한다.
5. 사람이 승인한 결과를 검수 라벨로 축적한다.

### 사용자 노출

사용자에게 전체 오류 상세를 직접 노출하지 않는다.

```text
데이터 신뢰도: 높음 / 보통 / 확인 필요
확인 완료 자산: 4개
짧은 상장 이력: 1개
검토 필요 지표: 배당률 1개
```

관리자용 상세 사유는 별도로 보관한다.

---

## 5.2 ML-02 Asset DNA

### 목적

자산을 단순 자산유형 태그가 아니라 실제 가격·위험 특성으로 분류한다.

### 후보 역할

```text
시장 코어
성장
가치·배당
방어
종합채권
장기국채
인컴
리츠
금·원자재
고변동성 위성자산
현금성
```

### 입력 특성 예시

```text
priceCagr1y / 3y / 5y / 10y
volatility
beta
mdd
dividendYield
correlationToBenchmark
correlationToRates
correlationToUSD
marketCap
assetType
sector
listingYears
```

### 출력 예시

```json
{
  "ticker": "QQQ",
  "primaryRole": "growth",
  "secondaryRoles": ["market_core"],
  "roleConfidence": 0.91,
  "peerGroup": "US_LARGE_CAP_GROWTH_ETF",
  "similarAssets": ["QQQM", "VGT"],
  "riskTags": ["rate_sensitive", "tech_concentration"]
}
```

### 사용자 노출 위치

```text
스크리너 카드
자산 상세 팝업
STEP 3 자산 역할 비중
STEP 4 AI 분석
```

별도 최상위 메뉴는 만들지 않는다.

---

## 5.3 AI Analysis

### 목적

기존 계산값, Data Sentinel 결과, Asset DNA 결과를 결합해 포트폴리오 구조와 위험을 설명한다.

### AI가 해석할 수 있는 범위

```text
포트폴리오 성격
명목 자산 수와 실질 분산도 차이
자산 간 유사성
성장·배당·채권·금·현금 역할
금리·환율·시장 민감도
집중 위험
상장 이력과 데이터 한계
현재 투자기간과 위험 구조의 관계
```

### AI가 계산하면 안 되는 값

```text
CAGR
BETA
MDD
Calmar
예상 평가금액
실질가치
배당금
자산 비중
```

위 값은 기존 FINPLE 계산 엔진이 단일 진실원천이다.

### AI 출력 예시

```json
{
  "analysisVersion": "ai-analysis-v1",
  "portfolioId": "portfolio-uuid",
  "generatedAt": "2026-06-23T00:00:00.000Z",
  "dataQuality": {
    "score": 88,
    "level": "good",
    "summary": "대부분의 자산 지표가 확인되었습니다.",
    "warnings": ["상장 이력 5년 미만 자산 1개 포함"]
  },
  "portfolioProfile": {
    "title": "성장자산 중심의 중고위험 포트폴리오",
    "summary": "성장자산 비중이 높고 금리 변화에 민감할 수 있습니다."
  },
  "diversification": {
    "nominalAssetCount": 5,
    "effectiveDiversificationLevel": "medium",
    "summary": "자산 수는 5개지만 기술주 노출이 중첩됩니다."
  },
  "riskFactors": [
    {
      "code": "TECH_CONCENTRATION",
      "label": "기술주 집중",
      "severity": "high",
      "evidence": ["QQQ 40%", "VGT 20%"]
    }
  ],
  "assetRoles": [],
  "limitations": [],
  "disclaimer": "본 분석은 투자 권유가 아닌 참고자료입니다."
}
```

---

## 6. 화면 및 라우터 방향

## 6.1 권장 정보구조

```text
포트폴리오 시뮬레이터
STEP 1 시뮬레이터
STEP 2 포트폴리오
STEP 3 상세분석
STEP 4 AI 분석
```

### 초기 구현

```text
라우터: /simulator 유지
탭 키: ai
앵커 ID: ai-analysis
컴포넌트: AiAnalysisPanel.jsx
```

### 초기 수정 예상 파일

```text
src/components/PersonalPage.jsx
src/components/PortfolioSimulator.jsx
src/components/portfolio/components/SimulatorTabNav.jsx
src/components/portfolio/components/AiAnalysisPanel.jsx
src/components/portfolio/services/aiAnalysisService.js
```

### 후속 분리 조건

다음 조건을 모두 만족한 뒤에만 `/simulator/ai-analysis` 하위 라우터를 검토한다.

```text
서버 저장 portfolioId가 안정적으로 존재
새로고침 후 분석대상 복원 가능
분석 결과 저장·조회 API 구현
MY PAGE AI 분석내역 구현
직접 URL 접근 시 로그인·권한 처리 완료
```

---

## 7. Step 3와 Step 4의 책임 분리

| 구분 | STEP 3 상세분석 | STEP 4 AI 분석 |
|---|---|---|
| 핵심 역할 | 수치와 규칙형 리포트 | ML·AI 기반 구조 해석 |
| 단일 진실원천 | 기존 계산 엔진 | 기존 계산값을 읽기만 함 |
| CAGR 등 계산 | 수행·표시 | 재계산 금지 |
| 데이터 신뢰도 | 제한적 | Data Sentinel 결과 표시 |
| 유사자산 | 없음 또는 태그형 | Asset DNA 결과 표시 |
| 문장 생성 | 규칙형 | 구조화 AI 해석 |
| PDF | 기존 리포트 | 후속 단계에서 포함 검토 |
| 장애 시 | 항상 동작해야 함 | 실패해도 Step 3 영향 없음 |

AI 분석 장애로 기존 시뮬레이터가 블랭크가 되면 안 된다.

---

## 8. 아키텍처 원칙

## 8.1 프론트엔드

```text
PortfolioSimulator
├─ SettingsPanel
├─ ComparePanel
├─ DetailPanel
└─ AiAnalysisPanel
```

`AiAnalysisPanel`은 다음 상태를 가진다.

```text
idle
validating
ready_to_generate
generating
success
error
stale
```

AI 분석은 자동 호출하지 않고 버튼으로 생성한다.

```text
AI 분석 생성
다시 생성
분석 저장
```

### 자동 호출을 피하는 이유

```text
API 비용 통제
포트폴리오 편집 중 불필요한 재호출 방지
동일 결과 캐시 가능
사용자 동의와 기대 관리
오류 원인 추적 용이
```

## 8.2 백엔드

권장 신규 파일:

```text
server/src/routes/mlAssetQualityRoutes.js
server/src/routes/aiPortfolioAnalysisRoutes.js
server/src/services/mlAssetQualityService.js
server/src/services/aiPortfolioAnalysisService.js
server/src/services/aiOutputValidator.js
```

권장 API:

```text
POST /api/ml/assets/audit
POST /api/ai/portfolio-analysis
GET  /api/ai/portfolio-analysis/:reportId
GET  /api/ai/portfolio-analysis?portfolioId=...
DELETE /api/ai/portfolio-analysis/:reportId
```

MVP에서는 `POST /api/ai/portfolio-analysis`만 구현해도 된다.

## 8.3 오프라인 ML 실행

Data Sentinel 1차 모델은 Render 실시간 요청에서 직접 학습하지 않는다.

```text
CSV / 원천데이터
→ scripts/ml 학습·감사 스크립트
→ 결과 CSV 또는 JSON
→ 검수
→ 앱 데이터에 반영
```

권장 폴더:

```text
scripts/ml/
notebooks/ml/
data/processed/ml/
server/src/services/ml/
```

---

## 9. 데이터 계약

## 9.1 AI 분석 요청

```json
{
  "portfolioId": "optional-uuid",
  "portfolioName": "장기 포트폴리오",
  "settings": {
    "years": 20,
    "monthlyCashFlow": 1000000,
    "inflationRate": 2.0,
    "dividendReinvest": true
  },
  "metrics": {
    "cagr": 8.7,
    "beta": 0.83,
    "mdd": -27.1,
    "calmar": 0.32,
    "dividendYield": 2.1,
    "futureValue": 854000000,
    "inflationAdjustedFutureValue": 574000000
  },
  "assets": [
    {
      "ticker": "QQQ",
      "market": "US",
      "weight": 40,
      "cagr": 12.0,
      "beta": 1.1,
      "mdd": -35.0,
      "dividendYield": 0.6,
      "dataStatus": "ready_with_metrics"
    }
  ]
}
```

## 9.2 검증 규칙

백엔드는 최소 다음을 검증한다.

```text
자산 비중 합계 허용범위
숫자형 필드 유효성
MDD 부호
CAGR·BETA·배당률 범위
포트폴리오 자산 수 제한
요청 본문 크기
사용자 세션
플랜별 사용량 한도
```

## 9.3 AI 출력 검증

`aiOutputValidator.js`는 다음을 검사한다.

```text
JSON schema 일치
입력에 없는 숫자 생성 금지
매수·매도·추천 표현 금지
수익 보장 표현 금지
티커 오기재 방지
필수 면책문구 포함
길이 제한
```

---

## 10. DB 초안

초기에는 DB 없이 응답만 표시할 수 있다. 저장 기능을 도입할 때 다음 테이블을 검토한다.

### ai_analysis_reports

```text
id
user_id
portfolio_id
analysis_version
model_provider
model_name
input_hash
input_snapshot_json
output_json
validation_status
created_at
updated_at
```

### ml_asset_quality

```text
id
ticker
market
data_version
quality_score
status
anomaly_type
confidence
reason_codes_json
reviewed_by
reviewed_at
created_at
```

### ml_model_versions

```text
id
model_key
version
feature_schema_version
training_data_version
metrics_json
status
created_at
```

---

## 11. Free / Personal 정책 초안

| 기능 | Free | Personal |
|---|---:|---:|
| 데이터 신뢰도 표시 | 요약 | 상세 |
| AI 분석 생성 | 월 제한 | 확대 |
| 위험요인 | 1~2개 | 전체 |
| 실질 분산도 | 요약 | 상세 |
| 유사자산 | 제한 | 제공 |
| 분석 저장 | 제한 또는 미제공 | 제공 |
| PDF 포함 | 미제공 | 제공 검토 |
| 과거 분석내역 | 미제공 | 제공 |

플랜 정책은 개발 전에 확정하지 않고, 사용량과 API 비용 측정 후 결정한다.

---

## 12. 품질 기준

### 12.1 Data Sentinel

```text
규칙형 결과 재현 가능
동일 데이터 버전에서 동일 결과
오류 사유 코드 제공
자동 수정 금지
사람 검수 가능
```

목표 지표 예시:

```text
Precision 90% 이상
Recall 85% 이상
정상값 오탐률 5% 이하
```

### 12.2 AI Analysis

```text
입력 숫자 일치율 100%
존재하지 않는 숫자 0건
금지문구 0건
필수 면책문구 누락 0건
API 실패 시 Step 3 정상 유지
동일 입력 캐시 가능
```

---

## 13. 보안·규제·운영 원칙

1. 외부 AI API 키를 프론트 `VITE_` 환경변수에 넣지 않는다.
2. AI 요청은 Render 백엔드에서만 수행한다.
3. 전체 포트폴리오 입력 스냅샷을 로그에 무단 출력하지 않는다.
4. 이메일, 실명, 결제정보는 AI 모델에 보내지 않는다.
5. 분석 결과는 투자 권유가 아니라는 문구를 항상 표시한다.
6. 특정 종목의 매수·매도·보유를 지시하지 않는다.
7. 모델 버전과 데이터 버전을 기록한다.
8. 오류 정정과 재생성 이력을 남길 수 있도록 설계한다.

---

## 14. 비목표

Step 113~114 초기 범위에서 다음 기능은 개발하지 않는다.

```text
단기 주가 상승·하락 예측
특정 종목 수익률 예측
사용자별 매수 비중 추천
자동 리밸런싱 지시
알고리즘 매매 신호 생성
뉴스 감성으로 매매 신호 생성
자체 대규모 언어모델 학습
완전 자동 투자보고서 게시
```

알고리즘 매매는 별도 프로젝트로 관리하며, 포트폴리오 ML과 공통 데이터 계층만 공유한다.

---

## 15. 최종 구현 원칙

```text
계산은 기존 FINPLE 엔진
검증은 Data Sentinel
분류는 Asset DNA
설명은 AI Analysis
최종 판단은 사용자
```

AI 분석은 FINPLE의 기존 상세분석을 대체하지 않는다. 기존 기능이 항상 우선이며, AI는 검증된 데이터를 설명하는 부가 계층으로만 동작한다.
