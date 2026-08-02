# FINPLE 월간 CSV 운영 절차

## 목적과 경계

이 문서는 FINPLE Step 4가 사용하는 검증된 월간 수익률 artifact를 매월 교체할 때의 반복 절차다. 자산 검색·지표·eligibility의 source of truth는 canonical runtime catalog이고, Step 4의 월간 시계열 source of truth는 승인된 release manifest에 binding된 app-export다. 두 데이터 소유권을 합치지 않는다.

이 절차는 수집 권한이나 배포 승인을 부여하지 않는다. 월간 CSV 신규 수집, provider API 호출, candidate/artifact 생성, 환경변수·CORS·domain 변경, Production 배포는 매 회 별도 승인이 있어야 한다. `data/processed/scenario_monthly_returns.csv`는 별도의 P0 source/license gate가 적용되는 경로이며 현재 공개 Step 4의 versioned app-export shard와 혼용하지 않는다.

## 현재 구현 감사 기준 (2026-08-03)

현재 공개 artifact는 `public/app-data/finple-universe-v2-2026-07-24/`에 versioned, immutable 파일로 보존된다.

- canonical catalog: 6,029 assets
- monthly coverage: 5,347 assets / 701,485 rows
- shard inventory: 64 JSON shards
- `metricDataThroughMonth`: `2026-06`
- release: `production-app-export-release.json`
- source manifest: `app-preview-manifest.json`
- overlay / index: `metrics-overlay.json`, `monthly-returns-index.json`
- shards: `monthly-returns/monthly-returns-00.json` … `monthly-returns-3f.json`

이 수치는 위 날짜의 참고 snapshot이다. 다음 달의 정책 상수가 아니며, 검증에서는 manifest와 index에서 값을 파생한다.

## 실제 데이터 흐름과 소유권

1. 운영자가 보존하는 외부 원천은 canonical universe와 US/KR 일별 가격 CSV, KR metrics overlay다. 저장소의 현행 delta runbook은 Google Drive의 `monthly-metrics/<run>/combined/`와 versioned `monthly-metrics/universe-deltas/<universeVersion>/` 구조를 사용한다. raw 원천은 저장소에 commit하지 않는다.
2. `scripts/prepare_monthly_metrics_candidate_inputs.py`가 승인된 외부 입력을 One-Click용 다섯 파일로 정규화한다. 이 도구는 가격을 다운로드하거나 metric을 계산하지 않는다.
3. 기존 One-Click의 `run_finple_production_candidate_package` 단계가 candidate package를 만든다. 수집부터 candidate까지를 수행하는 안전한 단일 repo CLI는 없다.
4. `scripts/export_finple_app_preview.py`가 candidate package를 source app-export, metrics overlay, monthly index, QA summary, proxy lineage, shards와 deterministic ZIP으로 변환한다.
5. `scripts/build_review_gated_app_export.py`가 승인 metadata와 exact source/candidate/Git binding을 가진 production release manifest를 만든다. 복구가 필요한 경우 `scripts/recover_production_app_export_source.py`가 외부 Run A/B byte identity와 receipt를 검증한다.
6. `scripts/stage_app_preview_vercel.py`는 protected Preview용 외부 Build Output을 만들고, `scripts/stage_production_app_export_vercel.py`는 승인된 release/source/index/shard binding을 외부 Production staging에 고정한다. 두 도구 모두 deploy/promote하지 않는다.
7. 승인된 versioned artifact만 `public/app-data/<universeVersion>/`에 들어간다. Vite의 기본 `public` 복사로 `dist/app-data/<universeVersion>/`가 생성된다.
8. `vercel.json`은 실제 정적 파일을 먼저 제공하고, 없는 `/app-data/*`는 `app-data/404.txt`로 HTTP 404를 반환한 뒤 일반 SPA route를 처리한다. missing artifact가 `index.html` 200으로 fallback하면 실패다.

이전 exact source ZIP/extracted directory, 증적, 직전 versioned artifact와 Vercel deployment는 덮어쓰거나 삭제하지 않고 rollback 입력으로 보존한다.

## A. 기준월 확정

