# FINPLE AI Trading Lab 및 Signal 개발 로드맵

작성일: 2026-06-27  
대상 저장소: `vip930sw/FINPLE`  
상태: Step 114 완료 후 착수 예정인 신규 개발 기준 문서

## 1. 문서 목적

이 문서는 FINPLE의 `데이터 신뢰도 보강 및 시나리오 분석` 이후 진행할 개인계좌 AI 자율운용, 미국주식·레버리지 ETF 거래, 달러·환율 운용, 회원 대상 단방향 매매신호, 유사투자자문업 및 장기 로보어드바이저 확장 방향을 하나의 개발 기준으로 정리한다.

핵심 결론은 다음과 같다.

```text
Step 114 데이터·지표·시나리오 분석
→ 필수 연결 Gate
→ Step 116 FINPLE AI Trading Lab
→ 자기계좌 Paper / Shadow / Live 운용
→ Step 117 FINPLE Signal
→ 장기 Step 118 정식 로보어드바이저
```

AI 투자대행은 기존 공개용 `STEP 4 포트폴리오 AI 분석`의 기능 확장이 아니라, 별도 서버·DB·API·출력검증·약관을 사용하는 독립 작업선으로 구현한다.

---

## 2. 현재 확정된 계좌 및 운용 전제

### 2.1 계좌 구분

| 계좌 | 현재 상태 | 용도 |
| --- | --- | --- |
| 미래에셋 계좌 | 기존 장기투자 운용 중 | 장기투자·수동운용 유지 |
| 한국투자증권 일반 종합계좌 | 현재 비어 있음 | FINPLE AI Trading Lab 전용 |

한국투자증권 계좌는 다음 조건이 확인되었다.

```text
일반 종합 주식계좌: 확인
해외증권 거래: 확인
해외 ETP 거래: 확인
레버리지 ETF 거래 경험·요건: 확인
USD 환전: 확인
통합증거금: 개발 착수 전 재확인
KIS Open API 연결: 개발 착수 시 수행
해외주식 매수가능금액·USD 증거금 조회: 개발 착수 시 수행
```

신규 계좌를 추가 개설할 필요는 없으며, 비어 있는 한국투자증권 계좌를 자동매매 전용으로 사용한다.

### 2.2 초기 자금

```text
예정 실험자금: 500만~1,000만 원
1차 실전 검증: 100만 원
2차: 300만 원
3차: 500만 원
최종: 최대 1,000만 원
```

증액 기준은 단기 수익률이 아니라 주문 정확성, 중복주문 방지, 부분체결 처리, 잔고 대사, 위험한도 작동, 장애 대응 결과로 한다.

### 2.3 투자대상

초기 투자 유니버스 후보:

```text
일반 지수 ETF: SPY, QQQ, IWM
상승 레버리지 ETF: TQQQ, UPRO, TNA, SOXL
하락·인버스 ETF: SQQQ, SPXU, TZA, SOXS
기타 검토 대상: BULZ 등 거래 경험이 있는 고변동 ETP
미국 대형주: 유동성이 높은 종목으로 제한
대기자산: USD 현금, KRW 현금
```

초기 제외 또는 별도 승인 대상:

- 옵션·해외선물
- 공매도·신용·대출
- 거래량이 적은 ETP
- 단일종목 레버리지 ETP
- API에서 정상 주문·체결 검증이 끝나지 않은 상품

---

## 3. 달러·환율 운용 정책

### 3.1 통화 자산 구분

AI Trading Lab에서는 현금을 다음처럼 구분한다.

```text
KRW_CASH: 원화 대기자금
USD_CASH: 미국주식 매수재원 및 환율 노출자산
US_EQUITY: 일반 미국주식·ETF
US_LEVERAGED: 레버리지·인버스 ETF
```

미국주식을 매도한 뒤 매번 원화로 환전하지 않는다. 기본 구조는 다음과 같다.

```text
KRW
→ 필요 시 USD 환전
→ USD 현금과 미국주식·ETF 사이에서 매매
→ 환율 모델이 원화전환 기준을 충족할 때만 KRW 환전
```

### 3.2 원화 기준 손익

```text
원화 기준 수익률
= (1 + 달러 기준 자산수익률)
× (1 + USD/KRW 환율수익률)
- 1
```

손익 기록은 반드시 다음을 분리한다.

