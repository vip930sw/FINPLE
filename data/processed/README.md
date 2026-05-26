# FINPLE processed data

This folder stores generated CSV/JSON outputs used by FINPLE data expansion workflows.

## Step 108-3 expected outputs

| File | Purpose |
|---|---|
| `finple_app_candidates_6000_balanced_v1.csv` | Processed master candidate CSV: US 3,000 + KR 3,000 |
| `finple_step108_3_6000_category_counts.csv` | Category count audit table |
| `finple_step108_3_6000_summary.json` | Build summary and source record |
| `finple_step108_3_us_added_411_from_nasdaq_sources.csv` | US additions used to reach the 3,000 US target |

## Runtime copy

After the processed CSV is validated, copy the same CSV to:

```text
src/data/tickers/finple_app_candidates_6000_balanced_v1.csv
```

Then update the runtime loader import in:

```text
src/data/tickers/screenerCandidateLoader.js
```

from:

```js
import finpleAppCandidates2000Csv from "./finple_app_candidates_2000_final_v1.csv?raw";
```

to:

```js
import finpleAppCandidates6000Csv from "./finple_app_candidates_6000_balanced_v1.csv?raw";
```

and load candidates from `finpleAppCandidates6000Csv`.

## Safety rule

Do not switch the runtime loader until the 6,000-row CSV exists in `src/data/tickers/` and the Vercel preview build succeeds.
