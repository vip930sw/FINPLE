# Step 4/5 Eligibility and Coverage Inventory

- Report as of: `2026-07-26` (derived from the pinned release timestamp)
- Input release timestamp: `2026-07-26T02:03:18Z` (source binding timestamp, not report generation time)
- Runtime catalog: `src/data/tickers/finple_app_candidates_v2.csv` — 6,029 identities, excluding `CASH:CASH`
- Monthly binding: `public/app-data/finple-universe-v2-2026-07-24/production-app-export-release.json`, `public/app-data/finple-universe-v2-2026-07-24/monthly-returns-index.json`, 64 shards
- Monthly contract: `legacy_v1`

An `expected_blocked` checker result is not numeric Step 4/5 availability.

## Reconciliation and numeric coverage

| Dimension | Count | Percent |
| --- | ---: | ---: |
| Runtime identities | 6029 | 100% |
| KR | 3000 | 49.7595% |
| US | 3029 | 50.2405% |
| Step 3 ready | 4712 | 78.1556% |
| Step 4 numeric ready | 1338 | 22.1927% |
| Step 5 numeric ready | 1338 | 22.1927% |
| Step 4 ready / Step 5 Beta blocked | 0 | 0% |
| Blank Beta values | 540 | 8.9567% |
| Invalid Beta values | 540 | 8.9567% |

## Primary states

| State | Overall | Percent | KR | US |
| --- | ---: | ---: | ---: | ---: |
| ready | 1338 | 22.1927% | 280 | 1058 |
| missing_monthly_identity | 682 | 11.312% | 654 | 28 |
| short_history_lt_60 | 0 | 0% | 0 | 0 |
| proxy_marked | 0 | 0% | 0 | 0 |
| legacy_unproven | 0 | 0% | 0 | 0 |
| review_required | 4009 | 66.4953% | 2066 | 1943 |
| identity_mismatch | 0 | 0% | 0 | 0 |
| missing_or_invalid_beta | 0 | 0% | 0 | 0 |
| missing_or_invalid_metrics | 0 | 0% | 0 | 0 |
| other_policy_block | 0 | 0% | 0 | 0 |

Primary precedence: identity mismatch → missing monthly identity → proxy marked → current catalog review gate → denied legacy lineage → short history → invalid Step 3 metrics → invalid Beta → final policy fallback → ready. When review and legacy evidence coexist, the current catalog review gate is primary and legacy evidence stays in `secondaryFlags`.

## Official portfolio coverage

`CASH:CASH` is excluded from the 6,029-identity inventory and appears below only as `native_manual_reference`, ready for portfolio calculations but distinct from catalog ready.

| Portfolio | Step 3 | Step 4 | Step 5 moderate/severe | Common contiguous history | Step 4 blocked weight | Step 5 blocked weight | Blocked identities |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| DEFAULT_ASSETS | ready | ready | ready | 176 months | 0% | 0% | none |
| DIVIDEND_ASSETS | ready | ready | ready | 176 months | 0% | 0% | none |
| STABLE_ASSETS | ready | ready | ready | 176 months | 0% | 0% | none |
| GROWTH_ASSETS | ready | ready | ready | 176 months | 0% | 0% | none |
| GOLD_DEFENSE_ASSETS | ready | ready | ready | 176 months | 0% | 0% | none |
| REIT_INCOME_ASSETS | ready | expected_blocked | expected_blocked | 176 months | 35% | 35% | US:VNQ |
| GROWTH_ZERO_ASSETS | ready | ready | ready | 176 months | 0% | 0% | none |
| GROWTH_FOCUS_ASSETS | ready | ready | ready | 239 months | 0% | 0% | none |
| ALL_WEATHER_ASSETS | ready | ready | ready | 176 months | 0% | 0% | none |
| HIGH_CONVICTION_ASSETS | ready | expected_blocked | expected_blocked | 101 months | 15% | 15% | US:BLOK |

## US Investment MBTI coverage (16)

