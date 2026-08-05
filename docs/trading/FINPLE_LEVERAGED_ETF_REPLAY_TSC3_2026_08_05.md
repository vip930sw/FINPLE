# FINPLE Trading Lab TSC-3 레버리지 ETF 이벤트 리플레이

기준일: 2026-08-05  
대상: 대표자 개인계좌 전용 비공개 Trading Lab  
연결 Issue: #441  
연결 PR: #443

## 1. 목적

TSC-1 전략과 TSC-2의 1분봉 계약을 동일하게 사용하면서 실제 주문을 전송하지 않는 이벤트 기반 리플레이·백테스트 코어를 구현한다.

```text
과거 1분 OHLCV·bid/ask
→ TSC-1 전략 결정
→ 다음 1분봉에서 marketable-limit 체결 평가
→ 미체결·부분체결·비용 반영
→ 현금·포지션·거래 원장
→ 성과·MDD·체결품질
→ Walk-forward
```

현재 단계는 엔진 구현과 결정론적 synthetic regression이다. 실제 미국시장 과거 1분 데이터의 수집·저장·라이선스 확정 및 대규모 실행은 아직 수행하지 않는다.

## 2. #442 충돌 검토

PR #442는 `codex/p0c-lineage-provenance-forensics` 브랜치에서 Step 4/5 계보 포렌식만 수행한다.

변경 범위:

```text
docs/portfolio-analysis/*
reports/portfolio-analysis/*
scripts/check-step4-step5-lineage-forensics.mjs
package.json의 checker command 1개
```

PR #443의 TSC-1~3 변경 범위:

```text
docs/trading/*
server/src/services/tradingLeveragedEtf*
server/src/services/tradingKisOverseasRealtimeAdapter*
server/src/services/tradingMinuteBarAggregator*
```

판정:

- 직접 중복 파일: 0
- 동일 런타임 모듈 수정: 0
- 동일 데이터·manifest·canonical 파일 수정: 0
- KIS·Trading 파일을 #442가 수정하는 범위: 0
- 양 브랜치 공통 merge-base: `a17f0c6b3553dd34befbc91b413dc947cf695c33`
- 현재 상태: 정상적인 diverged branches, 파일 수준 충돌 없음

TSC-3에서는 `package.json`을 수정하지 않으므로 #442가 먼저 병합되더라도 package script 충돌이 발생하지 않는다. #442는 Step 4/5 분석용이고 #443은 비공개 Trading Lab이므로 의미론적 결합도 없다.

## 3. 추가 파일

```text
server/src/services/tradingLeveragedEtfScalpingReplay.js
server/src/services/tradingLeveragedEtfScalpingReplay.test.js
```

## 4. 입력 계약

리플레이 바는 다음 필드를 사용한다.

```js
{
  symbol: "TQQQ",
  timestamp: "2026-08-04T13:31:00.000Z",
  sessionDate: "2026-08-04",
  open: 80.10,
  high: 80.25,
  low: 80.05,
  close: 80.20,
  volume: 152300,
  quote: {
    bid: 80.19,
    ask: 80.21
  },
  session: {
    name: "REGULAR",
    minutesSinceOpen: 1,
    minutesToClose: 389
  },
  modelSignal: {
    probabilityUp: 0.67,
    expectedReturnBps: 31,
    confidence: 0.74,
    regime: "intraday_bull",
    modelVersion: "model-v1"
  },
  regime: "intraday_bull"
}
```

필수 검증:

- 유효한 `symbol + timestamp`
- 양수 OHLC
- `high >= open/close/low`
- `low <= open/close/high`
- 비음수 거래량
- 세션 경과·잔여시간
- 동일 종목·시각 중복 금지

입력 순서는 정렬하되 동일 종목·시각 중복은 fail-closed한다.

## 5. Look-ahead 방지

현재 1분봉에서 생성한 주문의도는 현재 봉에서 체결시키지 않는다.

```text
bar N close에서 신호·주문의도 생성
→ bar N+1에서 체결 가능성 평가
```

마지막 봉에서 생성되어 다음 봉이 없는 주문은 다음 상태로 만료한다.

```text
expired_end_of_replay
no_next_bar_for_execution
```

이 규칙은 현재 봉의 고가·저가를 이미 본 뒤 같은 봉에서 유리한 체결을 만드는 look-ahead bias를 방지한다.

## 6. Marketable-limit 체결 모델

시장가 fallback은 사용하지 않는다.

매수:

```text
다음 봉 ask <= limit
또는 다음 봉 low <= limit
→ 체결 후보
```

매도:

```text
다음 봉 bid >= limit
또는 다음 봉 high >= limit
→ 체결 후보
```

체결가격은 adverse slippage를 반영하면서 limit 경계를 넘지 않는다.

```text
buy fill <= limitPrice
sell fill >= limitPrice
```

