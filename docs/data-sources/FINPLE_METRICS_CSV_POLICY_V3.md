# FINPLE Metrics CSV Policy v3

## 1. Purpose

This document defines how FINPLE creates, validates, and publishes long-term metrics CSV files used by `/simulator`, `/screener`, MY PAGE, and report features.

FINPLE is not a real-time quote service. FINPLE is a subscription-based portfolio analytics SaaS that uses base-date metrics and user-entered portfolio assumptions to simulate long-term results.

Core principles:

1. Do not expose raw current prices or quote-like market data in public FINPLE screens.
2. Use monthly long-term metrics CSV files for CAGR, MDD, BETA, and dividend yield.
3. Apply rolling median CAGR policy to both US and KR assets.
4. Keep raw metrics for audit only.
5. Use selected metrics for app display.
6. Separate raw source data, processed metrics, and app export files.
7. Preserve all source files and file hashes so the pipeline is reproducible.

---

## 2. Public display policy

The following items should not be exposed in FINPLE public screens unless a separate commercial market-data display license is confirmed:

```text
current price
real-time price
today's close
previous close comparison
price change
percentage change
bid / ask
volume
intraday chart
quote chart
```

The `/simulator` should move away from current-price and quantity-first input. The preferred UX is weight, investment amount, base-date metrics, and long-term simulation.

Recommended notice:

```text
FINPLE metrics are long-term analytical figures based on base-date historical data and user-entered assumptions.
They are not real-time quotes, executable prices, or buy/sell decision criteria.
```

---

## 3. Data separation principle

FINPLE metrics files must be separated into three layers.

### 3.1 Raw Source

Raw source files are immutable. Do not manually edit them.

Examples:

```text
data/raw/YYYY-MM/source files
```

### 3.2 Processed Metrics

Processed metrics are full calculation outputs. These include raw CAGR, rolling median CAGR, MDD, BETA, dividend yield, data status, review flags, and audit columns.

Examples:

```text
data/processed/monthly/YYYY-MM/finple_metrics_output_YYYY_MM.csv
```

### 3.3 App Export

App export files contain only values approved for FINPLE display.

Examples:

```text
src/data/tickers/finple_metrics_selected_YYYY_MM.csv
```

The app must use selected values only.

```text
expectedCagr  <- selectedCagr
mdd           <- selectedMdd
beta          <- selectedBeta
dividendYield <- dividendYield
```

Raw values such as `priceCagr10yRaw` and `rollingCagr10yMedian` may be retained for audit but must not be used directly in UI calculations.

---

## 4. CAGR policy

### 4.1 Required rule

Rolling median CAGR must be calculated for both US and KR assets.

```text
US ETF / US stock / KR ETF / KR stock all use the same selectedCagr policy.
```

### 4.2 Selected CAGR decision order

The selected CAGR should be decided in the following order:

```text
1. rollingCagr10yMedian
2. rollingCagr5yMedian
3. sinceInceptionCagr
4. blank + review_required
```

### 4.3 Selected CAGR decision table

| Condition | selectedCagr | dataStatus | reviewFlag |
|---|---:|---|---|
| 10Y or longer data | rollingCagr10yMedian | ready | none |
| 5Y to 10Y data | rollingCagr5yMedian | short_history | short_history |
| 3Y to 5Y data | sinceInceptionCagr | limited_history | review_required |
| Less than 3Y data | blank | insufficient_history | review_required |
| Raw CAGR materially above rolling median | rolling median | adjusted_by_rolling_median | adjusted_by_rolling_median |
| Data suspected abnormal | blank | review_required | review_required |

### 4.4 Raw CAGR

Raw CAGR is retained only for audit and anomaly detection.

```text
priceCagr10yRaw = audit/reference only
selectedCagr = app display and simulation value
```

---

## 5. Total return CAGR policy

FINPLE displays dividend yield separately. Therefore total-return CAGR or adjusted-close CAGR should not be used as the primary app CAGR unless the simulator logic is explicitly redesigned to avoid dividend double counting.

