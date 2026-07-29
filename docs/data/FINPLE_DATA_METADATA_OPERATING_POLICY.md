# FINPLE 데이터·메타데이터 운영 정책

- 문서 상태: 운영 기준
- 적용 범위: canonical CSV, runtime catalog, 레버리지·인버스 메타데이터, 갱신 절차
- 관련 이력: PR #363, PR #365
- 참고 자료: `FINPLE - PR 검토 및 준비사항.pdf`

---

## 1. 목적과 최상위 원칙

FINPLE은 제도권 금융상품 승인·배포 시스템이 아니라, 사용자가 선택한 자산과 조건을 바탕으로 결과를 계산하는 포트폴리오 시뮬레이션 서비스다.

따라서 다음을 최상위 원칙으로 한다.

1. 최신 canonical CSV를 모든 화면과 계산 경로의 단일 기준으로 사용한다.
2. CSV 작성·병합·검증은 자동화한다.
3. 메타데이터는 최초 공식 검증 후 재사용한다.
4. 신규 상품 또는 공식 구조 변경이 있을 때만 해당 자산을 재검증한다.
5. 실제 숫자가 존재하는 자산을 운영 꼬리표 부족만으로 차단하지 않는다.
6. 반복 검토, 수동 복사, 다중 승인, 중복 파일 관리를 지양한다.

runtime이 읽는 기준 파일은 다음 하나다.

```text
src/data/tickers/finple_app_candidates_v2.csv
```

Screener, Simulator, MBTI, Preset, 직접 추가, 저장 포트폴리오, 비교, 상세, 리포트는 모두 동일한 `market+ticker` 행을 사용한다.

과거 CSV는 runtime import와 fallback 대상에서 제거하고, 필요하면 `archive/` 또는 저장소 외부에 보관한다.

---

## 2. 메타데이터 정책

### 2.1 역할

메타데이터는 CAGR·MDD 같은 가격지표를 수정하는 값이 아니다. 상품 구조를 설명하고 다음을 결정한다.

- 위험 경고 강도와 문구
- 포트폴리오 추가 시 확인 절차
- 분배금 표시·재투자 정책
- 사용자 화면의 배지와 설명
- 신규·변경 상품의 검증 상태

가격에서 계산한 지표는 원값을 유지한다.

### 2.2 검증 상태

#### `verified`

운용사 공식 페이지, 거래소, factsheet, 투자설명서 등 1차 자료로 구조를 확인한 상태다.

#### `pending_official_source`

레버리지·인버스 가능성이 있으나 공식 검증이 완료되지 않은 상태다.

- 일반 자산처럼 조용히 `allow`하지 않음
- 검증된 Tier로 표시하지 않음
- 확인 후 포트 추가 허용
- 3년 이력 부족 등 기존 deny 사유가 우선

#### `rejected`

이름상 후보였지만 공식자료상 레버리지·인버스가 아닌 것으로 확정한 상태다.

- 다시 pending으로 되돌리지 않음
- 레버리지·인버스 경고 생성하지 않음
- 일반 eligibility 정책으로 복귀

### 2.3 위험등급

```text
모든 숏·인버스
>>> 단일종목 정방향 레버리지
>> 섹터·테마 지수 레버리지
> 집중형 지수 레버리지
> 광범위 시장지수 레버리지
```

#### Tier 4 — 모든 숏·인버스

- 배수와 분산 수준에 관계없이 최상위 경고
- `longTermSuitability=unsuitable`
- 문구: `장기투자에 적절하지 않음`
- strong confirmation 후 추가 허용

#### Tier 3 — 단일종목 정방향 레버리지

- 분산효과 없음
- `longTermSuitability=not_recommended`
- 문구: `장기보유를 권장하지 않음`
- strong confirmation 후 추가 허용

#### Tier 2 — 섹터·테마 지수 레버리지

- 동일 산업·테마 위험에 집중
- `longTermSuitability=high_caution`
- 문구: `높은 주의 필요`
- standard confirmation 후 추가 허용

#### Tier 2 — 집중형 지수 레버리지

