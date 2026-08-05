# FINPLE Trading Lab TSC-4B — Multi-Asset Strategy Registry

기준일: 2026-08-05  
대상: 대표자 개인계좌 전용 비공개 Trading Lab  
선행 PR: #443  
연결 Issue: #441

## 1. 결론

초기 거래대상 8개는 단일 선택이 아니라 복수 선택이 가능하다.

```text
TQQQ / SQQQ
SOXL / SOXS
UPRO / SPXU
TNA  / TZA
```

다만 다음 개념을 분리한다.

```text
선택 종목 수 = 실시간 감시·신호 평가 대상
동시 보유 수 = 계좌 전체 위험한도 안에서 실제로 열 수 있는 포지션 수
주기당 신규진입 수 = 같은 평가주기에 승인 후보로 남길 신규 주문 수
```

기본값:

| 항목 | 기본값 |
| --- | ---: |
| 감시 종목 | 8개 모두 선택 가능 |
| 최대 동시 보유 | 2종목 |
| 평가주기당 신규진입 | 1건 |
| 계좌 총노출 | 70% |
| 계좌 총위험 | 2% |
| 상반 ETF 동시보유 | 차단 |
| 동일 종목 미체결 주문 중복 | 차단 |

## 2. 다자산 신호 처리

각 선택 종목은 기존 TSC-1 전략으로 독립 평가한다.

```text
선택 종목별 1분봉 입력
→ EMA / VWAP / momentum / volume / model / cost gate
→ 종목별 buy / sell / flat / hold 결정
→ Portfolio Coordinator
→ 계좌 단위 승인 후보와 차단 후보 분리
```

진입 후보의 기본 우선순위는 다음을 함께 반영한다.

- 예상 순기대수익
- 상승 확률
- 모델 confidence
- 스프레드 비용

동점은 ticker 오름차순으로 결정해 deterministic 결과를 유지한다.

## 3. 상반 ETF 계약

기본 pair group:

| 기초지수·섹터 | 정방향 | 역방향 |
| --- | --- | --- |
| Nasdaq-100 | TQQQ | SQQQ |
| Semiconductor | SOXL | SOXS |
| S&P 500 | UPRO | SPXU |
| Russell 2000 | TNA | TZA |

기본 설정에서는 같은 pair의 정방향·역방향 ETF를 동시에 보유하지 않는다.

예:

```text
TQQQ 보유 중 SQQQ 신규진입 → opposing_leveraged_pair_conflict
SOXS 주문 대기 중 SOXL 신규진입 → opposing_leveraged_pair_conflict
```

관리자 화면에 연구 예외 설정은 제공하지만 기본값은 차단이다.

## 4. 계좌 단위 제약

Portfolio Coordinator는 신규 매수 후보에 다음을 적용한다.

- 이미 보유 중인 ticker 차단
- 동일 ticker 미체결 주문 중복 차단
- 상반 ETF pair 충돌 차단
- 최대 동시 보유 수
- 평가주기당 신규진입 수
- 계좌 총노출 비율
- 계좌 총위험 비율

청산 주문은 위험 감소 행위이므로 신규진입 용량 제한보다 우선한다.

```text
sell decision
→ risk_reducing_exit_priority
→ entry capacity와 무관하게 통과 후보
```

이 Coordinator 결과도 주문 제출 권한을 열지 않는다.

```text
orderSubmissionAllowed = false
providerCallsAllowed = false
```

## 5. 영구 전략 레지스트리

신규 migration:

```text
server/migrations/20260805_trading_strategy_registry.sql
```

테이블:

### trading_strategy_drafts

변경 가능한 관리자 초안.

- 전략 파라미터
- 연구 목표
- 다자산·계좌 제약
- revision
- lifecycle status
- checksum
- 수정자·수정시각

### trading_strategy_versions

불변 승인 스냅샷.

- version number
- source draft revision
- 승인 당시 전체 전략 JSON
- checksum
- 승인자·승인시각
- approved / retired 상태

