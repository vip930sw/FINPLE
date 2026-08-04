# FINPLE Trading Lab TSC-2 KIS 해외주식 실시간 시세

기준일: 2026-08-05  
대상: 대표자 개인계좌 전용 비공개 Trading Lab  
연결 Issue: #441  
연결 PR: #443

## 1. 목적

TSC-1의 미국 레버리지·인버스 ETF 1분 스캘핑 전략에 실제 시장 입력을 공급하기 위한 KIS 읽기 전용 실시간 시세 경로를 구현한다.

```text
KIS WebSocket 승인키
→ HDFSCNT0 실시간 체결
→ HDFSASP0 미국 실시간 1호가
→ 정규화된 trade / quote 이벤트
→ 1분 OHLCV + 최신 bid/ask
→ TSC-1 전략 입력
```

일반 FINPLE 사용자 화면, 장기 포트폴리오 분석, canonical CSV, 결제·인증·사용자 DB와 분리한다.

## 2. 공식 KIS 계약

한국투자증권 공식 Open API 샘플의 해외주식 WebSocket 계약을 기준으로 한다.

| 용도 | TR ID | 비고 |
| --- | --- | --- |
| 미국 실시간 체결 | `HDFSCNT0` | 미국은 0분 지연 무료시세 안내 |
| 미국 실시간 1호가 | `HDFSASP0` | 매수·매도 1호가 |
| WebSocket 승인키 | `/oauth2/Approval` | appkey/appsecret으로 일시 키 발급 |
| WebSocket endpoint | `ws://ops.koreainvestment.com:21000/tryitout` | 공식 샘플 경로 |

정규장 구독키 형식:

```text
D + 시장코드 + 티커
```

예:

```text
DNASAAPL
DNASTQQQ
DAMSUPRO
```

시장코드:

```text
NASDAQ → NAS
NYSE   → NYS
AMEX / NYSE Arca 계열 → AMS
```

초기 유니버스 매핑:

| 티커 | KIS 시장코드 |
| --- | --- |
| TQQQ | NAS |
| SQQQ | NAS |
| SOXL | AMS |
| SOXS | AMS |
| UPRO | AMS |
| SPXU | AMS |
| TNA | AMS |
| TZA | AMS |

운영 전 KIS 종목정보 조회로 실제 시장코드를 다시 대조한다.

## 3. 추가 파일

```text
server/src/services/tradingKisOverseasRealtimeAdapter.js
server/src/services/tradingKisOverseasRealtimeAdapter.test.js
server/src/services/tradingMinuteBarAggregator.js
server/src/services/tradingMinuteBarAggregator.test.js
```

## 4. 실시간 어댑터

`createKisOverseasRealtimeFeed()`는 네트워크 구현을 의존성으로 주입받는다.

```js
const feed = createKisOverseasRealtimeFeed({
  fetchImpl,
  webSocketFactory,
});
```

기본 상태에서는 연결되지 않는다.

```text
allowProviderCalls !== true
→ provider_calls_not_opted_in
→ 네트워크 호출 없음
```

명시적 opt-in과 필수 환경값이 모두 존재할 때만 다음을 수행한다.

```text
1. WebSocket 승인키 발급
2. 종목별 HDFSCNT0 구독
3. 종목별 HDFSASP0 구독
4. PINGPONG 응답
5. 정규화 이벤트 전달
6. 비정상 종료 시 제한된 지수 backoff 재접속
```

승인키는 메모리 클로저에서만 사용하고 세션 종료·재연결 시 제거한다.

## 5. 저장 금지

다음 값은 DB·파일·일반 로그에 저장하지 않는다.

```text
KIS App Key
KIS App Secret
WebSocket approval_key
계좌번호
원시 WebSocket 프레임
원시 provider response
주문 payload
```

상태 이벤트는 다음만 포함한다.

```text
state
attempt
delayMs
reason
subscriptionCount
credentialStored=false
rawProviderPayloadStored=false
```

## 6. 체결 정규화

`HDFSCNT0` 공식 컬럼을 다음 내부 이벤트로 변환한다.

