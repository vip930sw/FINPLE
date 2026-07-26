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

Production source artifact 선택 정책은 다음과 같다.

1. 보존된 6,029 app-export가 있으면 그 ZIP SHA-256과 전체 inventory를 검증해
   source artifact로 사용한다.
2. 보존 artifact가 없으면 아래의 결정론적 복구 절차만 허용한다. exact source
   Git SHA의 detached worktree, 고정 Candidate ZIP, 명시된 exporter 인자와 서로
   독립된 빈 출력 경로를 사용해야 한다.
3. Run A와 Run B의 ZIP SHA-256, source manifest, metrics overlay, monthly index,
   complete shard inventory와 complete file inventory가 모두 같아야 한다.
   하나라도 다르면 fail-closed로 중단한다.
4. 일치 결과는 새로운 Production source artifact다. 과거 protected Preview와
   byte-identical하다고 주장하지 않는다.
5. 새로운 source artifact는 Production release 승인 전에 Production-mode
   Preview QA 전체를 다시 통과해야 한다.

현재 작업공간에는 이전 6,029 app-preview export가 보존돼 있지 않으므로 2번
경로가 적용된다. 이 PR은 절차와 검증 계약만 제공하며 exporter, staging,
Preview 배포, Production deploy 또는 promote를 실행하지 않는다.

## 보존 artifact 부재 시 결정론적 source 복구

고정값은 다음과 같고 다른 값으로 대체할 수 없다.

```powershell
$SourceGitSha = "18c6bcc552ce20a6a1c27a0543040fdaec8c7bef"
$CandidateZipSha256 = "9042b1d662ef5881f23ecc6bcf47be60f3a949b65e70656219e7923e5ef8789e"
$CandidatePackageHash = "6f77088863eae5a8e1c6a2a613694cc252ad3a035627031346399a4812a3b276"
$ExporterVersion = "finple-app-preview-export-v1-step114-2z"
```

작업 경로는 모두 저장소 밖에 두고 Run A/Run B 출력 경로는 실행 전에 존재하지
않거나 비어 있어야 한다. 로컬 실제 경로는 receipt, Git, Issue, PR 또는 공개
로그에 기록하지 않는다.

