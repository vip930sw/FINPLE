# FINPLE Trading Lab TSC-4A — Scalping Admin Console

기준일: 2026-08-05  
대상: 대표자 개인계좌 전용 비공개 Trading Lab  
연결 Issue: #441  
연결 PR: #443

## 1. 결론

기존 `/admin/trading`의 모의 운용 화면은 mock 상태·placeholder 전략·가상 KPI 중심이었으며, TSC-1 스캘핑 전략이나 TSC-3 리플레이 결과와 직접 연결되지 않았다.

TSC-4A는 기존 `/ADMIN CONSOLE`의 Trading Lab 화면에 별도의 `레버리지 ETF 스캘핑 전략` 패널을 추가한다.

```text
/ADMIN CONSOLE
→ AI 트레이딩
→ 모의 운용 대시보드
→ 레버리지 ETF 스캘핑 전략 패널
```

패널은 다음을 제공한다.

- TSC-1 전략 파라미터 편집
- 거래 유니버스 선택
- 연구 목표·승인 기준 편집
- 리플레이 또는 Shadow KPI
- 자산·낙폭·일별손익 차트
- 목표 대비 현재 성과 표
- 최근 완결 거래
- 종목별 성과 표

## 2. 전략 편집

초기 허용 유니버스:

```text
TQQQ, SQQQ, SOXL, SOXS, UPRO, SPXU, TNA, TZA
```

편집 가능한 전략 필드:

- 최소 분봉 수
- Fast / Slow EMA
- 진입·청산 확률
- 최소 순기대수익
- 최대 스프레드
- 모멘텀·거래량 기준
- 최대 보유시간
- 거래당 위험비율
- 종목당 최대비중
- 손절·ATR·트레일링·익절 R배수
- 개장·마감 버퍼
- 수수료·슬리피지·비용 안전배수
- 외부 AI 모델 신호 필수 여부

검증은 fail-closed다.

- 허용목록 밖 종목 차단
- Fast EMA가 Slow EMA 이상이면 차단
- 청산확률이 진입확률 이상이면 차단
- 거래당 위험비율 10% 초과 차단
- 포지션 비율 100% 초과 차단
- 잘못된 음수·비수치·정수조건 차단
- revision 충돌 시 409 응답 후 최신값 재조회

## 3. 연구 목표

관리자 화면의 목표수익률은 약속이나 주문규칙이 아니다.

```text
목표수익률
= 리플레이 / Shadow / Live guarded 승격을 위한 연구 승인 기준
≠ 수익 보장
≠ 자동 주문 활성화 조건 하나만으로 사용
```

기본 연구 목표:

| 항목 | 기본값 |
| --- | ---: |
| 평가기간 | 20 거래일 |
| 목표 순수익률 | 3% |
| 허용 최대 낙폭 | 8% |
| 최소 Profit Factor | 1.2 |
| 최소 체결률 | 70% |
| 최대 평균 슬리피지 | 5bp |
| 최소 완결 거래 | 30건 |

각 기준은 `달성 / 미달 / 미측정`으로 표시한다.

## 4. 성과 표시

지원 KPI:

- 초기·최종 자산
- 순손익
- 순수익률
- 최대 낙폭
- Profit Factor
- 체결률
- 평균 슬리피지
- 완결 거래 수
- 승·패
- 총 비용
- 회전율

지원 차트·표:

- 자산 곡선
- 낙폭 곡선
- 일별 손익 막대
- 연구목표 대비 성과
- 최근 완결 거래
- 종목별 성과
- backend 계약상 시장국면·진입시간별 breakdown

성과 원천은 TSC-3 replay result 또는 이후 TSC-4 Shadow snapshot이다.

현재 실제 과거 1분 데이터 리플레이나 Shadow 실행 스냅샷은 저장되지 않았으므로 다음 상태가 정상이다.

```text
performance.status
= unavailable_no_persisted_replay_or_shadow_snapshot
```

이 경우 모든 미측정 KPI는 `0`이 아니라 `null / — / 미측정`으로 표시한다.

## 5. 저장 경계

TSC-4A의 전략 저장은 서버 프로세스 메모리 초안이다.

```text
persistenceMode = process_memory_draft
survivesProcessRestart = false
appliesToTradingRuntime = false
providerCallsAllowed = false
orderSubmissionAllowed = false
liveActivationAllowed = false
```

목적은 관리자 편집·검증·UX 확인이다. 재시작 가능한 영구 전략 레지스트리와 Trading Worker 전달은 별도 단계다.

## 6. API

관리자 전용:

```text
GET /api/admin/trading-readiness/scalping-dashboard
PUT /api/admin/trading-readiness/scalping-strategy-draft
```

두 경로 모두 기존 `requireAdminAccess`를 통과해야 한다.

저장 응답은 초안을 갱신하더라도 다음을 고정한다.

```text
appliesToTradingRuntime=false
providerCallsAllowed=false
orderSubmissionAllowed=false
liveActivationAllowed=false
```

## 7. 프런트엔드 연결

신규 컴포넌트:

```text
src/components/TradingScalpingAdminPanel.jsx
src/components/TradingScalpingAdminPanel.css
src/components/tradingScalpingAdminApi.js
```

기존 `TradingAiMlPanelGroup.jsx`가 첫 AI/ML milestone 그룹 직전에 패널을 한 번 렌더링한다. 공개 Simulator, My Page, Pricing에는 노출하지 않는다.

## 8. 검증

전용 CI:

```text
.github/workflows/trading-scalping-admin-check.yml
```

실행 대상:

```text
server/src/services/tradingScalpingAdminDashboard.test.js
scripts/check-trading-scalping-admin-console.test.mjs
npm run build
```

최종 결과:

```text
Admin dashboard service tests: 7/7 PASS
Admin Console integration checks: 4/4 PASS
Focused total: 11/11 PASS
Frontend build: PASS
Backend Auth Stability Check: PASS
FINPLE Offline Data-Quality Report: PASS
Vercel: PASS
```

검증 범위:

- 실제 TSC-1 기본 설정 사용
- 잘못된 전략·목표 차단
- revision 충돌
- runtime/order/provider 고정 차단
- 성과 부재 시 null 유지
- replay result KPI·차트 변환
- Admin Console 렌더 연결
- 공개 라우트 비노출
- 전략·목표·KPI·차트·거래·breakdown 표면 존재

## 9. 다음 단계

### TSC-4B — durable strategy registry

- PostgreSQL 또는 전용 Trading DB 전략 초안·승인본 분리
- draft / reviewed / approved / retired 상태
- 변경이력·operator·버전·해시
- optimistic locking
- 승인본만 private worker가 읽기

### TSC-4C — Shadow worker

- KIS 실시간 시세 수신
- 승인된 전략 버전 로드
- 가상 주문·체결 추적
- sanitized snapshot을 Admin Console에 반영
- 실주문은 계속 차단

### TSC-5 — Live guarded

Shadow 승인 기준과 별도의 명시적 운영 승인을 통과한 뒤에만 주문 어댑터를 연결한다.