1. 생성일과 타임존, 요청 기준일, `metricDataThroughMonth`를 각각 기록한다.
2. 마지막으로 완전히 종료된 달까지만 포함한다. 진행 중인 현재 월은 포함하지 않는다. 현행 입력 준비기는 `partialMonthPolicy=exclude_from_metrics`를 사용하고 요청일이 달력상 월말이 아니면 직전 달 말로 자른다.
3. KR/US 각각의 월말 휴장일에는 해당 시장·자산의 마지막 유효 거래일 관측치를 월말 값으로 사용한다. 두 시장의 시차 때문에 한 시장의 날짜를 다른 시장의 완료 근거로 재사용하지 않는다.
4. 달력 월말 판정과 거래소 휴장 달력의 차이는 자동 해소되지 않는 수동 검토 위험이다. KR/US 마지막 거래일, 실제 마지막 가격일, 요청 기준일을 대조하고 증적에 남긴다.
5. source manifest의 `partialFinalMonthDetected`, `partialFinalMonthExcluded`, `partialMonthPolicy`, `metricDataThroughMonth`, index의 `lastMonth`가 서로 일치하지 않으면 중단한다.

## B. 출처와 provenance

- 공급자, 원본 source identity, 수집시각, 기준일, 운영자와 이용약관·라이선스 확인 상태를 기록한다.
- 원본마다 byte size와 SHA-256을 계산해 증적에 기록하고 immutable, versioned 위치에 보존한다. 이전 원본이나 artifact를 덮어쓰지 않는다.
- source declaration, operator submission manifest, candidate package hash, source app-export SHA, release/source manifest SHA와 binding을 끊김 없이 연결한다.
- 라이선스 또는 production approval이 `review_required`, 누락, 불명확이면 fail-closed다. source declaration만으로 Production 승인을 추정하지 않는다.
- 비밀키, provider credential, token, 전체 환경변수 값, 사용자·결제·DB 데이터는 파일·증적·로그에 기록하지 않는다.

## C. 자산 identity와 lifecycle

- identity는 정규화된 `market + ticker` (`US:QQQ`, `KR:069500`)다. market/ticker는 trim 후 대문자로 정규화하며 market은 `US` 또는 `KR`이어야 한다. KR ticker는 현행 검증식 `[0-9A-Z]{6}`을 만족해야 한다.
- 같은 identity가 중복되거나 순서가 역전되면 입력·export 검증에서 차단한다. 서로 다른 market의 같은 ticker는 별도 identity다.
- canonical catalog에는 있으나 monthly index에 없는 자산은 catalog에서 삭제하지 않는다. Step 4에서는 non-zero 자산의 monthly 데이터 부족으로 fail-closed한다.
- monthly 데이터에는 있으나 canonical catalog에서 확인되지 않는 identity는 자동 편입하거나 합치지 않는다. 입력 준비 단계의 catalog 대조 실패로 차단하고 수동 조사한다.
- ticker 변경, 합병, 분할, 상장폐지, 신규 상장은 자동 alias/연결을 만들지 않는다. 이전/새 identity, corporate action 유효일, 조정가격 basis와 canonical 변경 승인을 수동 확인한다. identity 삭제·치환·이력 연결은 별도 승인 대상이다.
- FINPLE manual CASH는 canonical CSV나 monthly shard에 넣지 않는다. `src/data/tickers/manualCashAsset.js`의 승인 source identity만 Step 4에서 연 2.0% 내부 월복리 sleeve로 계산한다. unknown-source CASH와 임의 synthetic/manual identity는 차단한다.

## D. 월간 수익률 검증

다음 중 하나라도 실패하면 candidate를 배포하지 않는다.

1. 일별 입력은 날짜 파싱, 오름차순, identity별 중복일, 양수 가격, 조정가격 basis, 통화, split/dividend 값과 provenance를 검증한다.
2. 월간 행은 identity·월 오름차순과 유일성을 보장한다. 누락 월은 forward-fill하지 않고 경고·수동 검토 대상으로 남기며, gap을 가로지르는 rolling window는 제외한다.
3. `NaN`, `Infinity`, `undefined`, non-finite/비수치 return, 필수 `priceReturn` 누락, 미래 월, `metricDataThroughMonth` 이후 월, 진행 중인 현재 월은 차단한다.
4. 각 자산의 first/last month와 연속 구간을 확인한다. Step 4 확률분석은 포트폴리오 공통 연속 이력이 최소 60개월이어야 하며 더 낮은 요청으로 완화할 수 없다.
5. asset count, monthly asset count, row count, shard count는 release/source/index에서 파생해 상호 일치시킨다. index asset entry의 rowCount 합과 shard rowCount 합은 전체 row count와 같아야 한다.
6. 모든 index asset은 존재하는 shard 하나를 참조하고, 모든 shard는 inventory/index/source/release에 같은 path·assetCount·rowCount·sizeBytes·SHA-256으로 존재해야 한다. 미참조 shard와 존재하지 않는 shard 참조는 모두 실패다.
7. release/source binding, candidate package identity, universe version, `metricDataThroughMonth`, row encoding과 approval flags를 대조한다.
8. release, source manifest, overlay, index와 모든 shard는 HTTP 200, JSON content type, JSON parse, exact byte size와 SHA를 통과해야 한다. redirect 의존과 SPA HTML fallback은 허용하지 않는다.

