# Step 108-12 US Dividend Overlay Plan

## Purpose

Create a repeatable process for filling US ETF and US stock dividend yields in FINPLE.

This step follows the Korean dividend overlay work:

```text
KR ETF dividend overlay: 922 rows
KR stock dividend overlay: 1,246 rows
Integrated KR dividend coverage: 2,168 rows
```

The next target is US dividend enrichment.

## Recommended terminology

Use the term:

```text
지표 보강 / Metrics Enrichment
```

This means filling and verifying candidate-level metrics such as:

```text
CAGR
MDD
BETA
dividendYield
dataStatus
reviewReason
```

## Data policy

FINPLE must distinguish three dividend states:

```text
blank = not checked yet
0.00 = confirmed no dividend or no recent distribution
greater than 0 = dividend/distribution yield confirmed
```

Never convert blank values to 0.00 unless the no-dividend status is confirmed.

## US dividend source priority

### 1. Existing validated values

If a ticker already has a validated dividendYield in the final 2,000 overlay, preserve it unless a newer audit source is clearly better.

### 2. Batch collection

Use a batch script, not frontend real-time calls.

Recommended source:

```text
yfinance dividends / actions data
```

Method:

```text
1. Download dividend history for each US ticker.
2. Sum the latest trailing 12-month dividend/distribution amount.
3. Divide by latest close price.
4. Export compact overlay CSV.
```

### 3. No-dividend policy

For known non-dividend growth stocks, 0.00 can be used only when confirmed.

Examples likely to be confirmed no-dividend:

```text
AMZN
TSLA
SNOW
PLTR
META may require current verification because dividend policy can change
```

Do not rely on stale assumptions for companies whose dividend policy may have changed.

## Output file

Runtime overlay target:

```text
src/data/tickers/us_dividend_overlay_202605xx.csv
```

Recommended compact format:

```csv
market,ticker,dividendYield,dividendPolicy,dividendSource,yieldStatus,reviewReason
US,SPY,1.22,dividend_confirmed,yfinance_ttm_dividend_202605xx,ready,
US,AMZN,0.00,no_dividend_confirmed,no_dividend_policy_202605xx,ready,
US,XYZ,,dividend_review_required,yfinance_error_202605xx,review_required,missing dividend or price data
```

For runtime performance, only these fields are needed:

```text
market
ticker
dividendYield
```

For audit and maintainability, keep the full columns above.

## Recommended generated files

```text
data/processed/us_dividend_overlay_202605xx.csv
src/data/tickers/us_dividend_overlay_202605xx.csv
data/processed/us_dividend_overlay_202605xx_audit.csv
data/processed/us_dividend_overlay_202605xx_summary.json
```

## Loader order after this step

```text
1. base 6,000 candidate CSV
2. final 2,000 metrics overlay
3. KR ETF dividend overlay
4. KR stock dividend overlay
5. US dividend overlay
```

US dividend overlay should update only:

```text
dividendYield
displayDividendYield
dividendPolicy
dividendSource
dataSource
```

It must preserve:

```text
expectedCagr
beta
mdd
strategy
riskLevel
goals
tags
notes
```

## Audit targets

Sample tickers to check:

```text
SPY
VOO
QQQ
SCHD
JEPI
JEPQ
TLT
BND
VNQ
AAPL
MSFT
KO
JNJ
JPM
XOM
AMZN
TSLA
SNOW
```

## Review rules

```text
1. If dividend history exists and latest close exists, calculate TTM yield.
2. If dividend history is empty but ticker is known no-dividend, set 0.00 with no_dividend_confirmed.
3. If dividend history is empty and no-dividend status is not confirmed, leave blank and mark review_required.
4. If calculated yield is unusually high, mark review_required.
5. Covered-call, bond, REIT, and income ETFs should be manually reviewed if yield is central to product identity.
```

## High-yield review threshold

Use a conservative flag:

```text
dividendYield >= 15% -> review_required_high_yield
```

This does not mean the value is wrong. It means the yield may be affected by special distributions, option-income products, or stale price data.

## Next implementation steps

```text
1. Add reusable script: scripts/build_us_dividend_overlay.py
2. Run the script in Colab or local Python with internet access.
3. Upload generated overlay CSV to src/data/tickers/.
4. Connect overlay in screenerCandidateOverlay.js.
5. Check Vercel Preview and sample tickers.
```