```js
{
  type: "trade",
  provider: "KIS",
  trId: "HDFSCNT0",
  symbol,
  exchangeDate,
  exchangeTime,
  open,
  high,
  low,
  last,
  bid,
  ask,
  bidSize,
  askSize,
  eventVolume,
  totalVolume,
  totalAmount,
  strength,
  eventTimeMs,
  rawStored: false,
}
```

수신 시각을 `eventTimeMs`로 사용한다. 미국 정규장 실시간 스트림에서 네트워크 수신지연은 별도 latency 지표로 기록하고, 거래소 시각 변환은 TSC-3 리플레이 계약에서 별도로 고정한다.

## 7. 호가 정규화

`HDFSASP0`의 1호가를 다음 내부 이벤트로 변환한다.

```js
{
  type: "quote",
  symbol,
  bid,
  ask,
  bidSize,
  askSize,
  spreadBps,
  eventTimeMs,
  rawStored: false,
}
```

잘못된 호가는 차단한다.

```text
bid <= 0
ask < bid
비수치 bid/ask
→ invalid_quote
```

기본 freshness 기준은 3초다.

```text
age <= 3000ms → fresh
age > 3000ms  → stale_market_event
```

## 8. 1분봉 집계

`createOneMinuteMarketAggregator()`가 정규화 이벤트를 받아 다음 값을 생성한다.

```text
open
high
low
close
volume
tradeCount
minuteStartMs
minuteEndMs
최신 bid/ask
```

원칙:

- 체결이 없는 분봉을 임의 생성하지 않는다.
- forward fill하지 않는다.
- 이전 시각 이벤트를 현재 봉에 섞지 않는다.
- `EVOL`이 없으면 누적거래량 `TVOL`의 증가분을 사용한다.
- 체결과 호가는 원시값이 아니라 정규화 이벤트만 소비한다.

현재 봉보다 다음 분의 체결이 들어오거나 `flush()`가 호출되면 이전 봉을 완료 상태로 방출한다.

## 9. 재접속

기본 재접속 정책:

```text
1초
2초
4초
8초
16초
30초 상한
최대 6회
```

재접속 중에는 시세가 stale 상태이므로 TSC-1 신규 진입을 차단한다. 기존 포지션 청산은 마지막 유효 호가만으로 시장가 주문하지 않고, 시세 복구 또는 별도 비상청산 정책을 사용한다.

## 10. 테스트

직접 실행:

```bash
node --test \
  server/src/services/tradingKisOverseasRealtimeAdapter.test.js \
  server/src/services/tradingMinuteBarAggregator.test.js
```

검증 항목:

- 공식 구독키
- 승인키 요청 규격
- 체결·호가 구독 envelope
- HDFSCNT0 프레임 파싱
- HDFSASP0 프레임 파싱
- PINGPONG
- 암호화·오류 프레임 차단
- freshness
- 지수 backoff
- provider opt-in 차단
- 승인키 메모리 사용과 종료 정리
- OHLCV 집계
- 누적거래량 차분
- out-of-order 차단
- allowlist 차단
- 무체결 분봉 미생성

TSC-2 신규 테스트는 로컬 독립 실행에서 14/14 통과했다.

## 11. 현재 경계

이번 단계는 읽기 전용 시장데이터 구현이다.

```text
실제 주문 제출: 없음
주문 정정·취소: 없음
체결통보 H0GSCNI0 연결: 없음
계좌잔고 조회: 없음
DB migration: 없음
공개 API route: 없음
공개 UI: 없음
Production 환경변수 변경: 없음
```

실제 provider 호출은 코드상 구현됐지만 `allowProviderCalls=true`와 private worker의 명시적 설정 전에는 실행되지 않는다.

## 12. 다음 단계

TSC-3에서 동일한 1분봉 계약을 실제 과거 데이터 리플레이에 사용한다.

```text
정규화 1분봉
→ TSC-1 전략
→ 시장가 없는 marketable limit 체결모델
→ 부분체결·미체결
→ 수수료·스프레드·슬리피지
→ 거래별 원장
→ Walk-forward
→ 장세·시간대별 성과
```

TSC-3가 통과한 전략 버전만 실시간 Shadow 후보가 된다.