| Portfolio | Step 3 | Step 4 | Step 5 moderate/severe | Common contiguous history | Step 4 blocked weight | Step 5 blocked weight | Blocked identities |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| 안정-장기-자동-분산 (차분한 수호자형) | ready | expected_blocked | expected_blocked | 176 months | 6% | 6% | US:VNQ |
| 안정-장기-자동-확신 (신중한 코어빌더형) | ready | ready | ready | 176 months | 0% | 0% | none |
| 안정-장기-주도-분산 (용의주도한 설계자형) | ready | expected_blocked | expected_blocked | 176 months | 7% | 7% | US:VNQ |
| 안정-장기-주도-확신 (철저한 전략가형) | ready | ready | ready | 176 months | 0% | 0% | none |
| 안정-기회-자동-분산 (침착한 관찰자형) | ready | expected_blocked | expected_blocked | 176 months | 5% | 5% | US:VNQ |
| 안정-기회-자동-확신 (현명한 선별가형) | ready | ready | ready | 176 months | 0% | 0% | none |
| 안정-기회-주도-분산 (민첩한 리스크매니저형) | ready | expected_blocked | expected_blocked | 176 months | 8% | 8% | US:VNQ |
| 안정-기회-주도-확신 (대담한 수비수형) | ready | expected_blocked | expected_blocked | 101 months | 5% | 5% | US:BLOK |
| 성장-장기-자동-분산 (꾸준한 개척자형) | ready | expected_blocked | expected_blocked | 176 months | 7% | 7% | US:VNQ |
| 성장-장기-자동-확신 (믿음직한 항해자형) | ready | ready | ready | 176 months | 0% | 0% | none |
| 성장-장기-주도-분산 (균형 잡힌 건축가형) | ready | expected_blocked | expected_blocked | 176 months | 7% | 7% | US:VNQ |
| 성장-장기-주도-확신 (장기 성장 전략가형) | ready | expected_blocked | expected_blocked | 101 months | 5% | 5% | US:BLOK |
| 성장-기회-자동-분산 (열린 탐험가형) | ready | expected_blocked | expected_blocked | 101 months | 10% | 10% | US:BLOK, US:VNQ |
| 성장-기회-자동-확신 (예리한 선구자형) | ready | expected_blocked | expected_blocked | 101 months | 10% | 10% | US:BLOK |
| 성장-기회-주도-분산 (능동적인 지휘관형) | ready | expected_blocked | expected_blocked | 101 months | 13% | 13% | US:BLOK, US:VNQ |
| 성장-기회-주도-확신 (용감한 승부사형) | ready | expected_blocked | expected_blocked | 101 months | 15% | 15% | US:BLOK |

## KR Investment MBTI coverage (16)

| Portfolio | Step 3 | Step 4 | Step 5 moderate/severe | Common contiguous history | Step 4 blocked weight | Step 5 blocked weight | Blocked identities |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| 안정-장기-자동-분산 (차분한 수호자형) | ready | expected_blocked | expected_blocked | 83 months | 40% | 40% | KR:069500, KR:273130, KR:329200 |
| 안정-장기-자동-확신 (신중한 코어빌더형) | ready | expected_blocked | expected_blocked | 166 months | 8% | 8% | KR:069500 |
| 안정-장기-주도-분산 (용의주도한 설계자형) | ready | expected_blocked | expected_blocked | 83 months | 42% | 42% | KR:069500, KR:273130, KR:329200 |
| 안정-장기-주도-확신 (철저한 전략가형) | ready | expected_blocked | expected_blocked | 166 months | 12% | 12% | KR:069500 |
| 안정-기회-자동-분산 (침착한 관찰자형) | ready | expected_blocked | expected_blocked | 83 months | 33% | 33% | KR:069500, KR:273130, KR:329200 |
| 안정-기회-자동-확신 (현명한 선별가형) | ready | expected_blocked | expected_blocked | 166 months | 5% | 5% | KR:069500 |
| 안정-기회-주도-분산 (민첩한 리스크매니저형) | ready | expected_blocked | expected_blocked | 83 months | 37% | 37% | KR:069500, KR:273130, KR:329200 |
| 안정-기회-주도-확신 (대담한 수비수형) | ready | expected_blocked | expected_blocked | 93 months | 17% | 17% | KR:069500, KR:305720 |
| 성장-장기-자동-분산 (꾸준한 개척자형) | ready | expected_blocked | expected_blocked | 83 months | 52% | 52% | KR:069500, KR:273130, KR:329200 |
| 성장-장기-자동-확신 (믿음직한 항해자형) | ready | expected_blocked | expected_blocked | 108 months | 58% | 58% | KR:069500, KR:273130 |
| 성장-장기-주도-분산 (균형 잡힌 건축가형) | ready | expected_blocked | expected_blocked | 83 months | 60% | 60% | KR:069500, KR:273130, KR:329200 |
| 성장-장기-주도-확신 (장기 성장 전략가형) | ready | expected_blocked | expected_blocked | 93 months | 65% | 65% | KR:069500, KR:305720 |
| 성장-기회-자동-분산 (열린 탐험가형) | ready | expected_blocked | expected_blocked | 83 months | 51% | 51% | KR:069500, KR:273130, KR:305720, KR:329200 |
| 성장-기회-자동-확신 (예리한 선구자형) | ready | expected_blocked | expected_blocked | 93 months | 55% | 55% | KR:069500, KR:305720 |
| 성장-기회-주도-분산 (능동적인 지휘관형) | ready | expected_blocked | expected_blocked | 83 months | 62% | 62% | KR:069500, KR:273130, KR:305720, KR:329200 |
| 성장-기회-주도-확신 (용감한 승부사형) | ready | expected_blocked | expected_blocked | 93 months | 85% | 85% | KR:069500, KR:305720 |

