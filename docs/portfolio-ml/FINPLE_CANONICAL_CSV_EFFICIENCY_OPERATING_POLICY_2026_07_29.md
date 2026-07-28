# FINPLE Canonical CSV 효율성 우선 운영정책

기준일: 2026-07-29  
상태: 사용자 승인 운영방향 / 구현 전 정책 문서

## 1. 결론

FINPLE의 런타임 데이터 기준은 **Colab에서 생성한 최신 canonical CSV 1개**로 단순화한다.

FINPLE은 금융기관의 상품승인 시스템이 아니라, 사용자가 직접 입력하거나 선택한 포트폴리오를 계산하는 분석 SaaS다. 따라서 CAGR, BETA, MDD, 배당률 등 계산에 필요한 값이 canonical CSV에 정상적으로 존재하면 곧바로 계산한다.

다음 메타데이터는 사용자 계산을 막는 필수조건으로 사용하지 않는다.

- 자산별 승인 상태
- source hash
- pipeline version
- calculation policy version
- release approval
- Preview 승인 여부
- productionPublishReady
- appExportApproved
- 승인자·승인시각

## 2. 문제가 발생한 이유

기존 구조는 CSV를 최종 데이터가 아니라 다음 단계의 후보 데이터로 취급했다.

```text
Colab CSV
→ review overlay
→ lineage 검증
→ release manifest
→ Production 승인
→ 사용자 계산
```

이 구조에서 실제 CAGR·BETA·MDD·배당 값이 존재해도 승인·출처·버전 메타데이터가 누락되면 계산이 차단됐다.

그 결과 동일한 CSV 값을 사용하는 포트폴리오 중 일부만 계산되고, MBTI 포트폴리오 등 기존 생성 경로는 다음 문구와 함께 보류되는 문제가 발생했다.

- 승인된 지표 상태를 확인할 수 없습니다.
- 지표 계산 계약을 확인할 수 없습니다.
- 지표 출처 정보가 부족합니다.

이 조건들은 계산식의 기술적 필수조건이 아니라 이후 추가된 운영정책이었다.

## 3. 새로운 단일 런타임 계약

### 3.1 단일 데이터 원천

```text
runtime canonical CSV:
src/data/tickers/finple_app_candidates_v2.csv
```

- Screener
- Simulator
- MBTI 포트폴리오
- 프리셋 포트폴리오
- 저장 포트폴리오 재계산

모든 경로가 동일한 `market + ticker` 행을 사용한다.

### 3.2 자산 계산 필드

사용자 계산에 필요한 기본 필드는 다음으로 제한한다.

- market
- ticker
- name
- CAGR
- BETA
- MDD
- dividendYield
- 목표비중

필요한 경우 자산 유형과 표시용 설명 필드를 추가할 수 있으나, 승인 메타데이터가 계산을 차단해서는 안 된다.

### 3.3 계산 허용 조건

다음 조건을 충족하면 계산한다.

```text
CAGR 숫자 존재
BETA 숫자 존재
MDD 숫자 존재
배당재투자 사용 시 배당률 숫자 존재
목표비중 합계 정상
market + ticker가 canonical CSV에 존재
```

### 3.4 계산 차단 조건

다음 실제 데이터 문제만 계산 차단 사유로 유지한다.

- 존재하지 않는 ticker
- 필수 숫자 누락
- 숫자 파싱 실패
- 중복 `market + ticker`
- 비중 합계 오류
- CSV 구조 파손

사용자 문구도 실제 원인을 직접 표시한다.

예:

- `QQQ의 MDD 데이터가 없습니다.`
- `KR:069500 자산을 찾을 수 없습니다.`
- `목표비중 합계가 100%가 아닙니다.`

## 4. 제거할 런타임 게이트

사용자-facing baseline 계산에서 다음 reason code와 검사를 제거한다.

- `missing_metric_lineage`
- `invalid_production_metric_approval`
- `metric_source_not_publish_approved`
- `unsupported_calculation_policy_version`
- `unsupported_pipeline_version`
- provenance·release·approval metadata 부재에 따른 계산 차단

다음 사용자 문구도 제거한다.

- 지표 출처 정보가 부족합니다.
- 지표 계산 계약을 확인할 수 없습니다.
- 승인된 지표 상태를 확인할 수 없습니다.

내부 개발 참고용 메타데이터를 파일에 남기는 것은 가능하지만, 사용자 계산 허용 여부와 연결하지 않는다.

## 5. CSV 갱신 절차

앞으로 CSV 갱신은 다음 절차로 제한한다.

```text
1. Colab 실행
2. finple_app_candidates_v2.csv 생성
3. 기존 canonical CSV 교체
4. 최소 기술검사 실행
5. build
6. Preview 화면 확인
7. 배포
```

최소 기술검사:

- 필수 열 존재
- `market + ticker` 중복 없음
- CAGR·BETA·MDD·배당률 숫자 파싱
- 행 수 확인
- 한국 6자리 티커 앞자리 0 보존
- CSV 문법 오류 없음

