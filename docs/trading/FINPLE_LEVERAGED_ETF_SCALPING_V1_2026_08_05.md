# FINPLE Leveraged ETF Scalping v1

기준일: 2026-08-05  
대상: 대표자 개인계좌 전용 비공개 Trading Lab  
연결 Issue: #441

## 1. 목적

미국 레버리지·인버스 ETF의 1분봉을 대상으로 AI 모델 신호와 결정론적 기술·비용·위험 조건을 결합해 스캘핑 주문의도를 생성한다.

이 모듈은 FINPLE 일반 사용자 서비스와 분리한다. 고객계좌, 투자자문, 공개 신호, 자동매매 판매 기능을 포함하지 않는다.

## 2. 현재 구현 범위

### 전략 코어

`server/src/services/tradingLeveragedEtfScalpingStrategy.js`

- 초기 유니버스: `TQQQ`, `SQQQ`, `SOXL`, `SOXS`, `UPRO`, `SPXU`, `TNA`, `TZA`
- 미국 정규장 1분봉
- EMA 5/20 추세
- 20분 VWAP
- 5분 모멘텀
- 거래량 Z-score
- ATR 기반 손절·트레일링·목표수익
- AI `probabilityUp`, `expectedReturnBps`, `confidence`, `regime`, `modelVersion` 입력
- 스프레드·수수료·슬리피지를 차감한 비용 게이트
- 계좌자산·손절거리 기반 수량 산정
- 최대 포지션 35%, 거래당 위험예산 1% 기본값
- 최대 12분 보유
- 장 종료 15분 전 신규진입 차단·보유분 청산
- marketable limit 주문의도
- 시장가 fallback 금지
- 결정적 idempotency key

상승 레버리지와 인버스 ETF를 모두 long-only로 매수한다. 공매도·신용·옵션·선물은 사용하지 않는다.

### 위험엔진 연결

`server/src/services/tradingLeveragedEtfScalpingRiskBridge.js`

전략이 주문의도를 생성한 경우에만 기존 `evaluateTradingRiskGate()`로 전달한다.

- Paper: `approved_for_paper`
- Shadow: `approved_for_shadow`
- Live guarded: `live_review_required`
- 실제 주문 제출: 본 PR에서는 계속 `false`
- 외부 provider 호출: 본 PR에서는 계속 `false`

따라서 전략 코어가 Live 자격을 만들더라도 현재 KIS 주문을 직접 전송하지 않는다.

## 3. 주문 계약

```json
{
  "intentVersion": "trading-order-intent-v1",
  "strategyVersion": "leveraged-etf-scalping-v1",
  "symbol": "TQQQ",
  "market": "US",
  "assetType": "LEVERAGED_ETF",
  "side": "buy",
  "quantity": 10,
  "orderType": "limit",
  "limitPrice": 53.12,
  "timeInForce": "DAY",
  "idempotencyKey": "les-xxxxxxxx",
  "executionPolicy": {
    "maximumAttempts": 1,
    "cancelIfQuoteStale": true,
    "cancelIfRiskGateChanges": true,
    "marketOrderFallbackAllowed": false
  }
}
```

## 4. 진입 조건

아래가 모두 충족되어야 한다.

1. 허용된 레버리지·인버스 ETF
2. 정규장
3. 장 시작 5분 이후, 장 종료 15분 이전
4. 유효한 1분 OHLCV 30개 이상
5. EMA 5가 EMA 20보다 높음
6. 가격이 VWAP보다 높음
7. 5분 모멘텀이 기준 이상
8. 거래량 기준 충족
9. 스프레드 8bp 이하
10. 외부 AI 상승확률 60% 이상
11. 예상 총수익이 왕복비용과 안전버퍼를 초과
12. 위험예산과 포지션 한도에서 1주 이상 주문 가능

`requireModelSignal=true`가 기본이므로 AI 신호가 없으면 실전 후보 주문을 만들지 않는다. 결정론적 baseline은 Paper 연구에서 명시적으로 설정한 경우에만 사용한다.

## 5. 청산 조건

다음 중 하나가 발생하면 전량 매도 주문의도를 생성한다.

- 고정 손절 또는 ATR 트레일링 손절
- 목표수익 도달
- 최대 12개 1분봉 보유
- 장 종료 15분 전
- EMA 추세와 AI 확률이 동시에 반전

## 6. 테스트

로컬 독립 실행으로 다음을 확인했다.

```text
tradingLeveragedEtfScalpingStrategy.test.js: 10/10
tradingLeveragedEtfScalpingRiskBridge.test.js: 3/3
합계: 13/13
```

검증 항목:

- 강한 신호의 제한된 매수 주문의도
- 인버스 ETF long 진입
- 허용목록 외 종목 차단
- 과도한 스프레드 차단
- AI 신호 필수
- 명시적 baseline 모드
- 트레일링 손절
- 장 마감 강제청산
- idempotency key 재현성
- 비정상 OHLCV fail-closed
- 기존 Paper/Live risk gate 연결
- Live 자격과 실제 주문 제출의 분리

## 7. 후속 구현

### TSC-2 KIS 실시간 시세

- 해외주식 WebSocket 및 REST 읽기 전용 어댑터
- bid/ask, 체결가, 누적거래량 수신
- 1분 OHLCV 집계
- quote freshness와 재접속
- API 호출 제한 처리

### TSC-3 이벤트 기반 리플레이

- 실제 1분 데이터
- bid/ask 스프레드
- 수수료·슬리피지
- limit 미체결·부분체결
- Walk-forward
- 장세별 성과

### TSC-4 Shadow

- 실제 시세로 신호 생성
- 주문 전송 없이 가상 체결
- 실제 호가 대비 체결 가능성 기록

### TSC-5 Live guarded

- KIS 해외주식 주문·정정·취소·체결조회
- 주문의도 → 위험엔진 → Kill Switch → KIS adapter 단일 경로
- 중복주문 방지
- 부분체결 처리
- 잔고·미체결 대사
- 재시도 최대 1회
- 실계좌 자금은 별도 명시적 승인 후 단계적으로 확대

### TSC-6 Private Worker

공개 Render Web Backend에 1분 거래 루프를 넣지 않는다. 별도 Private Worker와 Trading DB를 사용하고, 재시작 시 계좌·포지션·미체결 주문이 일치해야만 거래를 재개한다.

## 8. 변경 금지 범위

이번 구현은 아래를 변경하지 않는다.

- FINPLE 공개 시뮬레이터
- canonical CSV
- Step 2~7 분석
- AI 포트폴리오 해설
- 인증·결제·구독·MY PAGE
- Vercel·Render Production
- KIS 거래 자격증명
- 실계좌 주문 권한