```powershell
$Repo = (Resolve-Path "<FINPLE repository root>").Path
$Python = "<approved Python 3 executable>"
$CandidateZip = (Resolve-Path "<verified Candidate ZIP>").Path
$SourceWorktree = "<new external detached source worktree>"
$RunARoot = "<new external empty Run A directory>"
$RunBRoot = "<new external empty Run B directory>"
$ReceiptPath = "<external untracked receipt JSON path>"
$OperatorId = "<approved operator ID>"

git -C $Repo worktree add --detach $SourceWorktree $SourceGitSha

Push-Location -LiteralPath $Repo
try {
  $RecoveryResult = & $Python -B -m scripts.recover_production_app_export_source `
    --source-worktree $SourceWorktree `
    --candidate-zip $CandidateZip `
    --run-a-dir $RunARoot `
    --run-b-dir $RunBRoot `
    --receipt-output $ReceiptPath `
    --operator-id $OperatorId `
    --expected-source-git-sha $SourceGitSha `
    --expected-candidate-zip-sha256 $CandidateZipSha256 `
    --expected-candidate-package-hash $CandidatePackageHash |
    ConvertFrom-Json
  if ($LASTEXITCODE -ne 0) {
    throw "Production source recovery blocked: $($RecoveryResult.reasonCode)"
  }
}
finally {
  Pop-Location
}
```

이 단일 operator script가 Candidate 검증, detached/clean worktree 검증,
Run A/B 단발 실행, output boundary 검증, deterministic comparison, receipt schema
검증과 atomic receipt write를 모두 수행한다. retry, 기존 output overwrite,
release manifest 생성, provider/Colab/Drive/Candidate 계산 호출은 없다.
operator와 exporter subprocess는 모두 `-B`를 사용하고 exporter sanitized
environment는 ambient 값과 관계없이 `PYTHONDONTWRITEBYTECODE=1`을 강제한다.
source worktree가 dirty해지면 파일을 삭제하거나 무시하지 않고 Run B 전에
fail-closed한다.
실패 stdout은 `status`, safe `reasonCode`, `receiptCreated=false`만 포함하며 raw
bytes, digest 또는 absolute path를 출력하지 않는다.

다음 검증은 순서대로 모두 성공해야 한다.

1. `$RunA.zipSha256`와 `$RunB.zipSha256`가 같고 각 ZIP을 다시
   `Get-FileHash`한 값과도 같다.
2. 두 bundle의 `app-preview-manifest.json`, manifest가 가리키는
   `metricsOverlay.path`, `monthlyReturnsIndex.path` SHA-256이 각각 같다.
3. 두 manifest의 `shardInventory` JSON이 field-by-field 동일하다.
4. 각 bundle의 모든 regular file을 상대 경로 오름차순으로 정렬하고
   `path`, `sizeBytes`, `sha256`을 기록한 complete file inventory가 동일하다.
5. 위 inventory의 whitespace 없는 UTF-8 canonical JSON SHA-256이 동일하다.
6. source review manifest의 false gate, 6,029/3,029/3,000,
   6,013/16, 5,347/701,485, `2026-06` 계약을 다시 확인한다.

ZIP, source manifest, overlay, index, shard inventory 또는 complete file
inventory 중 하나라도 다르면 receipt를 만들지 않고 두 run을 격리한 채
fail-closed로 종료한다.

동일성 검증이 끝난 뒤에만
`docs/portfolio-ml/contracts/finple-production-source-artifact-receipt.schema.json`
계약으로 외부 receipt를 작성한다. `sourceManifestSha256`,
`metricsOverlaySha256`, `monthlyIndexSha256`와 `completeShardInventory`는
동일성이 확인된 Run A 값을 기록한다. `completeFileInventoryHash`는 위
canonical complete file inventory의 SHA-256이다.

receipt의 exact fields는 다음과 같다.

- `schemaVersion`
- `sourceGitMainSha`
- `candidateZipSha256`
- `candidatePackageHash`
- `exporterCommand`
- `exporterVersion`
- `runAZipSha256`
- `runBZipSha256`
- `sourceManifestSha256`
- `metricsOverlaySha256`
- `monthlyIndexSha256`
- `completeShardInventory`
- `completeFileInventoryHash`
- `generatedAt`
- `operatorId`
- `deterministicMatch`

`exporterCommand`에는 실제 로컬 경로를 제외한 다음 정규화 명령을 기록한다.

```text
python -B -m scripts.export_finple_app_preview --input-package <candidate-zip> --output-dir <empty-output> --shard-count 64 --max-rows-per-shard 12000 --target-shard-bytes 1048576
```

receipt는 `generatedAt` UTC timestamp와 승인된 `operatorId`를 포함하고
`deterministicMatch=true`여야 한다. receipt와 raw artifact는 Git에 추가하거나
Issue/PR에 첨부하거나 공개하지 않는다.

결정론적으로 생성된 source artifact는 새 artifact이므로 기존 protected Preview
검증을 상속하지 않는다. 별도 non-Production QA 환경에서 Production-mode loader,
Step 3/4, saved reload, 분배 정책, fallback, PDF/print/share, 1440px, 375px와
일반 AI 회귀를 모두 다시 검증한 뒤에만 Production release manifest 승인을
요청할 수 있다.

## Production release manifest

계약은
`docs/portfolio-ml/contracts/finple-production-app-export-release-manifest.schema.json`
에 있다. 승인자는 다음을 수행해야 한다.

1. 보존 artifact 경로이면 기존 ZIP SHA-256/inventory를 검증한다. 결정론적 복구
   경로이면 Run A/B receipt의 `deterministicMatch=true`와 전체 binding을 검증한다.
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
$ProductionApiBaseUrl = "<approved HTTPS Production API base ending in /api>"

& $Python -B -m scripts.stage_production_app_export_vercel `
  --input-export-zip $AppExportZip `
  --release-manifest $ReleaseManifest `
  --staging-dir $Stage `
  --target-segment "finple-universe-v2-2026-07-24" `
  --expected-app-export-sha256 $AppExportSha256 `
  --expected-release-manifest-sha256 $ReleaseSha256 `
  --api-base-url $ProductionApiBaseUrl `
  --project-dir $Repo
```

`--api-base-url` is mandatory and fail-closed before build. It must be an HTTPS
URL with the exact `/api` path and no credentials, query, fragment, localhost,
or loopback address. The stager normalizes a trailing slash and force-overrides
any ambient `VITE_FINPLE_API_BASE_URL` value.

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
VITE_FINPLE_API_BASE_URL=<approved HTTPS Production API base ending in /api>
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