- 주가손익 USD
- 환율손익 KRW
- 환전비용
- 주식 매매수수료
- 스프레드
- 슬리피지
- 매도 관련 제비용
- 최종 원화 기준 순손익

### 3.3 거래비용 이후 진입 원칙

환차익 또는 주식 기대수익이 양수라는 이유만으로 주문하지 않는다.

```text
순기대수익
= 예상 자산수익
+ 예상 환율수익
+ 복합효과
- 왕복 환전비용
- 주식 왕복 수수료
- 스프레드
- 슬리피지
- 안전버퍼
```

주문 허용 기본원칙:

```text
예상 순수익 > 총거래비용 × 2~3
그리고
예상 순수익 > 모델 오차범위
```

환전 우대율은 고시값만 사용하지 않고 실제 소액 환전 체결내역으로 `FX Cost Profile`을 생성한다.

예시 스키마:

```json
{
  "broker": "KIS",
  "fxBuyCostBps": 8,
  "fxSellCostBps": 8,
  "measuredAt": "2026-06-27",
  "source": "actual_execution"
}
```

### 3.4 환전 자동화 단계

```text
v1 환율 인지형:
환율 데이터 반영 + USD 목표비중 결정 + 환전 필요 알림

v2 반자동 환전:
AI가 환전금액 제시 → 사용자가 앱에서 환전 → USD 잔고 확인 후 자동매매 재개

v3 완전자동 환전:
KIS 개인 Open API의 실제 환전 주문지원 여부 확인 후 결정
```

공개 API에서 환전 주문 기능이 확인되지 않으면, 통합증거금은 주문 실패 방지용 보조수단으로만 사용한다.

---

## 4. FINPLE AI Trading Lab 제품 정의

### 4.1 기능 정의

AI Trading Lab은 사용자 공개서비스가 아니라 대표자 본인계좌의 비공개 자율운용 시스템이다.

AI가 결정할 항목:

- 시장 국면
- 거래대상 선택
- 기대수익 및 상승확률
- 목표비중
- 신규 진입
- 보유 지속
- 손절·익절·청산
- USD·KRW 현금비중
- 레버리지 총노출

고정 위험엔진이 통제할 항목:

- 계좌 최대 투자금
- 종목당 최대 비중
- 레버리지 ETF 총비중
- 일일 최대 손실
- 누적 MDD 한도
- 1회 주문한도
- 중복주문 금지
- 거래시간
- 잔고 불일치 차단
- 장애 시 Kill Switch

핵심 원칙:

> AI가 전략을 결정하고, 위험관리 엔진이 주문 가능 여부를 최종 통제한다.

### 4.2 모델 구성

#### A. 시장 국면 모델

```text
강한 상승
완만한 상승
횡보
고변동
약한 하락
강한 하락
```

후보 모델:

- Hidden Markov Model
- XGBoost
- LightGBM
- Random Forest

#### B. 자산별 기대수익·순위 모델

출력 예시:

```json
{
  "ticker": "TQQQ",
  "upProbability5d": 0.64,
  "expectedReturn5d": 0.031,
  "riskScore": 0.78,
  "regime": "strong_bull"
}
```

#### C. 목표 포지션 정책

```json
{
  "targetPositions": [
    { "ticker": "TQQQ", "targetWeight": 0.35 },
    { "ticker": "SOXL", "targetWeight": 0.20 }
  ],
  "cashWeight": 0.45,
  "rebalanceReason": "BULL_MOMENTUM_HIGH_VOL"
}
```

LLM은 주문수량 결정에 직접 사용하지 않는다. 설명, 운용일지, 뉴스 요약, 경고문 생성 등에만 사용한다.

### 4.3 초기 위험한도 후보

| 항목 | 초기 기본값 후보 |
| --- | ---: |
| 종목당 최대 비중 | 30% |
| 레버리지 ETF 총비중 | 70% |
| 단일종목 레버리지 | 초기 0% |
| 최소 현금비중 | 10% |
| 일일 손실 중지 | -4% |
| 누적 MDD 중지 | -15% |
| 1회 주문한도 | 계좌의 20% |
| 연속 손실 후 중지 | 4회 |
| 주문 재시도 | 최대 1회 |

위 값은 투자수익 목표가 아니라 소프트웨어 오작동과 무제한 손실 방지용 개발 기본값이다.

---

## 5. 기존 FINPLE 개발과의 연결

### 5.1 Step 114가 선행되어야 하는 이유

현재 Step 114는 다음 기반을 구축한다.

