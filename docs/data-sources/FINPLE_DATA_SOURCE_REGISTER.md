# FINPLE Data Source Register

## Source snapshot: 2026-05-24

FINPLE 스크리너 CSV 확장 작업에서 사용하는 원천자료와 산출물의 보관 기준입니다.

## Raw source files

| Repository path | Original upload | Purpose | Notes |
|---|---|---|---|
| `data/raw/2026-05-24/us_nasdaq_stock_screener_20260524.csv` | `nasdaq_screener_1779598386546.csv` | 미국 개별주 후보군 확장 | 미국 후보 3,000개 구성에 사용 |
| `data/raw/2026-05-24/us_nasdaq_etf_screener_20260524.csv` | `nasdaq_etf_screener_1779598693262.csv` | 미국 ETF 후보군 확장 | 가상화폐/블록체인, 레버리지/인버스, 채권, 원자재, 리츠, 배당/인컴 보강 |
| `data/raw/2026-05-24/kr_etf_market_snapshot_20260524.xlsx` | `data_0338_20260524.xlsx` | 한국 ETF 원천자료 | KRX ETF 원천 스냅샷 |
| `data/raw/2026-05-24/kr_stock_market_snapshot_20260524.xlsx` | `data_0432_20260524.xlsx` | 한국 개별주 원천자료 | KRX 개별주 원천 스냅샷 |
| `data/raw/2026-05-24/finple_portfolio_symbol_source_v25_12.csv` | `Finple__Portfolio Simulator v25.12 - 🔠 포트폴리오 종목 리스트.csv` | 우선 반영 후보 확인 | 기존 포트폴리오/스크리너에서 쓰던 미국 대표 주식·ETF 후보 확인 |

## Processed outputs

| Repository path | Purpose |
|---|---|
| `data/processed/finple_app_candidates_6000_balanced_v1.csv` | 미국 3,000개 + 한국 3,000개 균형 확장 후보 CSV |
| `src/data/tickers/finple_app_candidates_6000_balanced_v1.csv` | 앱 런타임에서 import할 운영 CSV 후보 |
| `data/processed/finple_step108_3_6000_category_counts.csv` | 자산군별 카운트 검증표 |
| `data/processed/finple_step108_3_6000_summary.json` | 생성 요약 및 원천자료 기록 |
| `data/processed/finple_step108_3_us_added_411_from_nasdaq_sources.csv` | 미국 3,000개 목표 달성을 위해 추가한 411개 후보 |

## Operating policy

1. 원천자료는 `data/raw/YYYY-MM-DD/`에 보관합니다.
2. 가공 산출물은 `data/processed/`에 보관합니다.
3. 실제 앱이 읽는 CSV는 `src/data/tickers/`에만 둡니다.
4. Colab 또는 Python 재생성 스크립트는 `notebooks/` 또는 `scripts/`에 보관합니다.
5. 신규 후보 중 CAGR/BETA/MDD/배당률이 아직 계산되지 않은 행은 반드시 `review_required`로 표시합니다.
6. 한국 시장에는 현물 가상화폐 ETF가 사실상 없으므로, `가상화폐/블록체인` 필터는 미국 ETF 및 일부 블록체인 테마 후보 중심으로 운용합니다.

## Current Step 108-3 build

- Target: 6,000 candidates
- US: 3,000
- KR: 3,000
- New US additions from Nasdaq raw sources: 411
- Metrics state for new additions: `review_required`

## Step 108-4 upload sequence

Use this order for large CSV/XLSX files.

```text
1. Keep folder placeholders and upload guides in GitHub first.
2. Upload raw CSV/XLSX files to data/raw/2026-05-24/.
3. Upload processed CSV/JSON audit outputs to data/processed/.
4. Upload runtime CSV to src/data/tickers/.
5. Switch screenerCandidateLoader.js from 2,000 CSV to 6,000 CSV only after the runtime CSV exists.
6. Confirm Vercel Preview build and screener pagination before production merge.
```

At this stage, the repository structure and guides can be committed safely. The runtime loader should not be switched until `src/data/tickers/finple_app_candidates_6000_balanced_v1.csv` is present.
