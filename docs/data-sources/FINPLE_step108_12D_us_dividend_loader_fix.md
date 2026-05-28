# Step 108-12D US Dividend Loader Fix

## Issue

The validated US dividend CSV files were uploaded to `main`, but the runtime loader connection did not remain applied to `main` after PR #87 was refreshed and closed.

As a result, production could read the uploaded CSV files in the repository, but the frontend still did not import:

```text
src/data/tickers/us_dividend_overlay_20260527.csv
```

Therefore US stock cards such as `AAT` still showed `배당 확인 중` even though the runtime CSV contained a confirmed yield.

## Fix

Apply the US dividend overlay directly in `screenerCandidateOverlay.js`.

Runtime policy:

```text
Apply only if:
- yieldStatus == ready
- dividendPolicy != dividend_review_required
- dividendYield is numeric

Do not apply if:
- yieldStatus == review_required
- dividendPolicy == dividend_review_required
- dividendYield is blank
```

## Example

```text
AAT dividendYield = 6.04
AAPL dividendYield = 0.34
JEPI dividendYield = 8.40
AMZN dividendYield = 0.00 with no_dividend_confirmed
```

## Acceptance check

After Vercel production redeploys, confirm that AAT no longer shows `배당 확인 중` and instead displays `배당 6.04%`.
