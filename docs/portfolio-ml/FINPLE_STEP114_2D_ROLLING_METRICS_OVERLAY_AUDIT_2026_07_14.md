# FINPLE Step 114-2D Rolling Metrics Overlay Audit

Date: 2026-07-14

Scope: fixture/offline rolling metrics and review-only overlay generation.

## Summary

Step 114-2D adds deterministic rolling price-CAGR metrics to the offline monthly metrics pipeline and emits a new review-only overlay package. Rolling metrics consume Step 114-2B normalized month-end rows, not `monthly_prices.csv`. The generated overlay is not connected to the production loader and does not approve app export.

Readiness flags:

```text
fixturePackageReady=true
productionPublishReady=false
appExportApproved=false
```

## Calculation Contract

- 10Y rolling price CAGR uses an exact 120-month interval and requires 121 continuous month-end observations.
- 5Y rolling price CAGR uses an exact 60-month interval and requires 61 continuous month-end observations.
- Missing intermediate months invalidate the affected rolling window; no forward fill is allowed.
- CAGR formula:

```text
(end_price / start_price) ** (12 / interval_months) - 1
```

- `monthly rate = CAGR / 12` is not used.
- Percentiles are deterministic linear interpolation over sorted rolling CAGR values using `(n - 1) * p`.
- `selectedCagr` policy is fail-closed:

```text
rolling_10y_median -> rolling_5y_median -> since_inception -> blank_review_required
```

## Basis Separation

- Price CAGR is allowed only for explicit close-price bases: `raw_close`, `split_adjusted`, or `split_adjusted_close`.
- Total-return-adjusted series are blocked for price-CAGR selection and remain reference-only.
- Dividend yield, price return, total return reference, MDD, and beta remain separate output fields.
- Historical MDD is stored as `mddFullPeriod` and `selectedMdd`.
- `monthly_prices.csv` remains a reference fixture only and is not part of rolling overlay source lineage.

## Overlay Core Schema

The review overlay keeps the existing loader-compatible core columns first:

```text
market,ticker,expectedCagr,priceCagr10y,mdd,beta,dataYears,benchmarkTicker,metricsStatus,metricsSource,reviewReason
```

Rolling and provenance fields are appended after those core fields. `metricsStatus` is always `review_only`.

## Generated Review-Only Package

Path:

```text
data/processed/step114-2d-review-overlay-2026-07-14/
```

Review overlays:

| File | SHA256 |
| --- | --- |
| `finple_review_overlay_us_2026_07_14.csv` | `687ecc7d4a67e03dd8ab74606f0d4a874b6d70b20ab4d458d447e0ff7e071311` |
| `finple_review_overlay_kr_2026_07_14.csv` | `9a5b2a1b14912428faf825671ea3cfa61bc9acf2ea7620be1bdc29cc80370b98` |
| `finple_metrics_manifest_2026_07_14.json` | `1020218eace53a1fc4a128f5eec3389fa473a9de79b47979bcda15c155bff99d` |
| `finple_monthly_metrics_2026_07_14_package.zip` | `5302afc0e46432d53b9eee0e96d4410e0d1360a530a6e2a55c2c7b79637a5a5e` |

KR ticker formatting is preserved, including `005930` and `069500`.

## Source Lineage

The manifest links:

- raw source SHA
- `timeseries-normalization-v1-step114-2b`
- normalized month-end CSV SHA
- per-series normalized hashes
- `rolling-price-cagr-v1-step114-2d`
- review overlay hashes

Repository-relative paths are serialized with `/` separators for Windows/Linux determinism.

## Protected Production Files

The pipeline manifest verifies these files are unchanged before and after generation:

| Protected file | SHA256 |
| --- | --- |
| `src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv` | `9df1ffa8f19b68f41b63699e3e8bd1d82c7720c1acc9786b48b28040ed56ceec` |
| `src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv` | `4e683d29181f9deb49dbea74faea1c6af573a67e2beb0909c1ce11e66ca19002` |
| `src/data/tickers/screenerCandidateOverlay.js` | `2eabd9a65e76f600b7595e34c9d3443b3dc8ae6428ae8730acd68f5dc0ed5870` |

No operating overlay pointer was changed.

## Not Included

- No external provider/API calls.
- No data.go.kr, KRX, or KIS calls.
- No API keys or secrets.
- No production publish or app export approval.
- No simulator calculation, UI, STEP navigation, AI, auth, payment, subscription, DB, trading readiness, order, or kill-switch changes.
- No `data/processed/scenario_monthly_returns.csv` creation or modification.