### trading_strategy_audit_events

전략 수명주기 감사 이벤트.

- draft_created
- draft_updated
- review_requested
- approval_created
- version_retired

Credential, 계좌번호, broker payload는 저장하지 않는다.

## 6. 수명주기

```text
draft
→ review_requested
→ approved_snapshot_created
```

승인본:

```text
approved
→ retired
```

승인본 생성은 실행 승인이 아니다.

```text
runtimeActivationAllowed = false
orderSubmissionAllowed = false
providerCallsAllowed = false
liveActivationAllowed = false
```

Private Trading Worker가 승인본을 읽는 단계는 TSC-4C에서 별도 구현한다.

## 7. 동시수정 방지

전략 초안은 optimistic locking을 사용한다.

```text
PUT expectedRevision = 현재 revision
DB UPDATE WHERE revision = expectedRevision
불일치 → HTTP 409 SCALPING_DRAFT_REVISION_CONFLICT
```

검토 요청과 승인본 생성도 같은 revision 검사를 통과해야 한다.

## 8. 기능 플래그와 후퇴 동작

영구 레지스트리 사용 조건:

```text
DATABASE_URL configured
FINPLE_TRADING_STRATEGY_REGISTRY_ENABLED=true
20260805_trading_strategy_registry.sql migration applied
```

조건이 충족되지 않으면 기존 TSC-4A 메모리 초안으로 후퇴한다.

```text
mode = memory_fallback
survivesProcessRestart = false
```

Schema가 준비된 경우:

```text
mode = postgres_registry
survivesProcessRestart = true
```

코드 반영만으로 운영 DB migration이나 기능 플래그 변경은 수행하지 않는다.

## 9. 관리자 API

```text
GET  /api/admin/trading-readiness/scalping-dashboard
PUT  /api/admin/trading-readiness/scalping-strategy-draft
POST /api/admin/trading-readiness/scalping-strategy-draft/review-request
POST /api/admin/trading-readiness/scalping-strategy-draft/approve
POST /api/admin/trading-readiness/scalping-strategy-versions/:versionId/retire
```

모든 경로는 `requireAdminAccess`를 통과한다.

주문·체결·계좌·잔고 API는 추가하지 않는다.

## 10. 관리자 화면

추가 표시·조정 항목:

- 거래대상 1~8개 복수 선택
- 선택 수 / 8
- pair별 정·역방향 관계
- 최대 동시 보유
- 평가주기당 신규진입
- 계좌 총노출
- 계좌 총위험
- 상반 ETF 동시보유 연구 예외
- 동일 ticker 미체결 주문 중복 연구 예외
- DB·기능 플래그·schema 상태
- draft lifecycle
- 검토 요청
- 불변 승인본 생성
- 승인본 목록과 checksum
- 승인본 폐기와 사유
- 감사 이벤트

## 11. 검증

전용 CI:

```text
.github/workflows/trading-scalping-registry-check.yml
```

검증 범위:

- 8개 복수 선택
- 신호 우선순위 정렬
- 다중 독립종목 진입
- pair conflict 차단
- 명시적 연구 예외
- 총노출·총위험 차단
- 청산 우선
- 잘못된 계좌 한도 fail-closed
- 관리자 초안 validation
- checksum 결정성
- 기능 플래그 비활성 시 DB 미호출
- 영구 초안 insert·revision
- stale revision 409
- 검토 요청 전 승인 차단
- 불변 승인본 생성
- migration 비파괴성
- Admin Console 공개 경로 미노출
- 프런트엔드 build

## 12. 다음 단계

### TSC-4C — Private Shadow Worker

- 승인된 전략 버전만 로드
- 복수 ticker KIS WebSocket 구독
- 1분 bar 완성 시 종목별 평가
- Portfolio Coordinator 적용
- 가상 주문·부분체결·미체결 기록
- 전략 version checksum과 성과 snapshot 연결
- `/ADMIN CONSOLE` 실시간 KPI·차트 갱신
- 실제 주문 제출은 계속 차단