현재 build gate는 `scripts/verify-pinned-production-monthly-artifact-build.mjs`가 source/dist의 pinned inventory를 검사한다. `scripts/check-p3-step4-monthly-artifact.test.mjs`는 runtime 분리·0%·CASH·baseline gate를, `scripts/check-p3a-production-monthly-artifact-publication.test.mjs`는 정적 publish/404 계약을 검사한다.

## E. 직전 Production artifact 비교

candidate와 직전 Production의 manifest-derived 값을 표로 비교한다.

- 기준월, asset/monthly asset/row/shard count
- 추가·삭제 identity와 coverage 변화
- monthly first/last month와 결측 목록
- release/source/candidate/binding SHA 변화
- shard path·size·SHA 변화
- 기준 자산 `US:QQQ`, `US:SCHD`, `US:TLT`, `US:GLD`의 존재, last month와 row count

기준월이 의도대로 한 달 전진하고 신규 상장으로 coverage가 증가하며 모든 gate가 통과한 변화는 승인 후보가 될 수 있다. 다음은 자동 허용하지 않고 수동 검토한다: 기준월 정체·후퇴·두 달 이상 점프, asset/row/coverage 급감, identity 삭제·rename, 예기치 않은 shard count 변경, 기준 자산 결측, 과거 월 값 변경, partial month 포함, binding 불일치. Artifact가 바뀌면 hash 변경 자체는 정상일 수 있지만 모든 새 hash가 동일 승인 chain을 가리켜야 한다.

## F. 후보 생성과 검증 절차

아래는 저장소에 실제로 존재하는 도구다. `<...>`는 운영자가 별도 승인으로 제공하는 외부 immutable 경로 또는 값이다. P6에서는 실행하지 않는다.

```powershell
python -m scripts.prepare_monthly_metrics_candidate_inputs --universe <canonical-v2.csv> --us-raw <us-raw.csv> --kr-raw <kr-raw.csv> --kr-metrics <kr-overlay.csv> --output-dir <empty-external-dir> --report <report.json> --metric-base-date <YYYY-MM-DD> --as-of-included <YYYY-MM-DD> --partial-month-policy exclude_from_metrics --submission-id <id>

python -m scripts.export_finple_app_preview --input-package <candidate-zip-or-dir> --output-dir <empty-external-dir>

python -m scripts.build_review_gated_app_export --source-export <source-export> --expected-source-sha256 <approved-sha> --candidate-zip-sha256 <approved-sha> --source-git-sha <approved-main-sha> --output-dir <empty-external-dir>

python -B -m scripts.recover_production_app_export_source --source-worktree <exact-source> --candidate-zip <candidate.zip> --run-a-dir <empty-dir> --run-b-dir <empty-dir> --receipt-output <receipt.json> --operator-id <operator> --expected-source-git-sha <sha> --expected-candidate-zip-sha256 <sha> --expected-candidate-package-hash <sha>
```

입력 준비와 app-export 사이의 One-Click candidate 생성은 notebook/operator 단계다. repo-local 단일 월간 rollover 명령은 없으므로 이를 건너뛰거나 새 명령을 추측하지 않는다. 원천 수집권한, license approval, corporate action 검토, candidate approval, 고정 release schema/count/hash 갱신과 peer review가 현재의 수동 위험 구간이다. 특히 production stager와 pinned verifier의 현재-version 상수는 장기 정책이 아니라 새 release 승인 시 별도 코드 변경·검증이 필요한 구현 제약이다.

## G. Protected Preview 검증

1. exact candidate/source/release SHA와 Preview deployment ID를 기록한다.
2. `scripts/stage_app_preview_vercel.py` 또는 승인된 production Build Output stager로 저장소 밖의 새 staging directory를 만든다. 기존 staging이나 artifact를 덮어쓰지 않는다.
3. Preview scope에만 필요한 runtime 설정을 적용한다. 현재 runtime 이름은 다음과 같다.
   - `VITE_FINPLE_MONTHLY_SCENARIO_ARTIFACT_ENABLED`
   - `VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED`
   - `VITE_FINPLE_PRODUCTION_APP_EXPORT_BASE_URL`
   - `VITE_FINPLE_PRODUCTION_APP_EXPORT_MANIFEST`
   - `VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256`
   - `VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256`
