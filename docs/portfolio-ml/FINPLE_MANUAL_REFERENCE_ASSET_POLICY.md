# FINPLE Manual Reference Asset Policy

## 1. 목적

이 문서는 FINPLE 포트폴리오 시뮬레이터에서 사용하는 비시장 내부 기준자산의 운영 원칙을 정의합니다.

현재 적용 대상은 `CASH` 한 종류입니다.

## 2. CASH의 의미

`CASH`는 거래소 상장자산이나 특정 금융기관의 예금상품이 아니라 다음을 단순화하여 표현하는 FINPLE 내부 기준자산입니다.

- 현금
- 투자 대기자금
- 단기 예적금 등 현금성 보유자산

사용자 화면의 자산명은 기존과 같이 `현금 / 대기자금(예적금)`으로 표시합니다.

## 3. 계산 계약

CASH는 다음 하나의 명목 총수익률 경로만 사용합니다.

| 항목 | 정책값 |
| --- | ---: |
| 연간 명목 총수익률 | 2.0% |
| CAGR 계산 입력 | 2.0% |
| 배당률 | 0.0% |
| 분배율 | 0.0% |
| 재투자 현금수익률 | 0.0% |
| BETA | 0 |
| MDD | 0% |

예적금 이자에 해당하는 가정수익은 CAGR에 한 번만 반영합니다. `CAGR + 배당률` 또는 `CAGR + 현금분배율` 방식으로 중복 가산하지 않습니다.

## 4. 물가상승률과의 관계

CASH의 2.0%는 명목 총수익률 정책값이며 사용자가 입력한 물가상승률과 직접 연동하지 않습니다.

기본 물가상승률 2.5%에서는 CASH의 실질 구매력이 감소하는 구조입니다. 사용자가 다른 물가상승률을 입력하면 해당 시나리오의 실질가치 결과가 달라질 수 있으나, CASH의 명목수익률 자체는 자동 변경하지 않습니다.

## 5. 데이터 소유권과 갱신

CASH는 다음 데이터 경로에서 제외합니다.

- `finple_app_candidates_v2.csv`
- canonical CSV 월간 갱신
- Colab 시장데이터 수집 및 지표 재산출
- Screener 및 Asset Finder 검색 결과

따라서 canonical CSV를 교체하거나 Colab을 재실행해도 CASH 정책값은 변경되지 않습니다. CASH 정책을 변경하려면 별도의 명시적 승인과 독립 PR이 필요합니다.

## 6. 사용자 진입 경로

CASH는 시뮬레이터 Step 1에서만 추가합니다.

- `자산 추가`: 일반 시장자산 입력행 추가
- `현금 추가`: FINPLE 내부 CASH 기준자산 추가

`현금 추가`는 일반 자산 추가보다 낮은 시각적 위계로 표시합니다. 한 포트폴리오에는 CASH를 한 번만 추가할 수 있으며, 플랜별 자산 수 제한에는 포함됩니다.

## 7. 저장자료 migration

기존 localStorage, 서버 snapshot, 백업, 복제 포트폴리오에 저장된 공식 CASH는 로드 시 현재 계약으로 정규화합니다.

정규화 시 다음 사용자 입력값은 유지합니다.

- 자산 ID와 이름
- 수량과 가격
- 목표비중과 목표평가금액
- 사용자 확장 필드
- 생성·수정 시각

기존 `2.5% CAGR + 2.0% 배당률` 또는 이와 유사한 내부 CASH 값은 `2.0% 단일 총수익률 + 배당·분배 0%`로 교체합니다.

임의의 `user-input` source로 만들어진 CASH나 CASH로 확인할 수 없는 객체는 자동 승인하지 않고 기존 fail-closed 정책을 유지합니다.

## 8. 회귀검사

CASH 정책 변경 시 최소한 다음을 확인합니다.

- 공식 preset 비중 유지 및 baseline 계산
- Investment MBTI 16개 유형 비중 유지 및 계산
- localStorage legacy/current, 서버 snapshot, 백업, clone migration
- CASH CAGR 2.00% 화면 표시
- 배당·분배율 0.00%
- unknown-source CASH 차단
- 실제 `portfolioAddPolicy=deny` 자산 차단
- canonical catalog와 Screener에 CASH 미포함
- canonical CSV 교체와 CASH 정책의 독립성
