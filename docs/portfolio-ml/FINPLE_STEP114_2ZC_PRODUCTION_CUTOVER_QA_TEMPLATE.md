# FINPLE Step 114-2ZC Production cutover QA template

이 문서는 실행 완료 기록이 아니라 다음 별도 승인 단계에서 작성할 template다.

## Exact bindings

- [ ] source artifact policy: preserved artifact / deterministic Run A+B
- [ ] source Git main SHA:
- [ ] Candidate ZIP SHA-256:
- [ ] candidatePackageHash:
- [ ] exporter command:
- [ ] exporter version:
- [ ] `scripts.recover_production_app_export_source` preflight passed
- [ ] Run A/B used the same sanitized environment and no retry
- [ ] Run A ZIP SHA-256:
- [ ] Run B ZIP SHA-256:
- [ ] deterministicMatch=true
- [ ] source app-export ZIP SHA-256:
- [ ] Production release manifest SHA-256:
- [ ] source review manifest SHA-256:
- [ ] metrics overlay SHA-256:
- [ ] monthly index SHA-256:
- [ ] complete shard inventory equality passed
- [ ] complete file inventory hash:
- [ ] inventory file count / bytes:
- [ ] all inventory SHA-256 checks passed
- [ ] 6,029 / US 3,029 / KR 3,000 reconciled
- [ ] price-covered 6,013 / missing 16 reconciled
- [ ] monthly-return assets 5,347 / rows 701,485 reconciled
- [ ] metric data through `2026-06`
- [ ] receipt is external/untracked and contains no local raw path
- [ ] failure stdout contains only safe status/reason fields
- [ ] receipt and raw artifact were not attached to Git, Issue, PR, or public storage
- [ ] no claim of byte identity with the historical protected Preview

## Runtime QA

- [ ] new source artifact received a complete Production-mode Preview QA run
- [ ] QQQ selected CAGR equals rolling 10-year median
- [ ] SPY / VOO / 069500 ready
- [ ] GLD confirmed zero remains distinct from missing
- [ ] AIPI / MSFY / TSLP / QYLG remain non-ordinary fail-closed
- [ ] saved portfolio reload preserves Production and distribution fields
- [ ] Step 3 ready and block reasons are visible
- [ ] Step 4 loads only selected shards
- [ ] missing monthly identity is unavailable without zero fill or proxy
- [ ] P10 / P25 / P50 / P75 / P90 ordering passed
- [ ] contribution path and risk NAV remain separate
- [ ] Step 5 remains unchanged
- [ ] Step 6 scenario context remains excluded from provider payload
- [ ] ordinary AI analysis regression passed
- [ ] PDF / print / share passed
- [ ] desktop 1440px passed
- [ ] mobile 375px passed

## Rollback record

- previous Production deployment ID:
- rollback deployment ID:
- previous `VITE_FINPLE_PRODUCTION_APP_EXPORT_ENABLED`:
- previous `VITE_FINPLE_PRODUCTION_APP_EXPORT_BASE_URL`:
- previous `VITE_FINPLE_PRODUCTION_APP_EXPORT_MANIFEST`:
- previous `VITE_FINPLE_PRODUCTION_APP_EXPORT_RELEASE_SHA256`:
- previous `VITE_FINPLE_PRODUCTION_APP_EXPORT_SOURCE_SHA256`:
- [ ] fallback v1 selector verified
- [ ] Step 4 disabled during fallback
- [ ] no mixed partial activation observed
- [ ] rollback rehearsal passed

## Authority

- Production deploy/promote approved by:
- approved at:
- operator:
- QA reviewer:
- notes:
