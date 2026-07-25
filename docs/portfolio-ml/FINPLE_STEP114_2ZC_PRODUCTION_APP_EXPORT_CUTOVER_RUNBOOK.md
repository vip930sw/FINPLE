# FINPLE Step 114-2ZC Production app-export cutover runbook

## 상태와 범위

이 문서는 검증된 6,029개 app-export를 Production Build Output으로 준비하는
절차다. 이 PR은 deploy, promote, Vercel 환경변수 변경, Production alias 변경을
실행하지 않는다.

Step 114-2ZC 시작 기준은 Git `main`
`18c6bcc552ce20a6a1c27a0543040fdaec8c7bef`이다. 기존 review manifest의
`internalPreviewReviewOnly=true`, `productionPublishReady=false`,
`appExportApproved=false`는 변경하지 않는다. Production 승인은 별도
`production-app-export-release.json`에만 기록한다.

고정 입력은 다음과 같다.

- universe: `finple-universe-v2-2026-07-24`
- Candidate ZIP SHA-256:
  `9042b1d662ef5881f23ecc6bcf47be60f3a949b65e70656219e7923e5ef8789e`
- candidate package hash:
  `6f77088863eae5a8e1c6a2a613694cc252ad3a035627031346399a4812a3b276`
- assets: 6,029 (`US=3,029`, `KR=3,000`)
- price-covered: 6,013; missing-price: 16
- monthly-return assets: 5,347; rows: 701,485
- metric data through: `2026-06`

현재 작업공간에는 이전 6,029 app-preview export가 보존돼 있지 않다. Candidate
ZIP SHA는 read-only로 확인했지만, 이전 export의 ZIP SHA 또는 inventory와 byte
비교할 수 없으므로 exporter를 재실행하지 않는다. 아래 절차는 보존 export와
승인 release manifest가 별도로 공급된 뒤에만 실행할 수 있다.

## Production release manifest

계약은
`docs/portfolio-ml/contracts/finple-production-app-export-release-manifest.schema.json`
에 있다. 승인자는 다음을 수행해야 한다.

1. 보존 app-export ZIP SHA-256과 기존 Preview inventory를 대조한다.
2. source review manifest, metrics overlay, monthly index, 전체 shard record를
   release manifest에 그대로 binding한다.
3. `sourceAppExportSha256`, `approvedAt`, `approvedBy`를 기록한다.
4. `productionPublishReady=true`, `appExportApproved=true`를 release manifest에만
   기록한다.
5. release manifest 자체 SHA-256을 별도 변경 승인값으로 전달한다.

Review manifest 또는 release manifest를 서로 대신 사용할 수 없다.

## 외부 Production Build Output 준비

저장소 밖의 비어 있거나 교체 가능한 staging 경로만 사용한다.

```powershell
$Repo = (Resolve-Path "<FINPLE repository>").Path
$Python = "<approved Python executable>"
$AppExportZip = (Resolve-Path "<preserved verified app-export ZIP>").Path
$ReleaseManifest = (Resolve-Path "<approved production-app-export-release.json>").Path
$Stage = "<external staging directory>"
$AppExportSha256 = "<exact source app-export ZIP SHA-256>"
$ReleaseSha256 = "<exact production release manifest SHA-256>"

& $Python -m scripts.stage_production_app_export_vercel `
  --input-export-zip $AppExportZip `
  --release-manifest $ReleaseManifest `
  --staging-dir $Stage `
  --target-segment "finple-universe-v2-2026-07-24" `
  --expected-app-export-sha256 $AppExportSha256 `
  --expected-release-manifest-sha256 $ReleaseSha256 `
  --project-dir $Repo
```

생성 Build Output은
`/app-data/finple-universe-v2-2026-07-24/`를 사용한다.
`/preview-api` rewrite, Preview 인증·보호 설정, deploy 또는 promote는 생성하거나
실행하지 않는다. 기존 Production API 환경 설정은 상속하고 수정하지 않는다.

외부 staging root에는 다음 파일이 생성된다.

- `.vercel/output/`
- `production-build-output-inventory.json`
- `production-cutover-qa-template.json`
- `staging-summary.json`

## Runtime 환경 계약

실제 별도 변경 승인 단계에서만 다음 값을 Production 환경에 공급한다.

```text
VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED=true
VITE_FINPLE_PRODUCTION_APP_EXPORT_BASE_URL=/app-data/finple-universe-v2-2026-07-24
VITE_FINPLE_PRODUCTION_APP_EXPORT_MANIFEST=production-app-export-release.json
VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256=<exact release manifest SHA-256>
VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256=<exact app-export ZIP SHA-256>
```

하나라도 없거나 불일치하면 catalog를 부분 적용하지 않고 기존 v1 Production
loader로 돌아간다. source review manifest, overlay, monthly index 검증을 모두
마친 뒤에만 6,029 catalog를 활성화한다. shard는 선택 portfolio 기준으로
lazy-load하며, shard 무결성 오류는 v1 fallback과 Step 4 비활성화를 동시에
발생시킨다. 단순히 monthly index에 없는 identity는 Step 3 catalog를 훼손하지
않고 Step 4만 unavailable로 표시한다.

## Step 경계

- Step 3: approved RM overlay와 ordinary/non-ordinary distribution 정책을 사용한다.
- Step 4: 고정 P10/P25/P50/P75/P90, 관측 month만 사용하고 zero fill,
  forward fill, proxy를 금지한다.
- Step 5: 이 cutover에서 활성화하거나 변경하지 않는다.
- Step 6: Production app-export 승인이 AI scenario provider 승인으로 전이되지
  않는다. `scenarioContextProviderEligible=false`,
  `providerPayloadExcluded=true`를 유지한다. 일반 AI 분석은 기존 입력만 사용한다.

## Cutover 전 필수 QA

`FINPLE_STEP114_2ZC_PRODUCTION_CUTOVER_QA_TEMPLATE.md`와 외부 staging의 JSON
template를 채운다. rollback deployment ID와 이전 Production 환경 설정이
기록되지 않으면 deploy/promote 단계로 진행할 수 없다.