- 월간 시계열 정렬
- 가격수익·총수익 구분
- 원·달러 환율 반영
- MDD·Drawdown·회복기간
- Rolling historical baseline
- 공동 Block Bootstrap
- BETA 스트레스 테스트
- 데이터 품질등급
- 분석 버전·데이터 버전

이 결과는 AI Trading Lab에서 다음과 같이 재사용한다.

| Step 114 산출물 | Trading Lab 활용 |
| --- | --- |
| 시계열 정렬 | 백테스트 데이터 기반 |
| 환율 수익률 | 원화 기준 성과 계산 |
| MDD·회복기간 | 전략 위험한도 |
| Block Bootstrap | 전략 스트레스 검증 |
| BETA 스트레스 | 급락장 대응 |
| 데이터 품질등급 | 거래대상 제외 기준 |
| 데이터 버전 | 모델 재현성 |
| 벤치마크 | 초과성과 평가 |

따라서 Step 114 다음에 AI Trading Lab을 배치하는 것은 충돌이 아니라 강한 시너지다.

### 5.2 기존 STEP 4 AI 분석과의 경계

현재 공개용 STEP 4 AI 분석은 다음을 차단한다.

```text
매수
매도
보유 권유
목표비중
수익 보장
입력에 없는 티커·숫자 생성
```

따라서 Trading 기능을 기존 `/api/ai/portfolio-analysis` 또는 기존 output validator에 넣지 않는다.

권장 Trading API:

```text
/api/trading/market-state
/api/trading/signals
/api/trading/target-positions
/api/trading/orders
/api/trading/executions
/api/trading/risk-status
```

기존 공개용 AI validator는 그대로 유지하고 Trading 전용 schema·validator를 별도로 만든다.

### 5.3 데이터 저장소 분리

```text
Analytics Data
- 장기 지표
- 시나리오
- 사용자 분석

Trading Market Data
- 일봉·분봉
- 거래량·스프레드
- 기업행사
- 휴장일·조기폐장
- 환율

Execution Data
- 신호
- 주문
- 체결
- 잔고
- 비용
- 손익
- 위험 이벤트
```

### 5.4 서버 분리

```text
FINPLE Web Backend
- 회원
- 분석
- 결제
- AI 해석
- 시나리오 API

FINPLE Trading Worker
- 비공개
- KIS 개인계좌
- 전략 실행
- 주문·체결
- 잔고 대사
- Kill Switch

Trading DB
- signals
- orders
- executions
- positions
- account_snapshots
- fx_transactions
- cost_profiles
- strategy_versions
- risk_events
```

같은 GitHub 저장소에서 시작할 수 있으나 프로세스, Secret, 배포, DB 권한은 분리한다.

---

## 6. AI Trading Lab 개발순서

## Step 116-0. 아키텍처·운영정책

- 자기계좌 전용 범위 확정
- 지원자산 목록
- 거래시간·매매주기
- 위험한도
- 실전·모의·Shadow 모드
- Kill Switch 정책
- 서버·DB·Secret 분리

## Step 116-1. KIS 해외주식·환율 Adapter

- OAuth·토큰 관리
- USD 잔고
- 해외주식 매수가능금액
- 해외주식 주문
- 정정·취소
- 체결·미체결
- 통합증거금 상태
- 환율·통화별 증거금
- API 오류·재시도 정책

## Step 116-2. 주문·체결 원장

필수 테이블:

```text
signals
orders
executions
positions
account_snapshots
fx_transactions
cost_profiles
strategy_versions
risk_events
```

## Step 116-3. 규칙형 Paper Trading

AI를 넣기 전에 단순 전략으로 주문계층을 검증한다.

- 지정가·시장가
- 중복주문 방지
- 부분체결
- 미체결 취소
- 현금·USD 부족
- 장 마감
- 미국 휴장·조기폐장
- 잔고 대사

## Step 116-4. 비용 포함 Backtest

- 거래수수료
- 환전비용
- 스프레드
- 슬리피지
- 레버리지 ETF 실제 가격경로
- Walk-forward 검증
- 생존자 편향 방지
- 과최적화 점검

## Step 116-5. AI 모델

- 시장 국면 분류
- 종목·ETF 상승확률
- 기대수익 랭킹
- 목표비중
- USD·KRW 비중
- 레버리지 총노출
- 청산 판단

## Step 116-6. Shadow Trading

