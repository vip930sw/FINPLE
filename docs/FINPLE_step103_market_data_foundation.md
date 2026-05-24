# FINPLE Step 103 — Market Data Foundation

## 1. 작업 목적

한국주식 / 한국 ETF 시뮬레이터를 바로 구현하기 전에, 기존 미국주식 포트폴리오 시뮬레이터가 깨지지 않도록 시장·통화·API 심볼 기준을 먼저 정리합니다.

이번 단계는 API 연결이나 CSV 추가 단계가 아닙니다.

## 2. 이번 단계에서 추가한 기준

### 2.1 시장 코드

```text
US: 미국주식 / 미국 ETF
KR: 한국주식 / 한국 ETF
```

### 2.2 공통 필드

각 자산은 앞으로 아래 필드를 공통으로 가질 수 있습니다.

```text
ticker          화면과 사용자 입력에 쓰는 티커
providerSymbol  API 호출에 쓰는 심볼
displayTicker   화면 표시용 티커
market          US / KR
exchange        거래소 또는 시장 범위
currency        화면 계산 기준 통화. 현재 FINPLE 기본값은 KRW
quoteCurrency   원시 시세 통화. 미국은 USD, 한국은 KRW
rawCurrency     API 원시 응답 통화
assetType       stock / ETF 등
```

### 2.3 기본 방향

```text
기존 미국 시뮬레이터 기본값: US
기존 화면 계산 기준: KRW 유지
미국 원시 시세 기준: USD
한국 원시 시세 기준: KRW
한국 기능 상태: Beta / PoC
```

## 3. 추가 파일

```text
src/components/portfolio/config/marketConfig.js
```

이 파일은 아래 역할을 합니다.

```text
1. US / KR 시장 설정 관리
2. 기본 표시 통화 관리
3. 티커로 시장 추론
4. 시장별 providerSymbol 정규화
5. 향후 API / CSV / 스크리너 분기 기준 제공
```

## 4. 수정 파일

```text
src/components/portfolio/utils/portfolioFactory.js
src/components/portfolio/services/assetDataService.js
```

### portfolioFactory.js

`normalizeAsset`에서 시장 메타데이터를 자동으로 보강하도록 했습니다.

기존 저장 데이터에 `market`, `providerSymbol`, `quoteCurrency` 등이 없어도 기본값을 부여합니다.

### assetDataService.js

기존 API 호출 구조에 `market` query parameter를 받을 수 있도록 준비했습니다.

```text
/assets/:ticker?market=us
/tickers/:ticker?market=us
/tickers/search?market=us
/tickers/screener?market=us
```

현재 백엔드가 아직 한국 시장을 처리하지 않아도 기존 US 기본값으로 동작하도록 설계했습니다.

## 5. 아직 하지 않은 것

```text
1. 한국주식 API 연결
2. 한국주식 CSV 추가
3. 한국주식 포트폴리오 시뮬레이터 화면 추가
4. 스크리너 미국 / 한국 탭 추가
5. MBTI 결과의 미국포트 / 한국포트 반영 선택 추가
6. 한국주식 가격, 배당, 분배금 데이터 검증
```

## 6. 다음 단계에서 필요한 CSV

아직 필요하지 않습니다. 다만 다음 단계부터는 아래 파일 구조가 필요합니다.

```text
us_ticker_master.csv
us_screener_candidates.csv
kr_ticker_master.csv
kr_screener_candidates.csv
```

### kr_ticker_master.csv 제안 컬럼

```csv
ticker,providerSymbol,nameKr,nameEn,market,exchange,currency,quoteCurrency,assetType,sector,isEtf,isActive
005930,005930,삼성전자,Samsung Electronics,KR,KRX,KRW,KRW,stock,반도체,false,true
069500,069500,KODEX 200,KODEX 200,KR,KRX,KRW,KRW,ETF,국내지수,true,true
360750,360750,TIGER 미국S&P500,TIGER US S&P500,KR,KRX,KRW,KRW,ETF,해외지수,true,true
```

### kr_screener_candidates.csv 제안 컬럼

```csv
ticker,nameKr,market,currency,assetType,strategy,riskLevel,expectedCagr,beta,mdd,dividendYield,goals,beginnerFit,tags
069500,KODEX 200,KR,KRW,ETF,core,medium,6.0,1.0,-35,1.5,core|growth,true,국내지수|코스피200|분산
360750,TIGER 미국S&P500,KR,KRW,ETF,core,medium,7.0,1.0,-34,1.3,core|growth,true,미국지수|S&P500|환노출
```

## 7. 다음 작업 제안

```text
Step 103-2. 스크리너 시장 탭 설계
- 미국
- 한국 Beta
- 현재 하드코딩 후보 데이터를 시장별 구조로 분리

Step 103-3. CSV 구조 추가
- 실제 CSV는 이 시점부터 필요

Step 103-4. MBTI 결과 적용 대상 선택
- 미국포트로 반영
- 한국포트로 반영

Step 103-5. 한국주식 포트폴리오 시뮬레이터 Beta shell 추가
- 기존 PortfolioSimulator JSX/CSS 재사용
- marketMode="KR" 구조 준비
```