```text
Use for app:
- price CAGR
- rolling median price CAGR

Reference only:
- totalReturnCagr
- adjustedCloseCagr
```

---

## 6. MDD policy

MDD means Maximum Drawdown, the largest decline from a previous peak.

MDD should not be softened by median logic when this may understate downside risk. The display value should remain conservative.

Recommended policy:

```text
selectedMdd = worst MDD in the selected period
```

Detailed rule:

```text
10Y data available:
selectedMdd = worst drawdown in 10Y period

Less than 10Y data:
selectedMdd = worst drawdown in available period
dataStatus = short_history or limited_history
```

---

## 7. BETA policy

BETA should be calculated against an appropriate benchmark using monthly returns where possible.

Recommended benchmark policy:

```text
US broad ETF / stock: SPY or benchmarkKey
US growth-heavy ETF: QQQ or benchmarkKey if appropriate
KR broad ETF / stock: KOSPI200 or benchmarkKey
KR KOSDAQ assets: KOSDAQ150 or benchmarkKey
Bond assets: bond benchmarkKey
Gold / commodity / REIT: assigned benchmarkKey
```

Recommended selected value:

```text
selectedBeta = rollingBeta10yMedian
```

Fallback:

```text
selectedBeta = rollingBeta5yMedian
dataStatus = short_history
```

---

## 8. Dividend yield policy

Dividend yield must distinguish blank from zero.

```text
blank = not confirmed yet
0.00  = confirmed no dividend
number = confirmed dividend yield
```

Dividend overlays may be used, but their source, base date, and policy must be recorded.

---

## 9. Review-required policy

Do not automatically publish assets when one or more of the following conditions is met:

```text
selectedCagr is blank
selectedMdd is blank
selectedBeta is blank
dataYears < 3
reviewFlag = review_required
ticker mapping failed
benchmark missing
currency mismatch
sourceHash missing
```

Manual review is recommended for:

```text
selectedCagr > 20%
selectedCagr < -20%
selectedMdd < -70%
selectedBeta > 2.5
dividendYield > 10%
US broad index ETF selectedCagr > 18%
KR broad index ETF selectedCagr > 10%
leveraged / inverse ETF
assets listed less than 5 years ago
```

---

## 10. Update cycle

Default update cycle:

```text
Monthly
Base date: month end
Publish target: within 1-5 business days of the following month
```

Example:

```text
2026-06-30 base date
-> 2026-07-01 to 2026-07-05 generate metrics
-> audit report review
-> PR creation
-> Vercel Preview check
-> Production deployment
```

Weekly refresh is not recommended during the beta stage because long-term metrics do not materially require weekly updates, and frequent refreshes may make FINPLE appear closer to a quote service.

---

## 11. App display wording

Recommended UI copy:

```text
Data base date: YYYY.MM.DD
Long-term metrics are refreshed monthly.
These metrics are not real-time quotes.
```

Recommended metric guide copy:

```text
CAGR is a long-term annualized growth rate adjusted through rolling median policy.
MDD is the maximum drawdown from peak to trough during the selected period.
BETA is the asset's sensitivity to the assigned benchmark.
These figures do not guarantee future returns or loss ranges.
```

---

## 12. Git and PR policy

Do not overwrite existing CSV files directly.

Required workflow:

```text
1. Generate new monthly selected CSV
2. Generate full metrics output CSV
3. Generate review_required CSV
4. Generate audit report
5. Generate manifest JSON
6. Create GitHub PR
7. Check Vercel Preview
8. Merge after review
```

Suggested PR checklist:

```md
## Metrics CSV Checklist

- [ ] raw source files are not overwritten
- [ ] source manifest and SHA256 hashes are included
- [ ] selectedCagr uses rolling median for both US and KR assets
- [ ] current price is not exposed in app export
- [ ] dividendYield blank and 0.00 are distinguished
- [ ] Korean tickers keep six digits
- [ ] SPY / QQQ / SCHD / 005930 / 000660 / 069500 checked
- [ ] review_required assets are excluded from app export
- [ ] Vercel Preview checked
```