AI가 실시간 주문안을 만들되 실제 주문은 발송하지 않는다.

완료기준:

```text
중복주문 0건
잔고 불일치 0건
휴장일 오주문 0건
체결상태 누락 0건
모델 신호 재현 가능
손실한도 정상 작동
```

## Step 116-7. Live Trading

```text
100만 원
→ 300만 원
→ 500만 원
→ 최대 1,000만 원
```

---

## 7. FINPLE Signal 및 유사투자자문업

### 7.1 단계 구분

| 단계 | 기능 | 규제상 방향 |
| --- | --- | --- |
| AI Trading Lab | 대표자 자기계좌 자동매매 | 내부 자기자금 운용 |
| FINPLE Signal | 모든 유료회원에게 동일 신호 | 유사투자자문업 검토·신고 |
| FINPLE Robo | 개인별 신호·비중·자동주문 | 투자자문·일임 영역 |

### 7.2 FINPLE Signal 원칙

- 모든 유료회원에게 동일한 신호
- 단방향 발송
- 회원별 보유종목·재산·위험성향 미반영
- 고객 계좌 연결 금지
- 자동주문 프로그램 제공 금지
- 투자 관련 개별질문에 답변 금지
- 결제·계정·기술 문의만 별도 고객지원

권장 메시지 채널:

```text
1순위: FINPLE 웹·앱 Push
2순위: 카카오 채널·브랜드 메시지
3순위: 알림톡 승인 가능 시 사용
```

회원 권한 관리:

```text
결제 성공: signal_entitlement = active
결제 실패: signal_entitlement = grace
유예기간 종료: signal_entitlement = suspended
재결제: signal_entitlement = active
```

공지톡방 수동 강퇴보다 FINPLE 회원 DB 기준 발송대상 자동 제외를 우선한다.

### 7.3 신고 시점

유사투자자문업 신고는 지금 즉시 하기보다 아래 순서로 준비한다.

```text
AI 자기계좌 운용 검증
→ 신호 규격 확정
→ 단방향 발송 구조 확정
→ 전용 약관·환불·운영정책
→ 사전교육·신고
→ 유료 베타 모집
```

기존 FINPLE Personal과 FINPLE Signal은 요금제·약관·면책·결제내역을 분리한다.

### 7.4 이해상충 관리

대표자 계좌 선행매매 논란을 방지한다.

권장 순서:

```text
T0: AI 신호 확정 및 전자서명
T0: 전체 회원 동시 발송
T0 이후: 대표자계좌 주문 허용
```

필수 기록:

- 모델 버전
- 원천데이터 시각
- 신호 생성 시각
- 회원 발송 시각
- 대표자 주문 시각
- 주문가격·체결가격
- 신호 수정·취소
- 대표자 사전 보유 여부

---

## 8. 현재 전체 FINPLE 로드맵에서 남은 과제

### 8.1 Step 114 데이터 신뢰도·시나리오 분석

- 데이터 소스 감사
- 재현 가능한 CAGR·MDD·BETA 엔진
- Raw·Rolling overlay 재생성
- 순수 위험 계산 유틸리티
- Rolling 분석
- 공동 Block Bootstrap
- 시나리오 API
- 시장 비교 UI
- 확률 밴드 UI
- Drawdown·회복기간 UI
- BETA 스트레스 엔진·UI
- 기존 AI 분석 연결
- 운영 안정화

### 8.2 필수 연결 Gate

AI Trading 착수 전 다음을 완료한다.

```text
1. Golden Portfolio 회귀테스트
2. 지표·시나리오 엔진 버전 고정
3. KIS Secret·서버·DB 분리설계
4. Trading 데이터와 Analytics 데이터 경계 확정
```

### 8.3 데이터·ML

- Data Sentinel 운영 파이프라인 연결
- 수동검수 라벨 축적
- 관리자 검수 대기열
- 정기 데이터 갱신 자동화
- Asset DNA 특징·군집·역할 분류
- 대표자산 수동검수

### 8.4 기술부채·보안

- `main.jsx` import 순서 의존성 감사
- `*Patch.js` 기능목록 및 제거 우선순위
- MutationObserver·innerHTML 정리
- 핵심 시뮬레이터 컴포넌트화
- Secret 노출 검사
- 의존성 취약점
- DB 백업·복구
- 관리자 작업·오류로그

### 8.5 고객·사업화

