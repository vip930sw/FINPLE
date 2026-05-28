# Step 108-14A KR Price Metrics Plan

## Purpose

Prepare Korean price metrics enrichment after the US price metrics overlay has been connected.

Target runtime fields:

```text
expectedCagr
priceCagr10y
mdd
beta
dataYears
benchmarkTicker
metricsStatus
metricsSource
reviewReason
```

## Scope

```text
market == KR
expected scale: about 3,000 rows
```

## Core policy

```text
expectedCagr = close-price CAGR
dividendYield = handled separately
totalReturnCagr = reference only
```

The KR price metrics overlay must not update dividend fields.

## KR-specific rules

KR assets need ticker suffix mapping.

```text
providerSymbol with .KS or .KQ -> use as-is
plain 6-digit ticker -> try .KS first, then .KQ
choose the symbol with usable close-price history
```

Beta benchmark policy for first pass:

```text
.KS -> ^KS11, fallback 069500.KS
.KQ -> ^KQ11, fallback 229200.KS
```

## Status rules

```text
dataYears >= 3.0 -> ready
1.0 <= dataYears < 3.0 -> short_history
dataYears < 1.0 -> review_required
abnormal CAGR or invalid MDD -> review_required
missing beta despite enough history -> review_required
```

## Workflow

```text
1. Run 20-row test.
2. Inspect suffix mapping and benchmark selection.
3. Run 100-row chunks.
4. Combine chunks.
5. Create app-ready KR overlay after missing-metric audit.
6. Connect loader only after validation.
```

## Files

Scripts:

```text
scripts/build_kr_price_metrics_overlay_chunked.py
scripts/combine_kr_price_metrics_chunks.py
```

Notebook:

```text
notebooks/FINPLE_KR_PRICE_METRICS_COLAB_step108_14.ipynb
```