- 단일종목보다 분산됐지만 특정 산업·대형종목 비중이 높음
- `longTermSuitability=caution`
- 문구: `주의 필요`
- standard confirmation 후 추가 허용

#### Tier 1 — 광범위 시장지수 레버리지

- 상대적으로 높은 분산효과
- 일일 재설정과 변동성 누적 위험은 유지
- `longTermSuitability=caution`
- 문구: `주의 요함`
- standard confirmation 후 추가 허용

배수 보정:

- 인버스는 1배라도 Tier 4
- 같은 범주에서 3배는 2배보다 강한 문구
- 4배 이상 정방향은 최소 Tier 3
- 배수만으로 광범위 지수 3배를 단일종목 Tier 3으로 올리지 않음

### 2.4 갱신 주기

기존 상품은 최초 1회 공식 검증 후 registry 값을 재사용한다.

매월 다음을 반복하지 않는다.

- 전체 레버리지·인버스 재조사
- verified 상품의 공식자료 재확인
- metadata CSV 수동 재작성
- 전체 메타데이터 재승인

재검증은 다음 사건이 발생한 자산에 한정한다.

- 신규 상품
- 기초지수·배수·방향·reset frequency 변경
- 티커 변경, 합병, 청산
- 기존 분류 오류 발견

즉 정기 전수검증이 아니라 이벤트 기반으로 갱신한다.

---

## 3. CSV 작성의 자동화·체계화

### 3.1 기본 흐름

```text
공식 registry·operator 정책
+ editable universe
+ 가격·분배 데이터
+ canonical pipeline
→ candidate CSV
→ 최소 기술검사
→ runtime canonical CSV 교체
```

사람이 수천 개 행을 직접 작성하거나 복사하지 않는다.

### 3.2 registry

상품 구조는 다음 파일에서 관리한다.

```text
tools/canonical_csv/leverage_inverse_metadata_registry.csv
```

registry에는 market, ticker, 상태, 기초자산, 배수, 방향, reset frequency, 노출범위, 분산등급, 위험 Tier, 경고문구, 공식 출처, 검증자, 검증시각, 사유, active 상태를 기록한다.

### 3.3 선택적 재계산

- verified 값은 월별 실행에서 자동 재사용
- 변경되지 않은 자산은 cache·checkpoint 재사용
- registry나 operator 정책이 바뀐 자산만 재처리
- 수동 operator 값은 registry 원값과 다르면 보존
- active=false 또는 rejected는 registry-derived 값만 해제
- 신규 pending만 별도 집계

### 3.4 월별 최소 절차

```text
1. Colab 실행
2. candidate ZIP 생성
3. 필수 열·중복·숫자 파싱 등 최소 기술검사
4. 결과 검토
5. runtime canonical CSV 교체
6. build 및 배포
```

운영자는 매월 registry를 다시 작성하지 않는다.

---

## 4. 보수적인 게이트 지양·배제

### 4.1 기본 원칙

보수적이라는 이유만으로 계산 가능한 자산을 막지 않는다.

유지할 gate는 실제 계산 또는 파일 무결성에 필요한 조건이어야 한다.

### 4.2 유지할 최소 검사

- 필수 열 존재
- `market+ticker` 중복 없음
- CSV 파싱 가능
- 필요한 지표가 숫자로 읽힘
- 존재하지 않는 ticker 차단
- 목표비중 합계 검증
- 사용자와 합의된 가격·RM 이력 기준
- 실제 provider 오류와 명백한 데이터 품질 문제

### 4.3 계산 차단에 사용하지 않을 운영정보

다음은 감사·디버깅에는 보존할 수 있지만, 단독으로 계산을 막지 않는다.

- source hash
- 승인자
- release manifest
- Preview 승인 여부
- Production 승인 꼬리표
- pipelineVersion
- calculationPolicyVersion
- metric lineage
- publish approval 상태

사용자에게는 실제 문제를 직접 설명한다.

좋은 예:

```text
○○ 자산의 MDD 데이터가 없습니다.
○○ 자산은 가격 이력이 3년 미만입니다.
○○ 자산은 공식 메타데이터 검증 중입니다.
```

지양할 예:

