# FINPLE Step 114 KIS Confirmation Email Draft

Date: 2026-06-28
Scope: Issue #221 Step 114 KIS written confirmation request

## Purpose

This draft is for requesting written confirmation from Korea Investment & Securities before FINPLE uses KIS Open API as a production scenario-data source.

The goal is not to ask whether the endpoint exists. Endpoint capability evidence is already recorded. The goal is to confirm whether FINPLE may:

- call overseas historical price and rights endpoints for scenario analytics
- store raw API response rows internally for audit and recalculation
- derive monthly returns from those rows
- display derived benchmark, return, and scenario analytics to FINPLE users
- operate under the customer terms, agency terms, or a separate paid/partner agreement

Until a written answer is received and reviewed, FINPLE keeps:

- `termsReviewed=no`
- `rawRedistributionReviewed=no`
- `capabilityReady=false`
- provider calls blocked
- provider adapter implementation blocked
- `scenario_monthly_returns.csv` absent

## Korean Email Draft

Subject:

```text
[FINPLE] 한국투자 Open API 시세 데이터 활용 가능 범위 확인 요청
```

Body:

```text
안녕하세요.

FINPLE에서 포트폴리오 시나리오 분석 기능을 준비하면서 한국투자증권 Open API의 활용 가능 범위를 확인하고자 문의드립니다.

현재 검토 중인 사용 목적은 다음과 같습니다.

1. 해외주식 기간별시세 API를 통해 미국 ETF/주식의 과거 가격 데이터를 조회
2. 해외주식 기간별권리조회 또는 권리종합 API를 통해 배당, 분할, 권리 정보를 검토
3. API 응답 원본 row를 내부 감사 및 재계산 목적으로 서버/cache/database에 보관
4. 원본 row에서 월간 수익률, 벤치마크 수익률, 시나리오 분석용 파생 지표를 계산
5. 계산된 월간 수익률 및 시나리오 분석 결과를 FINPLE 사용자 화면에 표시

확인하고 싶은 사항은 아래와 같습니다.

1. 위 사용 방식이 한국투자 Open API 고객 이용약관 또는 제휴기관 이용약관상 허용되는지요?
2. API 응답 원본 row를 FINPLE 내부 cache/database에 저장해도 되는지요?
3. 원본 row에서 계산한 월간 수익률, 벤치마크 수익률, 위험/수익률 시나리오 분석 결과를 FINPLE 사용자에게 표시해도 되는지요?
4. 원본 데이터 또는 파생 지표의 보관 기간, 재배포, 화면 표시, 출처 표기, 상업적 이용에 대한 제한이 있는지요?
5. 위 사용을 위해 별도 유료 계약, 제휴기관 등록, 법인 승인, 추가 심사, 또는 별도 라이선스가 필요한지요?
6. 해외주식 기간별시세 및 권리조회 API를 위 목적으로 사용할 때 별도의 호출량, 운영 정책, rate limit, 또는 서비스 제한 조건이 있는지요?

검토 중인 주요 API 후보는 다음과 같습니다.

- 해외주식 기간별시세: /uapi/overseas-price/v1/quotations/dailyprice
- 해외주식 기간별권리조회: /uapi/overseas-price/v1/quotations/period-rights
- 해외주식 권리종합: /uapi/overseas-price/v1/quotations/rights-by-ice

FINPLE은 약관 및 라이선스 범위를 명확히 확인하기 전까지 해당 API를 운영 데이터 수집, 원본 데이터 저장, 사용자 대상 표시 용도로 사용하지 않을 예정입니다.

가능하시다면 위 항목에 대해 서면으로 회신 부탁드립니다.

감사합니다.
FINPLE
```

## Evidence To Attach Or Link

- KIS Developers portal: `https://apiportal.koreainvestment.com/`
- KIS customer terms endpoint: `https://apiportal.koreainvestment.com/api/terms/public?termsType=MARKET`
- KIS agency terms endpoint: `https://apiportal.koreainvestment.com/api/terms/public?termsType=AGENCY`
- KIS official sample repository: `https://github.com/koreainvestment/open-trading-api`
- FINPLE intended endpoints:
  - `/uapi/overseas-price/v1/quotations/dailyprice`
  - `/uapi/overseas-price/v1/quotations/period-rights`
  - `/uapi/overseas-price/v1/quotations/rights-by-ice`

## How To Record The Response

If KIS approves the use case in writing, record the response before changing any gate:

```text
reviewOwner=<FINPLE reviewer email or owner>
reviewedAt=<ISO timestamp>
approvalEvidence=<KIS ticket/email URL or archived evidence path>
termsReviewed=yes
rawRedistributionReviewed=yes only if raw cache and derived display are explicitly approved
status=ready_for_runtime_preflight only if every required capability condition is satisfied
```

If KIS rejects the use case, or does not clearly approve raw-row storage and derived user-facing display:

```text
termsReviewed=no
rawRedistributionReviewed=no
status=blocked_pending_alternate_licensed_source
nextAction=evaluate_paid_or_licensed_market_data_provider
```

## Rejection Or No-Response Route

A rejection does not block FINPLE permanently. It means KIS should not be used as the production scenario-data source for this use case.

The next safe route would be to evaluate paid or licensed providers whose terms explicitly allow:

- historical adjusted prices
- dividend/split/corporate-action data
- raw-data retention or audit cache
- derived monthly return calculation
- user-facing display of derived analytics
- commercial SaaS use

Alpha Vantage or another paid API can be considered in that phase, but it should pass the same source-policy fields before runtime work starts:

```text
selectedProvider
selectedEndpoint
licenseDecision
rawPayloadPolicy
redistributionDecision
reviewOwner
legalReviewer
reviewedAt
evidenceUrl
```

Provider adapter work and `scenario_monthly_returns.csv` writes remain blocked until the selected source passes those fields.