기본 실행비용:

| 항목 | 기본값 |
| --- | ---: |
| 편도 commission | 1bp |
| 매도 규제성 비용 | 0.03bp |
| 기본 slippage | 1bp |
| participation impact | 참여율 100%당 8bp |
| 최대 분봉 거래량 참여율 | 5% |
| fallback spread | 4bp |
| 최소 체결수량 | 1주 |

실제 KIS 체결자료를 확보하면 이 값은 Shadow execution profile로 교체한다.

## 7. 부분체결·미체결

분봉 체결 가능수량:

```text
floor(bar volume × maximumParticipationRate)
```

주문수량이 이를 초과하면 `partial`로 처리하고 잔량은 재주문하지 않는다. TSC-1 주문정책의 `maximumAttempts=1`과 일치한다.

미체결 사유:

```text
limit_not_reached
insufficient_bar_liquidity
no_next_bar_for_execution
```

체결되지 않은 주문으로 포지션이나 손익을 만들지 않는다.

## 8. 원장

리플레이 원장은 다음을 기록한다.

```text
cash
positions
pending orders
orders
fills
round-trip trades
equity curve
decisions
total fees
turnover
```

매수 시 수수료를 포함한 평균원가를 보존하고, 매도 시 해당 수량의 원가와 진입수수료를 배분해 순손익을 계산한다.

부분매도 시 잔여 포지션은 유지된다.

## 9. 강제청산

기본값은 리플레이 종료 시 잔여 포지션 강제청산이다.

```text
end_of_replay_forced_liquidation
```

이는 데이터 구간 밖으로 포지션 손익을 숨기지 않기 위한 백테스트 종료정책이다. 실시간 Trading Worker의 장마감 청산과는 별도 계약이다.

## 10. 성과지표

출력 지표:

```text
initial / ending equity
net PnL
total return
realized trade PnL
total fees
turnover
orders submitted
filled / partial / missed orders
fill rate
partial fill rate
average slippage
trade count
wins / losses / win rate
average trade PnL
profit factor
max drawdown
max consecutive losses
```

세부 분해:

```text
symbol
entry regime
entry hour
```

승률만으로 전략을 승인하지 않는다. 비용 후 순기대값, Profit Factor, MDD, 체결률, 슬리피지, 연속손실을 함께 검토한다.

## 11. Walk-forward

`runLeveragedEtfWalkForward()`는 거래일 단위로 구간을 나눈다.

```text
trainSessions: 이전 이력·지표 warmup
 testSessions: 실제 out-of-sample 리플레이
 stepSessions: 다음 평가창 이동 폭
```

Train 구간에서는 주문·손익을 만들지 않고, 전략 지표 계산에 필요한 과거 바만 공급한다. Test 구간마다 현금과 포지션은 초기화한다.

출력:

```text
windows
successful windows
profitable windows
total net PnL
average window return
worst window drawdown
total trades
```

향후 AI 모델 학습은 각 train window 내부에서만 수행하고, test window의 `modelSignal`은 완전한 out-of-sample 값이어야 한다.

## 12. 테스트

집중 테스트:

```bash
node --test server/src/services/tradingLeveragedEtfScalpingReplay.test.js
```

검증 항목:

- 중복 종목·시각 차단
- participation 기반 부분체결
- limit 미도달 미체결
- 다음 봉 체결과 look-ahead 방지
- 미체결 주문으로 원장 미변경
- 종료 강제청산
- 종목·국면·시간대 breakdown
- Walk-forward 창 생성
- 거래일 부족 차단

TSC-3 focused test는 9/9 통과했다.

## 13. 현재 제한

아직 포함하지 않은 범위:

```text
실제 과거 1분 데이터 수집
거래소별 휴장·조기폐장 캘린더
pre-market / after-hours
실제 KIS 주문 체결자료 기반 비용 calibration
queue position 또는 L2 order book
실제 AI 모델 학습
대규모 parameter search
Shadow Trading
실계좌 주문
```

현재 엔진은 TSC-1 전략을 기본 evaluator로 사용하지만, 테스트와 연구에서는 동일한 함수계약의 evaluator를 주입할 수 있다.

## 14. 다음 승인 기준

실제 데이터가 준비된 후 최소 다음 조건을 충족해야 TSC-4 Shadow 후보가 된다.

```text
모든 Walk-forward test 구간에 미래정보 유출 없음
비용 후 순기대값 양수
다수 시장국면에서 성과가 한 구간에만 편중되지 않음
미체결·부분체결 후에도 원장 일치
최대 MDD와 연속손실이 정한 한도 내
슬리피지 민감도 2배에서도 전략 붕괴 여부 확인
종목·시간대별 표본 수 충족
```

실제 과거 1분 데이터와 비용 profile이 없으므로 이번 단계만으로 수익성을 주장하지 않는다.