4. Protected Preview를 exact SHA로 배포하고 release/source manifest, overlay, index, 전체 shard inventory를 HTTP/JSON/size/SHA/byte identity로 sweep한다. 필요한 shard의 lazy load, 중복 요청 없음, 64개 전체 preload 없음도 확인한다.
5. 없는 `/app-data/<version>/not-found.json`이 HTTP 404 `Not Found`이며 HTML SPA 문서가 아님을 확인한다.
6. 실제 Personal 세션의 Step 4가 ready인지, console error/warning·CORS error·unexpected 4xx/5xx가 없는지 확인한다.
7. 사용자·결제·포트폴리오·DB mutation과 AI provider 요청을 하지 않는다. 예외 승인이 있는 로컬-only fixture는 서버 write 0을 확인하고 즉시 복구한다.
8. QA 후 exact Preview CORS origin과 Preview-only 환경변수를 즉시 제거하고 Production origin 허용, Preview·제3 origin 차단, wildcard 없음과 원복 deployment를 확인한다. 환경변수 값은 증적에 복사하지 않는다.

## H. Production 승인과 cutover

`docs/operations/FINPLE_VERCEL_PRODUCTION_DEPLOYMENT_CONTROL.md`의 제어 계약을 따른다.

- `main`은 통합 코드 기준이고 `production`은 승인된 배포 포인터다. main merge와 Production cutover는 별도 승인이다.
- Preview QA와 release evidence 승인 후에만 진행한다. backend 계약 변경이 있으면 Render compatibility/health/auth/payment를 backend-first로 검증한다.
- 승인된 main SHA만 non-force fast-forward한다: `git push origin <APPROVED_MAIN_SHA>:refs/heads/production`. force-push, 강제 후퇴, 독립 commit, cherry-pick을 금지한다.
- 환경변수, CORS, alias/domain 변경은 각각 별도 승인이다.
- Vercel/Render deployment ID와 exact SHA를 기록하고 `/app-data` inventory, missing 404, Personal Step 4, API/DB health를 postdeploy 재검증한다.

## I. Rollback

1. cutover 전에 직전 Vercel/Render deployment ID·SHA, production branch SHA, exact artifact 위치를 기록하고 삭제하지 않는다.
2. frontend 문제가 나면 승인된 exact deployment를 대상으로 `vercel promote <dpl_...>` 경로를 사용한다. Hobby Instant Rollback은 바로 이전 deployment만 지원할 수 있으므로 오래된 target을 전제로 하지 않는다.
3. production branch를 force-push로 후퇴시키지 않는다. 복구 포인터와 Git 이력을 별도 운영 승인으로 정합화한다.
4. backend가 함께 바뀌었다면 호환되는 직전 Render deployment로 복구하고 API/DB/auth/payment health를 확인한다.
5. rollback 후 release/source/index/shard JSON·size·SHA, missing 404, Step 4와 frontend/backend SHA를 다시 검증한다. 이전 artifact와 증적은 incident 종료 후에도 보존한다.

## J. 월별 증적과 종료 게이트

매월 `docs/operations/templates/FINPLE_MONTHLY_CSV_RELEASE_EVIDENCE_TEMPLATE.md`를 복사해 source identity/SHA, candidate/source/release/binding SHA, 기준월, asset/row/shard count, 검증 결과, Preview/Production deployment, 승인자·시각, rollback target, 관측 한계와 incident를 기록한다. 비밀값은 기록하지 않는다.

최종 fail-closed gate:

- [ ] 완료된 기준월과 KR/US 마지막 거래일 검토
- [ ] provenance/license/immutable source size·SHA 확인
- [ ] identity/corporate action/canonical diff 수동 검토
- [ ] candidate 및 release/source/binding 승인
- [ ] index/shard count·reference·JSON·size·SHA 검증
- [ ] 직전 Production 비교와 기준 자산 유지
- [ ] Protected Preview 정적 sweep·Personal Step 4·404·console/CORS 검증
- [ ] Preview 임시 설정/CORS 원복
- [ ] 별도 Production 승인, backend-first compatibility, non-force fast-forward
- [ ] Postdeploy와 rollback target 보존

저장소 정적 계약은 다음 명령으로 확인한다.

```powershell
npm.cmd run check:p6-monthly-csv-operations
npm.cmd run check:p3-step4-monthly-artifact
npm.cmd run check:p3a-production-monthly-artifact-publication
npm.cmd run check:production-deployment-control
```
