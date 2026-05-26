# FINPLE raw sources - 2026-05-24

This folder is reserved for the raw source files used in FINPLE Step 108-3 candidate expansion.

## Expected raw files

| File | Original upload | Purpose |
|---|---|---|
| `us_nasdaq_stock_screener_20260524.csv` | `nasdaq_screener_1779598386546.csv` | US stock candidate expansion |
| `us_nasdaq_etf_screener_20260524.csv` | `nasdaq_etf_screener_1779598693262.csv` | US ETF and special asset bucket expansion |
| `kr_etf_market_snapshot_20260524.xlsx` | `data_0338_20260524.xlsx` | KR ETF source snapshot |
| `kr_stock_market_snapshot_20260524.xlsx` | `data_0432_20260524.xlsx` | KR stock source snapshot |

## Note

The ChatGPT GitHub connector can safely create and update text files, but large binary XLSX uploads should be uploaded through GitHub's web UI or git CLI to preserve the files exactly.

Upload path:

```text
data/raw/2026-05-24/
```