```text
지표 출처 정보가 부족합니다.
승인된 지표 상태를 확인할 수 없습니다.
계산 정책 버전을 확인할 수 없습니다.
```

---

## 5. 비효율적인 작업 방식 지양·배제

다음을 월별로 반복하지 않는다.

- 6,029개 전체 행 수동 검토
- 검증 완료 상품 재조사
- 자산별 승인 overlay
- Preview 승인 후 별도 release 승인
- 같은 값을 여러 CSV에 복사
- Screener·Simulator·MBTI별 별도 규칙

모든 경로는 canonical CSV의 동일 행을 사용한다.

```text
CSV 한 행
→ Screener
→ Simulator
→ MBTI
→ Preset
→ 저장 포트폴리오
→ 비교·상세·리포트
```

포트폴리오 분석이 목표비중 기반이라면 평가금액은 다음으로 계산할 수 있다.

```text
자산별 배정금액 = 시작 평가금액 × 목표비중
```

실시간 가격·수량이 실제로 필요하지 않은 기능에서는 다음 의존을 지양한다.

- KIS 또는 Backend 현재가 조회
- 수량 자동계산
- 전체 조회 버튼
- 지연 후 DOM 버튼 자동 클릭
- 저장 후 catalog 재조회

자동화 실패 시에도 수천 행의 수동 작업을 운영자에게 넘기지 않는다.

우선순위:

1. 실패 원인 수정
2. cache·checkpoint 재사용
3. 변경 자산만 재실행
4. unresolved 목록만 검토
5. 전체 수동 재작성은 지양

---

## 6. 첨부 PDF에 따른 작업 개선

참고 PDF는 FINPLE 데이터 경로가 실제 목적보다 과도하게 보수적이고 복잡해진 사례를 정리한다.

문서에 반영한 개선 원칙은 다음과 같다.

### 6.1 승인 중심에서 계산 중심으로

이전의 복잡한 흐름:

```text
후보 CSV
→ 자산별 검토
→ 승인 overlay
→ release manifest
→ Production 승인
→ 계산
```

목표 흐름:

```text
Colab 최신 CSV 생성
→ 기존 canonical CSV 교체
→ 최소 기술검사
→ 앱이 동일 CSV 직접 사용
```

### 6.2 다중 runtime 경로 제거

다음이 동시에 runtime에서 살아 있지 않도록 한다.

- v1·v2 복수 CSV
- Preview·Production 별도 export
- fallback catalog
- review overlay
- 구버전 JavaScript catalog

현재 runtime canonical CSV 한 개를 기준으로 한다.

### 6.3 내부 운영정보를 사용자 오류로 노출하지 않음

provenance, hash, 승인상태, pipeline version 문제를 사용자에게 모호한 계산 오류로 표시하지 않는다.

사용자에게는 실제 수치 누락, 이력 부족, 상품 위험, provider 오류처럼 이해 가능한 사유만 표시한다.

### 6.4 구현 상태는 별도 확인

이 절은 최상위 운영 방향이다.

현재 코드에 남아 있는 approval·fallback·가격조회·수량조회 경로의 실제 제거 여부는 별도 코드 조사와 PR로 확인한다. 문서에 적혔다는 이유만으로 구현 완료로 간주하지 않는다.

---

## 7. 정책 우선순위

```text
1. inactive 또는 operator exclusion
2. provider 데이터 사용 불가
3. 가격·RM 이력 부족
4. verified Tier 1~4 경고 확인
5. pending metadata 강한 확인
6. 일반 자산 allow
```

레버리지·인버스라는 이유만으로 자산을 목록에서 제거하지 않는다.

---

## 8. 현재 작업 순서

### 완료

```text
PR #365 병합
```

### 초기 registry 완성

```text
1. 한국 후보 88개 공식 검증
2. 미국 나머지 109개 issuer별 공식 검증
3. registry 완성
```

각 자산은 다음 중 하나로 확정한다.

- `verified`
- `rejected`

검증 중에는 `pending_official_source`를 유지한다.

### 최종 데이터 생성

```text
registry 완성
→ Colab 최종 1회 실행
→ candidate ZIP 검토
→ runtime canonical CSV 교체 PR
```