- 사용자 행동 퍼널
- 저장·재방문·결제 전환
- 고객 테스트 및 설문
- Toss 운영 심사·실결제
- Naver 로그인 검수
- 금융교육기관·핀테크기업 PoC
- 상표·특허
- 콘텐츠·유튜브·블로그

### 8.6 GitHub 관리

- 완료 Issue 종료
- 중복·과거 결제 Issue 정리
- HOLD 라벨
- Step 114·116·117 Milestone
- 현재 실행 Issue를 작업선별 1개로 제한

---

## 9. 충돌 검토 결과

| 검토항목 | 판단 | 대응 |
| --- | --- | --- |
| Step 114 시나리오와 Trading | 충돌 없음 | 공통 통계·위험 기반 재사용 |
| 기존 STEP 4 AI 분석 | 직접 결합 시 충돌 | API·validator 완전 분리 |
| 월간 데이터와 단기매매 데이터 | 범위 차이 | Analytics·Trading 데이터 분리 |
| 기존 Render 백엔드와 주문 | 운영상 충돌 위험 | Trading Worker 별도 배포 |
| FINPLE Personal 포지셔닝 | Signal 결합 시 충돌 | 상품·약관·요금제 분리 |
| 자기계좌와 회원 신호 | 이해상충 가능 | 신호·발송·주문 시각 감사로그 |
| 환차익 전략 | 비용 미반영 위험 | 실측 FX Cost Profile 적용 |

최종 판단:

> `데이터 신뢰도 보강 및 시나리오 분석` 다음에 `FINPLE AI Trading Lab`을 개발하는 순서는 적절하다. 단, 기존 공개용 포트폴리오 AI 분석의 확장이 아니라 검증된 분석 인프라를 참조하는 독립형 거래 시스템으로 구현한다.

---

## 10. 다음 실행 문구

Step 114가 완료된 후 신규 작업은 다음 문구로 시작한다.

```text
FINPLE 저장소 vip930sw/FINPLE의 main 브랜치에서 이어서 작업해주세요.

이번 작업은 Step 116-0 — FINPLE AI Trading Lab 아키텍처 및 운영정책 확정입니다.

먼저 아래 문서를 읽어주세요.
- docs/trading/FINPLE_AI_TRADING_SIGNAL_ROADMAP_2026_06_27.md
- docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_IMPLEMENTATION_PLAN.md
- docs/portfolio-ml/FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md
- docs/portfolio-ml/FINPLE_STEP113_AI_ANALYSIS_WORKLOG_AND_NEXT_HANDOFF_2026_06_27.md
- docs/strategy/FINPLE_VIBE_CODING_COMPETITIVE_MOAT_ROADMAP.md

이번 단계에서는 실계좌 주문을 구현하지 말고 다음을 문서와 코드 구조로 확정해주세요.
1. Web Backend와 Trading Worker 분리
2. Trading DB 스키마
3. KIS Secret 및 권한 경계
4. Paper / Shadow / Live 모드
5. 위험한도와 Kill Switch
6. Analytics Data / Trading Market Data / Execution Data 구분
7. PR 분할 및 테스트 계획
```

---

## 11. 관련 기존 문서

- `docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_PRODUCT_SPEC.md`
- `docs/portfolio-ml/FINPLE_SCENARIO_ANALYSIS_IMPLEMENTATION_PLAN.md`
- `docs/portfolio-ml/FINPLE_METRICS_CALCULATION_POLICY_AND_AUDIT.md`
- `docs/portfolio-ml/FINPLE_STEP113_AI_ANALYSIS_WORKLOG_AND_NEXT_HANDOFF_2026_06_27.md`
- `docs/portfolio-ml/FINPLE_PORTFOLIO_ML_IMPLEMENTATION_PLAN.md`
- `docs/strategy/FINPLE_VIBE_CODING_COMPETITIVE_MOAT_ROADMAP.md`
- `docs/FINPLE_docs_index.md`

## 12. 주의사항

- 이 문서는 개발·사업 기획 기준이며 개별 금융상품의 매수·매도를 권유하지 않는다.
- 자기계좌 자동운용과 외부 고객 대상 서비스를 구분한다.
- 유사투자자문업·투자자문업·투자일임업의 최종 법적 판단은 실제 서비스 기능과 계약구조를 기준으로 별도 확인한다.
- 실계좌 운용 전 KIS API 지원범위, 해외 ETP 거래요건, 수수료·환전 우대, 휴장·주문시간을 다시 확인한다.
