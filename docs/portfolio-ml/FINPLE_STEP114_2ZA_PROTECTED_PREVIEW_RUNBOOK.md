# FINPLE Step 114-2ZA protected Preview operator runbook

이 문서는 검증된 Step 114-2Z review-only export를 FINPLE Vercel **Preview 배포에만** 같은 origin 정적 파일로 넣는 운영 절차다. 소스 ZIP, 해제 데이터, staging 산출물은 저장소 밖에 두며 Git에 추가하지 않는다.

## 불변 조건

- 입력은 operator가 지정한 app-preview ZIP 또는 동일한 해제 디렉터리다.
- ZIP 입력에는 operator가 별도로 확인한 SHA-256을 반드시 전달한다.
- staging 경로는 FINPLE 저장소 밖의 전용 디렉터리여야 한다.
- 빌드 시에만 아래 값이 주입된다.
  - `VITE_FINPLE_APP_PREVIEW_ENABLED=true`
  - `VITE_FINPLE_APP_PREVIEW_BASE_URL=/app-preview-data/<version>`
  - `VITE_FINPLE_API_BASE_URL=/preview-api`
- Preview browser API 요청은 `/preview-api/<path>`를 사용하고, Build Output API external rewrite가 검증된 HTTPS upstream의 `/api/<path>`로 전달한다.
- browser-facing bundle에 Render API의 direct URL이나 local API fallback을 남기지 않는다.
- production build와 설정 없는 local build는 기존 selector와 기존 production CSV를 사용한다.
- Vercel 명령에는 `--prod`를 사용하지 않는다. production alias, promote, production 환경변수는 변경하지 않는다.
- Vercel Deployment Protection/SSO는 그대로 유지한다.
- token, cookie, `.vercel/project.json` 내용을 로그·PR·QA 문서에 붙이지 않는다.

## 1. operator staging

PowerShell에서 현재 작업 branch의 FINPLE 저장소 root를 사용한다. 아래 변수는 operator 로컬 경로이며 소스나 설정에 기록하지 않는다.

```powershell
$Repo = (Resolve-Path "<FINPLE repository root>").Path
$InputExport = (Resolve-Path "<verified app-preview ZIP or extracted directory>").Path
$Stage = "<external empty-or-replaceable staging directory>"
$ExpectedZipSha256 = "<operator-verified lowercase SHA-256>"
$ApiUpstream = "https://finple-api.onrender.com/api"
$Python = "<Python 3 executable>"

& $Python "$Repo\scripts\stage_app_preview_vercel.py" `
  --input-export $InputExport `
  --staging-dir $Stage `
  --target-segment 2026-07-22 `
  --expected-zip-sha256 $ExpectedZipSha256 `
  --api-upstream-base-url $ApiUpstream `
  --project-dir $Repo

if ($LASTEXITCODE -ne 0) {
  throw "Preview staging failed. Existing staging remains usable."
}
```

해제 디렉터리를 입력할 때는 `--expected-zip-sha256`을 생략한다. 정상 완료 후 다음만 확인한다.

```powershell
Get-Content -LiteralPath (Join-Path $Stage "staging-summary.json")
Get-Item -LiteralPath (Join-Path $Stage ".vercel\output\config.json")
Get-Item -LiteralPath (Join-Path $Stage ".vercel\output\static\index.html")
Get-Item -LiteralPath (Join-Path $Stage ".vercel\output\static\app-preview-data\2026-07-22\app-preview-manifest.json")
```

stager는 다음 순서로 fail-closed 검증한다.

1. ZIP SHA-256, traversal/zip-slip, symlink/junction/root escape
2. review-only manifest gate와 전체 inventory size/SHA-256
3. 6,000 metric assets, 5,318 monthly-return assets, 700,375 returns, 64 shards
4. `KR:069500`, `KR:0086C0`, QQQ rolling-CAGR/MDD/Beta 정책
5. raw daily/normalized month-end 비포함
6. 저장소 git status 불변
7. HTTPS/credential-free API upstream과 `/preview-api` external rewrite route order
8. Preview JS bundle의 `/preview-api` 사용 및 direct Render/local fallback 부재
9. 외부 임시 디렉터리에서 build 완료 후 staging 원자적 교체

검증 또는 build가 실패하면 기존 `$Stage`는 교체되지 않는다.

## 2. Vercel project 연결

Vercel CLI는 operator가 로컬에서 실행한다. 아래 예시는 작업 시 검증한 CLI 버전을 고정한다.

```powershell
npx.cmd --yes vercel@56.4.1 login
Push-Location -LiteralPath $Stage
try {
  npx.cmd --yes vercel@56.4.1 link --yes --project finple
} finally {
  Pop-Location
}
```

