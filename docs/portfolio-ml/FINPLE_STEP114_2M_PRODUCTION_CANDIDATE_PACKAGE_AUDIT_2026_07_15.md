# FINPLE Step 114-2M Production Candidate Package Audit

Date: 2026-07-15

## Scope

Step 114-2M implements an offline-only production data candidate package contract for monthly metrics review. It does not publish candidate data to the app, does not activate a production loader, and does not call KRX, KIS, data.go.kr, or any external provider.

## Package Boundaries

### Fixture package

The existing Step 114-2A through 2D fixture pipeline remains the default notebook mode. It is synthetic or fixture-only, produces review-only outputs, and keeps:

- `fixturePackageReady=true`
- `productionPublishReady=false`
- `appExportApproved=false`

Fixture ZIP/CSV outputs are generated locally and are not committed.

### Candidate package

The new Step 114-2M candidate package is a separate offline manual-upload workflow. It accepts operator-supplied CSV/JSON files, validates them fail-closed, and produces a deterministic candidate review ZIP.

Candidate readiness state is:

- `fixturePackageReady=false`
- `candidatePackageReady=true|false`
- `productionPublishReady=false`
- `appExportApproved=false`

`candidatePackageReady=true` means the offline candidate package is internally reviewable. It is not production approval and is not app export approval.

### Production approval package

Not implemented in this step. A future step must add signed approval receipt verification and server-side allowlist or equivalent owner/legal approval evidence before any production publish action can be considered.

### App export approval

Not implemented in this step. `appExportApproved` is always false even when the candidate package is ready.

### Production loader

Not modified or activated. Candidate outputs are not connected to production metrics loaders, scenario loaders, AI provider gates, plan/cache gates, DB, or trading surfaces.

## Input Contract

Candidate mode requires `input_mode=manual_upload_candidate` and all required files:

- `candidate_asset_master.csv`
- `benchmark_map.csv`
- `raw_daily_prices.csv`
- `source_declaration.json`
- `operator_submission_manifest.json`

The source declaration contract is `source-declaration-v1-step114-2m` and requires manual operator upload evidence, source identity, as-of date, market scope, timezone, currency mode, return basis, price-adjustment basis, review statuses, source file hash, row count, operator id, `fixtureOnly=false`, and `testOnly=false`.

The operator submission manifest contract is `operator-submission-manifest-v1-step114-2m`. Its file inventory validates exact SHA-256 and byte size for uploaded data files and the source declaration. The operator manifest itself is hashed in the generated candidate manifest as `submissionManifestHash`; it is not self-hashed inside its own file inventory.

The candidate benchmark map uses the candidate-only columns `benchmarkKey`, `benchmarkMarket`, and `benchmarkTicker`. Candidate series identity is always canonical `(market, ticker)`, including benchmark lookup, normalized series hash, coverage, and row reconciliation. Ticker-only identity is not used in candidate package calculations.

## Validation

The package fails closed on:

- fixture/review-only/synthetic/test-only markers
- non-`manual_operator_upload` source kind
- missing or mismatched SHA-256
- file byte-size mismatch
- source row-count mismatch
- unknown or duplicate logical roles
- path traversal or unsafe archive paths
- extra physical files in the input directory
- unsafe configured input filenames or unsafe `output_version`
- overlapping input and output directories
- malformed CSV/JSON
- duplicate `market+ticker+date`
- non-positive prices
- invalid dates, future `asOfDate`, or stale `asOfDate`
- missing legal/source/app-use review status
- invalid market/ticker identity
- loss of KR leading-zero tickers
- unsupported return basis, currency mode, timezone, or price-adjustment basis
- pipeline, normalization, or calculation policy version mismatch
- committed fixture files being reclassified as candidate inputs
- market-scope mismatch across config, source declaration, submission manifest, candidate rows, and raw rows
- currency, timestamp, operator identity, return-basis, and row-level legal/use policy mismatch

Validation uses `date.today()` by default during operator execution. Tests may inject `validation_date` for deterministic past/equal/future checks. The chosen `validationDate` is recorded in the manifest, readiness JSON, and audit HTML.

Rows with `redistributionAllowed=false` may remain candidate-reviewable only when the source and row-level publication/internal-use gates are otherwise approved. Such restrictions are recorded in manifest/audit as review-only limitations. They never make `productionPublishReady` or `appExportApproved` true.

## Output Contract

The deterministic candidate ZIP contains:

- candidate manifest JSON
- candidate readiness JSON
- normalized month-end CSV
- monthly returns CSV
- metrics output CSV
- review-required CSV
- source audit CSV
- normalization/time-series audit CSV
- human-readable audit HTML
- input/output exact hash inventory CSV
- final package index JSON

The candidate manifest records:

- `candidatePackageId`
- `candidatePackageHash`
- source declaration hash
- submission manifest hash
- all input hashes
- all output hashes
- input/output row reconciliation
- market/ticker/date coverage
- validation date
- candidate review restrictions
- blocking and warning issue counts
- metric base date
- pipeline, normalization, and calculation policy versions

## Package Hash And Determinism

The package uses a self-reference-safe two-level hash contract:

1. Payload artifacts are written first.
2. The payload hash inventory is written.
3. Manifest and readiness JSON are written.
4. A final package index enumerates every ZIP member except the index itself.
5. The index explicitly records JSON fields excluded from self-reference hashing (`candidatePackageHash` in manifest/readiness).
6. The deterministic ZIP is written.
7. `zipPackageSha256` is reported separately.

`candidatePackageHash` is the canonical hash of the final package index with its own `candidatePackageHash` field excluded. The package verifier requires the exact ZIP member set, rejects missing or extra members, and rejects mutation of any member bound by the package index. Identical inputs produce identical `candidatePackageHash` and ZIP SHA-256.

## Colab / CLI Workflow

The one-click notebook keeps fixture mode as the default. Candidate mode requires the operator to set:

```python
RUN_CANDIDATE_MODE = True
CANDIDATE_CONFIRMATION_TOKEN = "RUN_STEP114_2M_CANDIDATE_UPLOAD"
```

When candidate mode is true, the notebook prints the candidate contract, creates temporary upload and output directories outside the Git checkout, calls `google.colab.files.upload()`, and accepts exactly the five required files. Extra, missing, duplicate, unsafe, or path-like filenames block execution before the candidate pipeline is run.

After successful validation the notebook calls the pure Python candidate entrypoint:

```python
run_finple_production_candidate_package(CANDIDATE_CONFIG)
```

The generated candidate ZIP can be downloaded from Colab. A cleanup section is provided; after the operator confirms download by setting `CLEANUP_CANDIDATE_FILES=True`, the notebook deletes the raw upload and generated output directories and prints deletion verification. Raw uploads and generated candidate outputs are not automatically committed to Git.

## Rollback And Deletion

Candidate uploads and generated outputs should be kept in local or Colab temporary/operator directories only. To roll back a candidate run, delete the operator upload directory and generated output directory. Do not commit raw candidate CSV/JSON or generated candidate ZIP/CSV artifacts.

## Known Limits And Handoff

This step does not verify signed legal approval receipts and does not activate production use. The next approval step must add server-verifiable signed approval receipt checks, an owner/legal allowlist, and explicit production loader gating before candidate data can be published or exported to the app.

This package is review infrastructure only. It is not investment advice, not a forecast guarantee, and not a production data publication.