자산별 승인, release manifest 승인, Preview 승인 상속, source hash 승인 절차는 반복하지 않는다.

## 6. 과거 데이터 경로 정리

런타임이 여러 CSV와 fallback을 동시에 선택하지 않도록 한다.

제거 또는 runtime import 차단 대상:

- v1 CSV
- 오래된 balanced CSV
- Preview 전용 runtime overlay
- Production fallback catalog
- 사용자 계산용 release manifest 의존

과거 파일은 필요 시 `archive/` 또는 저장소 외부에 보관하되 JavaScript runtime import 대상에서 제외한다.

## 7. 포트폴리오 생성 경로 통합

모든 포트폴리오 생성 경로는 하나의 lookup 함수를 사용한다.

```js
const asset = csvByMarketTicker.get(`${market}:${ticker}`);
```

해당 행에서 사용자 계산 필드를 직접 복사한다.

```text
name
market
ticker
cagr
beta
mdd
dividendYield
```

적용 대상:

- 직접 자산 추가
- 기본 프리셋
- 성장형 등 예시 포트폴리오
- 투자 MBTI 포트폴리오
- 저장 포트폴리오 재로드

MBTI의 `setTimeout` 기반 `전체 조회` 버튼 강제 클릭은 제거한다.

## 8. 가격 자동조회와 수량 제거 방향

FINPLE 분석은 목표비중 기반으로 계산하므로 실시간 가격과 수량은 필수조건이 아니다.

```text
자산별 배정금액 = 시작 평가금액 × 목표비중
```

후속 작업에서 다음을 제거한다.

- KIS 현재가 자동조회
- Backend 현재가 조회
- 수량 자동계산
- 현재가 열
- 수량 열
- 전체 조회 버튼
- MBTI 생성 후 자동 조회

KIS 또는 외부 가격조회 기능을 제거하더라도 CAGR·BETA·MDD·배당률 기반 시뮬레이션은 유지한다.

## 9. 구현 PR 분리

### PR 1 — 즉시 계산 복구

제목:

```text
Simplify portfolio baseline calculation to canonical CSV metrics
```

범위:

1. provenance·승인·release gate 제거
2. 실제 필수 숫자 존재 여부만 계산조건으로 사용
3. 불필요한 출처·승인 사용자 문구 제거
4. MBTI·프리셋·직접 추가에 동일 계산조건 적용
5. 모든 정상 포트폴리오의 Step 2·3 계산 복구
6. CSV와 Vercel 설정은 변경하지 않음

### PR 2 — 가격·수량·API 제거

범위:

- 현재가·수량 UI 제거
- KIS/Backend 가격조회 제거
- 전체 조회 제거
- 목표비중 기반 평가금액 계산으로 통일

### PR 3 — 데이터 경로 정리

범위:

- runtime canonical CSV 1개만 유지
- v1·old·fallback import 제거
- Preview/Production overlay의 사용자 계산 의존 제거
- archive 정책 정리

## 10. 완료조건

다음 포트폴리오가 모두 동일한 계산조건으로 동작해야 한다.

- 성장형 프리셋
- 투자 MBTI 생성 포트폴리오
- 직접 생성 포트폴리오
- 저장 후 hard reload 포트폴리오
- 서버 authoritative load 포트폴리오

필수 검증:

- Step 2 카드·순위·비교차트 출력
- Step 3 상세분석 출력
- CAGR·MDD·배당률 표시
- 동일 `market + ticker`는 생성 경로와 무관하게 동일 지표 사용
- 실제 필수 데이터 누락 자산만 구체적 사유로 차단
- 6,029개 Screener 유지
- CSV 갱신 후 별도 자산별 승인작업 없음

## 11. 재발 방지 원칙

1. 사용자 계산 로직에 release 승인·hash·pipeline version을 새 필수조건으로 추가하지 않는다.
2. 새 데이터 검증 기능은 사용자 계산 차단이 아니라 개발용 리포트로 분리한다.
3. 계산값이 존재하면 계산하고, 실제 필수값이 없을 때만 차단한다.
4. 동일 데이터를 사용하는 포트폴리오 생성 경로별로 서로 다른 gate를 만들지 않는다.
5. 새 CSV 갱신은 최소 구조검사와 화면 QA만 수행한다.
6. FINPLE의 현재 목표는 금융기관급 데이터 승인체계가 아니라 효율적인 포트폴리오 시뮬레이션 제공이다.

## 12. 변경 금지 경계

이 정책은 다음을 의미하지 않는다.

- CAGR·BETA·MDD 계산식을 임의 변경
- CSV의 누락값을 임의 생성
- 존재하지 않는 자산 허용
- 비정상 숫자를 문자열 변환으로 숨김
- 특정 종목 매수·매도 추천

핵심은 **실제 숫자와 구조만 검사하고, 불필요한 승인 메타데이터로 사용자 계산을 막지 않는 것**이다.
