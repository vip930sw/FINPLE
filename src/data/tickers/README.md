# FINPLE ticker runtime CSV

This folder contains CSV files imported by the Vite frontend at build time.

## Current runtime file

```text
finple_app_candidates_2000_final_v1.csv
```

The current loader imports this file from `screenerCandidateLoader.js`.

## Next runtime file

```text
finple_app_candidates_6000_balanced_v1.csv
```

Use this file only after it has been uploaded and validated.

## Loader switch checklist

1. Confirm `src/data/tickers/finple_app_candidates_6000_balanced_v1.csv` exists.
2. Confirm the file has the same core columns as the current 2,000-candidate CSV.
3. Confirm row count is 6,000.
4. Update `screenerCandidateLoader.js` import.
5. Update `dataSource` / policy note strings from `2000_final_v1` to `6000_balanced_v1` where appropriate.
6. Run frontend build or Vercel Preview.
7. Check screener pagination and filters.

## Required core columns

```text
market,ticker,providerSymbol,nameKr,assetType,sourceUniverse,tier,strategy,riskLevel,goals,beginnerFit,tags,dataStatus,expectedCagr,beta,mdd,dividendYield,displayDividendYield,dividendPolicy,dividendSource,metricsSource,reviewTag,reviewReason,notes,marketCap,aum,sizeSource
```
