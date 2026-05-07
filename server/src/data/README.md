# FINPLE ticker master data

- `tickerMaster.js`: app/server에서 사용하는 티커 마스터 데이터입니다.
- `tickerMaster.source.csv`: 사용자가 공유한 Google Sheet/CSV 원본입니다.

현재가는 이 파일에 저장하지 않습니다. 현재가는 `assetDataProvider`가 Alpha Vantage API와 캐시를 통해 조회합니다.
