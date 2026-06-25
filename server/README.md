# FINPLE Asset Proxy

FINPLE 포트폴리오 앱에서 자산 데이터를 조회하기 위한 로컬 백엔드 프록시입니다.

## 실행

```bash
npm.cmd install
copy .env.example .env
npm.cmd run dev
```

## 기본 테스트

```text
http://localhost:5050/api/health
http://localhost:5050/api/assets/QQQ
```

## AI 분석 mock endpoint

Step 113-3A 기준 AI 분석은 외부 AI API를 호출하지 않는 mock 모드입니다.

```text
POST http://localhost:5050/api/ai/portfolio-analysis
```

필수 입력은 `assets` 배열입니다. 각 자산은 `ticker`, `market`, `weight`를 포함해야 하며 비중 합계는 100% 근처여야 합니다. 응답은 기존 FINPLE 계산값을 재계산하지 않고 포트폴리오 구조와 데이터 한계를 설명합니다.

## Provider 설정

기본값은 `mock`입니다. 실제 Alpha Vantage 연결을 테스트하려면 `.env`를 아래처럼 수정합니다.

```env
ASSET_DATA_PROVIDER=alpha_vantage
ALPHA_VANTAGE_API_KEY=발급받은_API_KEY
ASSET_PRICE_CURRENCY=KRW
DEFAULT_USD_KRW_RATE=1350
```

`ALPHA_VANTAGE_FETCH_FX=true`로 설정하면 USD/KRW 환율도 Alpha Vantage에서 조회합니다. 다만 무료 호출량을 아끼기 위해 기본값은 `false`입니다.

`ALPHA_VANTAGE_FETCH_OVERVIEW=true`로 설정하면 이름, Beta, 배당률 등 일부 지표도 추가 조회합니다. ETF에 따라 일부 값은 비어 있을 수 있습니다.

## Step 45 — DB 연결 준비

서버 DB 저장 구조는 선택 사항입니다. `DATABASE_URL`이 없으면 기존 자산 조회/티커 검색 기능은 그대로 동작합니다.

DB 연결 상태 확인:

```text
http://localhost:5050/api/db/health
```

초기 스키마:

```text
server/db/migrations/001_init.sql
```