Portfolio readiness additionally requires at least 60 common contiguous months across its non-cash assets. Common-history blocked portfolios: official 0, US MBTI 0, KR MBTI 0.

## High-use and saved-portfolio dimensions

- Popularity/high-use coverage: `unavailable_no_canonical_source`. No cohort membership or weights were inferred.
- Saved-portfolio coverage: `not_available_no_privacy_safe_aggregate`. No user DB or holdings were queried.

## Product-impact recovery priorities

Ordered deterministically by direct single-fix feasibility, official preset count, total MBTI count, summed blocked target weight, then identity. No arbitrary combined score is used. Popularity and saved-portfolio dimensions are excluded because their approved aggregate sources are unavailable.

1. `US:VNQ` — review_required; official 1, US MBTI 8, KR MBTI 0, summed blocked weight 90%; direct single-fix recovery: true.
2. `US:BLOK` — review_required; official 1, US MBTI 6, KR MBTI 0, summed blocked weight 58%; direct single-fix recovery: true.
3. `KR:069500` — review_required; official 0, US MBTI 0, KR MBTI 16, summed blocked weight 470%; direct single-fix recovery: true.
4. `KR:273130` — review_required; official 0, US MBTI 0, KR MBTI 9, summed blocked weight 114%; direct single-fix recovery: true.
5. `KR:329200` — review_required; official 0, US MBTI 0, KR MBTI 8, summed blocked weight 55%; direct single-fix recovery: true.
6. `KR:305720` — review_required; official 0, US MBTI 0, KR MBTI 6, summed blocked weight 43%; direct single-fix recovery: true.

## Catalog-only recovery candidates

4685 blocked identities have no official/MBTI portfolio usage. They are kept separate from product-impact priorities and ordered by direct single-fix feasibility, contiguous history, then identity. First 20:

1. `KR:000020` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
2. `KR:000050` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
3. `KR:000070` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
4. `KR:000120` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
5. `KR:000140` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
6. `KR:000150` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
7. `KR:000155` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
8. `KR:000157` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
9. `KR:000180` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
10. `KR:000210` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
11. `KR:000220` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
12. `KR:000230` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
13. `KR:000300` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
14. `KR:000320` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
15. `KR:000370` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
16. `KR:000390` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
17. `KR:000400` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
18. `KR:000430` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
19. `KR:000480` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.
20. `KR:000500` — review_required; 239 contiguous months; `review_completion`; direct single-fix recovery: true.

## Required individual audits

- `KR:069500`: **review_required**; Beta valid: true; 207 rows / 206 contiguous months; Step 4 expected_blocked, Step 5 expected_blocked; secondary flags: legacy_unproven; remediation: `review_completion`; direct single-fix recovery: true.
- `US:VNQ`: **review_required**; Beta valid: true; 239 rows / 239 contiguous months; Step 4 expected_blocked, Step 5 expected_blocked; secondary flags: legacy_unproven; remediation: `review_completion`; direct single-fix recovery: true.
- `US:BLOK`: **review_required**; Beta valid: true; 101 rows / 101 contiguous months; Step 4 expected_blocked, Step 5 expected_blocked; secondary flags: legacy_unproven; remediation: `review_completion`; direct single-fix recovery: true.

## Personal-plan implications

Step 1–3 availability does not imply numeric Step 4/5 availability. Product copy should continue to describe advanced analysis as available only for assets whose monthly identity, direct-lineage policy, contiguous history, required metrics, and Beta pass the current gates.

## Limitations and privacy

This is a deterministic, read-only inventory of checked-in runtime definitions and the pinned monthly release. It does not call providers, query databases or individual holdings, infer popularity, change runtime eligibility, or modify canonical/public data and pinned artifacts. Recovery ordering prioritizes review; it does not authorize data repair or Production changes.