초기 197개 검증이 끝난 뒤에는 신규·변경 자산만 추가 검증한다.

---

## 9. 월별 확인 항목

```text
newPendingMetadataCount
changedVerifiedMetadataCount
rejectedMetadataCount
failedAssetCount
structuralValid
publishable
```

- 메타데이터 변경 수가 0이면 별도 작업 없음
- 신규 pending만 다음 검증 배치에 추가
- 기존 verified 전체를 다시 조사하지 않음
- 실제 계산 실패 자산만 reason code로 검토

---

## 10. 변경 관리

정책을 변경할 때는 다음을 따른다.

1. 이 문서를 갱신한다.
2. registry 또는 코드 계약을 같은 PR 또는 연결 PR에서 수정한다.
3. 변경 이유와 영향을 PR에 기록한다.
4. 과거 PR은 감사 이력으로 남긴다.
5. 운영 기준은 이 문서를 우선한다.
6. 종목별 값은 registry를 우선한다.
7. 실제 동작은 코드와 테스트로 고정한다.

```text
운영 원칙 확인 → 이 문서
종목별 확정값 확인 → registry
변경 배경 확인 → Issue·PR
실제 판정 확인 → 코드·테스트
```

---

## 11. 금지·지양 목록

- 월별 메타데이터 전수 재검증
- 수천 행 수동 CSV 작성
- 동일 데이터를 여러 runtime CSV로 관리
- 실제 숫자가 있는데 승인 꼬리표 부족만으로 계산 차단
- Preview·Production 승인을 계산조건으로 사용
- 내부 provenance 오류를 사용자 계산 오류로 노출
- MBTI·Preset·직접 추가 경로별 별도 규칙
- 불필요한 현재가·수량·버튼 자동클릭 의존
- 이름 추론만으로 `verified` 저장
- 레버리지·인버스라는 이유만으로 목록에서 제거

---

## 12. 참고 이력

- PR #363: 포트폴리오 eligibility 및 분배 시뮬레이션 정책
- PR #365: 차등 레버리지·인버스 메타데이터 정책과 registry lifecycle
- `FINPLE - PR 검토 및 준비사항.pdf`: 과도한 provenance·승인 gate, 다중 CSV 경로, 가격·수량 조회, 반복 전수검토를 단순화하기 위한 운영 방향

---

## 13. 비주식 선물 exposureScope

공식 상품정보에서 기초자산이 확인된 경우 다음 값을 사용한다.

- 통화선물: `currency_futures`
- 국채선물: `sovereign_bond_futures`
- 원자재선물: `commodity_futures`

정방향 비주식 선물 레버리지는 Tier 2, `high_caution`, `high`,
`standard`, `높은 주의 필요`로 분류한다. 모든 비주식 선물 인버스는
기초자산 종류와 관계없이 Tier 4를 적용한다.

비주식 선물 경고에는 일일 재설정과 경로의존성, 선물 롤오버를 포함한다.
통화는 환율, 국채는 금리·듀레이션, 원자재는 집중도·만기교체와
현물가격 대비 장기 성과 차이를 함께 설명한다.

이 분류는 경고 확인 후 포트폴리오 추가를 허용하는 기존 confirm 정책이며,
새로운 deny 또는 승인 gate를 추가하지 않는다.

---

## 14. 미국 원자재·암호자산·회사채 및 ETN 분류

공식 상품정보에서 원자재 현물 또는 현물보유 상품을 기초로 하면
`commodity_asset`, 단일 Bitcoin·Ether 등의 일일 수익률을 추종하면
`crypto_asset`, 회사채 지수를 추종하면 `corporate_bond_index`를
사용한다. 정방향 레버리지는 Tier 2,
`high_caution`, `high`, `standard`, `높은 주의 필요`로 분류하고,
인버스는 기존 원칙대로 Tier 4를 적용한다.

ETN은 `exposureType`에 ETN 구조를 기록하고 발행사 신용위험을 별도로
안내한다. 이 구조 분류는 기존 방향·분산범위 Tier를 바꾸거나 새로운
deny·승인 gate를 추가하지 않는다.
