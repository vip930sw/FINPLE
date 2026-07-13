# FINPLE Step234A Real-Format Dataset Inventory

## Purpose

Step234A audits repository-local, static, non-sensitive data that may inform a later Step192-compatible offline dry-run. This is an inventory and boundary document only.

This step does not transform data, create labels, create train/validation/test files, call providers, access a database, train a model, expose UI, or change readiness flags.

## Non-Goals

- No real provider, KIS, yfinance, API, token, DB, or order call.
- No model training, runtime serving, strategy generation, or live trading readiness.
- No modification to `scenario_monthly_returns.csv`.
- No Step192 runtime, Step225 manifest, Step228 snapshot, Step229 through Step233 schema, policy, registry, workflow, UI, CSS, or API route change.
- No raw provider packet, account, order, secret, token, credential, private path, hash value, digest value, or fingerprint value is copied into this inventory.

## Step192 Mapping Baseline

The current Step229 quality fixture shows the minimum runtime record fields needed before a candidate can enter the offline quality pipeline:

```text
recordId
split
label
featureTimestamp
labelTimestamp
versioning
lineage
retentionPolicy
threshold
stringThreshold
```

Step192 also requires point-in-time availability, chronological split policy, walk-forward boundaries, versioning metadata, lineage metadata, and retention metadata. Most repository-local real-format files are asset metadata, overlays, or source-policy reports, not complete Step192 training records.

## Status Definitions

| Status | Meaning |
|---|---|
| `eligible_for_sanitized_dry_run` | Small, static, non-sensitive sample can be used as Step234B adapter input after deterministic redaction and Step192 field materialization are designed. |
| `requires_adapter` | Useful structure exists, but the file is not a Step192 record set and needs a read-only adapter design before use. |
| `requires_manual_review` | Source, license, metric provenance, or review status must be checked before it can be used beyond inventory planning. |
| `prohibited` | Do not use as dry-run input because it is a policy gate, provider task, absent target, runtime/config/secret-adjacent surface, or would cross a forbidden boundary. |

## Candidate Inventory

