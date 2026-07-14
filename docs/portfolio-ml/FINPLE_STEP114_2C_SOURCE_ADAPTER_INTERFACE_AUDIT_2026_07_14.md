# FINPLE Step 114-2C Source Adapter Interface Audit

Date: 2026-07-14
Scope: fixture/offline-only source adapter interface for the Step 114-2 monthly metrics pipeline

## Starting Point

- Start SHA: `d4c9371e5de347139cb006e98db5d05c8c260b5f`
- Branch: `codex/step114-2c-source-adapter-interface`
- Issue: GitHub Issue #231
- Base assumptions: PR #230 was squash-merged to `main`; local `main`, `origin/main`, and GitHub `main` matched the start SHA before work began.

## Adapter Contract

The Step 114-2C adapter layer emits one deterministic `SourceAdapterResult` before raw daily normalization:

```text
adapterId
adapterVersion
sourceId
sourceFileName
providerOrInstitution
retrievedAt
marketScope
inputFormat
rowCount
rawSourceSha256
licenseStatus
internalUseAllowed
publicationAllowed
redistributionAllowed
priceAdjustmentBasis
checkpointId
resumeSupported
warnings
rows
```

The contract is implemented in `scripts/metrics_pipeline/adapters.py` and consumed by `scripts/metrics_pipeline/pipeline.py`.

## Offline Modes

Supported CONFIG `input_mode` values:

- `fixture`: reads committed `raw_daily_prices.csv`.
- `manual_upload`: reads an operator-supplied CSV using the raw daily schema.
- `public_source_fixture`: reads a synthetic paged public-source fixture CSV and exercises checkpoint, retry, and resume logic without external calls.

Unsupported modes are rejected by CONFIG validation.

## Fixture Coverage

New Step 114-2C fixtures:

- `manual_upload_raw_daily_prices.csv`: valid manual-upload contract fixture with secret/path sanitization probes.
- `manual_upload_bad_header.csv`: duplicate/missing header blocker.
- `manual_upload_empty.csv`: empty upload blocker.
- `manual_upload_unknown_license.csv`: unknown license blocker.
- `manual_upload_internal_use_blocked.csv`: internal-use blocker.
- `public_source_fixture_prices.csv`: deterministic two-page synthetic public-source fixture.
- `public_source_fixture_unknown_license.csv`: public-source fixture license blocker.

All fixtures are synthetic and committed for offline tests only.

## Checkpoint, Retry, Resume

The public-source fixture adapter records:

- deterministic `checkpointId`
- completed page numbers
- accepted record IDs
- retry count
- max retry count
- next cursor placeholder
- raw source SHA256

The retry behavior is bounded by CONFIG and supports:

- `none`
- `transient_then_success`
- `permanent_failure`

Resume skips previously accepted record IDs and avoids duplicate normalized rows.

## License And Publication Gates

The adapter fails closed before normalization when:

- `internalUseAllowed` is false or unknown
- `licenseStatus` is blank, unknown, unconfirmed, or review-required
- the adapter produces no accepted rows
- the adapter schema is malformed

`fixturePackageReady` may remain true for offline fixture outputs, but `productionPublishReady=false` and `appExportApproved=false` remain unchanged.

## Sanitization

The adapter sanitizes local absolute paths and secret-like metadata before rows reach normalization or artifacts. The manifest, source adapter summary, checkpoint, audit CSV, normalized CSV, and ZIP are tested to exclude raw local absolute paths and secret markers from the manual-upload fixture.

SHA256 fields are intentionally preserved because deterministic hash audit is part of this step.

## Outputs Added To ZIP

Step 114-2C adds these deterministic artifacts to the output package:

```text
finple_source_adapter_summary_YYYY_MM.json
finple_source_adapter_checkpoint_YYYY_MM.json
```

## Guardrails

- No real data.go.kr, KRX, KIS, or other provider API call.
- No external provider credential or service key use.
- No operating US/KR overlay or loader update.
- No `data/processed/scenario_monthly_returns.csv` generation or modification.
- No simulator calculation, UI, STEP navigation, AI, auth, payment, subscription, DB, trading readiness, order, or kill switch change.
- No activation of `productionPublishReady` or `appExportApproved`.
