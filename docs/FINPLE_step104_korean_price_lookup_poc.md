# FINPLE Step 104: Korean Price Lookup PoC

## 목적

Step 103에서 스크리너 후보 CSV, CAGR 보정, 배당 표시 정책, MBTI/시뮬레이터 CSV 지표 동기화가 안정화되었습니다.

Step 104의 목적은 한국 자산의 현재가 조회 방식을 검토하고, 앱에 붙일 수 있는 안전한 구조를 결정하는 것입니다.

현재 문제:

```text
069500 KODEX 200
005930 삼성전자
102110 TIGER 200
148020 RISE 200
```

위와 같은 한국 자산은 CSV 지표는 정상 적용되지만 현재가는 아직 자동 조회되지 않습니다.

---

## 현재 앱 구조

현재 FINPLE 프론트는 Vite 정적 앱입니다.

```text
package.json: Vite + React
vercel.json: dist 정적 배포 + SPA rewrite
```

따라서 한국투자증권 OpenAPI 같은 인증형 API를 브라우저 프론트에서 직접 호출하면 안 됩니다.

이유:

```text
1. App Key / App Secret 노출 위험
2. 접근 토큰 노출 위험
3. CORS 문제 가능성
4. 호출 제한 제어 어려움
5. 장애 발생 시 기존 평가금액 유지 정책 구현 어려움
```

결론:

```text
한국 현재가 조회는 프론트 직접 호출 금지
서버/API 프록시를 통해 호출
```

---

## 후보 방식 비교

### 1. 한국투자증권 OpenAPI

장점:

```text
- 정식 API
- 현재가 조회에 가장 적합
- 국내주식/ETF 모두 조회 가능성이 높음
- 향후 체결가, 호가, 일봉 등 확장 가능
```

단점:

```text
- API 신청 필요
- App Key / Secret 관리 필요
- 서버 프록시 필요
- 호출 제한 정책 필요
```

권장도:

```text
정식 운영 후보 1순위
```

### 2. pykrx

장점:

```text
- Colab/Python에서 테스트가 쉬움
- 과거 OHLCV, 지표 산출에 유리
- 한국 ETF/주식 검증용으로 유용
```

단점:

```text
- 실시간 현재가보다는 일별/최근 종가 보조에 가까움
- 앱 실시간 조회용으로는 별도 서버 필요
- KRX 응답 구조 변경 시 불안정 가능
```

권장도:

```text
Colab 검증/백업 데이터 후보
```

### 3. FinanceDataReader

장점:

```text
- Python 테스트가 쉬움
- 종가/과거 데이터 확인에 편리
```

단점:

```text
- 실시간 현재가 API라기보다는 데이터 수집 라이브러리에 가까움
- 운영 앱 현재가 조회의 1차 소스로 쓰기에는 안정성 검토 필요
```

권장도:

```text
보조 검증 후보
```

---

## Step 104 결론 초안

운영 앱 기준 구조는 아래가 가장 안전합니다.

```text
프론트엔드
→ /api/kr/price/:ticker
→ 서버/서버리스 함수
→ 한국투자증권 OpenAPI
→ 정규화된 현재가 응답
→ 시뮬레이터 반영
```

프론트는 API 키를 절대 갖지 않습니다.

---

## 응답 포맷 초안

한국 현재가 조회 응답은 기존 assetDataService 구조와 맞춰야 합니다.

```json
{
  "ticker": "069500",
  "displayTicker": "069500",
  "providerSymbol": "069500",
  "name": "KODEX 200",
  "market": "KR",
  "currency": "KRW",
  "quoteCurrency": "KRW",
  "assetType": "ETF",
  "price": 43210,
  "priceMode": "auto",
  "metricMode": "csv",
  "dataSource": "kis+csv",
  "fetchedAt": "2026-05-25T00:00:00.000Z"
}
```

CAGR/BETA/MDD/배당률은 현재가 API에서 새로 계산하지 않습니다.

```text
현재가: KIS 또는 한국 현재가 API
지표값: final candidate CSV
```

---

## 실패 처리 정책

한국 현재가 조회 실패 시 기존 계산 구조를 유지합니다.

```text
현재가 조회 성공
→ price 업데이트
→ 수량/평가금액 재계산 가능

현재가 조회 실패
→ 기존 price 유지
→ price가 없으면 평가금액 기준 계산 유지
→ 사용자에게 '현재가 조회 실패, 평가금액 기준 계산 유지' 표시

호출 제한
→ 기존 값 유지
→ 일정 시간 재조회 제한

API 키 미설정
→ 한국 현재가 조회 비활성
→ CSV 지표만 적용
```

---

## PoC 테스트 종목

1차 테스트는 아래 종목으로 충분합니다.

```text
069500 KODEX 200
102110 TIGER 200
148020 RISE 200
005930 삼성전자
000660 SK하이닉스
035420 NAVER
005380 현대차
```

검수 포인트:

```text
1. 6자리 종목코드 앞자리 0 보존
2. ETF와 개별주 모두 조회
3. 현재가가 KRW 숫자로 들어오는지
4. 기존 CSV 지표가 덮어써지지 않는지
5. 조회 실패 시 평가금액 기준 계산이 유지되는지
6. 미국 자산 조회 로직과 충돌하지 않는지
```

---

## 구현 단계

### Step 104-1. 구조 결정

```text
한국투자증권 OpenAPI를 1순위 운영 후보로 채택
pykrx / FinanceDataReader는 검증용 또는 Colab 보조로 유지
```

### Step 104-2. 서버 프록시 설계

```text
/api/kr/price/:ticker
/api/kr/prices?tickers=069500,005930
```

환경변수:

```text
KIS_APP_KEY
KIS_APP_SECRET
KIS_ACCOUNT_NO        # 매매 기능 전까지는 사용하지 않을 수 있음
KIS_BASE_URL
KIS_ACCESS_TOKEN_CACHE
```

### Step 104-3. 프론트 연결

`assetDataService.js`에서 한국 자산일 때 다음 순서로 처리합니다.

```text
1. CSV 후보 확인
2. 한국 현재가 API 호출
3. 성공 시 price 반영 + CSV 지표 병합
4. 실패 시 CSV 지표만 반영 + lookup-required 유지
```

### Step 104-4. 배포 전 안전장치

```text
API 키 없는 환경에서는 빌드 실패 금지
한국 현재가 조회만 비활성화
미국 조회/CSV 지표/시뮬레이터 계산은 정상 유지
```

---

## 보류 사항

아래는 Step 104 이후 별도 단계로 분리합니다.

```text
1. 한국 일봉 기반 CAGR 재산출
2. 한국 배당 자동 갱신
3. 한국 ETF 분배금 자동 조회
4. 실시간 웹소켓 현재가
5. 매매 기능
```

Step 104는 현재가 조회 PoC까지만 다룹니다.

---

## 현재 결론

```text
한국 현재가 조회는 프론트 직접 호출이 아니라 서버 프록시 방식으로 진행한다.
지표값은 final candidate CSV를 계속 신뢰 원천으로 사용한다.
현재가 조회 실패 시에도 평가금액 기준 계산 구조를 유지한다.
```
