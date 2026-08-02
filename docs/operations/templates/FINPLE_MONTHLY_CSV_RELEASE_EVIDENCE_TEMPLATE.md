# FINPLE 월간 CSV 릴리스 증적

비밀값, 토큰, provider credential, 전체 환경변수 값은 기록하지 않는다. SHA는 승인된 파일의 무결성 식별자만 기록한다.

## 실행 정보

- 기준월 (`YYYY-MM`):
- 생성일시 및 타임존:
- 운영자:
- 승인자 / 승인시각:
- Issue / PR / 승인된 main SHA:
- source identity / 공급자:
- 이용약관·라이선스 확인 상태:
- 수집시각:

## 불변 입력 및 binding

| 항목 | 경로 또는 identity | sizeBytes | SHA-256 |
| --- | --- | ---: | --- |
| 원본 입력 |  |  |  |
| candidate ZIP |  |  |  |
| source app-export |  |  |  |
| release manifest |  |  |  |
| source manifest |  |  |  |
| release/source binding |  |  |  |

원본 불변 보존 위치와 이전 원본 보존 여부:

## inventory

- universe version:
- asset count:
- monthly asset count:
- monthly row count:
- shard count:
- metricDataThroughMonth:
- partial month excluded:
- 이전 Production 대비 asset / row / identity / coverage / shard 변화:
- 추가 identity:
- 삭제·결측 identity:
- QQQ / SCHD / TLT / GLD 유지 결과:

## 검증 결과

| 명령 또는 확인 | 결과 | 증적 위치 |
| --- | --- | --- |
| candidate 검증 |  |  |
| release/source/binding 검증 |  |  |
| index/shard JSON·size·SHA 검증 |  |  |
| `npm.cmd run check:p3-step4-monthly-artifact` |  |  |
| `npm.cmd run check:p3a-production-monthly-artifact-publication` |  |  |
| `npm.cmd run check:production-deployment-control` |  |  |
| missing `/app-data/*` 404 |  |  |
| Protected Preview Personal Step 4 |  |  |
| console / CORS / mutation |  |  |

## 배포 및 원복

- Protected Preview deployment / exact candidate SHA:
- Preview 임시 환경변수·CORS 원복 확인:
- Production deployment ID / SHA:
- backend deployment ID / SHA 및 compatibility 결과:
- rollback target deployment ID / SHA:
- rollback artifact 보존 위치:
- Postdeploy artifact / Step 4 결과:

## 예외와 사고

- 수동 검토 항목:
- 관측 한계:
- incident / 조치 / 재검증:
- 사용자·결제·포트폴리오·DB mutation 없음 확인:
