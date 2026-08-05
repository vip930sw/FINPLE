# FINPLE Trading Lab TSC-4C — Private Shadow Runtime

기준일: 2026-08-05  
연결 Issue: #441  
선행 PR: #443, #444

## 1. 목적

승인된 레버리지 ETF 스캘핑 전략 버전을 실주문 없이 completed 1-minute bar cycle에 적용하고, 가상 주문·체결·포지션·성과를 관리자 화면에 누적한다.

## 2. 성과 목표 해석

`20거래일 순수익률 3%`는 상향 목표다.

- 단순 연환산: 37.8%
- 252거래일 복리 연환산: 약 45.13%
- 매월 12회 복리 가정: 약 42.58%

장기간 반복 달성을 전제로 하면 매우 공격적인 목표이므로 Live 승격 필수조건으로 사용하지 않는다.

필수 Shadow 증거:

- 관찰기간 60거래일 이상
- 완결 거래 100건 이상
- 20거래일 rolling window 3개 이상
- rolling window 3개 중 2개 이상 양수
- 누적 순수익률 양수
- Profit Factor 1.25 이상
- 최대 낙폭 5% 이하
- 체결률 70% 이상
- 평균 슬리피지 5bp 이하
- 단일 거래일의 양수손익 기여도 35% 이하
- 최대 연속손실 8회 이하
- 수익 종목 2개 이상

`20일 3%`는 비차단 Stretch gate로 표시한다. 미달이어도 다른 필수조건을 모두 충족하면 `shadow_candidate`가 될 수 있지만 자동 Live 전환은 불가하며 수동 검토가 필요하다.

## 3. Shadow Worker

`tradingLeveragedEtfShadowWorker.js`는 다음 순서로 작동한다.

1. 승인 전략 버전과 checksum 검증
2. 허용 종목별 completed bar cycle 정규화
3. 이전 cycle의 가상 marketable-limit 주문을 현재 bar로 체결 평가
4. 종목별 TSC-1 전략 평가
5. TSC-4B 다자산 조정기로 신규진입 우선순위와 계좌한도 적용
6. 가상 주문 intent 기록
7. 자산·낙폭·체결·비용·종목별 성과 산출
8. 승격 게이트 평가
9. sanitized snapshot 저장

실제 브로커 주문 어댑터는 존재하지 않는다.

## 4. 관리자 제어

`/ADMIN CONSOLE → AI 트레이딩`에 Private Shadow Runtime 패널을 추가한다.

- 승인 전략 선택
- 가상 초기자산 설정
- Shadow 세션 시작
- 상태·가상 포지션·성과·승격 게이트 조회
- Shadow 세션 정지

관리자 HTTP route는 상태 조회, 시작, 정지만 제공한다. completed bar cycle 입력은 내부 runtime 함수로만 제공하고 외부 관리자 ingestion route는 노출하지 않는다.

## 5. 저장

Migration 파일:

```text
server/migrations/20260805_trading_shadow_runtime.sql
```

테이블:

- `trading_shadow_runs`
- `trading_shadow_snapshots`

DB 저장 활성화 조건:

- `DATABASE_URL`
- `FINPLE_TRADING_SHADOW_RUNTIME_ENABLED=true`
- migration 적용

그 전에는 process-memory Shadow 스냅샷을 사용한다.

저장 금지:

- KIS app key / secret
- 계좌번호
- raw provider payload
- 실제 주문 payload
- 사용자 금융 식별정보

## 6. 안전 경계

항상 false:

```text
providerConnectionStarted
brokerOrderAdapterPresent
orderSubmissionAllowed
liveActivationAllowed
automaticLiveActivationAllowed
```

이번 단계에서 KIS WebSocket을 실제 연결하거나 Background Worker를 Production에 배포하지 않는다. 내부 `ingestScalpingShadowCycle()`은 이후 private feed runner가 호출할 계약이며, HTTP route로 공개하지 않는다.

## 7. 다음 단계

- TSC-4D: 실제 KIS completed 1-minute bar feed runner 연결
- Preview/Shadow 전용 프로세스 운영
- 최소 60거래일·100거래 증거 수집
- 비용·슬리피지 교정
- 승격 게이트 수동 검토
- 이후에만 TSC-5 Live guarded 설계 검토