| Candidate | Path | Data Character | Estimated Records | Step192 Mapping | Time Axis | Label Present | Split Possible | Sensitive Risk | Source/License State | Status | Recommended Handling |
|---|---|---:|---:|---|---|---|---|---|---|---|---|
| US screener sample | `src/data/tickers/us_screener_candidates.sample.csv` | Small static US ETF/stock-like screener sample with metric fields | 5 data rows | Can map ticker/market/metrics into features; missing Step192 recordId, split, label timestamps, versioning, lineage, retention | No event-level timestamp; only sample metadata | No | Yes, but only after adapter-defined deterministic chronological placeholder rules | Low; no account/order/provider payload fields observed | Repo sample; external source lineage not complete | `eligible_for_sanitized_dry_run` | Preferred Step234B seed together with KR sample for a tiny adapter proof. Add generated metadata only in a later step. |
| KR screener sample | `src/data/tickers/kr_screener_candidates.sample.csv` | Small static KR ETF/stock-like screener sample with metric fields | 5 data rows | Can map ticker/market/metrics into features; missing Step192 recordId, split, label timestamps, versioning, lineage, retention | No event-level timestamp; only sample metadata | No | Yes, but only after adapter-defined deterministic chronological placeholder rules | Low; no account/order/provider payload fields observed | Repo sample; external source lineage not complete | `eligible_for_sanitized_dry_run` | Preferred Step234B seed paired with US sample to test market-neutral adapter shape. |
| US screener candidate runtime CSV | `src/data/tickers/us_screener_candidates.csv` | Static US screener candidates with metrics and notes | 40 data rows | Feature mapping possible; labels, timestamps, split, walk-forward, versioning, lineage, retention absent | Metrics note references close basis date, not row-level feature/label times | No | Possible after adapter, but no native chronology | Low content sensitivity; source/provenance review still needed | Notes reference yfinance-derived metrics and validation-before-import | `requires_manual_review` | Do not use first. Review metric provenance and license before expanding beyond samples. |
| KR screener candidate runtime CSV | `src/data/tickers/kr_screener_candidates.csv` | Static KR screener candidates with metrics and notes | 87 data rows | Feature mapping possible; labels, timestamps, split, walk-forward, versioning, lineage, retention absent | Metrics note references close basis date, not row-level feature/label times | No | Possible after adapter, but no native chronology | Low content sensitivity; source/provenance review still needed | Notes reference close-basis metrics and pending dividend validation | `requires_manual_review` | Do not use first. Review source and metric provenance before use. |
| 6000 balanced candidate CSV | `src/data/tickers/finple_app_candidates_6000_balanced_v1.csv` and `data/processed/finple_app_candidates_6000_balanced_v1.csv` | Large app candidate master: US/KR, asset metadata, strategy/risk tags, pending metrics | 6000 data rows | Identifiers and categorical features map; labels/timestamps/splits/walk-forward absent | Source snapshot date exists in related summary, not row-level prediction/label time | No | Possible only after adapter and review; large size is not ideal for first dry-run | No account/order fields observed; mixed source and review-required rows | Summary records Nasdaq/KR snapshot/FINPLE source lineage; license review not complete for dataset training use | `requires_manual_review` | Keep out of first Step234B dry-run. Consider later small sampled subset after source/license review. |
| US price metrics overlay | `src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv` | Static derived US price metrics overlay: CAGR, MDD, beta, data years, benchmark | 2973 data rows | Numeric feature mapping possible; no labels/splits/timestamps/lineage/retention at record level | Has source tag date and dataYears, not full point-in-time series | No | Not natively; adapter would need artificial split boundaries | Low content sensitivity; derived metrics only | `metricsSource` references yfinance close price; license and redistribution review required before dataset use | `requires_manual_review` | Use only as feature-overlay reference after provenance review; do not infer labels here. |
| KR price metrics overlay | `src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv` | Static derived KR price metrics overlay: CAGR, MDD, beta, data years, benchmark | 2668 data rows | Numeric feature mapping possible; no labels/splits/timestamps/lineage/retention at record level | Has source tag date and dataYears, not full point-in-time series | No | Not natively; adapter would need artificial split boundaries | Low content sensitivity; derived metrics only | `metricsSource` references yfinance KR close price; license and redistribution review required before dataset use | `requires_manual_review` | Use only as feature-overlay reference after provenance review; do not infer labels here. |
| US dividend overlay | `src/data/tickers/us_dividend_overlay_20260527.csv` | Static dividend-yield overlay | 3000 data rows | Single feature family possible; no Step192 record envelope | Source tag date only | No | Not natively | Low content sensitivity; derived yield values only | `dividendSource` references yfinance trailing dividend | `requires_manual_review` | Treat as optional feature overlay after license review. |
| KR dividend overlays | `src/data/tickers/kr_stock_dividend_overlay_20260525.csv`, `src/data/tickers/kr_etf_dividend_overlay_20260525.csv` | Static KR stock/ETF dividend-yield overlays | 1246 and 922 data rows | Single feature family possible; no Step192 record envelope | Filename date only | No | Not natively | Low content sensitivity; derived yield values only | Source/license metadata is sparse in the CSV itself | `requires_manual_review` | Do not use until source and license evidence is linked. |
| Scenario data coverage | `data/processed/scenario_data_coverage.csv` | Coverage and readiness matrix for 6000 candidates | 6000 data rows | Useful for adapter gating and exclusion reasons; not a training record set | Contains dataStart/dataEnd columns, often blank, and coverage status | No | No native split; can help choose safe subsets | Low; no account/order data observed | Readiness report states monthly return data is missing and provider refetch is required | `requires_adapter` | Use as a Step234B adapter exclusion input only; do not treat as labels or returns. |
| Monthly return schema | `data/processed/scenario_monthly_returns.schema.csv` | Schema-only target for monthly return data | 0 data rows | Columns are close to future feature/label source needs, but no records exist | Defines month column only | No | No records to split | Low; schema only | Schema is present; actual monthly data file is absent | `requires_adapter` | Use as schema reference for future adapter contracts only. |
| Monthly refetch plan | `data/processed/scenario_monthly_refetch_plan.csv` | Provider-refetch task plan | 6003 data rows | Not a Step192 input; describes missing provider data tasks | Plan dates/status only, not observations | No | No | Low content sensitivity, but provider task semantics are present | Explicitly says provider refetch is required | `prohibited` | Do not use as dry-run input. It is a blocked acquisition plan, not training data. |
| Source policy matrix | `data/processed/scenario_p0_source_policy_matrix.csv` | Provider/license policy review matrix | 17 data rows | Not a Step192 input; policy gates only | No dataset time axis | No | No | Contains provider candidates and raw-payload storage policy fields; no raw values copied here | All rows blocked pending source/license approval | `prohibited` | Keep as evidence that real provider-derived monthly data remains blocked. |
| Build notebooks and provider scripts | `notebooks/*.ipynb`, `scripts/build_*overlay*.py`, `scripts/build_finple_candidates_6000_v1.py` | Historical build recipes and provider-capable scripts | Not applicable | Not input records | Not applicable | No | No | Scripts may reference provider libraries or source files | Operational tools, not static dataset candidates | `prohibited` | Do not execute or use as Step234B input. Read only for provenance if needed. |
| Server env, DB migrations, admin/order/readiness scripts | `server/.env*.example`, `server/db/migrations/*`, trading readiness scripts | Configuration, DB schema, and guardrail logic | Not applicable | Not input records | Not applicable | No | No | Secret-adjacent or order/readiness-adjacent surfaces | Not dataset candidates | `prohibited` | Exclude from dataset pipeline inputs. |

