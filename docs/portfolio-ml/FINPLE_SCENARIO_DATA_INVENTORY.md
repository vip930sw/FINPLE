# FINPLE Scenario Data Inventory

Created: 2026-06-27
Repository: `vip930sw/FINPLE`
Base branch: `main`
Issue: #221, Step 114-1A
Source commit audited: `621293149efa3b9c6831eaf5f607666d87635edc`

## Operating State Checked

- Local checkout: `work/FINPLE`, branch `main`, HEAD `621293149efa3b9c6831eaf5f607666d87635edc`.
- Remote `origin/main`: `621293149efa3b9c6831eaf5f607666d87635edc` at the start of this audit.
- Vercel production `https://finple.co.kr/`: HTTP 200 from Vercel, `x-vercel-cache: HIT`, checked 2026-06-27.
- Render API `https://finple-api.onrender.com/api/health`: healthy, but reported deployed commit `280f36a88d92532a2475e851d809521421cf380b`, behind current `main`.

## Scope

This inventory audits the repository and committed data pipeline outputs for the inputs needed by Raw CAGR, Rolling CAGR, MDD, Rolling MDD, BETA, and future scenario analysis. It does not implement scenario math, chart changes, `calculatePortfolioResult()` changes, CSS, router changes, runtime code, or DB changes.

## Files Inspected

- `src/data/tickers/finple_app_candidates_6000_balanced_v1.csv`
- `data/processed/finple_app_candidates_6000_balanced_v1.csv`
- `src/data/tickers/finple_app_candidates_2000_final_v1.csv`
- `src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv`
- `src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv`
- `data/processed/us_price_metrics_overlay_20260528_excluded_27.csv`
- `data/processed/kr_price_metrics_overlay_20260528_excluded_332.csv`
- `src/data/tickers/us_dividend_overlay_20260527.csv`
- `src/data/tickers/kr_etf_dividend_overlay_20260525.csv`
- `src/data/tickers/kr_stock_dividend_overlay_20260525.csv`
- `scripts/build_us_price_metrics_overlay_chunked.py`
- `scripts/build_kr_price_metrics_overlay_chunked.py`
- `scripts/build_us_dividend_overlay_chunked.py`
- `scripts/combine_us_price_metrics_chunks.py`
- `scripts/combine_kr_price_metrics_chunks.py`
- `notebooks/FINPLE_US_PRICE_METRICS_COLAB_step108_13.ipynb`
- `notebooks/FINPLE_KR_PRICE_METRICS_COLAB_step108_14.ipynb`
- `docs/data-sources/FINPLE_DATA_PIPELINE_PLAYBOOK.md`
- `docs/data-sources/FINPLE_colab_archive_inventory_20260526.md`
- `src/components/portfolio/utils/portfolioCalculations.js`

## Main Finding

No committed asset-level daily or monthly price series, adjusted-close series, total-return series, benchmark total-return series, or FX series exists under `data/` or `src/data/`. The committed pipeline outputs are candidate rows and summary metric overlays. The price metric scripts can refetch daily close data from provider APIs and recalculate summary CAGR, MDD, and BETA, but the raw provider series is not persisted in the repository.

Therefore, this audit classifies zero assets as A. Assets with successful price metric overlay evidence are classified as B, because a provider-backed close-price path exists but requires refetching. Assets without price metric evidence are classified as C.

## A/B/C Coverage

| Grade | Total | US | KR |
| --- | --- | --- | --- |
| A | 0 | 0 | 0 |
| B | 5757 | 2997 | 2760 |
| C | 243 | 3 | 240 |

## Coverage By Asset Type

| Asset type | A | B | C |
| --- | --- | --- | --- |
| ETF | 0 | 2242 | 208 |
| stock | 0 | 3515 | 35 |

## Metrics Status Snapshot

| metricsStatus | Rows |
| --- | --- |
| ready | 4802 |
| review_required | 495 |
| short_history | 703 |

## Data Source Inventory

| Input needed | Repository evidence | Audit result |
| --- | --- | --- |
| Asset daily/monthly price series | yfinance/FDR close-price scripts and summary overlays | Provider refetch required; raw series not committed |
| Adjusted close or total return series | No committed adjusted-close or total-return series columns/files | Not available for scenario A grade |
| Dividend data | TTM dividend yield overlays only | Yield exists for many rows, no dividend time series |
| S&P 500 benchmark | US BETA overlay uses `SPY`; no `SP500_TR` series | ETF proxy only, no total-return index |
| Nasdaq-100 benchmark | QQQ/QQQM rows exist as assets; no `NASDAQ100_TR` series | ETF proxy only |
| US total market benchmark | VTI/ITOT/SCHB rows exist as assets; no total-market index series | ETF proxy only |
| KOSPI 200 benchmark | KOSPI 200 ETFs exist; KR overlay uses `^KS11`/`^KQ11` | Benchmark policy mismatch for KOSPI 200 ETF BETA |
| KOSPI/KOSDAQ BETA benchmark | KR script uses `^KS11` and `^KQ11` with fallback ETFs | Available only through provider refetch, not committed |
| USD/KRW FX series | No FX CSV or committed exchange-rate series found | Missing; required for KRW-mode US assets |
| Proxy metadata | No committed `proxyTicker` field in current overlays | Missing; short-history ETFs need explicit proxy policy |

## Representative Asset Recalculation Table

| Market | Ticker | Grade | dataYears | Benchmark | Raw CAGR | Rolling CAGR | MDD | Rolling MDD | BETA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| US | SPY | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | VOO | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | IVV | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | VTI | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | ITOT | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | SCHB | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | QQQ | B | 9.99 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| US | QQQM | B | 5.62 | SPY | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Refetch needed |
| KR | 069500 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 102110 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 148020 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 105190 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 152100 | B | 9.99 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |
| KR | 278530 | B | 8.51 | ^KS11 | Refetch needed | No strict 120m / proxy needed | Refetch needed | Same as rolling CAGR | Blocked: benchmark policy |

## Next Calculation Input Files

Use these files as the current overlay inputs for Step 114-1B, with the limitation that actual recalculation must refetch source series:

- `data/processed/scenario_data_coverage.csv`
- `src/data/tickers/finple_app_candidates_6000_balanced_v1.csv`
- `src/data/tickers/us_price_metrics_overlay_20260528_app_ready.csv`
- `src/data/tickers/kr_price_metrics_overlay_20260528_app_ready.csv`
- `data/processed/us_price_metrics_overlay_20260528_excluded_27.csv`
- `data/processed/kr_price_metrics_overlay_20260528_excluded_332.csv`

Step 114-1B should not treat `expectedCagr`, `mdd`, or `beta` as time-series inputs. They are summary outputs. The next calculation PR needs a persisted monthly return input schema or a deterministic provider-refetch cache before Rolling CAGR, Rolling MDD, scenario paths, and benchmark comparisons can be reproduced.

## Data Integrity Gate

Run the scenario data audit gate before any Step 114-1B metric utility or scenario calculation work:

```powershell
npm.cmd run check:scenario-data
```

The gate validates the committed coverage CSV shape, 6,000-row universe, A/B/C grade counts, required representative assets, no zero-filled missing series, KR representative ETF benchmark policy findings, and matching inventory/audit documentation. This keeps the current conclusion explicit: no asset is A-grade until a committed monthly total-return series exists.