- interactive login 결과나 인증 정보를 캡처해 공유하지 않는다.
- `link` 대상이 FINPLE의 기존 Vercel project인지 Vercel 화면에서 확인한다.
- 생성되는 `$Stage\.vercel`은 외부 staging 안에만 남긴다.

## 3. Preview-only 배포

```powershell
Push-Location -LiteralPath $Stage
try {
  $PreviewUrl = (& npx.cmd --yes vercel@56.4.1 deploy --prebuilt --archive=tgz --yes).Trim()
} finally {
  Pop-Location
}
Write-Host "Protected Preview URL:" $PreviewUrl
```

금지:

- `--prod`
- production domain alias
- promote
- production selector 또는 production CSV 변경
- Deployment Protection/SSO 해제

반환된 deployment URL을 QA template의 `Preview URL`에만 기록한다. deployment가 Preview 환경인지 Vercel 화면에서 다시 확인한 다음 QA를 시작한다.

## 4. protected deployment 접근 확인

브라우저에서는 기존 Vercel SSO를 통과한 동일 탭에서 Preview를 연다. CLI 확인이 필요하면 로그인된 operator 환경에서 protection-aware 요청을 사용한다.

```powershell
$PreviewUrl = "<exact Preview deployment URL>"
Push-Location -LiteralPath $Stage
try {
  npx.cmd --yes vercel@56.4.1 curl "/" --deployment $PreviewUrl
  npx.cmd --yes vercel@56.4.1 curl "/app-preview-data/2026-07-22/app-preview-manifest.json" --deployment $PreviewUrl
  npx.cmd --yes vercel@56.4.1 curl "/app-preview-data/2026-07-22/metrics-overlay.json" --deployment $PreviewUrl
  npx.cmd --yes vercel@56.4.1 curl "/app-preview-data/2026-07-22/monthly-returns-index.json" --deployment $PreviewUrl
  npx.cmd --yes vercel@56.4.1 curl "/preview-api/health/live" --deployment $PreviewUrl
  npx.cmd --yes vercel@56.4.1 curl "/preview-api/auth/login" --deployment $PreviewUrl -X OPTIONS
} finally {
  Pop-Location
}
```

`vercel curl`은 system curl 인수를 전달하므로 위 절차에서는 Stage를 current directory로 설정하고 `curl` 뒤에 `--cwd`를 사용하지 않는다. 응답 본문, cookie, 인증 header를 PR에 붙이지 않는다. QA에는 HTTP 상태, 크기, SHA-256 일치 여부만 기록한다.

## 5. 제품 QA

[`FINPLE_STEP114_2ZA_PROTECTED_PREVIEW_QA_TEMPLATE.md`](./FINPLE_STEP114_2ZA_PROTECTED_PREVIEW_QA_TEMPLATE.md)를 복사해 operator-local QA 기록으로 사용한다. 실제 확인 전에는 항목을 통과로 표시하지 않는다.

필수 브라우저 DevTools 확인:

- 최초 진입 시 manifest와 6,000-row metrics overlay만 요청
- monthly-return index/shard는 scenario/chart 진입 및 선택 asset에 따라 lazy load
- 동일 shard 동시 요청 중복 없음
- 요청 URL이 모두 Preview deployment의 같은 origin
- health/login 등 browser API 요청이 `/preview-api/*`이고 direct Render URL 요청이 없음
- 2026-07 monthly return 요청/표시 없음

## 6. 제거와 로컬 정리

QA 종료 후 Preview deployment가 더 이상 필요하지 않으면 exact URL을 operator가 확인한 뒤 제거한다.

```powershell
$PreviewUrl = "<exact Preview deployment URL>"
npx.cmd --yes vercel@56.4.1 remove $PreviewUrl --yes
```

외부 staging 정리는 exact 경로를 다시 확인한 뒤에만 수행한다.

```powershell
$StageResolved = (Resolve-Path -LiteralPath $Stage).Path
if ($StageResolved -eq (Resolve-Path -LiteralPath $Repo).Path) {
  throw "Refusing to remove repository root."
}
Write-Host "Removing exact external staging path:" $StageResolved
Remove-Item -LiteralPath $StageResolved -Recurse -Force
```

다음은 삭제하지 않는다.

- operator 원본 ZIP/해제 입력
- FINPLE repository
- production deployment
- production domain/alias

## rollback

Preview 데이터는 production selector에 연결되지 않는다. 문제가 있으면 Preview deployment를 제거하고 외부 staging만 정리한다. production cutover나 rollback commit은 필요하지 않다.