## Step192 Field Mapping Assessment

The two small screener sample CSVs are the best first dry-run seed because they are small, static, repository-local, and do not expose account, order, provider packet, raw response, secret, token, or credential fields. They still need a future adapter before they can become Step192 records.

Suggested future mapping boundary for Step234B:

| Step192 Field | Candidate Source | Adapter Boundary |
|---|---|---|
| `recordId` | Deterministic combination of market, ticker, and row sequence | Generate in adapter; do not persist new dataset in Step234A. |
| `split` | Not present | Define deterministic tiny-sample split policy in Step234B. |
| `label` | Not present | Use a deterministic placeholder label policy only after approval; do not train or infer investment labels. |
| `featureTimestamp` | Source snapshot or fixed review date metadata | Must be defined as adapter metadata, not taken from current price data. |
| `labelTimestamp` | Not present | Must be after `featureTimestamp`; avoid future leakage by construction. |
| `versioning` | Not present at record level | Add fixed schema/dataset version metadata in adapter output. |
| `lineage` | README/summary source notes | Record source path and source class only; do not copy raw source packet paths or digest values. |
| `retentionPolicy` | Step192 policy | Use redacted metadata-only retention policy. |
| `threshold` | Metrics fields can support deterministic threshold policy | Preserve numeric `0` type if used. |
| `stringThreshold` | Not present | Adapter must provide string threshold policy without converting to numeric. |

## Split And Leakage Assessment

- Native train/validation/test splits do not exist in the audited real-format files.
- Native label windows do not exist in the audited real-format files.
- Metric overlay files contain derived metrics and source tag dates, but not raw time series or point-in-time observation rows.
- `scenario_monthly_returns.schema.csv` defines the eventual monthly return shape, but the actual monthly return file is absent.
- Any future adapter must create split and walk-forward metadata deterministically and must keep feature timestamps before label timestamps.
- Random split remains prohibited. Chronological or fixed tiny-sample deterministic split is required.

## Sensitive Information Assessment

No candidate recommended for Step234B contains account identifiers, order payloads, private packet paths, raw provider responses, secrets, tokens, credentials, or raw provider packets in the inspected headers and sample rows.

The source-policy matrix and provider-refetch plan are prohibited as inputs because they are operational policy artifacts with provider task semantics, not because this document copies any sensitive raw values.

## Source And License Assessment

- Small screener samples are repository-local sample fixtures, but still need source/license notes before any expanded use.
- Runtime screener CSVs and overlays reference external market-data sources or derived metrics; use requires manual source and license review.
- Scenario policy artifacts explicitly show source/license approval is not complete for real monthly return data.
- Step234A does not assert redistribution rights, provider permissions, or model-training permission for any candidate.

## Recommended Step234B Input

Recommended Step234B seed:

```text
src/data/tickers/us_screener_candidates.sample.csv
src/data/tickers/kr_screener_candidates.sample.csv
data/processed/scenario_monthly_returns.schema.csv
```

Recommended Step234B record-count target:

```text
10 total source rows before adapter materialization
6 train / 2 validation / 2 test after deterministic adapter split
```

Step234B should remain offline and read-only until a separate step explicitly approves adapter output materialization. It should not call providers, write DB rows, train a model, alter CI blocking behavior, or expose UI.

## Final Classification Summary

| Status | Count | Candidates |
|---|---:|---|
| `eligible_for_sanitized_dry_run` | 2 | US screener sample, KR screener sample |
| `requires_adapter` | 2 | Scenario data coverage, monthly return schema |
| `requires_manual_review` | 6 | US/KR screener runtime CSVs, 6000 balanced candidate CSV, US/KR price overlays, US/KR dividend overlays |
| `prohibited` | 4 | Monthly refetch plan, source policy matrix, build notebooks/provider scripts, server env/DB/admin/order surfaces |

## Readiness

```text
actualLiveTradingReady = false
state = blocked
```

